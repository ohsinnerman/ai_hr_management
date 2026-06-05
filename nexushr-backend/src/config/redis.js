import Redis from 'ioredis';

// maxRetriesPerRequest: null is required for BullMQ (queue + blocking worker
// connections). The same client is safely reused for app caching/JWT blacklist.
export const redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });

export const connectRedis = async () => {
  redis.on('connect', () => console.log('[Redis] Connected'));
  redis.on('error', (err) => console.error('[Redis] Error:', err.message));
};
