import { NextResponse } from "next/server";
import { z } from "zod";
import { enemyMaxHp, resolveRiftAction, type RiftAction, type RiftState } from "@/features/digital-run/application/rift-server-combat";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
const actionSchema = z.object({ actionId: z.string().uuid(), action: z.enum(["pulse", "technique", "guard"]) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const input = actionSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const { id } = await params;
  const admin = createSupabaseAdminClient();
  const { data: known } = await admin.from("rift_run_actions").select("outcome").eq("run_id", id).eq("action_id", input.data.actionId).maybeSingle();
  if (known) return NextResponse.json({ outcome: known.outcome, idempotent: true });
  const { data: run } = await admin.from("rift_runs").select("id, user_id, seed, status, node, player_hp, player_energy, enemy_hp, action_count, score").eq("id", id).maybeSingle();
  if (!run || run.user_id !== user.id) return NextResponse.json({ error: "Ruta no encontrada." }, { status: 404 });
  if (run.status !== "active") return NextResponse.json({ error: "La ruta ya terminó." }, { status: 409 });
  const result = resolveRiftAction({ seed: run.seed, node: run.node, playerHp: run.player_hp, playerEnergy: run.player_energy, enemyHp: run.enemy_hp, actionCount: run.action_count, status: "active", score: run.score } satisfies RiftState, input.data.action as RiftAction);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
  const next = result.state;
  const update = { status: next.status, node: next.node, player_hp: next.playerHp, player_energy: next.playerEnergy, enemy_hp: next.enemyHp, action_count: next.actionCount, score: next.score, completed_at: next.status === "completed" ? new Date().toISOString() : null };
  const { error: writeError } = await admin.from("rift_runs").update(update).eq("id", run.id).eq("action_count", run.action_count);
  if (writeError) return NextResponse.json({ error: "No fue posible registrar la acción." }, { status: 500 });
  const outcome = { ...result, node: next.node, enemyMaxHp: enemyMaxHp(next.seed, next.node) };
  const { error: actionError } = await admin.from("rift_run_actions").insert({ run_id: run.id, user_id: user.id, action_id: input.data.actionId, action: input.data.action, outcome });
  if (actionError) return NextResponse.json({ error: "La acción fue procesada; vuelve a consultar la ruta." }, { status: 409 });
  return NextResponse.json({ outcome, idempotent: false });
}