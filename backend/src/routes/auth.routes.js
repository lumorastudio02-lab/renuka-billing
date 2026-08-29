import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authLimiter } from '../middleware/rate-limiter.js';
import { loginSchema, registerSchema, refreshTokenSchema } from '../validators/auth.validator.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/login', authLimiter, validate(loginSchema), AuthController.login);
router.post('/register', authLimiter, validate(registerSchema), AuthController.register);
router.post('/refresh-token', validate(refreshTokenSchema), AuthController.refreshToken);
router.post('/logout', authenticate, AuthController.logout);

export default router;
