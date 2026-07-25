import type { SupabaseClient } from "@supabase/supabase-js";

export type BadgeEventKey = "collection_saved" | "scan_completed" | "rift_completed" | "appearance_proposed" | "appearance_verified" | "boss_damage" | "season_completed";

type AwardInput = { userId: string; key: BadgeEventKey; amount?: number; absolute?: boolean; seasonSlug?: string; sourceId?: string };

export async function awardBadges(admin: SupabaseClient, input: AwardInput) {
  const { data: definitions } = await admin.from("badge_definitions").select("id,slug,name,target_value,season_slug").eq("is_visible", true).eq("event_key", input.key);
  const unlocked: Array<{ slug: string; name: string }> = [];
  for (const badge of definitions ?? []) {
    if (badge.season_slug && badge.season_slug !== input.seasonSlug) continue;
    const { data: old } = await admin.from("tamer_badge_progress").select("progress_value").eq("user_id", input.userId).eq("badge_id", badge.id).maybeSingle();
    const next = Math.min(badge.target_value, input.absolute ? (input.amount ?? 0) : (old?.progress_value ?? 0) + (input.amount ?? 1));
    await admin.from("tamer_badge_progress").upsert({ user_id: input.userId, badge_id: badge.id, progress_value: next }, { onConflict: "user_id,badge_id" });
    if (next < badge.target_value) continue;
    const { data: award } = await admin.from("tamer_badges").upsert({ user_id: input.userId, badge_id: badge.id, source_key: input.key, source_id: input.sourceId ?? null }, { onConflict: "user_id,badge_id", ignoreDuplicates: true }).select("badge_id").maybeSingle();
    if (award) unlocked.push({ slug: badge.slug, name: badge.name });
  }
  if (unlocked.length) await admin.from("notifications").insert(unlocked.map((badge) => ({ user_id: input.userId, kind: "system", title: "Insignia desbloqueada", body: `Obtuviste ${badge.name}. Consulta tu medallero Tamer.`, href: "/#medallas" })));
  return unlocked;
}



