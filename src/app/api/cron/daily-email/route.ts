import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase";
import { Resend } from "resend";

// Utility to validate bearer token against CRON_SECRET
function requireCronAuth(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return token && token === process.env.CRON_SECRET;
}

// Compute date string (YYYY-MM-DD) in a given IANA timezone
function dateISO(timeZone: string): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${d}`;
}

// Select a random motivational line
function motivationLine() {
  const lines = [
    "Boring miles build legendary legs.",
    "Strong is a habit. Today is a rep.",
    "You’re building the chassis for 100.",
    "Hike the steep. Own the descent.",
    "Consistency beats heroics — every time.",
  ];
  const idx = Math.floor(Math.random() * lines.length);
  return lines[idx];
}

export async function POST(req: NextRequest) {
  if (!requireCronAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY!);
  // Fetch all user profiles (id, email, timezone)
  const { data: profiles, error } = await supabaseService
    .from("profiles")
    .select("id,email,timezone,email_time_local");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  for (const profile of profiles ?? []) {
    if (!profile.email) continue;
    // Determine today's date in user's timezone
    const planDate = dateISO(profile.timezone || "UTC");
    // Fetch plan for this user and date
    const { data: planDay } = await supabaseService
      .from("plan_days")
      .select("payload")
      .eq("user_id", profile.id)
      .eq("plan_date", planDate)
      .maybeSingle();
    const payload = planDay?.payload as any;
    if (!payload) continue;
    // Build email content
    const subject = `Today's training — ${planDate}`;
    const lines = [] as string[];
    lines.push(`Good morning — here’s your plan for ${planDate}:`);
    lines.push("");
    if (payload.run) {
      lines.push(`RUN: ${payload.run.title} (${payload.run.distance_mi} mi)`);
      if (payload.run.notes) lines.push(payload.run.notes);
      if (payload.run.strides) {
        lines.push(
          `Strides: ${payload.run.strides.reps} × ${payload.run.strides.seconds}s`
        );
      }
      lines.push("");
    }
    if (payload.strength) {
      lines.push(`STRENGTH: ${payload.strength.title}`);
      if (payload.strength_details) {
        for (const line of payload.strength_details) lines.push(`- ${line}`);
      }
      lines.push("");
    }
   import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase";
import { Resend } from "resend";

// Utility to validate bearer token against CRON_SECRET
function requireCronAuth(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return token && token === process.env.CRON_SECRET;
}

// Compute date string (YYYY-MM-DD) in a given IANA timezone
function dateISO(timeZone: string): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${d}`;
}

// Select a random motivational line
function motivationLine() {
  const lines = [
    "Boring miles build legendary legs.",
    "Strong is a habit. Today is a rep.",
    "You’re building the chassis for 100.",
    "Hike the steep. Own the descent.",
    "Consistency beats heroics — every time.",
  ];
  const idx = Math.floor(Math.random() * lines.length);
  return lines[idx];
}

export async function POST(req: NextRequest) {
  if (!requireCronAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY!);
  // Fetch all user profiles (id, email, timezone)
  const { data: profiles, error } = await supabaseService
    .from("profiles")
    .select("id,email,timezone,email_time_local");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  for (const profile of profiles ?? []) {
    if (!profile.email) continue;
    // Determine today's date in user's timezone
    const planDate = dateISO(profile.timezone || "UTC");
    // Fetch plan for this user and date
    const { data: planDay } = await supabaseService
      .from("plan_days")
      .select("payload")
      .eq("user_id", profile.id)
      .eq("plan_date", planDate)
      .maybeSingle();
    const payload = planDay?.payload as any;
    if (!payload) continue;
    // Build email content
    const subject = `Today's training — ${planDate}`;
    const lines = [] as string[];
    lines.push(`Good morning — here’s your plan for ${planDate}:`);
    lines.push("");
    if (payload.run) {
      lines.push(`RUN: ${payload.run.title} (${payload.run.distance_mi} mi)`);
      if (payload.run.notes) lines.push(payload.run.notes);
      if (payload.run.strides) {
        lines.push(
          `Strides: ${payload.run.strides.reps} × ${payload.run.strides.seconds}s`
        );
      }
      lines.push("");
    }
    if (payload.strength) {
      lines.push(`STRENGTH: ${payload.strength.title}`);
      if (payload.strength_details) {
        for (const line of payload.strength_details) lines.push(`- ${line}`);
      }
      lines.push("");
    }
    if (payload.mobility) {
      lines.push(`MOBILITY: ${payload.mobility.title}`);
      if (payload.mobility_details) {
        for (const line of payload.mobility_details) lines.push(`- ${line}`);
      }
      lines.push("");
    }
    if (payload.supplements) {
      lines.push(`SUPPLEMENTS: ${payload.supplements.join(", ")}`);
      lines.push("");
    }
    if (payload.cue) {
      lines.push(`Cue: ${payload.cue}`);
    }
    lines.push(`Motivation: ${motivationLine()}`);
    lines.push("");
    lines.push(`Log your workout: ${(process.env.APP_BASE_URL ?? "")}/today`);

    const text = lines.join("\n");
    // Send email via Resend
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: profile.email,
      subject,
      text,
    });
    sent++;
  }
  return NextResponse.json({ ok: true, sent });
} if (payload.mobility) {
      lines.push(`MOBILITY: ${payload.mobility.title}`);
      if (payload.mobility_details) {
        for (const line of payload.mobility_details) lines.push(`- ${line}`);
      }
      lines.push("");
    }
    if (payload.supplements) {
      lines.push(`SUPPLEMENTS: ${payload.supplements.join(", ")}`);
      lines.push("");
    }
    if (payload.cue) {
      lines.push(`Cue: ${payload.cue}`);
    }
    lines.push(`Motivation: ${motivationLine()}`);
    lines.push("");
    lines.push(`Log your workout: ${(process.env.APP_BASE_URL ?? "")}/today`);

    const text = lines.join("\n");
    // Send email via Resend
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: profile.email,
      subject,
      text,
    });
    sent++;
  }
  return NextResponse.json({ ok: true, sent });
}
