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
    const [{ count: collectionCount }, { count: completedRuns }, { data: badges }, { data: preferences }] = await Promise.all([
      admin.from("user_digimon").select("*", { count: "exact", head: true }).eq("user_id", profile.id),
      admin.from("rift_runs").select("*", { count: "exact", head: true }).eq("user_id", profile.id).eq("status", "completed"),
      admin.from("tamer_badges").select("badge_id,awarded_at,badge:badge_id(slug,name,rarity,emblem)").eq("user_id", profile.id).order("awarded_at", { ascending: false }).limit(20),
      admin.from("tamer_badge_preferences").select("show_badges,featured_badge_ids").eq("user_id", profile.id).maybeSingle(),
    ]);
    const visibleBadges = preferences?.show_badges === false ? [] : (preferences?.featured_badge_ids?.length ? (badges ?? []).filter((badge) => preferences.featured_badge_ids.includes(badge.badge_id)) : (badges ?? []).slice(0, 8));
    return NextResponse.json({ profile: { handle: profile.handle, avatarUrl: profile.avatar_url, bio: profile.bio, joinedAt: profile.created_at, collectionCount: collectionCount ?? 0, completedRuns: completedRuns ?? 0, badges: visibleBadges } });
  } catch { return NextResponse.json({ error: "El perfil público no está configurado." }, { status: 503 }); }
}

