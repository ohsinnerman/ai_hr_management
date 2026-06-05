import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { connectDB } from './config/db.js';
import { connectRedis } from './config/redis.js';
import './models/index.js'; // register all Mongoose schemas (so populate/ref works)
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
import { createPayrollWorker } from './workers/payrollWorker.js';
import { createAiScreeningWorker } from './workers/aiScreeningWorker.js';
import { authenticate } from './middleware/authenticate.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security & parsing middleware ──────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// ── Health check (no auth) ─────────────────────────────────
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), version: '1.0.0' });
});

// ── Routes ─────────────────────────────────────────────────
app.use('/api/v1/auth', authRouter);
// Phase 2 — Core HR (all protected by authenticate at mount; RBAC on mutations within routers)
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

// ── Error handler (must be last) ───────────────────────────
app.use(errorHandler);

// ── Startup ────────────────────────────────────────────────
const start = async () => {
  try {
    await connectDB();
    await connectRedis();
    createPayrollWorker(); // start BullMQ payroll worker
    createAiScreeningWorker(); // start BullMQ AI screening worker
    app.listen(PORT, () => {
      console.log(`[Server] Running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err.message);
    process.exit(1);
  }
};

start();

export default app;
