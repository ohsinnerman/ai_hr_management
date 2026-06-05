import { Worker } from 'bullmq';
import { redis } from '../config/redis.js';
import { PAYROLL_QUEUE } from '../queues/payroll.queue.js';
import Company from '../models/Company.model.js';
import Employee from '../models/Employee.model.js';
import SalaryStructure from '../models/SalaryStructure.model.js';
import AttendanceRecord from '../models/AttendanceRecord.model.js';
import PayrollRun from '../models/PayrollRun.model.js';
import Payslip from '../models/Payslip.model.js';
import { computePayroll, round2 } from '../modules/payroll/payroll.calc.js';
import { countWorkingDays } from '../utils/dates.js';
import { generatePayslipPdf } from '../utils/pdfGenerator.js';
import { uploadToS3 } from '../utils/s3Upload.js';

const PAID_STATUSES = ['present', 'on_leave', 'holiday'];

/**
 * Process one payroll run: compute every active employee's payslip, render +
 * upload a PDF, then roll the totals up onto the PayrollRun.
 */
export const processPayrollJob = async (job) => {
  const { payrollRunId, triggeredBy } = job.data;

  const run = await PayrollRun.findById(payrollRunId);
  if (!run) throw new Error(`PayrollRun ${payrollRunId} not found`);

  try {
    await PayrollRun.updateOne({ _id: run._id }, { status: 'processing', runDate: new Date() });

    const periodStart = new Date(run.periodStart);
    const periodEnd = new Date(run.periodEnd);
    const totalWorkingDays = countWorkingDays(periodStart, periodEnd); // weekdays (no holiday model)
    const periodLabel = periodStart.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

    const company = await Company.findById(run.companyId).lean();
    const employees = await Employee.find({
      companyId: run.companyId,
      employmentStatus: 'active',
      deletedAt: null,
    });

    const totals = { gross: 0, deductions: 0, net: 0, pf: 0, esi: 0, tds: 0 };
    let processed = 0;

    for (const emp of employees) {
      // 3.1 — active salary structure effective on/before period end
      const ss = await SalaryStructure.findOne({
        employeeId: emp._id,
        effectiveFrom: { $lte: periodEnd },
        isActive: true,
      })
        .sort({ effectiveFrom: -1 })
        .lean();
      if (!ss) continue; // skip employees without a salary structure

      // 3.2 — attendance for the period
      const attendance = await AttendanceRecord.find({
        employeeId: emp._id,
        date: { $gte: periodStart, $lte: periodEnd },
      }).lean();

      // 3.3–3.5 — paid / unpaid days
      const paidDays = attendance.filter((a) => PAID_STATUSES.includes(a.status)).length;
      const unpaidDays = Math.max(0, totalWorkingDays - paidDays);
      const overtimeHours = round2(attendance.reduce((s, a) => s + (a.overtimeHours || 0), 0));

      // 3.6–3.8 — earnings, deductions, totals
      const c = computePayroll(ss, paidDays, totalWorkingDays);

      const earnings = {
        basic: round2(c.monthlyBasic),
        hra: round2(c.monthlyHra),
        da: round2(c.monthlyDa),
        allowances: round2(c.monthlyAllow),
      };
      const deductionMap = {
        pf: round2(c.pfEmployee),
        esi: round2(c.esiEmployee),
        pt: round2(c.pt),
        tds: round2(c.tds),
      };

      // 3.9 — create payslip
      const payslip = await Payslip.create({
        payrollRunId: run._id,
        employeeId: emp._id,
        grossSalary: round2(c.monthlyGross),
        basic: round2(c.monthlyBasic),
        hra: round2(c.monthlyHra),
        da: round2(c.monthlyDa),
        earnings,
        deductions: deductionMap,
        pfEmployee: round2(c.pfEmployee),
        esiEmployee: round2(c.esiEmployee),
        pt: round2(c.pt),
        tds: round2(c.tds),
        totalDeductions: round2(c.totalDeductions),
        netSalary: round2(c.netSalary),
        totalWorkingDays,
        paidDays,
        unpaidDays,
        overtimeHours,
        overtimePay: 0,
      });

      // 3.10 — render PDF
      const pdfBuffer = await generatePayslipPdf({
        company,
        employee: emp,
        period: { label: periodLabel },
        payslip: {
          grossSalary: payslip.grossSalary,
          totalDeductions: payslip.totalDeductions,
          netSalary: payslip.netSalary,
          paidDays,
          totalWorkingDays,
          unpaidDays,
          earnings,
          deductions: deductionMap,
        },
      });

      // 3.11–3.12 — upload + persist pdfUrl
      const key = `uploads/payslips/${run._id}/${emp._id}.pdf`;
      try {
        const pdfUrl = await uploadToS3(key, pdfBuffer, 'application/pdf');
        payslip.pdfUrl = pdfUrl;
        await payslip.save();
      } catch (err) {
        console.error(`[Payroll] PDF upload failed for ${emp.employeeCode}:`, err.message);
      }

      // 4 — accumulate
      totals.gross += c.monthlyGross;
      totals.deductions += c.totalDeductions;
      totals.net += c.netSalary;
      totals.pf += c.pfEmployee;
      totals.esi += c.esiEmployee;
      totals.tds += c.tds;
      processed++;
    }

    // 5 — finalize run
    await PayrollRun.updateOne(
      { _id: run._id },
      {
        status: 'processed',
        processedAt: new Date(),
        ...(triggeredBy && { processedBy: triggeredBy }),
        employeeCount: processed,
        totalGross: round2(totals.gross),
        totalDeductions: round2(totals.deductions),
        totalNet: round2(totals.net),
        totalPf: round2(totals.pf),
        totalEsi: round2(totals.esi),
        totalTds: round2(totals.tds),
      }
    );

    return { processed, payrollRunId: String(run._id) };
  } catch (err) {
    // Roll back to draft so it can be retried.
    await PayrollRun.updateOne({ _id: run._id }, { status: 'draft' }).catch(() => {});
    throw err;
  }
};

let worker;

/**
 * Start (once) the BullMQ payroll worker. Uses a dedicated blocking connection.
 */
export const createPayrollWorker = () => {
  if (worker) return worker;
  worker = new Worker(PAYROLL_QUEUE, processPayrollJob, {
    connection: redis.duplicate(),
    concurrency: 1,
  });
  worker.on('completed', (job, result) =>
    console.log(`[Payroll] Job ${job.id} completed — ${result?.processed} payslip(s)`)
  );
  worker.on('failed', (job, err) =>
    console.error(`[Payroll] Job ${job?.id} failed:`, err?.message)
  );
  console.log('[BullMQ] Payroll worker started');
  return worker;
};
