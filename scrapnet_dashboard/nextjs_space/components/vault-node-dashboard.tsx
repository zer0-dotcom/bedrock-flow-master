'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  Shield,
  Vault,
  ScanLine,
  FileVideo,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Fingerprint,
  Cpu,
  Upload,
  Play,
  XCircle,
  Loader2,
  Hash,
  Building2,
  Coins,
  Scale,
  Eye,
  Download,
  ChevronDown,
} from 'lucide-react';
import {
  VaultVerification,
  VaultNode,
  VaultNodeOperator,
  CurrencyType,
  VaultVerificationStatus,
  AICheckResult,
  CURRENCY_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
} from '@/lib/vault-types';

// Demo operator data (in production, this comes from auth)
const DEMO_OPERATOR = {
  id: 'demo-operator-001',
  userId: 'demo-user-001',
  name: 'John Mitchell',
  role: 'SUPERVISOR',
  canVerify: true,
  canApprove: true,
};

const DEMO_VAULT_NODE: VaultNode = {
  id: 'vault-001',
  nodeId: 'VLT-NYC-001',
  name: 'Federal Reserve Vault NYC',
  nodeType: 'BANK',
  certificationNumber: 'FRB-2026-NYC-001',
  certifiedUntil: '2027-12-31',
  isActive: true,
  address: '33 Liberty Street, New York, NY 10045',
  securityLevel: 5,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export default function VaultNodeDashboard() {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  
  // Form state
  const [currencyType, setCurrencyType] = useState<CurrencyType>('USD');
  const [serialRangeStart, setSerialRangeStart] = useState('');
  const [serialRangeEnd, setSerialRangeEnd] = useState('');
  const [serialCount, setSerialCount] = useState<number>(0);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [goldPurity, setGoldPurity] = useState<number>(99.99);
  const [goldWeight, setGoldWeight] = useState<number>(0);
  const [assayNumber, setAssayNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Verification flow state
  const [currentVerification, setCurrentVerification] = useState<VaultVerification | null>(null);
  const [aiCheckResult, setAiCheckResult] = useState<AICheckResult | null>(null);
  const [isRunningAiCheck, setIsRunningAiCheck] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(false);
  
  // Video upload state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoHash, setVideoHash] = useState<string>('');
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [destructionMethod, setDestructionMethod] = useState<string>('SHREDDING');
  const [witnesses, setWitnesses] = useState<string>('');
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Verification history
  const [verifications, setVerifications] = useState<VaultVerification[]>([]);

  // Simulate authorization check
  useEffect(() => {
    const checkAuthorization = async () => {
      setLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      // For demo, always authorize
      setIsAuthorized(true);
      setLoading(false);
    };
    checkAuthorization();
  }, []);

  // Calculate SHA-256 hash of video file
  const calculateVideoHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Handle video file selection
  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setIsUploadingVideo(true);
      try {
        const hash = await calculateVideoHash(file);
        setVideoHash(hash);
      } catch (error) {
        console.error('Hash calculation error:', error);
      } finally {
        setIsUploadingVideo(false);
      }
    }
  };

  // Create new verification
  const handleCreateVerification = async () => {
    if (!totalValue || totalValue <= 0) {
      alert('Please enter a valid total value');
      return;
    }

    try {
      const response = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vaultNodeId: DEMO_VAULT_NODE.id,
          submittedById: DEMO_OPERATOR.userId,
          currencyType,
          serialRangeStart: serialRangeStart || undefined,
          serialRangeEnd: serialRangeEnd || undefined,
          serialCount: serialCount || undefined,
          totalValue,
          goldPurity: currencyType.includes('GOLD') || currencyType.includes('SILVER') || currencyType === 'PLATINUM' ? goldPurity : undefined,
          goldWeightGrams: goldWeight || undefined,
          assayNumber: assayNumber || undefined,
          notes: notes || undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setCurrentVerification(data.verification);
      } else {
        alert(data.error || 'Failed to create verification');
      }
    } catch (error) {
      console.error('Create verification error:', error);
      alert('Failed to create verification');
    }
  };

  // Run AI security check
  const handleAiCheck = async () => {
    if (!currentVerification) return;

    setIsRunningAiCheck(true);
    setIsScannerActive(true);

    // Simulate scanner warmup
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const response = await fetch('/api/vault/ai-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationId: currentVerification.id,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setAiCheckResult(data.aiResult);
        setCurrentVerification(data.verification);
      } else {
        alert(data.error || 'AI check failed');
      }
    } catch (error) {
      console.error('AI check error:', error);
      alert('AI verification failed');
    } finally {
      setIsRunningAiCheck(false);
      setIsScannerActive(false);
    }
  };

  // Submit destruction proof
  const handleSubmitDestructionProof = async () => {
    if (!currentVerification || !videoHash) {
      alert('Please upload a destruction video first');
      return;
    }

    try {
      const response = await fetch('/api/vault/destruction-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationId: currentVerification.id,
          videoUrl: `vault-destruction-${currentVerification.verificationId}.mp4`,
          videoHash,
          destructionMethod,
          witnesses: witnesses.split(',').map(w => w.trim()).filter(Boolean),
          operatorId: DEMO_OPERATOR.userId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setCurrentVerification(data.verification);
        alert('Destruction proof submitted successfully!');
      } else {
        alert(data.error || 'Failed to submit destruction proof');
      }
    } catch (error) {
      console.error('Submit destruction proof error:', error);
      alert('Failed to submit destruction proof');
    }
  };

  // Reset form
  const handleReset = () => {
    setCurrentVerification(null);
    setAiCheckResult(null);
    setCurrencyType('USD');
    setSerialRangeStart('');
    setSerialRangeEnd('');
    setSerialCount(0);
    setTotalValue(0);
    setGoldPurity(99.99);
    setGoldWeight(0);
    setAssayNumber('');
    setNotes('');
    setVideoFile(null);
    setVideoHash('');
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-violet-500 mx-auto" />
          <p className="text-muted-foreground">Verifying vault node credentials...</p>
        </div>
      </div>
    );
  }

  // Access denied
  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-md">
          <div className="h-20 w-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <Lock className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white">Access Restricted</h2>
          <p className="text-muted-foreground">
            This section is restricted to Certified Vault Node operators only.
            Banks, vaults, and certified processors with valid credentials may access this area.
          </p>
          <div className="pt-4">
            <a
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium transition-colors"
            >
              <Shield className="h-5 w-5" />
              Request Certification
            </a>
          </div>
        </div>
      </div>
    );
  }

  const isPreciousMetal = ['GOLD_BULLION', 'SILVER_BULLION', 'PLATINUM', 'MIXED_PRECIOUS'].includes(currencyType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Vault className="h-7 w-7 text-violet-500" />
            Digital Vault Node
          </h1>
          <p className="text-muted-foreground mt-1">
            Secure currency and precious metal verification with AI authentication
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Certified Node Active
          </div>
        </div>
      </div>

      {/* Node Info Card */}
      <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Node ID</p>
            <p className="font-mono text-sm text-white">{DEMO_VAULT_NODE.nodeId}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Facility</p>
            <p className="text-sm text-white">{DEMO_VAULT_NODE.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Certification</p>
            <p className="text-sm text-white">{DEMO_VAULT_NODE.certificationNumber}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Security Level</p>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-2 w-4 rounded-sm',
                    i < DEMO_VAULT_NODE.securityLevel ? 'bg-violet-500' : 'bg-slate-700'
                  )}
                />
              ))}
              <span className="text-sm text-white ml-2">Level {DEMO_VAULT_NODE.securityLevel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('new')}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'new'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-muted-foreground hover:text-white'
          )}
        >
          New Verification
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'history'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-muted-foreground hover:text-white'
          )}
        >
          History
        </button>
      </div>

      {activeTab === 'new' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Form */}
          <div className="space-y-6">
            {/* Step 1: Verification Form */}
            <div className="rounded-xl border border-slate-800 bg-card p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-violet-500/20 text-violet-400 text-sm flex items-center justify-center">1</span>
                Verification Form
              </h3>

              <div className="grid gap-4">
                {/* Currency Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Currency / Asset Type</label>
                  <div className="relative">
                    <select
                      value={currencyType}
                      onChange={(e) => setCurrencyType(e.target.value as CurrencyType)}
                      disabled={!!currentVerification}
                      className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                    >
                      {Object.entries(CURRENCY_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {/* Serial Range (for currency) */}
                {!isPreciousMetal && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Serial Range Start</label>
                      <input
                        type="text"
                        value={serialRangeStart}
                        onChange={(e) => setSerialRangeStart(e.target.value)}
                        disabled={!!currentVerification}
                        placeholder="e.g., AA00000001"
                        className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Serial Range End</label>
                      <input
                        type="text"
                        value={serialRangeEnd}
                        onChange={(e) => setSerialRangeEnd(e.target.value)}
                        disabled={!!currentVerification}
                        placeholder="e.g., AA00001000"
                        className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                      />
                    </div>
                  </div>
                )}

                {/* Serial Count */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{isPreciousMetal ? 'Item Count' : 'Note/Bill Count'}</label>
                    <input
                      type="number"
                      min="0"
                      value={serialCount || ''}
                      onChange={(e) => setSerialCount(parseInt(e.target.value) || 0)}
                      disabled={!!currentVerification}
                      placeholder="Enter count"
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Total Value (USD)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={totalValue || ''}
                      onChange={(e) => setTotalValue(parseFloat(e.target.value) || 0)}
                      disabled={!!currentVerification}
                      placeholder="Enter total value"
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Gold-specific fields */}
                {isPreciousMetal && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Purity (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={goldPurity}
                          onChange={(e) => setGoldPurity(parseFloat(e.target.value) || 0)}
                          disabled={!!currentVerification}
                          className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Weight (grams)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={goldWeight || ''}
                          onChange={(e) => setGoldWeight(parseFloat(e.target.value) || 0)}
                          disabled={!!currentVerification}
                          placeholder="Total weight"
                          className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Assay Number</label>
                        <input
                          type="text"
                          value={assayNumber}
                          onChange={(e) => setAssayNumber(e.target.value)}
                          disabled={!!currentVerification}
                          placeholder="Certificate #"
                          className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={!!currentVerification}
                    rows={2}
                    placeholder="Additional notes or observations"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50 resize-none"
                  />
                </div>

                {!currentVerification ? (
                  <button
                    onClick={handleCreateVerification}
                    disabled={totalValue <= 0}
                    className="w-full py-3 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Fingerprint className="h-5 w-5" />
                    Create Verification Record
                  </button>
                ) : (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Verification ID: <span className="font-mono">{currentVerification.verificationId}</span></span>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: AI Verification */}
            {currentVerification && (
              <div className="rounded-xl border border-slate-800 bg-card p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-violet-500/20 text-violet-400 text-sm flex items-center justify-center">2</span>
                  AI Security Check
                  <span className="text-xs text-muted-foreground ml-auto">2026 Currency Authenticator</span>
                </h3>

                {/* Scanner Visualization */}
                <div className={cn(
                  'relative rounded-lg border-2 border-dashed p-8 transition-all',
                  isScannerActive ? 'border-violet-500 bg-violet-500/5' : 'border-slate-700',
                )}>
                  <div className="text-center space-y-4">
                    <div className={cn(
                      'h-20 w-20 rounded-full mx-auto flex items-center justify-center transition-all',
                      isScannerActive ? 'bg-violet-500/20 animate-pulse' : 'bg-slate-800',
                    )}>
                      <ScanLine className={cn(
                        'h-10 w-10 transition-colors',
                        isScannerActive ? 'text-violet-400' : 'text-muted-foreground'
                      )} />
                    </div>
                    {isScannerActive ? (
                      <div className="space-y-2">
                        <p className="text-violet-400 font-medium">Scanning security features...</p>
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <Cpu className="h-4 w-4 animate-pulse" />
                          Running 2026 Currency Authenticator
                        </div>
                      </div>
                    ) : aiCheckResult ? (
                      <p className="text-muted-foreground">Scan complete</p>
                    ) : (
                      <p className="text-muted-foreground">Connect scanner to run security check</p>
                    )}
                  </div>

                  {/* Scanning animation overlay */}
                  {isScannerActive && (
                    <div className="absolute inset-0 overflow-hidden rounded-lg">
                      <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-violet-500 to-transparent animate-[scan_2s_linear_infinite]" />
                    </div>
                  )}
                </div>

                {!aiCheckResult ? (
                  <button
                    onClick={handleAiCheck}
                    disabled={isRunningAiCheck}
                    className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {isRunningAiCheck ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Running AI Check...
                      </>
                    ) : (
                      <>
                        <Cpu className="h-5 w-5" />
                        Run Security Feature Check
                      </>
                    )}
                  </button>
                ) : (
                  <div className={cn(
                    'p-4 rounded-lg border',
                    aiCheckResult.status === 'AI_VERIFIED'
                      ? 'bg-emerald-500/10 border-emerald-500/20'
                      : 'bg-amber-500/10 border-amber-500/20'
                  )}>
                    <div className="flex items-start gap-3">
                      {aiCheckResult.status === 'AI_VERIFIED' ? (
                        <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="h-6 w-6 text-amber-400 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className={cn(
                          'font-medium',
                          aiCheckResult.status === 'AI_VERIFIED' ? 'text-emerald-400' : 'text-amber-400'
                        )}>
                          {aiCheckResult.status === 'AI_VERIFIED' ? 'Verification Passed' : 'Manual Review Required'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Confidence: {aiCheckResult.confidenceScore}% · Features detected: {aiCheckResult.detectionRate}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Destruction Proof & Status */}
          <div className="space-y-6">
            {/* Step 3: Proof of Destruction */}
            {currentVerification && aiCheckResult && (
              <div className="rounded-xl border border-slate-800 bg-card p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-violet-500/20 text-violet-400 text-sm flex items-center justify-center">3</span>
                  Proof of Destruction
                  <span className="text-xs text-red-400 ml-2">* Required</span>
                </h3>

                {/* Video Upload */}
                <div
                  onClick={() => videoInputRef.current?.click()}
                  className={cn(
                    'relative rounded-lg border-2 border-dashed p-8 cursor-pointer transition-all hover:border-violet-500 hover:bg-violet-500/5',
                    videoFile ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-700'
                  )}
                >
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoSelect}
                    className="hidden"
                  />
                  <div className="text-center space-y-4">
                    <div className={cn(
                      'h-16 w-16 rounded-full mx-auto flex items-center justify-center',
                      videoFile ? 'bg-emerald-500/20' : 'bg-slate-800'
                    )}>
                      {videoFile ? (
                        <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                      ) : (
                        <FileVideo className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    {videoFile ? (
                      <div>
                        <p className="text-emerald-400 font-medium">{videoFile.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-muted-foreground">Upload shredding/smelting video</p>
                        <p className="text-xs text-muted-foreground mt-1">MP4, MOV, or AVI (max 500MB)</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cryptographic Hash */}
                {videoHash && (
                  <div className="p-4 rounded-lg bg-slate-800/50 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Hash className="h-4 w-4" />
                      SHA-256 Cryptographic Hash
                    </div>
                    <p className="font-mono text-xs text-emerald-400 break-all">
                      {videoHash}
                    </p>
                  </div>
                )}

                {/* Destruction Details */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Destruction Method</label>
                    <div className="relative">
                      <select
                        value={destructionMethod}
                        onChange={(e) => setDestructionMethod(e.target.value)}
                        className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                      >
                        <option value="SHREDDING">Shredding</option>
                        <option value="SMELTING">Smelting</option>
                        <option value="INCINERATION">Incineration</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Witnesses (comma-separated)</label>
                    <input
                      type="text"
                      value={witnesses}
                      onChange={(e) => setWitnesses(e.target.value)}
                      placeholder="J. Smith, M. Jones"
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSubmitDestructionProof}
                  disabled={!videoHash || isUploadingVideo}
                  className="w-full py-3 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isUploadingVideo ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing Video...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      Submit Destruction Proof
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Verification Status */}
            {currentVerification && (
              <div className="rounded-xl border border-slate-800 bg-card p-6 space-y-4">
                <h3 className="font-semibold">Verification Status</h3>

                {/* Status Timeline */}
                <div className="space-y-3">
                  {[
                    { step: 'DRAFT', label: 'Record Created', icon: Fingerprint },
                    { step: 'AI_VERIFIED', label: 'AI Verification', icon: Cpu },
                    { step: 'DESTRUCTION_UPLOADED', label: 'Destruction Proof', icon: FileVideo },
                    { step: 'COMPLETED', label: 'Completed', icon: CheckCircle2 },
                  ].map((item, index) => {
                    const statusOrder = ['DRAFT', 'PENDING_AI_CHECK', 'AI_VERIFIED', 'AI_FLAGGED', 'PENDING_DESTRUCTION', 'DESTRUCTION_UPLOADED', 'COMPLETED'];
                    const currentIndex = statusOrder.indexOf(currentVerification.status);
                    const itemIndex = statusOrder.indexOf(item.step);
                    const isComplete = currentIndex >= itemIndex;
                    const isCurrent = currentVerification.status === item.step || 
                      (item.step === 'AI_VERIFIED' && currentVerification.status === 'AI_FLAGGED');
                    
                    return (
                      <div key={item.step} className="flex items-center gap-3">
                        <div className={cn(
                          'h-8 w-8 rounded-full flex items-center justify-center',
                          isComplete ? 'bg-violet-500' : 'bg-slate-800'
                        )}>
                          <item.icon className={cn(
                            'h-4 w-4',
                            isComplete ? 'text-white' : 'text-muted-foreground'
                          )} />
                        </div>
                        <span className={cn(
                          'text-sm',
                          isCurrent ? 'text-violet-400 font-medium' : isComplete ? 'text-white' : 'text-muted-foreground'
                        )}>
                          {item.label}
                        </span>
                        {isCurrent && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400">
                            Current
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Current Status Badge */}
                <div className="pt-2">
                  <div className={cn(
                    'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-white',
                    STATUS_COLORS[currentVerification.status as VaultVerificationStatus]
                  )}>
                    {STATUS_LABELS[currentVerification.status as VaultVerificationStatus]}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleReset}
                    className="flex-1 py-2 rounded-lg border border-slate-700 text-muted-foreground hover:text-white hover:border-slate-600 transition-colors text-sm"
                  >
                    Start New
                  </button>
                  {currentVerification.blockchainJson && (
                    <button
                      onClick={() => {
                        const blob = new Blob([currentVerification.blockchainJson!], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${currentVerification.verificationId}.json`;
                        a.click();
                      }}
                      className="flex-1 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export JSON
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="rounded-xl border border-slate-800 bg-card p-6">
          <p className="text-center text-muted-foreground py-12">
            Verification history will appear here once records are created.
          </p>
        </div>
      )}

      {/* Custom keyframe for scanner animation */}
      <style jsx>{`
        @keyframes scan {
          0% { top: 0; }
          50% { top: calc(100% - 4px); }
          100% { top: 0; }
        }
      `}</style>
    </div>
  );
}
