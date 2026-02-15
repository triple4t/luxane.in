import { Router } from 'express';
import { getProducts, getProduct, getProductBySlug, searchProducts, getCategories, getCollections, createProduct, updateProduct, deleteProduct, uploadProductImage, uploadProductImages, deleteProductImage, } from '../controllers/productController.js';
import { authenticate, isAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
const router = Router();
// Public routes
router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/categories', getCategories);
router.get('/collections', getCollections);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', getProduct);
// Admin routes
router.post('/', authenticate, isAdmin, createProduct);
router.put('/:id', authenticate, isAdmin, updateProduct);
router.delete('/:id', authenticate, isAdmin, deleteProduct);
router.post('/:id/image', authenticate, isAdmin, upload.single('image'), uploadProductImage);
router.post('/:id/images', authenticate, isAdmin, upload.array('images', 10), uploadProductImages);
router.delete('/:id/image', authenticate, isAdmin, deleteProductImage);
export default router;
