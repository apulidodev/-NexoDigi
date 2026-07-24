import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export async function GET(_: Request, { params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  try {
    const admin = createSupabaseAdminClient();
    const { data: profile, error } = await admin.from("profiles").select("id, handle, avatar_url, bio, visibility, role, created_at").eq("handle", handle.toLowerCase()).eq("visibility", "public").maybeSingle();
    if (error) return NextResponse.json({ error: "No fue posible consultar el perfil." }, { status: 500 });
    if (!profile) return NextResponse.json({ error: "Perfil no disponible." }, { status: 404 });
    const [{ count: collectionCount }, { count: completedRuns }] = await Promise.all([admin.from("user_digimon").select("*", { count: "exact", head: true }).eq("user_id", profile.id), admin.from("rift_runs").select("*", { count: "exact", head: true }).eq("user_id", profile.id).eq("status", "completed")]);
    return NextResponse.json({ profile: { handle: profile.handle, avatarUrl: profile.avatar_url, bio: profile.bio, joinedAt: profile.created_at, collectionCount: collectionCount ?? 0, completedRuns: completedRuns ?? 0 } });
  } catch { return NextResponse.json({ error: "El perfil público no está configurado." }, { status: 503 }); }
}