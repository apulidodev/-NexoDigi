"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Profile = { handle: string; avatar_url: string | null; bio: string | null; visibility: "public" | "private"; role: string };

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [message, setMessage] = useState("Cargando perfil...");
  const [saving, setSaving] = useState(false);
  useEffect(() => { void fetch("/api/profile").then((response) => response.json().then((data) => ({ response, data }))).then(({ response, data }: { response: Response; data: { profile?: Profile; error?: string } }) => { if (!response.ok || !data.profile) { setMessage(data.error ?? "Inicia sesión para editar tu perfil."); return; } setProfile(data.profile); setMessage(""); }).catch(() => setMessage("No fue posible cargar el perfil.")); }, []);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!profile) return; setSaving(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ handle: form.get("handle"), avatarUrl: form.get("avatarUrl") || null, bio: form.get("bio") || null, visibility: form.get("visibility") }) });
    const data = await response.json().catch(() => ({})) as { profile?: Profile; error?: string };
    setSaving(false); if (!response.ok || !data.profile) { setMessage(data.error ?? "No fue posible guardar el perfil."); return; } setProfile(data.profile); setMessage("Perfil actualizado.");
  }
  return <main className="min-h-screen bg-[#f7f1e7] px-5 py-12 text-[#172539]"><section className="mx-auto max-w-2xl rounded-[2rem] border-2 border-[#172539] bg-white p-6 shadow-[8px_8px_0_#172539] sm:p-10"><Link href="/#tamer" className="font-mono text-xs font-black uppercase underline">← Volver a consola Tamer</Link><p className="mt-8 font-mono text-xs font-black uppercase tracking-widest text-[#d85746]">Identidad Tamer</p><h1 className="mt-3 font-mono text-3xl font-black uppercase tracking-[-0.06em] sm:text-5xl">Tu perfil</h1><p className="mt-4 leading-7 text-[#405065]">Controla tu alias, información pública y la visibilidad usada en rankings y comunidad.</p>{profile && <form className="mt-7 grid gap-4" onSubmit={(event) => void save(event)}><label className="grid gap-1 font-mono text-[10px] font-black uppercase">Alias<input name="handle" defaultValue={profile.handle} required minLength={3} maxLength={32} pattern="[a-zA-Z0-9_-]+" className="h-11 rounded-xl border-2 border-[#172539] px-3 font-sans text-sm normal-case" /></label><label className="grid gap-1 font-mono text-[10px] font-black uppercase">Avatar URL<input name="avatarUrl" defaultValue={profile.avatar_url ?? ""} type="url" className="h-11 rounded-xl border-2 border-[#172539] px-3 font-sans text-sm normal-case" placeholder="https://..." /></label><label className="grid gap-1 font-mono text-[10px] font-black uppercase">Biografía<textarea name="bio" defaultValue={profile.bio ?? ""} maxLength={280} className="min-h-24 rounded-xl border-2 border-[#172539] p-3 font-sans text-sm normal-case" /></label><label className="grid gap-1 font-mono text-[10px] font-black uppercase">Visibilidad<select name="visibility" defaultValue={profile.visibility} className="h-11 rounded-xl border-2 border-[#172539] px-3 font-sans text-sm normal-case"><option value="public">Público: aparece en rankings y comunidad</option><option value="private">Privado: no aparece en rankings públicos</option></select></label><p className="font-mono text-[10px] font-black uppercase text-[#405065]">Rol actual: {profile.role}</p><Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar perfil"}</Button></form>}{message && <p className="mt-5 rounded-xl border-2 border-[#172539] bg-[#dcebdc] p-3 text-sm" role="status">{message}</p>}</section></main>;
}