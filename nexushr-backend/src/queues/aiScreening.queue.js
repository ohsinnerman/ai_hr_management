import { Queue } from 'bullmq';
import { redis } from '../config/redis.js';

export const AI_SCREENING_QUEUE = 'ai-screening';

// Reuses the shared ioredis connection from Phase 1 (config/redis.js).
export const aiScreeningQueue = new Queue(AI_SCREENING_QUEUE, {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export const enqueueScreening = (payload) => aiScreeningQueue.add('screen', payload);
