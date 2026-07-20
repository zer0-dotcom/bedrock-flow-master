# Bedrock ESG — Project Bible v2.4

**Prepared for**: Partners, Investors, and Advisors  
**Version**: 2.4 — Trinity Protocol Upgrade  
**Date**: June 2026  
**Status**: Live at bedrockesg.com  
**Tag**: BT-C9C4C5  

---

## What Bedrock ESG Does

Bedrock ESG is an industrial-grade platform that verifies and settles real-world asset value tied to environmental, social, and governance outcomes. It transforms physical materials, real estate transactions, resource recovery, and large-scale infrastructure into independently verified, blockchain-anchored records.

The platform serves asset holders, institutional partners, and field operators who need auditable proof that value creation is genuine, measurable, and compliant.

Bedrock ESG currently supports carbon verification for asphalt recycling, biochar carbon dioxide removal, metal recovery across ten metal types, business document processing with AI-powered forensic parsing, sovereign certificate generation, three-dimensional spatial scanning, a dynamic market frequency listener for real-time baseline calibration, a formal discovery interface for asset valuation intelligence, and a complete audit trail with role-based access governance.

---

## What Aethexer Does

Aethexer is the protocol layer that governs how information enters, is validated, and exits the Bedrock ESG system. It functions as both the security perimeter and the verification engine.

When data arrives — whether from a field operator scanning materials, a property transaction, a metals custody report, or a macro-asset telemetry feed — Aethexer performs three checks before anything is accepted:

**Identity Verification.** The system confirms the sender holds valid credentials using a dual-key architecture with strict timing controls. Two independent keys are supported — one for server-to-server communication, one for mobile and edge devices. Every request must arrive within a five-minute window of the server clock, and every request carries a single-use nonce token that prevents replay attacks. Consumed nonces are stored and automatically cleaned after twenty-four hours.

**Forensic Scoring.** An automated engine called the Sentinel evaluates every submission across three weighted dimensions — document integrity at forty percent, data extraction quality at thirty-five percent, and spatial coherence at twenty-five percent. Each dimension must meet its individual threshold before the system will proceed. The composite score determines which of seven possible verdicts the submission receives.

**Immutable Anchoring.** Once verified, a permanent record is written to the Solana blockchain on the Mainnet network. This creates an independent, tamper-proof audit trail that anyone can verify using a public explorer. The signing identity is institutional — labeled as the Aethexer Notary Node. No personal names appear on chain.

---

## What Version 2.4 Introduces

The v2.4 Trinity Protocol Upgrade adds three foundational governance capabilities to the platform: role-based access control, a permanent audit trail, and a live streaming data feed. Together, these form the governance trinity — who can do what, what was done, and what is happening now.

These are not incremental features. They represent the structural maturation of Bedrock ESG from a verification platform into an institutionally auditable governance system. Every action is now permissioned, every permissioned action is now logged, and every logged event can be observed in real time.

Version 2.4 also introduces the Discovery Interface — a dedicated intelligence dashboard for macro-asset valuation, risk classification, and portfolio analysis.

---

## The Settlement Model

Every unit of value that moves through Bedrock ESG is divided at the point of settlement using a fixed ratio. This is not a suggestion — it is enforced by the system at the code level.

**70% — Asset Sovereign.** The majority of value flows directly to the verified asset holder. Whether that is a recycling operator, a property owner, a metals custodian, or the operator of a skyscraper, the entity that owns the underlying asset receives seventy percent.

**20% — Platform Processor.** Twenty percent sustains the infrastructure that makes verification possible. This covers the technology platform, the verification engine, node maintenance, and operational continuity.

**10% — Public Resilience.** Ten percent is allocated to public benefit. This is a unified block — it is not subdivided into fixed categories. Routing decisions are made dynamically based on the asset class and context, ensuring the funds serve the most appropriate community purpose.

The system includes a compliance mechanism called the Zero Greed Policy. If any transaction attempts to reduce the Public Resilience allocation below ten percent, the settlement is flagged and held until the correct ratio is restored. No exceptions.

---

## Role-Based Access Control

Version 2.4 introduces a formal four-tier access hierarchy that governs who can perform which actions within the platform. Every user is assigned exactly one role, and that role determines their permissions across the entire system.

**Administrator.** The highest authority within the platform. Administrators can manage all users, review and settle any submission, access the full audit trail, configure system parameters, and override holds. This role is reserved for platform operators.

**Founder.** A senior governance role with broad operational authority. Founders can review and settle submissions, manage client relationships, access audit records, and oversee the discovery dashboard. They cannot modify system configuration or manage administrator accounts.

**Sovereign Agent.** An operational role for field verification and asset management. Sovereign Agents can submit materials for verification, review their own submissions, access the discovery interface for assets under their purview, and view audit records relevant to their operations.

**Client Owner.** The entry-level role for asset holders entering the platform. Client Owners can submit documents and materials, track their own submissions through the verification pipeline, and view their settlement history. They cannot access administrative functions, the audit trail, or the discovery dashboard.

The role hierarchy is strictly enforced. A user at any level can perform all actions available to roles below them, but never actions reserved for roles above. The system evaluates permissions at every access point — not just at login, but at every individual operation. If a user's role does not include the required permission, the request is rejected before any data is accessed.

Nineteen discrete permissions are defined across the platform, covering submission management, settlement operations, user administration, audit access, and system configuration. These permissions are grouped by role and enforced consistently across all interfaces and programmatic endpoints.

---

## The Audit Trail

Every significant action taken within Bedrock ESG is now permanently recorded in an internal audit log. This is separate from the blockchain anchor — while the blockchain records verified outcomes for public transparency, the audit trail records internal operations for institutional accountability.

When a submission is settled, when a verdict is rendered, when a user accesses sensitive data, or when a system configuration changes, the audit trail captures who performed the action, what action was taken, what entity was affected, and the precise timestamp.

The audit log is append-only. Records cannot be modified or deleted after creation. This ensures that the internal operational history of the platform is as tamper-resistant as the blockchain records it produces.

Administrators and Founders can access the full audit trail through a dedicated interface. The trail supports filtering by action type, by user, and by time range — enabling rapid investigation when questions arise about how a particular decision was made or who authorized a specific settlement.

The audit pipeline is wired directly into the settlement process. When an operator settles a submission, the audit system automatically records the action, the operator's identity, the submission identifier, and the timestamp — all without requiring any manual logging step. This ensures complete coverage with zero operator burden.

---

## The Seven Sentinel Verdicts

Every submission that enters Bedrock ESG passes through a seven-tier evaluation system. This is not a binary pass/fail — it is a graduated scale that determines how each submission is handled. Version 2.4 formalizes all seven verdicts as first-class elements of the platform schema.

**Auto-Approved.** Submissions scoring above ninety-five percent with zero failures proceed to settlement without delay.

**Pending Sovereign Review.** Submissions scoring between seventy-five and ninety-four percent with no more than one minor issue are routed to a manual review queue for sovereign oversight.

**Pending Authorization.** Those in the sixty-five to seventy-four percent range enter an authorization hold, where additional verification is gathered before proceeding.

**Sovereign Hold.** A manual trigger that places a perimeter flag on any submission, regardless of score.

**Escrow Review.** Condition-based holds that pause settlement until specific criteria are met.

**Pending Platform Review.** Structural issues that require infrastructure validation before proceeding.

**Rejected.** Submissions that fall below sixty-five percent or have two or more failures are rejected outright. No settlement occurs.

The composite score is calculated by weighting document integrity at forty percent, AI extraction quality at thirty-five percent, and spatial correlation at twenty-five percent. Each dimension has its own threshold — ninety-five percent for document integrity, seventy-five percent for AI confidence, and seventy-five percent for spatial coherence.

---

## The Live Streaming Ticker

The cockpit dashboard features a real-time streaming data feed at the top of the interface. Version 2.4 upgrades this from a polling-based system to a true server-sent event stream, meaning data arrives continuously without the operator needing to refresh or wait for periodic updates.

The ticker displays all twelve tracked assets using canonical institutional identifiers:

**Global Exchanges** — NYSE-01, NSDQ-01, LSE-01, CME-01, EURX-01. These represent the New York Stock Exchange, NASDAQ, London Stock Exchange, Chicago Mercantile Exchange, and Eurex respectively.

**Vertical Real Estate** — BURJ-DXB-001, TPE-101-001, WTC-NYC-001, SHT-PVG-001. These represent the Burj Khalifa in Dubai, Taipei 101, One World Trade Center in New York, and the Shanghai Tower.

**Casino Complexes** — MGM-LAS-001, VEN-MAC-001, MBS-SIN-001. These represent the MGM Grand in Las Vegas, The Venetian in Macau, and Marina Bay Sands in Singapore.

Each asset streams its current reading, trend direction, percentage change, and verification verdict badge. Verdict badges are color-coded — green for auto-approved, amber for pending review states, and red for rejected. A flash delta animation highlights significant movements as they occur.

The stream updates every three to five seconds. A dedicated endpoint pushes events to the cockpit using the server-sent events protocol, which maintains a persistent connection and delivers data the instant it becomes available. The stream also carries periodic HUM anchor events — markers from the Digital Hum baseline monitor that tie market activity to the platform's seismic frequency tracking.

Filter controls allow the operator to isolate specific categories — all assets, exchanges only, skyscrapers only, or casinos only.

---

## The Discovery Interface

Version 2.4 introduces a dedicated Discovery dashboard accessible from the main navigation. This interface provides institutional-grade intelligence on macro-asset opportunities across the platform's coverage universe.

The Discovery dashboard presents asset opportunities organized by valuation tier:

**Tier I — Mega.** Assets with estimated valuations exceeding ten billion dollars. These represent the largest and most significant structures in the platform's coverage — flagship skyscrapers, major exchange infrastructure, and premier entertainment complexes.

**Tier II — Major.** Assets valued between one billion and ten billion dollars. This tier covers significant commercial properties, regional exchange facilities, and large-scale entertainment venues.

**Tier III — Mid-Market.** Assets valued between one hundred million and one billion dollars. Industrial logistics centers, regional commercial towers, and specialized facilities.

**Tier IV — Emerging.** Assets valued below one hundred million dollars. Early-stage opportunities, smaller commercial properties, and assets entering the verification pipeline for the first time.

Each asset card displays the asset name, its sub-classification (Exchange, Skyscraper, Casino Complex, or Industrial Logistics), the discovery tier, estimated valuation, carbon intensity metrics, and current verification status.

The interface supports filtering by asset sub-class and search by asset name, enabling rapid identification of specific opportunities. Summary statistics at the top of the dashboard show the total number of discovery assets, aggregate portfolio valuation, and the count of assets that have achieved verified status.

The Discovery dashboard is accessible to Administrators, Founders, and Sovereign Agents. Client Owners do not have access to the discovery pipeline — their interface is focused on their own submissions and settlement history.

---

## The Five Asset Classes

Bedrock ESG handles five distinct categories of real-world assets. Each follows the same settlement model but carries its own verification requirements and industry context.

### Variant A — Sovereign Skin

Thermodynamic and kinetic materials — primarily asphalt recycling, surface materials, and circular construction inputs. When reclaimed asphalt pavement replaces virgin materials, the carbon savings are calculated using established lifecycle assessment formulas and verified through the platform.

### Variant B — Commercial and Industrial Property

This is the broadest asset class, covering commercial and industrial real estate along with large-scale infrastructure. The platform quantifies the environmental efficiencies generated through digital transactions, reduced logistics, and property improvements.

Variant B supports four distinct sub-classifications, formally defined in the v2.4 schema:

- **Exchange** — Global financial exchanges and trading infrastructure, including the NYSE, NASDAQ, London Stock Exchange, CME, and Eurex.

- **Skyscraper** — Vertical real estate and high-rise commercial towers, including the Burj Khalifa, Taipei 101, One World Trade Center, and the Shanghai Tower. These assets carry telemetry parameters for chiller exhaust temperature, mechanical damper load, and spatial scan data.

- **Casino Complex** — Entertainment and gaming mega-structures, including the MGM Grand, The Venetian Macau, and Marina Bay Sands. These assets share the same telemetry and verification pipeline as vertical real estate.

- **Industrial Logistics** — Warehouses, distribution centers, and factory complexes. This was the original Variant B scope and continues to operate as before.

All four sub-classifications route through the same settlement model and verification engine. The distinction is enforced at the schema level for accurate reporting, discovery tiering, and portfolio analysis.

### Variant C — Residential Property

Single-family homes, multi-family units, condominiums, and rental properties. The same efficiency quantification applies, with additional provisions for tenant participation and property hardening initiatives.

### Variant D — Physical Commodities

Fiat currency, commodity materials, and tangible goods that pass through destruction or transformation processes. The platform calculates the carbon avoided when materials are diverted from high-impact pathways.

### Variant E — Precious Metals (Custodial)

Gold, silver, and platinum entering a custodial verification pipeline. The Verified Asset Value is calculated using a specific formula: the spot price at the time of ingest, multiplied by weight and purity, minus any refinery discount. Assay certification status is tracked at every stage — from unassayed through pending to certified.

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

The macro-asset validation engine validates incoming telemetry data against strict schema definitions before it enters the verification pipeline.

For Variant B macro-assets — exchanges, skyscrapers, casinos, and logistics centers — the validator accepts optional runtime parameters including chiller exhaust temperature, square footage volume, mechanical damper load in kilowatts, and a spatial data envelope containing geometry coordinates, scan format, mesh density, and location anchor.

Every macro-asset enters the pipeline with an initial verdict of Pending Sovereign Review. Only after passing through the full Sentinel scoring process can an asset achieve Auto-Approved status and trigger settlement.

---

## The Field Agent Network

Bedrock ESG supports a network of field agents who verify physical operations on the ground. Agents register through an invitation-based system and operate under a review-and-approval workflow.

Once approved, agents can register farmers, submit verification observations, and process items through a one-tap verification queue. The queue displays pending biochar batches and recycling logs, with approval or rejection actions that trigger blockchain attestation.

---

## The HUM Listener

The platform monitors a dynamic market frequency baseline calibrated at 12.6 megawatts, representing 74,088 tonnes of CO₂ equivalent per day in digital infrastructure emissions. This listener tracks activity windows across global exchanges — NYSE and NASDAQ, the London Stock Exchange, and CME and Eurex — and triggers an on-chain memo anchor whenever activity shifts by five percent or more from baseline.

Stationary assets in the EXITZ token ecosystem tie their integrity verification to this seismic baseline, while mobile assets use VIN and odometer-based verification instead.

The HUM anchor events are now integrated into the live streaming ticker, appearing alongside asset price data to provide operators with a unified view of both market activity and infrastructure frequency.

---

## The Protocol Authentication Layer

Bedrock ESG uses a custom token-based authentication system. Upon successful login, the platform issues a signed token that carries the user's identity, role assignment, and session metadata. This token is validated at every request — not just at login.

The role-based access control system reads the user's role directly from their authentication token, ensuring that permission checks are instantaneous and do not require additional database queries during normal operations. If a token is missing, expired, or tampered with, access is denied immediately.

This architecture means that the platform's security posture is consistent regardless of how it is accessed — whether through the cockpit dashboard, the submission portal, the discovery interface, or any programmatic endpoint.

---

## Current Build and Deployment Status

Bedrock ESG is live and deployed at **bedrockesg.com**.

The platform is running on the Solana Mainnet. The current codebase carries the v2.4 Trinity Protocol Upgrade, which includes role-based access control, the audit pipeline, server-sent event streaming, and the discovery interface — deployed on top of the v2.3 macro-asset pipeline and the v2.2 mainnet-ready foundation. All staging identifiers have been removed from the codebase. The verification engine, settlement logic, blockchain anchoring, governance controls, and macro-asset ingestion are fully operational.

The cockpit dashboard features a live streaming ticker with canonical asset identifiers, color-coded verdict badges, and integrated HUM anchor events. The Discovery dashboard provides institutional-grade asset intelligence with tiered valuation classification. Every significant platform action is recorded in the append-only audit trail.

---

## Summary

Bedrock ESG combines industrial carbon verification, real-world asset settlement, macro-asset infrastructure monitoring, role-based governance, institutional audit trails, and blockchain-grade auditability into a single platform.

The seventy-twenty-ten settlement model ensures fair value distribution. The seven-tier verification engine ensures quality. The Solana Mainnet anchor ensures permanence. The role-based access hierarchy ensures that every user operates within clearly defined boundaries. The audit trail ensures that every action is accountable. The live streaming ticker ensures that nothing happens without visibility.

Version 2.4 completes the governance trinity: permission, accountability, and transparency. Every record is independently verifiable. Every settlement follows the same rules. Every action is logged. Every asset class — from recycled asphalt to the Burj Khalifa — receives institutional-grade treatment.

---

*Bedrock ESG — v2.4 Trinity Protocol Upgrade*  
*Tag: BT-C9C4C5*
