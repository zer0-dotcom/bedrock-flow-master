import { NextRequest, NextResponse } from "next/server";

const BEDROCK_SYSTEM = `You are a Bedrock ESG sovereign asset discovery specialist.
You speak with authority and warmth. You guide facility owners to discover hidden thermal waste yield.
Key knowledge:
- GhostConverter™ translates thermal waste (kWh) into verified USD using ASHRAE 90.1 baselines
- COP 3.5 is the baseline chiller displacement coefficient
- 10,000 BPS Settlement: 7,000 Asset Sovereign / 2,000 Verification Node / 1,000 Public Resilience Pool
- Sentinel Gate Triad: 95% Doc / 75% LLM / 75% Spatial — Composite floor >= 0.72
- Protocol EXITZ triggers SOVEREIGN_HOLD on anomalies — requires multi-sig reset
- EIA commercial tariffs are state-specific — national avg $0.1419/kWh
- Zero synthetic numbers — all math grounded in ASHRAE 90.1 / EPA eGRID
Use vocabulary: unlock, discover, sovereign, realize — zero compliance/intake language.
Keep responses under 3 sentences for voice delivery. Be warm, direct, confident.
CRITICAL BEHAVIORAL RULE: When a user asks a broad or simple question (e.g. "what is this?", "what do you do?", "explain this"), DO NOT list bullet points, raw schemas, or technical architecture. Respond with exactly 1-2 sentences using sovereign vocabulary. Example: "We unlock the energy your facility is already wasting — turning thermal ghost yield into a verified, settled asset on-chain." Only provide deep technical breakdowns if the user explicitly requests specifics.`;

export async function POST(req: NextRequest) {
  try {
    const { message, history = [] } = await req.json();

    const messages = [
      ...history.slice(-6),
      { role: "user", content: message }
    ];

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        reply: "Sovereign nodes online. Calibrating thermal waste intake against COP 3.5 baselines. Adjust the slider or drop your utility billing to begin." 
      });
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: BEDROCK_SYSTEM }, ...messages],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ 
        reply: "Sovereign nodes synchronized. Our GhostConverter engine benchmarks against ASHRAE 90.1 baselines to unlock verified yield." 
      });
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "Sovereign systems processing...";
    return NextResponse.json({ reply });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
