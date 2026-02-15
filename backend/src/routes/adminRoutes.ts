import { Router } from 'express';
import { getDashboardStats } from '../controllers/adminController.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/dashboard', authenticate, isAdmin, getDashboardStats);

export default router;

