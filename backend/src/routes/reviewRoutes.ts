import { Router } from 'express';
import {
  createReview,
  getProductReviews,
  getUserReview,
  deleteReview,
} from '../controllers/reviewController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/product/:productId', getProductReviews);

// Protected routes
router.get('/product/:productId/user', authenticate, getUserReview);
router.post('/', authenticate, createReview);
router.delete('/:id', authenticate, deleteReview);

export default router;

