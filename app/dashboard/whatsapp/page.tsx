'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import {
  Plus, Trash2, Upload, CheckCircle2, MessageSquare,
  Users, Loader2, Send, Database, LayoutTemplate, Zap
} from 'lucide-react';
import TemplatesTab from './TemplatesTab';
import ChatInbox from './ChatInbox';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FAQItem { question: string; answer: string }

interface User { _id: string; name: string; email: string; tenantId: string }

interface FormValues {
  companyName: string;
  industry: string;
  supportEmail: string;
  phone: string;
  brandVoice: string;
  description: string;
  offerings: string;
  faqs: FAQItem[];
}

type TabId = 'inbox' | 'knowledge' | 'templates';

const TABS: { id: TabId; label: string; icon: React.ReactNode; badge?: string }[] = [
  { id: 'inbox', label: 'Live Chat Inbox', icon: <MessageSquare className="w-4 h-4" />, badge: 'Realtime' },
  { id: 'knowledge', label: 'Knowledge Base', icon: <Database className="w-4 h-4" />, badge: 'AI Config' },
  { id: 'templates', label: 'Templates', icon: <LayoutTemplate className="w-4 h-4" />, badge: 'Meta API' },
];

// ─── Knowledge Base Tab (original form) ──────────────────────────────────────

function KnowledgeBaseTab() {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  const { register, control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      companyName: '',
      industry: 'Technology',
      supportEmail: '',
      phone: '',
      brandVoice: 'friendly',
      description: '',
      offerings: '',
      faqs: [{ question: '', answer: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'faqs' });

  // Fetch users for admin dropdown
  useEffect(() => {
    if (user?.role === 'admin') {
      async function fetchUsers() {
        setLoadingUsers(true);
        try {
          const res = await api.get('/admin/users?limit=100');
          setUsers(res.data.users || []);
        } catch { console.error('Failed to fetch users'); }
        finally { setLoadingUsers(false); }
      }
      fetchUsers();
    }
  }, [user?.role]);

  const effectiveTenantId = selectedUserId || user?.tenantId;

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await api.get('/company/profile', { params: { tenantId: effectiveTenantId } });
        if (res.data?.companyName) {
          reset({
            companyName: res.data.companyName || '',
            industry: res.data.industry || 'Technology',
            supportEmail: res.data.supportEmail || '',
            phone: res.data.phone || '',
            brandVoice: res.data.brandVoice || 'friendly',
            description: res.data.description || '',
            offerings: res.data.offerings || '',
            faqs: res.data.faqs?.length > 0 ? res.data.faqs : [{ question: '', answer: '' }],
          });
        } else {
          reset({
            companyName: '', industry: 'Technology', supportEmail: '', phone: '',
            brandVoice: 'friendly', description: '', offerings: '',
            faqs: [{ question: '', answer: '' }],
          });
        }
      } catch {
        reset({
          companyName: '', industry: 'Technology', supportEmail: '', phone: '',
          brandVoice: 'friendly', description: '', offerings: '',
          faqs: [{ question: '', answer: '' }],
        });
      }
    }
    loadProfile();
  }, [reset, effectiveTenantId]);

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    try {
      await api.post('/company/profile', { ...data, tenantId: effectiveTenantId });

      const formData = new FormData();
      formData.append('companyName', data.companyName);
      formData.append('description', data.description);
      formData.append('offerings', data.offerings);
      formData.append('faqs', JSON.stringify(data.faqs.filter(f => f.question && f.answer)));
      if (selectedFile) formData.append('document', selectedFile);

      const res = await api.post('/whatsapp/ingest', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: { tenantId: effectiveTenantId },
      });

      toast.success(`Profile saved & ${res.data.vectorsIngested || 0} vector embeddings upserted to Qdrant!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit company knowledge base');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* Admin User Selector */}
      {user?.role === 'admin' && (
        <div className="glass-panel p-4 rounded-xl border border-white/10">
          <div className="flex items-center gap-4">
            <Users className="w-5 h-5 text-purple-400" />
            <label className="text-sm font-medium text-gray-300">View as User:</label>
            <select
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
              disabled={loadingUsers}
              className="flex-1 max-w-md px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="">-- Your Account (Admin) --</option>
              {users.map(u => (
                <option key={u._id} value={u.tenantId}>
                  {u.name} ({u.email}) - {u.tenantId}
                </option>
              ))}
            </select>
            {loadingUsers && <Loader2 className="w-4 h-4 animate-spin text-purple-400" />}
          </div>
          {selectedUserId && (
            <p className="text-xs text-gray-500 mt-2">
              Editing data for tenant: <span className="text-purple-300 font-mono">{selectedUserId}</span>
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Business Profile */}
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-3">1. Business Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Company Name *</label>
              <input {...register('companyName', { required: true })}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
                placeholder="Acme Corp" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Industry Category *</label>
              <select {...register('industry')}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500">
                <option value="Technology">Technology & SaaS</option>
                <option value="E-Commerce">E-Commerce & Retail</option>
                <option value="Healthcare">Healthcare & Wellness</option>
                <option value="Finance">Finance & Real Estate</option>
                <option value="Services">Professional Services</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Support Email *</label>
              <input type="email" {...register('supportEmail', { required: true })}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
                placeholder="support@acme.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Phone Number *</label>
              <input {...register('phone', { required: true })}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
                placeholder="+1 (555) 000-0000" />
            </div>
          </div>
        </div>

        {/* AI Persona */}
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-3">2. AI Persona & Context</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Brand Voice / Tone *</label>
              <div className="grid grid-cols-3 gap-4">
                {['friendly', 'formal', 'sales-oriented'].map(tone => (
                  <label key={tone} className="cursor-pointer">
                    <input type="radio" value={tone} {...register('brandVoice')} className="peer sr-only" />
                    <div className="p-4 rounded-xl border border-white/10 bg-black/30 text-center capitalize text-sm font-medium peer-checked:border-purple-500 peer-checked:bg-purple-600/20 peer-checked:text-white text-gray-400 hover:border-white/20 transition-all">
                      {tone}
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Business Description & Core Message *</label>
              <textarea rows={3} {...register('description', { required: true })}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
                placeholder="Describe your primary business activity, target customers, and key value propositions..." />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Offerings & Services</label>
              <textarea rows={2} {...register('offerings')}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
                placeholder="List products, pricing tiers, or service packages..." />
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-lg font-semibold text-white">3. Custom FAQs (Dynamic Knowledge Array)</h2>
            <button type="button" onClick={() => append({ question: '', answer: '' })}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 text-xs font-medium transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Question
            </button>
          </div>
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-3 relative group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-purple-400">FAQ #{index + 1}</span>
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(index)} className="text-gray-500 hover:text-red-400 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <input {...register(`faqs.${index}.question` as const)}
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
                  placeholder="Question (e.g. What are your refund policies?)" />
                <textarea rows={2} {...register(`faqs.${index}.answer` as const)}
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
                  placeholder="Answer (e.g. We offer a full 30-day money-back guarantee...)" />
              </div>
            ))}
          </div>
        </div>

        {/* Document Upload */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-3">4. Document Upload (PDF / TXT)</h2>
          <div className="border-2 border-dashed border-white/10 hover:border-purple-500/50 rounded-2xl p-6 text-center space-y-3 transition-colors bg-black/20">
            <Upload className="w-8 h-8 text-gray-400 mx-auto" />
            <div className="text-sm text-gray-300">
              {selectedFile
                ? <span className="text-purple-400 font-medium">{selectedFile.name}</span>
                : 'Upload company manuals, FAQs, or policy documents'}
            </div>
            <input type="file" accept=".pdf,.txt" onChange={e => setSelectedFile(e.target.files?.[0] || null)}
              className="hidden" id="file-upload" />
            <label htmlFor="file-upload"
              className="inline-block px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium cursor-pointer transition-colors">
              Select File
            </label>
          </div>
        </div>

        <button type="submit" disabled={submitting}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold text-base shadow-xl shadow-purple-500/25 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
          {submitting ? 'Processing & Vectorizing Context...' : (
            <><CheckCircle2 className="w-5 h-5" /> Save Configuration & Ingest to Qdrant</>
          )}
        </button>
      </form>
    </div>
  );
}

// ─── Main Page with Tabs ──────────────────────────────────────────────────────

export default function WhatsappPage() {
  const [activeTab, setActiveTab] = useState<TabId>('inbox');

  return (
    <div className="space-y-6">
      {/* Tab Bar */}
      <div className="flex gap-2 p-1 bg-black/30 rounded-xl border border-white/10 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
          >
            {tab.icon}
            {tab.label}
            {tab.badge && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${activeTab === tab.id
                ? 'bg-white/20 text-white'
                : 'bg-white/10 text-gray-500'
                }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'inbox' && <ChatInbox />}
        {activeTab === 'knowledge' && <KnowledgeBaseTab />}
        {activeTab === 'templates' && <TemplatesTab />}
      </div>
    </div>
  );
}
