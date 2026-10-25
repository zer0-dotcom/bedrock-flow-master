import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { text, voiceId: reqVoiceId } = await req.json();
  if (!text) return NextResponse.json({ error: 'No text' }, { status: 400 });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 });

  const voiceId = reqVoiceId || '21m00Tcm4TlvDq8ikWAM';

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.55, similarity_boost: 0.85, style: 0.20, use_speaker_boost: true }
    })
  });

  if (!res.ok) return NextResponse.json({ error: 'ElevenLabs error' }, { status: 502 });

  const buffer = await res.arrayBuffer();
  return new NextResponse(buffer, {
    headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' }
  });
}
