/**
 * routes/productRoutes.js
 * KrushiMitra AI — Product CRUD + POS Search Routes
 */
import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
} from '../controllers/productController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// POS fast search (available to all authenticated users)
router.get('/search', searchProducts);

// Full product list (admin + employee)
router.get('/', getProducts);

// Single product
router.get('/:id', getProductById);

// Create / Update / Delete — admin only
router.post('/',    authorize('admin'), createProduct);
router.put('/:id',  authorize('admin'), updateProduct);
router.delete('/:id', authorize('admin'), deleteProduct);

export default router;
