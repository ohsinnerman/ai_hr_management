import { Router } from 'express';
import { headcount, attrition, departments, leaveSummary } from './analytics.controller.js';
import { requireRole } from '../../middleware/requireRole.js';

// NOTE: `authenticate` is applied at mount time in server.js.
// All analytics endpoints are HR / Super Admin only.
const router = Router();

router.use(requireRole('hr_manager', 'super_admin'));

router.get('/headcount', headcount);
router.get('/attrition', attrition);
router.get('/departments', departments);
router.get('/leave-summary', leaveSummary);

export default router;
