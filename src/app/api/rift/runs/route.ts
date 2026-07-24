import { NextResponse } from "next/server";
import { z } from "zod";
import { dailyEnemyId, enemyMaxHp } from "@/features/digital-run/application/rift-server-combat";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
const startSchema = z.object({ dapiId: z.number().int().positive(), mode: z.literal("daily").default("daily") });

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ runs: [] });
  const { data, error } = await supabase.from("rift_runs").select("id, mode, selected_dapi_id, seed, status, node, player_hp, player_energy, enemy_hp, action_count, score, completed_at, updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(10);
  if (error) return NextResponse.json({ error: "No fue posible cargar tus rutas." }, { status: 500 });
  return NextResponse.json({ runs: (data ?? []).map((run) => ({ ...run, enemyDapiId: dailyEnemyId(run.seed, run.node), enemyMaxHp: enemyMaxHp(run.seed, run.node) })) });
}

export async function POST(request: Request) {
  const input = startSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Datos de Rift inválidos." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Inicia sesión para entrar al Rift online." }, { status: 401 });
  const admin = createSupabaseAdminClient();
  const day = new Date().toISOString().slice(0, 10);
  await admin.from("rift_daily_seeds").upsert({ day, seed: crypto.randomUUID() }, { onConflict: "day", ignoreDuplicates: true });
  const { data: daily } = await admin.from("rift_daily_seeds").select("seed").eq("day", day).single();
  if (!daily) return NextResponse.json({ error: "La semilla diaria no está disponible." }, { status: 503 });
  const { data: run, error } = await admin.from("rift_runs").insert({ user_id: user.id, mode: input.data.mode, seed: daily.seed, selected_dapi_id: input.data.dapiId, enemy_hp: enemyMaxHp(daily.seed, 1) }).select("id, mode, selected_dapi_id, seed, status, node, player_hp, player_energy, enemy_hp, action_count, score, updated_at").single();
  if (error || !run) return NextResponse.json({ error: "No fue posible iniciar la ruta online." }, { status: 500 });
  return NextResponse.json({ run: { ...run, enemyMaxHp: enemyMaxHp(daily.seed, 1), enemyDapiId: dailyEnemyId(daily.seed, 1) } }, { status: 201 });
}