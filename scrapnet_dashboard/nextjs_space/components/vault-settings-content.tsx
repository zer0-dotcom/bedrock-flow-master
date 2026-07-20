'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import VaultSidebar from './vault-sidebar';
import {
  Settings, Loader2, ChevronLeft, Lock, Shield, User,
  Mail, Bell, Eye, EyeOff, Save, Menu, X, Check
} from 'lucide-react';

export default function VaultSettingsContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userData, setUserData] = useState<{
    name: string;
    email: string;
    notifications: boolean;
    showInCommunity: boolean;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/vault');
        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
        }

        setUserData({
          name: data.user?.name || '',
          email: data.user?.email || '',
          notifications: true,
          showInCommunity: false
        });
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-screen w-64 bg-[#0a0a0a] border-r border-gray-800/50 z-40 transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        "md:w-16 lg:w-64"
      )}>
        <VaultSidebar />
      </div>

      {/* Main Content */}
      <main className="md:ml-16 lg:ml-64 min-h-screen p-4 md:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/vault"
                className="p-2 rounded-lg bg-[#1a1a1a] border border-gray-800 text-gray-400 hover:text-white transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-400" />
                  Settings
                </h1>
                <p className="text-sm text-gray-500">Manage your preferences</p>
              </div>
            </div>
          </div>

          {/* Profile Section */}
          <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
            <h3 className="text-sm font-medium text-white flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-cyan-400" />
              Profile Information
              <span className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-800 text-xs text-gray-400">
                <Lock className="w-3 h-3" />
                Encrypted
              </span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={userData?.name || ''}
                  onChange={(e) => setUserData(prev => prev ? {...prev, name: e.target.value} : null)}
                  className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-gray-800 text-white focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={userData?.email || ''}
                  onChange={(e) => setUserData(prev => prev ? {...prev, email: e.target.value} : null)}
                  className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-gray-800 text-white focus:border-cyan-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
            <h3 className="text-sm font-medium text-white flex items-center gap-2 mb-4">
              <Bell className="w-4 h-4 text-cyan-400" />
              Preferences
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">Email Notifications</p>
                  <p className="text-xs text-gray-500">Receive updates about your settlements</p>
                </div>
                <button
                  onClick={() => setUserData(prev => prev ? {...prev, notifications: !prev.notifications} : null)}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    userData?.notifications ? "bg-cyan-500" : "bg-gray-700"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform",
                    userData?.notifications ? "translate-x-6" : "translate-x-0.5"
                  )} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">Show in Community</p>
                  <p className="text-xs text-gray-500">Display your contributions publicly</p>
                </div>
                <button
                  onClick={() => setUserData(prev => prev ? {...prev, showInCommunity: !prev.showInCommunity} : null)}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    userData?.showInCommunity ? "bg-cyan-500" : "bg-gray-700"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform",
                    userData?.showInCommunity ? "translate-x-6" : "translate-x-0.5"
                  )} />
                </button>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
            <h3 className="text-sm font-medium text-white flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-emerald-400" />
              Security
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0a0a0a] border border-gray-800">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-400">End-to-End Encryption</span>
                </div>
                <span className="text-xs text-emerald-400">Active</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0a0a0a] border border-gray-800">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-400">Private Ledger</span>
                </div>
                <span className="text-xs text-emerald-400">Enabled</span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition",
              saved 
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:from-cyan-400 hover:to-emerald-400"
            )}
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : saved ? (
              <><Check className="w-5 h-5" /> Saved</>
            ) : (
              <><Save className="w-5 h-5" /> Save Changes</>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
