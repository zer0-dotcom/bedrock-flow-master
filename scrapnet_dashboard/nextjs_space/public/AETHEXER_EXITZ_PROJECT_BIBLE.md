# AETHEXER / EXITZ — Project Bible
## Universal Truth Layer & Carbon Displacement Token
**Version:** 2026.04.29

---

> **Purpose of This Document:** This is a self-contained reference document for Claude AI sessions. Paste this at the beginning of any conversation to give Claude full architectural context on the Aethexer/EXITZ system. This covers both the protocol layer (within Bedrock ESG codebase) and the front-facing landing page (aethexer.com, built by Claude separately).

---

## 1. System Identity & Mission

**Aethexer** is the **Universal Truth Layer** — a proprietary protocol built by **ZerO** that provides military-grade security, environmental verification, and carbon displacement tracking for digital commerce and supply chain operations.

**EXITZ** is the native token of the Aethexer protocol — a Solana Token-2022 asset representing verified carbon displacement credits generated through the digitization of physical transport and logistics processes.

The Aethex Protocol is the intellectual property of ZerO and represents the cryptographic backbone of the Bedrock ESG platform.

---

## 2. Architecture Overview

### Two Codebases, One System

| Component | Location | Built By |
|-----------|----------|----------|
| **Aethex Protocol Engine** | Inside Bedrock ESG codebase (`/home/ubuntu/scrapnet_dashboard/nextjs_space/`) | Abacus AI Agent |
| **aethexer.com Landing Page** | Separate project/conversation | Claude AI |

**Critical Integration:** Both share the same Solana identity (Aethexer Sentinel), same database, and the protocol engine routes live inside the Bedrock ESG Next.js application.

---

## 3. The Aethex Protocol — Three-Tier Security Model

The protocol provides **"Armored Digital Packets"** — cryptographically secured data containers that replace physical armored transport, generating measurable carbon displacement.

### Tier 1: Ballistic Layer
- **Encryption:** AES-GCM-256
- **Purpose:** Payload-level encryption of all packet contents
- **Implementation:** `encryptPayload()` in `lib/aethex-protocol.ts`
- **IV:** 12-byte random initialization vector per packet
- **Auth Tag:** 16-byte authentication tag for tamper detection

### Tier 2: Guardian Layer
- **Mechanism:** 2-of-2 Multi-Signature Verification
- **Purpose:** Dual-party authorization for packet operations
- **Signers:** Sender + Receiver must both sign
- **Implementation:** `createGuardianSignature()`, `verifyGuardianConsensus()`

### Tier 3: Stealth Layer
- **Mechanism:** Zero-Knowledge Proof (ZKP)
- **Purpose:** Verify packet integrity without revealing contents
- **Implementation:** `generateStealthProof()`, `verifyStealthProof()`
- **Output:** Proof hash that validates data existence without exposure

### Packet Lifecycle
```
1. CREATED    → Payload encrypted (Ballistic)
2. SIGNED     → Multi-sig applied (Guardian)
3. VERIFIED   → ZKP generated (Stealth)
4. IN_TRANSIT → Packet moving between parties
5. DELIVERED  → Received and verified
6. SETTLED    → Carbon displacement calculated and recorded
```

---

## 4. EXITZ Token

### Token Specification
| Property | Value |
|----------|-------|
| Standard | SPL Token-2022 |
| Network | Solana Devnet |
| Mint Address | `44SrHT9Qwyz2jiiJkRF1zHKF2NFTgTC8m6ubPTb5qJBJ` |
| Decimals | 0 (whole units only) |
| Mint Authority | Aethexer Sentinel (`9tsq8qB4P9uPRSHrjXLaDQJd93nuo4wEEtkR1tAJRAQ3`) |
| Freeze Authority | Aethexer Sentinel |

### Token Metadata
```json
{
  "name": "EXITZ",
  "symbol": "EXITZ",
  "uri": "",
  "additionalMetadata": [
    ["backtrace_id", "BT-C9C4C5"],
    ["engine", "Bedrock ESG"],
    ["protocol", "Aethex Universal Truth Layer"],
    ["standard", "ISO 14064-2"]
  ]
}
```

### Genesis Emission
- **Amount:** 1.0 EXITZ
- **Recipient:** Aethexer Sentinel wallet
- **Script:** `scripts/genesis-emission.ts`
- **Status:** Confirmed on Solana Devnet
- **Purpose:** Protocol initialization / proof of capability

### Token Creation Script
- **File:** `scripts/mint-exitz.ts`
- **Method:** Uses `@solana/spl-token` Token-2022 extensions
- **Extensions:** TokenMetadata (on-chain metadata without Metaplex)
- **Flow:** `createMint()` → `createInitializeMetadataPointerInstruction()` → `createInitializeInstruction()` → `createUpdateFieldInstruction()`

---

## 5. Trade Settlement & GHG Displacement Engine

**File:** `lib/aethex-engine.ts`

### Core Constants
```typescript
DISPLACEMENT_FACTOR_KG_CO2E_PER_MILE = 2.7  // kg CO2e displaced per digital mile
SETTLEMENT_FEE_PERCENT = 0.5                // 0.5% settlement fee
MIN_PACKET_VALUE_USD = 100                   // Minimum packet value
MAX_BATCH_SIZE = 1000                        // Maximum batch transfer size
```

### Current State (as of latest data)
- **Total Packets Processed:** 779
- **Total CO2e Displaced:** ~6.7 tonnes
- **Settlement Status:** Active

### GHG Displacement Calculation
```
Displacement_CO2e = packets_count × avg_distance_miles × 2.7 kg CO2e/mile
```

The engine calculates how much CO2e would have been emitted by physical armored transport (trucks, security vehicles) and credits that amount as displacement when the equivalent operation is performed digitally via Armored Digital Packets.

### Settlement API (`/api/aethex-settlement`)

#### GET Operations (via `?action=` parameter)
| Action | Description |
|--------|-------------|
| `status` | Current engine status and statistics |
| `baselines` | Environmental baselines and thresholds |
| `settlements` | Settlement history records |
| `calculate` | Calculate displacement for given parameters |

#### POST Operations (via `action` in body)
| Action | Description |
|--------|-------------|
| `transfer-packets` | Transfer Armored Digital Packets between parties |
| `batch-transfer` | Batch transfer multiple packets |
| `verify-packet` | Verify packet integrity and authenticity |
| `get-current-state` | Get full current protocol state |

---

## 6. Armored Digital Packets

**File:** `lib/aethex-protocol.ts`

### Packet Structure
```typescript
interface ArmoredDigitalPacket {
  id: string;                    // Unique packet identifier
  payload: EncryptedPayload;     // AES-GCM-256 encrypted data
  guardian: GuardianSignature;   // 2-of-2 multi-sig
  stealth: StealthProof;         // Zero-knowledge proof
  metadata: PacketMetadata;      // Timestamps, route info
  displacement: DisplacementRecord; // CO2e displacement data
}
```

### Digital Packet API (`/api/aethex/digital-packet`)

#### GET Operations
| Action | Description |
|--------|-------------|
| `list` | List all packets with optional filters |
| `verify` | Verify a specific packet by ID |
| `stats` | Packet statistics and totals |

#### POST Operations
| Action | Description |
|--------|-------------|
| `create` | Create new Armored Digital Packet |
| `verify` | Verify packet integrity |
| `calculate-savings` | Calculate CO2e savings for a route |

---

## 7. Retroactive Harvest System

**File:** `lib/aethex-protocol.ts` (RetroactiveHarvest class) + `/api/aethex/retroactive-harvest`

### Purpose
Ingests historical enterprise resource planning (ERP) data and retroactively generates environmental impact assessments and Material Passports.

### Supported ERP Systems
- **SAP** (S/4HANA)
- **Oracle** (Cloud ERP)
- **Viewpoint** (Vista / Spectrum, construction-specific)

### Compliance Standards
- **2026 Caltrans Environmental Standards** — California Department of Transportation requirements
- **ISO 14064-2** — GHG quantification at project level
- **ISO 14040** — Life Cycle Assessment

### Harvest Workflow
```
1. INGEST     → Import ERP data (procurement, logistics, materials)
2. AUDIT      → Verify against 2026 Caltrans standards
3. CALCULATE  → Compute retroactive environmental impact
4. MINT       → Generate Material Passports with Solana attestation
5. CERTIFY    → Issue compliance certificates
```

### Material Passports
Digital documents that travel with physical materials, containing:
- Full chain-of-custody
- Environmental impact data (embodied carbon, transport emissions)
- Compliance status against applicable standards
- Solana attestation proof (backtrace: `BT-C9C4C5`)

### Retroactive Harvest API (`/api/aethex/retroactive-harvest`)

#### GET Operations
| Action | Description |
|--------|-------------|
| `status` | Harvest system status |
| `passports` | List generated Material Passports |
| `compliance` | Compliance audit results |

#### POST Operations
| Action | Description |
|--------|-------------|
| `ingest` | Ingest ERP data for processing |
| `audit` | Run compliance audit against standards |
| `mint-passport` | Generate and attest Material Passport |

---

## 8. Integration with Bedrock ESG

### Shared Infrastructure
| Resource | Shared? | Details |
|----------|---------|--------|
| Database | ✅ Yes | Same PostgreSQL instance, same Prisma schema |
| Solana Identity | ✅ Yes | Same Aethexer Sentinel wallet |
| API Routes | ✅ Yes | Aethex routes live inside Bedrock ESG codebase |
| Auth System | ✅ Yes | Same NextAuth.js session/JWT |
| LLM API | ✅ Yes | Same Abacus AI RouteLLM access |
| File Storage | ✅ Yes | Same AWS S3 bucket |

### Data Flow
```
Bedrock ESG Modules → Universal Ledger → Aethex Settlement Engine
                                        ↓
                              EXITZ Token Minting
                                        ↓
                              Solana Attestation
```

The Aethex engine consumes environmental data from all Bedrock ESG modules (asphalt calculations, biochar CDR, metal recovery) and translates verified environmental impact into EXITZ token issuance.

---

## 9. Key Files Reference

### Protocol Core
```
lib/aethex-protocol.ts          # Full Aethex Protocol implementation
                                 # - AethexProtocol class
                                 # - Ballistic/Guardian/Stealth layers
                                 # - Armored Digital Packets
                                 # - Retroactive Harvest system

lib/aethex-engine.ts            # Trade Settlement & GHG Displacement Engine
                                 # - Displacement calculations
                                 # - Settlement fee processing
                                 # - Batch transfer logic
```

### API Routes
```
app/api/aethex-settlement/route.ts       # Main settlement endpoint
app/api/aethex/digital-packet/route.ts   # Armored Digital Packet CRUD
app/api/aethex/retroactive-harvest/route.ts  # ERP ingestion & Material Passports
```

### Token Scripts
```
scripts/mint-exitz.ts           # EXITZ token creation (Token-2022)
scripts/genesis-emission.ts     # Genesis 1.0 EXITZ mint
```

### UI Components
```
components/aethex-protocol-widget.tsx   # Protocol status widget
components/solana-provider.tsx          # Wallet adapter (shared with Bedrock)
```

---

## 10. aethexer.com — Front Landing Page

### Important Context
- **Built by:** Claude AI in a **separate conversation/project**
- **NOT in this codebase** — the landing page source code lives in a different Abacus AI Agent conversation
- **Purpose:** Public-facing marketing/information site for the Aethex Protocol
- **Relationship:** Points to and references the protocol engine running on bedrockesg.com

### When Working on aethexer.com
If you're in a Claude session for the aethexer.com landing page:
- The protocol logic is NOT in your codebase — it lives in Bedrock ESG
- API calls should target `bedrockesg.com/api/aethex-*` endpoints
- The landing page is presentational; the engine runs on Bedrock ESG
- Use the Bedrock ESG Project Bible for understanding the backend

### When Working on Bedrock ESG
If you're modifying Aethex Protocol routes in Bedrock ESG:
- Changes to `/api/aethex-*` routes affect both bedrockesg.com and aethexer.com
- The aethexer.com landing page may reference these endpoints
- Ensure backward compatibility when modifying API contracts

---

## 11. Key Constants & Formulas

### Displacement Factor
```
2.7 kg CO2e per mile = physical armored transport displacement factor
Source: Calculated from average armored vehicle fuel consumption + security escort overhead
```

### Settlement Fee
```
0.5% of transaction value
Minimum packet value: $100 USD
Maximum batch size: 1,000 packets
```

### Security Parameters
```
AES-GCM Key Size: 256 bits
IV Length: 12 bytes
Auth Tag Length: 16 bytes
Multi-Sig Required: 2 of 2
ZKP Hash: SHA-256 based proof
```

### Token Economics
```
EXITZ Supply: Elastic (minted per verified displacement)
Decimals: 0 (whole units)
Mint Authority: Aethexer Sentinel only
Burn Mechanism: Retirement via Universal Ledger
```

---

## 12. Terminology Glossary

| Term | Definition |
|------|------------|
| **Aethexer** | The protocol system name — "Universal Truth Layer" |
| **EXITZ** | Native carbon displacement token (Solana Token-2022) |
| **Aethexer Sentinel (Node-01)** | The institutional Solana wallet identity used for all platform operations (formerly Kato Service Identity) |
| **Armored Digital Packet** | Cryptographically secured data container replacing physical transport |
| **Ballistic Layer** | AES-GCM-256 encryption tier |
| **Guardian Layer** | 2-of-2 multi-signature verification tier |
| **Stealth Layer** | Zero-Knowledge Proof verification tier |
| **Retroactive Harvest** | System for processing historical ERP data into environmental credits |
| **Material Passport** | Digital document tracking material chain-of-custody and environmental impact |
| **Backtrace** | Audit trail identifier (`BT-C9C4C5`) linking all operations |
| **ZerO** | The entity/organization behind both Bedrock ESG and Aethexer |
| **Sovereign Notary** | Solana Memo-based attestation system |
| **HUM Listener** | Energy grid baseline monitoring service |
| **Universal Ledger** | Master environmental accounting ledger in Bedrock ESG |
| **Displacement Factor** | 2.7 kg CO2e/mile — carbon savings from digital vs. physical transport |

---

## 13. Cross-Reference Guide

When working across both projects, here's how they connect:

```
aethexer.com (Landing Page)          bedrockesg.com (Engine)
─────────────────────────           ─────────────────────────
Marketing / Public Info    ←→       Protocol Implementation
UI/UX / Brand Identity     →       API Endpoints (/api/aethex-*)
                           ←       Data / Statistics
                           ←       Solana Attestation Proofs
                           ←       EXITZ Token State
```

**Shared Identity:**
- Same Solana wallet (Aethexer Sentinel)
- Same backtrace ID (BT-C9C4C5)
- Same EXITZ token mint address
- Same ZerO organizational branding

---

*Generated 2026-04-29 for Claude AI session context. This document is maintained by ZerO.*
