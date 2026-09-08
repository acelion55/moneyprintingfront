'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Mail, Loader2, Search, ChevronLeft, ChevronRight, Filter, X, CheckCircle, AlertCircle, Clock, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

interface Lead {
  _id: string;
  name: string;
  email: string;
  message: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed';
  source?: string;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface LeadsResponse {
  leads: Lead[];
  pagination: Pagination;
}

interface Stats {
  total: number;
  new: number;
  contacted: number;
  qualified: number;
  converted: number;
}

const STATUS_CONFIG = {
  new: { label: 'New', color: 'bg-blue-500/20 text-blue-300', icon: AlertCircle },
  contacted: { label: 'Contacted', color: 'bg-yellow-500/20 text-yellow-300', icon: Clock },
  qualified: { label: 'Qualified', color: 'bg-purple-500/20 text-purple-300', icon: UserCheck },
  converted: { label: 'Converted', color: 'bg-emerald-500/20 text-emerald-300', icon: CheckCircle },
  closed: { label: 'Closed', color: 'bg-gray-500/20 text-gray-300', icon: X },
} as const;

export default function AdminLeadsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ total: 0, new: 0, contacted: 0, qualified: 0, converted: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
    fetchStats();
  }, [pagination.page, search, statusFilter]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await api.get<LeadsResponse>('/leads', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        },
      });
      setLeads(res.data.leads);
      setPagination(res.data.pagination);
    } catch (err: any) {
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get<Stats>('/leads/stats');
      setStats(res.data);
    } catch (err) {
      // ignore
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handleStatusChange = async (lead: Lead, newStatus: string) => {
    setUpdatingId(lead._id);
    try {
      await api.put(`/leads/${lead._id}/status`, { status: newStatus });
      toast.success(`Status updated to ${STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG]?.label || newStatus}`);
      fetchLeads();
      fetchStats();
    } catch (err: any) {
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      await api.delete(`/leads/${id}`);
      toast.success('Lead deleted');
      fetchLeads();
      fetchStats();
    } catch (err: any) {
      toast.error('Failed to delete lead');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <Mail className="w-16 h-16 mx-auto text-gray-600 mb-4" />
        <h2 className="text-xl font-semibold text-white">Access Denied</h2>
        <p className="text-gray-400 mt-2">Admin access required</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Lead Management</h1>
          <p className="text-gray-400">Contact form submissions from website</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-white/10">
          <div className="flex items-center gap-3">
            <Mail className="w-6 h-6 text-gray-400" />
            <div>
              <div className="text-sm text-gray-400">Total Leads</div>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
            </div>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-white/10">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-blue-400" />
            <div>
              <div className="text-sm text-gray-400">New</div>
              <div className="text-2xl font-bold text-blue-300">{stats.new}</div>
            </div>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-white/10">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-yellow-400" />
            <div>
              <div className="text-sm text-gray-400">Contacted</div>
              <div className="text-2xl font-bold text-yellow-300">{stats.contacted}</div>
            </div>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-white/10">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
            <div>
              <div className="text-sm text-gray-400">Converted</div>
              <div className="text-2xl font-bold text-emerald-300">{stats.converted}</div>
            </div>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-white/10">
          <div className="flex items-center gap-3">
            <UserCheck className="w-6 h-6 text-purple-400" />
            <div>
              <div className="text-sm text-gray-400">Qualified</div>
              <div className="text-2xl font-bold text-purple-300">{stats.qualified}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
        <form onSubmit={handleSearch} className="p-4 border-b border-white/10 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            className="px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="converted">Converted</option>
            <option value="closed">Closed</option>
          </select>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-left text-sm text-gray-400">
                <th className="p-4">Lead</th>
                <th className="p-4">Message Preview</th>
                <th className="p-4">Source</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">No leads found</td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead._id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-4">
                      <div className="font-medium text-white">{lead.name}</div>
                      <div className="text-sm text-gray-400">{lead.email}</div>
                    </td>
                    <td className="p-4 max-w-xs">
                      <div className="text-sm text-gray-300 truncate" title={lead.message}>
                        {lead.message.substring(0, 80)}{lead.message.length > 80 ? '...' : ''}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-400 capitalize">{lead.source || 'website'}</td>
                    <td className="p-4">
                      {(() => {
                        const cfg = STATUS_CONFIG[lead.status];
                        const Icon = cfg.icon;
                        return (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${cfg.color}`}>
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-4 text-sm text-gray-400">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
                          <button
                            key={status}
                            onClick={() => lead.status !== status && handleStatusChange(lead, status)}
                            disabled={updatingId === lead._id || lead.status === status}
                            className={`p-1.5 rounded ${lead.status === status ? 'bg-white/10' : 'hover:bg-white/5'} transition-colors`}
                            title={cfg.label}
                          >
                            <cfg.icon className="w-3.5 h-3.5" style={{ color: cfg.color.split(' ')[1]?.replace('/20', '') || 'white' }} />
                          </button>
                        ))}
                        <button
                          onClick={() => handleDelete(lead._id)}
                          className="p-1.5 text-red-400 hover:bg-red-500/20 rounded"
                          title="Delete"
                        >
                          <X className="w-3.5 h-3.5" />
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
    </div>
  );
}