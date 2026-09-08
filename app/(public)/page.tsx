import Link from 'next/link';
import { MessageSquare, PhoneCall, Bot, ShieldCheck, Zap, Database } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-6 pt-16 pb-24">
      {/* Hero Section */}
      <div className="text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold uppercase tracking-wider">
          🚀 Next-Gen Multi-Tenant AI Automation
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white">
          Automate Support & Sales with <span className="gradient-text">Qdrant RAG</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
          Connect your business knowledge base, FAQs, and documents directly to WhatsApp AI agents and automated IVR voice bots in minutes.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-purple-500/30 transition-all hover:scale-105"
          >
            Start Free Trial
          </Link>
          <Link
            href="/features"
            className="w-full sm:w-auto px-8 py-4 rounded-xl glass-panel text-white font-medium hover:bg-white/10 transition-all"
          >
            Explore Modules
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
        <div className="glass-panel p-8 rounded-2xl border border-white/10 hover:border-purple-500/40 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 text-emerald-400">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">WhatsApp Automation</h3>
          <p className="text-gray-400 text-sm">
            Ingest PDFs, company FAQs, and custom voice guidelines into Qdrant vector database for instant customer responses.
          </p>
        </div>

        <div className="glass-panel p-8 rounded-2xl border border-white/10 hover:border-purple-500/40 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 text-blue-400">
            <PhoneCall className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Smart IVR Calling</h3>
          <p className="text-gray-400 text-sm">
            Configure dynamic multi-level phone trees and call routing with instant speech-to-text response dispatching.
          </p>
        </div>

        <div className="glass-panel p-8 rounded-2xl border border-white/10 hover:border-purple-500/40 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 text-purple-400">
            <Bot className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">AI Voice Calling</h3>
          <p className="text-gray-400 text-sm">
            Human-like conversational AI phone agents that schedule appointments, qualify leads, and follow up autonomously.
          </p>
        </div>
      </div>
    </div>
  );
}
