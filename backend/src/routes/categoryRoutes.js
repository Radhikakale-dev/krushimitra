/**
 * routes/categoryRoutes.js
 * KrushiMitra AI — Category Routes
 */
import express from 'express';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getCategories);
router.get('/:id', getCategoryById);

// Admin-only mutations
router.post('/',       authorize('admin'), createCategory);
router.put('/:id',     authorize('admin'), updateCategory);
router.delete('/:id',  authorize('admin'), deleteCategory);

export default router;
