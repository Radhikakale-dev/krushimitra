/**
 * pages/Customers.jsx
 * KrushiMitra AI — Customer Management
 * Features: Add/Edit/View customers, credit tracking, purchase history, outstanding balance
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Search, Edit2, Trash2, Eye, X, Save,
  Phone, Mail, MapPin, CreditCard, AlertCircle, ChevronDown,
  TrendingUp, FileText, IndianRupee
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  name: '', phone: '', email: '', address: '',
  gstNo: '', creditLimit: 0, notes: '',
};

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const searchRef = useRef(null);

  useEffect(() => { fetchCustomers(); }, [page, search]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/customers', { params: { page, limit: 15, search } });
      setCustomers(response.data || []);
      setTotal(response.pagination?.total || 0);
    } catch (err) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/customers/${editingId}`, form);
        toast.success('Customer updated successfully');
      } else {
        await api.post('/customers', form);
        toast.success('Customer added successfully');
      }
      setShowModal(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
      fetchCustomers();
    } catch (err) {
      toast.error(err.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (c) => {
    setForm({
      name: c.name, phone: c.phone, email: c.email || '',
      address: c.address || '', gstNo: c.gstNo || '',
      creditLimit: c.creditLimit || 0, notes: c.notes || '',
    });
    setEditingId(c._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    try {
      await api.delete(`/customers/${id}`);
      toast.success('Customer deleted');
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const openAdd = () => { setForm(EMPTY_FORM); setEditingId(null); setShowModal(true); };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Users className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Customers</h1>
            <p className="text-sm text-text-secondary">{total} total customers</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2 rounded-xl bg-bg-secondary border border-border-color text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 w-56"
            />
          </div>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Customer
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-color">
                <th className="text-left px-4 py-3 text-text-secondary font-medium">Name</th>
                <th className="text-left px-4 py-3 text-text-secondary font-medium">Phone</th>
                <th className="text-left px-4 py-3 text-text-secondary font-medium">GSTIN</th>
                <th className="text-right px-4 py-3 text-text-secondary font-medium">Credit Limit</th>
                <th className="text-right px-4 py-3 text-text-secondary font-medium">Outstanding</th>
                <th className="text-center px-4 py-3 text-text-secondary font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border-color/50">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-bg-secondary rounded animate-pulse w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-text-secondary">
                    <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>No customers found</p>
                  </td>
                </tr>
              ) : customers.map(c => (
                <motion.tr
                  key={c._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-border-color/50 hover:bg-bg-secondary/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">
                        {c.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">{c.name}</p>
                        <p className="text-xs text-text-secondary">{c.email || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{c.phone}</td>
                  <td className="px-4 py-3 text-text-secondary font-mono text-xs">{c.gstNo || '—'}</td>
                  <td className="px-4 py-3 text-right text-text-secondary">₹{(c.creditLimit || 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-semibold ${(c.outstandingBalance || 0) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      ₹{(c.outstandingBalance || 0).toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setShowDetail(c)} className="p-1.5 rounded-lg text-text-secondary hover:bg-primary-500/10 hover:text-primary-400 transition-colors" title="View">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleEdit(c)} className="p-1.5 rounded-lg text-text-secondary hover:bg-amber-500/10 hover:text-amber-400 transition-colors" title="Edit">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(c._id)} className="p-1.5 rounded-lg text-text-secondary hover:bg-red-500/10 hover:text-red-400 transition-colors" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="glass-panel rounded-2xl border border-border-color w-full max-w-lg p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-text-primary">{editingId ? 'Edit Customer' : 'Add New Customer'}</h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-text-secondary hover:bg-bg-secondary"><X className="h-4 w-4" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs text-text-secondary mb-1">Full Name *</label>
                    <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" placeholder="Customer name" />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Phone *</label>
                    <input required value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input-field" placeholder="9999999999" />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Email</label>
                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input-field" placeholder="email@example.com" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-text-secondary mb-1">Address</label>
                    <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="input-field min-h-[60px]" placeholder="Full address" />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">GSTIN</label>
                    <input value={form.gstNo} onChange={e => setForm(f => ({ ...f, gstNo: e.target.value.toUpperCase() }))} className="input-field uppercase" placeholder="27AAAAA0000A1Z5" />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Credit Limit (₹)</label>
                    <input type="number" min="0" value={form.creditLimit} onChange={e => setForm(f => ({ ...f, creditLimit: e.target.value }))} className="input-field" placeholder="0" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-text-secondary mb-1">Notes</label>
                    <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input-field min-h-[50px]" placeholder="Any notes about this customer..." />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl border border-border-color text-text-secondary hover:bg-bg-secondary text-sm">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : editingId ? 'Update' : 'Add Customer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetail && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && setShowDetail(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="glass-panel rounded-2xl border border-border-color w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-text-primary">Customer Details</h2>
                <button onClick={() => setShowDetail(null)} className="p-1.5 rounded-lg text-text-secondary hover:bg-bg-secondary"><X className="h-4 w-4" /></button>
              </div>
              <div className="flex items-center gap-4 mb-5">
                <div className="h-14 w-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-2xl font-bold text-blue-400">
                  {showDetail.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-lg">{showDetail.name}</h3>
                  <p className="text-text-secondary text-sm">{showDetail.phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-bg-secondary rounded-xl p-3">
                  <p className="text-xs text-text-secondary mb-1">Credit Limit</p>
                  <p className="font-bold text-text-primary">₹{(showDetail.creditLimit || 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-bg-secondary rounded-xl p-3">
                  <p className="text-xs text-text-secondary mb-1">Outstanding</p>
                  <p className={`font-bold ${(showDetail.outstandingBalance || 0) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    ₹{(showDetail.outstandingBalance || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              {showDetail.address && <div className="flex items-start gap-2 text-sm text-text-secondary mb-2"><MapPin className="h-4 w-4 mt-0.5 shrink-0" /><span>{showDetail.address}</span></div>}
              {showDetail.email && <div className="flex items-center gap-2 text-sm text-text-secondary mb-2"><Mail className="h-4 w-4 shrink-0" /><span>{showDetail.email}</span></div>}
              {showDetail.gstNo && <div className="flex items-center gap-2 text-sm text-text-secondary mb-2"><FileText className="h-4 w-4 shrink-0" /><span className="font-mono">{showDetail.gstNo}</span></div>}
              {showDetail.notes && <div className="mt-3 p-3 bg-bg-secondary rounded-xl text-sm text-text-secondary">{showDetail.notes}</div>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Customers;
