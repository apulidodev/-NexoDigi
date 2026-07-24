import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
const progressSchema = z.object({ increment: z.number().int().min(1).max(100) });

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const input = progressSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Progreso inválido." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Inicia sesión para registrar progreso." }, { status: 401 });
  const { slug } = await params;
  const now = new Date().toISOString();
  const { data: challenge } = await supabase.from("challenge_definitions").select("id, target_value").eq("slug", slug).eq("is_published", true).lte("starts_at", now).gte("ends_at", now).maybeSingle();
  if (!challenge) return NextResponse.json({ error: "Reto no disponible." }, { status: 404 });
  const { data: current } = await supabase.from("challenge_progress").select("progress_value").eq("challenge_id", challenge.id).eq("user_id", user.id).maybeSingle();
  const progressValue = Math.min(challenge.target_value, (current?.progress_value ?? 0) + input.data.increment);
  const completedAt = progressValue >= challenge.target_value ? now : null;
  const { error } = await supabase.from("challenge_progress").upsert({ challenge_id: challenge.id, user_id: user.id, progress_value: progressValue, completed_at: completedAt }, { onConflict: "challenge_id,user_id" });
  if (error) return NextResponse.json({ error: "No fue posible guardar el progreso." }, { status: 500 });
  return NextResponse.json({ progressValue, completedAt });
}