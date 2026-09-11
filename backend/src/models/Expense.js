/**
 * models/Expense.js
 * Shop expense tracking with category and payment mode.
 */
import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  title:    { type: String, required: [true, 'Title is required'], trim: true },
  category: {
    type: String,
    enum: ['Rent', 'Salary', 'Utilities', 'Maintenance', 'Transport', 'Marketing', 'Purchase', 'Other'],
    required: true,
  },
  amount:      { type: Number, required: true, min: [0, 'Amount cannot be negative'] },
  paymentMode: { type: String, enum: ['Cash', 'UPI', 'Card', 'Cheque', 'Bank Transfer'], default: 'Cash' },
  date:        { type: Date, default: Date.now },
  description: { type: String, trim: true, default: '' },
  receiptUrl:  { type: String, default: '' },              // Photo of receipt
  reference:   { type: String, trim: true, default: '' },  // Cheque no, UPI ref, etc.
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1 });

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;
