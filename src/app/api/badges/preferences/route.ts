import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
const schema = z.object({ showBadges: z.boolean(), featuredBadgeIds: z.array(z.string().uuid()).max(4) });
async function session() { const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); return { supabase, user }; }

export async function GET() { const { supabase, user } = await session(); if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 }); const { data } = await supabase.from("tamer_badge_preferences").select("show_badges,featured_badge_ids").eq("user_id", user.id).maybeSingle(); return NextResponse.json({ preferences: data ?? { show_badges: true, featured_badge_ids: [] } }); }
export async function PUT(request: Request) { const input = schema.safeParse(await request.json().catch(() => null)); if (!input.success) return NextResponse.json({ error: "Preferencias inválidas." }, { status: 400 }); const { supabase, user } = await session(); if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 }); const { data, error } = await supabase.from("tamer_badge_preferences").upsert({ user_id: user.id, show_badges: input.data.showBadges, featured_badge_ids: input.data.featuredBadgeIds }, { onConflict: "user_id" }).select("show_badges,featured_badge_ids").single(); if (error) return NextResponse.json({ error: "No fue posible guardar las preferencias." }, { status: 500 }); return NextResponse.json({ preferences: data }); }
