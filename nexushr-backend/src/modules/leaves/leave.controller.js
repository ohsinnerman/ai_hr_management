import * as leaveService from './leave.service.js';
import LeaveRequest from '../../models/LeaveRequest.model.js';
import Employee from '../../models/Employee.model.js';
import { resolveEmployee } from '../../utils/resolveEmployee.js';
import { success } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const isHrRole = (role) => ['hr_manager', 'super_admin'].includes(role);

// GET /api/v1/leaves/types
export const listLeaveTypes = asyncHandler(async (req, res) => {
  const types = await leaveService.listLeaveTypes(req.user.companyId);
  success(res, types);
});

// POST /api/v1/leaves/types  (HR / Super Admin)
export const createLeaveType = asyncHandler(async (req, res) => {
  const type = await leaveService.createLeaveType(req.user.companyId, req.body);
  success(res, type, 201);
});

// POST /api/v1/leaves/request  (employee applies for self)
export const applyLeave = asyncHandler(async (req, res) => {
  const employee = await resolveEmployee(req.user.userId);
  const { leaveTypeId, startDate, endDate, reason } = req.body;
  const leave = await leaveService.applyLeave({
    employeeId: employee._id,
    leaveTypeId,
    startDate,
    endDate,
    reason,
  });
  success(res, leave, 201);
});

// PATCH /api/v1/leaves/:id/approve   body: { action: 'approve'|'reject', comment }
export const reviewLeave = asyncHandler(async (req, res) => {
  const reviewer = await resolveEmployee(req.user.userId);
  const leave = await LeaveRequest.findById(req.params.id).select('employeeId status');
  if (!leave) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });

  // Authorization: HR/Admin, or the requester's direct manager.
  const privileged = isHrRole(req.user.role);
  let isDirectManager = false;
  if (!privileged) {
    const target = await Employee.findById(leave.employeeId).select('managerId');
    isDirectManager = target && String(target.managerId) === String(reviewer._id);
  }
  if (!privileged && !isDirectManager) {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only HR or the direct manager can review this request' } });
  }

  const { action, comment } = req.body;
  const updated = await leaveService.reviewLeave({
    leaveId: req.params.id,
    reviewer: { employeeId: reviewer._id, isHr: privileged },
    action,
    comment,
  });
  success(res, updated);
});

// GET /api/v1/leaves/balance?employeeId=&year=
export const getBalances = asyncHandler(async (req, res) => {
  const { employeeId, year } = req.query;
  let targetId;
  if (employeeId && (isHrRole(req.user.role) || req.user.role === 'senior_manager')) {
    targetId = employeeId;
  } else {
    const employee = await resolveEmployee(req.user.userId);
    targetId = employee._id;
  }
  const balances = await leaveService.getLeaveBalances(targetId, year);
  success(res, balances);
});

// GET /api/v1/leaves?status=
export const listLeaves = asyncHandler(async (req, res) => {
  const { status } = req.query;

  if (isHrRole(req.user.role)) {
    // All requests for employees in the company.
    const ids = await Employee.find({ companyId: req.user.companyId }).distinct('_id');
    const leaves = await leaveService.listLeaveRequests({ employeeIds: ids, status });
    return success(res, leaves);
  }

  const me = await resolveEmployee(req.user.userId);
  if (req.user.role === 'senior_manager') {
    // Own + direct reports.
    const reportIds = await Employee.find({ managerId: me._id }).distinct('_id');
    const leaves = await leaveService.listLeaveRequests({ employeeIds: [me._id, ...reportIds], status });
    return success(res, leaves);
  }

  const leaves = await leaveService.listLeaveRequests({ employeeId: me._id, status });
  success(res, leaves);
});
