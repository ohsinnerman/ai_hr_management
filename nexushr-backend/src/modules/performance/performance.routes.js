import { Router } from 'express';
import { requireRole } from '../../middleware/requireRole.js';
import {
  createReview,
  getMyReviews,
  getReview,
  submitSelfReview,
  submitManagerReview,
  completeReview,
  getTeamReviews,
  getAllReviews,
} from './performance.controller.js';

// NOTE: `authenticate` is applied at mount time in server.js.
const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Performance
 *     description: Performance review lifecycle (self → manager → HR → completed)
 * /performance:
 *   post:
 *     tags: [Performance]
 *     summary: HR creates a review for an employee (status → self_review)
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       201: { description: Review created }
 *       409: { description: Review already exists for this cycle }
 * /performance/{id}/self-review:
 *   patch:
 *     tags: [Performance]
 *     summary: Employee submits self-assessment (status → manager_review)
 *     security: [{ BearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Self-review submitted }
 * /performance/{id}/manager-review:
 *   patch:
 *     tags: [Performance]
 *     summary: Manager submits assessment; Gemini recommendation fires async (status → hr_review)
 *     security: [{ BearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Manager review submitted }
 */

router.post('/', requireRole('hr_manager', 'super_admin'), createReview);
router.get('/me', getMyReviews);
router.get('/team', requireRole('senior_manager', 'hr_manager', 'super_admin'), getTeamReviews);
router.get('/all', requireRole('hr_manager', 'super_admin'), getAllReviews);
router.get('/:id', getReview);
router.patch('/:id/self-review', submitSelfReview);
router.patch('/:id/manager-review', requireRole('senior_manager', 'hr_manager', 'super_admin'), submitManagerReview);
router.patch('/:id/complete', requireRole('hr_manager', 'super_admin'), completeReview);

export default router;
