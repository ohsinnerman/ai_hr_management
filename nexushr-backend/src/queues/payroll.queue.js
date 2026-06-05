import { Queue } from 'bullmq';
import { redis } from '../config/redis.js';

export const PAYROLL_QUEUE = 'payroll';

// Reuses the shared ioredis connection from Phase 1 (config/redis.js).
export const payrollQueue = new Queue(PAYROLL_QUEUE, {
  connection: redis,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export const enqueuePayrollRun = (payload) => payrollQueue.add('process-run', payload);
