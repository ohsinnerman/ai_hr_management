import { Router } from 'express';
import { body } from 'express-validator';
import {
  createJob,
  listJobs,
  getJob,
  updateJob,
  publishJob,
  listJobCandidates,
  applyCandidate,
  getCandidate,
  updateCandidateStage,
} from './recruitment.controller.js';
import { validate } from '../../middleware/validate.js';
import { requireRole } from '../../middleware/requireRole.js';
import { resumeUpload } from '../../config/multer.js';

// NOTE: `authenticate` is applied at mount time in server.js.
const router = Router();

const manageRoles = requireRole('hr_manager', 'recruiter', 'super_admin');

// ── Jobs ───────────────────────────────────────────────────
router.get('/jobs', listJobs);
router.post(
  '/jobs',
  manageRoles,
  [body('title').isString().trim().notEmpty(), body('description').isString().trim().notEmpty(), body('departmentId').isMongoId()],
  validate,
  createJob
);
router.get('/jobs/:id/candidates', listJobCandidates);
router.get('/jobs/:id', getJob);
router.put('/jobs/:id', manageRoles, updateJob);
router.post('/jobs/:id/publish', manageRoles, publishJob);

// ── Candidates ─────────────────────────────────────────────
// Apply with resume upload (multipart/form-data). Field name: "resume".
router.post(
  '/candidates',
  resumeUpload.single('resume'),
  [
    body('firstName').isString().trim().notEmpty(),
    body('lastName').isString().trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
  ],
  validate,
  applyCandidate
);
router.get('/candidates/:id', getCandidate);
router.patch('/candidates/:id/stage', manageRoles, updateCandidateStage);

export default router;
