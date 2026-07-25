import { NextResponse } from "next/server";
import { awardBadges } from "@/features/badges/application/award-badges";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Inicia sesión para sincronizar tus insignias." }, { status: 401 });
  const admin = createSupabaseAdminClient();
  const [{ count: savedCount }, { count: completedRuns }, { count: proposals }, { count: verified }, { count: attacks }] = await Promise.all([
    admin.from("user_digimon").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    admin.from("rift_runs").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "completed"),
    admin.from("appearance_suggestions").select("*", { count: "exact", head: true }).eq("submitted_by", user.id),
    admin.from("appearance_suggestions").select("*", { count: "exact", head: true }).eq("submitted_by", user.id).eq("status", "approved"),
    admin.from("rift_global_boss_contributions").select("*", { count: "exact", head: true }).eq("user_id", user.id),
  ]);
  const snapshot = await admin.from("tamer_sync_snapshots").select("payload").eq("user_id", user.id).maybeSingle();
  const localCollection = Array.isArray((snapshot.data?.payload as { collection?: unknown[] } | null)?.collection) ? (snapshot.data!.payload as { collection: unknown[] }).collection.length : 0;
  const unlocked = (await Promise.all([
    awardBadges(admin, { userId: user.id, key: "collection_saved", amount: Math.max(savedCount ?? 0, localCollection), absolute: true, sourceId: "reconciliation" }),
    awardBadges(admin, { userId: user.id, key: "rift_completed", amount: completedRuns ?? 0, absolute: true, sourceId: "reconciliation" }),
    awardBadges(admin, { userId: user.id, key: "appearance_proposed", amount: proposals ?? 0, absolute: true, sourceId: "reconciliation" }),
    awardBadges(admin, { userId: user.id, key: "appearance_verified", amount: verified ?? 0, absolute: true, sourceId: "reconciliation" }),
    awardBadges(admin, { userId: user.id, key: "boss_damage", amount: attacks ?? 0, absolute: true, sourceId: "reconciliation" }),
  ])).flat();
  return NextResponse.json({ ok: true, unlocked });
}
