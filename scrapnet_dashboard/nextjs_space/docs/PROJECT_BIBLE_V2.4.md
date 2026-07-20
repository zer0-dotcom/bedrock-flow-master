# BEDROCK ESG — PROJECT BIBLE v2.4

> **For:** Stakeholders, Partners, and Team Members
> **Version:** 2.4 — Trinity Protocol | **Updated:** June 16, 2026
> **Live at:** [bedrockesg.com](https://bedrockesg.com)

---

## WHAT IS BEDROCK ESG?

Bedrock ESG is an **institutional-grade carbon verification platform** that provides forensic-level proof of environmental impact across three industrial verticals:

- **Asphalt Recycling** — Tracking CO₂ savings from Reclaimed Asphalt Pavement (RAP)
- **Biochar Carbon Removal** — Measuring and certifying permanent carbon dioxide removal (CDR)
- **Metal Recovery** — Quantifying emissions avoided through scrap metal recycling

The platform acts as a **digital notary** — it doesn't just calculate carbon savings, it *proves* them through multi-layer verification, blockchain anchoring, and forensic document analysis.

---

## THE CORE PROMISE: "ZERO GREED"

Every verified asset settlement follows the **70/20/10 Universal Split**:

| Share | Recipient | Description |
|---|---|---|
| **70%** | **Asset Sovereign** | The verified asset holder — the person or entity who owns the carbon credit or physical asset |
| **20%** | **Platform Processor** | Bedrock ESG's operating share for verification, hosting, and compliance |
| **10%** | **Public Resilience** | Community allocation — funds directed to public infrastructure and sustainability |

This split is **mathematically enforced** in the codebase. It cannot be changed without triggering a system-level violation error.

---

## HOW VERIFICATION WORKS

### The Sentinel Engine — Three-Pillar Scoring

Every document, file, or sensor reading submitted to Bedrock ESG passes through the **Sentinel Engine**, which scores it across three independent pillars:

| Pillar | What It Checks | Minimum Score |
|---|---|---|
| **Document Integrity** | Are files authentic? Do their internal signatures match their declared format? | 95% |
| **AI Confidence** | Can our AI parser extract meaningful, consistent data from the documents? | 75% |
| **Spatial Correlation** | Does the GPS location, timestamp, and metadata make geographic sense? | 75% |

All three pillars must pass their minimum threshold for **automatic approval**. If any pillar falls short, the submission is held for human review.

### The Haversine Boundary Check

When a field operator submits data from a known facility, the system calculates the **exact distance** between the operator's GPS coordinates and the facility's registered location using the Haversine formula (the mathematical method for calculating distance on a sphere).

If the operator is more than **50 kilometers** from the facility, the submission is **immediately rejected** with a clear message: *"GPS Accuracy Degraded — Please Re-Enter the Active Capture Zone."*

This prevents remote spoofing of location data.

### Temporal Spoofing Detection

The system compares the timestamp on the operator's device with the server's clock. If the difference exceeds **15 minutes**, the submission is flagged as potentially spoofed. This catches attempts to backdate or forward-date submissions.

---

## THE THREE SUBMISSION TRACKS

### Track A: Materials (Asphalt, Concrete, Metal)

- Upload material test reports, delivery tickets, or recycling manifests
- System extracts tonnage, material type, and ICE v4.1 emission coefficients
- Calculates CO₂ savings based on Eurobitume lifecycle analysis (A1-A3 stages)

### Track B: 179D Energy (Real Estate)

- Upload IRS Form 7205, building envelope data, and energy audits
- Supports commercial and residential real estate carbon compliance
- Generates tax deduction documentation

### Track C: Biochar CDR (Carbon Dioxide Removal)

- Upload pyrolysis data, feedstock documentation, and stability metrics
- Validates CDR credits against Hedera Guardian Framework
- Links to dual-blockchain attestation (Hedera + Polygon)

---

## WHAT THE PLATFORM LOOKS LIKE

### For Asset Owners (Clients)

| Page | What It Does |
|---|---|
| **Dashboard** | Real-time cockpit ticker showing all verified assets with live value updates |
| **Submission Portal** | Drag-and-drop upload zone for documents, photos, and 3D spatial scans |
| **Calculator** | Instant CO₂ savings estimation for asphalt recycling projects |
| **Impact Dashboard** | Visual charts showing cumulative environmental impact |
| **Credits** | Track green credits through their lifecycle: Pending → Issued → Redeemed |
| **Onboarding** | 3-step wizard: Identity → Property → Telemetry setup |

### For Verification Agents

| Page | What It Does |
|---|---|
| **Agent Portal** | Overview dashboard with farmer registration and pending task counts |
| **Verification Queue** | One-tap approve/reject for biochar batches and recycling logs |

### For Administrators

| Page | What It Does |
|---|---|
| **Admin Panel** | Master control: approve/reject/re-scan discovery assets, execute settlements, network purge console |
| **Discovery Feed** | Intelligence feed for unlisted macro-assets (exchanges, skyscrapers, casinos) |
| **Global Ledger** | Consolidated view of all settlements and carbon impact across the platform |
| **Audit Logs** | Tamper-proof activity log with SHA-256 integrity hashes |

---

## SECURITY LAYERS

### Authentication

- **Email/Password login** with encrypted password storage
- **Google Single Sign-On** for seamless institutional access
- **JWT tokens** stored as secure, httpOnly cookies (not accessible to JavaScript)

### Role-Based Access Control (4 Tiers)

| Role | Access Level |
|---|---|
| **Founder** | Full system override — all settings, all data, all actions |
| **Admin** | Full platform management — user management, settlements, discovery |
| **Sovereign Agent** | Field verification, submission approval, telemetry access |
| **Client Owner** | Submit assets, view own submissions only |

### Protocol Security (for API/Field App Communication)

- **Timing-safe key validation** — prevents brute-force timing attacks
- **300-second timestamp window** — requests outside this window are rejected
- **Nonce deduplication** — every request must have a unique identifier; replays are blocked

---

## BLOCKCHAIN ANCHORING

Bedrock ESG anchors verification proofs to **three independent blockchains**:

| Chain | Purpose | Status |
|---|---|---|
| **Solana** (Devnet) | Notary memo anchoring — immutable timestamp proof of every settlement | Active |
| **Hedera** (HCS) | Hashgraph Consensus Service — tamper-proof submission records | Active |
| **Polygon** (ERC-1155) | Token minting — tradeable carbon credit tokens | Active |

### EXITZ Token Ecosystem (Solana Mainnet)

| Token | Purpose |
|---|---|
| **EXITZ** (base) | Core platform token (supply: 2) |
| **EXITZ-C** (Classic Vehicles) | Mobile asset verification (supply: 1) |
| **EXITZ-A** (Fine Art) | Art asset verification (supply: 1) |

---

## THE DISCOVERY PIPELINE

Bedrock ESG maintains an intelligence feed of **macro-assets** — large-scale properties and institutions that represent significant verification opportunities:

- **5 Global Exchanges:** NYSE, NASDAQ, LSE, CME, Eurex
- **4 Iconic Skyscrapers:** Burj Khalifa, Taipei 101, One World Trade, Shanghai Tower
- **3 Major Casinos:** MGM Grand, The Venetian Macao, Marina Bay Sands

Each asset carries an estimated value and a calculated **70% sovereign share**. Assets start in *Pending Sovereign Review* and must be explicitly approved by a Founder or Admin before settlement.

---

## THE PURGE GATE

The Admin Panel includes a **Network Purge Console** — a destructive cleanup tool protected by multiple safety layers:

1. **Role gate** — Only Founders and Admins can access
2. **Preview scan** — Shows exactly what would be deleted before any action
3. **Typed confirmation** — The operator must type the exact word "PURGE" into a text field
4. **Modal confirmation** — A final warning dialog before execution

This ensures no accidental data destruction.

---

## KNOWN FACILITY ZONES

The platform has four registered physical facility zones used for GPS verification:

| Zone | Location | Radius |
|---|---|---|
| **Sovereign Primary** | Las Vegas, Nevada | 50 km |
| **Property Industrial** | Houston, Texas | 75 km |
| **Logistics Hub** | Ontario, California | 40 km |
| **Metals Recovery** | Pittsburgh, Pennsylvania | 60 km |

Field operators submitting data must be physically within these zones for their submissions to be accepted.

---

## EMISSION SCIENCE

Carbon calculations are grounded in two internationally recognized databases:

- **ICE Database v4.1** (University of Bath) — 25 material emission factors
- **Ecoinvent v3.10.1** (Swiss Centre for Life Cycle Inventories) — 15 process factors

A **60% biogenic variance correction** is applied for US and Brazilian markets to account for regional differences in energy grids and material sourcing.

---

## THE HUM LISTENER

The platform monitors real-time energy market activity through the **HUM Dynamic Listener**:

- **Baseline:** 12.6 MW monitoring threshold
- **Sources:** Major exchange trading windows (NYSE, NASDAQ, LSE, CME, Eurex)
- **Trigger:** When energy market shifts exceed 5%, the system automatically anchors a verification memo to the Solana blockchain

This creates an independent, market-driven verification cadence tied to real economic activity.

---

## PROJECT TIMELINE

| Version | Date | Milestone |
|---|---|---|
| v1.0 | — | Scrapnet 2.0 — Asphalt RAP calculator |
| v2.0 | — | Bedrock ESG rebrand — Biochar + Metal + Vault + Blockchain |
| v2.2 | May 2026 | Settlement label rebrand (Zero Greed), Precious Metals VAL formula |
| v2.3 | May 2026 | Macro-asset discovery pipeline, cockpit ticker (superseded) |
| v2.4 | June 2026 | **Trinity Protocol** — RBAC, Google SSO, Audit Logs, Aethexer v1 protocol, Sentinel Engine, Forensic Ingest, Telemetry Ingest, Admin Panel, SPEXTER sensor extension, Haversine boundary enforcement |

---

## KEY CONTACTS

| Role | Identity |
|---|---|
| **Founder / Architect** | Kato (Zer0) |
| **System Identity** | Aethexer Notary Node |
| **Admin Email** | idecade8@gmail.com |
| **Platform** | [bedrockesg.com](https://bedrockesg.com) |

---

*Bedrock ESG — Institutional Carbon Verification for the Circular Economy*
*"Seed to Sale Chain of Custody" — Every gram verified, every dollar split fairly.*
