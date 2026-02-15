import { Router } from 'express';
import { getAddresses, addAddress, updateAddress, deleteAddress, } from '../controllers/addressController.js';
import { authenticate } from '../middleware/auth.js';
const router = Router();
// All address routes require authentication
router.use(authenticate);
router.get('/', getAddresses);
router.post('/', addAddress);
router.put('/:id', updateAddress);
router.delete('/:id', deleteAddress);
export default router;
