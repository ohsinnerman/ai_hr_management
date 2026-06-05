import { Router } from 'express';
import {
  listLeaveTypes,
  createLeaveType,
  applyLeave,
  reviewLeave,
  getBalances,
  listLeaves,
} from './leave.controller.js';
import { applyLeaveRules, reviewLeaveRules, createLeaveTypeRules } from './leave.validator.js';
import { validate } from '../../middleware/validate.js';
import { requireRole } from '../../middleware/requireRole.js';

// NOTE: `authenticate` is applied at mount time in server.js.
const router = Router();

// Leave types
router.get('/types', listLeaveTypes);
router.post('/types', requireRole('hr_manager', 'super_admin'), createLeaveTypeRules, validate, createLeaveType);

// Balances + listing
router.get('/balance', getBalances);
router.get('/', listLeaves);

// Apply (employee) + review (HR or direct manager — enforced in controller)
router.post('/request', applyLeaveRules, validate, applyLeave);
router.patch('/:id/approve', reviewLeaveRules, validate, reviewLeave);

export default router;
