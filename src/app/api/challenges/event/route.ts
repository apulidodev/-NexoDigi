import { NextResponse } from "next/server";
import { z } from "zod";
import { awardBadges } from "@/features/badges/application/award-badges";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
const schema = z.object({ key: z.enum(["collection_saved", "rift_completed", "appearance_proposed"]), amount: z.number().int().min(1).max(10).default(1) });

export async function POST(request: Request) {
  const input = schema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Evento inválido." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data: challenges } = await admin.from("challenge_definitions").select("id,target_value,season_id").eq("is_published", true).eq("goal_key", input.data.key).lte("starts_at", now).gte("ends_at", now);
  const completedSeasons = new Set<string>();
  for (const challenge of challenges ?? []) {
    const { data: old } = await admin.from("challenge_progress").select("progress_value").eq("challenge_id", challenge.id).eq("user_id", user.id).maybeSingle();
    const value = Math.min(challenge.target_value, (old?.progress_value ?? 0) + input.data.amount);
    await admin.from("challenge_progress").upsert({ challenge_id: challenge.id, user_id: user.id, progress_value: value, completed_at: value >= challenge.target_value ? now : null }, { onConflict: "challenge_id,user_id" });
    if (value >= challenge.target_value && challenge.season_id) completedSeasons.add(challenge.season_id);
  }
  for (const seasonId of completedSeasons) {
    const [{ data: seasonChallenges }, { data: season }] = await Promise.all([
      admin.from("challenge_definitions").select("id,target_value").eq("season_id", seasonId).eq("is_published", true),
      admin.from("challenge_seasons").select("slug").eq("id", seasonId).maybeSingle(),
    ]);
    const ids = (seasonChallenges ?? []).map((challenge) => challenge.id);
    if (!ids.length || !season) continue;
    const { data: progress } = await admin.from("challenge_progress").select("challenge_id,progress_value").eq("user_id", user.id).in("challenge_id", ids);
    const values = new Map((progress ?? []).map((item) => [item.challenge_id, item.progress_value]));
    if ((seasonChallenges ?? []).every((challenge) => (values.get(challenge.id) ?? 0) >= challenge.target_value)) {
      await awardBadges(admin, { userId: user.id, key: "season_completed", seasonSlug: season.slug, sourceId: seasonId });
    }
  }
  return NextResponse.json({ ok: true, updated: challenges?.length ?? 0 });
}
