import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.json({ error: error ?? "Missing code" }, { status: 400 });
  }

  const userId = searchParams.get("state");
  if (!userId) {
    return NextResponse.json({ error: "Missing state(userId)" }, { status: 400 });
  }

  const tokenRes = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const txt = await tokenRes.text();
    return NextResponse.json({ error: "Token exchange failed", details: txt }, { status: 500 });
  }

  const data = await tokenRes.json();

  const { error: upsertErr } = await supabaseService
    .from("strava_tokens")
    .upsert({
      user_id: userId,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      athlete_id: data.athlete?.id ?? null,
      updated_at: new Date().toISOString(),
    });

  if (upsertErr) {
    return NextResponse.json({ error: upsertErr.message }, { status: 500 });
  }

  return NextResponse.redirect(`${process.env.APP_BASE_URL}/settings?strava=connected`);
}
