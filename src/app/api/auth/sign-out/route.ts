import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) return NextResponse.json({ error: "No fue posible cerrar sesión." }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}