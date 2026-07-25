import { NextResponse } from "next/server";
import { moderationDecisionSchema } from "@/features/community/application/community-schemas";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { awardBadges } from "@/features/badges/application/award-badges";

export const runtime = "nodejs";

async function requireModerator() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return profile?.role === "moderator" || profile?.role === "admin" ? user : null;
}

export async function GET(request: Request) {
  const user = await requireModerator();
  if (!user) return NextResponse.json({ error: "Moderador requerido." }, { status: 403 });
  const status = new URL(request.url).searchParams.get("status") ?? "pending";
  if (!["pending", "changes_requested", "approved", "rejected"].includes(status)) return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("appearance_suggestions").select("id, dapi_id, series_id, season, character_name, kind, explanation, status, moderator_note, submitted_by, created_at, sources:appearance_suggestion_sources(id, url, title, note), series:series_id(name, slug)").eq("status", status).order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: "No fue posible cargar la cola." }, { status: 500 });
  return NextResponse.json({ suggestions: data });
}

export async function PATCH(request: Request) {
  const actor = await requireModerator();
  if (!actor) return NextResponse.json({ error: "Moderador requerido." }, { status: 403 });
  const input = moderationDecisionSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Decisión inválida.", details: input.error.flatten() }, { status: 400 });
  const admin = createSupabaseAdminClient();
  const { data: suggestion, error: readError } = await admin.from("appearance_suggestions").select("*").eq("id", input.data.suggestionId).single();
  if (readError || !suggestion) return NextResponse.json({ error: "Sugerencia no encontrada." }, { status: 404 });
  const { data: sources } = await admin.from("appearance_suggestion_sources").select("url, title, note").eq("suggestion_id", suggestion.id);
  let appearanceId: string | null = null;
  if (input.data.decision === "approved") {
    const { data: appearance, error: appearanceError } = await admin.from("digimon_appearances").insert({ dapi_id: suggestion.dapi_id, series_id: suggestion.series_id, season: suggestion.season, character_name: suggestion.character_name, kind: suggestion.kind, status: "approved", submitted_by: suggestion.submitted_by, approved_by: actor.id, approved_at: new Date().toISOString() }).select("id").single();
    if (appearanceError || !appearance) return NextResponse.json({ error: "No fue posible publicar la aparición. Revisa si ya existe." }, { status: 409 });
    appearanceId = appearance.id;
    if (sources?.length) {
      const { error: sourcesError } = await admin.from("appearance_sources").insert(sources.map((source) => ({ appearance_id: appearance.id, ...source, submitted_by: suggestion.submitted_by, is_verified: true })));
      if (sourcesError) return NextResponse.json({ error: "La aparición fue creada, pero sus fuentes no pudieron copiarse." }, { status: 500 });
    }
  }
  const after = { status: input.data.decision, moderator_note: input.data.note ?? null, moderated_by: actor.id, moderated_at: new Date().toISOString() };
  const { error: updateError } = await admin.from("appearance_suggestions").update(after).eq("id", suggestion.id);
  if (updateError) return NextResponse.json({ error: "No fue posible registrar la decisión." }, { status: 500 });
  await admin.from("moderation_audit_log").insert({ actor_id: actor.id, entity_type: "appearance_suggestion", entity_id: suggestion.id, action: input.data.decision, before_state: suggestion, after_state: { ...after, appearance_id: appearanceId }, reason: input.data.note ?? null });
  await admin.from("notifications").insert({ user_id: suggestion.submitted_by, kind: "moderation", title: input.data.decision === "approved" ? "Aparición publicada" : "Actualización de tu propuesta", body: input.data.decision === "approved" ? "Tu propuesta fue verificada y ya aparece en el archivo comunitario." : input.data.decision === "changes_requested" ? "El staff solicitó cambios en tu propuesta." : "Tu propuesta no fue aprobada en esta revisión.", href: "/#comunidad" });
  if (input.data.decision === "approved") await awardBadges(admin, { userId: suggestion.submitted_by, key: "appearance_verified", sourceId: suggestion.id });
  return NextResponse.json({ suggestionId: suggestion.id, status: input.data.decision, appearanceId });
}
