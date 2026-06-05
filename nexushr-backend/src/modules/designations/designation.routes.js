import { Router } from 'express';
import { body } from 'express-validator';
import {
  createDesignation,
  listDesignations,
  updateDesignation,
  deleteDesignation,
} from './designation.controller.js';
import { validate } from '../../middleware/validate.js';
import { requireRole } from '../../middleware/requireRole.js';

// NOTE: `authenticate` is applied at mount time in server.js.
const router = Router();

const writeRoles = requireRole('hr_manager', 'super_admin');

router.get('/', listDesignations);

router.post(
  '/',
  writeRoles,
  [body('name').isString().trim().notEmpty().withMessage('Designation name is required')],
  validate,
  createDesignation
);

router.put('/:id', writeRoles, updateDesignation);

router.delete('/:id', writeRoles, deleteDesignation);

export default router;
