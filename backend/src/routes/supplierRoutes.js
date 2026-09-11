import express from 'express';
import {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierLedger,
  recordPayment,
} from '../controllers/supplierController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/',       getSuppliers);
router.get('/:id',    getSupplierById);
router.post('/',      authorize('admin'), createSupplier);
router.put('/:id',    authorize('admin'), updateSupplier);
router.delete('/:id', authorize('admin'), deleteSupplier);

// Ledger & Payments
router.get('/:id/ledger', getSupplierLedger);
router.post('/:id/pay',   authorize('admin'), recordPayment);

export default router;
