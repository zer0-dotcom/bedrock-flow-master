# Bedrock ESG — Project Bible v2.3

**Prepared for**: Partners, Investors, and Advisors  
**Version**: 2.3 — Macro-Asset Pipeline Extension  
**Date**: May 2026  
**Status**: Live at bedrockesg.com  
**Tag**: BT-C9C4C5  

---

## What Bedrock ESG Does

Bedrock ESG is an industrial-grade platform that verifies and settles real-world asset value tied to environmental, social, and governance outcomes. It transforms physical materials, real estate transactions, resource recovery, and large-scale infrastructure into independently verified, blockchain-anchored records.

The platform serves asset holders, institutional partners, and field operators who need auditable proof that value creation is genuine, measurable, and compliant.

Bedrock ESG currently supports carbon verification for asphalt recycling, biochar carbon dioxide removal, metal recovery across ten metal types, business document processing with AI-powered forensic parsing, sovereign certificate generation, three-dimensional spatial scanning, and a dynamic market frequency listener for real-time baseline calibration.

---

## What Aethexer Does

Aethexer is the protocol layer that governs how information enters, is validated, and exits the Bedrock ESG system. It functions as both the security perimeter and the verification engine.

When data arrives — whether from a field operator scanning materials, a property transaction, a metals custody report, or a macro-asset telemetry feed — Aethexer performs three checks before anything is accepted:

**Identity Verification.** The system confirms the sender holds valid credentials using a dual-key architecture with strict timing controls. Two independent keys are supported — one for server-to-server communication, one for mobile and edge devices. Every request must arrive within a five-minute window of the server clock, and every request carries a single-use nonce token that prevents replay attacks. Consumed nonces are stored and automatically cleaned after twenty-four hours.

**Forensic Scoring.** An automated engine called the Sentinel evaluates every submission across three weighted dimensions — document integrity at forty percent, data extraction quality at thirty-five percent, and spatial coherence at twenty-five percent. Each dimension must meet its individual threshold before the system will proceed. The composite score determines which of seven possible verdicts the submission receives.

**Immutable Anchoring.** Once verified, a permanent record is written to the Solana blockchain on the Mainnet network. This creates an independent, tamper-proof audit trail that anyone can verify using a public explorer. The signing identity is institutional — labeled as the Aethexer Notary Node. No personal names appear on chain.

---

## The Settlement Model

Every unit of value that moves through Bedrock ESG is divided at the point of settlement using a fixed ratio. This is not a suggestion — it is enforced by the system at the code level.

**70% — Asset Sovereign.** The majority of value flows directly to the verified asset holder. Whether that is a recycling operator, a property owner, a metals custodian, or the operator of a skyscraper, the entity that owns the underlying asset receives seventy percent.

**20% — Platform Processor.** Twenty percent sustains the infrastructure that makes verification possible. This covers the technology platform, the verification engine, node maintenance, and operational continuity.

**10% — Public Resilience.** Ten percent is allocated to public benefit. This is a unified block — it is not subdivided into fixed categories. Routing decisions are made dynamically based on the asset class and context, ensuring the funds serve the most appropriate community purpose.

The system includes a compliance mechanism called the Zero Greed Policy. If any transaction attempts to reduce the Public Resilience allocation below ten percent, the settlement is flagged and held until the correct ratio is restored. No exceptions.

---

## The Five Asset Classes

Bedrock ESG handles five distinct categories of real-world assets. Each follows the same settlement model but carries its own verification requirements and industry context.

### Variant A — Sovereign Skin

Thermodynamic and kinetic materials — primarily asphalt recycling, surface materials, and circular construction inputs. When reclaimed asphalt pavement replaces virgin materials, the carbon savings are calculated using established lifecycle assessment formulas and verified through the platform.

### Variant B — Commercial and Industrial Property

This is the broadest asset class, covering commercial and industrial real estate along with large-scale infrastructure. The platform quantifies the environmental efficiencies generated through digital transactions, reduced logistics, and property improvements.

As of version 2.3, Variant B now supports three distinct sub-classifications:

- **Vertical Real Estate** — skyscrapers and high-rise commercial towers, including structures such as the Burj Khalifa, Taipei 101, One World Trade Center, and the Shanghai Tower. These assets carry telemetry parameters for chiller exhaust temperature, mechanical damper load, and spatial scan data.

- **Casino Complexes** — entertainment and gaming mega-structures, including the MGM Grand in Las Vegas, The Venetian in Macau, and Marina Bay Sands in Singapore. These assets share the same telemetry and verification pipeline as vertical real estate.

- **Industrial Logistics** — warehouses, distribution centers, and factory complexes. This was the original Variant B scope and continues to operate as before.

All three sub-classifications route through the same settlement model and verification engine. The distinction exists at the metadata level for accurate reporting and analysis.

### Variant C — Residential Property

Single-family homes, multi-family units, condominiums, and rental properties. The same efficiency quantification applies, with additional provisions for tenant participation and property hardening initiatives.

### Variant D — Physical Commodities

Fiat currency, commodity materials, and tangible goods that pass through destruction or transformation processes. The platform calculates the carbon avoided when materials are diverted from high-impact pathways.

### Variant E — Precious Metals (Custodial)

Gold, silver, and platinum entering a custodial verification pipeline. The Verified Asset Value is calculated using a specific formula: the spot price at the time of ingest, multiplied by weight and purity, minus any refinery discount. Assay certification status is tracked at every stage — from unassayed through pending to certified.

---

## The Verification Engine

Every submission that enters Bedrock ESG passes through a seven-tier evaluation system. This is not a binary pass/fail — it is a graduated scale that determines how each submission is handled.

**Auto-Approved.** Submissions scoring above ninety-five percent with zero failures proceed to settlement without delay.

**Pending Sovereign Review.** Submissions scoring between seventy-five and ninety-four percent with no more than one minor issue are routed to a manual review queue for sovereign oversight.

**Pending Authorization.** Those in the sixty-five to seventy-four percent range enter an authorization hold, where additional verification is gathered before proceeding.

**Sovereign Hold.** A manual trigger that places a perimeter flag on any submission, regardless of score.

**Escrow Review.** Condition-based holds that pause settlement until specific criteria are met.

**Pending Platform Review.** Structural issues that require infrastructure validation before proceeding.

**Rejected.** Submissions that fall below sixty-five percent or have two or more failures are rejected outright. No settlement occurs.

The composite score is calculated by weighting document integrity at forty percent, AI extraction quality at thirty-five percent, and spatial correlation at twenty-five percent. Each dimension has its own threshold — ninety-five percent for document integrity, seventy-five percent for AI confidence, and seventy-five percent for spatial coherence.

---

## The Live Asset Matrix

Version 2.3 introduces a unified real-time ticker at the top of the Bedrock ESG cockpit dashboard. This ticker displays all tracked assets — global financial exchanges, skyscrapers, and casinos — streaming together in a single view.

The matrix currently tracks twelve seeded assets across three categories: five global exchanges (NYSE, NASDAQ, London Stock Exchange, Chicago Mercantile Exchange, and Eurex), four skyscrapers (Burj Khalifa, Taipei 101, One World Trade Center, and Shanghai Tower), and three casino complexes (MGM Grand, The Venetian Macau, and Marina Bay Sands).

Filter controls allow the operator to isolate specific categories — all assets, exchanges only, skyscrapers only, or casinos only. The default view shows all assets simultaneously. Each asset displays its current reading, trend direction, percentage change, and verification verdict badge.

---

## Blockchain Anchoring

Bedrock ESG writes permanent records to the Solana blockchain using the Mainnet network. Every anchor is a live, publicly verifiable transaction.

The system uses the Solana Memo Program to embed structured data into each transaction. This data includes the system version, the type of verification, the entity involved, a cryptographic hash of the underlying data, optional carbon tonnage and valuation figures, a backtrace identifier linking to the originating request, and a timestamp.

The signing identity is institutional — the Aethexer Notary Node operating from Sentinel Node-01. A production safety mechanism ensures that if the signing key is misconfigured or missing, the system halts anchoring entirely rather than writing invalid records. The expected signing address is publicly known and can be independently verified.

---

## The EXITZ Token Ecosystem

Bedrock ESG maintains a token presence on the Solana Mainnet through the EXITZ token family. These are Token-2022 standard tokens with on-chain metadata and forensic memo anchors linking back to the verification platform.

The ecosystem includes three tokens:

- **EXITZ** — the base ecosystem token with a supply of two units.
- **EXITZ-C** — specialized for Classic Vehicles, with a supply of one unit. Uses VIN and odometer-based integrity verification.
- **EXITZ-A** — specialized for Fine Art, with a supply of one unit. Uses VIN and odometer-based integrity verification.

Mobile assets use a VIN and odometer integrity model. Stationary assets tie into the platform's seismic baseline monitoring through the HUM Listener.

---

## The Carbon Engines

Bedrock ESG operates three independent carbon calculation engines, each covering a different material domain.

**Asphalt Engine.** Calculates carbon savings from reclaimed asphalt pavement using Eurobitume lifecycle assessment formulas covering the A1 through A3 stages. The baseline for virgin asphalt is sixty kilograms of CO₂ per tonne, with a reduction of 0.4 kilograms per tonne for each percentage point of RAP used.

**Biochar Engine.** Tracks carbon dioxide removal through biochar production. Batches are verified through a dual-chain attestation process using Hedera Guardian for consensus submission and Polygon ERC-1155 for token minting. Stability classes are tracked from low through high permanence.

**Metal Recovery Engine.** Calculates emissions avoided through metal recycling across ten supported metal types — steel, aluminum, copper, brass, lead, zinc, stainless steel, cast iron, titanium, and nickel. Emission factors are drawn from the ICE Database.

All three engines feed into a unified Total Carbon Impact counter that aggregates verified impact across the entire platform.

---

## The Emission Factor Database

The platform maintains a curated database of forty emission factors drawn from two authoritative sources — twenty-five from the ICE Database version 4.1 and fifteen from Ecoinvent version 3.10.1. A sixty percent biogenic variance correction is active for United States and Brazilian markets. Grid carbon intensity values are maintained for four regions: the United States at 0.419, Brazil at 0.082, the European Union at 0.253, and Great Britain at 0.207 kilograms of CO₂ equivalent per kilowatt-hour.

---

## The Spatial Heritage Parser

Bedrock ESG can ingest three-dimensional scan data in PLY format (both ASCII and binary little-endian) and Gaussian Splat format. The system detects spherical harmonic coefficients, opacity, scale, and rotation parameters to identify Gaussian Splat data automatically.

The processing pipeline converts scanned volume into material mass estimates using known densities — 2.4 tonnes per cubic meter for asphalt, 1.6 for aggregate, and 2.3 for concrete — and then converts those mass figures into carbon estimates.

---

## The Business Submission Portal

The submission portal provides a structured intake process for business clients across three tracks:

- **Track A — Materials.** Asphalt, concrete, and metal submissions processed against ICE version 4.1 coefficients.
- **Track B — 179D Energy.** Real estate energy improvements processed for IRS Form 7205 compliance.
- **Track C — Biochar CDR.** Carbon dioxide removal batches linked to CDR credit issuance.

Submissions enter through a drag-and-drop interface supporting PDF, CSV, XLSX, DOCX, and PLY file formats. An AI-powered forensic parser extracts structured data from uploaded documents. Every file is validated at the byte level — the system checks magic bytes against declared file types and rejects mismatches immediately.

Once parsed and scored by the Sentinel engine, approved submissions proceed through the settlement model and receive a sovereign certificate with the Solana transaction hash, backtrace identifier, and sign-off block.

---

## The Macro-Asset Validation Engine

Version 2.3 introduces a formal validation layer for macro-asset ingestion. This engine validates incoming telemetry data against strict schema definitions before it enters the verification pipeline.

For Variant B macro-assets — skyscrapers, casinos, and logistics centers — the validator accepts optional runtime parameters including chiller exhaust temperature, square footage volume, mechanical damper load in kilowatts, and a spatial data envelope containing geometry coordinates, scan format, mesh density, and location anchor.

Every macro-asset enters the pipeline with an initial verdict of Pending Sovereign Review. Only after passing through the full Sentinel scoring process can an asset achieve Auto-Approved status and trigger settlement.

---

## The Field Agent Network

Bedrock ESG supports a network of field agents who verify physical operations on the ground. Agents register through an invitation-based system and operate under a review-and-approval workflow.

Once approved, agents can register farmers, submit verification observations, and process items through a one-tap verification queue. The queue displays pending biochar batches and recycling logs, with approval or rejection actions that trigger blockchain attestation.

---

## The HUM Listener

The platform monitors a dynamic market frequency baseline calibrated at 12.6 megawatts. This listener tracks activity windows across global exchanges — NYSE and NASDAQ, the London Stock Exchange, and CME and Eurex — and triggers an on-chain memo anchor whenever activity shifts by five percent or more from baseline.

Stationary assets in the EXITZ token ecosystem tie their integrity verification to this seismic baseline, while mobile assets use VIN and odometer-based verification instead.

---

## Current Build and Deployment Status

Bedrock ESG is live and deployed at **bedrockesg.com**.

The platform is running on the Solana Mainnet. The current codebase is tagged at **v2.2-mainnet-ready** with the v2.3 macro-asset pipeline extension deployed on top. All staging identifiers have been removed from the codebase. The verification engine, settlement logic, blockchain anchoring, and macro-asset ingestion are fully operational.

The cockpit dashboard now features a unified live asset matrix ticker at the top of the interface, showing global exchanges and macro-structures streaming together with real-time trend data and verdict badges.

---

## Summary

Bedrock ESG combines industrial carbon verification, real-world asset settlement, macro-asset infrastructure monitoring, and blockchain-grade auditability into a single platform.

The seventy-twenty-ten settlement model ensures fair value distribution. The seven-tier verification engine ensures quality. The Solana Mainnet anchor ensures permanence. The v2.3 macro-asset pipeline extends the platform's reach into skyscrapers, casino complexes, and large-scale commercial infrastructure.

Every record is independently verifiable. Every settlement follows the same rules. Every asset class — from recycled asphalt to the Burj Khalifa — receives institutional-grade treatment.

---

*Bedrock ESG — v2.3 Macro-Asset Pipeline Extension*  
*Tag: BT-C9C4C5*
