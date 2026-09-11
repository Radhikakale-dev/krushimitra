/**
 * routes/billRoutes.js
 * KrushiMitra AI — Bill / POS Invoice Routes
 */
import express from 'express';
import {
  createBill,
  getBills,
  getBillById,
  getNextInvoiceNo,
  cancelBill,
} from '../controllers/billController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All bill routes require authentication
router.use(protect);

// Get next invoice number (POS preview)
router.get('/next-invoice', getNextInvoiceNo);

// Bill list (paginated + filtered)
router.get('/', getBills);

// Create new bill
router.post('/', createBill);

// Single bill (for reprint / view)
router.get('/:id', getBillById);

// Cancel bill — admin only
router.put('/:id/cancel', authorize('admin'), cancelBill);

export default router;
