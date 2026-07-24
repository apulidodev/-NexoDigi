import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ notifications: [] });
  const { data, error } = await supabase.from("notifications").select("id, kind, title, body, href, read_at, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
  if (error) return NextResponse.json({ error: "No fue posible cargar las notificaciones." }, { status: 500 });
  return NextResponse.json({ notifications: data ?? [] });
}

export async function PATCH(request: Request) {
  const id = (await request.json().catch(() => null) as { id?: string } | null)?.id;
  if (!id) return NextResponse.json({ error: "Notificación inválida." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "No fue posible actualizar la notificación." }, { status: 500 });
  return NextResponse.json({ ok: true });
}