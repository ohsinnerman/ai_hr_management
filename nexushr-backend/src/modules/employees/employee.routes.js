import { Router } from 'express';
import {
  listEmployees,
  getEmployee,
  getOrgTree,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getMe,
  getMyPayslips,
  downloadMyPayslip,
} from './employee.controller.js';
import { createEmployeeRules, updateEmployeeRules } from './employee.validator.js';
import { validate } from '../../middleware/validate.js';
import { requireRole } from '../../middleware/requireRole.js';

// NOTE: `authenticate` is applied at mount time in server.js.
const router = Router();

const writeRoles = requireRole('hr_manager', 'super_admin');

// Self-service (any authenticated user) — MUST be before '/:id' so "me" isn't read as an id.
router.get('/me', getMe);
router.get('/me/payslips', getMyPayslips);
router.get('/me/payslips/:payslipId/download', downloadMyPayslip);

// Reads (any authenticated user)
router.get('/', listEmployees);
router.get('/:id/org-tree', getOrgTree); // more specific — register before '/:id'
router.get('/:id', getEmployee);

// Mutations (HR / Super Admin only)
router.post('/', writeRoles, createEmployeeRules, validate, createEmployee);
router.put('/:id', writeRoles, updateEmployeeRules, validate, updateEmployee);
router.delete('/:id', writeRoles, deleteEmployee);

export default router;
