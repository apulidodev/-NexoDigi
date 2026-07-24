import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
const schema = z.object({ bestNode: z.number().int().min(0).max(5), wins: z.number().int().min(0).max(1_000_000) });

export async function POST(request: Request) {
  const input = schema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Récord local inválido." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const { data: current } = await supabase.from("user_progress").select("achievements, missions").eq("user_id", user.id).maybeSingle();
  const achievements = (current?.achievements ?? {}) as Record<string, unknown>;
  const previous = (achievements.riftLocalRecord ?? {}) as { bestNode?: number; wins?: number };
  const riftLocalRecord = { bestNode: Math.max(Number(previous.bestNode) || 0, input.data.bestNode), wins: Math.max(Number(previous.wins) || 0, input.data.wins), migratedAt: new Date().toISOString() };
  const { error } = await supabase.from("user_progress").upsert({ user_id: user.id, achievements: { ...achievements, riftLocalRecord }, missions: current?.missions ?? {} }, { onConflict: "user_id" });
  if (error) return NextResponse.json({ error: "No fue posible migrar el récord local." }, { status: 500 });
  return NextResponse.json({ record: riftLocalRecord });
}