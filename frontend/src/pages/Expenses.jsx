/**
 * pages/Expenses.jsx
 * KrushiMitra AI — Expense Management
 * Features: Log, view, filter expenses by category, cash book summary
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, Plus, Search, Trash2, X, Save, Tag, IndianRupee } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Rent', 'Electricity', 'Salaries', 'Transport', 'Maintenance', 'Purchase', 'Miscellaneous'];

const EMPTY_FORM = { title: '', amount: '', category: 'Miscellaneous', date: new Date().toISOString().split('T')[0], notes: '' };

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [grandTotal, setGrandTotal] = useState(0);

  useEffect(() => { fetchExpenses(); }, [page, search]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/expenses', { params: { page, limit: 15, search } });
      setExpenses(data.data || []);
      setTotal(data.pagination?.total || 0);
      setGrandTotal(data.summary?.total || 0);
    } catch (err) {
      // If endpoint doesn't exist yet, use empty state gracefully
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.amount) { toast.error('Title and amount are required'); return; }
    setSaving(true);
    try {
      await api.post('/expenses', { ...form, amount: parseFloat(form.amount) });
      toast.success('Expense recorded');
      setShowModal(false);
      setForm(EMPTY_FORM);
      fetchExpenses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      toast.success('Expense deleted');
      fetchExpenses();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Receipt className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Expenses</h1>
            <p className="text-sm text-text-secondary">{total} records · Total: <span className="text-red-400 font-semibold">₹{grandTotal.toLocaleString('en-IN')}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
            <input type="text" placeholder="Search expenses..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2 rounded-xl bg-bg-secondary border border-border-color text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 w-48" />
          </div>
          <button onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Expense
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-color">
                <th className="text-left px-4 py-3 text-text-secondary font-medium">Title</th>
                <th className="text-left px-4 py-3 text-text-secondary font-medium">Category</th>
                <th className="text-left px-4 py-3 text-text-secondary font-medium">Date</th>
                <th className="text-right px-4 py-3 text-text-secondary font-medium">Amount</th>
                <th className="text-center px-4 py-3 text-text-secondary font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border-color/50">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-bg-secondary rounded animate-pulse w-24" /></td>
                    ))}
                  </tr>
                ))
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-text-secondary">
                    <Receipt className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>No expenses recorded yet</p>
                  </td>
                </tr>
              ) : expenses.map(exp => (
                <motion.tr key={exp._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="border-b border-border-color/50 hover:bg-bg-secondary/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-text-primary">{exp.title}</p>
                    {exp.notes && <p className="text-xs text-text-secondary">{exp.notes}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-bg-secondary border border-border-color text-text-secondary">
                      {exp.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    {new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-red-400">
                    ₹{(exp.amount || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleDelete(exp._id)} className="p-1.5 rounded-lg text-text-secondary hover:bg-red-500/10 hover:text-red-400 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > 15 && (
          <div className="flex justify-between items-center px-4 py-3 border-t border-border-color">
            <p className="text-sm text-text-secondary">Showing {Math.min(page * 15, total)} of {total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-sm text-text-secondary border border-border-color hover:bg-bg-secondary disabled:opacity-40">Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * 15 >= total} className="px-3 py-1.5 rounded-lg text-sm text-text-secondary border border-border-color hover:bg-bg-secondary disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="glass-panel rounded-2xl border border-border-color w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-text-primary">Add Expense</h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-text-secondary hover:bg-bg-secondary"><X className="h-4 w-4" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Title *</label>
                  <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input-field" placeholder="e.g. Electricity Bill" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Amount (₹) *</label>
                    <input required type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="input-field" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Date *</label>
                    <input required type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input-field">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input-field min-h-[60px]" placeholder="Optional notes..." />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl border border-border-color text-text-secondary hover:bg-bg-secondary text-sm">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                    <Save className="h-4 w-4" />{saving ? 'Saving...' : 'Add Expense'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Expenses;
