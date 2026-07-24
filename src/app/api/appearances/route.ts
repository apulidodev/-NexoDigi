import { NextResponse } from "next/server";
import { appearanceSuggestionSchema } from "@/features/community/application/community-schemas";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const dapiId = Number(new URL(request.url).searchParams.get("dapiId"));
  if (!Number.isInteger(dapiId) || dapiId <= 0) return NextResponse.json({ error: "dapiId inválido." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("digimon_appearances").select("id, dapi_id, season, character_name, kind, created_at, series:series_id(id, slug, name), sources:appearance_sources(id, url, title, note, is_verified), votes:appearance_votes(count)").eq("dapi_id", dapiId).eq("status", "approved").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "No fue posible consultar las apariciones." }, { status: 500 });
  return NextResponse.json({ appearances: data });
}

export async function POST(request: Request) {
  const input = appearanceSuggestionSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Sugerencia inválida.", details: input.error.flatten() }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Inicia sesión para proponer una aparición." }, { status: 401 });
  const suggestion = input.data;
  const { data, error } = await supabase.from("appearance_suggestions").insert({ submitted_by: user.id, dapi_id: suggestion.dapiId, series_id: suggestion.seriesId, season: suggestion.season ?? null, character_name: suggestion.characterName ?? null, kind: suggestion.kind, explanation: suggestion.explanation }).select("id").single();
  if (error || !data) return NextResponse.json({ error: "No fue posible guardar la sugerencia." }, { status: 500 });
  const { error: sourcesError } = await supabase.from("appearance_suggestion_sources").insert(suggestion.sources.map((source) => ({ suggestion_id: data.id, url: source.url, title: source.title, note: source.note ?? null })));
  if (sourcesError) return NextResponse.json({ error: "La sugerencia se guardó, pero fallaron sus fuentes." }, { status: 500 });
  return NextResponse.json({ suggestionId: data.id }, { status: 201 });
}