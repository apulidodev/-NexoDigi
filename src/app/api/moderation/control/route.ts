import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function staff() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return profile?.role === "moderator" || profile?.role === "admin" ? user : null;
}

const slug = z.string().trim().regex(/^[a-z0-9-]+$/, "El slug sólo acepta minúsculas, números y guiones.");
const dates = { startsAt: z.string().datetime(), endsAt: z.string().datetime() };
const seasonInput = z.object({ slug, title: z.string().trim().min(3).max(100), ...dates });
const challengeInput = z.object({
  seasonId: z.string().uuid().nullable(), slug, title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(3).max(500), goalLabel: z.string().trim().min(3).max(80),
  targetValue: z.number().int().min(1).max(100000),
  goalKey: z.enum(["collection_saved", "rift_completed", "appearance_proposed"]), ...dates,
});
const bossInput = z.object({ slug, title: z.string().trim().min(3).max(120), maxHp: z.number().int().min(100).max(100000000), ...dates });
const createSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("season"), ...seasonInput.shape }),
  z.object({ kind: z.literal("challenge"), ...challengeInput.shape }),
  z.object({ kind: z.literal("boss"), ...bossInput.shape }),
]);

function validDates(input: { startsAt: string; endsAt: string }) {
  return new Date(input.endsAt).getTime() > new Date(input.startsAt).getTime();
}

export async function GET() {
  if (!await staff()) return NextResponse.json({ error: "Moderador requerido." }, { status: 403 });
  const admin = createSupabaseAdminClient();
  const [seasons, challenges, bosses, audit] = await Promise.all([
    admin.from("challenge_seasons").select("id,slug,title,status,starts_at,ends_at").order("starts_at", { ascending: false }).limit(30),
    admin.from("challenge_definitions").select("id,slug,title,description,goal_label,goal_key,target_value,starts_at,ends_at,is_published,season:season_id(id,title)").order("starts_at", { ascending: false }).limit(40),
    admin.from("rift_global_boss_events").select("id,slug,title,max_hp,current_hp,status,starts_at,ends_at").order("starts_at", { ascending: false }).limit(30),
    admin.from("security_audit_events").select("id,category,action,metadata,created_at").order("created_at", { ascending: false }).limit(24),
  ]);
  return NextResponse.json({ seasons: seasons.data ?? [], challenges: challenges.data ?? [], bosses: bosses.data ?? [], audit: audit.data ?? [] });
}

export async function POST(request: Request) {
  const user = await staff();
  if (!user) return NextResponse.json({ error: "Moderador requerido." }, { status: 403 });
  const input = createSchema.safeParse(await request.json().catch(() => null));
  if (!input.success || !validDates(input.success ? input.data : { startsAt: "", endsAt: "" })) return NextResponse.json({ error: "Revisa los campos y asegúrate de que el final sea posterior al inicio." }, { status: 400 });
  const admin = createSupabaseAdminClient();
  let error: { message: string } | null = null;
  if (input.data.kind === "season") ({ error } = await admin.from("challenge_seasons").insert({ slug: input.data.slug, title: input.data.title, starts_at: input.data.startsAt, ends_at: input.data.endsAt, status: "active" }));
  if (input.data.kind === "challenge") ({ error } = await admin.from("challenge_definitions").insert({ slug: input.data.slug, title: input.data.title, description: input.data.description, goal_label: input.data.goalLabel, goal_key: input.data.goalKey, target_value: input.data.targetValue, starts_at: input.data.startsAt, ends_at: input.data.endsAt, is_published: true, season_id: input.data.seasonId, created_by: user.id }));
  if (input.data.kind === "boss") ({ error } = await admin.from("rift_global_boss_events").insert({ slug: input.data.slug, title: input.data.title, max_hp: input.data.maxHp, current_hp: input.data.maxHp, starts_at: input.data.startsAt, ends_at: input.data.endsAt, status: "active", created_by: user.id }));
  if (error) return NextResponse.json({ error: "No fue posible publicar. El slug debe ser único y las fechas válidas." }, { status: 409 });
  await admin.from("security_audit_events").insert({ user_id: user.id, category: "moderation", action: `create_${input.data.kind}`, metadata: input.data });
  return NextResponse.json({ ok: true }, { status: 201 });
}

const archiveSchema = z.object({ action: z.enum(["archive", "restore"]), resource: z.enum(["season", "challenge", "boss"]), id: z.string().uuid() });
const updateSchema = z.discriminatedUnion("resource", [
  z.object({ action: z.literal("update"), resource: z.literal("season"), id: z.string().uuid(), values: seasonInput }),
  z.object({ action: z.literal("update"), resource: z.literal("challenge"), id: z.string().uuid(), values: challengeInput }),
  z.object({ action: z.literal("update"), resource: z.literal("boss"), id: z.string().uuid(), values: bossInput }),
]);
const patchSchema = z.union([archiveSchema, updateSchema]);

export async function PATCH(request: Request) {
  const user = await staff();
  if (!user) return NextResponse.json({ error: "Moderador requerido." }, { status: 403 });
  const input = patchSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Acción o datos inválidos." }, { status: 400 });
  const admin = createSupabaseAdminClient();
  const data = input.data;
  if (data.action === "update") {
    if (!validDates(data.values)) return NextResponse.json({ error: "La fecha de finalización debe ser posterior al inicio." }, { status: 400 });
    let error: { message: string } | null = null;
    if (data.resource === "season") ({ error } = await admin.from("challenge_seasons").update({ slug: data.values.slug, title: data.values.title, starts_at: data.values.startsAt, ends_at: data.values.endsAt }).eq("id", data.id));
    if (data.resource === "challenge") ({ error } = await admin.from("challenge_definitions").update({ slug: data.values.slug, title: data.values.title, description: data.values.description, goal_label: data.values.goalLabel, goal_key: data.values.goalKey, target_value: data.values.targetValue, season_id: data.values.seasonId, starts_at: data.values.startsAt, ends_at: data.values.endsAt }).eq("id", data.id));
    if (data.resource === "boss") {
      const { data: existing } = await admin.from("rift_global_boss_events").select("current_hp").eq("id", data.id).maybeSingle();
      if (existing && data.values.maxHp < existing.current_hp) return NextResponse.json({ error: "El HP máximo no puede ser menor a la vida actual del jefe." }, { status: 400 });
      ({ error } = await admin.from("rift_global_boss_events").update({ slug: data.values.slug, title: data.values.title, max_hp: data.values.maxHp, starts_at: data.values.startsAt, ends_at: data.values.endsAt }).eq("id", data.id));
    }
    if (error) return NextResponse.json({ error: "No fue posible guardar los cambios. Verifica que el slug no esté en uso." }, { status: 409 });
    await admin.from("security_audit_events").insert({ user_id: user.id, category: "moderation", action: `update_${data.resource}`, metadata: data });
    return NextResponse.json({ ok: true, message: "Cambios guardados." });
  }
  let error: { message: string } | null = null;
  const active = data.action === "restore";
  if (data.resource === "season") ({ error } = await admin.from("challenge_seasons").update({ status: active ? "active" : "ended" }).eq("id", data.id));
  if (data.resource === "challenge") ({ error } = await admin.from("challenge_definitions").update({ is_published: active }).eq("id", data.id));
  if (data.resource === "boss") ({ error } = await admin.from("rift_global_boss_events").update({ status: active ? "active" : "ended" }).eq("id", data.id));
  if (error) return NextResponse.json({ error: "No fue posible actualizar el estado del recurso." }, { status: 500 });
  await admin.from("security_audit_events").insert({ user_id: user.id, category: "moderation", action: `${data.action}_${data.resource}`, metadata: data });
  return NextResponse.json({ ok: true, message: active ? "Recurso restaurado y visible nuevamente." : "Recurso archivado. Su historial se conserva." });
}
