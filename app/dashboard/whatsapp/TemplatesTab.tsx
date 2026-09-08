'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { LayoutTemplate, Plus, Trash2, CheckCircle2, Clock, AlertCircle, Sparkles, Send, Copy } from 'lucide-react';

export interface WhatsAppTemplate {
  _id?: string;
  name: string;
  category: string;
  language: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  bodyText: string;
  buttons?: string[];
}

interface TemplatesTabProps {
  onSelectTemplate?: (template: WhatsAppTemplate) => void;
}

export default function TemplatesTab({ onSelectTemplate }: TemplatesTabProps) {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    name: '',
    category: 'utility',
    language: 'en_US',
    bodyText: '',
    buttons: '',
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.get<WhatsAppTemplate[]>('/whatsapp/templates');
      setTemplates(res.data || []);
    } catch (err: any) {
      toast.error('Failed to load WhatsApp templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.bodyText) {
      toast.error('Please enter template name and message text');
      return;
    }

    try {
      setCreating(true);
      const buttonArray = form.buttons
        ? form.buttons.split(',').map(b => b.trim()).filter(Boolean)
        : [];

      await api.post('/whatsapp/templates', {
        name: form.name,
        category: form.category,
        language: form.language,
        bodyText: form.bodyText,
        buttons: buttonArray,
      });

      toast.success('Template saved successfully!');
      setShowCreateModal(false);
      setForm({ name: '', category: 'utility', language: 'en_US', bodyText: '', buttons: '' });
      fetchTemplates();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create template');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete template "${name}"?`)) return;
    try {
      await api.delete(`/whatsapp/templates?id=${id}`);
      toast.success('Template deleted');
      setTemplates(prev => prev.filter(t => t._id !== id));
    } catch {
      toast.error('Failed to delete template');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-purple-400" />
            WhatsApp Message Templates
          </h2>
          <p className="text-xs text-gray-400">
            View Meta Cloud API approved templates to send WhatsApp messages outside 24h window.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/25 transition-all"
        >
          <Plus className="w-4 h-4" /> Create New Template
        </button>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-panel h-48 rounded-2xl animate-pulse border border-white/10" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-white/10 space-y-3">
          <LayoutTemplate className="w-12 h-12 text-gray-600 mx-auto" />
          <h3 className="text-white font-medium">No Message Templates Found</h3>
          <p className="text-xs text-gray-400">Click &quot;Create New Template&quot; above to add your first template.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl) => (
            <div
              key={tpl._id || tpl.name}
              className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between hover:border-purple-500/40 transition-all group relative"
            >
              <div className="space-y-3">
                {/* Header info */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                      {tpl.category.toUpperCase()}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1 font-mono">{tpl.name}</h3>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      tpl.status === 'APPROVED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : tpl.status === 'PENDING'
                        ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {tpl.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3" />}
                    {tpl.status === 'PENDING' && <Clock className="w-3 h-3" />}
                    {tpl.status === 'REJECTED' && <AlertCircle className="w-3 h-3" />}
                    {tpl.status}
                  </span>
                </div>

                {/* Message Body Card Preview */}
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {tpl.bodyText}
                </div>

                {/* Buttons Preview */}
                {tpl.buttons && tpl.buttons.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {tpl.buttons.map((btn, idx) => (
                      <div
                        key={idx}
                        className="w-full py-1.5 px-3 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 text-center text-xs font-medium"
                      >
                        {btn}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/10 text-xs">
                <span className="text-[11px] text-gray-500 font-mono">{tpl.language}</span>
                <div className="flex items-center gap-2">
                  {onSelectTemplate && (
                    <button
                      onClick={() => onSelectTemplate(tpl)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-medium transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" /> Use Template
                    </button>
                  )}
                  {tpl._id && (
                    <button
                      onClick={() => handleDelete(tpl._id!, tpl.name)}
                      className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"
                      title="Delete Template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-panel p-6 rounded-2xl border border-white/10 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" /> Create WhatsApp Template
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Template Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. order_confirmation"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500 font-mono"
                />
                <p className="text-[10px] text-gray-500 mt-1">Only lowercase letters, numbers, and underscores.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
                  >
                    <option value="utility">Utility</option>
                    <option value="marketing">Marketing</option>
                    <option value="authentication">Authentication</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Language</label>
                  <select
                    value={form.language}
                    onChange={(e) => setForm({ ...form, language: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
                  >
                    <option value="en_US">English (en_US)</option>
                    <option value="hi">Hindi (hi)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Message Text *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Hello {{1}}, your order #{{2}} is successfully placed!"
                  value={form.bodyText}
                  onChange={(e) => setForm({ ...form, bodyText: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
                />
                <p className="text-[10px] text-gray-500 mt-1">Use &#123;&#123;1&#123;&#123;, &#123;&#123;2&#123;&#123; for dynamic variables like recipient name or order ID.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Quick Reply Buttons (Optional)</label>
                <input
                  type="text"
                  placeholder="Visit Website, Contact Support (comma separated)"
                  value={form.buttons}
                  onChange={(e) => setForm({ ...form, buttons: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/25 disabled:opacity-50"
                >
                  {creating ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
