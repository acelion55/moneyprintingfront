import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full border-t border-white/10 bg-black/40 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="font-bold text-lg text-white mb-3">MoneyHiest</h3>
          <p className="text-sm text-gray-400">
            Enterprise RAG-driven WhatsApp AI automation and cloud calling platform for modern teams.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-white mb-3">Product</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><Link href="/features" className="hover:text-white">WhatsApp RAG Bot</Link></li>
            <li><Link href="/features" className="hover:text-white">IVR Cloud Calling</Link></li>
            <li><Link href="/features" className="hover:text-white">AI Voice Agents</Link></li>
            <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-white mb-3">Company</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><Link href="/about" className="hover:text-white">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact & Support</Link></li>
            <li><Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-white mb-3">System Status</h4>
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            All Operational
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 mt-8 pt-6 border-t border-white/5 text-xs text-gray-500 text-center">
        © {new Date().getFullYear()} MoneyHiest Inc. All rights reserved.
      </div>
    </footer>
  );
}
