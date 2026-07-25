import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
const eventKey = z.enum(["collection_saved", "scan_completed", "rift_completed", "appearance_proposed", "appearance_verified", "boss_damage", "season_completed"]);
const schema = z.object({ slug: z.string().trim().regex(/^[a-z0-9-]+$/), name: z.string().trim().min(3).max(80), tagline: z.string().trim().min(3).max(90), description: z.string().trim().min(3).max(280), category: z.enum(["archive", "community", "rift", "season"]), rarity: z.enum(["common", "rare", "epic", "legendary"]), emblem: z.enum(["signal", "radar", "archive", "voice", "rift", "core", "crown", "eclipse"]), eventKey, targetValue: z.number().int().min(1).max(1000000), seasonSlug: z.string().trim().regex(/^[a-z0-9-]+$/).nullable() });
async function staff() { const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return null; const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(); return profile?.role === "admin" || profile?.role === "moderator" ? user : null; }

export async function GET() { if (!await staff()) return NextResponse.json({ error: "Moderador requerido." }, { status: 403 }); const admin = createSupabaseAdminClient(); const [badges, seasons] = await Promise.all([admin.from("badge_definitions").select("id,slug,name,tagline,description,category,rarity,emblem,event_key,target_value,season_slug,is_visible").order("created_at", { ascending: false }), admin.from("challenge_seasons").select("slug,title,status").order("starts_at", { ascending: false })]); return NextResponse.json({ badges: badges.data ?? [], seasons: seasons.data ?? [] }); }

export async function POST(request: Request) { const user = await staff(); if (!user) return NextResponse.json({ error: "Moderador requerido." }, { status: 403 }); const input = schema.safeParse(await request.json().catch(() => null)); if (!input.success) return NextResponse.json({ error: "Revisa los campos de la insignia." }, { status: 400 }); const admin = createSupabaseAdminClient(); const { error } = await admin.from("badge_definitions").insert({ slug: input.data.slug, name: input.data.name, tagline: input.data.tagline, description: input.data.description, category: input.data.category, rarity: input.data.rarity, emblem: input.data.emblem, event_key: input.data.eventKey, target_value: input.data.targetValue, season_slug: input.data.seasonSlug }); if (error) return NextResponse.json({ error: "No fue posible crear la insignia. El slug debe ser único." }, { status: 409 }); await admin.from("security_audit_events").insert({ user_id: user.id, category: "moderation", action: "create_badge", metadata: input.data }); return NextResponse.json({ ok: true }, { status: 201 }); }

const patch = z.union([
  z.object({ id: z.string().uuid(), action: z.enum(["archive", "restore"]) }),
  z.object({ id: z.string().uuid(), action: z.literal("update"), values: schema }),
]);
export async function PATCH(request: Request) {
  const user = await staff();
  if (!user) return NextResponse.json({ error: "Moderador requerido." }, { status: 403 });
  const input = patch.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
  const admin = createSupabaseAdminClient();
  let error: { message: string } | null = null;
  if (input.data.action === "update") ({ error } = await admin.from("badge_definitions").update({ slug: input.data.values.slug, name: input.data.values.name, tagline: input.data.values.tagline, description: input.data.values.description, category: input.data.values.category, rarity: input.data.values.rarity, emblem: input.data.values.emblem, event_key: input.data.values.eventKey, target_value: input.data.values.targetValue, season_slug: input.data.values.seasonSlug }).eq("id", input.data.id));
  else ({ error } = await admin.from("badge_definitions").update({ is_visible: input.data.action === "restore" }).eq("id", input.data.id));
  if (error) return NextResponse.json({ error: "No fue posible actualizar la insignia." }, { status: 500 });
  await admin.from("security_audit_events").insert({ user_id: user.id, category: "moderation", action: `${input.data.action}_badge`, metadata: input.data });
  return NextResponse.json({ ok: true });
}
