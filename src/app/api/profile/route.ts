import { NextResponse } from "next/server";
import { updateProfileSchema } from "@/features/auth/application/profile-schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const { data, error } = await supabase.from("profiles").select("id, handle, avatar_url, bio, visibility, role, created_at, updated_at").eq("id", user.id).single();
  if (error) return NextResponse.json({ error: "No fue posible obtener el perfil." }, { status: 500 });
  return NextResponse.json({ profile: data });
}

export async function PATCH(request: Request) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const input = updateProfileSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Perfil inválido.", details: input.error.flatten() }, { status: 400 });
  const changes = {
    ...(input.data.handle !== undefined ? { handle: input.data.handle } : {}),
    ...(input.data.avatarUrl !== undefined ? { avatar_url: input.data.avatarUrl } : {}),
    ...(input.data.bio !== undefined ? { bio: input.data.bio } : {}),
    ...(input.data.visibility !== undefined ? { visibility: input.data.visibility } : {}),
  };
  const { data, error } = await supabase.from("profiles").update(changes).eq("id", user.id).select("id, handle, avatar_url, bio, visibility, role, updated_at").single();
  if (error?.code === "23505") return NextResponse.json({ error: "Ese alias ya está ocupado." }, { status: 409 });
  if (error) return NextResponse.json({ error: "No fue posible actualizar el perfil." }, { status: 500 });
  return NextResponse.json({ profile: data });
}