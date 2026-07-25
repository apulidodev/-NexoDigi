import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { awardBadges } from "@/features/badges/application/award-badges";

export const runtime = "nodejs";
const inputSchema = z.object({ actionId: z.string().uuid() });
function hash(value: string) { let result = 2166136261; for (let index = 0; index < value.length; index += 1) { result ^= value.charCodeAt(index); result = Math.imul(result, 16777619); } return result >>> 0; }

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const input = inputSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
  const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Inicia sesión para atacar al jefe global." }, { status: 401 });
  const { slug } = await params; const admin = createSupabaseAdminClient(); const now = new Date().toISOString();
  const { data: event } = await admin.from("rift_global_boss_events").select("id, current_hp, max_hp, status, ends_at").eq("slug", slug).eq("status", "active").gte("ends_at", now).maybeSingle();
  if (!event || event.current_hp <= 0) return NextResponse.json({ error: "El evento ya no está activo." }, { status: 409 });
  const { data: existing } = await admin.from("rift_global_boss_contributions").select("damage").eq("event_id", event.id).eq("action_id", input.data.actionId).maybeSingle();
  if (existing) return NextResponse.json({ damage: existing.damage, currentHp: event.current_hp, idempotent: true });
  const { data: last } = await admin.from("rift_global_boss_contributions").select("created_at").eq("event_id", event.id).eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (last && Date.now() - new Date(last.created_at).getTime() < 12000) return NextResponse.json({ error: "Recarga tu Digivice unos segundos antes de volver a atacar." }, { status: 429 });
  const damage = 32 + (hash(`${event.id}:${user.id}:${input.data.actionId}`) % 49);
  const nextHp = Math.max(0, event.current_hp - damage); const nextStatus = nextHp === 0 ? "defeated" : "active";
  const { error: updateError } = await admin.from("rift_global_boss_events").update({ current_hp: nextHp, status: nextStatus }).eq("id", event.id).eq("current_hp", event.current_hp);
  if (updateError) return NextResponse.json({ error: "El jefe recibió otra señal. Intenta de nuevo." }, { status: 409 });
  const { error: contributionError } = await admin.from("rift_global_boss_contributions").insert({ event_id: event.id, user_id: user.id, action_id: input.data.actionId, damage });
  if (contributionError) return NextResponse.json({ error: "Ataque aplicado; recarga el evento para confirmar." }, { status: 409 });
  await admin.from("security_audit_events").insert({ user_id: user.id, category: "boss", action: "global_attack", metadata: { eventId: event.id, damage, currentHp: nextHp } });
  await awardBadges(admin, { userId: user.id, key: "boss_damage", amount: damage, sourceId: event.id });
  return NextResponse.json({ damage, currentHp: nextHp, maxHp: event.max_hp, defeated: nextHp === 0 });
}
