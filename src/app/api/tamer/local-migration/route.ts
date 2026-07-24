import { NextResponse } from "next/server";
import { localMigrationSchema } from "@/features/tamer/application/local-migration-schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const input = localMigrationSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Datos locales inválidos.", details: input.error.flatten() }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const state = input.data;

  if (state.collection.length) {
    const { error } = await supabase.from("user_digimon").upsert(state.collection.map((dapiId) => ({ user_id: user.id, dapi_id: dapiId })), { onConflict: "user_id,dapi_id", ignoreDuplicates: true });
    if (error) return NextResponse.json({ error: "No fue posible sincronizar la colección." }, { status: 500 });
  }
  if (Object.keys(state.evoNotes).length) {
    const { error } = await supabase.from("user_evo_notes").upsert(Object.entries(state.evoNotes).map(([id, note]) => ({ user_id: user.id, dapi_id: Number(id), note })), { onConflict: "user_id,dapi_id" });
    if (error) return NextResponse.json({ error: "No fue posible sincronizar las notas EVO." }, { status: 500 });
  }
  if (state.savedFilters.length) {
    const { error } = await supabase.from("user_saved_filters").upsert(state.savedFilters.map((filter) => ({ user_id: user.id, label: filter.label, filters: filter.filters })), { onConflict: "user_id,label" });
    if (error) return NextResponse.json({ error: "No fue posible sincronizar los filtros." }, { status: 500 });
  }
  if (state.history.length) {
    const { error } = await supabase.from("user_scan_history").upsert(state.history.map((record) => ({ user_id: user.id, dapi_id: record.id, scanned_at: record.scannedAt })), { onConflict: "user_id,dapi_id,scanned_at", ignoreDuplicates: true });
    if (error) return NextResponse.json({ error: "No fue posible sincronizar el historial." }, { status: 500 });
  }

  const { data: team, error: teamError } = await supabase.from("user_teams").upsert({ user_id: user.id, name: "Escuadrón sincronizado", position: 0 }, { onConflict: "user_id,name" }).select("id").single();
  if (teamError || !team) return NextResponse.json({ error: "No fue posible sincronizar el equipo." }, { status: 500 });
  const { error: removeMembersError } = await supabase.from("user_team_members").delete().eq("team_id", team.id);
  if (removeMembersError) return NextResponse.json({ error: "No fue posible actualizar el equipo." }, { status: 500 });
  if (state.team.length) {
    const { error } = await supabase.from("user_team_members").insert(state.team.map((member, position) => ({ team_id: team.id, dapi_id: member.id, position })));
    if (error) return NextResponse.json({ error: "No fue posible guardar los miembros del equipo." }, { status: 500 });
  }
  const { error: progressError } = await supabase.from("user_progress").upsert({ user_id: user.id, achievements: { quizCorrectDates: state.quizCorrectDates }, missions: {} }, { onConflict: "user_id" });
  if (progressError) return NextResponse.json({ error: "No fue posible sincronizar el progreso." }, { status: 500 });

  return NextResponse.json({ migrated: { collection: state.collection.length, team: state.team.length, notes: Object.keys(state.evoNotes).length, filters: state.savedFilters.length, history: state.history.length } });
}