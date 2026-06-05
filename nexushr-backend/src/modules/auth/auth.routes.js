import { Router } from 'express';
import { loginHandler, refreshHandler, logoutHandler, meHandler } from './auth.controller.js';
import { loginRules } from './auth.validator.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

router.post('/login', loginRules, validate, loginHandler);
router.post('/refresh', refreshHandler);
router.post('/logout', authenticate, logoutHandler);
router.get('/me', authenticate, meHandler);

export default router;
