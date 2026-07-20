'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/contexts/sidebar-context';
import {
  LayoutDashboard,
  Calculator,
  FolderOpen,
  BarChart3,
  Leaf,
  Flame,
  Package,
  Users,
  Coins,
  Recycle,
  Truck,
  Scale,
  CircleDot,
  Vault,
  Shield,
  Activity,
  Globe,
  BookOpen,
  History,
  Home,
  X,
  Upload,
  Eye,
  ShieldAlert,
} from 'lucide-react';

type ServiceType = 'ASPHALT' | 'BIOCHAR' | 'METAL' | 'VAULT' | 'IMPACT' | 'LEDGER';

const personalNavItems = [
  { name: 'Verification Repository', href: '/vault', icon: Home },
];

const asphaltNavItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Carbon Calculator', href: '/calculator', icon: Calculator },
  { name: 'RAP Projects', href: '/projects', icon: FolderOpen },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
];

const biocharNavItems = [
  { name: 'CDR Calculator', href: '/biochar', icon: Flame },
  { name: 'Biochar Batches', href: '/biochar/batches', icon: Package },
  { name: 'Farmers', href: '/farmers', icon: Users },
  { name: 'CDR Credits', href: '/credits', icon: Coins },
];

const metalNavItems = [
  { name: 'Metal Dashboard', href: '/metal', icon: Recycle },
  { name: 'Recovery Log', href: '/metal/logs', icon: Truck },
  { name: 'Calculator', href: '/metal/calculator', icon: Scale },
];

const submissionNavItems = [
  { name: 'Submission Portal', href: '/submission-portal', icon: Upload },
];

const discoveryNavItems = [
  { name: 'Asset Discovery', href: '/discovery', icon: Eye },
];

const adminNavItems = [
  { name: 'Admin Panel', href: '/admin', icon: ShieldAlert },
];

const vaultNavItems = [
  { name: 'Verification Repository', href: '/vault-node', icon: Vault },
];

const impactNavItems = [
  { name: 'Impact Engine', href: '/impact', icon: Activity },
  { name: 'Global Ledger', href: '/global-ledger', icon: Globe },
];

const ledgerNavItems = [
  { name: 'Consolidated Ledger', href: '/ledger', icon: BookOpen },
  { name: 'Remediation Logs', href: '/legacy-healer', icon: History },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { close } = useSidebar();
  const [userServices, setUserServices] = useState<ServiceType[]>(['ASPHALT', 'BIOCHAR']);
  
  useEffect(() => {
    // In production, this would come from the authenticated user's session
    // For now, check localStorage or default to showing all services
    const storedServices = localStorage.getItem('userServices');
    if (storedServices) {
      try {
        setUserServices(JSON.parse(storedServices));
      } catch {
        setUserServices(['ASPHALT', 'BIOCHAR', 'METAL', 'VAULT', 'IMPACT', 'LEDGER']);
      }
    } else {
      // Default: show all services for demo (including Vault for certified nodes)
      setUserServices(['ASPHALT', 'BIOCHAR', 'METAL', 'VAULT', 'IMPACT', 'LEDGER']);
    }
  }, []);

  const hasService = (service: ServiceType) => userServices.includes(service);

  // Close sidebar when navigating on mobile
  const handleNavClick = () => {
    // Only close on mobile (check window width)
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      close();
    }
  };

  return (
    <aside className="flex h-full w-64 flex-col bg-gradient-to-b from-emerald-900 to-emerald-950 dark:from-slate-900 dark:to-slate-950 overflow-y-auto">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between gap-3 px-6 border-b border-emerald-800/50 dark:border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
            <Leaf className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Bedrock ESG</h1>
            <p className="text-xs text-emerald-300/70">Circular Trifecta</p>
          </div>
        </div>
        {/* Close button - Mobile Only */}
        <button
          onClick={close}
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-emerald-500/20 transition-colors md:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5 text-emerald-300" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-5 overflow-y-auto">
        {/* Personal Section */}
        <div>
          <h3 className="px-4 text-xs font-semibold uppercase tracking-wider text-cyan-400/60 mb-2 flex items-center gap-2">
            <CircleDot className="h-3 w-3" /> My Account
          </h3>
          <div className="space-y-1">
            {personalNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 shadow-lg shadow-cyan-500/10'
                      : 'text-emerald-100/70 hover:bg-cyan-500/10 hover:text-cyan-100'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Asphalt Engine Section */}
        {hasService('ASPHALT') && (
          <div>
            <h3 className="px-4 text-xs font-semibold uppercase tracking-wider text-emerald-400/60 mb-2 flex items-center gap-2">
              <CircleDot className="h-3 w-3" /> Asphalt (RAP)
            </h3>
            <div className="space-y-1">
              {asphaltNavItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNavClick}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300 shadow-lg shadow-emerald-500/10'
                        : 'text-emerald-100/70 hover:bg-emerald-500/10 hover:text-emerald-100'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Biochar Engine Section */}
        {hasService('BIOCHAR') && (
          <div>
            <h3 className="px-4 text-xs font-semibold uppercase tracking-wider text-amber-400/60 mb-2 flex items-center gap-2">
              <CircleDot className="h-3 w-3" /> Biochar (CDR)
            </h3>
            <div className="space-y-1">
              {biocharNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNavClick}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-amber-500/20 text-amber-300 shadow-lg shadow-amber-500/10'
                        : 'text-emerald-100/70 hover:bg-amber-500/10 hover:text-amber-100'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Metal Engine Section */}
        {hasService('METAL') && (
          <div>
            <h3 className="px-4 text-xs font-semibold uppercase tracking-wider text-cyan-400/60 mb-2 flex items-center gap-2">
              <CircleDot className="h-3 w-3" /> Metal (Recovery)
            </h3>
            <div className="space-y-1">
              {metalNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNavClick}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 shadow-lg shadow-cyan-500/10'
                        : 'text-emerald-100/70 hover:bg-cyan-500/10 hover:text-cyan-100'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Business Submission Portal */}
        <div>
          <h3 className="px-4 text-xs font-semibold uppercase tracking-wider text-cyan-400/60 mb-2 flex items-center gap-2">
            <Upload className="h-3 w-3" /> Submissions
          </h3>
          <div className="space-y-1">
            {submissionNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 shadow-lg shadow-cyan-500/10'
                      : 'text-emerald-100/70 hover:bg-cyan-500/10 hover:text-cyan-100'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Asset Discovery — v2.4 */}
        <div>
          <h3 className="px-4 text-xs font-semibold uppercase tracking-wider text-violet-400/60 mb-2 flex items-center gap-2">
            <Eye className="h-3 w-3" /> Discovery
          </h3>
          <div className="space-y-1">
            {discoveryNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-violet-500/20 text-violet-300 shadow-lg shadow-violet-500/10'
                      : 'text-emerald-100/70 hover:bg-violet-500/10 hover:text-violet-100'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Admin Control — Founder / Admin Only */}
        <div>
          <h3 className="px-4 text-xs font-semibold uppercase tracking-wider text-red-400/60 mb-2 flex items-center gap-2">
            <ShieldAlert className="h-3 w-3" /> Admin
          </h3>
          <div className="space-y-1">
            {adminNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-red-500/20 text-red-300 shadow-lg shadow-red-500/10'
                      : 'text-emerald-100/70 hover:bg-red-500/10 hover:text-red-100'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Verification Repository Section - Certified Operators Only */}
        {hasService('VAULT') && (
          <div>
            <h3 className="px-4 text-xs font-semibold uppercase tracking-wider text-violet-400/60 mb-2 flex items-center gap-2">
              <Shield className="h-3 w-3" /> Verification (Certified)
            </h3>
            <div className="space-y-1">
              {vaultNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNavClick}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-violet-500/20 text-violet-300 shadow-lg shadow-violet-500/10'
                        : 'text-emerald-100/70 hover:bg-violet-500/10 hover:text-violet-100'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Impact Engine Section - Financed Emissions */}
        {hasService('IMPACT') && (
          <div>
            <h3 className="px-4 text-xs font-semibold uppercase tracking-wider text-rose-400/60 mb-2 flex items-center gap-2">
              <Activity className="h-3 w-3" /> Impact (Financed)
            </h3>
            <div className="space-y-1">
              {impactNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNavClick}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-rose-500/20 text-rose-300 shadow-lg shadow-rose-500/10'
                        : 'text-emerald-100/70 hover:bg-rose-500/10 hover:text-rose-100'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Consolidated Ledger Section - 70/20/10 Law */}
        {hasService('LEDGER') && (
          <div>
            <h3 className="px-4 text-xs font-semibold uppercase tracking-wider text-amber-400/60 mb-2 flex items-center gap-2">
              <Scale className="h-3 w-3" /> Compliance (70/20/10)
            </h3>
            <div className="space-y-1">
              {ledgerNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNavClick}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-amber-500/20 text-amber-300 shadow-lg shadow-amber-500/10'
                        : 'text-emerald-100/70 hover:bg-amber-500/10 hover:text-amber-100'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Footer - Service Summary (hidden on mobile to save space) */}
      <div className="p-4 border-t border-emerald-800/50 dark:border-slate-800/50 space-y-2 hidden md:block">
        {hasService('ASPHALT') && (
          <div className="rounded-lg bg-emerald-500/10 p-2">
            <p className="text-xs font-semibold text-emerald-300">RAP Target</p>
            <p className="text-xs text-emerald-300/80">&lt;45 kg CO₂/ton</p>
          </div>
        )}
        {hasService('BIOCHAR') && (
          <div className="rounded-lg bg-amber-500/10 p-2">
            <p className="text-xs font-semibold text-amber-300">CDR H:Corg</p>
            <p className="text-xs text-amber-300/80">&lt;0.4 ratio</p>
          </div>
        )}
        {hasService('METAL') && (
          <div className="rounded-lg bg-cyan-500/10 p-2">
            <p className="text-xs font-semibold text-cyan-300">Metal Avoided</p>
            <p className="text-xs text-cyan-300/80">1.89 t CO₂/t Steel</p>
          </div>
        )}
        {hasService('VAULT') && (
          <div className="rounded-lg bg-violet-500/10 p-2">
            <p className="text-xs font-semibold text-violet-300">Verification Node</p>
            <p className="text-xs text-violet-300/80">Level 5 Certified</p>
          </div>
        )}
        {hasService('IMPACT') && (
          <div className="rounded-lg bg-rose-500/10 p-2">
            <p className="text-xs font-semibold text-rose-300">Trade Footprint</p>
            <p className="text-xs text-rose-300/80">2.45g CO₂/trade</p>
          </div>
        )}
        {hasService('LEDGER') && (
          <div className="rounded-lg bg-amber-500/10 p-2">
            <p className="text-xs font-semibold text-amber-300">Consolidated Ledger</p>
            <p className="text-xs text-amber-300/80">70/20/10 Split</p>
          </div>
        )}
      </div>
    </aside>
  );
}
