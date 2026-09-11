/**
 * pages/Suppliers.jsx
 * KrushiMitra AI — Supplier Management
 * Features: Add/Edit/View suppliers, pending payments, purchase history
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck, Plus, Search, Edit2, Trash2, Eye, X, Save,
  Phone, Mail, MapPin, Building2, FileText, AlertCircle
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  name: '', companyName: '', phone: '', email: '', address: '',
  gstNo: '', panNo: '', bankName: '', bankAccount: '', ifscCode: '', notes: '',
};

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => { fetchSuppliers(); }, [page, search]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/suppliers', { params: { page, limit: 15, search } });
      setSuppliers(response.data || []);
      setTotal(response.pagination?.total || 0);
    } catch (err) {
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/suppliers/${editingId}`, form);
        toast.success('Supplier updated');
      } else {
        await api.post('/suppliers', form);
        toast.success('Supplier added');
      }
      setShowModal(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
      fetchSuppliers();
    } catch (err) {
      toast.error(err.message || 'Failed to save supplier');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (s) => {
    setForm({
      name: s.name, companyName: s.companyName || '',
      phone: s.phone, email: s.email || '', address: s.address || '',
      gstNo: s.gstNo || '', panNo: s.panNo || '',
      bankName: s.bankName || '', bankAccount: s.bankAccount || '', ifscCode: s.ifscCode || '',
      notes: s.notes || '',
    });
    setEditingId(s._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this supplier?')) return;
    try {
      await api.delete(`/suppliers/${id}`);
      toast.success('Supplier deleted');
      fetchSuppliers();
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
          <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <Truck className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Suppliers</h1>
            <p className="text-sm text-text-secondary">{total} total suppliers</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search suppliers..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2 rounded-xl bg-bg-secondary border border-border-color text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 w-56"
            />
          </div>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Supplier
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-color">
                <th className="text-left px-4 py-3 text-text-secondary font-medium">Supplier</th>
                <th className="text-left px-4 py-3 text-text-secondary font-medium">Phone</th>
                <th className="text-left px-4 py-3 text-text-secondary font-medium">GSTIN</th>
                <th className="text-right px-4 py-3 text-text-secondary font-medium">Pending Payment</th>
                <th className="text-center px-4 py-3 text-text-secondary font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border-color/50">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-bg-secondary rounded animate-pulse w-24" /></td>
                    ))}
                  </tr>
                ))
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-text-secondary">
                    <Truck className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>No suppliers found</p>
                  </td>
                </tr>
              ) : suppliers.map(s => (
                <motion.tr key={s._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="border-b border-border-color/50 hover:bg-bg-secondary/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-xs font-bold text-orange-400">
                        {s.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">{s.name}</p>
                        <p className="text-xs text-text-secondary">{s.companyName || s.email || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{s.phone}</td>
                  <td className="px-4 py-3 text-text-secondary font-mono text-xs">{s.gstNo || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-semibold ${(s.outstandingBalance || 0) > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      ₹{(s.outstandingBalance || 0).toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setShowDetail(s)} className="p-1.5 rounded-lg text-text-secondary hover:bg-primary-500/10 hover:text-primary-400 transition-colors"><Eye className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleEdit(s)} className="p-1.5 rounded-lg text-text-secondary hover:bg-amber-500/10 hover:text-amber-400 transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleDelete(s._id)} className="p-1.5 rounded-lg text-text-secondary hover:bg-red-500/10 hover:text-red-400 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
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

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="glass-panel rounded-2xl border border-border-color w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-text-primary">{editingId ? 'Edit Supplier' : 'Add Supplier'}</h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-text-secondary hover:bg-bg-secondary"><X className="h-4 w-4" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Contact Name *</label>
                    <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" placeholder="Contact person" />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Company Name</label>
                    <input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} className="input-field" placeholder="Company Pvt. Ltd." />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Phone *</label>
                    <input required value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input-field" placeholder="9999999999" />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Email</label>
                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input-field" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-text-secondary mb-1">Address</label>
                    <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="input-field min-h-[60px]" />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">GSTIN</label>
                    <input value={form.gstNo} onChange={e => setForm(f => ({ ...f, gstNo: e.target.value.toUpperCase() }))} className="input-field uppercase" />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">PAN</label>
                    <input value={form.panNo} onChange={e => setForm(f => ({ ...f, panNo: e.target.value.toUpperCase() }))} className="input-field uppercase" />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Bank Name</label>
                    <input value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Account No.</label>
                    <input value={form.bankAccount} onChange={e => setForm(f => ({ ...f, bankAccount: e.target.value }))} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">IFSC Code</label>
                    <input value={form.ifscCode} onChange={e => setForm(f => ({ ...f, ifscCode: e.target.value.toUpperCase() }))} className="input-field uppercase" />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Notes</label>
                    <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input-field" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl border border-border-color text-text-secondary hover:bg-bg-secondary text-sm">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : editingId ? 'Update' : 'Add Supplier'}
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && setShowDetail(null)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="glass-panel rounded-2xl border border-border-color w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-text-primary">Supplier Details</h2>
                <button onClick={() => setShowDetail(null)} className="p-1.5 rounded-lg text-text-secondary hover:bg-bg-secondary"><X className="h-4 w-4" /></button>
              </div>
              <div className="flex items-center gap-4 mb-5">
                <div className="h-14 w-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-2xl font-bold text-orange-400">
                  {showDetail.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-lg">{showDetail.name}</h3>
                  {showDetail.companyName && <p className="text-text-secondary text-sm">{showDetail.companyName}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-bg-secondary rounded-xl p-3">
                  <p className="text-xs text-text-secondary mb-1">Pending Payment</p>
                  <p className={`font-bold ${(showDetail.outstandingBalance || 0) > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    ₹{(showDetail.outstandingBalance || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-bg-secondary rounded-xl p-3">
                  <p className="text-xs text-text-secondary mb-1">Phone</p>
                  <p className="font-medium text-text-primary">{showDetail.phone}</p>
                </div>
              </div>
              {showDetail.address && <div className="flex items-start gap-2 text-sm text-text-secondary mb-2"><MapPin className="h-4 w-4 mt-0.5 shrink-0" /><span>{showDetail.address}</span></div>}
              {showDetail.gstNo && <div className="flex items-center gap-2 text-sm text-text-secondary mb-2"><FileText className="h-4 w-4" /><span className="font-mono">{showDetail.gstNo}</span></div>}
              {showDetail.bankName && (
                <div className="mt-3 p-3 bg-bg-secondary rounded-xl">
                  <p className="text-xs text-text-secondary mb-2 font-medium">Bank Details</p>
                  <p className="text-sm text-text-primary">{showDetail.bankName}</p>
                  {showDetail.bankAccount && <p className="text-sm text-text-secondary font-mono">{showDetail.bankAccount} ({showDetail.ifscCode})</p>}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Suppliers;
