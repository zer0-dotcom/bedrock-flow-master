# BEDROCK ESG
## Sovereign Environmental Verification Platform

**Prepared by ZerO** | April 2026 | bedrockesg.com

---

## What Is Bedrock ESG?

Bedrock ESG is a sovereign environmental verification platform that brings institutional-grade carbon accounting, environmental credit issuance, and regulatory compliance to industries that have traditionally been left out of the sustainability conversation — construction, agriculture, and metals recovery.

Unlike conventional ESG platforms that rely on self-reported data and manual audits, Bedrock ESG verifies every environmental claim through a combination of forensic AI analysis and blockchain attestation. When a carbon credit is issued on Bedrock ESG, it carries a cryptographic proof that can be independently verified on the Solana blockchain — permanently, transparently, and without requiring trust in any single institution.

The platform is live at **bedrockesg.com** and is built to serve as the verification backbone for organizations operating across the Circular Trifecta: Asphalt, Biochar, and Metal Recovery.

---

## The Problem We Solve

Environmental credits suffer from a credibility crisis. Carbon offsets are frequently double-counted, verification is slow and expensive, and the industries generating the most tangible environmental benefit — recycling asphalt, producing biochar, recovering metals — lack the tools to prove their impact in a way that satisfies regulators, investors, and trading partners.

Bedrock ESG addresses this by providing:

- **Automated verification** — AI-powered forensic analysis of submitted environmental documents, eliminating the bottleneck of manual review
- **Immutable proof** — every verified claim is written to the Solana blockchain as a permanent, tamper-proof record
- **Institutional compliance** — calculations follow ISO 14040 (Life Cycle Assessment), ISO 14064-2 (GHG quantification), and are built on the ICE v4.1 and Ecoinvent v3.10.1 emission factor databases
- **Fair value distribution** — a transparent 70/20/10 settlement model ensures platform sustainability, submitter incentives, and community reserves

---

## Platform Capabilities

### 1. Asphalt LCA Calculator

A production-grade Life Cycle Assessment calculator built on the Eurobitume A1–A3 framework. It calculates the carbon footprint of asphalt production mixes, accounting for material composition, Reclaimed Asphalt Pavement (RAP) percentages, transport distances, and mix type modifiers.

The calculator draws from two internationally recognized emission factor databases:

- **ICE v4.1** (University of Bath) — 25 material-specific emission factors covering aggregates, bitumen, cement, steel, and more
- **Ecoinvent v3.10.1** — 15 supplemental factors including RAP, crumb rubber modifier, and warm-mix additives

A 60% biogenic correction is applied to biochar-origin materials, reflecting the carbon sequestration inherent in pyrolysis-derived inputs.

Every calculation result can be attested on the Solana blockchain, creating a permanent record of the environmental assessment.

### 2. Biochar Carbon Dioxide Removal (CDR) Engine

Manages the complete lifecycle of biochar production — from feedstock sourcing through pyrolysis to carbon credit issuance. Each batch is tracked with full metadata: feedstock type, pyrolysis temperature, carbon content, stability classification, and permanence metrics.

Verified batches receive dual-chain attestation on both Hedera Hashgraph (for consensus-grade logging) and Polygon (for tradeable ERC-1155 token issuance). This means every biochar CDR credit exists simultaneously as an immutable record and a transferable digital asset.

The engine integrates with the Farmer Registry, allowing agricultural partners to receive proper attribution and credit for their feedstock contributions.

### 3. Metal Recovery Tracker

Calculates avoided CO2 emissions from scrap metal recovery operations. Supports multiple metal categories — steel, aluminum, copper, brass, stainless steel, and mixed metals — each with industry-standard emission factors representing the difference between virgin production and recycled material.

Results include environmental equivalencies (trees planted, car miles avoided) for accessible impact communication, along with blockchain-verifiable attestation.

### 4. Digital Vault

A secure document storage and verification system with four specialized capabilities:

- **Vault Nodes** — Distributed verification infrastructure for decentralized document validation
- **Logistics Audit** — Supply chain document verification with full chain-of-custody tracking
- **Destruction Proof** — Certified destruction records for materials requiring verified disposal
- **AI Compliance Check** — Large language model-powered document analysis that flags compliance issues and generates recommendations

### 5. Universal Ledger

The master environmental accounting ledger that aggregates data from all platform modules into a single, auditable record. Supports 16 entry types across three blockchain networks (Solana, Hedera, Polygon), with real-time balance tracking, trade settlement capabilities, and ISO-compliant date precision.

The Universal Ledger serves as the single source of truth for all environmental transactions on the platform, with every entry carrying a cross-chain reference for independent verification.

### 6. Business Submission Portal — "The Corporate Gatehouse"

The primary intake mechanism for corporate environmental data. Businesses submit documents through a guided, multi-track interface covering five environmental categories:

- **Track A** — Materials & Embodied Carbon
- **Track B** — Energy & 179D Compliance
- **Track C** — Biochar CDR
- **Track D** — Water & Waste
- **Track E** — Social Impact

Once submitted, documents undergo AI Forensic Analysis — a large language model examines each document to extract environmental claims, verify data consistency, identify red flags, and calculate verified carbon impact.

Verified submissions proceed through the **Smart Settlement Engine**, which applies the 70/20/10 value distribution:

| Share | Recipient | Purpose |
|-------|-----------|----------|
| 70% | Platform Credit | Reinvested into platform operations and environmental infrastructure |
| 20% | Submitter Incentive | Direct value returned to the submitting business |
| 10% | Community Reserve | Allocated to public resilience and community environmental programs |

Settled submissions receive a **Sovereign Certificate** — a professionally formatted PDF document containing the full verification record, settlement details, and Solana blockchain attestation proof.

### 7. Aethex Protocol / EXITZ Token Integration

The Aethex Protocol (detailed in its own companion document) provides the cryptographic security layer and carbon displacement token system. EXITZ tokens represent verified carbon displacement credits generated when digital processes replace physical transport — see the Aethexer/EXITZ Executive Brief for full details.

---

## Supporting Infrastructure

### Farmer Registry
Manages agricultural partner profiles, tracks contributions to biochar feedstock supply, and attributes carbon credits to individual farmers. Supports agent-mediated registration for field operations.

### Agent Portal
A dedicated interface for verification agents who review and approve environmental submissions. Includes a one-tap verification queue with batch processing capabilities and automated blockchain attestation upon approval.

### Impact Dashboard
Aggregates environmental impact data across all modules into a unified reporting view. Provides the metrics and visualizations needed for ESG disclosure, investor reporting, and regulatory compliance.

### Compliance Framework
Built-in support for international compliance requirements including FATF Travel Rule exchange data, jurisdictional VAT/tax rate tracking, and cross-border transaction documentation.

### HUM Telemetry
A dynamic energy grid baseline monitoring service that tracks real-time power consumption patterns. The current baseline of 12.6 MW (updated from a legacy 18.0 MW figure) provides the reference point for calculating carbon displacement from energy efficiency improvements. A 5% shift threshold triggers automatic recalibration to maintain accuracy.

---

## Blockchain Architecture

Bedrock ESG operates across three blockchain networks, each serving a distinct purpose:

### Solana — Primary Attestation Chain
All environmental verifications are recorded as permanent memo transactions on the Solana blockchain. The platform operates through a single sovereign identity — the **Aethexer Sentinel** — which signs every attestation. This creates an unbroken chain of provenance from raw environmental data to verified credit.

The Aethexer Sentinel address is: **9tsq8qB4P9uPRSHrjXLaDQJd93nuo4wEEtkR1tAJRAQ3**

Every attestation carries the backtrace identifier **BT-C9C4C5**, linking it to the Bedrock ESG audit trail.

### Hedera Hashgraph — Consensus Logging
Hedera's Hashgraph Consensus Service (HCS) provides an additional layer of immutable, time-ordered logging. This is particularly valuable for biochar CDR batches where regulatory frameworks may require consensus-grade timestamp verification.

### Polygon — Tradeable Environmental Assets
Verified environmental credits are tokenized as ERC-1155 multi-token assets on Polygon, making them transferable, tradeable, and composable with the broader DeFi ecosystem. This bridge between verified environmental impact and digital asset markets is critical for credit liquidity.

---

## The EXITZ Token

EXITZ is the native carbon displacement token of the Bedrock ESG ecosystem, built on Solana's Token-2022 standard. Each EXITZ token represents one unit of verified carbon displacement — the measurable environmental benefit created when a digital process replaces a physical one.

- **Token Standard:** SPL Token-2022 (Solana)
- **Decimals:** 0 (whole units only — each token represents a discrete displacement event)
- **Mint Address:** 44SrHT9Qwyz2jiiJkRF1zHKF2NFTgTC8m6ubPTb5qJBJ
- **Mint Authority:** Aethexer Sentinel (sole authority to issue new tokens)
- **On-chain Metadata:** Includes backtrace ID, engine reference, protocol name, and ISO standard compliance

The genesis emission of 1.0 EXITZ has been confirmed on-chain, establishing the token's existence and the platform's minting capability.

---

## Emission Factor Databases

Bedrock ESG's calculations are grounded in two internationally recognized emission factor databases:

### ICE v4.1 — Inventory of Carbon and Energy (University of Bath)
25 material-specific emission factors covering the construction industry's most common inputs:

| Material Category | Factor (kg CO2e/kg) | Notes |
|-------------------|--------------------:|-------|
| General Aggregate | 0.00747 | Crushed stone, gravel |
| Bitumen | 0.490 | Petroleum-derived binder |
| Portland Cement | 0.912 | Primary cementitious material |
| Steel (Structural) | 1.460 | Virgin steel production |
| Recycled Steel | 0.470 | 68% reduction vs. virgin |
| Aluminum | 8.240 | Highest-impact common metal |
| Recycled Aluminum | 0.840 | 90% reduction vs. virgin |

*Additional factors cover limestone, sand, fly ash, slag, polymers, fibers, pigments, lime, calcium carbonate, glass aggregate, recycled concrete, and clay.*

### Ecoinvent v3.10.1
15 supplemental factors focusing on recycled and specialty materials:

| Material Category | Factor (kg CO2e/kg) | Notes |
|-------------------|--------------------:|-------|
| RAP (Reclaimed Asphalt) | 0.00320 | Near-zero burden for recycled content |
| Crumb Rubber Modifier | 0.00850 | Tire-derived recycled material |
| Warm Mix Additive | 0.150 | Enables lower-temperature production |
| Recycled Glass Aggregate | 0.00520 | Post-consumer glass reuse |

*Additional factors cover ground tire rubber, steel slag aggregate, reclaimed concrete, biochar (with 60% biogenic correction), waste plastic modifier, and others.*

---

## User Roles

The platform supports seven distinct user roles, each with tailored access:

| Role | Description |
|------|-------------|
| **Admin** | Full platform governance — all modules, settings, and user management |
| **Sovereign** | Full sovereign operations — blockchain attestation, ledger management |
| **Agent** | Field verification — reviews submissions, registers farmers, processes verification queue |
| **Farmer** | Agricultural operations — biochar batch management, credit tracking, feedstock supply |
| **Business** | Corporate engagement — submission portal access, compliance reporting |
| **Realtor** | Property-related environmental data and reporting |
| **User** | Standard access — calculator, impact dashboard, basic platform features |

---

## Data Architecture

The platform manages 41 distinct data models organized across several functional domains:

- **User & Identity** — User accounts, role-specific profiles, invitation codes
- **Environmental Tracking** — Carbon entries, biochar batches, metal recovery logs, recycling records, farmer credits
- **Verification & Compliance** — Vault nodes, verification records, compliance frameworks, consent management
- **Financial & Trading** — Universal ledger entries, international transactions, travel rule exchanges, portfolio offsets, retired credits
- **Advanced Analytics** — Impact reports, resonance prints, social yield metrics, parametric insurance, vibrational equity scores
- **Submission Pipeline** — Business submissions, uploaded documents, settlement records
- **Blockchain** — Solana audit proofs with transaction signatures and verification metadata

All data is stored in PostgreSQL and accessed through Prisma ORM, ensuring type safety and query optimization.

---

## Design Philosophy

Bedrock ESG uses a **"Deep Space"** design language — a dark, cinematic interface inspired by institutional trading platforms and aerospace control systems. This deliberate aesthetic choice communicates the seriousness and precision of the environmental verification work the platform performs.

The color palette centers on deep blacks and dark blues, accented with emerald green (success and primary actions), cyan (data and information), and amber (attention and warnings). Cards and panels use subtle glassmorphism effects, and data is presented in clean, monospaced typography for precision.

This is not a consumer app — it's a sovereign verification instrument designed to earn the trust of institutional partners, regulators, and investors.

---

## Key Metrics & Differentiators

| Differentiator | Detail |
|---------------|--------|
| Blockchain attestation | Every verified claim carries immutable on-chain proof |
| Three-chain architecture | Solana (attestation) + Hedera (consensus) + Polygon (tradeable assets) |
| AI forensic analysis | Large language model reviews submitted documents for accuracy and fraud detection |
| Institutional emission databases | ICE v4.1 + Ecoinvent v3.10.1 — the same databases used by academic and regulatory bodies |
| Transparent settlement | 70/20/10 split visible to all parties |
| Multi-sector coverage | Asphalt, biochar, metals — the industries doing the real work of decarbonization |
| Sovereign identity | Single cryptographic identity (Aethexer Sentinel) for all platform operations |
| Token-native | EXITZ carbon displacement tokens built on Solana Token-2022 standard |
| Compliance-ready | ISO 14040, ISO 14064-2, FATF Travel Rule support |

---

## How It All Connects

The platform operates as an integrated verification engine:

1. **Data enters** through the Business Submission Portal, calculators, or direct module input
2. **AI analyzes** submitted documents for accuracy, extracting verified environmental claims
3. **Calculations run** against institutional emission factor databases (ICE v4.1, Ecoinvent v3.10.1)
4. **Blockchain attests** every verified result on Solana, with optional Hedera consensus logging
5. **Credits issue** as tradeable ERC-1155 tokens on Polygon or EXITZ tokens on Solana
6. **Settlement distributes** value through the 70/20/10 model
7. **The Universal Ledger records** everything in one auditable, cross-chain accounting system

This end-to-end pipeline means that a piece of raw environmental data — a biochar pyrolysis batch, a metal recovery log, an asphalt mix design — can enter the platform and emerge as a verified, blockchain-attested, tradeable digital asset, with full provenance from source to credit.

---

## Contact & Access

- **Platform:** bedrockesg.com
- **Organization:** ZerO
- **Companion Document:** Aethexer/EXITZ Executive Brief (covers the Universal Truth Layer and carbon displacement token system)

---

*This document is prepared for partner and investor review. It describes the capabilities and architecture of Bedrock ESG as of April 2026. No credentials, private keys, or internal access information are included.*
