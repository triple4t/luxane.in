import { Router } from 'express';
import { createOrder, getOrders, getOrder, cancelOrder, getAllOrders, updateOrderStatus, } from '../controllers/orderController.js';
import { authenticate, isAdmin } from '../middleware/auth.js';
const router = Router();
// User routes
router.post('/', authenticate, createOrder);
router.get('/', authenticate, getOrders);
router.get('/:id', authenticate, getOrder);
router.put('/:id/cancel', authenticate, cancelOrder);
// Admin routes
router.get('/admin/all', authenticate, isAdmin, getAllOrders);
router.put('/admin/:id/status', authenticate, isAdmin, updateOrderStatus);
export default router;
