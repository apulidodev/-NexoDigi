"use client";

import { FormEvent, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";

type Session = { user: null | { id: string; email?: string; profile: null | { handle: string; role: string } } };
type Mode = "sign-in" | "sign-up";

export function TamerAccess() {
  const [session, setSession] = useState<Session["user"]>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("sign-in");
  useEffect(() => { void fetch("/api/auth/session").then((response) => response.ok ? response.json() as Promise<Session> : { user: null }).then((data) => setSession(data.user)).catch(() => setSession(null)); }, []);
  async function signOut() { await fetch("/api/auth/sign-out", { method: "POST" }); setSession(null); }
  if (session) return <div className="flex items-center gap-2"><span className="hidden max-w-28 truncate font-mono text-[10px] font-black uppercase sm:inline">@{session.profile?.handle ?? "tamer"}</span>{["moderator", "admin"].includes(session.profile?.role ?? "") && <a href="/moderacion" className="hidden rounded-lg border-2 border-[#172539] bg-[#fdcc48] px-2 py-1 font-mono text-[10px] font-black uppercase sm:inline">Staff</a>}<Button size="sm" variant="outline" onClick={() => void signOut()}>Salir</Button></div>;
  return <><Button size="sm" variant="outline" onClick={() => { setMode("sign-in"); setIsOpen(true); }}>Acceso Tamer</Button><AnimatePresence>{isOpen && <AccessDialog mode={mode} onMode={setMode} onClose={() => setIsOpen(false)} onSession={(next) => { setSession(next); setIsOpen(false); }} />}</AnimatePresence></>;
}

function AccessDialog({ mode, onMode, onClose, onSession }: { mode: Mode; onMode: (mode: Mode) => void; onClose: () => void; onSession: (user: NonNullable<Session["user"]>) => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setIsSubmitting(true);
    const form = new FormData(event.currentTarget);
    const body = { email: String(form.get("email") ?? ""), password: String(form.get("password") ?? ""), ...(mode === "sign-up" ? { handle: String(form.get("handle") ?? "") } : {}) };
    try {
      const response = await fetch(`/api/auth/${mode === "sign-up" ? "sign-up" : "sign-in"}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const raw = await response.text();
      let result: { error?: string; needsEmailConfirmation?: boolean } = {};
      try { result = raw ? JSON.parse(raw) as { error?: string; needsEmailConfirmation?: boolean } : {}; } catch { /* Respuesta no JSON. */ }
      if (!response.ok) throw new Error(result.error ?? (raw ? "El servidor devolvió una respuesta no válida." : "El servidor no respondió. Revisa las variables de Supabase en Vercel y el registro de Functions."));
      if (result.needsEmailConfirmation) { setMessage("Revisa tu correo para confirmar tu cuenta y después inicia sesión."); return; }
      const session = await fetch("/api/auth/session").then((value) => value.json() as Promise<Session>);
      if (session.user) onSession(session.user);
    } catch (error) { setMessage(error instanceof Error ? error.message : "No fue posible continuar."); }
    finally { setIsSubmitting(false); }
  }
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-[#172539]/60 p-5" role="dialog" aria-modal="true" aria-labelledby="access-title" onClick={onClose}><motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }} transition={{ type: "spring", stiffness: 330, damping: 28 }} className="w-full max-w-md rounded-3xl border-2 border-[#172539] bg-[#f7f1e7] p-6 shadow-[8px_8px_0_#fdcc48]" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] font-black uppercase tracking-widest text-[#d85746]">Identidad Tamer</p><h2 id="access-title" className="mt-2 font-mono text-3xl font-black uppercase leading-none">{mode === "sign-in" ? "Inicia transmisión" : "Crea tu vínculo"}</h2></div><Button size="sm" variant="ghost" onClick={onClose}>Cerrar</Button></div><form className="mt-6 grid gap-4" onSubmit={(event) => void submit(event)}>{mode === "sign-up" && <label className="grid gap-1 font-mono text-[10px] font-black uppercase">Alias Tamer<input name="handle" required minLength={3} maxLength={32} pattern="[a-zA-Z0-9_-]+" className="h-11 rounded-xl border-2 border-[#172539] bg-white px-3 font-sans text-sm normal-case" placeholder="tai-digital" /></label>}<label className="grid gap-1 font-mono text-[10px] font-black uppercase">Correo<input name="email" required type="email" autoComplete="email" className="h-11 rounded-xl border-2 border-[#172539] bg-white px-3 font-sans text-sm normal-case" placeholder="tamer@ejemplo.com" /></label><label className="grid gap-1 font-mono text-[10px] font-black uppercase">Contraseña<input name="password" required type="password" minLength={10} autoComplete={mode === "sign-in" ? "current-password" : "new-password"} className="h-11 rounded-xl border-2 border-[#172539] bg-white px-3 font-sans text-sm normal-case" placeholder="10 caracteres o más" /></label><Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Conectando..." : mode === "sign-in" ? "Entrar" : "Crear cuenta"}</Button></form>{message && <p className="mt-4 rounded-xl border-2 border-[#172539] bg-white p-3 text-sm text-[#405065]" role="status">{message}</p>}<p className="mt-5 text-center font-mono text-[11px]">{mode === "sign-in" ? "¿Aún no tienes cuenta?" : "¿Ya eres Tamer?"} <button type="button" className="font-black underline" onClick={() => { setMessage(""); onMode(mode === "sign-in" ? "sign-up" : "sign-in"); }}>{mode === "sign-in" ? "Crear cuenta" : "Iniciar sesión"}</button></p></motion.div></motion.div>;
}