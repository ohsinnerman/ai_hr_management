import mongoose from 'mongoose';
import { Company, Employee, LeaveBalance, AiInteraction, Document } from '../../models/index.js';
import { complete, stream, isGeminiConfigured } from './gemini.service.js';
import { embed } from './embeddings.js';
import { searchDocuments, buildChatSystem } from './chatService.js';
import { uploadToS3 } from '../../utils/s3Upload.js';
import { extractResumeText } from '../../utils/resumeParser.js';
import { success } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

// Stream a plain string to the client word-by-word so the fallback "types" like the model.
async function streamText(res, text) {
  const words = text.split(' ');
  for (let i = 0; i < words.length; i += 1) {
    res.write(`data: ${JSON.stringify({ text: words[i] + (i < words.length - 1 ? ' ' : '') })}\n\n`);
    // tiny delay for a natural typing feel without slowing things noticeably
    await new Promise((r) => setTimeout(r, 12));
  }
}

// Deterministic, data-grounded reply used when no live Gemini key is configured.
// Answers leave-balance questions from real data; otherwise gives a helpful pointer.
function buildFallbackReply(message, employee, leaveBalances) {
  const q = (message || '').toLowerCase();
  const name = employee?.firstName ? `, ${employee.firstName}` : '';

  if (/(leave|balance|holiday|vacation|sick|pto|day off|days off)/.test(q) && leaveBalances?.length) {
    const lines = leaveBalances.map((b) => {
      const available = (b.totalAllocated ?? 0) - (b.used ?? 0) - (b.pending ?? 0) + (b.carriedForward ?? 0);
      return `• ${b.leaveTypeId?.name ?? 'Leave'}: ${available} available (${b.used ?? 0} used, ${b.pending ?? 0} pending of ${b.totalAllocated ?? 0})`;
    });
    return `Here's your current leave balance${name}:\n\n${lines.join('\n')}\n\nYou can apply for leave from the Leaves page. For policy specifics, please check the company documents or contact HR.`;
  }

  if (/payslip|salary|pay|payroll/.test(q)) {
    return `You can view and download your payslips${name} from the Payslips page once a payroll run is approved and published. Each payslip shows your gross, deductions, and net pay.`;
  }
  if (/attendance|check.?in|check.?out|present|absent/.test(q)) {
    return `You can check in and out from the Attendance page${name}, and view your monthly calendar with present/absent/late days there.`;
  }

  return `I'm here to help with HR questions about leave, payroll, attendance, and company policies${name}. Try asking "What is my leave balance?" — for anything I can't answer, please reach out to your HR team.`;
}

/**
 * POST /api/v1/ai/chat — SSE streaming RAG chat.
 * Body: { message, sessionId, history: [{ role: 'user'|'assistant', content }] }
 */
export const chatHandler = asyncHandler(async (req, res) => {
  const { message, sessionId, history = [] } = req.body;
  const { userId, companyId } = req.user;

  if (!message?.trim()) {
    return res.status(400).json({ success: false, error: { code: 'MISSING_MESSAGE' } });
  }

  // 1. SSE headers — set before any res.write().
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable Nginx buffering
  res.flushHeaders();

  const startTime = Date.now();

  // 2. RAG context + live employee data (RAG needs an API key for embeddings).
  const [docs, employee] = await Promise.all([
    isGeminiConfigured() ? searchDocuments(message, companyId).catch(() => []) : Promise.resolve([]),
    Employee.findOne({ userId }).populate('departmentId designationId').lean(),
  ]);

  const leaveBalances = employee
    ? await LeaveBalance.find({ employeeId: employee._id, year: new Date().getFullYear() })
        .populate('leaveTypeId')
        .lean()
    : [];

  // 3. System instruction.
  const company = await Company.findById(companyId).lean();
  const system = buildChatSystem({
    companyName: company?.name ?? 'Your Company',
    employee: employee ?? { firstName: 'User', lastName: '', dateJoined: new Date() },
    policyChunks: docs,
    employeeData: { leaveBalances },
  });

  // 4. Frontend history → Gemini format.
  const geminiHistory = history.map((h) => ({
    role: h.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: h.content }],
  }));

  // 5. Stream tokens via SSE. With a live Gemini key we stream the model; otherwise we
  //    stream a deterministic, data-grounded fallback so the assistant stays useful.
  let fullText = '';
  if (isGeminiConfigured()) {
    try {
      for await (const token of stream({ system, history: geminiHistory, message })) {
        fullText += token;
        res.write(`data: ${JSON.stringify({ text: token })}\n\n`);
      }
    } catch (streamErr) {
      // Live key failed mid-stream — fall back rather than show a hard error.
      fullText = buildFallbackReply(message, employee, leaveBalances);
      await streamText(res, fullText);
    }
  } else {
    fullText = buildFallbackReply(message, employee, leaveBalances);
    await streamText(res, fullText);
  }

  // 6. Sources + done signal.
  res.write(`data: ${JSON.stringify({ type: 'sources', documents: docs.map((d) => ({ title: d.title })) })}\n\n`);
  res.write('data: [DONE]\n\n');
  res.end();

  // 7. Log asynchronously — never block the SSE response.
  AiInteraction.create({
    companyId,
    userId,
    sessionId,
    type: 'chat',
    inputText: message,
    outputText: fullText,
    modelUsed: 'gemini-2.0-flash',
    durationMs: Date.now() - startTime,
  }).catch(console.error);
});

/**
 * POST /api/v1/ai/documents — upload a company document to the RAG knowledge base.
 * Multipart: file (PDF/DOCX/TXT), title, category, employeeId?, isConfidential?
 */
export const uploadDocumentHandler = asyncHandler(async (req, res) => {
  const { userId, companyId } = req.user;
  const { title, category = 'other', employeeId, isConfidential = false } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ success: false, error: { code: 'NO_FILE_UPLOADED' } });
  }

  // 1. Upload raw file to S3/R2.
  const ext = (file.originalname.split('.').pop() || 'bin').toLowerCase();
  const key = `uploads/documents/${companyId}/${Date.now()}-${file.originalname}`;
  await uploadToS3(key, file.buffer, file.mimetype);

  // 2. Extract text (pdf-parse v2 / mammoth / utf-8 via shared resumeParser util).
  let contentText = '';
  try {
    contentText = await extractResumeText(file.buffer, file.originalname);
  } catch (parseErr) {
    console.warn('[Document] Text extraction failed:', parseErr.message);
  }

  // 3. Embed with Gemini text-embedding-004 (768 dims) — skip gracefully if no key/text.
  let embedding = [];
  if (contentText && isGeminiConfigured()) {
    try {
      embedding = await embed(contentText);
    } catch (embedErr) {
      console.warn('[Document] Embedding generation failed:', embedErr.message);
    }
  }

  // 4. Persist.
  const doc = await Document.create({
    companyId,
    employeeId: employeeId || null,
    title,
    fileUrl: key,
    fileType: ext,
    fileSizeBytes: file.size,
    category,
    isConfidential: isConfidential === 'true' || isConfidential === true,
    contentText,
    embedding,
    uploadedBy: userId,
  });

  return success(res, doc, 201);
});

/**
 * POST /api/v1/ai/feedback — thumbs up/down on an AI interaction.
 * Body: { interactionId, isHelpful, feedbackText? }
 */
export const feedbackHandler = asyncHandler(async (req, res) => {
  const { interactionId, isHelpful, feedbackText } = req.body;
  const { userId } = req.user;

  const interaction = await AiInteraction.findOneAndUpdate(
    { _id: interactionId, userId },
    { isHelpful, feedbackText },
    { new: true }
  );

  if (!interaction) {
    return res.status(404).json({ success: false, error: { code: 'INTERACTION_NOT_FOUND' } });
  }
  return success(res, { message: 'Feedback recorded' });
});

/**
 * GET /api/v1/ai/analytics/insights — Gemini-powered workforce insights (gemini-1.5-pro).
 * Returns the raw analytics payload plus parsed AI insights (null if no key).
 */
export const analyticsInsightsHandler = asyncHandler(async (req, res) => {
  const { companyId } = req.user;
  const cid = new mongoose.Types.ObjectId(companyId);

  const [totalEmployees, recentlyLeft, deptBreakdown, avgTenure] = await Promise.all([
    Employee.countDocuments({ companyId, deletedAt: null, employmentStatus: 'active' }),
    Employee.countDocuments({
      companyId,
      employmentStatus: 'terminated',
      dateLeft: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
    }),
    Employee.aggregate([
      { $match: { companyId: cid, deletedAt: null } },
      { $group: { _id: '$departmentId', count: { $sum: 1 } } },
    ]),
    Employee.aggregate([
      { $match: { companyId: cid, deletedAt: null } },
      { $project: { tenureDays: { $divide: [{ $subtract: [new Date(), '$dateJoined'] }, 86400000] } } },
      { $group: { _id: null, avg: { $avg: '$tenureDays' } } },
    ]),
  ]);

  const attritionRate = totalEmployees > 0 ? ((recentlyLeft / totalEmployees) * 100).toFixed(1) : 0;

  const analyticsPayload = {
    totalEmployees,
    attritionRate: `${attritionRate}%`,
    recentlyLeft,
    avgTenureDays: Math.round(avgTenure[0]?.avg ?? 0),
    deptBreakdown,
  };

  const prompt = `You are an HR analytics expert. Analyze the following company workforce data and provide:
1. Key risks and trends
2. Top 3 actionable recommendations for HR
3. Attrition risk assessment

Data: ${JSON.stringify(analyticsPayload)}

Return ONLY a valid JSON object:
{
  "summary": "2-3 sentence executive summary",
  "risks": ["list of identified risks"],
  "recommendations": ["3 specific, actionable HR recommendations"],
  "attritionRiskLevel": "low|medium|high",
  "attritionInsight": "1-2 sentence explanation of attrition risk"
}`;

  let insights = null;
  if (isGeminiConfigured()) {
    try {
      const raw = await complete({
        system: 'You are an expert HR analytics AI.',
        user: prompt,
        // gemini-1.5-pro is retired on the current API (404); gemini-2.0-flash is the supported model.
        model: 'gemini-2.0-flash',
        maxTokens: 1024,
      });
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      insights = JSON.parse(cleaned);
    } catch (err) {
      console.warn('[Analytics] Gemini insights failed:', err.message);
    }
  }

  return success(res, { analytics: analyticsPayload, insights });
});
