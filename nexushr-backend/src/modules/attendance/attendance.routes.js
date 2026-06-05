import { Router } from 'express';
import { checkIn, checkOut, getAttendance } from './attendance.controller.js';

// NOTE: `authenticate` is applied at mount time in server.js.
const router = Router();

// Hyphenated (per Phase 3 acceptance criteria) + non-hyphenated aliases (per API.md).
router.post(['/check-in', '/checkin'], checkIn);
router.post(['/check-out', '/checkout'], checkOut);

router.get('/', getAttendance);

export default router;
