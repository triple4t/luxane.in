import { Router } from 'express';
import {
    register,
    sendSignupOtp,
    login,
    registerAdmin,
    loginAdmin,
    getMe,
    forgotPassword,
    verifyResetOtp,
    resetPassword,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Public routes with rate limiting
router.post('/send-signup-otp', authLimiter, sendSignupOtp);
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/admin/register', authLimiter, registerAdmin);
router.post('/admin/login', authLimiter, loginAdmin);
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/verify-reset-otp', passwordResetLimiter, verifyResetOtp);
router.post('/reset-password', passwordResetLimiter, resetPassword);

// Protected route (requires authentication)
router.get('/me', authenticate, getMe);

export default router;