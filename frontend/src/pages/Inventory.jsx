/**
 * pages/Inventory.jsx
 * KrushiMitra AI — Inventory & Stock Management
 * Features: Stock In, Stock Out, Low Stock Alerts, Expiry Alerts, Purchase Entry
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Boxes, Plus, Search, ArrowUpCircle, ArrowDownCircle,
  AlertTriangle, X, Save, RefreshCw, Filter,
  TrendingDown, TrendingUp, Clock, Package
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const TABS = ['All Stock', 'Low Stock', 'Near Expiry', 'Expired'];

const Inventory = () => {
  const [tab, setTab] = useState('All Stock');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showStockModal, setShowStockModal] = useState(null); // { product, type: 'in'|'out' }
  const [stockQty, setStockQty] = useState('');
  const [stockNote, setStockNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchProducts(); }, [tab, search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = { limit: 100, search };
      if (tab === 'Low Stock') params.lowStock = true;
      if (tab === 'Near Expiry') params.nearExpiry = true;
      if (tab === 'Expired') params.expired = true;

      const { data } = await api.get('/products', { params });
      let items = data.data || [];

      // Client-side filter for expiry tabs since backend may not support it
      const now = new Date();
      const in30 = new Date(); in30.setDate(now.getDate() + 30);
      if (tab === 'Low Stock') items = items.filter(p => p.stock > 0 && p.stock <= (p.minStock || 10));
      if (tab === 'Near Expiry') items = items.filter(p => p.expiryDate && new Date(p.expiryDate) > now && new Date(p.expiryDate) <= in30);
      if (tab === 'Expired') items = items.filter(p => p.expiryDate && new Date(p.expiryDate) < now);

      setProducts(items);
    } catch (err) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleStockAdjust = async () => {
    const qty = parseFloat(stockQty);
    if (!qty || qty <= 0) { toast.error('Enter a valid quantity'); return; }
    setSaving(true);
    try {
      const type = showStockModal.type;
      await api.post('/inventory/adjust', {
        productId: showStockModal.product._id,
        type: type === 'in' ? 'stock_in' : 'stock_out',
        quantity: qty,
        notes: stockNote,
      });
      toast.success(`Stock ${type === 'in' ? 'added' : 'reduced'} successfully`);
      setShowStockModal(null);
      setStockQty('');
      setStockNote('');
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to adjust stock');
    } finally {
      setSaving(false);
    }
  };

  const getBadge = (p) => {
    const now = new Date();
    if (p.stock === 0) return { label: 'Out of Stock', cls: 'bg-red-500/10 text-red-400 border-red-500/20' };
    if (p.expiryDate && new Date(p.expiryDate) < now) return { label: 'Expired', cls: 'bg-red-500/10 text-red-400 border-red-500/20' };
    const in30 = new Date(); in30.setDate(now.getDate() + 30);
    if (p.expiryDate && new Date(p.expiryDate) <= in30) return { label: 'Near Expiry', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    if (p.stock <= (p.minStock || 10)) return { label: 'Low Stock', cls: 'bg-orange-500/10 text-orange-400 border-orange-500/20' };
    return { label: 'In Stock', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Boxes className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Inventory</h1>
            <p className="text-sm text-text-secondary">Track stock levels and movements</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl bg-bg-secondary border border-border-color text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 w-52"
            />
          </div>
          <button onClick={fetchProducts} className="p-2 rounded-xl border border-border-color text-text-secondary hover:bg-bg-secondary transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              tab === t
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                : 'text-text-secondary border border-border-color hover:bg-bg-secondary'
            }`}
          >
            {t === 'Low Stock' && <AlertTriangle className="inline h-3.5 w-3.5 mr-1.5 text-amber-400" />}
            {t === 'Near Expiry' && <Clock className="inline h-3.5 w-3.5 mr-1.5 text-orange-400" />}
            {t === 'Expired' && <X className="inline h-3.5 w-3.5 mr-1.5 text-red-400" />}
            {t}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-color">
                <th className="text-left px-4 py-3 text-text-secondary font-medium">Product</th>
                <th className="text-left px-4 py-3 text-text-secondary font-medium">SKU</th>
                <th className="text-center px-4 py-3 text-text-secondary font-medium">Stock</th>
                <th className="text-center px-4 py-3 text-text-secondary font-medium">Min Stock</th>
                <th className="text-left px-4 py-3 text-text-secondary font-medium">Expiry</th>
                <th className="text-center px-4 py-3 text-text-secondary font-medium">Status</th>
                <th className="text-center px-4 py-3 text-text-secondary font-medium">Adjust Stock</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border-color/50">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-bg-secondary rounded animate-pulse w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-text-secondary">
                    <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>No products found for this filter</p>
                  </td>
                </tr>
              ) : products.map(p => {
                const badge = getBadge(p);
                return (
                  <motion.tr key={p._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="border-b border-border-color/50 hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-text-primary">{p.name}</p>
                      <p className="text-xs text-text-secondary">{p.category?.name || p.category || '—'}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary">{p.sku || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${p.stock === 0 ? 'text-red-400' : p.stock <= (p.minStock || 10) ? 'text-amber-400' : 'text-text-primary'}`}>
                        {p.stock} {p.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-text-secondary">{p.minStock || 10}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs">
                      {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-semibold border ${badge.cls}`}>{badge.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => { setShowStockModal({ product: p, type: 'in' }); setStockQty(''); setStockNote(''); }}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-xs font-medium"
                        >
                          <TrendingUp className="h-3.5 w-3.5" /> In
                        </button>
                        <button
                          onClick={() => { setShowStockModal({ product: p, type: 'out' }); setStockQty(''); setStockNote(''); }}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-xs font-medium"
                          disabled={p.stock === 0}
                        >
                          <TrendingDown className="h-3.5 w-3.5" /> Out
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjust Modal */}
      <AnimatePresence>
        {showStockModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && setShowStockModal(null)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="glass-panel rounded-2xl border border-border-color w-full max-w-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {showStockModal.type === 'in'
                    ? <ArrowUpCircle className="h-5 w-5 text-emerald-400" />
                    : <ArrowDownCircle className="h-5 w-5 text-red-400" />
                  }
                  <h2 className="font-bold text-text-primary">
                    Stock {showStockModal.type === 'in' ? 'In' : 'Out'}
                  </h2>
                </div>
                <button onClick={() => setShowStockModal(null)} className="p-1.5 rounded-lg text-text-secondary hover:bg-bg-secondary"><X className="h-4 w-4" /></button>
              </div>

              <div className="mb-4 p-3 bg-bg-secondary rounded-xl">
                <p className="font-semibold text-text-primary">{showStockModal.product.name}</p>
                <p className="text-sm text-text-secondary mt-1">
                  Current Stock: <span className="font-medium text-text-primary">{showStockModal.product.stock} {showStockModal.product.unit}</span>
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-text-secondary mb-1">
                    Quantity ({showStockModal.product.unit}) *
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={stockQty}
                    onChange={e => setStockQty(e.target.value)}
                    className="input-field"
                    placeholder="Enter quantity"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Note / Reason</label>
                  <input
                    type="text"
                    value={stockNote}
                    onChange={e => setStockNote(e.target.value)}
                    className="input-field"
                    placeholder="e.g. Purchase from supplier, Damaged goods..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowStockModal(null)} className="flex-1 py-2 rounded-xl border border-border-color text-text-secondary hover:bg-bg-secondary text-sm">Cancel</button>
                <button
                  onClick={handleStockAdjust}
                  disabled={saving}
                  className={`flex-1 py-2 rounded-xl text-content text-sm font-semibold transition-all ${
                    showStockModal.type === 'in'
                      ? 'bg-emerald-500 hover:bg-emerald-600'
                      : 'bg-red-500 hover:bg-red-600'
                  } disabled:opacity-50`}
                >
                  {saving ? 'Saving...' : `Confirm Stock ${showStockModal.type === 'in' ? 'In' : 'Out'}`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Inventory;
