/**
 * routes/inventoryRoutes.js
 * KrushiMitra AI — Inventory Routes
 */
import express from 'express';
import {
  getInventoryLogs,
  processPurchaseEntry,
  adjustStock,
  getInventoryAlerts,
} from '../controllers/inventoryController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getInventoryLogs);
router.get('/alerts', getInventoryAlerts);
router.post('/purchase', authorize('admin'), processPurchaseEntry);
router.post('/adjust', authorize('admin'), adjustStock);

export default router;
