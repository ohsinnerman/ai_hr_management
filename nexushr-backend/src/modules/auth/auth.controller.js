import * as authService from './auth.service.js';
import User from '../../models/User.model.js';
import Employee from '../../models/Employee.model.js';
import { success } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const REFRESH_COOKIE = 'refreshToken';
const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 3600 * 1000, // 7 days
};

// POST /api/v1/auth/login
export const loginHandler = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { accessToken, refreshToken, user } = await authService.login(email, password);

  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);

  success(res, {
    accessToken,
    tokenType: 'bearer',
    expiresIn: 900,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      companyId: user.companyId?._id ?? user.companyId,
    },
  });
});

// POST /api/v1/auth/refresh
export const refreshHandler = asyncHandler(async (req, res) => {
  const cookieToken = req.cookies?.[REFRESH_COOKIE];
  const { accessToken } = await authService.refresh(cookieToken);
  success(res, { accessToken, expiresIn: 900 });
});

// POST /api/v1/auth/logout
export const logoutHandler = asyncHandler(async (req, res) => {
  await authService.logout(req.user.userId);
  res.clearCookie(REFRESH_COOKIE);
  success(res, { message: 'Logged out successfully' });
});

// GET /api/v1/auth/me
export const meHandler = asyncHandler(async (req, res) => {
  const [user, employee] = await Promise.all([
    User.findById(req.user.userId).populate('companyId').lean(),
    Employee.findOne({ userId: req.user.userId, deletedAt: null })
      .select('-bankDetails -panNumber -aadhaarNumber')
      .populate('departmentId designationId managerId')
      .lean(),
  ]);
  if (!user) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
  delete user.passwordHash;
  delete user.refreshTokenHash;
  success(res, { ...user, employee: employee || null });
});
