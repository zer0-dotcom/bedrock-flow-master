'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [accountPending, setAccountPending] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [ssoError, setSsoError] = useState('');

  // Check for SSO error from redirect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const errorParam = params.get('error');
      if (errorParam) {
        const errorMessages: Record<string, string> = {
          sso_not_configured: 'Google SSO is not configured. Please contact an administrator.',
          google_denied: 'Google sign-in was cancelled or denied.',
          invalid_callback: 'Invalid authentication callback. Please try again.',
          state_mismatch: 'Security verification failed. Please try again.',
          token_exchange_failed: 'Failed to authenticate with Google. Please try again.',
          userinfo_failed: 'Failed to retrieve Google account information.',
          email_not_verified: 'Your Google email is not verified. Please verify it first.',
          sso_error: 'An unexpected error occurred during sign-in. Please try again.',
        };
        setSsoError(errorMessages[errorParam] || 'Authentication error. Please try again.');
        // Clean up URL
        window.history.replaceState({}, '', '/login');
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAccountPending(false);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.accountPending) {
          setAccountPending(true);
          setError(data.message);
        } else {
          setError(data.error || 'Login failed');
        }
        return;
      }

      // Redirect based on role
      router.push(data.redirectUrl);
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 mb-4">
            <span className="text-3xl font-black text-white">B</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Bedrock ESG</h1>
          <p className="text-slate-400 mt-2">Industrial Carbon Verification Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Sign In</h2>

          {/* Account Pending Warning */}
          {accountPending && (
            <div className="mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-500">Account Pending</p>
                  <p className="text-sm text-amber-400/80 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* SSO Error Message */}
          {ssoError && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-400">{ssoError}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && !accountPending && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-400">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email or Username Field */}
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-slate-300 mb-2">
                Email or Username
              </label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter your email or username"
                className={cn(
                  'w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-600',
                  'text-white placeholder-slate-500',
                  'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent',
                  'transition-all duration-200'
                )}
                required
                autoComplete="username"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={cn(
                  'w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-600',
                  'text-white placeholder-slate-500',
                  'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent',
                  'transition-all duration-200'
                )}
                required
                autoComplete="current-password"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full py-3 px-4 rounded-lg font-medium',
                'bg-emerald-600 hover:bg-emerald-500 text-white',
                'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-800',
                'transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Google SSO Divider */}
          <div className="mt-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-700" />
            <span className="text-sm text-slate-500">or</span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={() => {
              setGoogleLoading(true);
              setSsoError('');
              window.location.href = '/api/auth/google';
            }}
            disabled={googleLoading}
            className={cn(
              'mt-4 w-full py-3 px-4 rounded-lg font-medium',
              'bg-white hover:bg-gray-100 text-gray-800',
              'border border-slate-300',
              'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-800',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center justify-center gap-3'
            )}
          >
            {googleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {googleLoading ? 'Redirecting to Google...' : 'Sign in with Google'}
          </button>

          {/* Signup Links */}
          <div className="mt-6 pt-6 border-t border-slate-700 text-center space-y-3">
            <p className="text-slate-400 text-sm">
              Don&apos;t have an account?{' '}
              <a href="/signup" className="text-cyan-400 hover:text-cyan-300 font-medium">
                Create Sovereign Account
              </a>
            </p>
            <p className="text-slate-500 text-xs">
              or{' '}
              <a href="/signup/agent" className="text-amber-500 hover:text-amber-400 font-medium">
                register as an Agent
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-6">
          © 2026 Bedrock ESG. Carbon Credits for Industrial Recycling.
        </p>
      </div>
    </div>
  );
}
