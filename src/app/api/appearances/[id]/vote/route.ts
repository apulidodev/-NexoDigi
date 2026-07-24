import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const { error } = await supabase.from("appearance_votes").upsert({ appearance_id: id, user_id: user.id }, { onConflict: "appearance_id,user_id", ignoreDuplicates: true });
  if (error) return NextResponse.json({ error: "No fue posible registrar el voto." }, { status: 500 });
  return NextResponse.json({ voted: true });
}
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const { error } = await supabase.from("appearance_votes").delete().eq("appearance_id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "No fue posible retirar el voto." }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}