/**
 * routes/userRoutes.js
 * KrushiMitra AI — User Management Routes (Admin Only)
 */
import express from 'express';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/',        getUsers);
router.get('/:id',     getUserById);
router.put('/:id',     updateUser);
router.delete('/:id',  deleteUser);

export default router;
