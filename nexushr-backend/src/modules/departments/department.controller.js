import * as departmentService from './department.service.js';
import { success } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

// POST /api/v1/departments
export const createDepartment = asyncHandler(async (req, res) => {
  const dept = await departmentService.create(req.user.companyId, req.body);
  success(res, dept, 201);
});

// GET /api/v1/departments
export const listDepartments = asyncHandler(async (req, res) => {
  const departments = await departmentService.getAll(req.user.companyId);
  success(res, departments);
});

// PUT /api/v1/departments/:id
export const updateDepartment = asyncHandler(async (req, res) => {
  const dept = await departmentService.update(req.user.companyId, req.params.id, req.body);
  success(res, dept);
});

// DELETE /api/v1/departments/:id  (soft delete)
export const deleteDepartment = asyncHandler(async (req, res) => {
  await departmentService.remove(req.user.companyId, req.params.id);
  success(res, { message: 'Department deleted successfully' });
});
