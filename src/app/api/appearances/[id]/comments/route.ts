import { NextResponse } from "next/server";
import { commentSchema } from "@/features/community/application/community-schemas";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("appearance_comments").select("id, user_id, body, created_at, updated_at").eq("appearance_id", id).order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: "No fue posible cargar comentarios." }, { status: 500 });
  return NextResponse.json({ comments: data });
}
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const input = commentSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Comentario inválido." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const { data, error } = await supabase.from("appearance_comments").insert({ appearance_id: id, user_id: user.id, body: input.data.body }).select("id, body, created_at").single();
  if (error) return NextResponse.json({ error: "No fue posible publicar el comentario." }, { status: 500 });
  const { data: appearance } = await supabase.from("digimon_appearances").select("submitted_by").eq("id", id).maybeSingle();
  if (appearance?.submitted_by && appearance.submitted_by !== user.id) await supabase.from("notifications").insert({ user_id: appearance.submitted_by, kind: "comment", title: "Nuevo comentario comunitario", body: "Un Tamer comentó una aparición que propusiste.", href: "/#comunidad" });
  return NextResponse.json({ comment: data }, { status: 201 });
}