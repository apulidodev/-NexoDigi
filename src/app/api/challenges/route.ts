import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: challenges, error } = await supabase.from("challenge_definitions").select("id, slug, title, description, goal_label, target_value, starts_at, ends_at").eq("is_published", true).lte("starts_at", new Date().toISOString()).gte("ends_at", new Date().toISOString()).order("ends_at");
    if (error) return NextResponse.json({ error: "No fue posible cargar los retos." }, { status: 500 });
    let progress: Array<{ challenge_id: string; progress_value: number; completed_at: string | null }> = [];
    if (user && challenges?.length) {
      const { data } = await supabase.from("challenge_progress").select("challenge_id, progress_value, completed_at").eq("user_id", user.id).in("challenge_id", challenges.map((item) => item.id));
      progress = data ?? [];
    }
    const admin = createSupabaseAdminClient();
    const leaderboards = await Promise.all((challenges ?? []).map(async (challenge) => {
      const { data: rows } = await admin.from("challenge_progress").select("user_id, progress_value, completed_at, updated_at").eq("challenge_id", challenge.id).order("progress_value", { ascending: false }).order("updated_at", { ascending: true }).limit(5);
      const ids = (rows ?? []).map((row) => row.user_id);
      const { data: profiles } = ids.length ? await admin.from("profiles").select("id, handle, visibility").in("id", ids).eq("visibility", "public") : { data: [] as Array<{ id: string; handle: string }> };
      const handles = new Map((profiles ?? []).map((profile) => [profile.id, profile.handle]));
      return [challenge.id, (rows ?? []).filter((row) => handles.has(row.user_id)).map((row) => ({ handle: handles.get(row.user_id), progressValue: row.progress_value, completedAt: row.completed_at }))] as const;
    }));
    return NextResponse.json({ challenges: challenges ?? [], progress, leaderboards: Object.fromEntries(leaderboards) });
  } catch {
    return NextResponse.json({ error: "La conexión de retos no está configurada." }, { status: 503 });
  }
}