import * as attendanceService from './attendance.service.js';
import { resolveEmployee } from '../../utils/resolveEmployee.js';
import { success } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const PRIVILEGED = ['hr_manager', 'super_admin', 'senior_manager'];

// POST /api/v1/attendance/check-in
export const checkIn = asyncHandler(async (req, res) => {
  const employee = await resolveEmployee(req.user.userId);
  const record = await attendanceService.checkIn(employee._id, req.user.companyId, req.body.location);
  success(res, record, 201);
});

// POST /api/v1/attendance/check-out
export const checkOut = asyncHandler(async (req, res) => {
  const employee = await resolveEmployee(req.user.userId);
  const record = await attendanceService.checkOut(employee._id, req.body.location);
  success(res, record);
});

// GET /api/v1/attendance?month=&year=&employeeId=
export const getAttendance = asyncHandler(async (req, res) => {
  const { month, year, employeeId } = req.query;

  // Employees see only their own records; privileged roles may pass employeeId.
  let targetId;
  if (employeeId && PRIVILEGED.includes(req.user.role)) {
    targetId = employeeId;
  } else {
    const employee = await resolveEmployee(req.user.userId);
    targetId = employee._id;
  }

  const records = await attendanceService.getAttendance(targetId, month, year);
  success(res, records);
});
