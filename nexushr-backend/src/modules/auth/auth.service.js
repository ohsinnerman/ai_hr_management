import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import User from '../../models/User.model.js';
import { redis } from '../../config/redis.js';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const REFRESH_TTL_SECONDS = 7 * 24 * 3600; // 7 days

// Small helper to throw an error the errorHandler understands.
const httpError = (status, code, message) => {
  const err = new Error(message || code);
  err.status = status;
  err.code = code;
  return err;
};

const signAccessToken = (user) =>
  jwt.sign(
    { userId: user._id, role: user.role, companyId: user.companyId?._id ?? user.companyId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

const signRefreshToken = (user) =>
  jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

/**
 * Authenticate a user by email + password.
 * Handles account lockout after repeated failures.
 */
export const login = async (email, password) => {
  const user = await User.findOne({ email: email?.toLowerCase() }).populate('companyId');

  if (!user || !user.isActive) {
    throw httpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  if (user.isLocked) {
    throw httpError(423, 'ACCOUNT_LOCKED', `Account locked until ${user.lockedUntil.toISOString()}`);
  }

  const ok = await user.comparePassword(password);
  if (!ok) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
    }
    await user.save();
    throw httpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  // Success — reset lock state.
  user.failedLoginAttempts = 0;
  user.lockedUntil = undefined;
  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  const refreshHash = await bcryptjs.hash(refreshToken, 10);
  await redis.setex(`refresh:${user._id}`, REFRESH_TTL_SECONDS, refreshHash);

  return { accessToken, refreshToken, user };
};

/**
 * Validate a refresh token (cookie) against the hash stored in Redis,
 * then issue a fresh access token.
 */
export const refresh = async (cookieToken) => {
  if (!cookieToken) throw httpError(401, 'UNAUTHORIZED', 'Missing refresh token');

  let payload;
  try {
    payload = jwt.verify(cookieToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw httpError(401, 'UNAUTHORIZED', 'Invalid refresh token');
  }

  const storedHash = await redis.get(`refresh:${payload.userId}`);
  if (!storedHash || !(await bcryptjs.compare(cookieToken, storedHash))) {
    throw httpError(401, 'UNAUTHORIZED', 'Refresh token no longer valid');
  }

  const user = await User.findById(payload.userId);
  if (!user || !user.isActive) throw httpError(401, 'UNAUTHORIZED', 'User not found or inactive');

  return { accessToken: signAccessToken(user) };
};

/**
 * Invalidate the stored refresh token for a user.
 */
export const logout = async (userId) => {
  await redis.del(`refresh:${userId}`);
};
