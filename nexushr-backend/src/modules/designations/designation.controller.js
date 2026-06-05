import * as designationService from './designation.service.js';
import { success } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

// POST /api/v1/designations
export const createDesignation = asyncHandler(async (req, res) => {
  const desig = await designationService.create(req.user.companyId, req.body);
  success(res, desig, 201);
});

// GET /api/v1/designations
export const listDesignations = asyncHandler(async (req, res) => {
  const designations = await designationService.getAll(req.user.companyId);
  success(res, designations);
});

// PUT /api/v1/designations/:id
export const updateDesignation = asyncHandler(async (req, res) => {
  const desig = await designationService.update(req.user.companyId, req.params.id, req.body);
  success(res, desig);
});

// DELETE /api/v1/designations/:id  (soft delete)
export const deleteDesignation = asyncHandler(async (req, res) => {
  await designationService.remove(req.user.companyId, req.params.id);
  success(res, { message: 'Designation deleted successfully' });
});
