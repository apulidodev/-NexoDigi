import { NextResponse } from "next/server";
import { reportSchema } from "@/features/community/application/community-schemas";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const input = reportSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Reporte inválido." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const { error } = await supabase.from("content_reports").insert({ reporter_id: user.id, target_type: input.data.targetType, target_id: input.data.targetId, reason: input.data.reason, details: input.data.details ?? null });
  if (error?.code === "23505") return NextResponse.json({ error: "Ya reportaste este contenido." }, { status: 409 });
  if (error) return NextResponse.json({ error: "No fue posible enviar el reporte." }, { status: 500 });
  return NextResponse.json({ reported: true }, { status: 201 });
}