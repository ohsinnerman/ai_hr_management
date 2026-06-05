import { Router } from 'express';
import {
  listEmployees,
  getEmployee,
  getOrgTree,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from './employee.controller.js';
import { createEmployeeRules, updateEmployeeRules } from './employee.validator.js';
import { validate } from '../../middleware/validate.js';
import { requireRole } from '../../middleware/requireRole.js';

// NOTE: `authenticate` is applied at mount time in server.js.
const router = Router();

const writeRoles = requireRole('hr_manager', 'super_admin');

// Reads (any authenticated user)
router.get('/', listEmployees);
router.get('/:id/org-tree', getOrgTree); // more specific — register before '/:id'
router.get('/:id', getEmployee);

// Mutations (HR / Super Admin only)
router.post('/', writeRoles, createEmployeeRules, validate, createEmployee);
router.put('/:id', writeRoles, updateEmployeeRules, validate, updateEmployee);
router.delete('/:id', writeRoles, deleteEmployee);

export default router;
