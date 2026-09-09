'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Users, Trash2, Edit, Shield, Activity, Search, ChevronLeft, ChevronRight, Check, X, Key, PhoneCall, Radio } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  tenantId: string;
  whatsappApiKey?: string;
  whatsappPhoneNumberId?: string;
  airtelCustomerId?: string;
  airtelUsername?: string;
  airtelAuthKey?: string;
  airtelVirtualNumber?: string;
  airtelApiUrl?: string;
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
    airtelCustomerId: '',
    airtelUsername: '',
    airtelAuthKey: '',
    airtelVirtualNumber: '',
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
      airtelCustomerId: u.airtelCustomerId || '',
      airtelUsername: u.airtelUsername || '',
      airtelAuthKey: u.airtelAuthKey || '',
      airtelVirtualNumber: u.airtelVirtualNumber || '',
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
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-400" /> User & Telephony Management
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage system users, tenant roles, WhatsApp API, and Airtel IQ credentials.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500 w-64"
            />
          </div>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-gray-900/50 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-white/5 text-gray-400 border-b border-white/10 uppercase text-xs">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Tenant ID</th>
                <th className="p-4">WhatsApp Config</th>
                <th className="p-4">Airtel IQ Config</th>
                <th className="p-4">Joined</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
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
                        <span className="text-gray-400 truncate max-w-[120px]">
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
                    <td className="p-4 text-xs font-mono text-gray-300 space-y-1">
                      <div className="flex items-center gap-1.5 text-red-400">
                        <Radio className="w-3 h-3" />
                        <span>Cust ID:</span>
                        <span className="text-gray-400 truncate max-w-[100px]">
                          {u.airtelCustomerId ? u.airtelCustomerId : 'Not Set'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-amber-400">
                        <PhoneCall className="w-3 h-3" />
                        <span>Number:</span>
                        <span className="text-gray-400">
                          {u.airtelVirtualNumber || 'Not Set'}
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

      {/* Edit User Modal - Outside table container for clean modal z-index & positioning */}
      {editingUser && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-white/15 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Edit User & Telephony API</h3>
                <p className="text-xs text-gray-400 mt-0.5">Configure tenant credentials for WhatsApp and Airtel IQ Voice</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-medium mb-1">User Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-medium mb-1">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              {/* WhatsApp Config */}
              <div className="border border-emerald-500/20 bg-emerald-500/5 p-4 rounded-2xl space-y-3">
                <h4 className="font-semibold text-emerald-400 text-sm flex items-center gap-1.5">
                  <Key className="w-4 h-4" /> WhatsApp Business Cloud API
                </h4>
                <div>
                  <label className="block text-emerald-300 font-medium mb-1">WhatsApp API Key / Token</label>
                  <input
                    type="text"
                    placeholder="e.g. EAAG..."
                    value={editForm.whatsappApiKey}
                    onChange={(e) => setEditForm({ ...editForm, whatsappApiKey: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-emerald-500/30 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-emerald-300 font-medium mb-1">WhatsApp Phone Number ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 1092837465"
                    value={editForm.whatsappPhoneNumberId}
                    onChange={(e) => setEditForm({ ...editForm, whatsappPhoneNumberId: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-emerald-500/30 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Airtel IQ Config */}
              <div className="border border-red-500/20 bg-red-500/5 p-4 rounded-2xl space-y-3">
                <h4 className="font-semibold text-red-400 text-sm flex items-center gap-1.5">
                  <Radio className="w-4 h-4" /> Airtel IQ Voice Telephony
                </h4>
                <div>
                  <label className="block text-red-300 font-medium mb-1">Airtel Customer ID</label>
                  <input
                    type="text"
                    placeholder="e.g. f72b52c8-cefa-431f-b64b-67cd646479ed"
                    value={editForm.airtelCustomerId}
                    onChange={(e) => setEditForm({ ...editForm, airtelCustomerId: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-red-500/30 text-white focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-red-300 font-medium mb-1">Airtel API Username</label>
                  <input
                    type="text"
                    placeholder="e.g. 00c1841d_0e95_41e6_b425_1503e7773fae"
                    value={editForm.airtelUsername}
                    onChange={(e) => setEditForm({ ...editForm, airtelUsername: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-red-500/30 text-white focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-red-300 font-medium mb-1">Airtel Auth Key / Secret</label>
                  <input
                    type="password"
                    placeholder="e.g. lAZueZJIPX"
                    value={editForm.airtelAuthKey}
                    onChange={(e) => setEditForm({ ...editForm, airtelAuthKey: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-red-500/30 text-white focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-red-300 font-medium mb-1">Airtel Virtual Number (Caller ID)</label>
                  <input
                    type="text"
                    placeholder="e.g. 8047536857"
                    value={editForm.airtelVirtualNumber}
                    onChange={(e) => setEditForm({ ...editForm, airtelVirtualNumber: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-red-500/30 text-white focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-500/20"
              >
                Save Credentials
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}