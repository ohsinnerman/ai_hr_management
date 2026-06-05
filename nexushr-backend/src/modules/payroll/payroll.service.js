import PayrollRun from '../../models/PayrollRun.model.js';
import Payslip from '../../models/Payslip.model.js';
import { enqueuePayrollRun } from '../../queues/payroll.queue.js';

const httpError = (status, code, message) => {
  const err = new Error(message || code);
  err.status = status;
  err.code = code;
  return err;
};

/**
 * Create a draft PayrollRun and enqueue background processing.
 * BR-002: only one run per company per exact period (unique index).
 */
export const createPayrollRun = async ({ companyId, userId, periodStart, periodEnd }) => {
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  if (isNaN(start) || isNaN(end)) throw httpError(400, 'VALIDATION_ERROR', 'Invalid period dates');
  if (end < start) throw httpError(400, 'VALIDATION_ERROR', 'periodEnd cannot be before periodStart');

  let run;
  try {
    run = await PayrollRun.create({
      companyId,
      periodStart: start,
      periodEnd: end,
      status: 'draft',
      processedBy: userId,
    });
  } catch (err) {
    if (err.code === 11000) {
      throw httpError(409, 'CONFLICT', 'A payroll run already exists for this period (BR-002)');
    }
    throw err;
  }

  await enqueuePayrollRun({
    payrollRunId: String(run._id),
    companyId: String(companyId),
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
    triggeredBy: String(userId),
  });

  return run;
};

export const listPayrollRuns = async ({ companyId, page = 1, perPage = 25 }) => {
  const pageNum = Number(page) || 1;
  const limit = Number(perPage) || 25;
  const skip = (pageNum - 1) * limit;

  const [runs, total] = await Promise.all([
    PayrollRun.find({ companyId }).sort({ periodStart: -1 }).skip(skip).limit(limit).lean(),
    PayrollRun.countDocuments({ companyId }),
  ]);

  return { runs, meta: { page: pageNum, perPage: limit, total, totalPages: Math.ceil(total / limit) } };
};

export const getPayslipsForRun = async (companyId, runId) => {
  const run = await PayrollRun.findOne({ _id: runId, companyId }).lean();
  if (!run) throw httpError(404, 'NOT_FOUND', 'Payroll run not found');

  const payslips = await Payslip.find({ payrollRunId: runId })
    .populate('employeeId', 'firstName lastName employeeCode email')
    .sort({ createdAt: 1 })
    .lean();

  return { run, payslips };
};
