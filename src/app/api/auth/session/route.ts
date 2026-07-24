import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ user: null });
  const { data: profile } = await supabase.from("profiles").select("handle, avatar_url, role, visibility").eq("id", user.id).maybeSingle();
  return NextResponse.json({ user: { id: user.id, email: user.email, profile } });
}