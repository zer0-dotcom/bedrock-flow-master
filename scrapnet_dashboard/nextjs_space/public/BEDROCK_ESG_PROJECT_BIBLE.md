# BEDROCK ESG — Project Bible
## Sovereign Environmental Verification Platform
**Version:** 2026.04.29 — **Deployed:** bedrockesg.com

---

> **Purpose of This Document:** This is a self-contained reference document for Claude AI sessions. Paste this at the beginning of any conversation to give Claude full architectural context on the Bedrock ESG platform. No secrets or credentials are included.

---

## 1. Platform Identity & Mission

**Bedrock ESG** is a sovereign environmental verification platform built by **ZerO**. It provides institutional-grade carbon accounting, environmental credit issuance, blockchain attestation, and regulatory compliance tooling for the construction, agriculture, and metals recovery sectors.

The platform operates on a **"Deep Space"** dark theme design language — dark backgrounds (`#0a0a0f`, `#111118`), accent colors (emerald `#10b981`, cyan `#06b6d4`, amber `#f59e0b`), with a cinematic, institutional aesthetic.

**Production URL:** `https://bedrockesg.com`
**Codebase Location:** `/home/ubuntu/scrapnet_dashboard/nextjs_space/`

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Prisma ORM) |
| Blockchain | Solana Devnet (Memo Program), Hedera HCS, Polygon ERC-1155 |
| Auth | NextAuth.js (email/password + role-based) |
| Styling | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| File Storage | AWS S3 (cloud storage) |
| PDF Generation | Abacus AI HTML2PDF API (Playwright-based) |
| LLM Integration | Abacus AI RouteLLM API (GPT-4-class) |
| Deployment | Abacus AI Hosted (standalone Next.js) |
| Package Manager | Yarn (never npm) |

---

## 3. Key Identifiers

| Identifier | Value | Description |
|------------|-------|-------------|
| Aethexer Sentinel (Node-01) | `9tsq8qB4P9uPRSHrjXLaDQJd93nuo4wEEtkR1tAJRAQ3` | Solana wallet for all platform attestations (formerly Kato Service Identity) |
| EXITZ Token Mint | `44SrHT9Qwyz2jiiJkRF1zHKF2NFTgTC8m6ubPTb5qJBJ` | Token-2022 (0 decimals) for carbon displacement credits |
| Backtrace ID | `BT-C9C4C5` | Sovereign audit trail identifier |
| Solana Network | Devnet | `https://api.devnet.solana.com` |
| Solana Memo Program | `MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr` | On-chain attestation program |
| Platform Owner | Bedrock ESG (ZerO) | Sovereign operator identity |

---

## 4. Module Map

Bedrock ESG consists of **7 major modules**:

### 4.1 Asphalt Calculator (`/calculator`)
- **Purpose:** ISO 14040-compliant LCA calculator for asphalt production
- **Key Formula:** `Total CO2e = Σ(material_weight × emission_factor × distance_factor)`
- **Emission Databases:**
  - **ICE v4.1** (University of Bath) — 25 material factors
  - **Ecoinvent v3.10.1** — 15 supplemental factors
  - **60% biogenic correction** applied to biochar entries
- **Features:** Multi-material mix design, transport emissions, Solana attestation of results
- **API:** `POST /api/calculate` — performs full LCA calculation
- **API:** `GET/POST /api/emission-factors` — CRUD for emission factor database

### 4.2 Biochar CDR (`/biochar`, `/biochar/batches`)
- **Purpose:** Carbon Dioxide Removal tracking for biochar production
- **Features:** Batch management, permanence tracking, feedstock analysis, Solana attestation
- **Database Model:** `BiocharBatch` — tracks feedstock, pyrolysis temp, carbon content, certification status
- **APIs:**
  - `GET/POST /api/biochar` — list/create batches
  - `GET/DELETE /api/biochar/[id]` — single batch operations
  - `GET /api/biochar/stats` — aggregate statistics
  - `GET /api/biochar/history` — historical data
  - `GET /api/biochar/[id]/attestation` — Solana attestation proof

### 4.3 Metal Recovery (`/metal`, `/metal/calculator`, `/metal/logs`)
- **Purpose:** Scrap metal processing and environmental impact tracking
- **Features:** Material type classification, weight logging, CO2e displacement calculation, recovery rate analytics
- **Database Model:** `MetalRecoveryLog` — ferrous/non-ferrous, weight, purity, CO2 displaced
- **APIs:**
  - `GET/POST /api/metal` — list/create recovery logs
  - `GET /api/metal/stats` — aggregate metal recovery statistics

### 4.4 Digital Vault (`/vault`, `/vault/history`, `/vault/settings`, `/vault/community`)
- **Purpose:** Secure document storage, verification, and compliance attestation
- **Features:**
  - **Vault Nodes** — Distributed verification infrastructure
  - **Logistics Audit** — Supply chain document verification
  - **Destruction Proof** — Certified destruction records
  - **AI Compliance Check** — LLM-powered document analysis
- **Database Models:** `VaultNode`, `VaultNodeOperator`, `VaultVerification`
- **APIs:**
  - `GET /api/vault` — vault contents
  - `POST/GET/PUT /api/vault/logistics-audit` — logistics audit CRUD
  - `POST/PUT /api/vault/destruction-proof` — destruction proof management
  - `POST /api/vault/ai-check` — AI-powered compliance verification

### 4.5 Universal Ledger (`/ledger`)
- **Purpose:** Master environmental accounting ledger with multi-chain settlement
- **Features:**
  - Cross-chain settlement (Solana + Hedera + Polygon)
  - 16 entry types (Carbon Credit, Biochar CDR, Metal Recovery, Water Savings, etc.)
  - Real-time balance tracking with ISO date precision
  - Trade settlement with ticker feed
  - Test settlement sandbox
- **Database Model:** `UniversalLedgerEntry` — amount, unit, chain, tx hash, verification status
- **APIs:**
  - `GET/POST /api/ledger` — ledger entry CRUD (supports filters: type, chain, dateRange, status)
  - `GET/POST /api/ledger/test-settlement` — settlement sandbox
  - `GET/POST /api/trade-settlement` — trade settlement engine
  - `GET /api/trade-settlement/ticker` — live trade ticker
  - `GET /api/global-ledger` — public global ledger view

### 4.6 Business Submission Portal (`/submission-portal`)
- **Purpose:** "Corporate Gatehouse" — businesses submit environmental documents for forensic analysis
- **Workflow:**
  1. Business submits documents (drag-and-drop, multi-track: Carbon, Water, Energy, Waste, Social)
  2. AI Forensic Parser analyzes documents via LLM API
  3. Settlement Engine applies **70/20/10 split** (70% Platform Credit, 20% Submitter Incentive, 10% Community Reserve)
  4. Sovereign Certificate PDF generated with Solana attestation
- **Database Models:**
  - `Submission` — company info, status, AI analysis results, settlement data
  - `SubmissionDocument` — individual files with S3 cloud storage paths
  - `Settlement` — calculated split amounts, blockchain tx signatures
- **APIs:**
  - `GET/POST /api/submissions` — list/create submissions
  - `GET/DELETE /api/submissions/[id]` — single submission
  - `POST /api/submissions/[id]/parse` — trigger AI forensic analysis
  - `POST /api/submissions/[id]/settle` — execute 70/20/10 settlement
  - `POST /api/submissions/[id]/certificate` — generate Sovereign Certificate PDF
  - `POST /api/upload` — S3 presigned URL generation

### 4.7 Aethex Protocol / EXITZ Integration
- See the **Aethexer/EXITZ Project Bible** for full details
- **Key integration:** Aethex Protocol routes live inside this codebase
- **APIs:** `/api/aethex-settlement`, `/api/aethex/digital-packet`, `/api/aethex/retroactive-harvest`

---

## 5. Supporting Modules

### 5.1 Impact Dashboard (`/impact`, `/impact-calculator`)
- Environmental impact aggregation across all modules
- `GET/POST /api/impact` — impact metrics
- `GET /api/carbon-impact` — carbon-specific impact
- `POST /api/carbon-score` — carbon scoring

### 5.2 Farmer Registry (`/farmers`)
- Agricultural partner management
- `GET/POST /api/farmers`, `GET/PATCH/DELETE /api/farmers/[id]`
- `GET/POST /api/credits` — farmer credit management

### 5.3 Analytics Dashboard (`/analytics`)
- Platform-wide analytics and reporting
- `GET /api/analytics` — aggregate analytics
- `GET /api/stats` — platform statistics
- `GET /api/leaderboard` — participant leaderboard

### 5.4 Agent Portal (`/agent-portal`, `/agent-portal/verification-queue`)
- Verification agent interface for reviewing submissions
- `GET/POST /api/agent/verification-queue` — queue management
- `GET /api/agent/pending-counts` — pending verification counts
- `POST /api/agent/register-farmer` — agent-initiated farmer registration

### 5.5 Legacy Healer (`/legacy-healer`)
- Legacy data migration and healing tool
- `GET/POST /api/legacy-healer` — legacy audit management

### 5.6 RAP Alpha (`/api/rap-alpha`)
- Retroactive Attestation Protocol
- `GET/POST /api/rap-alpha` — retroactive proof generation

### 5.7 Location Management
- Geographic location tracking for environmental operations
- `GET/POST /api/locations`, `GET/PATCH/DELETE /api/locations/[id]`

### 5.8 Compliance & Consent
- `GET/POST /api/compliance` — compliance framework management
- `GET/POST /api/consent` — user consent tracking
- `POST /api/consent/verify` — consent verification
- `GET /api/consent/logs` — audit logs

### 5.9 Solana Integration
- `GET /api/solana/proofs` — retrieve on-chain proofs
- `POST /api/solana/mint` — mint on-chain assets
- `GET/POST /api/notary` — Sovereign Notary (Solana Memo signing)

### 5.10 HUM Telemetry
- Dynamic HUM Listener — monitors energy grid baselines
- **Current baseline:** 12.6 MW (replaced legacy 18.0 MW)
- **Shift threshold:** 5%
- `GET/POST /api/hum-telemetry` — telemetry data management

### 5.11 Spatial Data
- PLY/point cloud parsing for environmental scanning
- `GET/POST /api/spatial` — spatial data management

---

## 6. Database Schema Overview

**ORM:** Prisma | **Provider:** PostgreSQL

### Core Models (41 total):

#### User & Profile System
- `User` — email, password hash, role (ADMIN/AGENT/FARMER/REALTOR/BUSINESS/SOVEREIGN/USER), verified status
- `UserProfile` — extended profile data
- `FarmerProfile`, `RealtorProfile`, `BusinessProfile`, `SovereignProfile` — role-specific profiles
- `InvitationCode` — invite-based registration

#### Environmental Data
- `UserCarbonEntry` — individual carbon calculations
- `BiocharBatch` — CDR batch tracking (feedstock, pyrolysis temp, carbon content, certification)
- `MetalRecoveryLog` — scrap metal recovery (type, weight, purity, CO2 displaced)
- `RecyclingLog` — recycling event records
- `FarmerCredit` — agricultural carbon credits

#### Verification & Compliance
- `VaultNode` — distributed verification nodes
- `VaultNodeOperator` — node operator assignments
- `VaultVerification` — verification records with multi-level status
- `ComplianceFramework` — regulatory framework tracking
- `UserConsent`, `ConsentLog` — consent management

#### Financial & Trading
- `UniversalLedgerEntry` — master ledger (amount, unit, chain, txHash, 16 entry types)
- `InternationalTransaction` — cross-border transactions
- `TravelRuleExchange` — FATF Travel Rule compliance
- `VatTaxRate` — jurisdictional tax rates
- `PortfolioOffset` — offset portfolio management
- `RetiredCredit` — retired credit tracking
- `FinancedEmissionLog` — Scope 3 financed emissions

#### Advanced Modules
- `DeadMassExtraction` — dead mass carbon extraction
- `ResonancePrint` — environmental resonance fingerprints
- `SocialYield` — social impact metrics
- `PublicResilienceGrant` — grant management
- `ImpactReport` — generated impact reports
- `LegacyAudit` — legacy data audit trail
- `VibrationalEquity` — vibrational equity scoring
- `ParametricInsurance` — parametric insurance products
- `PulseString` — real-time pulse monitoring

#### Submission Portal
- `Submission` — business submissions (companyName, track, status, AI analysis, settlement data)
- `SubmissionDocument` — uploaded documents (fileName, fileSize, cloudStoragePath)
- `Settlement` — 70/20/10 settlement records

#### Blockchain
- `SolanaAuditProof` — on-chain proof records

---

## 7. Blockchain Architecture

### 7.1 Solana (Primary Chain)
- **Network:** Devnet
- **Program:** Memo Program (`MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`)
- **Identity:** Aethexer Sentinel (`9tsq8qB4P9uPRSHrjXLaDQJd93nuo4wEEtkR1tAJRAQ3`)
- **Usage:** Environmental attestations, EXITZ token minting, audit proofs
- **Implementation:** `lib/solana-notary.ts` — `notarizeOnSolana()` function
  - Creates Memo transactions with structured payload
  - Payload format: `{type, data, timestamp, backtrace: "BT-C9C4C5"}`
  - Returns transaction signature for on-chain verification

### 7.2 Hedera (Secondary Chain)
- **Usage:** Hashgraph Consensus Service (HCS) for immutable topic-based logging
- **Integration:** Via Universal Ledger entries with `chain: "hedera"`

### 7.3 Polygon (Tertiary Chain)
- **Usage:** ERC-1155 multi-token standard for tradeable environmental credits
- **Integration:** Via Universal Ledger entries with `chain: "polygon"`

---

## 8. Key Libraries & Services

### 8.1 Sovereign Notary (`lib/solana-notary.ts`)
- Signs environmental attestations on Solana Memo Program
- Uses Aethexer Sentinel keypair
- Every attestation includes backtrace `BT-C9C4C5`

### 8.2 Emission Factor Engine (`lib/emission-factors.ts`)
- **ICE v4.1 Database:** 25 material emission factors (kg CO2e/kg)
  - Examples: General Aggregate (0.00747), Bitumen (0.49), Portland Cement (0.912), Steel (1.46)
- **Ecoinvent v3.10.1 Database:** 15 supplemental factors
  - Examples: RAP (0.00320), CRM (0.00850), Warm Mix Additive (0.15)
- **60% biogenic correction** for biochar-origin materials
- Lookup functions: `getEmissionFactor()`, `getAllFactors()`, `getFactorsByCategory()`

### 8.3 PLY Parser (`lib/ply-parser.ts`)
- Parses PLY point cloud files for environmental spatial analysis
- Used in spatial data module

### 8.4 Dynamic HUM Listener (`services/hum-listener.ts`)
- Monitors energy grid baseline for carbon displacement calculations
- **Baseline:** 12.6 MW (updated from legacy 18.0 MW)
- **Threshold:** 5% shift triggers recalibration
- Provides real-time grid factor for emission calculations

### 8.5 Aethex Protocol (`lib/aethex-protocol.ts`)
- Universal Truth Layer — see Aethexer/EXITZ Bible for details

### 8.6 Aethex Engine (`lib/aethex-engine.ts`)
- Trade Settlement & GHG Displacement Engine — see Aethexer/EXITZ Bible

---

## 9. User Roles & Auth

| Role | Access Level |
|------|-------------|
| `ADMIN` | Full platform access, all modules |
| `AGENT` | Verification queue, farmer registration |
| `FARMER` | Biochar batches, credits, profile |
| `REALTOR` | Property-related environmental data |
| `BUSINESS` | Submission portal, compliance |
| `SOVEREIGN` | Full sovereign operations |
| `USER` | Basic access, calculator, impact |

**Auth Flow:** NextAuth.js with JWT sessions, bcrypt password hashing.
**Signup Variants:** Standard (`/signup`), Agent (`/signup/agent`), API (`/api/auth/signup`, `/api/auth/agent-signup`)

---

## 10. Page Map (29 Routes)

| Route | Module |
|-------|--------|
| `/` | Dashboard (home) |
| `/login` | Authentication |
| `/signup`, `/signup/agent` | Registration |
| `/onboarding` | New user onboarding |
| `/calculator` | Asphalt LCA Calculator |
| `/biochar`, `/biochar/batches` | Biochar CDR |
| `/metal`, `/metal/calculator`, `/metal/logs` | Metal Recovery |
| `/vault`, `/vault/history`, `/vault/settings`, `/vault/community` | Digital Vault |
| `/ledger` | Universal Ledger |
| `/global-ledger` | Public Global Ledger |
| `/submission-portal` | Business Submission Portal |
| `/impact`, `/impact-calculator` | Impact Dashboard |
| `/farmers` | Farmer Registry |
| `/credits` | Credit Management |
| `/analytics` | Analytics Dashboard |
| `/agent-portal`, `/agent-portal/verification-queue` | Agent Portal |
| `/legacy-healer` | Legacy Data Healer |
| `/projects` | Project Management |
| `/vault-node` | Vault Node Management |

---

## 11. Design Language

### Theme: "Deep Space"
- **Background:** `#0a0a0f` (primary), `#111118` (secondary), `#1a1a2e` (cards)
- **Accent Colors:**
  - Emerald (`#10b981`) — primary actions, success states
  - Cyan (`#06b6d4`) — data visualization, links
  - Amber (`#f59e0b`) — warnings, highlights
  - Red (`#ef4444`) — destructive actions, errors
- **Typography:** System fonts, monospace for data/addresses
- **Effects:** Subtle gradients, glassmorphism on cards, particle/grain backgrounds
- **Icons:** Lucide React icon set
- **Components:** shadcn/ui (Button, Card, Dialog, Table, Tabs, etc.)

### Navigation
- **Sidebar-based** navigation with collapsible groups
- **Header** with Solana wallet connect button
- **Role-based** menu item visibility

---

## 12. Environment Variables (Structure Only — No Values)

```
DATABASE_URL          — PostgreSQL connection string
NEXTAUTH_SECRET       — JWT signing secret
NEXTAUTH_URL          — Auto-configured per environment
SOLANA_PRIVATE_KEY    — Aethexer Sentinel (Sentinel Node-01) keypair
ABACUSAI_API_KEY      — LLM API access
NOTIF_API_KEY         — Email notification API
NOTIF_ID_*            — Notification type IDs
AWS_ACCESS_KEY_ID     — S3 storage access
AWS_SECRET_ACCESS_KEY — S3 storage secret
AWS_REGION            — S3 region
AWS_S3_BUCKET         — S3 bucket name
HTML2PDF_*            — PDF generation API config
```

---

## 13. Integration Points

### Internal Integrations
- **Aethex Protocol** — shares database, Solana identity, routes live in this codebase
- **EXITZ Token** — minted via this platform's Solana integration
- **Universal Ledger** — aggregates data from all modules

### External Integrations
- **Solana Devnet** — blockchain attestations
- **Hedera HCS** — consensus logging
- **Polygon** — ERC-1155 credit tokens
- **AWS S3** — document/file storage
- **Abacus AI LLM** — forensic document analysis, AI compliance checks
- **Abacus AI HTML2PDF** — certificate generation

---

## 14. Key Formulas & Constants

### LCA Calculation
```
Total_CO2e = Σ(weight_kg × emission_factor_kgCO2e_per_kg × (1 + transport_factor))
transport_factor = distance_km × transport_emission_rate
biogenic_correction = 0.60 (applied to biochar-origin materials)
```

### Settlement Split (Submission Portal)
```
Platform Credit:      70% of verified amount
Submitter Incentive:  20% of verified amount  
Community Reserve:    10% of verified amount
```

### HUM Baseline
```
Current Baseline: 12.6 MW
Shift Threshold:  5%
Recalibration triggers when |current - baseline| > threshold × baseline
```

### EXITZ Token
```
Standard:  Token-2022 (SPL)
Decimals:  0 (whole units only)
Metadata:  name="EXITZ", symbol="EXITZ", backtrace_id=BT-C9C4C5
```

---

## 15. File Structure Reference

```
nextjs_space/
├── app/
│   ├── api/                    # 30+ API route groups
│   ├── (public)/               # Public routes
│   ├── calculator/             # Asphalt LCA
│   ├── biochar/                # Biochar CDR
│   ├── metal/                  # Metal Recovery
│   ├── vault/                  # Digital Vault
│   ├── ledger/                 # Universal Ledger
│   ├── submission-portal/      # Business Submissions
│   ├── impact/                 # Impact Dashboard
│   ├── farmers/                # Farmer Registry
│   ├── agent-portal/           # Agent Portal
│   └── ...                     # Other pages
├── components/
│   ├── sidebar.tsx             # Main navigation
│   ├── solana-provider.tsx     # Wallet adapter
│   ├── aethex-protocol-widget.tsx
│   ├── submission-drop-zone.tsx
│   ├── submissions-list.tsx
│   ├── ui/                     # shadcn/ui components
│   └── layouts/                # Layout components
├── lib/
│   ├── solana-notary.ts        # Sovereign Notary
│   ├── emission-factors.ts     # ICE v4.1 + Ecoinvent
│   ├── ply-parser.ts           # PLY point cloud parser
│   ├── aethex-protocol.ts      # Aethex Protocol
│   ├── aethex-engine.ts        # Trade Settlement Engine
│   ├── aws-config.ts           # S3 configuration
│   ├── s3.ts                   # S3 utilities
│   ├── db.ts                   # Prisma client
│   └── utils.ts                # Shared utilities
├── services/
│   └── hum-listener.ts         # Dynamic HUM Listener
├── scripts/
│   ├── mint-exitz.ts           # EXITZ token creation
│   ├── genesis-emission.ts     # Genesis emission
│   └── seed.ts                 # Database seeding
├── prisma/
│   └── schema.prisma           # Database schema (41 models)
└── STYLE_GUIDE.md              # Component style reference
```

---

*Generated 2026-04-29 for Claude AI session context. This document is maintained by ZerO.*
