import { Router } from 'express';
import { loginHandler, refreshHandler, logoutHandler, meHandler } from './auth.controller.js';
import { loginRules } from './auth.validator.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication & session
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login and receive a JWT access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: hrmanager@fwcit.com }
 *               password: { type: string, example: Demo@1234 }
 *     responses:
 *       200: { description: Login successful — accessToken returned, refreshToken set as HttpOnly cookie }
 *       401: { description: Invalid credentials }
 */
router.post('/login', loginRules, validate, loginHandler);
router.post('/refresh', refreshHandler);
router.post('/logout', authenticate, logoutHandler);
router.get('/me', authenticate, meHandler);

export default router;
