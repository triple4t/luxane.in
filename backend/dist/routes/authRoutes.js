import { Router } from 'express';
import { register, login, verifyLoginOtp, registerAdmin, loginAdmin, getMe, forgotPassword, resetPassword, } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter.js';
const router = Router();
// Public routes with rate limiting
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/verify-login-otp', authLimiter, verifyLoginOtp);
router.post('/admin/register', authLimiter, registerAdmin);
router.post('/admin/login', authLimiter, loginAdmin);
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPassword);
// Protected route (requires authentication)
router.get('/me', authenticate, getMe);
export default router;
