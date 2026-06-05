import mongoose from 'mongoose';
import {
  Employee, JobPosting, LeaveRequest, AttendanceRecord, PayrollRun,
  Candidate, Interview, PerformanceReview, LeaveBalance, Payslip,
} from '../../models/index.js';

const oid = (id) => new mongoose.Types.ObjectId(id);
const httpError = (status, code, message) => {
  const err = new Error(message || code);
  err.status = status;
  err.code = code;
  return err;
};
const todayMidnight = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// Count pending leave requests for a company (employees joined in).
const pendingLeaveCount = (companyOid) =>
  LeaveRequest.aggregate([
    { $lookup: { from: 'employees', localField: 'employeeId', foreignField: '_id', as: 'emp' } },
    { $unwind: '$emp' },
    { $match: { 'emp.companyId': companyOid, status: 'pending' } },
    { $count: 'total' },
  ]).then((r) => r[0]?.total ?? 0);

export const getAdminDashboard = async (companyId) => {
  const companyOid = oid(companyId);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const today = todayMidnight();

  const [
    totalEmployees, newHiresThisMonth, activeJobs, pendingLeaves, todayPresent,
    lastPayrollRun, deptBreakdown, headcountTrend, attritionCount,
  ] = await Promise.all([
    Employee.countDocuments({ companyId: companyOid, employmentStatus: 'active', deletedAt: null }),
    Employee.countDocuments({ companyId: companyOid, dateJoined: { $gte: monthStart }, deletedAt: null }),
    JobPosting.countDocuments({ companyId: companyOid, status: 'active' }),
    pendingLeaveCount(companyOid),
    AttendanceRecord.countDocuments({ date: today, status: 'present' }),
    PayrollRun.findOne({ companyId: companyOid, status: { $in: ['approved', 'paid'] } })
      .sort({ createdAt: -1 })
      .select('periodStart periodEnd totalNet employeeCount status')
      .lean(),
    Employee.aggregate([
      { $match: { companyId: companyOid, employmentStatus: 'active', deletedAt: null } },
      { $group: { _id: '$departmentId', count: { $sum: 1 } } },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, name: '$dept.name', count: 1 } },
    ]),
    Employee.aggregate([
      { $match: { companyId: companyOid, deletedAt: null, dateJoined: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } } },
      { $group: { _id: { year: { $year: '$dateJoined' }, month: { $month: '$dateJoined' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Employee.countDocuments({
      companyId: companyOid,
      employmentStatus: 'terminated',
      dateLeft: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
    }),
  ]);

  return {
    kpis: { totalEmployees, newHiresThisMonth, activeJobs, pendingLeaves, todayPresent, attritionCount },
    lastPayrollRun,
    deptBreakdown,
    headcountTrend,
  };
};

export const getHrDashboard = async (companyId) => {
  const companyOid = oid(companyId);
  const today = todayMidnight();

  const [pendingLeaves, todayAbsent, todayLate, pendingPayrolls, recentCandidates, reviewsPending] = await Promise.all([
    pendingLeaveCount(companyOid),
    AttendanceRecord.countDocuments({ date: today, status: 'absent' }),
    AttendanceRecord.countDocuments({ date: today, isLate: true }),
    PayrollRun.countDocuments({ companyId: companyOid, status: { $in: ['draft', 'processing', 'processed'] } }),
    Candidate.find({})
      .populate('jobPostingId', 'title companyId')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
      .then((cs) => cs.filter((c) => c.jobPostingId?.companyId?.toString() === companyId)),
    PerformanceReview.aggregate([
      { $lookup: { from: 'employees', localField: 'employeeId', foreignField: '_id', as: 'emp' } },
      { $unwind: '$emp' },
      { $match: { 'emp.companyId': companyOid, status: 'hr_review' } },
      { $count: 'total' },
    ]).then((r) => r[0]?.total ?? 0),
  ]);

  return { pendingLeaves, todayAbsent, todayLate, pendingPayrolls, recentCandidates, reviewsPending };
};

export const getRecruiterDashboard = async (companyId) => {
  const companyOid = oid(companyId);
  const dayStart = new Date(new Date().setHours(0, 0, 0, 0));
  const dayEnd = new Date(new Date().setHours(23, 59, 59, 999));

  const [activeJobs, candidatePipeline, todayInterviews, topCandidates] = await Promise.all([
    JobPosting.find({ companyId: companyOid, status: 'active' })
      .select('title openings filledCount status createdAt')
      .lean(),
    Candidate.aggregate([
      { $lookup: { from: 'jobpostings', localField: 'jobPostingId', foreignField: '_id', as: 'job' } },
      { $unwind: '$job' },
      { $match: { 'job.companyId': companyOid } },
      { $group: { _id: '$stage', count: { $sum: 1 } } },
    ]),
    Interview.find({ scheduledAt: { $gte: dayStart, $lt: dayEnd }, status: 'scheduled' })
      .populate('candidateId', 'firstName lastName')
      .populate('jobPostingId', 'title companyId')
      .lean()
      .then((ivs) => ivs.filter((iv) => iv.jobPostingId?.companyId?.toString() === companyId)),
    Candidate.find({ aiScore: { $gte: 85 }, stage: { $in: ['ai_screening', 'shortlisted'] } })
      .populate({ path: 'jobPostingId', match: { companyId: companyOid }, select: 'title' })
      .sort({ aiScore: -1 })
      .limit(10)
      .lean()
      .then((cs) => cs.filter((c) => c.jobPostingId)),
  ]);

  return { activeJobs, candidatePipeline, todayInterviews, topCandidates };
};

export const getManagerDashboard = async (managerId) => {
  const today = todayMidnight();
  const directReports = await Employee.find({ managerId, deletedAt: null }).select('_id').lean();
  const empIds = directReports.map((e) => e._id);

  const [teamAttendance, pendingLeaves, pendingReviews] = await Promise.all([
    AttendanceRecord.find({ employeeId: { $in: empIds }, date: today })
      .populate('employeeId', 'firstName lastName profilePhotoUrl')
      .lean(),
    LeaveRequest.find({ employeeId: { $in: empIds }, status: 'pending' })
      .populate('employeeId', 'firstName lastName')
      .populate('leaveTypeId', 'name colorCode')
      .sort({ appliedAt: -1 })
      .lean(),
    PerformanceReview.find({ employeeId: { $in: empIds }, status: 'manager_review' })
      .populate('employeeId', 'firstName lastName')
      .lean(),
  ]);

  const attendanceSummary = {
    present: teamAttendance.filter((a) => a.status === 'present').length,
    absent: teamAttendance.filter((a) => a.status === 'absent').length,
    late: teamAttendance.filter((a) => a.isLate).length,
    total: empIds.length,
  };

  return { teamSize: empIds.length, attendanceSummary, teamAttendance, pendingLeaves, pendingReviews };
};

export const getEmployeeDashboard = async (userId) => {
  const employee = await Employee.findOne({ userId, deletedAt: null })
    .populate('departmentId designationId managerId')
    .lean();
  if (!employee) throw httpError(404, 'EMPLOYEE_NOT_FOUND', 'No employee record is linked to this user');

  const year = new Date().getFullYear();
  const today = todayMidnight();

  const [todayAttendance, leaveBalances, recentLeaves, lastPayslip, myReviews] = await Promise.all([
    AttendanceRecord.findOne({ employeeId: employee._id, date: today }).lean(),
    LeaveBalance.find({ employeeId: employee._id, year }).populate('leaveTypeId', 'name code colorCode annualAllowance').lean(),
    LeaveRequest.find({ employeeId: employee._id }).sort({ appliedAt: -1 }).limit(5).populate('leaveTypeId', 'name').lean(),
    Payslip.findOne({ employeeId: employee._id, isPublished: true })
      .sort({ createdAt: -1 })
      .populate('payrollRunId', 'periodStart periodEnd')
      .lean(),
    PerformanceReview.find({ employeeId: employee._id }).sort({ createdAt: -1 }).limit(3).lean(),
  ]);

  return { employee, todayAttendance, leaveBalances, recentLeaves, lastPayslip, myReviews };
};
