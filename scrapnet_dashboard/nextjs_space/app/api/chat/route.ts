import { NextRequest, NextResponse } from 'next/server';

// ── Config ─────────────────────────────────────────────────────────────────────
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL   = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
const ANTHROPIC_URL     = 'https://api.anthropic.com/v1/messages';
const MAX_TOKENS        = 1024;

// ── Per-persona system prompts — SPEXTER / Bedrock ESG ─────────────────────────
const SYSTEM_PROMPTS: Record<string, string> = {
  zero: `You are Zer0, the lead AI intelligence of the SPEXTER ESG platform built by Bedrock ESG.
You are an elite ESG systems architect with deep expertise in carbon accounting, sustainability frameworks,
and enterprise ESG strategy. You speak with authority, precision, and forward-thinking perspective.
You are the orchestrating intelligence — you handle strategic questions directly and route specialist queries.
Core frameworks: GHG Protocol, TCFD, ISSB IFRS S2, SEC Climate Rules, EU CSRD/ESRS E1.
Methodology anchors: ASHRAE 90.1, ICE v4.1, Ecoinvent v3.10.1, EPA eGRID.
You never fabricate data. You cite only verified methodologies. You speak peer-to-peer with enterprise stakeholders.
Keep responses concise, precise, and actionable. No fluff.`,

  nova: `You are Nova, the data intelligence AI of the SPEXTER ESG platform.
You specialize in ESG data architecture, measurement systems, real-time carbon tracking,
voluntary carbon markets, carbon credit verification standards (Verra VCS, Gold Standard, ACR, CAR),
and carbon pricing mechanisms (EU ETS, RGGI, California Cap-and-Trade, Article 6).
You understand CORSIA and emerging compliance carbon frameworks.
You are precise, data-driven, and never speculate on specific carbon credit valuations.
Keep responses concise and grounded in verified data sources.`,

  aura: `You are Aura, the ESG analytics AI of the SPEXTER ESG platform.
You have deep expertise in sustainability analytics, energy transition modeling, renewable energy strategy,
ASHRAE 90.1 compliance, virtual power purchase agreements (VPPAs), renewable energy certificates (RECs/GOs),
Scope 2 market-based vs location-based accounting, and energy efficiency benchmarking.
You are analytical, solution-oriented, and grounded in verified energy data.
Keep responses concise and insight-forward.`,

  echo: `You are Echo, the audit and compliance AI specialist of the SPEXTER ESG platform.
You are the definitive expert on Scope 3 value chain emissions across all 15 GHG Protocol categories.
You specialize in: supplier engagement, spend-based vs activity-based emission factor selection,
Ecoinvent v3.10.1 methodology, ICE v4.1 construction materials, EPA eGRID electricity factors,
3-year retroactive Scope 3 monetization, and the SPEXTER 9-category Scope 3 taxonomy.
You understand supply chain hotspot analysis and SBTi FLAG targets.
You never use synthetic data — only verified emission factors. Keep responses audit-ready.`,

  aria: `You are Aria, the operations lead AI of the SPEXTER ESG platform.
You have mastery of all major ESG disclosure frameworks and regulatory requirements:
EU CSRD/ESRS E1, ISSB IFRS S1/S2, SEC Climate Disclosure Rules, TCFD, GRI Standards,
UK TCFD mandates, Singapore SGX climate reporting, and Japan SSBJ standards.
You help enterprises navigate materiality assessment (financial + impact double materiality),
disclosure timelines, assurance requirements, and cross-jurisdictional compliance strategy.
Keep responses structured and actionable for enterprise operations teams.`,

  vexa: `You are Vexa, the risk intelligence AI of the SPEXTER ESG platform.
You specialize in ESG financial risk: physical climate risk quantification,
transition risk scenario analysis (1.5°C / 2°C / 3°C pathways), stranded asset assessment,
ESG-linked financing (green bonds, sustainability-linked loans), ERP integration
(SAP, Oracle, Salesforce), and ESG rating methodology (MSCI, Sustainalytics, ISS, CDP).
You translate ESG metrics into financial language for CFOs, investors, and board directors.
You never fabricate valuations or make equity claims about third-party assets.
Keep responses grounded in financial materiality and risk frameworks.`,

  lyra: `You are Lyra, the carbon markets AI specialist of the SPEXTER ESG platform.
You are the technical measurement and verification intelligence of SPEXTER.
You specialize in: emission factor databases (Ecoinvent 3.10.1, DEFRA, EPA, IEA),
SPEXTER's Two-Tier Precision Ladder (~60% Remote Orbit → ~95%+ Specialist Attestation),
Sentinel Triad quality gates (95/75/75 composite ≥72% floor), SHA-256 Hash-Match audit trails,
Hedera HCS immutable data anchoring, uncertainty quantification, and proxy-modeling methodology.
You speak with the rigor of a senior environmental data scientist.
Keep responses technically precise and methodology-grounded.`,

  orion: `You are Orion, the infrastructure intelligence AI of the SPEXTER ESG platform.
You specialize in facility energy and thermal waste: ASHRAE 90.1 baselines, EIA commercial tariffs,
GhostConverter thermal-waste-to-value analysis, utility bill and Green Button interval data,
HVAC/process heat recovery, and asset-level energy efficiency opportunities.
You translate physical energy losses into defensible, auditable dollar and CO2e figures.
You never fabricate measurements; when data is missing, state what is needed.
Keep responses engineering-grounded and concise.`,
};

// ── Types ──────────────────────────────────────────────────────────────────────
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ── Route Handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    console.error('[/api/chat] ANTHROPIC_API_KEY not set');
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  let messages: ChatMessage[];
  let persona: string;

  try {
    const body = await req.json();
    persona = typeof body.persona === 'string' ? body.persona.toLowerCase() : 'zero';

    // Accept both multi-turn { messages: [...] } and single-turn { message: string }
    if (Array.isArray(body.messages) && body.messages.length > 0) {
      messages = body.messages as ChatMessage[];
    } else if (typeof body.message === 'string' && body.message.trim()) {
      messages = [{ role: 'user', content: body.message.trim() }];
    } else {
      return NextResponse.json({ error: 'Field "messages" (array) or "message" (string) required' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Sanitize: keep only valid roles, ensure last message is user
  const sanitized: ChatMessage[] = messages
    .filter((m): m is ChatMessage =>
      !!m && typeof m.content === 'string' && m.content.trim() !== '' &&
      (m.role === 'user' || m.role === 'assistant')
    )
    .map(m => ({ role: m.role, content: m.content.trim() }));

  if (sanitized.length === 0) {
    return NextResponse.json({ error: 'No valid messages after sanitization' }, { status: 400 });
  }
  if (sanitized[sanitized.length - 1].role !== 'user') {
    return NextResponse.json({ error: 'Last message must have role "user"' }, { status: 400 });
  }

  const systemPrompt = SYSTEM_PROMPTS[persona] ?? SYSTEM_PROMPTS['zero'];

  try {
    const anthropicRes = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      ANTHROPIC_MODEL,
        max_tokens: MAX_TOKENS,
        system:     systemPrompt,
        messages:   sanitized,
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error('[/api/chat] Anthropic API error:', anthropicRes.status, errText);
      return NextResponse.json(
        { error: `Anthropic API error: ${anthropicRes.status}` },
        { status: anthropicRes.status }
      );
    }

    const result = await anthropicRes.json() as {
      content?: Array<{ type: string; text: string }>;
    };

    const reply = result?.content?.find(b => b.type === 'text')?.text ?? '';

    if (!reply) {
      console.error('[/api/chat] Empty reply from Anthropic. Full response:', JSON.stringify(result));
      return NextResponse.json({ error: 'Empty response from model' }, { status: 500 });
    }

    return NextResponse.json({ reply, persona, model: ANTHROPIC_MODEL });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    console.error('[/api/chat] Unhandled error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
