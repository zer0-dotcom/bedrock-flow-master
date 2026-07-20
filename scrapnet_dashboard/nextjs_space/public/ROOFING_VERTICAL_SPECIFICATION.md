# Bedrock ESG — Roofing Industry Vertical Specification
## DRAFT v0.1 | May 2026
## Classification: Pre-Build Specification — Phase 2 Deliverable

---

## 1. Executive Summary

This specification defines the integration of the **Roofing Industry Vertical** into the Bedrock ESG platform. The objective is to onboard commercial roofing installations (TPO, EPDM, Metal, and High-Albedo Coatings) as verifiable carbon-offset assets through the Aethexer Protocol.

The core innovation is the **Thermal Load Shedding (TLS)** calculation — a methodology that quantifies the kWh reduction in HVAC demand achieved by high-performance cool roofing systems, converts that reduction into verifiable CO₂e savings, and anchors the proof to Solana via the existing Sovereign Notary.

> **Note:** This vertical does NOT introduce a new token. Verified roofing assets flow through the existing EXITZ tokenization pipeline and the 70/20/10 settlement split.

---

## 2. Regulatory & Standards Foundation

All calculations and thresholds in this specification are grounded in published standards. Bedrock ESG does not invent metrics — it automates the verification of metrics that already have institutional backing.

### 2.1 Applicable Standards

| Standard | Authority | Relevance |
|---|---|---|
| **ASTM C1549-16R22** | ASTM International | Solar reflectance measurement (portable reflectometer, 4 wavelengths) |
| **ASTM E1980** | ASTM International | Solar Reflectance Index (SRI) calculation |
| **ASHRAE 90.1-2022** | ASHRAE | Minimum cool roof requirements: SR ≥ 0.70, TE ≥ 0.75, or SRI ≥ 82 |
| **ENERGY STAR (Legacy)** | EPA | Low-slope: Initial SR ≥ 0.65, 3-year aged SR ≥ 0.50; TE ≥ 0.75 |
| **LEED v4.1 SS Credit** | USGBC | SRI ≥ 78 (low-slope) or ≥ 29 (steep-slope) for 75% of roof area |
| **CRRC-1** | Cool Roof Rating Council | Product rating database and aged-value methodology |
| **Title 24 Part 6** | California Energy Commission | Climate-zone-specific cool roof requirements |

### 2.2 Performance Tiers

Bedrock ESG defines three performance tiers for roofing assets:

| Tier | Solar Reflectance (SR) | Thermal Emittance (TE) | SRI | Classification |
|---|---|---|---|---|
| **Tier 1 — Compliant** | SR ≥ 0.65 | TE ≥ 0.75 | SRI ≥ 78 | Meets ENERGY STAR / LEED baseline |
| **Tier 2 — High-Performance** | SR ≥ 0.80 | TE ≥ 0.85 | SRI ≥ 100 | Exceeds ASHRAE 90.1 by >10% |
| **Tier 3 — Sub-Ambient Radiative** | SR ≥ 0.95 | TE ≥ 0.90 (8–13μm window) | SRI ≥ 120 | Lab-verified radiative cooling membranes |

> **Important:** Tier 3 represents emerging radiative cooling technology (e.g., photonic membranes, meta-material coatings). Gemini's prompt specified SR ≥ 0.97 — this is achievable only with Tier 3 materials and must not be presented as the baseline requirement. The platform must support all three tiers.

---

## 3. Thermal Load Shedding (TLS) Calculation Engine

### 3.1 Core Formula

The TLS calculation determines the annual HVAC energy reduction attributable to a cool roof installation:

```
TLS (kWh/year) = A × CDD × Uf × (1 - SR_new/SR_baseline) × η_HVAC
```

Where:
- **A** = Roof area (m²)
- **CDD** = Cooling Degree Days for the installation's climate zone (ASHRAE data)
- **Uf** = Roof thermal transmittance (W/m²·K) — derived from R-value
- **SR_new** = Solar reflectance of the installed cool roof
- **SR_baseline** = Solar reflectance of the baseline roof (default: 0.10 for dark asphalt shingle, 0.20 for aged membrane)
- **η_HVAC** = HVAC system efficiency factor (COP of cooling system, default: 3.5)

### 3.2 CO₂e Conversion

```
CO₂e Saved (kg/year) = TLS (kWh/year) × Grid Emission Factor (kg CO₂e/kWh)
```

Grid emission factors sourced from EPA eGRID by subregion. Default: **0.386 kg CO₂e/kWh** (US national average 2024).

### 3.3 Negative Watts ($NW) — Definition

"Negative Watts" is a Bedrock ESG proprietary metric, **not** an industry standard. It must always be presented with this context.

```
$NW = TLS (kWh/year) / 8,760 hours
```

This yields the average continuous wattage of cooling load avoided — the "negative" power draw. A roof that avoids 43,800 kWh/year = 5 $NW (5 watts of continuous avoided load).

> **Compliance Note:** $NW is a communication metric for investor/owner comprehension. All regulatory filings and carbon credit calculations must use standard kWh and kg CO₂e units.

---

## 4. Data Input Schema

### 4.1 Material Registration Fields

Fields required for a roofing company to register their materials in the Bedrock ESG asset registry:

| Field | Type | Required | Description |
|---|---|---|---|
| `manufacturerName` | String | ✓ | Material manufacturer |
| `productName` | String | ✓ | Commercial product name |
| `batchId` | String | ✓ | Manufacturer's batch/lot ID |
| `substrateType` | Enum | ✓ | `TPO`, `EPDM`, `METAL_STANDING_SEAM`, `METAL_CORRUGATED`, `SPRAY_COATING`, `PHOTONIC_MEMBRANE` |
| `coatingType` | String | | Coating chemistry (e.g., "Acrylic Elastomeric", "Silicone", "PVDF") |
| `coatingThicknessMils` | Float | | Dry film thickness in mils |
| `rValue` | Float | ✓ | Thermal resistance (ft²·°F·h/BTU) |
| `solarReflectanceInitial` | Float | ✓ | Initial SR per ASTM C1549 (0.00–1.00) |
| `solarReflectanceAged` | Float | | 3-year aged SR per CRRC methodology |
| `thermalEmittance` | Float | ✓ | TE per ASTM C1371 (0.00–1.00) |
| `sriValue` | Float | | Solar Reflectance Index per ASTM E1980 |
| `crrcProductId` | String | | CRRC Rated Product ID (if applicable) |
| `spectralTestReportUrl` | String | | Cloud storage path to spectral test PDF |

### 4.2 Installation Registration Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `installerCompanyName` | String | ✓ | Licensed roofing contractor |
| `installerLicense` | String | ✓ | State contractor license number |
| `installationDate` | DateTime | ✓ | Date of installation completion |
| `roofAreaSqFt` | Float | ✓ | Total roof area covered |
| `roofSlope` | Enum | ✓ | `LOW_SLOPE` (≤2:12) or `STEEP_SLOPE` (>2:12) |
| `buildingType` | Enum | ✓ | `COMMERCIAL`, `INDUSTRIAL`, `RESIDENTIAL_HIGH_RISE`, `WAREHOUSE` |
| `climateZone` | String | ✓ | ASHRAE climate zone (e.g., "2A", "3B", "4C") |
| `geoLatitude` | Float | ✓ | Installation latitude |
| `geoLongitude` | Float | ✓ | Installation longitude |
| `previousRoofType` | String | ✓ | Baseline roof being replaced/coated |
| `previousRoofSR` | Float | | Measured SR of previous roof (default applied if omitted) |
| `hvacSystemType` | String | | HVAC type for η calculation |
| `hvacCOP` | Float | | Coefficient of Performance (default: 3.5) |
| `walletAddress` | String | ✓ | Solana wallet for settlement |

---

## 5. Solana Anchor — Genesis Block Protocol

### 5.1 Hash Construction

Each verified installation triggers a SHA-256 Genesis Hash anchored to Solana Devnet via the existing Sovereign Notary (`lib/solana-notary.ts`).

```
Genesis Hash = SHA-256(
  batchId +
  solarReflectanceInitial +
  thermalEmittance +
  geoLatitude + geoLongitude +
  installationDate +
  roofAreaSqFt +
  installerLicense
)
```

### 5.2 Memo Payload Structure

Anchored via the Solana Memo Program (`MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`):

```json
{
  "protocol": "aethexer-v1",
  "type": "ROOFING_GENESIS",
  "batchId": "TPO-2026-05-BATCH-4412",
  "genesisHash": "a3f8c2...",
  "tier": "TIER_2",
  "sr": 0.82,
  "te": 0.87,
  "sri": 104,
  "areaM2": 1486.5,
  "climateZone": "2A",
  "coords": [33.4484, -112.0740],
  "sentinel": "9tsq8qB4P9uPRSHrjXLaDQJd93nuo4wEEtkR1tAJRAQ3"
}
```

### 5.3 Monthly Reporting Cycle

After the Genesis Block, monthly TLS calculations are anchored as `ROOFING_TLS_REPORT` memos:

```json
{
  "protocol": "aethexer-v1",
  "type": "ROOFING_TLS_REPORT",
  "genesisHash": "a3f8c2...",
  "reportMonth": "2026-06",
  "tlsKwh": 3650,
  "co2eSavedKg": 1408.9,
  "negativeWatts": 5.0,
  "gridEmissionFactor": 0.386,
  "sentinel": "9tsq8qB4P9uPRSHrjXLaDQJd93nuo4wEEtkR1tAJRAQ3"
}
```

---

## 6. Settlement Integration

Roofing settlements use the existing 70/20/10 split with no modifications:

| Share | Recipient | Roofing Context |
|---|---|---|
| **70%** | Asset Owner | Building owner or roofing company |
| **20%** | Bedrock Treasury | Platform backing / institutional reserve |
| **10%** | Specialist | Verification agent who confirmed installation |

Settlement is triggered when:
1. Material registration is complete with spectral test data
2. Installation registration is complete with geolocation
3. Genesis Hash is anchored to Solana
4. First monthly TLS report is generated
5. Founder approval gate is passed (human-in-the-loop)

---

## 7. Forensic Audit Handshake

The platform verifies installation performance through a three-stage handshake:

### Stage 1: Document Forensics
- Spectral test report PDF ingested via `/api/v1/forensic-ingest`
- LLM parser extracts SR, TE, SRI values
- Cross-referenced against CRRC database (if CRRC Product ID provided)
- Parser confidence score generated

### Stage 2: Geospatial Verification
- Installation coordinates validated against building footprint data
- Climate zone auto-assigned from ASHRAE lookup table
- Cooling Degree Days pulled from NOAA historical data for the location
- Satellite imagery cross-reference (Phase 3 — future)

### Stage 3: Solana Anchor
- Genesis Hash constructed and anchored
- Memo transaction signed by Sentinel Node-01
- `solanaSignature` stored in Settlement record
- Submission status transitions: `DRAFT → PENDING_FORENSIC_VERIFICATION → FORENSIC_VERIFIED → [founderApproved] → SETTLEMENT_COMPLETE`

---

## 8. Implementation Roadmap

### Phase 2A — Schema & API (Estimated: 1 session)
- Add `ROOFING` to `ServiceType` enum
- Add `SubstrateType` enum
- Create `RoofingMaterial` and `RoofingInstallation` models
- Create `/api/roofing/calculate` endpoint (TLS engine)
- Create `/api/roofing/register-material` endpoint
- Create `/api/roofing/register-installation` endpoint

### Phase 2B — UI Pages (Estimated: 1 session)
- Add ROOFING section to sidebar navigation
- Build Roofing Calculator page (TLS calculation with SSE streaming)
- Build Material Registry page
- Build Installation Tracker page

### Phase 2C — Solana Integration (Estimated: 1 session)
- Extend `anchorToDevnet()` to support `ROOFING_GENESIS` and `ROOFING_TLS_REPORT` memo types
- Wire monthly TLS report generation
- Update Global Ledger to display roofing assets

### Phase 2D — Certificates & Compliance (Estimated: 1 session)
- Generate "Thermal Load Shedding Certificate" PDF
- Include: Installation details, TLS calculation, CO₂e saved, Solana signature, QR code linking to on-chain proof
- Update Project Bibles with roofing vertical documentation

---

## 9. What This Specification Does NOT Include

- **"Negative Watts" as a tradeable token.** $NW is a metric, not a token. Verified savings flow through EXITZ.
- **Elimination claims.** The platform does not claim to "eliminate" HVAC systems. It quantifies *reduction* in thermal load.
- **Tier 3 as baseline.** Sub-ambient radiative cooling (SR ≥ 0.95) is supported but not required. Most commercial installations will be Tier 1 or Tier 2.
- **Real-time monitoring.** This specification covers document-based verification. IoT sensor integration (roof temperature monitoring) is a Phase 3 consideration.

---

## 10. References

1. ASTM C1549-16R22 — Standard Test Method for Determination of Solar Reflectance Near Ambient Temperature
2. ASTM E1980 — Standard Practice for Calculating Solar Reflectance Index
3. ASHRAE 90.1-2022 — Energy Standard for Buildings Except Low-Rise Residential Buildings
4. ENERGY STAR Roof Products Program Requirements v3.0 (discontinued June 2022, metrics remain industry standard)
5. LEED v4.1 — Sustainable Sites Credit: Heat Island Reduction
6. CRRC-1 — Cool Roof Rating Council Product Rating Program
7. EPA eGRID — Emissions & Generation Resource Integrated Database
8. PNNL-24904 — Radiative Cooling Roof System Energy Savings Analysis
9. NOAA — Historical Cooling Degree Day Data by Climate Zone

---

*Document prepared by Bedrock ESG Platform Architecture — Abacus AI Agent*
*Classification: Internal Draft — Not for external distribution*
