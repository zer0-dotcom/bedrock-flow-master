'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Leaf, AlertCircle, CheckCircle2, Loader2, UserCheck, Key, Mail, User, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AgentSignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    invitationCode: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/agent-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationCode: formData.invitationCode,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 mb-4">
            <Leaf className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-3xl font-bold text-white">Agent Registration</h1>
          <p className="text-slate-400 mt-2">Join the Bedrock ESG Agent Network</p>
        </div>

        {/* Success Message */}
        {success ? (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Registration Successful!</h2>
            <p className="text-slate-400 mb-4">
              Your account is pending review. You will be notified once your account is approved.
            </p>
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-400">
                <span className="font-medium">Status:</span> Review Required
              </p>
              <p className="text-xs text-amber-400/70 mt-1">
                You cannot verify yards until your account is approved.
              </p>
            </div>
            <p className="text-sm text-slate-500 mt-4">Redirecting to login...</p>
          </div>
        ) : (
          /* Signup Card */
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Create Agent Account</h2>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-red-400">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Invitation Code Field */}
              <div>
                <label htmlFor="invitationCode" className="block text-sm font-medium text-slate-300 mb-2">
                  <Key className="w-4 h-4 inline mr-1" />
                  Invitation Code <span className="text-red-400">*</span>
                </label>
                <input
                  id="invitationCode"
                  name="invitationCode"
                  type="text"
                  value={formData.invitationCode}
                  onChange={handleChange}
                  placeholder="SCRAP-XXXXXXXX"
                  className={cn(
                    'w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-amber-600/50',
                    'text-white placeholder-slate-500 uppercase',
                    'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent',
                    'transition-all duration-200'
                  )}
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Enter the invitation code provided by your referrer</p>
              </div>

              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
                  <UserCheck className="w-4 h-4 inline mr-1" />
                  Username <span className="text-red-400">*</span>
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose a unique username"
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
                <p className="text-xs text-slate-500 mt-1">3-30 characters, letters, numbers, and underscores only</p>
              </div>

              {/* Email Field */}
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
                  placeholder="agent@example.com"
                  className={cn(
                    'w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-600',
                    'text-white placeholder-slate-500',
                    'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent',
                    'transition-all duration-200'
                  )}
                  required
                />
              </div>

              {/* Full Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className={cn(
                    'w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-600',
                    'text-white placeholder-slate-500',
                    'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent',
                    'transition-all duration-200'
                  )}
                  required
                />
              </div>

              {/* Phone Field (Optional) */}
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

              {/* Password Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                    Password <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 8 chars"
                    className={cn(
                      'w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-600',
                      'text-white placeholder-slate-500',
                      'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent',
                      'transition-all duration-200'
                    )}
                    required
                    minLength={8}
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
                    Confirm <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm"
                    className={cn(
                      'w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-600',
                      'text-white placeholder-slate-500',
                      'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent',
                      'transition-all duration-200'
                    )}
                    required
                    minLength={8}
                  />
                </div>
              </div>

              {/* Review Notice */}
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-400">
                  <strong>Note:</strong> Your account will be set to &quot;Review Required&quot; status. 
                  You cannot verify yards until an administrator approves your account.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  'w-full py-3 px-4 rounded-lg font-medium',
                  'bg-amber-600 hover:bg-amber-500 text-white',
                  'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-800',
                  'transition-all duration-200',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Account...
                  </span>
                ) : (
                  'Create Agent Account'
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 pt-6 border-t border-slate-700 text-center">
              <p className="text-slate-400">
                Already have an account?{' '}
                <Link href="/login" className="text-amber-500 hover:text-amber-400 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-6">
          © 2026 Bedrock ESG. Carbon Credits for Industrial Recycling.
        </p>
      </div>
    </div>
  );
}
