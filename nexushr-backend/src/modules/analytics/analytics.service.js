import mongoose from 'mongoose';
import {
  Employee, LeaveRequest, Candidate, PayrollRun, AttendanceRecord,
  PerformanceReview, SalaryStructure,
} from '../../models/index.js';

const oid = (id) => new mongoose.Types.ObjectId(id);

// GET /api/v1/analytics/headcount — joiners grouped by month.
export const getHeadcount = async (companyId) =>
  Employee.aggregate([
    { $match: { companyId: oid(companyId), deletedAt: null } },
    {
      $group: {
        _id: { year: { $year: '$dateJoined' }, month: { $month: '$dateJoined' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

// GET /api/v1/analytics/attrition?year=YYYY
export const getAttrition = async (companyId, year) => {
  const periodStart = new Date(`${year}-01-01`);
  const periodEnd = new Date(`${year}-12-31`);

  const [terminated, startCount, endCount] = await Promise.all([
    Employee.countDocuments({
      companyId,
      employmentStatus: 'terminated',
      dateLeft: { $gte: periodStart, $lte: periodEnd },
    }),
    Employee.countDocuments({ companyId, dateJoined: { $lt: periodStart }, deletedAt: null }),
    Employee.countDocuments({ companyId, dateJoined: { $lte: periodEnd }, deletedAt: null }),
  ]);

  const avgHeadcount = (startCount + endCount) / 2;
  const rate = avgHeadcount > 0 ? (terminated / avgHeadcount) * 100 : 0;
  return { year: Number(year), terminated, startCount, endCount, attritionRate: parseFloat(rate.toFixed(2)) };
};

// GET /api/v1/analytics/departments — active headcount by department.
export const getDeptBreakdown = async (companyId) =>
  Employee.aggregate([
    { $match: { companyId: oid(companyId), deletedAt: null, employmentStatus: 'active' } },
    { $group: { _id: '$departmentId', count: { $sum: 1 } } },
    { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
    { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
    { $project: { name: '$dept.name', count: 1, _id: 0 } },
  ]);

// GET /api/v1/analytics/leave-summary?year=YYYY — leave requests grouped by status.
export const getLeaveSummary = async (companyId, year) => {
  const start = new Date(`${year}-01-01`);
  const end = new Date(`${year}-12-31`);

  return LeaveRequest.aggregate([
    { $lookup: { from: 'employees', localField: 'employeeId', foreignField: '_id', as: 'emp' } },
    { $unwind: '$emp' },
    { $match: { 'emp.companyId': oid(companyId), startDate: { $gte: start, $lte: end } } },
    { $group: { _id: '$status', count: { $sum: 1 }, totalDays: { $sum: '$totalDays' } } },
  ]);
};

// ── Phase 8: expanded analytics ────────────────────────────

// GET /api/v1/analytics/recruitment-funnel — candidate counts per pipeline stage.
export const getRecruitmentFunnel = async (companyId) =>
  Candidate.aggregate([
    { $lookup: { from: 'jobpostings', localField: 'jobPostingId', foreignField: '_id', as: 'job' } },
    { $unwind: '$job' },
    { $match: { 'job.companyId': oid(companyId) } },
    { $group: { _id: '$stage', count: { $sum: 1 }, avgAiScore: { $avg: '$aiScore' } } },
    { $sort: { count: -1 } },
  ]);

// GET /api/v1/analytics/payroll-cost?months=N — monthly cost for the last N months.
export const getPayrollCost = async (companyId, months = 6) => {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const runs = await PayrollRun.find({
    companyId,
    status: { $in: ['approved', 'paid', 'processed'] },
    periodStart: { $gte: startDate },
  })
    .sort({ periodStart: 1 })
    .lean();

  return runs.map((r) => ({
    period: r.periodStart.toISOString().slice(0, 7),
    totalGross: r.totalGross,
    totalDeductions: r.totalDeductions,
    totalNet: r.totalNet,
    employeeCount: r.employeeCount,
  }));
};

// GET /api/v1/analytics/attendance-pattern?month=YYYY-MM — aggregate attendance stats.
export const getAttendancePattern = async (companyId, month) => {
  const [year, mon] = String(month).split('-').map(Number);
  const start = new Date(year, mon - 1, 1);
  const end = new Date(year, mon, 0);

  const employees = await Employee.find({ companyId, deletedAt: null, employmentStatus: 'active' }).select('_id').lean();
  const empIds = employees.map((e) => e._id);

  const [breakdown, lateArrivals, avgWorkingHours] = await Promise.all([
    AttendanceRecord.aggregate([
      { $match: { employeeId: { $in: empIds }, date: { $gte: start, $lte: end } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    AttendanceRecord.countDocuments({ employeeId: { $in: empIds }, date: { $gte: start, $lte: end }, isLate: true }),
    AttendanceRecord.aggregate([
      { $match: { employeeId: { $in: empIds }, date: { $gte: start, $lte: end }, status: 'present' } },
      { $group: { _id: null, avg: { $avg: '$workingHours' } } },
    ]),
  ]);

  return {
    month,
    breakdown,
    lateArrivals,
    avgWorkingHours: parseFloat((avgWorkingHours[0]?.avg ?? 0).toFixed(2)),
  };
};

// GET /api/v1/analytics/attrition-risk — Gemini gemini-1.5-pro risk scoring, cached 24h in Redis.
export const getAttritionRisk = async (companyId, redis) => {
  const cacheKey = `attrition_risk:${companyId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const employees = await Employee.find({ companyId, employmentStatus: 'active', deletedAt: null })
    .populate('departmentId designationId')
    .lean();

  // Build a lightweight behavioral-signal snapshot per employee (no PII).
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000);
  const signals = await Promise.all(
    employees.map(async (emp) => {
      const [absences, lateArrivals, lastReview, salaryStruct] = await Promise.all([
        AttendanceRecord.countDocuments({ employeeId: emp._id, status: 'absent', date: { $gte: ninetyDaysAgo } }),
        AttendanceRecord.countDocuments({ employeeId: emp._id, isLate: true, date: { $gte: ninetyDaysAgo } }),
        PerformanceReview.findOne({ employeeId: emp._id }).sort({ createdAt: -1 }).select('finalRating status').lean(),
        SalaryStructure.findOne({ employeeId: emp._id, isActive: true }).select('ctc').lean(),
      ]);

      const tenureYears = ((Date.now() - new Date(emp.dateJoined).getTime()) / (365.25 * 86400000)).toFixed(1);

      return {
        id: String(emp._id),
        name: `${emp.firstName} ${emp.lastName}`,
        department: emp.departmentId?.name,
        tenureYears: parseFloat(tenureYears),
        absencesLast90Days: absences,
        lateArrivalsLast90Days: lateArrivals,
        lastPerformanceRating: lastReview?.finalRating ?? null,
        ctc: salaryStruct?.ctc ?? 0,
        employmentType: emp.employmentType,
      };
    })
  );

  const prompt = `You are an HR analytics expert. Based on this employee dataset, identify the top 10 employees most at risk of attrition and explain why.

Employee Dataset (${signals.length} employees):
${JSON.stringify(signals.slice(0, 50), null, 0)}

Risk factors to consider:
- High absences (>5 in 90 days) = high risk signal
- Frequent late arrivals (>8 in 90 days) = dissatisfaction signal
- Low performance rating (<3) = flight risk
- Tenure < 1 year or > 5 years = transition points
- Employment type = contract/intern = inherently temporary

Return ONLY a valid JSON array with exactly this structure (no markdown):
[
  {
    "employeeId": "string",
    "employeeName": "string",
    "riskLevel": "high|medium|low",
    "riskScore": 0-100,
    "primaryFactors": ["list of 2-3 specific risk factors"],
    "recommendedAction": "1 specific HR action"
  }
]`;

  let result = [];
  try {
    const { complete, isGeminiConfigured } = await import('../ai/gemini.service.js');
    if (isGeminiConfigured()) {
      const raw = await complete({
        system: 'You are an expert HR attrition analyst. Always return valid JSON arrays only.',
        user: prompt,
        // gemini-1.5-pro is retired on the current API (404); gemini-2.0-flash is the supported model.
        model: 'gemini-2.0-flash',
        maxTokens: 2048,
      });
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(cleaned);
    }
  } catch (err) {
    console.warn('[Analytics] Attrition risk generation failed:', err.message);
    result = [];
  }

  // Cache for 24 hours (even an empty result, to avoid hammering on misconfig).
  await redis.setex(cacheKey, 86400, JSON.stringify(result));
  return result;
};
