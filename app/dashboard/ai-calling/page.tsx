'use client';

import React, { useState } from 'react';
import { Bot, Sparkles, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function AiCallingPage() {
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/waitlist/join', { email, module: 'ai-calling' });
      setJoined(true);
      toast.success('Joined AI Calling waitlist!');
    } catch (err: any) {
      toast.error('Failed to join waitlist');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-16 text-center space-y-8">
      <div className="w-20 h-20 rounded-3xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400 shadow-xl shadow-purple-500/10">
        <Bot className="w-10 h-10 animate-pulse" />
      </div>
      <div className="space-y-3">
        <span className="px-4 py-1.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold tracking-wide uppercase">
          Coming Soon
        </span>
        <h1 className="text-4xl font-extrabold text-white">AI Voice Calling Agents</h1>
        <p className="text-gray-400 text-base max-w-xl mx-auto">
          Ultra-low latency autonomous conversational agents that call prospects, resolve inquiries, and execute outbound campaigns with Qdrant memory context.
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
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-all shadow-lg shadow-purple-500/25"
            >
              Request Early Access
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
