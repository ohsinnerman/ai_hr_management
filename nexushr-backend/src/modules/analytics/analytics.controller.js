import * as analyticsService from './analytics.service.js';
import { redis } from '../../config/redis.js';
import { success } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const currentYear = () => new Date().getFullYear();
const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// GET /api/v1/analytics/headcount
export const headcount = asyncHandler(async (req, res) => {
  success(res, await analyticsService.getHeadcount(req.user.companyId));
});

// GET /api/v1/analytics/attrition?year=YYYY
export const attrition = asyncHandler(async (req, res) => {
  const year = req.query.year || currentYear();
  success(res, await analyticsService.getAttrition(req.user.companyId, year));
});

// GET /api/v1/analytics/departments
export const departments = asyncHandler(async (req, res) => {
  success(res, await analyticsService.getDeptBreakdown(req.user.companyId));
});

// GET /api/v1/analytics/leave-summary?year=YYYY
export const leaveSummary = asyncHandler(async (req, res) => {
  const year = req.query.year || currentYear();
  success(res, await analyticsService.getLeaveSummary(req.user.companyId, year));
});

// GET /api/v1/analytics/recruitment-funnel
export const recruitmentFunnel = asyncHandler(async (req, res) => {
  success(res, await analyticsService.getRecruitmentFunnel(req.user.companyId));
});

// GET /api/v1/analytics/payroll-cost?months=N
export const payrollCost = asyncHandler(async (req, res) => {
  const months = Number(req.query.months) || 6;
  success(res, await analyticsService.getPayrollCost(req.user.companyId, months));
});

// GET /api/v1/analytics/attendance-pattern?month=YYYY-MM
export const attendancePattern = asyncHandler(async (req, res) => {
  const month = req.query.month || currentMonth();
  success(res, await analyticsService.getAttendancePattern(req.user.companyId, month));
});

// GET /api/v1/analytics/attrition-risk  (Gemini gemini-1.5-pro, cached 24h in Redis)
export const attritionRisk = asyncHandler(async (req, res) => {
  success(res, await analyticsService.getAttritionRisk(req.user.companyId, redis));
});
