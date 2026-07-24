import { NextResponse } from "next/server";
import { signInSchema } from "@/features/auth/application/credentials-schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const input = signInSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Datos de acceso inválidos.", details: input.error.flatten() }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(input.data);
  if (error) return NextResponse.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });
  return NextResponse.json({ userId: data.user.id });
}