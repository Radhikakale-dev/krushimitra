/**
 * routes/reportRoutes.js
 * KrushiMitra AI — Reports Routes
 */
import express from 'express';
import {
  getSalesReport,
  getProfitReport,
  getGSTReport,
  getInventoryReport,
  getExpenseReport,
  getCustomerReport,
  getSupplierReport,
  getCashBook,
} from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/sales',     getSalesReport);
router.get('/profit',    getProfitReport);
router.get('/gst',       getGSTReport);
router.get('/inventory', getInventoryReport);
router.get('/expense',   getExpenseReport);
router.get('/customer',  getCustomerReport);
router.get('/supplier',  getSupplierReport);
router.get('/cashbook',  getCashBook);

export default router;
