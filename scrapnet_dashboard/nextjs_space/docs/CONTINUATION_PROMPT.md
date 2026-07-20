# Bedrock ESG — Continuation Prompt

> Paste this into a new conversation to restore full project context.

---

## IDENTITY & CONTEXT

This is an existing production application called **Bedrock ESG** — an industrial carbon verification platform deployed at **bedrockesg.com**. The project directory is `/home/ubuntu/scrapnet_dashboard`. Do NOT scaffold a new project or run create-next-app. Read `.project_instructions.md` at the project root before making any changes.

The user goes by **"Zer0"** (local cockpit moniker). On-chain identity = **"Aethexer Notary Node"**. They are non-technical — always be explicit about which URLs to use (production vs preview). They have two apps:
1. **This app** — Bedrock ESG cockpit at `bedrockesg.com`
2. **A landing page** — in a different conversation, deployed at `home.bedrockesg.com` → `bedrock-landing-ojec1v.abacusai.app`

---

## CURRENT VERSION: BT-C9C4C5 v2.4 — Trinity Protocol Upgrade (June 2026)

### What Was Built (Cumulative)

**Core Platform:**
- Industrial carbon verification for the "Circular Trifecta": Asphalt, Biochar, and Metal Recovery
- Local Eurobitume A1-A3 LCA carbon calculator (no external API)
- Biochar CDR calculator with Hedera Guardian Framework compliance
- Metal recovery tracking (precious metals with VAL formula)
- Farmer/Agent management with credit lifecycle (Pending → Issued → Redeemed)
- Dual-blockchain attestation: Hedera HCS + Polygon ERC-1155

**Sovereign Architecture:**
- **Solana Notary** (`lib/solana-notary.ts`): Server-side Memo signing, expected identity `9tsq8qB4P9uPRSHrjXLaDQJd93nuo4WEEtkR1tAJRAQ3`
- **Dynamic HUM Listener** (`services/hum-listener.ts`): 12.6 MW baseline, NYSE/NASDAQ/LSE/CME/Eurex windows
- **Emission Factor Database** (`lib/emission-factors.ts`): ICE v4.1 + Ecoinvent v3.10.1 = 40 factors
- **Spatial Heritage Parser** (`lib/ply-parser.ts`): PLY + Gaussian Splat ingest, volume→mass→carbon pipeline
- **Sentinel Engine** (`lib/sentinel-engine.ts`): 95/75/75 threshold scoring with 7-tier verdict matrix
- **Aethexer Protocol** (`lib/aethexer-auth.ts`): Trinity 3-layer auth (dual-key + timestamp + nonce)

**v2.4 Additions:**
- **RBAC System** (`lib/rbac.ts`, `lib/rbac-guard.ts`): 4-tier hierarchy FOUNDER > ADMIN > SOVEREIGN_AGENT > CLIENT_OWNER, 19 permissions
- **Audit Log Pipeline** (`lib/audit-logger.ts`): SHA-256 tamper-detection, fire-and-forget, wired into settle route
- **Google SSO**: Custom OAuth 2.0 flow (NOT NextAuth), `/api/auth/google` + `/api/auth/callback/google`
- **Live Asset Ticker**: SSE stream (`/api/ticker-stream`), 12 seeded assets (5 exchanges, 4 skyscrapers, 3 casinos)
- **Discovery Interface** (`/discovery`): Passive intelligence feed for unlisted macro-assets
- **AuditLog model**: New Prisma model with SHA-256 audit hashes and backtrace IDs
- **New schema enums**: DiscoveryTier, AssetSubClass, expanded UserRole + SubmissionStatus

**EXITZ Token Ecosystem (Solana Mainnet):**
- EXITZ base: `44SrHT9Qwyz2jiiJkRF1zHKF2NFTgTC8m6ubPTb5qJBJ` (supply: 2)
- EXITZ-C (Classic Vehicles): `7ZPsJE3W5YXnnYgapzfsA5JxtK8VQwtTn5Jb23hgfzMK` (supply: 1)
- EXITZ-A (Fine Art): `G11hBknKcBXUjc4kvAtAkwjoHz5yMr7FTqEEYC96EnJn` (supply: 1)

---

## AUTH SYSTEM

**Custom JWT-based auth** (NOT NextAuth). Token stored in `auth-token` httpOnly cookie.
- `JWT_SECRET` env var with fallback `'bedrockEsg-secret-key-change-in-production'`
- Login route: `/api/auth/login` — validates identifier/password, issues JWT
- Google SSO: `/api/auth/google` → Google → `/api/auth/callback/google` → JWT cookie → redirect
- Google OAuth client: "Bedrock ESG Production Gate" (`933406767966-cfju...`), scoped to `bedrockesg.com` only
- Redirect URI registered in Google Console: `https://bedrockesg.com/api/auth/callback/google`
- Auto-elevation: if Google email === `ADMIN_MASTER_EMAIL` (idecade8@gmail.com) → ADMIN role
- New Google SSO users get SOVEREIGN_INDIVIDUAL role
- **CRITICAL**: All redirect URLs in SSO routes use `process.env.NEXTAUTH_URL` as base (not `request.url` which contains internal proxy hostname in production)

**Credentials:**
- Seeded admin: `john@doe.com` / `johndoe123` (ADMIN role)
- Google SSO admin: `idecade8@gmail.com` → auto-elevated to ADMIN

---

## ENVIRONMENT VARIABLES (.env)

All set and operational:
- `DATABASE_URL` — Postgres connection
- `ABACUSAI_API_KEY`, `WEB_APP_ID` — Platform APIs
- `GOOGLE_CLIENT_ID` = `933406767966-cfjui6tl880mic302s207frogucme9ib.apps.googleusercontent.com`
- `GOOGLE_CLIENT_SECRET` = `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`
- `ADMIN_MASTER_EMAIL` = `idecade8@gmail.com`
- `JWT_SECRET` — proper 96-char hex secret
- `SOLANA_NOTARY_SECRET_KEY`, `SOLANA_NOTARY_PUBLIC_KEY` — Devnet notary
- `SOLANA_MAINNET_RPC_URL` — for EXITZ tokens
- `POLYGON_PRIVATE_KEY`, `HEDERA_TOPIC_ID` — dual-chain attestation
- `AWS_REGION`, `AWS_BUCKET_NAME`, `AWS_FOLDER_PREFIX` — S3 file uploads
- `AETHEXER_PROTOCOL_KEY`, `AETHEXER_FIELD_KEY` — Aethexer Protocol auth
- `HUM_TRIGGER_THRESHOLD` — HUM listener
- `BLOCKCHAIN_MODE` = production

---

## SETTLEMENT MODEL: 70/20/10 Zero Greed Policy

- **70% → "Verified Asset Value"** — goes to asset owner
- **20% → "Platform Processor"** — Bedrock Treasury
- **10% → "Public Resilience"** — singular block, dynamic routing by assetClass
- Code-enforced, non-negotiable. Constants in `lib/universal-law.ts`
- Internal DB field names: `founderYieldUsd`, `stewardshipUsd`, `publicResilienceUsd`
- Asset Class Variants: A (SOVEREIGN_SKIN), B (PROPERTY_INDUSTRIAL), C (PROPERTY_RESIDENTIAL), D (PHYSICAL_COMMODITIES), E (PRECIOUS_METALS_CUSTODIAL)
- Precious Metals VAL: `(Spot × Weight × Purity%) − Refinery Discount`

---

## DESIGN LANGUAGE

- **Dark theme**: Deep Space palette — `#0a0a0a` bg, `#1a1a1a` cards, `#2a2a2a` borders
- **Accent**: Electric blue (`--ledger-accent`), Sage green (`--ledger-sage`)
- **Tone**: Institutional — "Verification" not "Vault", "Consolidated Ledger" not "Universal Ledger"
- **Identity**: "Bedrock ESG — Industrial Carbon Verification Platform"

---

## KEY FILE LOCATIONS

```
nextjs_space/
├── app/
│   ├── api/auth/google/route.ts          # Google SSO initiation
│   ├── api/auth/callback/google/route.ts  # Google SSO callback
│   ├── api/auth/login/route.ts            # JWT login
│   ├── api/submissions/                   # Business submission portal
│   ├── api/v1/forensic-ingest/            # Aethexer Protocol ingest
│   ├── api/ticker-stream/route.ts         # SSE live asset feed
│   ├── api/audit-logs/route.ts            # Audit log query
│   ├── login/page.tsx                     # Login page (email + Google SSO)
│   ├── discovery/page.tsx                 # Asset discovery interface
│   ├── submission-portal/page.tsx         # Corporate gatehouse
│   └── page.tsx                           # Main dashboard with ticker
├── components/
│   ├── cockpit-ticker.tsx                 # Live asset ticker strip
│   ├── discovery-dashboard.tsx            # Discovery feed UI
│   └── sidebar.tsx                        # Navigation sidebar
├── lib/
│   ├── rbac.ts + rbac-guard.ts           # RBAC system
│   ├── audit-logger.ts                    # Audit pipeline
│   ├── sentinel-engine.ts                 # 95/75/75 scoring
│   ├── aethexer-auth.ts                   # Trinity 3-layer auth
│   ├── solana-notary.ts                   # Solana Memo signing
│   ├── universal-law.ts                   # Settlement labels + VAL
│   ├── validator.ts                       # Zod schemas
│   └── emission-factors.ts               # ICE + Ecoinvent DB
├── services/
│   └── hum-listener.ts                    # Dynamic HUM baseline
├── prisma/schema.prisma                   # 42 models, 29 enums
├── docs/                                  # Project Bibles (v2.2, v2.3, v2.4)
└── .env                                   # All secrets configured
```

---

## KNOWN ISSUES / RECENT FIXES

1. **Google SSO redirect fix (just deployed)**: All `NextResponse.redirect()` calls in SSO routes now use `process.env.NEXTAUTH_URL` instead of `request.url` as base URL. The old code was redirecting to internal proxy hostnames, causing "server can't be found" errors.

2. **`@noble/curves` dev dependency**: Added to fix `@noble/curves/ed25519` module resolution in dev mode (Solana `@solana/web3.js` dependency). Production builds unaffected.

3. **EACCES cache errors in prod logs**: `Failed to update prerender cache` — permission denied for `.build/cache`. These are non-blocking warnings, not errors.

4. **`home.bedrockesg.com` SSL failure**: This subdomain belongs to a different app ("7 - Deep Agent Access" conversation). SSL cert not provisioned there. Fix must happen in that other conversation's Manage Domains settings.

5. **Calculator**: NEVER use `apps.abacus.ai/api/chatllm` — permanently broken. Local engine only.

---

## DIGITAL HUM BASELINE

- 74,088t CO₂e/day
- 12.6 MW baseline (replaced legacy 18.0 MW)
- 5% shift threshold triggers on-chain Memo anchor

---

## 12 SEEDED MACRO-ASSETS

**Exchanges (5):** NYSE-01, NASDAQ-01, LSE-01, CME-01, EUREX-01
**Skyscrapers (4):** BURJ-DXB-001, TAI-101-TPE, OWT-NYC-001, SHA-TWR-001
**Casinos (3):** MGM-LV-01, VEN-MAC-01, MBS-SGP-01

---

## INSTRUCTIONS FOR NEW CONVERSATION

1. Read `.project_instructions.md` first — it's your persistent memory
2. The auth system is custom JWT, NOT NextAuth — don't add NextAuth
3. Solana = Devnet for notary, Mainnet for EXITZ tokens
4. Settlement is 70/20/10 — code-enforced, never modify ratios
5. The user is non-technical — be explicit about URLs and technical steps
6. Always use `process.env.NEXTAUTH_URL` for public-facing redirect URLs in API routes
7. Project Bibles in `docs/` — update them when making significant changes
