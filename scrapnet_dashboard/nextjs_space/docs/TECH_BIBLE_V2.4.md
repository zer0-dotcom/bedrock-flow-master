# BEDROCK ESG — TECHNICAL BIBLE v2.4 (Trinity Protocol)

> **Classification:** LLM / Developer Reference — Exhaustive Technical Specification
> **Backtrace:** BT-C9C4C5 v2.4 | **Protocol:** Aethexer v1 | **Updated:** 2026-06-16
> **Domain:** `bedrockesg.com` | **Cluster:** Solana Devnet | **Blockchain:** Hedera + Polygon (production attestation)

---

## TABLE OF CONTENTS

1. [System Identity](#1-system-identity)
2. [Architecture Overview](#2-architecture-overview)
3. [Directory Structure](#3-directory-structure)
4. [Database Schema](#4-database-schema)
5. [Authentication & RBAC](#5-authentication--rbac)
6. [Aethexer Protocol Layer](#6-aethexer-protocol-layer)
7. [Sentinel Engine](#7-sentinel-engine)
8. [Forensic Ingest Pipeline](#8-forensic-ingest-pipeline)
9. [Telemetry Ingest Pipeline](#9-telemetry-ingest-pipeline)
10. [Discovery Pipeline](#10-discovery-pipeline)
11. [Settlement Engine (Universal Law)](#11-settlement-engine-universal-law)
12. [Blockchain Layer](#12-blockchain-layer)
13. [Spatial Heritage Parser](#13-spatial-heritage-parser)
14. [Carbon Calculation Engines](#14-carbon-calculation-engines)
15. [Emission Factor Database](#15-emission-factor-database)
16. [HUM Dynamic Listener](#16-hum-dynamic-listener)
17. [Admin Control Panel](#17-admin-control-panel)
18. [API Route Index](#18-api-route-index)
19. [Page Route Index](#19-page-route-index)
20. [Library Module Index](#20-library-module-index)
21. [Environment Variables](#21-environment-variables)
22. [Deployment](#22-deployment)

---

## 1. SYSTEM IDENTITY

| Key | Value |
|---|---|
| **Platform Name** | Bedrock ESG (formerly Scrapnet 2.0) |
| **Protocol Version** | Aethexer v1 — Trinity Protocol |
| **Backtrace** | BT-C9C4C5 |
| **Service Identity** | `9tsq8qB4P9uPRSHrjXLaDQJd93nuo4wEEtkR1tAJRAQ3` (Aethexer Notary Node) |
| **Founder Alias** | Kato / Zer0 / Aethexer Notary Node |
| **Admin Email** | `idecade8@gmail.com` (ADMIN_MASTER_EMAIL) |
| **Production URL** | `https://bedrockesg.com` |
| **Design Theme** | Deep Space Dark Mode (#0a0a0a bg, #1a1a1a cards, electric blue accent) |

---

## 2. ARCHITECTURE OVERVIEW

### Codebase Statistics

| Metric | Count |
|---|---|
| Prisma Models | 45 |
| Prisma Enums | 30 |
| API Routes (`route.ts`) | 76 |
| Pages (`page.tsx`) | 31 |
| Components (`.tsx`) | 99 |
| Library Modules (`lib/*.ts`) | 31 |
| Schema Lines | 2,041 |
| `universal-law.ts` Lines | 2,011 |
| `forensic-ingest/route.ts` Lines | 588 |
| `sentinel-engine.ts` Lines | 303 |

### Core Layer Stack

```
┌─────────────────────────────────────────────────────────┐
│  PRESENTATION — 31 Pages + 99 Components (Dark Theme)   │
├─────────────────────────────────────────────────────────┤
│  API LAYER — 76 route.ts handlers (v1 + legacy)         │
├─────────────────────────────────────────────────────────┤
│  PROTOCOL — Aethexer Auth + Sentinel Engine + RBAC      │
├─────────────────────────────────────────────────────────┤
│  SETTLEMENT — Universal Law (70/20/10 Zero Greed)       │
├─────────────────────────────────────────────────────────┤
│  BLOCKCHAIN — Solana Devnet + Hedera HCS + Polygon      │
├─────────────────────────────────────────────────────────┤
│  PERSISTENCE — PostgreSQL (45 models) + S3 Cloud Storage│
└─────────────────────────────────────────────────────────┘
```

---

## 3. DIRECTORY STRUCTURE

```
nextjs_space/
├── app/
│   ├── api/
│   │   ├── v1/                          # Aethexer Protocol v1 endpoints
│   │   │   ├── forensic-ingest/         # Unified forensic ingest (588 lines)
│   │   │   ├── telemetry-ingest/        # IoT sensor ingest
│   │   │   ├── telemetry-reevaluate/    # Batch re-evaluation
│   │   │   ├── discovery/               # Macro-asset discovery CRUD
│   │   │   ├── admin/
│   │   │   │   └── purge-test-artifacts/ # Destructive cleanup gate
│   │   │   └── submissions/[id]/approve/ # Founder approval gate
│   │   ├── auth/                        # Login, signup, Google SSO, JWT
│   │   ├── biochar/                     # CDR calculator + batches
│   │   ├── submissions/                 # Full submission lifecycle
│   │   ├── vault/                       # Verification repository
│   │   └── ...                          # 76 total route files
│   ├── admin/                           # Admin control panel
│   ├── discovery/                       # Macro-asset discovery UI
│   ├── submission-portal/               # Corporate gatehouse
│   ├── onboarding/                      # 3-step sovereign onboarding
│   ├── vault/                           # Verification repository UI
│   ├── biochar/                         # CDR engine pages
│   ├── metal/                           # Metal recovery pages
│   ├── global-ledger/                   # Consolidated ledger view
│   ├── ledger/                          # Legacy ledger
│   ├── impact/                          # Impact dashboard
│   ├── legacy-healer/                   # Friction healing calculator
│   └── page.tsx                         # Main dashboard + cockpit ticker
├── components/
│   ├── cockpit-ticker.tsx               # Real-time asset ticker (SSE)
│   ├── discovery-dashboard.tsx          # Discovery feed UI
│   ├── sidebar.tsx                      # Navigation (incl. Admin section)
│   └── ...                              # 99 total component files
├── lib/
│   ├── aethexer-auth.ts                 # Trinity 3-layer auth guard
│   ├── aethexer-protocol.ts             # Protocol envelope wrapper
│   ├── sentinel-engine.ts               # 95/75/75 scoring engine
│   ├── universal-law.ts                 # Zero Greed settlement (2,011 lines)
│   ├── rbac.ts                          # 4-tier role hierarchy + permissions
│   ├── rbac-guard.ts                    # JWT extraction + route protection
│   ├── audit-logger.ts                  # Fire-and-forget audit pipeline
│   ├── validator.ts                     # Zod schemas for validation
│   ├── logistics-auditor.ts             # Haversine distance + CO₂ avoided
│   ├── emission-factors.ts              # ICE v4.1 + Ecoinvent (40 factors)
│   ├── blockchain.ts                    # Hedera + Polygon attestation
│   ├── solana-notary.ts                 # Devnet memo anchoring
│   ├── solana-integration.ts            # Wallet adapter integration
│   ├── ply-parser.ts                    # PLY/Splat spatial parser
│   ├── carbon-calculator.ts             # Eurobitume LCA A1-A3
│   ├── metal-calculator.ts              # Metal recovery calculations
│   ├── green-alpha-engine.ts            # Green scoring engine
│   ├── consent.ts                       # SHA-256 consent hashes
│   ├── s3.ts                            # AWS S3 presigned URLs
│   └── db.ts                            # Prisma client singleton
├── services/
│   └── hum-listener.ts                  # Dynamic HUM baseline (12.6 MW)
├── prisma/
│   └── schema.prisma                    # 45 models, 30 enums (2,041 lines)
├── contexts/                            # React contexts (sidebar, auth)
├── hooks/                               # Custom hooks
└── docs/                                # Project Bible documents
```

---

## 4. DATABASE SCHEMA

### Model Registry (45 Models)

| Model | Table | Purpose |
|---|---|---|
| `User` | `users` | Core identity — email, password, role, wallet |
| `InvitationCode` | `invitation_codes` | Agent onboarding codes |
| `FarmerProfile` | `farmer_profiles` | Biochar farmer extended data |
| `RealtorProfile` | `realtor_profiles` | 179D energy track data |
| `BusinessProfile` | `business_profiles` | Corporate entity data |
| `SovereignProfile` | `sovereign_profiles` | Sovereign individual data |
| `UserCarbonEntry` | `user_carbon_entries` | Per-user carbon footprint |
| `Location` | `locations` | Unified location model (replaced Yards) |
| `Project` | `projects` | RAP asphalt projects |
| `Farmer` | `farmers` | Biochar feedstock suppliers |
| `BiocharBatch` | `biochar_batches` | CDR production batches |
| `RecyclingLog` | `recycling_logs` | Material recycling records |
| `FarmerCredit` | `farmer_credits` | Green credit lifecycle |
| `UserConsent` | `user_consents` | Carbon rights + AI consent |
| `ConsentLog` | `consent_logs` | Consent audit trail |
| `MetalRecoveryLog` | `metal_recovery_logs` | Precious metal recovery |
| `VaultNode` | `vault_nodes` | Verification nodes |
| `VaultNodeOperator` | `vault_node_operators` | Node operators |
| `VaultVerification` | `vault_verifications` | Logistics audits |
| `ComplianceFramework` | `compliance_frameworks` | Regulatory frameworks |
| `InternationalTransaction` | `international_transactions` | Cross-border compliance |
| `TravelRuleExchange` | `travel_rule_exchanges` | FATF Travel Rule |
| `VatTaxRate` | `vat_tax_rates` | Jurisdiction tax rates |
| `PortfolioOffset` | `portfolio_offsets` | Carbon offset portfolio |
| `RetiredCredit` | `retired_credits` | Retired carbon credits |
| `FinancedEmissionLog` | `financed_emission_logs` | PCAF financed emissions |
| `UniversalLedgerEntry` | `universal_ledger_entries` | Consolidated ledger |
| `DeadMassExtraction` | `dead_mass_extractions` | Legacy friction extraction |
| `ResonancePrint` | `resonance_prints` | HUM resonance records |
| `SocialYield` | `social_yields` | Social impact yields |
| `PublicResilienceGrant` | `public_resilience_grants` | 10% public resilience allocations |
| `ImpactReport` | `impact_reports` | Impact assessment reports |
| `LegacyAudit` | `legacy_audits` | Historical audit records |
| `VibrationalEquity` | `vibrational_equity` | HUM equity state |
| `ParametricInsurance` | `parametric_insurance` | Insurance products |
| `PulseString` | `pulse_strings` | HUM pulse data |
| `Submission` | `submissions` | Core forensic submission (multi-track) |
| `SubmissionDocument` | `submission_documents` | File attachments per submission |
| `Settlement` | `settlements` | 70/20/10 settlement records |
| `UserProfile` | `user_profiles` | Extended user profiles |
| `SolanaAuditProof` | `solana_audit_proofs` | On-chain anchor records |
| `IngestNonce` | `ingest_nonces` | Replay protection (24h TTL) |
| `DiscoveryAsset` | `discovery_assets` | Macro-asset discovery queue |
| `AuditLog` | `audit_logs` | System event audit trail (SHA-256) |
| `TelemetryReading` | `telemetry_readings` | IoT sensor telemetry |

### Key Enums

| Enum | Values |
|---|---|
| `UserRole` | FOUNDER, ADMIN, SOVEREIGN_AGENT, CLIENT_OWNER, AGENT, FARMER, REALTOR, BUSINESS_OWNER, SOVEREIGN_INDIVIDUAL |
| `SubmissionTrack` | TRACK_A_MATERIALS, TRACK_B_ENERGY_179D, TRACK_C_BIOCHAR_CDR |
| `SubmissionStatus` | DRAFT, PENDING_FORENSIC_VERIFICATION, FORENSIC_VERIFIED, AUTO_APPROVED, PENDING_SOVEREIGN_REVIEW, PENDING_AUTHORIZATION, SOVEREIGN_HOLD, ESCROW_REVIEW, PENDING_PLATFORM_REVIEW, REJECTED, SETTLEMENT_COMPLETE |
| `SettlementAssetClass` | SOVEREIGN_SKIN, PROPERTY_INDUSTRIAL, PROPERTY_RESIDENTIAL, PHYSICAL_COMMODITIES, PRECIOUS_METALS_CUSTODIAL |
| `DiscoveryTier` | PENDING_SOVEREIGN_REVIEW, AUTO_APPROVED |
| `DiscoveryCategory` | EXCHANGE, SKYSCRAPER, CASINO |
| `AssayStatus` | UNASSAYED, PENDING, CERTIFIED |

---

## 5. AUTHENTICATION & RBAC

### Authentication Flow

**Custom JWT system** — NOT NextAuth. Cookie-based `auth-token` httpOnly.

```
Login Flow:
  POST /api/auth/login → validates credentials → issues JWT → sets auth-token cookie

Google SSO Flow:
  GET /api/auth/google → CSRF state token → redirect to Google OAuth
  GET /api/auth/callback/google → exchange code → find/create user → issue JWT

Session Check:
  GET /api/auth/me → reads auth-token cookie → returns { user: { id, email, name, role } }

Logout:
  POST /api/auth/logout → clears auth-token cookie
```

**Google SSO Notes:**
- OAuth Client: "Bedrock ESG Production Gate" (`933406767966-cfju...`)
- Scoped to `bedrockesg.com`
- `ADMIN_MASTER_EMAIL` match → auto-elevated to ADMIN role
- New SSO users default to SOVEREIGN_INDIVIDUAL role

### RBAC Hierarchy (`lib/rbac.ts`)

```
FOUNDER (100)     → system:full, founder:settings, audit_logs:export, roles:manage + ALL below
ADMIN (75)        → platform:manage, users:manage, discovery:manage, notary:anchor + ALL below  
SOVEREIGN_AGENT   → submissions:approve, submissions:verify, discovery:view, telemetry:ingest + ALL below
CLIENT_OWNER      → submissions:create, submissions:view_own, telemetry:view
```

**Legacy role mapping:** AGENT → SOVEREIGN_AGENT; FARMER/REALTOR/BUSINESS_OWNER/SOVEREIGN_INDIVIDUAL → CLIENT_OWNER

### JWT Guard (`lib/rbac-guard.ts`)

```typescript
extractUser(req: NextRequest): { id, email, name, role } | null
withRbac(handler, requiredPermission): NextResponse
```

### Dual Auth Pattern (v1 endpoints)

All `/api/v1/*` endpoints accept EITHER:
1. Aethexer protocol key (`x-aethexer-key` header) — for EXITZ field app
2. Browser session JWT (`auth-token` cookie) — for admin panel / web UI

---

## 6. AETHEXER PROTOCOL LAYER

### Auth Guard — Trinity 3-Layer (`lib/aethexer-auth.ts`, 146 lines)

| Layer | Mechanism | Threshold |
|---|---|---|
| **1. Dual-Key** | `x-aethexer-key` validated via `crypto.timingSafeEqual()` against `AETHEXER_PROTOCOL_KEY` OR `AETHEXER_FIELD_KEY` | Exact match |
| **2. Timestamp Window** | `x-aethexer-ts` header must be ±300 seconds of server time | 300s |
| **3. Nonce Dedup** | `x-aethexer-nonce` stored in `IngestNonce` model; replays rejected | 24h TTL |

**CRITICAL:** `validateAethexerKey()` is **async** — all callers MUST `await`.

### Protocol Envelope (`lib/aethexer-protocol.ts`, 74 lines)

Every `/api/v1/*` response wraps in:
```json
{
  "protocol": "aethexer-v1",
  "backtrace": "BT-xxxxxxxx",
  "timestamp": "2026-06-16T...",
  "sentinel": "NODE-01",
  "data": { ... },
  "status": 200
}
```

Functions: `protocolSuccess(data, backtrace, status)`, `protocolError(code, message, status, backtrace)`, `generateBacktrace()`

---

## 7. SENTINEL ENGINE (`lib/sentinel-engine.ts`, 303 lines)

### Three-Pillar Scoring

| Pillar | Threshold | Weight | Input Type |
|---|---|---|---|
| **Document Integrity** | ≥ 0.95 (95%) | 40% | `DocumentIntegrityInput[]` — per-file SHA-256 hash, magic bytes, header validation |
| **LLM Confidence** | ≥ 0.75 (75%) | 30% | `LLMConfidenceInput` — parser confidence, fields extracted vs expected, anomaly flag |
| **Spatial Correlation** | ≥ 0.75 (75%) | 30% | `SpatialCorrelationInput` — geolocation, timestamp consistency, metadata density, scan/photo presence |

### Verdict Matrix

| Verdict | Condition |
|---|---|
| `AUTO_APPROVED` | All 3 pillars ≥ threshold |
| `PENDING_SOVEREIGN_REVIEW` | 1 pillar below threshold |
| `SOVEREIGN_HOLD` | 2 pillars below threshold |
| `REJECTED` | All 3 below threshold or composite < 0.50 |
| `PENDING_AUTHORIZATION` | Edge case routing |
| `ESCROW_REVIEW` | Financial review required |
| `PENDING_PLATFORM_REVIEW` | Platform team review |

### Magic Byte Validation

| Format | Signature |
|---|---|
| PDF | `%PDF` (0x25504446) |
| JPEG | `FF D8 FF` |
| PNG | `89 50 4E 47` (.PNG) |
| XLSX/DOCX | `50 4B` (PK ZIP) |
| PLY | `ply\n` (ASCII header) |
| Splat | ≥ 32 bytes (binary blob) |

### Score Hash

SHA-256 of `${docScore}|${llmScore}|${spatialScore}|${verdict}|${timestamp}` — tamper-detection for audit trail.

---

## 8. FORENSIC INGEST PIPELINE (`/api/v1/forensic-ingest`, 588 lines)

### Accepted Payload (multipart/form-data)

| Field | Type | Required | Notes |
|---|---|---|---|
| `track` | string | ✅ | TRACK_A_MATERIALS / TRACK_B_ENERGY_179D / TRACK_C_BIOCHAR_CDR |
| `walletAddress` | string | ✅ | Solana wallet address |
| `documents[]` | File[] | ✅ | PDF, CSV, XLSX, DOCX (max 100MB each) |
| `spatialScan` | File | ❌ | PLY or Splat file |
| `groundPhotos[]` | File[] | ❌ | JPG, PNG, WebP |
| `companyName` | string | ❌ | Corporate identity |
| `assetMetadata` | JSON string | ❌ | Must contain `latitude`/`longitude` for Haversine check |
| `operatorId` | string | ❌ | SPEXTER operator identifier |
| `facilityId` | string | ❌ | Facility zone ID (e.g. DC-SOVEREIGN-F1) — triggers Haversine boundary check |
| `clientTimestamp` | string/int | ❌ | ISO-8601 or Unix epoch ms — validated against server time (15min drift) |
| `sensorSnapshots` | JSON array | ❌ | SPEXTER sensor readings `[{sensorId, type, value, unit, capturedAt}]` |

### 7-Step Pipeline

```
Step 1: Auth Gate (Trinity 3-Layer)
Step 2: Field Extraction + SPEXTER Extension Parsing
  → operatorId, facilityId, clientTimestamp, sensorSnapshots
  → Temporal spoofing detection (15min drift tolerance)
  → Coordinates elevated from assetMetadata.latitude/longitude
Step 3: File Processing + Magic Byte Validation
  → SHA-256 hash per file
  → Magic byte check per buffer
  → S3 presigned upload URL generation
  → Hard reject on ANY magic byte mismatch (HTTP 422)
Step 3.5: HAVERSINE BOUNDARY ENFORCEMENT
  → facilityId resolved via longest-prefix match against FACILITY_ZONE_REGISTRY
  → Raw Haversine distance computed (R=6371km)
  → Hard reject if distance > zone radius (HTTP 400)
  → Error: "GPS ACCURACY DEGRADED — PLEASE RE-ENTER THE ACTIVE CAPTURE ZONE"
Step 4: Sentinel Engine Scoring
  → DocumentIntegrityInput from file hashes
  → LLMConfidenceInput enriched with sensor count + anomaly flag
  → SpatialCorrelationInput enriched with timestamp consistency + sensor bonus
Step 5: Submission + Document Creation (Prisma)
  → DRAFT status, backtrace ID, sentinel score in parserResultJson
  → operatorId, facilityId, clientTimestamp, sensorSnapshots, haversineCheck persisted
Step 6: Protocol Response
  → submissionId, files with upload URLs, sentinel verdict, spexterExtensions block
```

### Facility Zone Registry

| Prefix | Zone | Center | Radius |
|---|---|---|---|
| `DC-SOVEREIGN` | Sovereign Primary — Las Vegas NV | 36.1699, -115.1398 | 50km |
| `DC-PROPERTY` | Property Industrial — Houston TX | 29.7604, -95.3698 | 75km |
| `DC-PALLETS` | Logistics Hub — Ontario CA | 34.0633, -117.6509 | 40km |
| `DC-METALS` | Metals Recovery — Pittsburgh PA | 40.4406, -79.9959 | 60km |

### Haversine Implementation (`lib/logistics-auditor.ts`)

```typescript
calculateDistance(origin: LogisticsCoordinates, destination: LogisticsCoordinates): number
// R = 6371km, applies 1.2× route factor
// Forensic-ingest divides by 1.2 for raw boundary check
```

### State Flow

```
DRAFT → PENDING_FORENSIC_VERIFICATION → FORENSIC_VERIFIED → [founderApproved] → SETTLEMENT_COMPLETE
```

---

## 9. TELEMETRY INGEST PIPELINE (`/api/v1/telemetry-ingest`)

Accepts IoT sensor data from DC nodes.

- **KNOWN_GEOGRAPHIC_ZONES** — Same 4 zones as Facility Zone Registry (DC-SOVEREIGN, DC-PROPERTY, DC-PALLETS, DC-METALS)
- **GPS derivation** from zone center when node prefix matches
- **Grid-intensity correlation** — validates reported intensity against zone range
- **Batch re-evaluation** — `/api/v1/telemetry-reevaluate` re-scores existing readings
- **Model:** `TelemetryReading` — stores nodeId, sensorType, value, coordinates, sentinelVerdict

---

## 10. DISCOVERY PIPELINE

### Endpoints

| Method | Endpoint | Action |
|---|---|---|
| GET | `/api/v1/discovery` | Fetch all discovery assets (filterable by verdict, category) |
| POST | `/api/v1/discovery` | Actions: `approve`, `reject`, `rescan`, `settle` |

### Model: `DiscoveryAsset`

| Field | Type | Notes |
|---|---|---|
| `symbol` | String (unique) | NYSE-01, BURJ-DXB-001, MGM-LV-01, etc. |
| `category` | DiscoveryCategory | EXCHANGE, SKYSCRAPER, CASINO |
| `estimatedValueUsd` | Float | Estimated asset value |
| `sovereignShare70` | Float | 70% of estimated value |
| `verdict` | DiscoveryTier | PENDING_SOVEREIGN_REVIEW / AUTO_APPROVED |
| `settlementId` | String? | DISC-* settlement ID when settled |

### Seeded Assets (12)

**Exchanges (5):** NYSE-01, NASDAQ-01, LSE-01, CME-01, EUREX-01
**Skyscrapers (4):** BURJ-DXB-001, TAI-101-TPE, OWT-NYC-001, SHA-TWR-001
**Casinos (3):** MGM-LV-01, VEN-MAC-01, MBS-SGP-01

---

## 11. SETTLEMENT ENGINE — UNIVERSAL LAW (`lib/universal-law.ts`, 2,011 lines)

### Zero Greed Policy — 70/20/10 Split

```typescript
UNIVERSAL_SPLIT = {
  FOUNDER_YIELD: 0.70,       // "Asset Sovereign" — Verified Asset Holder
  STEWARDSHIP: 0.20,         // "Platform Processor" — Bedrock Treasury
  PUBLIC_RESILIENCE: 0.10,   // "Public Resilience" — Community allocation
}
```

**Runtime validation:** `FOUNDER_YIELD + STEWARDSHIP + PUBLIC_RESILIENCE` must equal 1.0 (throws on violation).

### Asset Class Variants (A–E)

| Code | Variant | Description |
|---|---|---|
| A | `SOVEREIGN_SKIN` | Personal carbon / lifestyle |
| B | `PROPERTY_INDUSTRIAL` | Commercial real estate + industrial |
| C | `PROPERTY_RESIDENTIAL` | Residential real estate |
| D | `PHYSICAL_COMMODITIES` | Materials, recycling, logistics |
| E | `PRECIOUS_METALS_CUSTODIAL` | Gold, silver, platinum custody |

### Precious Metals VAL Formula

```
VAL = (Spot Price × Weight × Purity%) − Refinery Discount
```

Fields on Submission: `purityPercentage`, `assayStatus`, `refineryDiscount`, `spotPriceAtIngest`, `verifiedAssetValue`

### Settlement Model

Fields: `founderYieldUsd`, `stewardshipUsd`, `publicResilienceUsd`, `carbonTonnes`, `carbonValueUsd`, `assetClass`, `solanaSignature`, `solanaAnchoredAt`, `anchorPending`

---

## 12. BLOCKCHAIN LAYER

### Solana Devnet Notary (`lib/solana-notary.ts`)

- Memo program: `MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`
- Payload: `{ bt, submissionId, action, timestamp }`
- Graceful fallback: no secret key → OFFLINE hash + PENDING_ANCHOR

### EXITZ Token Ecosystem (Mainnet)

| Token | Mint Address | Supply |
|---|---|---|
| EXITZ (base) | `44SrHT9Qwyz2jiiJkRF1zHKF2NFTgTC8m6ubPTb5qJBJ` | 2 |
| EXITZ-C (Classic Vehicles) | `7ZPsJE3W5YXnnYgapzfsA5JxtK8VQwtTn5Jb23hgfzMK` | 1 |
| EXITZ-A (Fine Art) | `G11hBknKcBXUjc4kvAtAkwjoHz5yMr7FTqEEYC96EnJn` | 1 |

Token-2022 program with on-chain metadata and forensic memo anchors.

### Hedera + Polygon (`lib/blockchain.ts`)

- `executeDualBlockchainAttestation()` — Hedera HCS submission + Polygon ERC-1155 minting
- Cross-chain metadata linking Hedera transaction ID to Polygon token URI
- Called during batch verification in agent portal

---

## 13. SPATIAL HERITAGE PARSER (`lib/ply-parser.ts`)

- **PLY ingest:** ASCII + Binary Little-Endian
- **Gaussian Splat detection:** SH coefficients, opacity, scale, rotation
- **Volume → material mass → carbon estimate pipeline**
- **Material densities:** asphalt 2.4 t/m³, aggregate 1.6 t/m³, concrete 2.3 t/m³
- **API:** `/api/spatial` (GET status, POST parse)

---

## 14. CARBON CALCULATION ENGINES

### Asphalt RAP Engine (`app/api/calculate/route.ts`)

- Local Eurobitume A1-A3 LCA formulas
- Virgin baseline: 60 kg CO₂/tonne
- RAP reduction: 0.4 kg/tonne per % RAP
- SSE streaming for real-time results

### Biochar CDR Engine (`app/api/biochar/route.ts`)

- Pyrolysis temperature validation
- Stability class calculation
- CDR credit generation + Hedera Guardian compliance
- Agent commission system

### Metal Recovery Engine (`lib/metal-calculator.ts`)

- Scrap metal carbon avoidance calculations
- Multiple metal types supported

### Legacy Healer (`lib/legacy-healer.ts`)

- Friction extraction from dead-weight assets
- Market rate multiplier calculations
- Integrated with Universal Law 70/20/10 split

---

## 15. EMISSION FACTOR DATABASE (`lib/emission-factors.ts`)

- **ICE Database v4.1:** 25 factors
- **Ecoinvent v3.10.1:** 15 factors
- **Total:** 40 emission factors
- **Biogenic Variance Correction:** 60% active for US and BR markets
- **Grid mixes:** US (0.419), BR (0.082), EU (0.253), GB (0.207)
- **API:** `/api/emission-factors` (lookup, calculate, biogenic-correction)

---

## 16. HUM DYNAMIC LISTENER (`services/hum-listener.ts`)

- **Baseline:** 12.6 MW (replaced legacy 18.0 MW)
- **Sources:** NYSE/NASDAQ, LSE, CME/Eurex trade windows
- **Shift threshold:** 5% triggers on-chain Memo anchor
- **API:** `/api/hum-telemetry` (GET state, POST read)
- **SSE:** `/api/ticker-stream` — 3–5s interval updates for cockpit ticker

---

## 17. ADMIN CONTROL PANEL (`/admin`)

### Auth Gate

Fetches `/api/auth/me`, validates FOUNDER or ADMIN role. Non-authorized users see access-denied screen.

### Panels

| Panel | Function |
|---|---|
| **Stats Strip** | Total Assets, Pending Review, Approved, Total Sovereign Value |
| **Pending Discovery Queue** | Per-asset APPROVE & SETTLE / REJECT / RE-SCAN buttons |
| **Settled Discovery Ledger** | Settled assets with settlement IDs, RE-SCAN action |
| **Network Purge Console** | Red-bordered danger zone, typed "PURGE" confirmation gate |

### Purge Gate (`/api/v1/admin/purge-test-artifacts`)

- GET: Non-destructive scan preview
- POST: Requires `confirmationToken: "PURGE"` — hard gate
- Dual auth: Aethexer key OR browser session JWT

---

## 18. API ROUTE INDEX

### v1 Protocol Endpoints (Aethexer-authenticated)

| Route | Methods | Purpose |
|---|---|---|
| `/api/v1/forensic-ingest` | GET, POST | Unified forensic file ingest + SPEXTER extension |
| `/api/v1/telemetry-ingest` | POST | IoT sensor telemetry ingest |
| `/api/v1/telemetry-reevaluate` | POST | Batch telemetry re-evaluation |
| `/api/v1/discovery` | GET, POST | Discovery asset CRUD + approval actions |
| `/api/v1/submissions/[id]/approve` | PATCH | Founder approval gate |
| `/api/v1/admin/purge-test-artifacts` | GET, POST | Destructive purge with confirmation gate |

### Auth Endpoints

| Route | Methods | Purpose |
|---|---|---|
| `/api/auth/login` | POST | JWT login |
| `/api/auth/register` | POST | User registration |
| `/api/auth/signup` | POST | Alias for register |
| `/api/auth/agent-signup` | POST | Agent registration with invitation code |
| `/api/auth/google` | GET | Initiate Google SSO |
| `/api/auth/callback/google` | GET | Google OAuth callback |
| `/api/auth/me` | GET | Session check |
| `/api/auth/logout` | POST | Clear session |

### Submission Lifecycle

| Route | Methods | Purpose |
|---|---|---|
| `/api/submissions` | GET, POST | List/create submissions |
| `/api/submissions/[id]/parse` | POST | AI forensic extraction |
| `/api/submissions/[id]/settle` | POST | 70/20/10 settlement |
| `/api/submissions/[id]/certificate` | GET | HTML2PDF certificate generation |

### Domain Endpoints

| Route | Purpose |
|---|---|
| `/api/biochar`, `/api/biochar/[id]`, `/api/biochar/history`, `/api/biochar/stats` | CDR engine |
| `/api/farmers`, `/api/farmers/[id]` | Farmer management |
| `/api/credits`, `/api/credits/stats` | Green credit lifecycle |
| `/api/calculate` | Asphalt carbon calculator |
| `/api/carbon-impact`, `/api/carbon-score` | Impact scoring |
| `/api/vault`, `/api/vault/ai-check`, `/api/vault/destruction-proof`, `/api/vault/logistics-audit` | Verification repository |
| `/api/analytics`, `/api/stats` | Dashboard analytics |
| `/api/projects` | RAP project management |
| `/api/locations`, `/api/locations/[id]` | Location management |
| `/api/yards` | DEPRECATED — proxies to Location model |
| `/api/consent`, `/api/consent/verify`, `/api/consent/logs` | Consent management |
| `/api/emission-factors` | Emission factor lookup |
| `/api/spatial` | PLY/Splat parsing |
| `/api/notary` | Solana notary anchor |
| `/api/hum-telemetry` | HUM listener state |
| `/api/ticker-stream` | SSE market data stream |
| `/api/audit-logs` | Audit log query |
| `/api/invitations` | Agent invitation codes |
| `/api/agent/register-farmer`, `/api/agent/pending-counts`, `/api/agent/verification-queue` | Agent portal |
| `/api/global-ledger` | Consolidated ledger data |
| `/api/upload` | S3 presigned URL generation |
| `/api/compliance` | Compliance framework |

---

## 19. PAGE ROUTE INDEX (31 Pages)

| Route | Purpose |
|---|---|
| `/` | Main dashboard + cockpit ticker |
| `/admin` | Master admin control panel (FOUNDER/ADMIN gated) |
| `/login` | Email/password + Google SSO login |
| `/signup` | User registration |
| `/signup/agent` | Agent registration with invitation code |
| `/onboarding` | 3-step sovereign onboarding wizard |
| `/submission-portal` | Corporate gatehouse (wallet-gated) |
| `/discovery` | Macro-asset discovery feed |
| `/calculator` | Asphalt RAP carbon calculator |
| `/analytics` | Dashboard analytics + charts |
| `/projects` | RAP project management |
| `/biochar` | CDR calculator |
| `/biochar/batches` | Biochar batch history |
| `/farmers` | Farmer management |
| `/credits` | Green credit lifecycle |
| `/metal` | Metal recovery dashboard |
| `/metal/calculator` | Metal carbon calculator |
| `/metal/logs` | Metal recovery logs |
| `/vault` | Verification repository |
| `/vault-node` | Vault node management |
| `/vault/history` | Verification history |
| `/vault/settings` | Vault settings |
| `/vault/community` | Community view |
| `/impact` | Impact dashboard |
| `/impact-calculator` | Impact calculator |
| `/global-ledger` | Consolidated ledger |
| `/ledger` | Legacy ledger view |
| `/legacy-healer` | Friction healing calculator |
| `/agent-portal` | Agent dashboard |
| `/agent-portal/verification-queue` | One-tap verification queue |

---

## 20. LIBRARY MODULE INDEX (31 Modules)

| Module | Lines | Purpose |
|---|---|---|
| `universal-law.ts` | 2,011 | Zero Greed settlement engine, VAL formula, asset class routing |
| `sentinel-engine.ts` | 303 | Three-pillar scoring (95/75/75), verdict matrix, magic bytes |
| `logistics-auditor.ts` | 231 | Haversine distance, CO₂ avoided from logistics |
| `validator.ts` | 216 | Zod schemas for ingest validation |
| `rbac.ts` | 155 | 4-tier role hierarchy + 18 permissions |
| `aethexer-auth.ts` | 146 | Trinity 3-layer auth guard |
| `rbac-guard.ts` | ~80 | JWT extraction + withRbac wrapper |
| `aethexer-protocol.ts` | 74 | Protocol envelope wrapper |
| `audit-logger.ts` | ~100 | Fire-and-forget audit with SHA-256 hashes |
| `emission-factors.ts` | ~200 | ICE v4.1 + Ecoinvent (40 factors) |
| `blockchain.ts` | ~150 | Hedera + Polygon dual attestation |
| `solana-notary.ts` | ~100 | Devnet memo anchoring |
| `solana-integration.ts` | ~80 | Wallet adapter |
| `ply-parser.ts` | ~200 | PLY/Splat parser + volume estimation |
| `carbon-calculator.ts` | ~100 | Eurobitume LCA formulas |
| `metal-calculator.ts` | ~80 | Metal recovery calculations |
| `green-alpha-engine.ts` | ~100 | Green scoring |
| `rap-alpha-engine.ts` | ~100 | RAP analysis engine |
| `legacy-healer.ts` | ~150 | Friction healing + dead mass extraction |
| `financed-emissions.ts` | ~100 | PCAF financed emissions |
| `compliance.ts` | ~80 | Regulatory compliance checks |
| `consent.ts` | ~60 | SHA-256 consent hashing |
| `vault-types.ts` | ~170 | Vault type definitions |
| `types.ts` | ~500 | Core type definitions |
| `utils.ts` | ~40 | Formatting utilities |
| `s3.ts` | ~60 | AWS S3 presigned URL generation |
| `aws-config.ts` | ~20 | AWS client configuration |
| `db.ts` | ~10 | Prisma client singleton |
| `aethex-engine.ts` | ~100 | Aethex engine (HUM specs) |
| `aethex-protocol.ts` | ~50 | Legacy protocol (pre-v1) |
| `resend.ts` | ~20 | Email utility |

---

## 21. ENVIRONMENT VARIABLES

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing key |
| `AETHEXER_PROTOCOL_KEY` | Primary protocol auth key |
| `AETHEXER_FIELD_KEY` | Field app auth key |
| `GOOGLE_CLIENT_ID` | Google SSO client ID |
| `GOOGLE_CLIENT_SECRET` | Google SSO client secret |
| `ADMIN_MASTER_EMAIL` | Auto-elevation email (idecade8@gmail.com) |
| `SOLANA_NOTARY_SECRET_KEY` | Devnet notary keypair |
| `AWS_ACCESS_KEY_ID` | S3 credentials |
| `AWS_SECRET_ACCESS_KEY` | S3 credentials |
| `AWS_REGION` | S3 region |
| `AWS_BUCKET_NAME` | S3 bucket |
| `NEXTAUTH_URL` | Auto-configured per environment |
| `HTML2PDF_API_URL` | PDF generation service |
| `HTML2PDF_API_KEY` | PDF generation key |

---

## 22. DEPLOYMENT

| Environment | URL | Notes |
|---|---|---|
| **Production** | `bedrockesg.com` | Custom domain, LIVE |
| **Preview** | VM preview URL | Development environment |

**Build:** Standalone output mode, rsync to `/tmp/app`, tar artifact deployed.
**Database:** Shared between dev and production — NO destructive operations without confirmation.
**Google SSO:** Scoped to `bedrockesg.com` with callback at `/api/auth/callback/google`.

---

*End of Technical Bible v2.4 — BT-C9C4C5 Trinity Protocol*
