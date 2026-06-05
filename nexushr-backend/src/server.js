import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';

import { connectDB } from './config/db.js';
import { connectRedis, redis } from './config/redis.js';
import { logger } from './config/logger.js';
import { swaggerSpec } from './config/swagger.js';
import './models/index.js'; // register all Mongoose schemas (so populate/ref works)

import { apiLimiter, authLimiter, aiLimiter } from './middleware/rateLimiter.js';
import { authenticate } from './middleware/authenticate.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRouter from './modules/auth/auth.routes.js';
import departmentRouter from './modules/departments/department.routes.js';
import designationRouter from './modules/designations/designation.routes.js';
import employeeRouter from './modules/employees/employee.routes.js';
import attendanceRouter from './modules/attendance/attendance.routes.js';
import leaveRouter from './modules/leaves/leave.routes.js';
import payrollRouter from './modules/payroll/payroll.routes.js';
import recruitmentRouter from './modules/recruitment/recruitment.routes.js';
import aiRouter from './modules/ai/ai.routes.js';
import analyticsRouter from './modules/analytics/analytics.routes.js';
import dashboardRouter from './modules/dashboard/dashboard.routes.js';
import performanceRouter from './modules/performance/performance.routes.js';

import { createPayrollWorker } from './workers/payrollWorker.js';
import { createAiScreeningWorker } from './workers/aiScreeningWorker.js';
import { startAttritionCron } from './jobs/attritionCron.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security & parsing middleware ──────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// ── Rate limiting (tiered; specific overrides before the catch-all) ──
app.use('/api/v1/auth', authLimiter); // 10/min
app.use('/api/v1/ai/chat', aiLimiter); // 20/min
app.use('/api/v1', apiLimiter); // 100/min

// ── API docs (public) ──────────────────────────────────────
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { background-color: #1a1a2e; }',
    customSiteTitle: 'NexusHR API Docs',
  })
);
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

// ── Health check (no auth) — reports DB + Redis status ─────
app.get('/api/v1/health', async (req, res) => {
  const dbState = mongoose.connection.readyState; // 1 = connected
  let redisOk = false;
  try {
    await redis.ping();
    redisOk = true;
  } catch (_) {
    redisOk = false;
  }
  const healthy = dbState === 1 && redisOk;
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      mongodb: dbState === 1 ? 'connected' : 'disconnected',
      redis: redisOk ? 'connected' : 'disconnected',
    },
  });
});

// ── Routes ─────────────────────────────────────────────────
app.use('/api/v1/auth', authRouter);
// Phase 2 — Core HR
app.use('/api/v1/departments', authenticate, departmentRouter);
app.use('/api/v1/designations', authenticate, designationRouter);
app.use('/api/v1/employees', authenticate, employeeRouter);
// Phase 3 — Attendance & Leave
app.use('/api/v1/attendance', authenticate, attendanceRouter);
app.use('/api/v1/leaves', authenticate, leaveRouter);
// Phase 4 — Payroll
app.use('/api/v1/payroll', authenticate, payrollRouter);
// Phase 5 — Recruitment & AI screening
app.use('/api/v1/recruitment', authenticate, recruitmentRouter);
// Phase 7 — AI Chat (RAG), Document upload, Analytics
app.use('/api/v1/ai', authenticate, aiRouter);
app.use('/api/v1/analytics', authenticate, analyticsRouter);
// Phase 8 — Dashboards & Performance Reviews
app.use('/api/v1/dashboard', authenticate, dashboardRouter);
app.use('/api/v1/performance', authenticate, performanceRouter);

// ── Error handler (must be last) ───────────────────────────
app.use(errorHandler);

// ── Startup ────────────────────────────────────────────────
const start = async () => {
  try {
    await connectDB();
    await connectRedis();
    createPayrollWorker(); // BullMQ payroll worker
    createAiScreeningWorker(); // BullMQ AI screening worker
    startAttritionCron(); // nightly attrition cache warm-up (02:00 IST)
    logger.info('[Cron] Attrition analysis scheduled for 02:00 AM IST nightly');

    const server = app.listen(PORT, () => {
      logger.info(`[Server] Running on http://localhost:${PORT}`);
    });

    // ── Graceful shutdown ──
    const shutdown = (signal) => {
      logger.info(`[Server] ${signal} received — shutting down gracefully...`);
      server.close(async () => {
        await mongoose.connection.close();
        logger.info('[Server] MongoDB connection closed');
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10000); // force-exit if it hangs
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.error(`[Server] Failed to start: ${err.message}`);
    process.exit(1);
  }
};

start();

export default app;
