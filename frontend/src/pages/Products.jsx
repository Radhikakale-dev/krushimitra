import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Package, 
  Search, 
  Plus, 
  Download, 
  Edit2, 
  Trash2, 
  X, 
  AlertTriangle, 
  CheckCircle,
  AlertCircle,
  Filter,
  TrendingUp
} from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Table filters & pagination states
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Form Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Fertilizers',
    price: '',
    purchasePrice: '',
    stock: '',
    minStock: '',
    supplier: ''
  });

  // Pre-set categories list
  const categoriesList = ['Fertilizers', 'Pesticides', 'Seeds', 'Herbicides', 'Tools'];

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      if (res.success) {
        setProducts(res.data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Show status updates temporarily
  const triggerNotification = (type, text) => {
    if (type === 'success') {
      setSuccessMsg(text);
      setTimeout(() => setSuccessMsg(''), 3000);
    } else {
      setErrorMsg(text);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Open modal for Create Product
  const handleCreateOpen = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      category: 'Fertilizers',
      price: '',
      purchasePrice: '',
      stock: '',
      minStock: '',
      supplier: ''
    });
    setModalOpen(true);
  };

  // Open modal for Edit Product
  const handleEditOpen = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category?.name || '',
      price: (product.sellingPrice || 0).toString(),
      purchasePrice: (product.purchasePrice || 0).toString(),
      stock: (product.stock || 0).toString(),
      minStock: product.minStock.toString(),
      supplier: product.supplier?.name || ''
    });
    setModalOpen(true);
  };

  // Submit product form (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Input Validations
    if (parseFloat(formData.price) < parseFloat(formData.purchasePrice)) {
      return triggerNotification('error', 'Selling price cannot be less than purchase cost.');
    }
    if (parseInt(formData.stock) < 0 || parseInt(formData.minStock) < 0) {
      return triggerNotification('error', 'Stock numbers cannot be negative.');
    }

    try {
      const payload = { ...formData, sellingPrice: formData.price };
      delete payload.price;

      if (editingProduct) {
        // Update product
        const res = await api.put(`/products/${editingProduct._id}`, payload);
        if (res.success) {
          triggerNotification('success', 'Product updated successfully.');
          setModalOpen(false);
          fetchProducts();
        }
      } else {
        // Create product
        const res = await api.post('/products', payload);
        if (res.success) {
          triggerNotification('success', 'Product added successfully.');
          setModalOpen(false);
          fetchProducts();
        }
      }
    } catch (err) {
      triggerNotification('error', err.message || 'Action failed.');
    }
  };

  // Delete product action
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product from the inventory catalog?')) {
      try {
        const res = await api.delete(`/products/${id}`);
        if (res.success) {
          triggerNotification('success', 'Product removed successfully.');
          fetchProducts();
        }
      } catch (err) {
        triggerNotification('error', err.message || 'Failed to delete product.');
      }
    }
  };

  // Export data as Excel/CSV download helper
  const handleExportCSV = () => {
    if (products.length === 0) return;
    
    const headers = ['Product ID', 'Name', 'SKU', 'Category', 'Selling Price (Rs)', 'Purchase Cost (Rs)', 'Stock Level', 'Min Safe stock', 'Supplier'];
    const csvRows = [
      headers.join(','),
      ...products.map(p => [
        p._id,
        `"${p.name.replace(/"/g, '""')}"`,
        p.sku,
        p.category,
        p.price,
        p.purchasePrice,
        p.stock,
        p.minStock,
        `"${p.supplier?.replace(/"/g, '""') || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `krushimitra_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter Catalog lists
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === '' || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  // Pagination logic
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  // Statistics summaries
  const totalProductsValue = products.reduce((acc, curr) => acc + (curr.stock * curr.price), 0);
  const lowStockProductsCount = products.filter(p => p.stock <= p.minStock).length;

  return (
    <div className="p-6 space-y-6">
      {/* Notifications overlay */}
      {successMsg && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-emerald-950 border border-emerald-500/35 rounded-xl px-5 py-3 text-emerald-200 text-sm shadow-2xl animate-pulse">
          <CheckCircle className="h-5 w-5 text-emerald-400" />
          <span className="font-sans font-medium">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-red-950 border border-red-500/35 rounded-xl px-5 py-3 text-red-200 text-sm shadow-2xl animate-pulse">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <span className="font-sans font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Title block */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-content font-sans tracking-tight">Product Management</h1>
          <p className="text-content-muted text-sm font-sans mt-0.5">Manage seed catalogs, fertilizers pricing, and chemical stock levels.</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="bg-surface-hover border border-divider hover:bg-dark-700 text-content font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm cursor-pointer transition-all font-sans"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleCreateOpen}
            className="bg-gradient-to-r from-primary-500 to-emerald-600 hover:from-primary-600 hover:to-emerald-700 text-content font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-primary-500/10 flex items-center gap-2 text-sm cursor-pointer transition-all font-sans"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </button>
        </div>
      </header>

      {/* Mini inventory metrics blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel rounded-2xl p-5 border-divider flex items-center justify-between">
          <div>
            <span className="text-content-muted text-xs font-semibold font-sans uppercase">Total Products</span>
            <p className="text-2xl font-bold text-content font-sans mt-1">{products.length}</p>
          </div>
          <span className="p-3 bg-surface-hover rounded-2xl text-content border border-slate-750">
            <Package className="h-6 w-6" />
          </span>
        </div>

        <div className="glass-panel rounded-2xl p-5 border-divider flex items-center justify-between">
          <div>
            <span className="text-content-muted text-xs font-semibold font-sans uppercase">Catalog Net Worth</span>
            <p className="text-2xl font-bold text-content font-sans mt-1">Rs {totalProductsValue.toLocaleString()}</p>
          </div>
          <span className="p-3 bg-surface-hover rounded-2xl text-content border border-slate-750">
            <TrendingUp className="h-6 w-6 text-emerald-400" />
          </span>
        </div>

        <div className="glass-panel rounded-2xl p-5 border-divider flex items-center justify-between">
          <div>
            <span className="text-content-muted text-xs font-semibold font-sans uppercase">Low Stock Alerts</span>
            <p className="text-2xl font-bold text-content font-sans mt-1">{lowStockProductsCount}</p>
          </div>
          <span className={`p-3 rounded-2xl border ${lowStockProductsCount > 0 ? 'bg-red-500/15 border-red-500/20 text-red-400' : 'bg-surface-hover border-slate-750 text-content-muted'}`}>
            <AlertTriangle className="h-6 w-6" />
          </span>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="glass-panel rounded-2xl p-4 border-divider/80 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-content-muted">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-surface border border-divider rounded-xl py-2.5 pl-10 pr-4 text-xs text-content placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 font-sans"
            placeholder="Search by name or SKU..."
          />
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="h-4 w-4 text-content-muted shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-surface border border-divider text-xs text-content rounded-xl py-2.5 px-4 focus:outline-none focus:ring-1 focus:ring-primary-500 font-sans cursor-pointer w-full md:w-auto"
          >
            <option value="">All Categories</option>
            {categoriesList.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main product listings table */}
      <div className="glass-panel rounded-2xl overflow-hidden border-divider/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-divider/80 text-content-muted text-xs font-semibold bg-surface/40">
                <th className="p-4 font-sans">Product Info</th>
                <th className="p-4 font-sans">SKU</th>
                <th className="p-4 font-sans">Category</th>
                <th className="p-4 text-right font-sans">Price (Rs)</th>
                <th className="p-4 text-right font-sans">Cost (Rs)</th>
                <th className="p-4 text-center font-sans">Stock</th>
                <th className="p-4 hidden sm:table-cell font-sans">Supplier</th>
                <th className="p-4 text-center font-sans">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center p-8 text-content-muted font-sans">Loading catalog details...</td>
                </tr>
              ) : currentProducts.length > 0 ? (
                currentProducts.map((p) => {
                  const isLow = p.stock > 0 && p.stock <= p.minStock;
                  const isOut = p.stock === 0;

                  return (
                    <tr key={p._id} className="text-sm hover:bg-surface/25 transition-colors">
                      <td className="p-4">
                        <span className="font-semibold text-content block font-sans">{p.name}</span>
                      </td>
                      <td className="p-4 font-mono text-xs text-content-muted">{p.sku}</td>
                      <td className="p-4 text-content font-sans text-xs">
                        <span className="px-2 py-1 bg-surface-hover border border-divider/40 rounded-lg">{p.category?.name || 'N/A'}</span>
                      </td>
                      <td className="p-4 text-right text-emerald-400 font-bold font-sans">Rs {(p.sellingPrice || 0).toFixed(2)}</td>
                      <td className="p-4 text-right text-content-muted font-sans">Rs {(p.purchasePrice || 0).toFixed(2)}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold font-sans ${
                          isOut ? 'bg-red-500/20 text-red-400' : isLow ? 'bg-amber-500/20 text-amber-400' : 'bg-surface-hover text-content'
                        }`}>
                          {p.stock} Units
                        </span>
                      </td>
                      <td className="p-4 text-content-muted hidden sm:table-cell font-sans text-xs">{p.supplier?.name || 'N/A'}</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditOpen(p)}
                            className="p-1.5 hover:bg-surface-hover rounded-lg text-content-muted hover:text-content transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p._id)}
                            className="p-1.5 hover:bg-red-950/20 rounded-lg text-content-muted hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="text-center p-12 text-content-muted font-sans">No products found in database</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-divider/80 bg-surface/20">
            <span className="text-xs text-content-muted font-sans">
              Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, totalItems)} of {totalItems} items
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg bg-surface-hover hover:bg-dark-750 text-content disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold cursor-pointer font-sans"
              >
                Prev
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans cursor-pointer ${
                    currentPage === i + 1 ? 'bg-primary-500 text-white' : 'bg-surface-hover text-content-muted hover:text-content'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg bg-surface-hover hover:bg-dark-750 text-content disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold cursor-pointer font-sans"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE & EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg glass-panel rounded-2xl border-divider shadow-2xl p-6 overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-850">
              <h3 className="text-content font-semibold text-base font-sans">
                {editingProduct ? 'Edit Product Parameters' : 'Add New Product Record'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-content-muted hover:bg-surface-hover hover:text-content cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Product Name */}
                <div className="sm:col-span-2">
                  <label className="block text-content text-xs font-medium mb-1 font-sans">Product Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-surface border border-divider rounded-xl py-2 px-3 text-content text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 font-sans"
                    placeholder="Enter full product name"
                  />
                </div>

                {/* SKU Code */}
                <div>
                  <label className="block text-content text-xs font-medium mb-1 font-sans">SKU Code</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value.toUpperCase() }))}
                    className="w-full bg-surface border border-divider rounded-xl py-2 px-3 text-content text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 font-mono"
                    placeholder="FERT-009"
                  />
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-content text-xs font-medium mb-1 font-sans">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-surface border border-divider rounded-xl py-2 px-3 text-content text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 font-sans cursor-pointer"
                  >
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Selling Price */}
                <div>
                  <label className="block text-content text-xs font-medium mb-1 font-sans">Selling Price (Rs)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full bg-surface border border-divider rounded-xl py-2 px-3 text-content text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 font-sans"
                    placeholder="0.00"
                  />
                </div>

                {/* Purchase Cost */}
                <div>
                  <label className="block text-content text-xs font-medium mb-1 font-sans">Purchase Cost (Rs)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: e.target.value }))}
                    className="w-full bg-surface border border-divider rounded-xl py-2 px-3 text-content text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 font-sans"
                    placeholder="0.00"
                  />
                </div>

                {/* Initial Stock */}
                <div>
                  <label className="block text-content text-xs font-medium mb-1 font-sans">Stock Level</label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                    className="w-full bg-surface border border-divider rounded-xl py-2 px-3 text-content text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 font-sans"
                    placeholder="0"
                  />
                </div>

                {/* Minimum Stock Limit */}
                <div>
                  <label className="block text-content text-xs font-medium mb-1 font-sans">Min Safe Limit</label>
                  <input
                    type="number"
                    required
                    value={formData.minStock}
                    onChange={(e) => setFormData(prev => ({ ...prev, minStock: e.target.value }))}
                    className="w-full bg-surface border border-divider rounded-xl py-2 px-3 text-content text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 font-sans"
                    placeholder="5"
                  />
                </div>

                {/* Supplier */}
                <div className="sm:col-span-2">
                  <label className="block text-content text-xs font-medium mb-1 font-sans">Supplier Company</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                    className="w-full bg-surface border border-divider rounded-xl py-2 px-3 text-content text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 font-sans"
                    placeholder="Enter supplier name"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-805">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="bg-surface-hover hover:bg-dark-750 text-content border border-divider rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer font-sans"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-primary-500 to-emerald-600 hover:from-primary-600 hover:to-emerald-700 text-content font-semibold px-5 py-2 rounded-xl shadow-lg shadow-primary-500/10 text-xs cursor-pointer font-sans"
                >
                  {editingProduct ? 'Update Product' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
