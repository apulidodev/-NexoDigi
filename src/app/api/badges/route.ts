import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: badges, error } = await supabase.from("badge_definitions").select("id,slug,name,tagline,description,category,rarity,emblem,target_value,season_slug").eq("is_visible", true).order("category").order("target_value");
  if (error) return NextResponse.json({ error: "No fue posible cargar las insignias." }, { status: 500 });
  if (!user) return NextResponse.json({ badges: badges ?? [], awarded: [], progress: [], signedIn: false });
  const [awards, progress] = await Promise.all([
    supabase.from("tamer_badges").select("badge_id,awarded_at").eq("user_id", user.id),
    supabase.from("tamer_badge_progress").select("badge_id,progress_value").eq("user_id", user.id),
  ]);
  return NextResponse.json({ badges: badges ?? [], awarded: awards.data ?? [], progress: progress.data ?? [], signedIn: true });
}
