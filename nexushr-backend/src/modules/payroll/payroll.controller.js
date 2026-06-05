import * as payrollService from './payroll.service.js';
import { success } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

// POST /api/v1/payroll
export const runPayroll = asyncHandler(async (req, res) => {
  const { periodStart, periodEnd } = req.body;
  const run = await payrollService.createPayrollRun({
    companyId: req.user.companyId,
    userId: req.user.userId,
    periodStart,
    periodEnd,
  });
  success(
    res,
    {
      id: run._id,
      status: run.status,
      periodStart: run.periodStart,
      periodEnd: run.periodEnd,
      message: 'Payroll processing started. Payslips are being generated in the background.',
    },
    202
  );
});

// GET /api/v1/payroll
export const listRuns = asyncHandler(async (req, res) => {
  const { page, per_page, perPage } = req.query;
  const { runs, meta } = await payrollService.listPayrollRuns({
    companyId: req.user.companyId,
    page,
    perPage: per_page || perPage,
  });
  success(res, runs, 200, meta);
});

// GET /api/v1/payroll/:id/payslips
export const getRunPayslips = asyncHandler(async (req, res) => {
  const { run, payslips } = await payrollService.getPayslipsForRun(req.user.companyId, req.params.id);
  success(res, { run, payslips });
});

// PATCH /api/v1/payroll/:id/approve
export const approvePayroll = asyncHandler(async (req, res) => {
  const { run, publishedCount } = await payrollService.approvePayrollRun({
    companyId: req.user.companyId,
    userId: req.user.userId,
    runId: req.params.id,
  });
  success(res, {
    id: run._id,
    status: run.status,
    approvedAt: run.approvedAt,
    publishedPayslips: publishedCount,
    message: 'Payroll run approved and payslips published.',
  });
});
