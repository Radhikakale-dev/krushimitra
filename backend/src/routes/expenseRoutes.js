/**
 * routes/expenseRoutes.js
 * KrushiMitra AI — Expense Management Routes
 */
import express from 'express';
import Expense from '../models/Expense.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

const router = express.Router();

// All expense routes require authentication
router.use(protect);

// GET /api/expenses — list with pagination & search
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 15, search = '', category = '' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const query = {};
  if (search) query.title = { $regex: search, $options: 'i' };
  if (category) query.category = category;

  const [expenses, total] = await Promise.all([
    Expense.find(query).sort({ date: -1 }).skip(skip).limit(Number(limit)).lean(),
    Expense.countDocuments(query),
  ]);

  // Total amount for the filtered set
  const aggResult = await Expense.aggregate([
    { $match: query },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  res.json({
    success: true,
    data: expenses,
    pagination: { total, page: Number(page), limit: Number(limit) },
    summary: { total: aggResult[0]?.total || 0 },
  });
}));

// POST /api/expenses — create new expense (admin only)
router.post('/', authorize('admin'), asyncHandler(async (req, res) => {
  const { title, amount, category, date, notes, paymentMode } = req.body;

  // Map frontend categories to backend enum
  const categoryMap = {
    'Salaries': 'Salary',
    'Electricity': 'Utilities',
    'Miscellaneous': 'Other',
  };
  const mappedCategory = categoryMap[category] || category;

  const expense = await Expense.create({
    title,
    amount: parseFloat(amount),
    category: mappedCategory,
    date: date ? new Date(date) : new Date(),
    description: notes || '',
    paymentMode: paymentMode || 'Cash',
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, data: expense });
}));

// DELETE /api/expenses/:id — delete expense (admin only)
router.delete('/:id', authorize('admin'), asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
  await expense.deleteOne();
  res.json({ success: true, message: 'Expense deleted' });
}));

export default router;
