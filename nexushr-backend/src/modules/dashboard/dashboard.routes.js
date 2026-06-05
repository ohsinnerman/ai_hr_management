import { Router } from 'express';
import { requireRole } from '../../middleware/requireRole.js';
import {
  adminDashboard,
  hrDashboard,
  recruiterDashboard,
  managerDashboard,
  employeeDashboard,
} from './dashboard.controller.js';

// NOTE: `authenticate` is applied at mount time in server.js.
const router = Router();

router.get('/admin', requireRole('super_admin'), adminDashboard);
router.get('/hr', requireRole('hr_manager', 'super_admin'), hrDashboard);
router.get('/recruiter', requireRole('recruiter', 'hr_manager', 'super_admin'), recruiterDashboard);
router.get('/manager', requireRole('senior_manager', 'hr_manager', 'super_admin'), managerDashboard);
router.get('/employee', employeeDashboard); // all roles

export default router;
