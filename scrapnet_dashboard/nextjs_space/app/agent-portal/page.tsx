'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, UserPlus, Building2, ChevronRight, CheckCircle2, 
  AlertCircle, Loader2, Mail, User, AtSign, Phone, MapPin,
  Trophy, TrendingUp, Bell, Leaf, Recycle, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Yard {
  id: string;
  yardId: string;
  name: string;
  location: string | null;
  usersCount: number;
}

interface RegisteredFarmer {
  id: string;
  username: string;
  email: string;
  name: string;
  yardName: string;
  tempPassword: string;
}

interface PendingCounts {
  biocharBatches: number;
  recyclingLogs: number;
  total: number;
}

export default function AgentPortalPage() {
  // For now, simulate agent context (in production, get from auth)
  const [agentId] = useState('demo-agent-id');
  
  const [yards, setYards] = useState<Yard[]>([]);
  const [isLoadingYards, setIsLoadingYards] = useState(true);
  const [pendingCounts, setPendingCounts] = useState<PendingCounts>({ biocharBatches: 0, recyclingLogs: 0, total: 0 });
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);
  
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    yardId: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<RegisteredFarmer | null>(null);

  // Fetch yards and pending counts on mount
  useEffect(() => {
    fetchYards();
    fetchPendingCounts();
  }, []);

  const fetchYards = async () => {
    try {
      const response = await fetch('/api/yards');
      const data = await response.json();
      if (data.success) {
        setYards(data.yards);
      }
    } catch (err) {
      console.error('Failed to fetch yards:', err);
    } finally {
      setIsLoadingYards(false);
    }
  };

  const fetchPendingCounts = async () => {
    try {
      const response = await fetch('/api/agent/pending-counts');
      const data = await response.json();
      if (data.success) {
        setPendingCounts(data.counts);
      }
    } catch (err) {
      console.error('Failed to fetch pending counts:', err);
    } finally {
      setIsLoadingCounts(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/agent/register-farmer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          fullName: formData.fullName,
          username: formData.username,
          email: formData.email,
          phone: formData.phone || undefined,
          yardId: formData.yardId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to register farmer');
        return;
      }

      setSuccess({
        id: data.farmer.id,
        username: data.farmer.username,
        email: data.farmer.email,
        name: data.farmer.name,
        yardName: data.farmer.yardName,
        tempPassword: data.tempPassword,
      });

      // Reset form
      setFormData({
        fullName: '',
        username: '',
        email: '',
        phone: '',
        yardId: '',
      });
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetSuccess = () => {
    setSuccess(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <Users className="w-5 h-5" />
            <span className="text-sm font-medium">Agent Portal</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Agent Dashboard</h1>
          <p className="text-slate-400 mt-1">Register farmers and manage your network</p>
        </div>

        {/* Needs Your Attention Widget */}
        {!isLoadingCounts && pendingCounts.total > 0 && (
          <div className="mb-8 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-amber-500/20 animate-pulse">
                  <Bell className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    Needs Your Attention
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-sm font-bold">
                      {pendingCounts.total}
                    </span>
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Pending items require verification before carbon credits can be issued
                  </p>
                  
                  <div className="flex flex-wrap gap-4 mt-4">
                    {pendingCounts.biocharBatches > 0 && (
                      <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-2 rounded-lg">
                        <Leaf className="w-4 h-4 text-emerald-500" />
                        <span className="text-emerald-400 font-medium">{pendingCounts.biocharBatches}</span>
                        <span className="text-slate-400 text-sm">Biochar Batches</span>
                      </div>
                    )}
                    {pendingCounts.recyclingLogs > 0 && (
                      <div className="flex items-center gap-2 bg-blue-500/10 px-3 py-2 rounded-lg">
                        <Recycle className="w-4 h-4 text-blue-500" />
                        <span className="text-blue-400 font-medium">{pendingCounts.recyclingLogs}</span>
                        <span className="text-slate-400 text-sm">Recycling Logs</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <Link
                href="/agent-portal/verification-queue"
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium transition-colors whitespace-nowrap"
              >
                Open Queue
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* All Caught Up State */}
        {!isLoadingCounts && pendingCounts.total === 0 && (
          <div className="mb-8 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/20">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-emerald-400">All Caught Up!</h2>
                <p className="text-slate-400 text-sm">No pending items require your attention.</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-amber-500/10">
                <Users className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">--</p>
                <p className="text-sm text-slate-400">Registered Farmers</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <TrendingUp className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">--</p>
                <p className="text-sm text-slate-400">Total Commission</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Trophy className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">--</p>
                <p className="text-sm text-slate-400">Leaderboard Rank</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Register Farmer Form */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <UserPlus className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Register Farmer</h2>
                <p className="text-sm text-slate-400">Add a new farmer to your network</p>
              </div>
            </div>

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-emerald-400">Farmer Registered Successfully!</p>
                    <p className="text-sm text-emerald-300/80 mt-1">
                      A welcome email has been sent to {success.email}
                    </p>
                    
                    <div className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                      <p className="text-xs text-slate-400 mb-2">Login credentials (for your reference):</p>
                      <p className="text-sm text-white"><span className="text-slate-400">Name:</span> {success.name}</p>
                      <p className="text-sm text-white"><span className="text-slate-400">Username:</span> {success.username}</p>
                      <p className="text-sm text-white"><span className="text-slate-400">Yard:</span> {success.yardName}</p>
                      <p className="text-sm text-white">
                        <span className="text-slate-400">Temp Password:</span>{' '}
                        <code className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">{success.tempPassword}</code>
                      </p>
                    </div>
                    
                    <button
                      onClick={resetSuccess}
                      className="mt-4 text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      Register another farmer <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-red-400">{error}</p>
                </div>
              </div>
            )}

            {!success && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-slate-300 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="John Smith"
                    className={cn(
                      'w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-600',
                      'text-white placeholder-slate-500',
                      'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent',
                      'transition-all duration-200'
                    )}
                    required
                  />
                </div>

                {/* Username */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
                    <AtSign className="w-4 h-4 inline mr-1" />
                    Username <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="johnsmith"
                    className={cn(
                      'w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-600',
                      'text-white placeholder-slate-500',
                      'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent',
                      'transition-all duration-200'
                    )}
                    required
                    pattern="[a-zA-Z0-9_]{3,30}"
                    title="3-30 characters, letters, numbers, and underscores only"
                  />
                  <p className="text-xs text-slate-500 mt-1">3-30 characters, letters, numbers, underscores</p>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className={cn(
                      'w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-600',
                      'text-white placeholder-slate-500',
                      'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent',
                      'transition-all duration-200'
                    )}
                    required
                  />
                </div>

                {/* Phone (Optional) */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone <span className="text-slate-500">(optional)</span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 123-4567"
                    className={cn(
                      'w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-600',
                      'text-white placeholder-slate-500',
                      'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent',
                      'transition-all duration-200'
                    )}
                  />
                </div>

                {/* Yard Selection */}
                <div>
                  <label htmlFor="yardId" className="block text-sm font-medium text-slate-300 mb-2">
                    <Building2 className="w-4 h-4 inline mr-1" />
                    Assign to Yard <span className="text-red-400">*</span>
                  </label>
                  {isLoadingYards ? (
                    <div className="flex items-center gap-2 py-3 text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading yards...
                    </div>
                  ) : yards.length === 0 ? (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <p className="text-sm text-amber-400">No yards available. Please contact admin to create yards first.</p>
                    </div>
                  ) : (
                    <select
                      id="yardId"
                      name="yardId"
                      value={formData.yardId}
                      onChange={handleChange}
                      className={cn(
                        'w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-600',
                        'text-white',
                        'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent',
                        'transition-all duration-200'
                      )}
                      required
                    >
                      <option value="" className="bg-slate-900">Select a yard...</option>
                      {yards.map((yard) => (
                        <option key={yard.id} value={yard.id} className="bg-slate-900">
                          {yard.name} {yard.location ? `- ${yard.location}` : ''} ({yard.usersCount} farmers)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Info Note */}
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-xs text-blue-400">
                    <strong>Note:</strong> A temporary password will be generated and sent to the farmer&apos;s email. 
                    They will be prompted to change it on first login.
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || yards.length === 0}
                  className={cn(
                    'w-full py-3 px-4 rounded-lg font-medium',
                    'bg-amber-600 hover:bg-amber-500 text-white',
                    'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-800',
                    'transition-all duration-200',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Registering...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <UserPlus className="w-5 h-5" />
                      Register Farmer
                    </span>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Yards Overview */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <MapPin className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Available Yards</h2>
                <p className="text-sm text-slate-400">Yards you can assign farmers to</p>
              </div>
            </div>

            {isLoadingYards ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : yards.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No yards available</p>
                <p className="text-sm text-slate-500 mt-1">Contact admin to create yards</p>
              </div>
            ) : (
              <div className="space-y-3">
                {yards.map((yard) => (
                  <div
                    key={yard.id}
                    className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-emerald-500/30 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-white">{yard.name}</h3>
                        {yard.location && (
                          <p className="text-sm text-slate-400 mt-0.5">{yard.location}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs">
                          <Users className="w-3 h-3" />
                          {yard.usersCount} farmers
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">ID: {yard.yardId}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
