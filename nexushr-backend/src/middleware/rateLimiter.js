import rateLimit from 'express-rate-limit';

// Standard: 100 req/min for general API use.
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again in a minute.' } },
});

// Strict: 10 req/min for auth endpoints (brute-force protection).
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many login attempts, please try again in a minute.' } },
});

// AI: 20 req/min for AI chat (cost control).
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'AI rate limit reached. Please wait before sending more messages.' } },
});
