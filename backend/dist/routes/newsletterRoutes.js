import { Router } from 'express';
import { subscribe, unsubscribe, getAllSubscribers, } from '../controllers/newsletterController.js';
import { authenticate, isAdmin } from '../middleware/auth.js';
const router = Router();
// Public routes
router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);
// Admin routes
router.get('/subscribers', authenticate, isAdmin, getAllSubscribers);
export default router;
