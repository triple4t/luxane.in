import { Router } from 'express';
import { getAllUsers, updateUserRole, deleteUser } from '../controllers/userController.js';
import { authenticate, isAdmin } from '../middleware/auth.js';
const router = Router();
// Admin routes
router.get('/', authenticate, isAdmin, getAllUsers);
router.put('/:id/role', authenticate, isAdmin, updateUserRole);
router.delete('/:id', authenticate, isAdmin, deleteUser);
export default router;
