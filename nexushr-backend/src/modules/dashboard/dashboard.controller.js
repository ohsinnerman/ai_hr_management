import { asyncHandler } from '../../utils/asyncHandler.js';
import { success } from '../../utils/apiResponse.js';
import { resolveEmployee } from '../../utils/resolveEmployee.js';
import * as svc from './dashboard.service.js';

export const adminDashboard = asyncHandler(async (req, res) => {
  success(res, await svc.getAdminDashboard(req.user.companyId));
});

export const hrDashboard = asyncHandler(async (req, res) => {
  success(res, await svc.getHrDashboard(req.user.companyId));
});

export const recruiterDashboard = asyncHandler(async (req, res) => {
  success(res, await svc.getRecruiterDashboard(req.user.companyId));
});

export const managerDashboard = asyncHandler(async (req, res) => {
  const emp = await resolveEmployee(req.user.userId);
  success(res, await svc.getManagerDashboard(emp._id));
});

export const employeeDashboard = asyncHandler(async (req, res) => {
  success(res, await svc.getEmployeeDashboard(req.user.userId));
});
