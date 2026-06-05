import { Router } from 'express';
import {
  chatHandler,
  uploadDocumentHandler,
  feedbackHandler,
  analyticsInsightsHandler,
} from './ai.controller.js';
import { requireRole } from '../../middleware/requireRole.js';
import { upload } from '../../config/multer.js';

// NOTE: `authenticate` is applied at mount time in server.js.
const router = Router();

// POST /api/v1/ai/chat — SSE streaming chat (any authenticated user)
router.post('/chat', chatHandler);

// POST /api/v1/ai/documents — upload a document to the RAG knowledge base (HR/Admin)
router.post('/documents', requireRole('hr_manager', 'super_admin'), upload.single('file'), uploadDocumentHandler);

// POST /api/v1/ai/feedback — thumbs up/down on an AI interaction
router.post('/feedback', feedbackHandler);

// GET /api/v1/ai/analytics/insights — Gemini-powered insights (HR/Admin)
router.get('/analytics/insights', requireRole('hr_manager', 'super_admin'), analyticsInsightsHandler);

export default router;
