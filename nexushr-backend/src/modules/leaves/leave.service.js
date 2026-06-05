import LeaveType from '../../models/LeaveType.model.js';
import LeaveRequest from '../../models/LeaveRequest.model.js';
import LeaveBalance from '../../models/LeaveBalance.model.js';
import AttendanceRecord from '../../models/AttendanceRecord.model.js';
import { eachWorkingDay, countWorkingDays } from '../../utils/dates.js';

const httpError = (status, code, message) => {
  const err = new Error(message || code);
  err.status = status;
  err.code = code;
  return err;
};

// ── Leave types ────────────────────────────────────────────
export const listLeaveTypes = (companyId) =>
  LeaveType.find({ companyId, isActive: true }).sort({ name: 1 }).lean();

export const createLeaveType = (companyId, data) =>
  LeaveType.create({
    companyId,
    name: data.name,
    code: data.code,
    annualAllowance: data.annualAllowance,
    carryForward: data.carryForward,
    maxCarryForward: data.maxCarryForward,
    encashable: data.encashable,
    requiresDocument: data.requiresDocument,
    genderSpecific: data.genderSpecific,
    colorCode: data.colorCode,
  });

// ── Apply for leave ────────────────────────────────────────
/**
 * Validates balance and creates a pending LeaveRequest, moving `totalDays`
 * into the LeaveBalance.pending bucket. totalDays is computed from the
 * working days in [startDate, endDate] (weekends excluded).
 */
export const applyLeave = async ({ employeeId, leaveTypeId, startDate, endDate, reason }) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start) || isNaN(end)) throw httpError(400, 'VALIDATION_ERROR', 'Invalid start or end date');
  if (end < start) throw httpError(400, 'VALIDATION_ERROR', 'endDate cannot be before startDate');

  const totalDays = countWorkingDays(start, end);
  if (totalDays <= 0) throw httpError(400, 'VALIDATION_ERROR', 'Leave range contains no working days');

  const year = start.getUTCFullYear();
  const balance = await LeaveBalance.findOne({ employeeId, leaveTypeId, year });
  if (!balance) {
    throw httpError(400, 'NO_BALANCE', 'No leave balance allocated for this leave type and year');
  }

  const available =
    balance.totalAllocated + balance.carriedForward - balance.used - balance.pending;
  if (totalDays > available) {
    throw httpError(400, 'INSUFFICIENT_BALANCE', `Requested ${totalDays} day(s) but only ${available} available`);
  }

  const leave = await LeaveRequest.create({
    employeeId,
    leaveTypeId,
    startDate: start,
    endDate: end,
    totalDays,
    reason,
    status: 'pending',
    appliedAt: new Date(),
  });

  await LeaveBalance.updateOne({ _id: balance._id }, { $inc: { pending: totalDays } });

  return leave;
};

// ── Review (approve / reject) a leave ──────────────────────
/**
 * action: 'approve' | 'reject'. Enforces BR-001 (cannot review own leave).
 * Approve: pending -> used and create on_leave attendance for each working day.
 * Reject: release the pending hold.
 */
export const reviewLeave = async ({ leaveId, reviewer, action, comment }) => {
  if (!['approve', 'reject'].includes(action)) {
    throw httpError(400, 'INVALID_ACTION', "action must be 'approve' or 'reject'");
  }

  const leave = await LeaveRequest.findById(leaveId);
  if (!leave) throw httpError(404, 'NOT_FOUND', 'Leave request not found');
  if (leave.status !== 'pending') {
    throw httpError(409, 'ALREADY_REVIEWED', `Leave request is already ${leave.status}`);
  }

  // BR-001: an employee cannot approve their own leave request.
  if (String(leave.employeeId) === String(reviewer.employeeId)) {
    throw httpError(403, 'CANNOT_APPROVE_OWN', 'You cannot review your own leave request');
  }

  const year = new Date(leave.startDate).getUTCFullYear();

  if (action === 'approve') {
    await LeaveBalance.updateOne(
      { employeeId: leave.employeeId, leaveTypeId: leave.leaveTypeId, year },
      { $inc: { used: leave.totalDays, pending: -leave.totalDays } }
    );

    // Mark each working day in the range as on_leave (upsert to respect the unique index).
    for (const day of eachWorkingDay(leave.startDate, leave.endDate)) {
      await AttendanceRecord.findOneAndUpdate(
        { employeeId: leave.employeeId, date: day },
        { status: 'on_leave', approvedBy: reviewer.employeeId },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    leave.status = 'approved';
  } else {
    // reject — release the pending hold
    await LeaveBalance.updateOne(
      { employeeId: leave.employeeId, leaveTypeId: leave.leaveTypeId, year },
      { $inc: { pending: -leave.totalDays } }
    );
    leave.status = 'rejected';
  }

  // Record who reviewed. HR/Admin fill the hr* fields; a manager fills the manager* fields.
  if (reviewer.isHr) {
    leave.hrReviewedBy = reviewer.employeeId;
    leave.hrReviewedAt = new Date();
    leave.hrComment = comment;
  } else {
    leave.managerReviewedBy = reviewer.employeeId;
    leave.managerReviewedAt = new Date();
    leave.managerComment = comment;
  }

  await leave.save();
  return leave;
};

// ── Balances & listing ─────────────────────────────────────
export const getLeaveBalances = (employeeId, year) => {
  const y = Number(year) || new Date().getUTCFullYear();
  return LeaveBalance.find({ employeeId, year: y }).populate('leaveTypeId').lean();
};

export const listLeaveRequests = ({ employeeId, employeeIds, status }) => {
  const query = {};
  if (employeeIds) query.employeeId = { $in: employeeIds };
  else query.employeeId = employeeId;
  if (status) query.status = status;
  return LeaveRequest.find(query)
    .populate('leaveTypeId', 'name code colorCode')
    .populate('employeeId', 'firstName lastName employeeCode')
    .sort({ createdAt: -1 })
    .lean();
};
