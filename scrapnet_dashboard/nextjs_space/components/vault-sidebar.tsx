'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  History,
  Users,
  Settings,
  Shield,
  Leaf,
  LogOut,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { 
    name: 'Dashboard', 
    href: '/vault', 
    icon: LayoutDashboard,
    description: 'Your sovereign overview'
  },
  { 
    name: 'Ledger History', 
    href: '/vault/history', 
    icon: History,
    description: 'Transaction records'
  },
  { 
    name: 'Community Credits', 
    href: '/vault/community', 
    icon: Users,
    description: '10% Public Resilience'
  },
  { 
    name: 'Settings', 
    href: '/vault/settings', 
    icon: Settings,
    description: 'Profile & preferences'
  },
];

export default function VaultSidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-3 lg:px-4 border-b border-gray-800/50">
        <Link href="/vault" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
            <Leaf className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-semibold text-white">Sovereign</p>
            <p className="text-xs text-cyan-400">Ledger</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 lg:px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/vault' && pathname?.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200",
                "hover:bg-[#1a1a1a]",
                isActive 
                  ? "bg-cyan-500/10 border border-cyan-500/30" 
                  : "border border-transparent"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 flex-shrink-0 transition-colors",
                isActive ? "text-cyan-400" : "text-gray-500 group-hover:text-gray-300"
              )} />
              <div className="hidden lg:block flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium truncate transition-colors",
                  isActive ? "text-white" : "text-gray-400 group-hover:text-white"
                )}>
                  {item.name}
                </p>
                <p className="text-xs text-gray-600 truncate">{item.description}</p>
              </div>
              {isActive && (
                <ChevronRight className="w-4 h-4 text-cyan-400 hidden lg:block" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 lg:p-3 border-t border-gray-800/50 space-y-2">
        {/* Security Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-emerald-400">Private Ledger</span>
        </div>
        
        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center lg:justify-start gap-2 px-3 py-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="hidden lg:block text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
}
