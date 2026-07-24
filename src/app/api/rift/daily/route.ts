import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const admin = createSupabaseAdminClient();
    const day = new Date().toISOString().slice(0, 10);
    const seed = crypto.randomUUID();
    const { data: daily, error } = await admin.from("rift_daily_seeds").upsert({ day, seed }, { onConflict: "day", ignoreDuplicates: true }).select("day, seed").single();
    if (error && error.code !== "PGRST116") return NextResponse.json({ error: "No fue posible preparar el Rift diario." }, { status: 500 });
    const { data: selected } = await admin.from("rift_daily_seeds").select("day, seed").eq("day", day).single();
    const activeSeed = daily?.seed ?? selected?.seed;
    if (!activeSeed) return NextResponse.json({ error: "No fue posible obtener la semilla diaria." }, { status: 500 });
    const { data: runs } = await admin.from("rift_runs").select("user_id, score, completed_at").eq("mode", "daily").eq("seed", activeSeed).eq("status", "completed").order("score", { ascending: false }).order("completed_at", { ascending: true }).limit(20);
    const ids = Array.from(new Set((runs ?? []).map((run) => run.user_id)));
    const { data: profiles } = ids.length ? await admin.from("profiles").select("id, handle").in("id", ids).eq("visibility", "public") : { data: [] as Array<{ id: string; handle: string }> };
    const handles = new Map((profiles ?? []).map((profile) => [profile.id, profile.handle]));
    const leaderboard = (runs ?? []).filter((run) => handles.has(run.user_id)).slice(0, 10).map((run, index) => ({ rank: index + 1, handle: handles.get(run.user_id), score: run.score, completedAt: run.completed_at }));
    return NextResponse.json({ day, seed: activeSeed, leaderboard });
  } catch {
    return NextResponse.json({ error: "El Rift online no está configurado." }, { status: 503 });
  }
}