import * as analyticsService from './analytics.service.js';
import { success } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const currentYear = () => new Date().getFullYear();

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
