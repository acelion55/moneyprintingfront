'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Users, Trash2, Edit, Shield, Activity, Search, ChevronLeft, ChevronRight, Check, X, Key, PhoneCall } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  tenantId: string;
  whatsappApiKey?: string;
  whatsappPhoneNumberId?: string;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UsersResponse {
  users: User[];
  pagination: Pagination;
}

export default function AdminUsersPage() {
  const { user, fetchUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'user',
    whatsappApiKey: '',
    whatsappPhoneNumberId: '',
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get<UsersResponse>('/admin/users', {
        params: { page: pagination.page, limit: pagination.limit, search },
      });
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch (err: any) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handleEdit = (u: User) => {
    setEditingUser(u);
    setEditForm({
      name: u.name,
      email: u.email,
      role: u.role,
      whatsappApiKey: u.whatsappApiKey || '',
      whatsappPhoneNumberId: u.whatsappPhoneNumberId || '',
    });
  };

  const handleUpdate = async () => {
    if (!editingUser) return;
    try {
      await api.put(`/admin/users/${editingUser._id}`, editForm);
      toast.success('User updated successfully');
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (err: any) {
      toast.error('Failed to delete user');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <Shield className="w-16 h-16 mx-auto text-gray-600 mb-4" />
        <h2 className="text-xl font-semibold text-white">Access Denied</h2>
        <p className="text-gray-400 mt-2">Admin access required</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-gray-400">Manage users, roles, WhatsApp API credentials & access</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-white/10">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-purple-400" />
            <div>
              <div className="text-sm text-gray-400">Total Users</div>
              <div className="text-2xl font-bold text-white">{pagination.total}</div>
            </div>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-white/10">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-emerald-400" />
            <div>
              <div className="text-sm text-gray-400">Admins</div>
              <div className="text-2xl font-bold text-white">
                {users.filter((u) => u.role === 'admin').length}
              </div>
            </div>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-white/10">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-400" />
            <div>
              <div className="text-sm text-gray-400">Regular Users</div>
              <div className="text-2xl font-bold text-white">
                {users.filter((u) => u.role === 'user').length}
              </div>
            </div>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-white/10">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-orange-400" />
            <div>
              <div className="text-sm text-gray-400">Tenants</div>
              <div className="text-2xl font-bold text-white">
                {new Set(users.map((u) => u.tenantId)).size}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Table */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
        <form onSubmit={handleSearch} className="p-4 border-b border-white/10">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or tenant..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-left text-sm text-gray-400">
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Tenant</th>
                <th className="p-4">WhatsApp API Credentials</th>
                <th className="p-4">Joined</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-4">
                      <div className="font-medium text-white">{u.name}</div>
                      <div className="text-sm text-gray-400">{u.email}</div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          u.role === 'admin'
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-400">{u.tenantId}</td>
                    <td className="p-4 text-xs font-mono text-gray-300 space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <Key className="w-3 h-3" />
                        <span>API Key:</span>
                        <span className="text-gray-400 truncate max-w-[140px]">
                          {u.whatsappApiKey ? `${u.whatsappApiKey.slice(0, 8)}...` : 'Not Set'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-blue-400">
                        <PhoneCall className="w-3 h-3" />
                        <span>Phone ID:</span>
                        <span className="text-gray-400">
                          {u.whatsappPhoneNumberId || 'Not Set'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(u)}
                          className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded flex items-center gap-1 text-xs"
                          title="Edit Credentials"
                        >
                          <Edit className="w-4 h-4" /> Edit API
                        </button>
                        <button
                          onClick={() => handleDelete(u._id)}
                          className="p-1.5 text-red-400 hover:bg-red-500/20 rounded"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Edit User WhatsApp API Modal */}
        {editingUser && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-lg font-bold text-white">Edit User WhatsApp API</h3>
                <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-400 mb-1">User Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-emerald-400 font-semibold mb-1 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5" /> WhatsApp API Key / Token
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. EAAG..."
                    value={editForm.whatsappApiKey}
                    onChange={(e) => setEditForm({ ...editForm, whatsappApiKey: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-emerald-500/30 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-blue-400 font-semibold mb-1 flex items-center gap-1">
                    <PhoneCall className="w-3.5 h-3.5" /> WhatsApp Phone Number ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1092837465"
                    value={editForm.whatsappPhoneNumberId}
                    onChange={(e) => setEditForm({ ...editForm, whatsappPhoneNumberId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-blue-500/30 text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
                >
                  Save Credentials
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-white/10 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}