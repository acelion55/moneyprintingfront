'use client';

import React, { useState } from 'react';
import { PhoneCall, Sparkles, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function IvrCallingPage() {
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/waitlist/join', { email, module: 'ivr' });
      setJoined(true);
      toast.success('Joined IVR Calling waitlist!');
    } catch (err: any) {
      toast.error('Failed to join waitlist');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-16 text-center space-y-8">
      <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto text-blue-400 shadow-xl shadow-blue-500/10">
        <PhoneCall className="w-10 h-10 animate-bounce" />
      </div>
      <div className="space-y-3">
        <span className="px-4 py-1.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold tracking-wide uppercase">
          Coming Soon
        </span>
        <h1 className="text-4xl font-extrabold text-white">IVR Cloud Calling Suite</h1>
        <p className="text-gray-400 text-base max-w-xl mx-auto">
          Automate dynamic telephony call flows, multi-level IVR menus, and instant speech recognition directly integrated with your MongoDB & Qdrant database.
        </p>
      </div>

      <div className="glass-panel p-8 rounded-3xl max-w-md mx-auto space-y-4 border border-white/10">
        <div className="flex items-center justify-center gap-2 text-sm text-purple-300 font-medium">
          <Sparkles className="w-4 h-4" /> Join Early Access Waitlist
        </div>
        {joined ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-300 text-sm font-medium flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" /> You're on the early access list!
          </div>
        ) : (
          <form onSubmit={handleJoin} className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter work email..."
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all"
            >
              Request Early Access
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
