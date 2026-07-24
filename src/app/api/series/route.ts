import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export const runtime = "nodejs";
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("series").select("id, slug, name").order("sort_order");
    if (error) return NextResponse.json({ error: "No fue posible cargar las series." }, { status: 500 });
    return NextResponse.json({ series: data });
  } catch { return NextResponse.json({ error: "Supabase no está disponible." }, { status: 503 }); }
}