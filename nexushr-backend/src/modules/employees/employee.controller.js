import * as employeeService from './employee.service.js';
import { success } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

// GET /api/v1/employees
export const listEmployees = asyncHandler(async (req, res) => {
  const { page, per_page, perPage, department, status, search } = req.query;
  const { employees, meta } = await employeeService.getAll({
    companyId: req.user.companyId,
    page,
    perPage: per_page || perPage,
    department,
    status,
    search,
  });
  success(res, employees, 200, meta);
});

// GET /api/v1/employees/me  (self profile, PII decrypted)
export const getMe = asyncHandler(async (req, res) => {
  const employee = await employeeService.getSelfProfile(req.user.userId);
  success(res, employee);
});

// GET /api/v1/employees/me/payslips  (own published payslips)
export const getMyPayslips = asyncHandler(async (req, res) => {
  const payslips = await employeeService.getSelfPayslips(req.user.userId);
  success(res, payslips);
});

// GET /api/v1/employees/me/payslips/:payslipId/download  (signed URL)
export const downloadMyPayslip = asyncHandler(async (req, res) => {
  const data = await employeeService.getSelfPayslipDownloadUrl(req.user.userId, req.params.payslipId);
  success(res, data);
});

// GET /api/v1/employees/:id
export const getEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.getById(req.user.companyId, req.params.id);
  success(res, employee);
});

// GET /api/v1/employees/:id/org-tree
export const getOrgTree = asyncHandler(async (req, res) => {
  const tree = await employeeService.getOrgTree(req.user.companyId, req.params.id);
  success(res, tree);
});

// POST /api/v1/employees
export const createEmployee = asyncHandler(async (req, res) => {
  // provisionUser defaults to true; allow opting out via body flag.
  const provisionUser = req.body.provisionUser !== false && req.body.createUserAccount !== false;
  const { employee, temporaryPassword } = await employeeService.createEmployee({
    companyId: req.user.companyId,
    createdBy: req.user.userId,
    data: req.body,
    provisionUser,
  });
  success(res, { employee, ...(temporaryPassword && { temporaryPassword }) }, 201);
});

// PUT /api/v1/employees/:id
export const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.updateEmployee({
    companyId: req.user.companyId,
    id: req.params.id,
    updatedBy: req.user.userId,
    data: req.body,
  });
  success(res, employee);
});

// DELETE /api/v1/employees/:id  (soft delete)
export const deleteEmployee = asyncHandler(async (req, res) => {
  await employeeService.softDelete(req.user.companyId, req.params.id);
  success(res, { message: 'Employee deleted successfully' });
});
