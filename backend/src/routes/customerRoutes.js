import express from 'express';
import {
  searchCustomers,
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerLedger,
} from '../controllers/customerController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/search', searchCustomers);
router.get('/',       getCustomers);
router.get('/:id',    getCustomerById);
router.post('/',      createCustomer);
router.put('/:id',    updateCustomer);
router.delete('/:id', authorize('admin'), deleteCustomer);

router.get('/:id/ledger', getCustomerLedger);

export default router;
