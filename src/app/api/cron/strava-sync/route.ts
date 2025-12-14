import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase";

/**
 * Validates the Authorization header matches the CRON_SECRET from env.
 */
function requireCronAuth(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return token && token === process.env.CRON_SECRET;
}

async function refreshTokenIfNeeded(row: any) {
  const now = Math.floor(Date.now() / 1000);
  if (row.expires_at > now + 60) return row;

  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: row.refresh_token,
    }),
  });
  if (!res.ok) throw new Error(`Strava refresh failed: ${await res.text()}`);
  const data = await res.json();

  const updated = {
    ...row,
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
  };

  await supabaseService
    .from("strava_tokens")
    .update({
      access_token: updated.access_token,
      refresh_token: updated.refresh_token,
      expires_at: updated.expires_at,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", row.user_id);

  return updated;
}

export async function POST(req: NextRequest) {
  if (!requireCronAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: tokens, error } = await supabaseService.from("strava_tokens").select("*");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let inserted = 0;
  for (const t of tokens ?? []) {
    let tok;
    try {
      tok = await refreshTokenIfNeeded(t);
    import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase";

/**
 * Validates the Authorization header matches the CRON_SECRET from env.
 */
function requireCronAuth(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return token && token === process.env.CRON_SECRET;
}

async function refreshTokenIfNeeded(row: any) {
  const now = Math.floor(Date.now() / 1000);
  if (row.expires_at > now + 60) return row;

  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: row.refresh_token,
    }),
  });
  if (!res.ok) throw new Error(`Strava refresh failed: ${await res.text()}`);
  const data = await res.json();

  const updated = {
    ...row,
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
  };

  await supabaseService
    .from("strava_tokens")
    .update({
      access_token: updated.access_token,
      refresh_token: updated.refresh_token,
      expires_at: updated.expires_at,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", row.user_id);

  return updated;
}

export async function POST(req: NextRequest) {
  if (!requireCronAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: tokens, error } = await supabaseService.from("strava_tokens").select("*");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let inserted = 0;
  for (const t of tokens ?? []) {
    let tok;
    try {
      tok = await refreshTokenIfNeeded(t);
    } catch (err) {
      console.error(err);
      continue;
    }
    // Fetch up to 30 recent activities for each user
    const actsRes = await fetch(
      "https://www.strava.com/api/v3/athlete/activities?per_page=30",
      {
        headers: { authorization: `Bearer ${tok.access_token}` },
      },
    );
    if (!actsRes.ok) continue;
    const acts = await actsRes.json();
    for (const a of acts) {
      const { error: insErr } = await supabaseService.from("strava_activities").upsert({
        user_id: tok.user_id,
        activity_id: a.id,
        start_date: a.start_date,
        name: a.name,
        type: a.type,
        distance_m: a.distance,
        moving_time_s: a.moving_time,
        elevation_gain_m: a.total_elevation_gain,
        raw: a,
      });
      if (!insErr) inserted += 1;
    }
  }
  return NextResponse.json({ ok: true, inserted });
}} catch (err) {
      console.error(err);
      continue;
    }
    // Fetch up to 30 recent activities for each user
    const actsRes = await fetch(
      "https://www.strava.com/api/v3/athlete/activities?per_page=30",
      {
        headers: { authorization: `Bearer ${tok.access_token}` },
      },
    );
    if (!actsRes.ok) continue;
    const acts = await actsRes.json();
    for (const a of acts) {
      const { error: insErr } = await supabaseService.from("strava_activities").upsert({
        user_id: tok.user_id,
        activity_id: a.id,
        start_date: a.start_date,
        name: a.name,
        type: a.type,
        distance_m: a.distance,
        moving_time_s: a.moving_time,
        elevation_gain_m: a.total_elevation_gain,
        raw: a,
      });
      if (!insErr) inserted += 1;
    }
  }
  return NextResponse.json({ ok: true, inserted });
}
