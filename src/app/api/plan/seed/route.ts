import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase";

// Verify bearer token matches CRON_SECRET for admin operations
function requireAdmin(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return token && token === process.env.CRON_SECRET;
}

// Compute a date string in America/Phoenix (YYYY-MM-DD)
function phoenixDateISO(d: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Phoenix",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${day}`;
}

function addDaysISO(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

// Weekly mileage targets for the 8-week base phase
const WEEK_MILEAGE = [20, 22, 24, 20, 26, 28, 30, 24] as const;

// Build one week of run/strength/mobility plan based on week index
function buildWeek(weekIndex: number) {
  // Determine base mountain distances for Tuesday and Saturday
  const tueMountain =
    weekIndex === 0
      ? 3.5
      : weekIndex === 1
        ? 4.5
        : weekIndex === 3
          ? 3.5
          : weekIndex === 7
            ? 4.0
            : 6.0;
  const satMountain = weekIndex === 3 ? 6.0 : 6.0;

  // Baseline distances for Monday, Thursday and Sunday
  let mon = weekIndex >= 4 ? 5.0 : 4.0;
  let thu = weekIndex >= 6 ? 6.0 : weekIndex >= 4 ? 5.0 : 4.5;
  let sun = weekIndex >= 6 ? 7.0 : weekIndex >= 5 ? 6.0 : weekIndex >= 2 ? 3.0 : 3.0;

  // Adjust distances to hit target mileage
  const target = WEEK_MILEAGE[weekIndex];
  let current = mon + tueMountain + thu + satMountain + sun;
  let diff = +((target - current).toFixed(1));
  const adjustOrder: Array<"mon" | "thu" | "sun"> = ["sun", "thu", "mon"];
  while (Math.abs(diff) >= 0.1) {
    for (const k of adjustOrder) {
      if (Math.abs(diff) < 0.1) break;
      if (diff > 0) {
        if (k === "mon" && mon < 6.0) { mon += 0.5; diff -= 0.5; }
        if (k === "thu" && thu < 7.0) { thu += 0.5; diff -= 0.5; }
        if (k === "sun" && sun < 7.5) { sun += 0.5; diff -= 0.5; }
      } else {
        if (k === "sun" && sun > 2.5) { sun -= 0.5; diff += 0.5; }
        if (k === "thu" && thu > 3.5) { thu -= 0.5; diff += 0.5; }
        if (k === "mon" && mon > 3.0) { mon -= 0.5; diff += 0.5; }
      }
    }
    current = mon + tueMountain + thu + satMountain + sun;
    diff = +((target - current).toFixed(1));
    // Safety break if diff oscillates
    if (Math.abs(diff) < 0.1) break;
  }

  const week: Record<number, any> = {};
  // Monday: easy run + mobility
  week[0] = {
    run: {
      title: "Easy Run (Z2)",
      distance_mi: mon,
      route: "flat",
      intensity: "Z2",
      notes: "Keep it embarrassingly easy. Smooth cadence. Nose-breath if you can.",
    },
    mobility: { title: "Ankles + Hips Reset", routine: "ankle_hip", duration_min: 20 },
    supplements: supplementsBase(false),
    cue: "Relax your shoulders. Run tall. Quiet feet.",
  };
  // Tuesday: mountain hill
  week[1] = {
    run: {
      title: tueMountain >= 6 ? "Mountain Loop (Z2)" : "Mountain Out-and-Back (partial, Z2)",
      distance_mi: tueMountain,
      route: "mountain_loop",
      intensity: "Z2",
      notes:
        tueMountain >= 6
          ? "Full loop. Hike steep sections. Descend under control (short stride, quick feet)."
          : "Go up, turn around early. Hike steep. Descend slower than you want.",
    },
    supplements: supplementsBase(false),
    cue: "Downhill: avoid braking. Short steps, higher cadence.",
  };
  // Wednesday: Strength A
  week[2] = {
    strength: { title: "Strength A (Heavy + bone loading)", routine: "A", duration_min: 55 },
    mobility: { title: "Post-Mountain Calves + Ankles", routine: "post_mountain", duration_min: 15 },
    supplements: supplementsBase(true),
    cue: "Heavy & controlled. Leave 1–2 reps in the tank.",
  };
  // Thursday: easy + strides
  week[3] = {
    run: {
      title: "Easy Run + Strides",
      distance_mi: thu,
      route: "flat",
      intensity: "Z2",
      notes: "After the run: 6 × 20s strides (fast-but-relaxed), full walk recovery.",
      strides: { reps: 6, seconds: 20 },
    },
    supplements: supplementsBase(false),
    cue: "Strides are form practice, not a workout.",
  };
  // Friday: Strength B
  week[4] = {
    strength: { title: "Strength B (Single-leg + knee/ankle armor)", routine: "B", duration_min: 50 },
    mobility: { title: "Full Reset (hips + ankles + T-spine)", routine: "full_reset", duration_min: 20 },
    supplements: supplementsBase(true),
    cue: "Slow eccentrics. Stable knee tracking over toes.",
  };
  // Saturday: mountain time on feet
  week[5] = {
    run: {
      title: "Mountain Loop (Time on feet, Z2)",
      distance_mi: satMountain,
      route: "mountain_loop",
      intensity: "Z2",
      notes: "Full loop. Hike steep. Descend with discipline. If form breaks, hike down.",
    },
    supplements: supplementsBase(false),
    cue: "Strong hikers win ultras. Make hiking your superpower.",
  };
  // Sunday: easy or optional off-feet
  week[6] = {
    run: {
      title: "Easy Run (Z1–Z2)",
      distance_mi: sun,
      route: "flat",
      intensity: "Z2",
      notes: "Keep this truly easy. If joints feel tender, replace with a 45–60 min walk.",
    },
    supplements: supplementsBase(false),
    cue: "Finish feeling better than you started.",
  };
  return week;
}

function supplementsBase(isStrength: boolean) {
  const base = [
    "Creatine 5g",
    "Vitamin D3 (2,000–4,000 IU)",
    "Magnesium glycinate (300–400mg night)",
  ];
  const collagen = "Collagen 15g + Vitamin C (30–60 min pre-strength)";
  return isStrength ? [...base, collagen] : base;
}

function strengthRoutineDetails(routine: "A" | "B") {
  if (routine === "A") {
    return [
      "Trap bar or barbell deadlift 4×5 (heavy, clean form)",
      "Rear-foot elevated split squat 3×6/leg (slow)",
      "Standing calf raise 4×8 (heavy)",
      "Bent-knee calf raise 3×10",
      "Farmer’s carries 4×40s",
    ];
  }
  return [
    "Step-downs 3×8/leg (slow eccentric)",
    "Single-leg RDL 3×6/leg",
    "Spanish squat 3×30–45s holds",
    "Hip abduction 3×12",
    "Foot intrinsics 5 min",
  ];
}

function mobilityRoutineDetails(routine: "ankle_hip" | "post_mountain" | "full_reset") {
  if (routine === "ankle_hip") {
    return [
      "Knee-to-wall ankle mobs 2×10/side",
      "Couch stretch 2×60s/side",
      "Cossack squats 2×6/side",
      "Foot rolling 2–3 min",
    ];
  }
  if (routine === "post_mountain") {
    return [
      "Calf roll 2 min/side",
      "Soleus stretch 2×45s/side",
      "Ankle circles 2×10/side",
      "Toe yoga 2 min",
    ];
  }
  return [
    "Knee-to-wall ankle mobs 2×10/side",
    "Couch stretch 2×60s/side",
    "Open books (T-spine) 2×8/side",
    "Glute bridge 2×10",
    "Foot rolling 3 min",
  ];
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const userId = body.user_id as string | undefined;
  const startDate = (body.start_date as string | undefined) ?? phoenixDateISO(new Date());
  const weeks = Number(body.weeks ?? 8);
  if (!userId) return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  if (weeks !== 8) return NextResponse.json({ error: "MVP supports 8 weeks only" }, { status: 400 });
  const rows: Array<{ user_id: string; plan_date: string; payload: any }> = [];
  for (let w = 0; w < 8; w++) {
    const weekPlan = buildWeek(w);
    for (let day = 0; day < 7; day++) {
      const date = addDaysISO(startDate, w * 7 + day);
      const p = weekPlan[day];
      const payload: any = {
        ...p,
        strength_details: p.strength ? strengthRoutineDetails(p.strength.routine) : undefined,
        mobility_details: p.mobility ? mobilityRoutineDetails(p.mobility.routine) : undefined,
        week_index: w + 1,
      };
      rows.push({ user_id: userId, plan_date: date, payload });
    }
  }
  const { error: upErr } = await supabaseService.from("plan_days").upsert(rows, { onConflict: "user_id,plan_date" });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
  return NextResponse.json({ ok: true, start_date: startDate, days_seeded: rows.length });
}
