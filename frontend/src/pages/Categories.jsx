/**
 * pages/Categories.jsx
 * KrushiMitra AI — Category Management
 * Features: Add/Edit/Delete categories, color picker, product counts
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tags, Plus, Search, Edit2, Trash2, X, Save,
  RefreshCw, Package, FolderOpen
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const COLORS = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#6366f1',
  '#84cc16', '#e11d48',
];

const EMPTY_FORM = { name: '', description: '', color: '#22c55e', icon: 'tag' };

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCategories(); }, [search]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories', { params: { search, includeInactive: 'true' } });
      setCategories(res.data || []);
    } catch (err) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Category name is required'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, form);
        toast.success('Category updated');
      } else {
        await api.post('/categories', form);
        toast.success('Category created');
      }
      setShowModal(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      toast.error(err.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (c) => {
    setForm({
      name: c.name,
      description: c.description || '',
      color: c.color || '#22c55e',
      icon: c.icon || 'tag',
    });
    setEditingId(c._id);
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"?`)) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Category deleted');
      fetchCategories();
    } catch (err) {
      toast.error(err.message || 'Failed to delete category');
    }
  };

  const handleToggleActive = async (c) => {
    try {
      await api.put(`/categories/${c._id}`, { isActive: !c.isActive });
      toast.success(`Category ${c.isActive ? 'deactivated' : 'activated'}`);
      fetchCategories();
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const openAdd = () => { setForm(EMPTY_FORM); setEditingId(null); setShowModal(true); };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Tags className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Categories</h1>
            <p className="text-sm text-text-secondary">{categories.length} categories</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl bg-bg-secondary border border-border-color text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 w-52"
            />
          </div>
          <button onClick={fetchCategories} className="p-2 rounded-xl border border-border-color text-text-secondary hover:bg-bg-secondary transition-colors">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Category
          </button>
        </div>
      </div>

      {/* Category Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass-panel rounded-2xl p-5 border border-border-color animate-pulse">
              <div className="h-10 w-10 bg-bg-secondary rounded-xl mb-3" />
              <div className="h-5 bg-bg-secondary rounded w-28 mb-2" />
              <div className="h-3 bg-bg-secondary rounded w-40" />
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="glass-panel rounded-2xl border border-border-color p-16 text-center">
          <FolderOpen className="h-12 w-12 mx-auto mb-3 text-text-secondary opacity-30" />
          <p className="text-text-secondary">No categories found</p>
          <button onClick={openAdd} className="btn-primary mt-4 mx-auto">
            <Plus className="h-4 w-4 mr-1 inline" /> Create your first category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((c, idx) => (
            <motion.div
              key={c._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className={`glass-panel rounded-2xl p-5 border border-border-color hover:border-opacity-60 transition-all group relative ${!c.isActive ? 'opacity-50' : ''}`}
            >
              {/* Color indicator */}
              <div className="flex items-start justify-between mb-3">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center border"
                  style={{
                    backgroundColor: `${c.color}15`,
                    borderColor: `${c.color}30`,
                    color: c.color,
                  }}
                >
                  <Tags className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(c)}
                    className="p-1.5 rounded-lg text-text-secondary hover:bg-amber-500/10 hover:text-amber-400 transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(c._id, c.name)}
                    className="p-1.5 rounded-lg text-text-secondary hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="font-semibold text-text-primary mb-1">{c.name}</h3>
              {c.description && (
                <p className="text-xs text-text-secondary mb-3 line-clamp-2">{c.description}</p>
              )}

              <div className="flex items-center justify-between mt-auto pt-2">
                <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                  <Package className="h-3.5 w-3.5" />
                  <span>{c.productCount || 0} products</span>
                </div>
                <button
                  onClick={() => handleToggleActive(c)}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    c.isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}
                >
                  {c.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

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
              className="glass-panel rounded-2xl border border-border-color w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-text-primary">
                  {editingId ? 'Edit Category' : 'New Category'}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-text-secondary hover:bg-bg-secondary">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Category Name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="input-field"
                    placeholder="e.g. Fertilizers, Seeds, Pesticides"
                  />
                </div>

                <div>
                  <label className="block text-xs text-text-secondary mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="input-field min-h-[60px]"
                    placeholder="Brief description of this category..."
                  />
                </div>

                <div>
                  <label className="block text-xs text-text-secondary mb-2">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, color }))}
                        className={`h-8 w-8 rounded-lg border-2 transition-all ${
                          form.color === color
                            ? 'border-white scale-110 shadow-lg'
                            : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl border border-border-color text-text-secondary hover:bg-bg-secondary text-sm"
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
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

export default Categories;
