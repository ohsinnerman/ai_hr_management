import Redis from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL);

export const connectRedis = async () => {
  redis.on('connect', () => console.log('[Redis] Connected'));
  redis.on('error', (err) => console.error('[Redis] Error:', err.message));
};
