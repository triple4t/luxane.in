import { Router } from 'express';
import {
  createRazorpayOrder,
  verifyPayment,
  handleWebhook,
} from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Webhook doesn't require authentication (uses signature verification)
router.post('/webhook', handleWebhook);

// Payment routes require authentication
router.post('/create-order', authenticate, createRazorpayOrder);
router.post('/verify', authenticate, verifyPayment);

export default router;

