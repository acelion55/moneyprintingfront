'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { MessageSquare, PhoneCall, Bot, LogOut, Home, User, Users, Mail } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, fetchUser, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return null;
  }

  const navItems = [
    { name: 'WhatsApp Automation', path: '/dashboard/whatsapp', icon: MessageSquare, badge: 'Active Module' },
    { name: 'IVR Cloud Calling', path: '/dashboard/ivr-calling', icon: PhoneCall, badge: 'Coming Soon' },
    { name: 'AI Voice Calling', path: '/dashboard/ai-calling', icon: Bot, badge: 'Coming Soon' },
    ...(user?.role === 'admin'
      ? [
          { name: 'Leads', path: '/dashboard/leads', icon: Mail, badge: 'Admin Only' },
          { name: 'User Management', path: '/dashboard/admin', icon: Users, badge: 'Admin Only' },
        ]
      : []),
  ];

  return (
    <div className="h-screen flex bg-[#090a0f] text-gray-100 overflow-hidden">
      {/* Sidebar — fixed height, scrollable internally */}
      <aside className="w-56 flex-shrink-0 glass-panel border-r border-white/10 flex flex-col h-full overflow-hidden">
        {/* Top scrollable area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-5 p-4">
          {/* Logo */}
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-white text-xs">
                M
              </div>
              <span className="font-bold text-sm text-white">Master Panel</span>
            </Link>
            <Link href="/" title="Back to Website" className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5">
              <Home className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Nav */}
          <div className="space-y-0.5">
            <div className="text-[10px] font-semibold uppercase text-gray-500 px-2 mb-1.5 tracking-wider">Modules</div>
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </div>
                  {item.badge === 'Active Module' ? (
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full flex-shrink-0">Live</span>
                  ) : item.badge === 'Admin Only' ? (
                    <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full flex-shrink-0">Admin</span>
                  ) : (
                    <span className="text-[9px] bg-white/10 text-gray-500 px-1.5 py-0.5 rounded-full flex-shrink-0">Soon</span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Sticky bottom — user profile */}
        <div className="flex-shrink-0 p-4 border-t border-white/10 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 flex-shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-white truncate">{user?.name || 'User'}</div>
              <div className="text-[10px] text-gray-500 truncate">{user?.tenantId || 'Tenant'}</div>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 text-[11px] font-medium transition-colors"
          >
            <LogOut className="w-3 h-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
