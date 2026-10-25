import { NextResponse } from "next/server";

export async function POST() {
  try {
    const apiKey = process.env.HEYGEN_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "HEYGEN_API_KEY not configured in .env.local" }, { status: 500 });
    }

    const response = await fetch("https://api.heygen.com/v1/streaming.create_token", {
      method: "POST",
      headers: { "x-api-key": apiKey },
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: "Failed token generation", details: err }, { status: response.status });
    }

    const resData = await response.json();
    return NextResponse.json({ token: resData.data.token });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
