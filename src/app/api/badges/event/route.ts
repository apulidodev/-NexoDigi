import { NextResponse } from "next/server";
import { z } from "zod";
import { awardBadges } from "@/features/badges/application/award-badges";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
const inputSchema = z.object({ key: z.enum(["collection_saved", "scan_completed", "rift_completed", "appearance_proposed", "appearance_verified", "boss_damage", "season_completed"]), amount: z.number().int().min(1).max(100000).default(1), seasonSlug: z.string().regex(/^[a-z0-9-]+$/).optional(), sourceId: z.string().max(120).optional() });

export async function POST(request: Request) {
  const input = inputSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Evento de insignia inválido." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const unlocked = await awardBadges(createSupabaseAdminClient(), { userId: user.id, key: input.data.key, amount: input.data.amount, seasonSlug: input.data.seasonSlug, sourceId: input.data.sourceId });
  return NextResponse.json({ ok: true, unlocked });
}
