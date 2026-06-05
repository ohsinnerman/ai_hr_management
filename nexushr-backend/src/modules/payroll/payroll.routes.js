import { Router } from 'express';
import { body } from 'express-validator';
import { runPayroll, listRuns, getRunPayslips } from './payroll.controller.js';
import { validate } from '../../middleware/validate.js';
import { requireRole } from '../../middleware/requireRole.js';

// NOTE: `authenticate` is applied at mount time in server.js.
// All payroll routes are HR / Super Admin only.
const router = Router();

router.use(requireRole('hr_manager', 'super_admin'));

router.post(
  '/',
  [
    body('periodStart').isISO8601().withMessage('periodStart must be a valid date'),
    body('periodEnd').isISO8601().withMessage('periodEnd must be a valid date'),
  ],
  validate,
  runPayroll
);

router.get('/', listRuns);
router.get('/:id/payslips', getRunPayslips);

export default router;
