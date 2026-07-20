// Digital Vault Node Type Definitions

export type VaultNodeType = 'BANK' | 'VAULT' | 'CERTIFIED_PROCESSOR';

export type CurrencyType = 
  | 'USD' 
  | 'EUR' 
  | 'GBP' 
  | 'JPY' 
  | 'CHF' 
  | 'GOLD_BULLION' 
  | 'SILVER_BULLION' 
  | 'PLATINUM' 
  | 'MIXED_PRECIOUS';

export type VaultVerificationStatus = 
  | 'DRAFT'
  | 'PENDING_AI_CHECK'
  | 'AI_VERIFIED'
  | 'AI_FLAGGED'
  | 'PENDING_DESTRUCTION'
  | 'DESTRUCTION_UPLOADED'
  | 'COMPLETED'
  | 'REJECTED';

export type DestructionMethod = 'SHREDDING' | 'SMELTING' | 'INCINERATION';

export interface VaultNode {
  id: string;
  nodeId: string;
  name: string;
  nodeType: VaultNodeType;
  certificationNumber?: string;
  certifiedUntil?: string;
  isActive: boolean;
  address?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  securityLevel: number;
  createdAt: string;
  updatedAt: string;
}

export interface VaultNodeOperator {
  id: string;
  userId: string;
  vaultNodeId: string;
  role: string;
  canVerify: boolean;
  canApprove: boolean;
  canDelete: boolean;
  createdAt: string;
}

export interface VaultVerification {
  id: string;
  verificationId: string;
  status: VaultVerificationStatus;
  vaultNodeId: string;
  currencyType: CurrencyType;
  serialRangeStart?: string;
  serialRangeEnd?: string;
  serialCount?: number;
  totalValue: number;
  valueCurrency: string;
  goldPurity?: number;
  goldWeightGrams?: number;
  assayNumber?: string;
  aiCheckTimestamp?: string;
  aiCheckResult?: string;
  aiConfidenceScore?: number;
  securityFeatures?: string;
  flaggedIssues?: string;
  destructionVideoUrl?: string;
  destructionVideoHash?: string;
  destructionTimestamp?: string;
  destructionMethod?: string;
  destructionWitnesses?: string;
  submittedById: string;
  verifiedById?: string;
  notes?: string;
  blockchainJson?: string;
  createdAt: string;
  updatedAt: string;
  vaultNode?: VaultNode;
}

export interface AICheckResult {
  timestamp: string;
  authenticatorVersion: string;
  currencyType: CurrencyType;
  expectedFeatures: string[];
  detectedFeatures: string[];
  detectionRate: string;
  confidenceScore: number;
  status: 'AI_VERIFIED' | 'AI_FLAGGED';
  recommendation: string;
}

export interface DestructionProof {
  videoUrl: string;
  videoHash: string;
  destructionMethod: DestructionMethod;
  witnesses: string[];
  timestamp: string;
}

export const CURRENCY_LABELS: Record<CurrencyType, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  JPY: 'Japanese Yen',
  CHF: 'Swiss Franc',
  GOLD_BULLION: 'Gold Bullion',
  SILVER_BULLION: 'Silver Bullion',
  PLATINUM: 'Platinum',
  MIXED_PRECIOUS: 'Mixed Precious Metals',
};

export const STATUS_LABELS: Record<VaultVerificationStatus, string> = {
  DRAFT: 'Draft',
  PENDING_AI_CHECK: 'Pending AI Check',
  AI_VERIFIED: 'AI Verified',
  AI_FLAGGED: 'AI Flagged',
  PENDING_DESTRUCTION: 'Pending Destruction',
  DESTRUCTION_UPLOADED: 'Destruction Uploaded',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
};

export const STATUS_COLORS: Record<VaultVerificationStatus, string> = {
  DRAFT: 'bg-slate-500',
  PENDING_AI_CHECK: 'bg-blue-500',
  AI_VERIFIED: 'bg-emerald-500',
  AI_FLAGGED: 'bg-amber-500',
  PENDING_DESTRUCTION: 'bg-purple-500',
  DESTRUCTION_UPLOADED: 'bg-cyan-500',
  COMPLETED: 'bg-green-600',
  REJECTED: 'bg-red-500',
};

// ==================== AVOIDED LOGISTICS AUDITOR TYPES ====================

export type TransportMethod = 'AIR_CARGO' | 'ARMORED_VEHICLE';
export type CreditStatus = 'UNVERIFIED' | 'PENDING_HASH' | 'VERIFIED';

export interface LogisticsAuditData {
  originCoordinates: string;
  destinationCoordinates: string;
  distanceKm: number;
  transportMethod: TransportMethod;
  avoidedCo2Grams: number;
  avoidedCo2Kg: number;
  unverifiedCredits: number;
  creditStatus: CreditStatus;
  logisticsAuditTimestamp?: string;
}

export const TRANSPORT_METHOD_LABELS: Record<TransportMethod, string> = {
  AIR_CARGO: 'High-Security Air Cargo (500g CO₂/km)',
  ARMORED_VEHICLE: 'Armored Vehicle Convoy (180g CO₂/km)',
};

export const CREDIT_STATUS_LABELS: Record<CreditStatus, string> = {
  UNVERIFIED: 'Unverified - Awaiting Proof of Destruction',
  PENDING_HASH: 'Pending Hash Verification',
  VERIFIED: 'Verified - Eligible for Tokenization',
};

export const CREDIT_STATUS_COLORS: Record<CreditStatus, string> = {
  UNVERIFIED: 'bg-amber-500',
  PENDING_HASH: 'bg-blue-500',
  VERIFIED: 'bg-emerald-500',
};
