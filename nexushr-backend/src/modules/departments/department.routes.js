import { Router } from 'express';
import { body } from 'express-validator';
import {
  createDepartment,
  listDepartments,
  updateDepartment,
  deleteDepartment,
} from './department.controller.js';
import { validate } from '../../middleware/validate.js';
import { requireRole } from '../../middleware/requireRole.js';

// NOTE: `authenticate` is applied at mount time in server.js.
const router = Router();

const writeRoles = requireRole('hr_manager', 'super_admin');

router.get('/', listDepartments);

router.post(
  '/',
  writeRoles,
  [body('name').isString().trim().notEmpty().withMessage('Department name is required')],
  validate,
  createDepartment
);

router.put('/:id', writeRoles, updateDepartment);

router.delete('/:id', writeRoles, deleteDepartment);

export default router;
