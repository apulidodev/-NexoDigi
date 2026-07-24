import { NextResponse } from "next/server";
import { signInSchema } from "@/features/auth/application/credentials-schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = signInSchema.safeParse(await request.json().catch(() => null));
    if (!input.success) return NextResponse.json({ error: "Datos de acceso inválidos.", details: input.error.flatten() }, { status: 400 });
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword(input.data);
    if (error) return NextResponse.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });
    return NextResponse.json({ userId: data.user.id });
  } catch {
    return NextResponse.json({ error: "Supabase no está disponible en el servidor. Confirma NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en Vercel y realiza un nuevo deploy." }, { status: 503 });
  }
}