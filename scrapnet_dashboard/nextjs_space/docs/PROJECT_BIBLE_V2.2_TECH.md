# PROJECT BIBLE — BT-C9C4C5 v2.2 (Technical Reference)

> **Format**: Machine-readable / AI-LLM ingestion  
> **Tag**: BT-C9C4C5  
> **Version**: 2.2 — Mainnet Compliant Core  
> **Generated**: 2026-05-27  
> **Inheritance Scope**: All future modules MUST conform to this document.  

---

## §1 — SYSTEM IDENTITY

```yaml
project_name: Bedrock ESG
project_type: Industrial Carbon Verification Platform
domain: bedrockesg.com
repo_tag: v2.2-mainnet-ready
stack: Fullstack Web Application (Server-Side Rendering)
db_engine: PostgreSQL (Prisma ORM)
blockchain_cluster: solana-mainnet-beta
notary_identity: "Aethexer Notary Node"
notary_node_id: "Sentinel Node-01"
notary_version: "2.2.0"
auth_protocol: "aethexer-v1"
```

---

## §2 — SOVEREIGN SETTLEMENT MODEL (70/20/10)

### §2.1 — Constants

```yaml
split:
  FOUNDER_YIELD: 0.70   # Display label: "Asset Sovereign"
  STEWARDSHIP: 0.20     # Display label: "Platform Processor"
  PUBLIC_RESILIENCE: 0.10  # Display label: "Public Resilience"
  SUM_INVARIANT: 1.00   # MUST always equal 1.0 — runtime assertion enforced
```

### §2.2 — Display Labels (SETTLEMENT_LABELS)

| Constant Key | Percentage | Display Label       | Description                              |
|-------------|------------|---------------------|------------------------------------------|
| SEVENTY     | 70%        | Asset Sovereign     | Direct liquidity for the Verified Asset Holder |
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
    label: "Property — Industrial"
    characteristics: Commercial / Industrial Real Estate
    description: Warehouses, factories, logistics centers, commercial buildings
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

- `purityPercentage`: 0.0–1.0 (e.g., 0.999 for 99.9%)
- `assayStatus`: UNASSAYED | PENDING | CERTIFIED
- `refineryDiscount`: USD flat discount
- `spotPriceAtIngest`: Captured at submission time
- `verifiedAssetValue`: Computed VAL stored on Submission record

### §3.2 — Routing Rule

- The `assetClassVariant` field on the Settlement model determines routing.
- Only the five codes above are valid. **BANNED**: Fabricated variant codes or categories.

---

## §4 — 7-TIER SENTINEL VERDICT MATRIX

### §4.1 — Composite Score Formula

```
Composite = (docScore × 0.40) + (llmScore × 0.35) + (spatialScore × 0.25)
```

| Weight | Dimension            | Threshold | Method                                |
|--------|----------------------|-----------|---------------------------------------|
| 40%    | Document Integrity   | ≥95%      | SHA-256 hash + magic byte validation  |
| 35%    | LLM Parser Confidence| ≥75%      | AI extraction quality scoring         |
| 25%    | Spatial Correlation  | ≥75%      | Geolocation + metadata coherence      |

### §4.2 — Verdict Tiers

| Verdict                   | Trigger Condition                          | Action                      |
|---------------------------|--------------------------------------------|-----------------------------|
| AUTO_APPROVED             | ≥95% composite / 0 failures               | Settlement triggered        |
| PENDING_SOVEREIGN_REVIEW  | 75–94% composite / ≤1 failure              | Manual review queue         |
| PENDING_AUTHORIZATION     | 65–74% composite / ≤1 failure              | Escrow hold                 |
| SOVEREIGN_HOLD            | Manual trigger                             | Perimeter flag              |
| ESCROW_REVIEW             | Condition-based                            | Settlement hold             |
| PENDING_PLATFORM_REVIEW   | Structural issue                           | Infrastructure validation   |
| REJECTED                  | <65% composite OR ≥2 failures              | No settlement               |

### §4.3 — Sentinel Identity

```yaml
sentinel_node: "Sentinel Node-01"
sentinel_version: "1.0.0"
scoreHash_algo: SHA-256
scoreHash_input: JSON.stringify({ docScore, llmScore, spatialScore, compositeScore, scoredAt })
```

---

## §5 — SOLANA MAINNET NOTARY

### §5.1 — Configuration

```yaml
memo_program_id: "MemoJV1t78Ds8p3D96uEn59N8MQWPrqnGoAYvGo46wR"
expected_public_key: "9tsq8qB4P9uPRSHrjXLaDQJd93nuo4wEEtkR1tAJRAQ3"
rpc_env_var: SOLANA_MAINNET_RPC_URL
rpc_fallback: "https://api.mainnet-beta.solana.com"
secret_key_env_var: SOLANA_NOTARY_SECRET_KEY
secret_key_formats: ["base58", "JSON byte array"]
cluster: mainnet-beta
engine_name: "Sovereign Notary Bridge"
engine_version: "2.2.0"
```

### §5.2 — Memo Payload Schema

```json
{
  "v": "2.2",
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

### §5.3 — Production Guardrail

```
IF NODE_ENV === 'production':
  IF SOLANA_NOTARY_SECRET_KEY is empty/missing → LOG [PERIMETER ERROR] → HALT anchoring
  IF decoded keypair public key ≠ EXPECTED_PUBLIC_KEY → LOG [PERIMETER ERROR] → HALT anchoring
```

### §5.4 — Identity Lock

- `signer`: **"Aethexer Notary Node"** — permanent. No personal names.
- `signerIdentity`: **"Aethexer Notary Node"** — permanent.
- `node`: **"Sentinel Node-01"** — permanent.
- Explorer URL format: `https://explorer.solana.com/tx/{signature}` (no cluster suffix).

---

## §6 — AETHEXER PROTOCOL AUTH (Trinity 3-Layer)

### §6.1 — Headers

| Header              | Purpose                     | Required | Constraint          |
|---------------------|-----------------------------|----------|---------------------|
| x-aethexer-key      | Protocol key (server-to-server) | One of two | Timing-safe compare |
| x-aethexer-field-key | Field app key (mobile/edge) | One of two | Timing-safe compare |
| x-aethexer-ts       | Unix epoch timestamp        | Optional | ±300s window        |
| x-aethexer-nonce    | Replay protection token     | Optional | 16–128 chars, single-use |

### §6.2 — Environment Variables

```yaml
AETHEXER_PROTOCOL_KEY: <server-side key>
AETHEXER_FIELD_KEY: <field app key>
```

### §6.3 — Nonce Lifecycle

- Stored in `IngestNonce` model (Prisma)
- TTL: 24 hours, auto-cleanup on each auth call
- Replay of consumed nonce → HTTP 409 `NONCE_REPLAY`

### §6.4 — Anti-Replay Window

```
TIMESTAMP_WINDOW_SECONDS = 300  # ±5 minutes
IF |server_time - request_ts| > 300 → REJECT (TIMESTAMP_EXPIRED)
```

---

## §7 — MAGIC BYTE VALIDATION

| MIME Type                          | Magic Bytes (Hex)      | Description      |
|------------------------------------|------------------------|------------------|
| application/pdf                    | 25 50 44 46            | %PDF             |
| image/jpeg                         | FF D8 FF               | JPEG             |
| image/png                          | 89 50 4E 47            | .PNG             |
| application/vnd...spreadsheetml    | 50 4B 03 04            | PK (ZIP/XLSX)    |
| application/vnd...wordprocessingml | 50 4B 03 04            | PK (ZIP/DOCX)    |
| text/csv                           | (none)                 | Structure-validated |
| PLY (spatial)                      | "ply\n" ASCII header   | PLY 3D scan      |
| Splat (spatial)                    | ≥32 bytes              | Gaussian Splat   |

Mismatch → HTTP 422 `MAGIC_BYTE_MISMATCH` — hard reject.

---

## §8 — DATABASE GUARDRAILS

```yaml
max_concurrent_connections: 25
idle_session_timeout: short
statement_timeout: 5s
idle_in_transaction_timeout: 30s
connection_model: ephemeral (no persistent session state)
```

- Reuse one Prisma client instance.
- Handle disconnects gracefully.
- Never rely on persistent session state across requests.

---

## §9 — SUBMISSION STATE MACHINE

```
DRAFT
  → PENDING_FORENSIC_VERIFICATION
    → FORENSIC_VERIFIED
      → [founderApproved = true]
        → SETTLEMENT_COMPLETE
```

- Sovereign Approval Gate: `/api/v1/submissions/[id]/approve` — JWT protected
- Settlement fires 70/20/10 split + Solana anchor with backtrace

---

## §10 — EXITZ TOKEN ECOSYSTEM (Solana Mainnet)

```yaml
tokens:
  EXITZ_BASE:
    mint: "44SrHT9Qwyz2jiiJkRF1zHKF2NFTgTC8m6ubPTb5qJBJ"
    supply: 2
    description: Base ecosystem token
  EXITZ_C:
    mint: "7ZPsJE3W5YXnnYgapzfsA5JxtK8VQwtTn5Jb23hgfzMK"
    supply: 1
    description: Classic Vehicles
    integrity_model: VIN/Odometer (no HUM)
  EXITZ_A:
    mint: "G11hBknKcBXUjc4kvAtAkwjoHz5yMr7FTqEEYC96EnJn"
    supply: 1
    description: Fine Art
    integrity_model: VIN/Odometer (no HUM)
program: Token-2022
features: [on-chain metadata, forensic memo anchors]
mobile_assets: VIN/Odometer integrity (no HUM)
stationary_assets: HUM Seismic Baseline
```

---

## §11 — HUM LISTENER (Dynamic Baseline)

```yaml
baseline_mw: 12.6
legacy_mw: 18.0  # deprecated
shift_threshold: 5%
sources:
  - NYSE/NASDAQ window
  - LSE window
  - CME/Eurex window
trigger: On-chain Memo anchor when ≥5% shift detected
api_routes:
  - GET /api/hum-telemetry (state)
  - POST /api/hum-telemetry (read)
```

---

## §12 — CARBON CALCULATION ENGINES

### §12.1 — Asphalt (Eurobitume A1-A3 LCA)

```yaml
virgin_baseline: 60 kg CO₂/tonne
rap_reduction: 0.4 kg/tonne per %RAP
mix_types: [HMA, WMA, CMA]
transport_factor: included
api: /api/calculate
external_calls: NONE (local engine only)
```

### §12.2 — Biochar CDR

```yaml
api: /api/biochar
history: /api/biochar/history
stats: /api/biochar/stats
framework: Hedera Guardian
attestation: Dual-chain (Hedera HCS + Polygon ERC-1155)
```

### §12.3 — Metal Recovery

```yaml
api: /api/metal
stats: /api/metal/stats
supported_metals: [STEEL, ALUMINUM, COPPER, BRASS, LEAD, ZINC, STAINLESS_STEEL, CAST_IRON, TITANIUM, NICKEL]
emission_source: ICE Database standard factors
```

---

## §13 — EMISSION FACTOR DATABASE

```yaml
sources:
  - ICE Database v4.1 (25 factors)
  - Ecoinvent v3.10.1 (15 factors)
total_factors: 40
biogenic_variance_correction: 60% (active for US, BR markets)
grid_mixes:
  US: 0.419 kgCO2e/kWh
  BR: 0.082 kgCO2e/kWh
  EU: 0.253 kgCO2e/kWh
  GB: 0.207 kgCO2e/kWh
api: /api/emission-factors
```

---

## §14 — SPATIAL HERITAGE PARSER

```yaml
formats: [PLY ASCII, PLY Binary Little-Endian, Gaussian Splat]
pipeline: Volume → Material Mass → Carbon Estimate
material_densities:
  asphalt: 2.4 t/m³
  aggregate: 1.6 t/m³
  concrete: 2.3 t/m³
features: [SH coefficients, opacity, scale, rotation detection]
api: /api/spatial
```

---

## §15 — BANNED PATTERNS

```yaml
banned:
  - Personal names in any codebase file or on-chain memo
  - Operational monikers or nicknames in identity fields
  - Hardcoded sub-splits within the 10% Public Resilience tier
  - Fabricated node IDs (only "Sentinel Node-01" is valid)
  - Fabricated asset class codes (only A–E above are valid)
  - Fabricated routing tags or category labels
  - External LLM API calls from /api/calculate (local engine only)
  - Devnet cluster references (system is mainnet-only)
  - Legacy signer names ("Zer0", personal identifiers)
```

---

## §16 — ENVIRONMENT VARIABLES (Required)

```yaml
# Solana Notary
SOLANA_NOTARY_SECRET_KEY: <base58 or JSON array>
SOLANA_MAINNET_RPC_URL: <RPC endpoint>

# Aethexer Protocol
AETHEXER_PROTOCOL_KEY: <server key>
AETHEXER_FIELD_KEY: <field app key>

# Database
DATABASE_URL: <PostgreSQL connection string>

# Auth
NEXTAUTH_SECRET: <auto-configured>
NEXTAUTH_URL: <auto-configured per environment>
```

---

## §17 — API ROUTE MAP

| Route                                    | Method | Purpose                          |
|------------------------------------------|--------|----------------------------------|
| /api/calculate                           | POST   | Asphalt carbon LCA               |
| /api/biochar                             | GET/POST | Biochar CDR batches            |
| /api/biochar/history                     | GET    | Historical batch query           |
| /api/biochar/stats                       | GET    | Aggregate biochar stats          |
| /api/biochar/[id]/attestation            | GET    | Blockchain attestation details   |
| /api/metal                               | GET/POST | Metal recovery calculations    |
| /api/metal/stats                         | GET    | Metal recovery aggregate stats   |
| /api/carbon-impact                       | GET    | Unified carbon impact summary    |
| /api/stats                               | GET    | Dashboard summary metrics        |
| /api/analytics                           | GET    | Time series chart data           |
| /api/projects                            | GET/POST | Project management             |
| /api/locations                           | GET/POST | Location CRUD                  |
| /api/locations/[id]                      | GET/PATCH/DELETE | Location by ID          |
| /api/farmers                             | GET/POST | Farmer management              |
| /api/farmers/[id]                        | GET/PATCH/DELETE | Farmer by ID            |
| /api/credits                             | GET/POST | Farmer credit lifecycle        |
| /api/credits/stats                       | GET    | Credit aggregate stats           |
| /api/notary                              | GET/POST | Solana notary status/anchor    |
| /api/hum-telemetry                       | GET/POST | HUM listener state/read        |
| /api/emission-factors                    | GET    | Emission factor lookup           |
| /api/spatial                             | GET/POST | Spatial PLY parser             |
| /api/submissions                         | GET/POST | Business submissions           |
| /api/submissions/[id]/parse              | POST   | AI forensic parse                |
| /api/submissions/[id]/settle             | POST   | Settlement execution             |
| /api/submissions/[id]/certificate        | POST   | Sovereign certificate PDF        |
| /api/upload                              | POST   | S3 presigned URL generation      |
| /api/consent                             | GET/POST | User consent management        |
| /api/consent/verify                      | POST   | Consent verification             |
| /api/consent/logs                        | GET    | Consent audit logs               |
| /api/auth/login                          | POST   | JWT authentication               |
| /api/auth/register                       | POST   | User registration                |
| /api/auth/agent-signup                   | POST   | Agent signup with invitation     |
| /api/invitations                         | GET/POST | Invitation code management     |
| /api/agent/register-farmer               | POST   | Agent registers farmer           |
| /api/agent/pending-counts                | GET    | Pending verification counts      |
| /api/agent/verification-queue            | GET/POST | Verification queue management  |
| /api/v1/forensic-ingest                  | POST   | Unified forensic ingest          |
| /api/v1/telemetry-ingest                 | POST   | Telemetry ingest (Aethexer)      |
| /api/v1/submissions/[id]/approve         | PATCH  | Sovereign approval gate          |
| /api/yards                               | GET/POST | **DEPRECATED** — use /api/locations |

---

## §18 — INHERITANCE DIRECTIVE

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

---

*End of Technical Bible — BT-C9C4C5 v2.2*
