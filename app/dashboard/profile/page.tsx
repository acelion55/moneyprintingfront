'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { User, Phone, Save, CheckCircle2, Shield, Key } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, fetchUser } = useAuth();
  const [name, setName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setWhatsappNumber((user as any).userWhatsappNumber || '');
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const cleanPhone = whatsappNumber.replace(/\D/g, '');
      await api.post('/auth/profile', {
        name,
        userWhatsappNumber: cleanPhone,
      });

      toast.success('Profile and WhatsApp number updated!');
      setSavedSuccess(true);
      if (fetchUser) await fetchUser();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <User className="w-6 h-6 text-purple-400" /> Account Profile & Settings
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Configure your registered WhatsApp number for automated chat routing and live portal view.
          </p>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-6">
        <form onSubmit={handleSave} className="space-y-5">
          {/* User Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors text-sm"
                placeholder="Enter your full name"
              />
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            </div>
          </div>

          {/* Email (Disabled) */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-gray-400 text-sm cursor-not-allowed"
            />
            <p className="text-[11px] text-gray-500 mt-1">Email cannot be changed.</p>
          </div>

          {/* WhatsApp Registered Number */}
          <div>
            <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" /> Registered WhatsApp Number
            </label>
            <div className="relative">
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full bg-black/40 border border-emerald-500/40 rounded-xl px-4 py-2.5 pl-10 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors text-sm font-mono"
                placeholder="e.g. 919876543210"
              />
              <Phone className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3" />
            </div>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Enter your WhatsApp number with country code (e.g. <span className="font-mono text-emerald-300">919876543210</span>). You will only see chats associated with this number in your live WhatsApp Automation portal.
            </p>
          </div>

          {/* Tenant ID Badge */}
          <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-xs font-medium text-gray-300">Tenant Identification</div>
                <div className="text-xs font-mono text-purple-300 mt-0.5">{user?.tenantId}</div>
              </div>
            </div>
            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
              {user?.role === 'admin' ? 'Admin Access' : 'Tenant Isolated'}
            </span>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-sm px-6 py-2.5 rounded-xl shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
            >
              {saving ? (
                <>Updating...</>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Profile Settings
                </>
              )}
            </button>
            {savedSuccess && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-4 h-4" /> Changes saved successfully!
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
