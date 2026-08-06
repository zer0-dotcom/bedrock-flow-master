'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { cn } from '@/lib/utils';
import { resolveRole } from '@/lib/rbac';
import {
  ChevronRight, ChevronLeft, CheckCircle2, Loader2, AlertCircle,
  Zap, Lock, Shield, Wallet, Building2, Home, MapPin,
  QrCode, Server, Radio, Wifi, Terminal, Eye, Copy, ExternalLink,
  Smartphone, Network
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────────────────── */
type PropertyType = 'RESIDENTIAL' | 'COMMERCIAL';
type BmsProtocol = 'BACNET_IP' | 'MODBUS' | 'NIAGARA';

interface PropertyData {
  streetAddress: string;
  annualUtilityBaseline: string;
}

interface TelemetryConfig {
  bmsProtocol: BmsProtocol;
  targetEndpointUri: string;
  apiAccessToken: string;
}

type WizardStep = 1 | 2 | 3 | 'success';

/* ─── Step Config ────────────────────────────────────────────────────────── */
const STEP_LABELS = ['Identity Handshake', 'Property Asset Mapping', 'Telemetry Bridge'] as const;

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function OnboardingPage() {
  const router = useRouter();
  const { publicKey, connected } = useWallet();

  // Auth state
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userRole, setUserRole] = useState<string>('CLIENT_OWNER');

  // Wizard state
  const [step, setStep] = useState<WizardStep>(1);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [walletCopied, setWalletCopied] = useState(false);

  // Property state
  const [propertyType, setPropertyType] = useState<PropertyType>('RESIDENTIAL');
  const [propertyData, setPropertyData] = useState<PropertyData>({
    streetAddress: '',
    annualUtilityBaseline: '',
  });

  // Telemetry state
  const [telemetryConfig, setTelemetryConfig] = useState<TelemetryConfig>({
    bmsProtocol: 'BACNET_IP',
    targetEndpointUri: '',
    apiAccessToken: '',
  });
  const [qrScanning, setQrScanning] = useState(false);

  // Submission state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* ─── Auth Check ───────────────────────────────────────────────────────── */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (!data.success) { router.push('/login'); return; }
        if (data.user.onboardingComplete) { router.push('/vault'); return; }
        // Pre-fill Google connection if user logged in via SSO
        if (data.user.email) {
          setGoogleEmail(data.user.email);
          setGoogleConnected(true);
        }
        if (data.user.role) setUserRole(data.user.role);
      } catch { router.push('/login'); }
      finally { setCheckingAuth(false); }
    };
    checkAuth();
  }, [router]);

  // Check for Google SSO callback
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('google') === 'connected') {
      setGoogleConnected(true);
      window.history.replaceState({}, '', '/onboarding');
    }
  }, []);

  /* ─── Derived Values ───────────────────────────────────────────────────── */
  const canProceedStep1 = googleConnected || connected;
  const canProceedStep2 = propertyData.streetAddress.trim().length > 0;
  const canProceedStep3 = propertyType === 'RESIDENTIAL'
    ? true // QR scanning is optional
    : telemetryConfig.targetEndpointUri.trim().length > 0;

  /* ─── Handlers ─────────────────────────────────────────────────────────── */
  const handleGoogleConnect = () => {
    window.location.href = '/api/auth/google';
  };

  const copyWalletAddress = useCallback(async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey.toBase58());
      setWalletCopied(true);
      setTimeout(() => setWalletCopied(false), 2000);
    }
  }, [publicKey]);

  const handleStartQrScan = () => {
    setQrScanning(true);
    // Simulate QR scan handshake for Aethexer Mobile App
    setTimeout(() => setQrScanning(false), 3000);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      // Determine the role to assign based on property type
      const role = propertyType === 'RESIDENTIAL' ? 'SOVEREIGN_INDIVIDUAL' : 'BUSINESS_OWNER';

      const profilePayload: Record<string, unknown> = {
        role,
        profileData: {
          propertyType,
          streetAddress: propertyData.streetAddress,
          annualUtilityBaseline: propertyData.annualUtilityBaseline,
          ...(connected && publicKey ? { solanaWallet: publicKey.toBase58() } : {}),
          ...(propertyType === 'COMMERCIAL' ? {
            bmsProtocol: telemetryConfig.bmsProtocol,
            targetEndpointUri: telemetryConfig.targetEndpointUri,
          } : {
            telemetryBridge: 'aethexer_mobile',
          }),
        },
      };

      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profilePayload),
      });
      const data = await res.json();

      if (data.success) {
        setStep('success');
        // RBAC routing after delay
        const resolved = resolveRole(role);
        setTimeout(() => {
          if (propertyType === 'RESIDENTIAL') {
            router.push('/vault'); // Consumer Portal
          } else {
            router.push('/analytics'); // Executive Deck
          }
        }, 3000);
      } else {
        setError(data.error || 'Profile save failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goNext = () => {
    if (step === 3) { handleSubmit(); return; }
    if (typeof step === 'number') setStep((step + 1) as WizardStep);
  };
  const goBack = () => {
    if (typeof step === 'number' && step > 1) setStep((step - 1) as WizardStep);
  };

  /* ─── Loading Gate ─────────────────────────────────────────────────────── */
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  /* ─── Success State ────────────────────────────────────────────────────── */
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-emerald-400 font-mono tracking-wide">
              Telemetry Streams Synchronized // 200 OK
            </h1>
            <p className="text-gray-400">
              {propertyType === 'RESIDENTIAL'
                ? 'Routing to Consumer Portal...'
                : 'Routing to Executive Deck...'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-sm text-emerald-400/70 font-mono">RBAC GATEWAY ACTIVE</span>
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" style={{ animationDelay: '0.3s' }} />
          </div>
          <div className="mt-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-left">
                <p className="text-gray-500">Property Class</p>
                <p className="text-white font-medium">{propertyType === 'RESIDENTIAL' ? 'Residential' : 'Commercial'}</p>
              </div>
              <div className="text-left">
                <p className="text-gray-500">Annual Utility Baseline</p>
                <p className="text-emerald-400 font-mono font-medium">
                  {propertyData.annualUtilityBaseline || '—'}
                </p>
              </div>
              <div className="text-left">
                <p className="text-gray-500">Wallet</p>
                <p className="text-violet-400 font-mono text-xs">
                  {connected && publicKey ? `${publicKey.toBase58().slice(0, 6)}...${publicKey.toBase58().slice(-4)}` : 'Not linked'}
                </p>
              </div>
              <div className="text-left">
                <p className="text-gray-500">Telemetry</p>
                <p className="text-cyan-400 font-medium text-xs">
                  {propertyType === 'RESIDENTIAL' ? 'Aethexer Mobile' : telemetryConfig.bmsProtocol.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Main Wizard ──────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8 sm:py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 flex items-center justify-center">
              <Zap className="w-6 h-6 text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Sovereign Onboarding
            </h1>
          </div>
          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
              <Lock className="w-3 h-3" />
              <span>End-to-End Encrypted</span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-400">
              <Shield className="w-3 h-3" />
              <span>Private Ledger</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEP_LABELS.map((label, i) => {
            const stepNum = (i + 1) as 1 | 2 | 3;
            const isActive = step === stepNum;
            const isComplete = typeof step === 'number' && step > stepNum;
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300',
                  isActive ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' :
                  isComplete ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                  'bg-gray-800/60 text-gray-500 border border-gray-700/50'
                )}>
                  <span className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                    isActive ? 'bg-cyan-500/30' :
                    isComplete ? 'bg-emerald-500/30' :
                    'bg-gray-700'
                  )}>
                    {isComplete ? <CheckCircle2 className="w-3 h-3" /> : stepNum}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </div>
                {i < 2 && <ChevronRight className="w-3 h-3 text-gray-600" />}
              </div>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* ═══ STEP 1: IDENTITY HANDSHAKE ═══ */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-[#111111] rounded-2xl border border-gray-800 p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-white mb-1">Identity Handshake</h2>
              <p className="text-sm text-gray-500 mb-6">Establish your sovereign identity through SSO or on-chain wallet.</p>

              {/* Google SSO */}
              <div className="mb-6">
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-3">Google SSO</label>
                {googleConnected ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/30">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-emerald-400">Google Account Connected</p>
                      <p className="text-xs text-gray-500 truncate">{googleEmail}</p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleGoogleConnect}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-white hover:bg-gray-100 transition-colors text-gray-800 font-semibold text-sm"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Connect Google Account
                  </button>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-gray-800" />
                <span className="text-xs text-gray-600 uppercase tracking-wider">and / or</span>
                <div className="flex-1 h-px bg-gray-800" />
              </div>

              {/* Phantom Wallet */}
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-3">
                  <Wallet className="w-3 h-3 inline mr-1" />
                  Phantom Wallet
                </label>
                {connected && publicKey ? (
                  <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/30 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-sm font-medium text-emerald-400">Wallet Connected</span>
                    </div>
                    <div className="flex items-center gap-2 bg-[#0a0a0a] rounded-lg p-3">
                      <Wallet className="h-4 w-4 text-violet-400 flex-shrink-0" />
                      <code className="text-sm text-gray-200 font-mono flex-1 truncate">
                        {publicKey.toBase58().slice(0, 6)}...{publicKey.toBase58().slice(-4)}
                      </code>
                      <button onClick={copyWalletAddress} className="p-1.5 hover:bg-gray-800 rounded-md transition-colors">
                        {walletCopied
                          ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          : <Copy className="h-4 w-4 text-gray-400" />}
                      </button>
                      <a
                        href={`https://explorer.solana.com/address/${publicKey.toBase58()}`}
                        target="_blank" rel="noopener noreferrer"
                        className="p-1.5 hover:bg-gray-800 rounded-md transition-colors"
                      >
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="wallet-adapter-button-wrapper">
                    <WalletMultiButton className="!w-full !bg-gradient-to-r !from-violet-600 !to-purple-600 hover:!from-violet-500 hover:!to-purple-500 !rounded-xl !h-14 !font-semibold !text-sm !transition-all !duration-200 !justify-center" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 2: PROPERTY ASSET MAPPING ═══ */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-[#111111] rounded-2xl border border-gray-800 p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-white mb-1">Property Asset Mapping</h2>
              <p className="text-sm text-gray-500 mb-6">Define the physical asset profile for sovereign energy verification.</p>

              {/* Segmented Toggle */}
              <div className="mb-6">
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-3">Property Classification</label>
                <div className="flex p-1 rounded-xl bg-[#0a0a0a] border border-gray-800">
                  {(['RESIDENTIAL', 'COMMERCIAL'] as PropertyType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPropertyType(type)}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                        propertyType === type
                          ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                          : 'text-gray-500 hover:text-gray-300'
                      )}
                    >
                      {type === 'RESIDENTIAL'
                        ? <><Home className="w-4 h-4" /> Residential</>
                        : <><Building2 className="w-4 h-4" /> Commercial</>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1.5 text-gray-500" />
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={propertyData.streetAddress}
                    onChange={(e) => setPropertyData(p => ({ ...p, streetAddress: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-gray-700 text-white placeholder-gray-600 focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 outline-none transition-all"
                    placeholder="1234 Innovation Blvd, Austin, TX 78701"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Zap className="w-4 h-4 inline mr-1.5 text-gray-500" />
                    Annual Utility Baseline (kWh)
                  </label>
                  <input
                    type="number"
                    value={propertyData.annualUtilityBaseline}
                    onChange={(e) => setPropertyData(p => ({ ...p, annualUtilityBaseline: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-gray-700 text-white placeholder-gray-600 focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 outline-none transition-all"
                    placeholder="12,600"
                    min="0"
                  />
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 3: TELEMETRY BRIDGE LINKING ═══ */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-[#111111] rounded-2xl border border-gray-800 p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-white mb-1">Telemetry Bridge Linking</h2>
              <p className="text-sm text-gray-500 mb-6">
                {propertyType === 'RESIDENTIAL'
                  ? 'Link your Aethexer Mobile App for residential telemetry.'
                  : 'Configure your Building Management System (BMS) connection.'}
              </p>

              {/* ── Residential: Aethexer QR ── */}
              {propertyType === 'RESIDENTIAL' && (
                <div className="space-y-4">
                  <div className="p-6 rounded-xl bg-[#0a0a0a] border border-gray-800 text-center space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                      <Smartphone className="w-8 h-8 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Aethexer Mobile App</h3>
                      <p className="text-xs text-gray-500 mt-1">Scan the QR code below with your Aethexer app to link telemetry.</p>
                    </div>

                    {/* QR Scanning Frame */}
                    <div className="relative mx-auto w-48 h-48 rounded-2xl border-2 border-dashed border-cyan-500/40 bg-cyan-500/5 flex items-center justify-center overflow-hidden">
                      {qrScanning ? (
                        <div className="space-y-3 text-center">
                          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                          <p className="text-xs text-cyan-400 font-mono">SCANNING...</p>
                          {/* Animated scan line */}
                          <div className="absolute inset-x-0 h-0.5 bg-cyan-400/60 animate-pulse" style={{ top: '50%' }} />
                        </div>
                      ) : (
                        <div className="space-y-3 text-center">
                          <QrCode className="w-12 h-12 text-cyan-500/40 mx-auto" />
                          <p className="text-xs text-gray-600">QR scanning frame</p>
                        </div>
                      )}
                      {/* Corner brackets */}
                      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-500/60 rounded-tl-sm" />
                      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-500/60 rounded-tr-sm" />
                      <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-500/60 rounded-bl-sm" />
                      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-500/60 rounded-br-sm" />
                    </div>

                    <button
                      type="button"
                      onClick={handleStartQrScan}
                      disabled={qrScanning}
                      className={cn(
                        'px-6 py-3 rounded-xl text-sm font-semibold transition-all',
                        qrScanning
                          ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                          : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/25'
                      )}
                    >
                      {qrScanning ? 'Scanning...' : 'Activate Scanner'}
                    </button>
                  </div>

                  <p className="text-xs text-gray-600 text-center">
                    Don&apos;t have the Aethexer app? You can link it later from your dashboard.
                  </p>
                </div>
              )}

              {/* ── Commercial: BMS Connection Grid ── */}
              {propertyType === 'COMMERCIAL' && (
                <div className="space-y-4">
                  {/* Protocol Selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Network className="w-4 h-4 inline mr-1.5 text-gray-500" />
                      Protocol
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'BACNET_IP' as BmsProtocol, label: 'BACnet IP', icon: Server },
                        { value: 'MODBUS' as BmsProtocol, label: 'Modbus', icon: Radio },
                        { value: 'NIAGARA' as BmsProtocol, label: 'Niagara', icon: Wifi },
                      ].map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setTelemetryConfig(c => ({ ...c, bmsProtocol: value }))}
                          className={cn(
                            'flex flex-col items-center gap-2 p-4 rounded-xl border text-sm font-medium transition-all',
                            telemetryConfig.bmsProtocol === value
                              ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400'
                              : 'bg-[#0a0a0a] border-gray-800 text-gray-500 hover:border-gray-600'
                          )}
                        >
                          <Icon className="w-5 h-5" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target Endpoint URI */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Terminal className="w-4 h-4 inline mr-1.5 text-gray-500" />
                      Target Endpoint URI
                    </label>
                    <input
                      type="text"
                      value={telemetryConfig.targetEndpointUri}
                      onChange={(e) => setTelemetryConfig(c => ({ ...c, targetEndpointUri: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-gray-700 text-white placeholder-gray-600 focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 outline-none transition-all font-mono text-sm"
                      placeholder="bacnet://192.168.1.100:47808"
                    />
                  </div>

                  {/* API Access Token */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Lock className="w-4 h-4 inline mr-1.5 text-gray-500" />
                      API Access Token
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={telemetryConfig.apiAccessToken}
                        onChange={(e) => setTelemetryConfig(c => ({ ...c, apiAccessToken: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-gray-700 text-white placeholder-gray-600 focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 outline-none transition-all font-mono text-sm"
                        placeholder="bms_tok_••••••••••••"
                      />
                      <Eye className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    </div>
                  </div>

                  {/* Connection Test Hint */}
                  <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-400/80">
                      The endpoint will be validated during telemetry bridge activation. Ensure your BMS firewall allows inbound connections on the specified protocol port.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ NAVIGATION BUTTONS ═══ */}
        {typeof step === 'number' && (
          <div className="flex gap-4 mt-6">
            {step > 1 && (
              <button
                type="button"
                onClick={goBack}
                className="flex items-center justify-center gap-2 flex-1 py-4 rounded-xl font-semibold text-base bg-[#1a1a1a] border border-gray-800 text-gray-300 hover:bg-[#222] hover:border-gray-700 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
            <button
              type="button"
              onClick={goNext}
              disabled={
                loading ||
                (step === 1 && !canProceedStep1) ||
                (step === 2 && !canProceedStep2) ||
                (step === 3 && !canProceedStep3)
              }
              className={cn(
                'flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-base transition-all duration-200',
                'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white',
                'hover:from-cyan-400 hover:to-emerald-400',
                'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-cyan-500 disabled:hover:to-emerald-500',
                step === 1 ? 'flex-1' : 'flex-[2]'
              )}
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Synchronizing...</>
              ) : step === 3 ? (
                <><CheckCircle2 className="w-5 h-5" /> Complete Onboarding</>
              ) : (
                <>Continue <ChevronRight className="w-5 h-5" /></>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
