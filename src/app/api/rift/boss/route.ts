import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const admin = createSupabaseAdminClient();
    const now = new Date().toISOString();
    const { data: event, error } = await admin.from("rift_global_boss_events").select("id, slug, title, max_hp, current_hp, status, starts_at, ends_at").eq("status", "active").lte("starts_at", now).gte("ends_at", now).order("starts_at", { ascending: false }).limit(1).maybeSingle();
    if (error || !event) return NextResponse.json({ event: null, leaderboard: [] });
    const { data: contributions } = await admin.from("rift_global_boss_contributions").select("user_id, damage").eq("event_id", event.id);
    const totals = new Map<string, number>(); for (const item of contributions ?? []) totals.set(item.user_id, (totals.get(item.user_id) ?? 0) + item.damage);
    const ids = [...totals.keys()]; const { data: profiles } = ids.length ? await admin.from("profiles").select("id, handle").in("id", ids).eq("visibility", "public") : { data: [] as Array<{ id: string; handle: string }> };
    const handles = new Map((profiles ?? []).map((profile) => [profile.id, profile.handle]));
    const leaderboard = [...totals.entries()].filter(([id]) => handles.has(id)).map(([id, damage]) => ({ handle: handles.get(id), damage })).sort((a, b) => b.damage - a.damage).slice(0, 5);
    return NextResponse.json({ event, leaderboard });
  } catch { return NextResponse.json({ error: "El evento global no está configurado." }, { status: 503 }); }
}