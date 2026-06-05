import { Worker } from 'bullmq';
import { redis } from '../config/redis.js';
import { AI_SCREENING_QUEUE } from '../queues/aiScreening.queue.js';
import { screenCandidate } from '../modules/ai/resumeScreener.js';

/**
 * Process one AI screening job: { candidateId, jobId }.
 */
export const processScreeningJob = async (job) => {
  const { candidateId, jobId } = job.data;
  const { analysis, usedFallback } = await screenCandidate(candidateId, jobId);
  return { candidateId, score: analysis.overall_score, recommendation: analysis.recommendation, usedFallback };
};

let worker;

/**
 * Start (once) the BullMQ AI screening worker on a dedicated blocking connection.
 */
export const createAiScreeningWorker = () => {
  if (worker) return worker;
  worker = new Worker(AI_SCREENING_QUEUE, processScreeningJob, {
    connection: redis.duplicate(),
    concurrency: 3,
  });
  worker.on('completed', (job, result) =>
    console.log(`[AI Screening] Job ${job.id} done — score ${result?.score} (${result?.recommendation})${result?.usedFallback ? ' [fallback]' : ''}`)
  );
  worker.on('failed', (job, err) =>
    console.error(`[AI Screening] Job ${job?.id} failed:`, err?.message)
  );
  console.log('[BullMQ] AI screening worker started');
  return worker;
};
