/**
 * pages/UsersManagement.jsx
 * KrushiMitra AI — User & Employee Management (Admin Only)
 * Features: View, Edit roles, Activate/Deactivate, Search, Filter
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCog, Search, Edit2, X, Save, RefreshCw,
  Shield, Briefcase, Mail, Phone, Calendar,
  CheckCircle2, XCircle, ChevronDown, Users
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const ROLE_BADGES = {
  admin:    { label: 'Admin',    cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Shield },
  employee: { label: 'Employee', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20',   icon: Briefcase },
};

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showEditModal, setShowEditModal] = useState(null); // user obj to edit
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchUsers(); }, [page, search, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users', {
        params: { page, limit: 15, search, role: roleFilter, status: statusFilter },
      });
      setUsers(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (u) => {
    setEditForm({
      name: u.name,
      phone: u.phone || '',
      department: u.department || '',
      employeeId: u.employeeId || '',
      role: u.role,
      isActive: u.isActive,
    });
    setShowEditModal(u);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/users/${showEditModal._id}`, editForm);
      toast.success('User updated successfully');
      setShowEditModal(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (u) => {
    try {
      await api.put(`/users/${u._id}`, { isActive: !u.isActive });
      toast.success(`${u.name} ${u.isActive ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const initials = (name) => (name || 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <UserCog className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">User Management</h1>
            <p className="text-sm text-text-secondary">{total} users</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2 rounded-xl bg-bg-secondary border border-border-color text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 w-52"
            />
          </div>
          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl bg-bg-secondary border border-border-color text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="employee">Employee</option>
          </select>
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl bg-bg-secondary border border-border-color text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button onClick={fetchUsers} className="p-2 rounded-xl border border-border-color text-text-secondary hover:bg-bg-secondary transition-colors">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-color">
                <th className="text-left px-4 py-3 text-text-secondary font-medium">User</th>
                <th className="text-left px-4 py-3 text-text-secondary font-medium">Contact</th>
                <th className="text-center px-4 py-3 text-text-secondary font-medium">Role</th>
                <th className="text-left px-4 py-3 text-text-secondary font-medium">Department</th>
                <th className="text-left px-4 py-3 text-text-secondary font-medium">Joined</th>
                <th className="text-center px-4 py-3 text-text-secondary font-medium">Status</th>
                <th className="text-center px-4 py-3 text-text-secondary font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border-color/50">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-bg-secondary rounded animate-pulse w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-text-secondary">
                    <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>No users found</p>
                  </td>
                </tr>
              ) : users.map(u => {
                const roleBadge = ROLE_BADGES[u.role] || ROLE_BADGES.employee;
                const RoleIcon = roleBadge.icon;
                return (
                  <motion.tr
                    key={u._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`border-b border-border-color/50 hover:bg-bg-secondary/50 transition-colors ${!u.isActive ? 'opacity-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400">
                          {u.photoURL ? (
                            <img src={u.photoURL} alt="" className="h-9 w-9 rounded-xl object-cover" />
                          ) : (
                            initials(u.name)
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{u.name}</p>
                          {u.employeeId && <p className="text-[10px] text-text-secondary font-mono">ID: {u.employeeId}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-text-secondary text-xs">
                          <Mail className="h-3 w-3" /> {u.email}
                        </div>
                        {u.phone && (
                          <div className="flex items-center gap-1.5 text-text-secondary text-xs">
                            <Phone className="h-3 w-3" /> {u.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold border ${roleBadge.cls}`}>
                        <RoleIcon className="h-3 w-3" />
                        {roleBadge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{u.department || '—'}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" /> {formatDate(u.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(u)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold border cursor-pointer transition-colors ${
                          u.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                        }`}
                      >
                        {u.isActive ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {u.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleEdit(u)}
                          className="p-1.5 rounded-lg text-text-secondary hover:bg-amber-500/10 hover:text-amber-400 transition-colors"
                          title="Edit user"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
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

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && setShowEditModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="glass-panel rounded-2xl border border-border-color w-full max-w-lg p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-text-primary">Edit User</h2>
                <button onClick={() => setShowEditModal(null)} className="p-1.5 rounded-lg text-text-secondary hover:bg-bg-secondary">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* User identity (read-only) */}
              <div className="flex items-center gap-3 mb-5 p-3 bg-bg-secondary rounded-xl">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-400">
                  {initials(showEditModal.name)}
                </div>
                <div>
                  <p className="font-semibold text-text-primary">{showEditModal.name}</p>
                  <p className="text-xs text-text-secondary">{showEditModal.email}</p>
                </div>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs text-text-secondary mb-1">Name</label>
                    <input
                      value={editForm.name}
                      onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      className="input-field"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Phone</label>
                    <input
                      value={editForm.phone}
                      onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                      className="input-field"
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Employee ID</label>
                    <input
                      value={editForm.employeeId}
                      onChange={e => setEditForm(f => ({ ...f, employeeId: e.target.value }))}
                      className="input-field"
                      placeholder="e.g. EMP-001"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Department</label>
                    <input
                      value={editForm.department}
                      onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))}
                      className="input-field"
                      placeholder="e.g. Sales, Billing"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Role</label>
                    <select
                      value={editForm.role}
                      onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                      className="input-field"
                    >
                      <option value="employee">Employee</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-bg-secondary rounded-xl">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-text-primary">
                    <input
                      type="checkbox"
                      checked={editForm.isActive}
                      onChange={e => setEditForm(f => ({ ...f, isActive: e.target.checked }))}
                      className="h-4 w-4 rounded border-border-color accent-primary-500"
                    />
                    Account is active
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowEditModal(null)} className="px-4 py-2 rounded-xl border border-border-color text-text-secondary hover:bg-bg-secondary text-sm">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Update User'}
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

export default UsersManagement;
