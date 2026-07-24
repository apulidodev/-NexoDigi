import { NextResponse } from "next/server";
import { signUpSchema } from "@/features/auth/application/credentials-schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const input = signUpSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Datos de registro inválidos.", details: input.error.flatten() }, { status: 400 });
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.data.email,
    password: input.data.password,
    options: { data: { handle: input.data.handle }, emailRedirectTo: new URL("/auth/callback", origin).toString() },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ userId: data.user?.id ?? null, needsEmailConfirmation: !data.session }, { status: 201 });
}