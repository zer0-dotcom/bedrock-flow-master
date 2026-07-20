# PROJECT BIBLE — BT-C9C4C5 v2.4 (Technical Reference)

> **Format**: Machine-readable / AI-LLM ingestion  
> **Tag**: BT-C9C4C5  
> **Version**: 2.4 — Trinity Protocol Upgrade  
> **Generated**: 2026-06-05  
> **Supersedes**: v2.2 (Mainnet Core), v2.3 (Macro-Asset Pipeline)  
> **Inheritance Scope**: All future modules MUST conform to this document.  

---

## §1 — SYSTEM IDENTITY

```yaml
project_name: Bedrock ESG
project_type: Industrial Carbon Verification Platform
domain: bedrockesg.com
repo_tag: v2.4-trinity-protocol
stack: Fullstack Web Application (Server-Side Rendering)
db_engine: PostgreSQL (Prisma ORM)
blockchain_cluster: solana-mainnet-beta
notary_identity: "Aethexer Notary Node"
notary_node_id: "Sentinel Node-01"
notary_version: "2.4.0"
auth_protocol: "aethexer-v1"
rbac_version: "1.0.0"
audit_pipeline_version: "1.0.0"
sse_ticker_version: "1.0.0"
```

---

## §2 — SOVEREIGN SETTLEMENT MODEL (70/20/10)

### §2.1 — Constants

```yaml
split:
  FOUNDER_YIELD: 0.70   # Display label: "Verified Asset Value" / "Asset Sovereign"
  STEWARDSHIP: 0.20     # Display label: "Platform Processor"
  PUBLIC_RESILIENCE: 0.10  # Display label: "Public Resilience"
  SUM_INVARIANT: 1.00   # MUST always equal 1.0 — runtime assertion enforced
```

### §2.2 — Display Labels (SETTLEMENT_LABELS)

| Constant Key | Percentage | Display Label       | Description                              |
|-------------|------------|---------------------|------------------------------------------|
| SEVENTY     | 70%        | Verified Asset Value | Direct liquidity for the Verified Asset Holder |
| TWENTY      | 20%        | Platform Processor  | Maintenance of Bedrock ESG / Unicon / Freality nodes |
| TEN         | 10%        | Public Resilience   | Non-custodial routing to resilience grants |

### §2.3 — Zero Greed Policy

```
IF (publicResilience / total) < 0.10 - 0.001 THEN status = HIGH_FRICTION
HIGH_FRICTION blocks settlement until ratio is restored.
Tolerance: ±0.1% for rounding errors only.
```

### §2.4 — Rules

- The 10% Public Resilience block is a **singular, unified block**.
- **BANNED**: Hardcoded sub-splits within the 10% tier.
- Dynamic routing by `assetClass` is permitted at the metadata level only (`assetClassMetadata` JSON field).
- Internal DB field names (`founderYieldUsd`, `stewardshipUsd`, `publicResilienceUsd`) are frozen for schema compatibility.

---

## §3 — ASSET CLASS VARIANTS (A–E)

```yaml
asset_class_variants:
  A:
    code: SOVEREIGN_SKIN
    label: "Sovereign Skin™ / Gripsy"
    characteristics: Thermodynamic + Kinetic
    description: Asphalt recycling, surface materials, circular construction inputs
  B:
    code: PROPERTY_INDUSTRIAL
    label: "Commercial & Industrial Property"
    characteristics: Commercial / Industrial Real Estate
    sub_classifications:
      - VERTICAL_REAL_ESTATE    # Skyscrapers / high-rise commercial towers
      - CASINO_COMPLEX          # Entertainment / casino mega-structures
      - INDUSTRIAL_LOGISTICS    # Warehouses, distribution centres, factories
    description: Macro-asset pipeline with telemetry, spatial scanning, and discovery
  C:
    code: PROPERTY_RESIDENTIAL
    label: "Property — Residential"
    characteristics: Residential Real Estate
    description: Single-family, multi-family, condominiums, rental properties
  D:
    code: PHYSICAL_COMMODITIES
    label: "Physical Commodities"
    characteristics: Fiat Currency, Commodities
    description: Currency destruction, commodity extraction, dead mass processing
  E:
    code: PRECIOUS_METALS_CUSTODIAL
    label: "Precious Metals Custodial"
    characteristics: Gold, Silver, Platinum
    description: Custodial pipeline with assay verification
```

### §3.1 — Precious Metals VAL Formula (Variant E)

```
VAL = (Spot Price × Weight × purity_percentage) − Refinery Discount
```

### §3.2 — Variant B Sub-Classifications (Prisma Enum `AssetSubClass`)

```yaml
VERTICAL_REAL_ESTATE:   # Skyscrapers: Burj Khalifa, Taipei 101, One WTC, Shanghai Tower
CASINO_COMPLEX:         # Casinos: MGM Grand, Venetian Macau, Marina Bay Sands
INDUSTRIAL_LOGISTICS:   # Warehouses, distribution centres, factories
```

### §3.3 — Routing Rule

- Only the five codes (A–E) are valid. **BANNED**: Fabricated variant codes.
- All new Variant B assets enter at `PENDING_SOVEREIGN_REVIEW` by default.

---

## §4 — ROLE-BASED ACCESS CONTROL (v2.4)

### §4.1 — Role Hierarchy

```yaml
roles:
  FOUNDER:
    level: 100
    description: Full system access — sovereign override
    permissions: ALL (19 permissions)
  ADMIN:
    level: 75
    description: Full platform access except founder-only settings
    exclusions: [system:full, audit_logs:export, roles:manage, founder:settings]
  SOVEREIGN_AGENT:
    level: 50
    description: Field verification, submission approval
    permissions: [submissions:approve, submissions:verify, submissions:create, submissions:view_own, submissions:view_all, settlements:view, discovery:view, telemetry:ingest, telemetry:view]
  CLIENT_OWNER:
    level: 25
    description: Submit assets, view own submissions only
    permissions: [submissions:create, submissions:view_own, telemetry:view]
```

### §4.2 — Legacy Role Mapping

```yaml
legacy_mappings:
  ADMIN: ADMIN
  AGENT: SOVEREIGN_AGENT
  FARMER: CLIENT_OWNER
  REALTOR: CLIENT_OWNER
  BUSINESS_OWNER: CLIENT_OWNER
  SOVEREIGN_INDIVIDUAL: CLIENT_OWNER
```

### §4.3 — Permission Catalogue (19 permissions)

```yaml
permissions:
  - system:full              # Founder-only
  - platform:manage          # Admin+
  - submissions:approve      # Sovereign Agent+
  - submissions:verify       # Sovereign Agent+
  - submissions:create       # Client Owner+
  - submissions:view_own     # Client Owner+
  - submissions:view_all     # Admin+
  - settlements:execute      # Admin+
  - settlements:view         # Sovereign Agent+
  - audit_logs:view          # Admin+
  - audit_logs:export        # Founder only
  - roles:manage             # Founder only
  - discovery:manage         # Admin+
  - discovery:view           # Sovereign Agent+
  - users:manage             # Admin+
  - telemetry:ingest         # Sovereign Agent+
  - telemetry:view           # Client Owner+
  - notary:anchor            # Admin+
  - founder:settings         # Founder only
```

### §4.4 — Implementation Files

```yaml
core_engine: lib/rbac.ts           # resolveRole(), hasPermission(), roleLevel(), canModifyRole()
api_guard: lib/rbac-guard.ts       # withRbac() wrapper using custom JWT auth (auth-token cookie / Bearer)
auth_pattern: Custom JWT (not NextAuth)
jwt_secret_env: JWT_SECRET
token_location: [cookie:auth-token, header:Authorization]
```

### §4.5 — Role Modification Guard

```
canModifyRole(actorRole, targetCurrentRole, targetNewRole):
  actorLevel > targetLevel AND actorLevel > newLevel
  → FOUNDER can modify anyone below FOUNDER
  → ADMIN can modify SOVEREIGN_AGENT and CLIENT_OWNER
  → No self-elevation possible
```

---

## §5 — AUDIT LOG PIPELINE (v2.4)

### §5.1 — AuditLog Model

```yaml
model: AuditLog
table_name: audit_logs
fields:
  id: UUID (PK)
  createdAt: DateTime (auto)
  actorId: String (FK to User)
  actorRole: UserRole enum
  eventType: String
  entityType: String  # Submission, Settlement, User, TelemetryReading
  entityId: String
  previousValue: Text (nullable, JSON)
  newValue: Text (nullable, JSON)
  metadata: Text (nullable, JSON)
  auditHash: String (SHA-256 tamper detection)
  backtraceId: String (default: BT-C9C4C5)
indexes:
  - actorId
  - eventType
  - [entityType, entityId] (composite)
  - createdAt
```

### §5.2 — Event Types

```yaml
event_types:
  - SUBMISSION_STATUS_CHANGE
  - SETTLEMENT_EXECUTED
  - BLOCKCHAIN_ANCHOR
  - ROLE_CHANGE
  - VERDICT_OVERRIDE
  - FOUNDER_APPROVAL
  - TELEMETRY_INGEST
  - DISCOVERY_FLAGGED
```

### §5.3 — Audit Hash Formula

```
Input = JSON.stringify({
  actorId, eventType, entityType, entityId,
  previousValue || '', newValue || '', timestamp
})
Hash = SHA-256(Input) → hex string
```

### §5.4 — Implementation Files

```yaml
core_logger: lib/audit-logger.ts
convenience_helpers:
  - logSubmissionStatusChange(actorId, actorRole, submissionId, prevStatus, newStatus, metadata?)
  - logSettlementExecution(actorId, actorRole, settlementId, splitData, metadata?)
  - logBlockchainAnchor(actorId, actorRole, entityType, entityId, txHash, metadata?)
  - logRoleChange(actorId, actorRole, targetUserId, prevRole, newRole)
  - logVerdictOverride(actorId, actorRole, entityType, entityId, prevVerdict, newVerdict, note?)
query_endpoint: GET /api/audit-logs (ADMIN+ via withRbac)
pattern: Fire-and-forget (errors logged, never break caller)
```

### §5.5 — Wired Integration Points

```yaml
current_integrations:
  - /api/submissions/[id]/settle → logSettlementExecution() after settlement creation
future_targets:
  - /api/v1/submissions/[id]/approve → logSubmissionStatusChange()
  - /api/v1/telemetry-ingest → logBlockchainAnchor()
  - /api/auth/* → logRoleChange() on role mutations
```

---

## §6 — 7-TIER SENTINEL VERDICT MATRIX

### §6.1 — Composite Score Formula

```
Composite = (docScore × 0.40) + (llmScore × 0.35) + (spatialScore × 0.25)
```

| Weight | Dimension            | Threshold | Method                                |
|--------|----------------------|-----------|---------------------------------------|
| 40%    | Document Integrity   | ≥95%      | SHA-256 hash + magic byte validation  |
| 35%    | LLM Parser Confidence| ≥75%      | AI extraction quality scoring         |
| 25%    | Spatial Correlation  | ≥75%      | Geolocation + metadata coherence      |

### §6.2 — Verdict Tiers (Prisma SubmissionStatus + TelemetryReading.sentinelVerdict)

| Verdict                   | Trigger Condition                          | Action                      |
|---------------------------|--------------------------------------------|-----------------------------|      
| AUTO_APPROVED             | ≥95% composite / 0 failures               | Settlement triggered        |
| PENDING_SOVEREIGN_REVIEW  | 75–94% composite / ≤1 failure              | Manual review queue         |
| PENDING_AUTHORIZATION     | 65–74% composite / ≤1 failure              | Escrow hold                 |
| SOVEREIGN_HOLD            | Manual trigger                             | Perimeter flag              |
| ESCROW_REVIEW             | Condition-based                            | Settlement hold             |
| PENDING_PLATFORM_REVIEW   | Structural issue                           | Infrastructure validation   |
| REJECTED                  | <65% composite OR ≥2 failures              | No settlement               |

### §6.3 — Discovery Tier (Prisma Enum `DiscoveryTier`)

```yaml
tiers:
  - PENDING_SOVEREIGN_REVIEW  # Default for all new unlisted assets
  - AUTO_APPROVED             # After sovereign review confirms the asset
```

---

## §7 — SSE MARKET LISTENER (v2.4)

### §7.1 — Architecture

```yaml
endpoint: /api/ticker-stream
protocol: Server-Sent Events (SSE)
interval: 3–5 seconds (randomized)
fallback: Client-side local jitter simulation if SSE connection fails
pattern: ReadableStream with TextEncoder
```

### §7.2 — Event Types

```yaml
events:
  ticker:
    description: Full asset matrix update
    payload:
      assets: Array<{ id, symbol, name, category, baseValue, unit, verdict, sub_classification?, value, change, changePercent, lastUpdated }>
      humBaselineMw: 12.6
      co2eDaily: 74088  # tonnes CO₂e/day across tracked exchanges
  hum_anchor:
    description: HUM frequency shift detected (≥5% from baseline)
    payload:
      assetId: string
      shiftPercent: number
      baselineMw: 12.6
      currentMw: number
      timestamp: ISO-8601
```

### §7.3 — 12 Seeded Macro-Assets (Canonical Symbols)

```yaml
exchanges:
  - { id: NYSE-01, symbol: NYSE-01, name: "New York Stock Exchange", category: EXCHANGE, unit: MW, verdict: AUTO_APPROVED }
  - { id: NASDAQ-01, symbol: NASDAQ-01, name: "Nasdaq Composite", category: EXCHANGE, unit: MW, verdict: AUTO_APPROVED }
  - { id: LSE-01, symbol: LSE-01, name: "London Stock Exchange", category: EXCHANGE, unit: MW, verdict: AUTO_APPROVED }
  - { id: CME-01, symbol: CME-01, name: "Chicago Mercantile Exchange", category: EXCHANGE, unit: MW, verdict: AUTO_APPROVED }
  - { id: EUREX-01, symbol: EUREX-01, name: "Eurex Exchange", category: EXCHANGE, unit: MW, verdict: AUTO_APPROVED }
skyscrapers:
  - { id: BURJ-DXB-001, symbol: BURJ-DXB-001, name: "Burj Khalifa — Dubai", category: SKYSCRAPER, unit: kW, verdict: PENDING_SOVEREIGN_REVIEW, sub: VERTICAL_REAL_ESTATE }
  - { id: TAI-101-TPE, symbol: TAI-101-TPE, name: "Taipei 101 — Taiwan", category: SKYSCRAPER, unit: kW, verdict: PENDING_SOVEREIGN_REVIEW, sub: VERTICAL_REAL_ESTATE }
  - { id: OWT-NYC-001, symbol: OWT-NYC-001, name: "One World Trade — NYC", category: SKYSCRAPER, unit: kW, verdict: PENDING_SOVEREIGN_REVIEW, sub: VERTICAL_REAL_ESTATE }
  - { id: SHA-TWR-001, symbol: SHA-TWR-001, name: "Shanghai Tower — PRC", category: SKYSCRAPER, unit: kW, verdict: PENDING_SOVEREIGN_REVIEW, sub: VERTICAL_REAL_ESTATE }
casinos:
  - { id: MGM-LV-01, symbol: MGM-LV-01, name: "MGM Grand — Las Vegas", category: CASINO, unit: kW, verdict: PENDING_SOVEREIGN_REVIEW, sub: CASINO_COMPLEX }
  - { id: VEN-MAC-01, symbol: VEN-MAC-01, name: "The Venetian — Macau", category: CASINO, unit: kW, verdict: PENDING_SOVEREIGN_REVIEW, sub: CASINO_COMPLEX }
  - { id: MBS-SGP-01, symbol: MBS-SGP-01, name: "Marina Bay Sands — Singapore", category: CASINO, unit: kW, verdict: PENDING_SOVEREIGN_REVIEW, sub: CASINO_COMPLEX }
```

### §7.4 — Cockpit Ticker UI

```yaml
component: components/cockpit-ticker.tsx
position: Top of main dashboard (app/page.tsx)
features:
  - Auto-scrolling ticker strip with seamless loop
  - SSE-driven updates (fallback: local jitter at 2.5s)
  - Filter tabs: [ ALL ] | [ EXCHANGES ] | [ SKYSCRAPERS ] | [ CASINOS ]
  - Verdict badges: AUTO_APPROVED (emerald), PENDING_SOVEREIGN_REVIEW (amber), REJECTED (red)
  - Flashing delta tick: cyan ring pulse (600ms) on value change
  - HUM anchor indicator: ⚡ in header bar on shift events
  - Version tag: BT-C9C4C5 v2.4
```

---

## §8 — MACRO-ASSET PASSIVE DISCOVERY INTERFACE (v2.4)

### §8.1 — Route & Components

```yaml
page: /discovery (app/discovery/page.tsx)
component: components/discovery-dashboard.tsx
sidebar_section: "Discovery" (violet theme, Eye icon)
```

### §8.2 — Features

```yaml
capabilities:
  - Passive intelligence feed for unlisted macro-assets
  - 12 seeded assets with estimated values
  - 70% sovereign share calculation per asset
  - "RIGHT SHARE PENDING" badge (pulsing amber) for PENDING_SOVEREIGN_REVIEW
  - Filter tabs: [ ALL ] | [ PENDING REVIEW ] | [ APPROVED ]
  - Trigger Outreach workflow button (per pending asset)
  - Stats cards: Auto Approved count, Pending Review count, Total Assets
  - Total 70% Sovereign Value aggregate display
```

### §8.3 — Seeded Discovery Asset Values

```yaml
# All values in USD
exchanges:
  NYSE-01:      { total: 26B, sovereign70: 18.2B, verdict: AUTO_APPROVED }
  NASDAQ-01:    { total: 19.4B, sovereign70: 13.58B, verdict: AUTO_APPROVED }
  LSE-01:       { total: 12.8B, sovereign70: 8.96B, verdict: AUTO_APPROVED }
  CME-01:       { total: 8.2B, sovereign70: 5.74B, verdict: AUTO_APPROVED }
  EUREX-01:     { total: 6.1B, sovereign70: 4.27B, verdict: AUTO_APPROVED }
skyscrapers:
  BURJ-DXB-001: { total: 1.5B, sovereign70: 1.05B, verdict: PENDING }
  TAI-101-TPE:  { total: 1.8B, sovereign70: 1.26B, verdict: PENDING }
  OWT-NYC-001:  { total: 3.9B, sovereign70: 2.73B, verdict: PENDING }
  SHA-TWR-001:  { total: 2.4B, sovereign70: 1.68B, verdict: PENDING }
casinos:
  MGM-LV-01:   { total: 4.6B, sovereign70: 3.22B, verdict: PENDING }
  VEN-MAC-01:   { total: 5.2B, sovereign70: 3.64B, verdict: PENDING }
  MBS-SGP-01:   { total: 5.7B, sovereign70: 3.99B, verdict: PENDING }
```

---

## §9 — SOLANA MAINNET NOTARY

### §9.1 — Configuration

```yaml
memo_program_id: "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
expected_public_key: "9tsq8qB4P9uPRSHrjXLaDQJd93nuo4WEEtkR1tAJRAQ3"
rpc_env_var: SOLANA_MAINNET_RPC_URL
rpc_fallback: "https://api.mainnet-beta.solana.com"
secret_key_env_var: SOLANA_NOTARY_SECRET_KEY
secret_key_formats: ["base58", "JSON byte array"]
cluster: mainnet-beta
engine_name: "Sovereign Notary Bridge"
engine_version: "2.4.0"
```

### §9.2 — Memo Payload Schema

```json
{
  "v": "2.4",
  "sys": "BEDROCK_ESG",
  "signer": "Aethexer Notary Node",
  "node": "Sentinel Node-01",
  "t": "<CARBON_AUDIT|TRADE_SETTLEMENT|HUM_FREQUENCY_SHIFT|SPATIAL_ATTESTATION|BIOCHAR_CDR|METAL_RECOVERY>",
  "id": "<entityId>",
  "h": "<first 32 chars of dataHash>",
  "co2t": "<optional: carbonTonnes>",
  "usd": "<optional: valuationUsd>",
  "bt": "<optional: backtrace ID>",
  "ts": "<unix epoch seconds>"
}
```

### §9.3 — Identity Lock

- `signer`: **"Aethexer Notary Node"** — permanent. No personal names.
- `node`: **"Sentinel Node-01"** — permanent.
- Local cockpit moniker "Zer0" is display-only; never appears on-chain.

---

## §10 — AETHEXER PROTOCOL AUTH (Trinity 3-Layer)

### §10.1 — Headers

| Header              | Purpose                     | Required | Constraint          |
|---------------------|-----------------------------|----------|---------------------|
| x-aethexer-key      | Protocol key (server)       | One of two | Timing-safe compare |
| x-aethexer-field-key | Field app key (mobile/edge) | One of two | Timing-safe compare |
| x-aethexer-ts       | Unix epoch timestamp        | Optional | ±300s window        |
| x-aethexer-nonce    | Replay protection token     | Optional | 16–128 chars, single-use |

### §10.2 — Nonce Lifecycle

- Stored in `IngestNonce` model (Prisma)
- TTL: 24 hours, auto-cleanup on each auth call
- Replay → HTTP 409 `NONCE_REPLAY`

---

## §11 — VALIDATOR ENGINE (lib/validator.ts)

```yaml
schemas:
  AssetClassVariantSchema: enum [SOVEREIGN_SKIN, PROPERTY_INDUSTRIAL, PROPERTY_RESIDENTIAL, PHYSICAL_COMMODITIES, PRECIOUS_METALS_CUSTODIAL]
  VariantBSubClassificationSchema: enum [VERTICAL_REAL_ESTATE, CASINO_COMPLEX, INDUSTRIAL_LOGISTICS]
  SentinelVerdictSchema: enum [AUTO_APPROVED, PENDING_SOVEREIGN_REVIEW, PENDING_AUTHORIZATION, SOVEREIGN_HOLD, ESCROW_REVIEW, PENDING_PLATFORM_REVIEW, REJECTED]
  SpatialDataEnvelopeSchema: { has_geometry_coords, scan_format, mesh_density_points, location_anchor }
  MacroAssetMetadataSchema:
    sub_classification: VariantBSubClassificationSchema (OPTIONAL in v2.4)
    chiller_exhaust_temp: number (optional)
    square_footage_volume: number (optional)
    damper_mechanical_load_kw: number (optional)
    spatial_data_envelope: SpatialDataEnvelopeSchema (optional)
  TelemetryIngestPayloadSchema: { node_id, power_usage_kw, pue_ratio, carbon_per_trade_g, grid_intensity_score, asset_class, asset_class_metadata?, macro_asset_metadata? }
  DiscoveryAssetSchema:
    asset_id, asset_class, sub_classification?, display_name, location_label
    initial_verdict: default PENDING_SOVEREIGN_REVIEW
    discovery_tier: enum [PENDING_SOVEREIGN_REVIEW, AUTO_APPROVED] (v2.4)
    metadata?: MacroAssetMetadataSchema
```

---

## §12 — SCHEMA CHANGES (v2.4 Delta)

### §12.1 — New Enum Values

```yaml
UserRole (extended):
  new: [FOUNDER, SOVEREIGN_AGENT, CLIENT_OWNER]
  existing: [ADMIN, AGENT, FARMER, REALTOR, BUSINESS_OWNER, SOVEREIGN_INDIVIDUAL]
  
SubmissionStatus (extended):
  new: [AUTO_APPROVED, PENDING_SOVEREIGN_REVIEW, PENDING_AUTHORIZATION, SOVEREIGN_HOLD, ESCROW_REVIEW, PENDING_PLATFORM_REVIEW, REJECTED]
  existing: [DRAFT, PENDING_FORENSIC_VERIFICATION, FORENSIC_VERIFIED, SETTLEMENT_COMPLETE, REJECTED_FORENSIC]
```

### §12.2 — New Enums

```yaml
DiscoveryTier: [PENDING_SOVEREIGN_REVIEW, AUTO_APPROVED]
AssetSubClass: [VERTICAL_REAL_ESTATE, CASINO_COMPLEX, INDUSTRIAL_LOGISTICS]
```

### §12.3 — New Model: AuditLog

(See §5.1 for full specification)

### §12.4 — Migration Strategy

```yaml
method: prisma db push (non-destructive)
no_data_loss: true
migrate_deploy: NOT executed — left for manual admin trigger
```

---

## §13 — SUBMISSION TRACKS

```yaml
tracks:
  TRACK_A_MATERIALS:
    label: "Materials"
    scope: Asphalt, Concrete, Metal
    coefficient_source: ICE v4.1
  TRACK_B_ENERGY_179D:
    label: "179D Energy"
    scope: Building envelopes, energy audits
    compliance: IRS Form 7205
  TRACK_C_BIOCHAR_CDR:
    label: "Biochar CDR"
    scope: Biochar production receipts
    output: CDR credit linkage
```

---

## §14 — SUBMISSION STATE MACHINE (v2.4 Extended)

```
DRAFT
  → PENDING_FORENSIC_VERIFICATION
    → FORENSIC_VERIFIED
      → [founderApproved = true]
        → SETTLEMENT_COMPLETE

  → AUTO_APPROVED (via Sentinel ≥95% composite)
    → SETTLEMENT_COMPLETE

  → PENDING_SOVEREIGN_REVIEW (via Sentinel 75-94%)
    → [sovereign review] → AUTO_APPROVED or REJECTED

  → PENDING_AUTHORIZATION (65-74%)
  → SOVEREIGN_HOLD (manual)
  → ESCROW_REVIEW (conditional)
  → PENDING_PLATFORM_REVIEW (structural)
  → REJECTED (<65% or ≥2 failures)
  → REJECTED_FORENSIC (legacy forensic failure)
```

---

## §15 — EXITZ TOKEN ECOSYSTEM (Solana Mainnet)

```yaml
tokens:
  EXITZ_BASE:
    mint: "44SrHT9Qwyz2jiiJkRF1zHKF2NFTgTC8m6ubPTb5qJBJ"
    supply: 2
  EXITZ_C:
    mint: "7ZPsJE3W5YXnnYgapzfsA5JxtK8VQwtTn5Jb23hgfzMK"
    supply: 1
    description: Classic Vehicles
  EXITZ_A:
    mint: "G11hBknKcBXUjc4kvAtAkwjoHz5yMr7FTqEEYC96EnJn"
    supply: 1
    description: Fine Art
program: Token-2022
mobile_assets: VIN/Odometer integrity (no HUM)
stationary_assets: HUM Seismic Baseline
```

---

## §16 — HUM LISTENER

```yaml
baseline_mw: 12.6
shift_threshold: 5% (env: HUM_TRIGGER_THRESHOLD, default 0.5% for high-freq testing)
co2e_daily: 74,088 tonnes across tracked exchanges
sources: [NYSE/NASDAQ, LSE, CME/Eurex]
sse_integration: /api/ticker-stream emits hum_anchor events on threshold breach
api_routes:
  - GET /api/hum-telemetry (state)
  - POST /api/hum-telemetry (read)
```

---

## §17 — CARBON CALCULATION ENGINES

```yaml
asphalt:
  api: /api/calculate
  method: Eurobitume A1-A3 LCA (local engine, ZERO external calls)
  baseline: 60 kg CO₂/tonne (virgin)
  rap_reduction: 0.4 kg/tonne per %RAP
biochar:
  api: /api/biochar
  framework: Hedera Guardian
  attestation: Dual-chain (Hedera HCS + Polygon ERC-1155)
metal:
  api: /api/metal
  supported: [STEEL, ALUMINUM, COPPER, BRASS, LEAD, ZINC, STAINLESS_STEEL, CAST_IRON, TITANIUM, NICKEL]
  factors: ICE Database standard
```

---

## §18 — EMISSION FACTOR DATABASE

```yaml
sources:
  - ICE Database v4.1 (25 factors)
  - Ecoinvent v3.10.1 (15 factors)
total: 40
biogenic_correction: 60% (US, BR markets)
grid_mixes:
  US: 0.419, BR: 0.082, EU: 0.253, GB: 0.207 kgCO2e/kWh
api: /api/emission-factors
```

---

## §19 — MAGIC BYTE VALIDATION

| MIME Type            | Magic Bytes          | Description      |
|----------------------|----------------------|------------------|
| application/pdf      | 25 50 44 46          | %PDF             |
| image/jpeg           | FF D8 FF             | JPEG             |
| image/png            | 89 50 4E 47          | .PNG             |
| XLSX/DOCX            | 50 4B 03 04          | PK (ZIP)         |
| PLY (spatial)        | "ply\n" ASCII header | PLY 3D scan      |
| Splat (spatial)      | ≥32 bytes            | Gaussian Splat   |

Mismatch → HTTP 422 `MAGIC_BYTE_MISMATCH`.

---

## §20 — DATABASE GUARDRAILS

```yaml
max_concurrent_connections: 25
idle_session_timeout: short
statement_timeout: 5s
idle_in_transaction_timeout: 30s
connection_model: ephemeral
schema_migration: prisma db push (non-destructive only)
banned: prisma migrate deploy, prisma db push --accept-data-loss, prisma db push --force-reset
```

---

## §21 — API ROUTE MAP (v2.4 Complete)

| Route                                    | Method | Purpose                          | RBAC Gate    |
|------------------------------------------|--------|----------------------------------|--------------|
| /api/calculate                           | POST   | Asphalt carbon LCA               | —            |
| /api/biochar                             | GET/POST | Biochar CDR batches            | —            |
| /api/biochar/history                     | GET    | Historical batch query           | —            |
| /api/biochar/stats                       | GET    | Aggregate biochar stats          | —            |
| /api/biochar/[id]/attestation            | GET    | Blockchain attestation details   | —            |
| /api/metal                               | GET/POST | Metal recovery calculations    | —            |
| /api/carbon-impact                       | GET    | Unified carbon impact summary    | —            |
| /api/stats                               | GET    | Dashboard summary metrics        | —            |
| /api/analytics                           | GET    | Time series chart data           | —            |
| /api/projects                            | GET/POST | Project management             | —            |
| /api/locations                           | GET/POST | Location CRUD                  | —            |
| /api/locations/[id]                      | ALL    | Location by ID                   | —            |
| /api/farmers                             | GET/POST | Farmer management              | —            |
| /api/farmers/[id]                        | ALL    | Farmer by ID                     | —            |
| /api/credits                             | GET/POST | Farmer credit lifecycle        | —            |
| /api/credits/stats                       | GET    | Credit aggregate stats           | —            |
| /api/notary                              | GET/POST | Solana notary status/anchor    | —            |
| /api/hum-telemetry                       | GET/POST | HUM listener state/read        | —            |
| /api/emission-factors                    | GET    | Emission factor lookup           | —            |
| /api/spatial                             | GET/POST | Spatial PLY parser             | —            |
| /api/submissions                         | GET/POST | Business submissions           | —            |
| /api/submissions/[id]/parse              | POST   | AI forensic parse                | —            |
| /api/submissions/[id]/settle             | POST   | Settlement execution + audit log | —            |
| /api/submissions/[id]/certificate        | POST   | Sovereign certificate PDF        | —            |
| /api/upload                              | POST   | S3 presigned URL generation      | —            |
| /api/ticker-stream                       | GET    | SSE live asset telemetry (v2.4)  | —            |
| /api/audit-logs                          | GET    | Audit trail query (v2.4)         | audit_logs:view |
| /api/consent                             | GET/POST | User consent management        | —            |
| /api/consent/verify                      | POST   | Consent verification             | —            |
| /api/consent/logs                        | GET    | Consent audit logs               | —            |
| /api/auth/login                          | POST   | JWT authentication               | —            |
| /api/auth/register                       | POST   | User registration                | —            |
| /api/auth/agent-signup                   | POST   | Agent signup with invitation     | —            |
| /api/invitations                         | GET/POST | Invitation code management     | —            |
| /api/agent/register-farmer               | POST   | Agent registers farmer           | —            |
| /api/agent/pending-counts                | GET    | Pending verification counts      | —            |
| /api/agent/verification-queue            | GET/POST | Verification queue management  | —            |
| /api/v1/forensic-ingest                  | POST   | Unified forensic ingest          | Aethexer Auth |
| /api/v1/telemetry-ingest                 | POST   | Telemetry ingest (Aethexer)      | Aethexer Auth |
| /api/v1/submissions/[id]/approve         | PATCH  | Sovereign approval gate          | JWT          |

---

## §22 — ENVIRONMENT VARIABLES (Required)

```yaml
# Solana Notary
SOLANA_NOTARY_SECRET_KEY: <base58 or JSON array>
SOLANA_MAINNET_RPC_URL: <RPC endpoint>

# Aethexer Protocol
AETHEXER_PROTOCOL_KEY: <server key>
AETHEXER_FIELD_KEY: <field app key>

# HUM Listener
HUM_TRIGGER_THRESHOLD: <default 0.5, production 5.0>

# Database
DATABASE_URL: <PostgreSQL connection string>

# Auth
JWT_SECRET: <JWT signing secret>
NEXTAUTH_SECRET: <auto-configured>
NEXTAUTH_URL: <auto-configured per environment>
```

---

## §23 — BANNED PATTERNS

```yaml
banned:
  - Personal names in codebase or on-chain memos
  - Operational monikers in identity fields ("Zer0" never on-chain)
  - Hardcoded sub-splits within the 10% Public Resilience tier
  - Fabricated node IDs (only "Sentinel Node-01")
  - Fabricated asset class codes (only A–E)
  - External LLM API calls from /api/calculate
  - Devnet cluster references (mainnet-only)
  - prisma migrate deploy without explicit admin approval
  - prisma db push --accept-data-loss without explicit user confirmation
  - Self-elevation of roles (canModifyRole() guard enforced)
```

---

## §24 — INHERITANCE DIRECTIVE

All future modules added to Bedrock ESG MUST:

1. Apply the 70/20/10 split via `UNIVERSAL_SPLIT` constants from `lib/universal-law.ts`.
2. Use `SETTLEMENT_LABELS` for all user-facing split references.
3. Route through one of the 5 defined `ASSET_CLASS_VARIANTS` (A–E). No new variants without explicit protocol amendment.
4. Pass Sentinel scoring before settlement. No bypass paths.
5. Anchor all settlements to Solana Mainnet via `anchorToChain()` from `lib/solana-notary.ts`.
6. Use `"Aethexer Notary Node"` as the signer identity. No personal names.
7. Authenticate external ingest via `validateAethexerKey()` from `lib/aethexer-auth.ts`.
8. Validate all uploaded file buffers via magic byte checks.
9. Enforce Zero Greed Policy via `verifyZeroGreedPolicy()` before any settlement.
10. Respect the DB connection ceiling of 25 concurrent connections.
11. **v2.4**: Gate protected routes via `withRbac()` from `lib/rbac-guard.ts` with appropriate permission.
12. **v2.4**: Write audit log entries via `lib/audit-logger.ts` for all state-changing operations.
13. **v2.4**: New Variant B assets MUST enter at `PENDING_SOVEREIGN_REVIEW`.

---

*End of Technical Bible — BT-C9C4C5 v2.4*
