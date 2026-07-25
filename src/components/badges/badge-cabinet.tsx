"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { InfoHint } from "@/components/ui/info-hint";

type Medal = { id: string; slug: string; name: string; tagline: string; description: string; category: string; rarity: "common" | "rare" | "epic" | "legendary"; emblem: string; target_value: number; season_slug: string | null };
type Payload = { badges: Medal[]; awarded: Array<{ badge_id: string; awarded_at: string }>; progress: Array<{ badge_id: string; progress_value: number }>; signedIn: boolean; error?: string };

const colors = {
  common: "from-[#dcebdc] to-[#9fb5b1]",
  rare: "from-[#b9e8fb] to-[#79c8ea]",
  epic: "from-[#fdcc48] to-[#f36d57]",
  legendary: "from-[#fff7af] via-[#fdcc48] to-[#79c8ea]",
};
const symbols: Record<string, string> = { signal: "⌁", radar: "◉", archive: "▤", voice: "✦", rift: "ϟ", core: "◈", crown: "♛", eclipse: "◐" };

export function BadgeCabinet() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  async function loadCabinet() {
    try { const response = await fetch("/api/badges"); setPayload(await response.json() as Payload); }
    catch { setPayload({ badges: [], awarded: [], progress: [], signedIn: false, error: "No fue posible enlazar el medallero." }); }
  }
  async function reconcile() {
    const response = await fetch("/api/badges/reconcile", { method: "POST" });
    const data = await response.json().catch(() => ({})) as { unlocked?: Array<{ name: string }>; error?: string };
    setToast(data.unlocked?.length ? `Insignias recuperadas: ${data.unlocked.map((badge) => badge.name).join(" · ")}` : response.ok ? "Tus hitos anteriores ya están sincronizados." : data.error ?? "No fue posible sincronizar tus hitos.");
    await loadCabinet();
  }
  useEffect(() => {
    const timer = window.setTimeout(() => void loadCabinet(), 0);
    const onAward = (event: Event) => { const detail = (event as CustomEvent<Array<{ name: string }>>).detail; setToast(`Insignia desbloqueada: ${detail.map((badge) => badge.name).join(" · ")}`); void loadCabinet(); };
    window.addEventListener("nexodigi:badge-awarded", onAward);
    return () => { window.clearTimeout(timer); window.removeEventListener("nexodigi:badge-awarded", onAward); };
  }, []);

  const awards = useMemo(() => new Map((payload?.awarded ?? []).map((award) => [award.badge_id, award.awarded_at])), [payload]);
  const progress = useMemo(() => new Map((payload?.progress ?? []).map((entry) => [entry.badge_id, entry.progress_value])), [payload]);
  const total = payload?.badges.length ?? 0;
  const unlocked = awards.size;

  return <section id="medallas" className="border-y-2 border-[#172539] bg-[#79c8ea] py-16"><div className="mx-auto max-w-7xl px-5 lg:px-8">
    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><Badge className="bg-[#fdcc48]">MEDALLERO TAMER</Badge><div className="mt-5 flex items-start gap-3"><h2 className="max-w-3xl font-mono text-3xl font-black uppercase leading-none tracking-[-.07em] sm:text-5xl">Cada señal deja una marca.</h2><InfoHint className="mt-1" text="Las medallas registran hitos verificables: Archivo, comunidad, NexoRift y temporadas. Las de temporada son limitadas a su edición." /></div><p className="mt-4 max-w-2xl leading-7 text-[#173e65]">No son puntos decorativos: cada pieza tiene una meta, una rareza y un origen que queda asociado a tu cuenta Tamer.</p></div><div className="rounded-2xl border-2 border-[#172539] bg-[#172539] px-5 py-4 text-white shadow-[4px_4px_0_#f36d57]"><p className="font-mono text-[10px] font-black uppercase text-[#fdcc48]">Colección de insignias</p><p className="mt-1 font-mono text-3xl font-black">{unlocked} <span className="text-base text-slate-300">/ {total}</span></p></div></div>
    {!payload && <p className="mt-8 font-mono text-sm font-black uppercase">Sincronizando medallero...</p>}
    {payload?.error && <p className="mt-8 rounded-xl border-2 border-[#172539] bg-white p-4 text-sm">{payload.error}</p>}
    {payload && !payload.signedIn && <p className="mt-7 rounded-xl border-2 border-[#172539] bg-[#f7f1e7] p-4 text-sm shadow-[3px_3px_0_#172539]">Explora el catálogo. Inicia sesión como Tamer para guardar el progreso y desbloquear tus propias insignias.</p>}
    {toast && <p role="status" className="mt-5 rounded-xl border-2 border-[#172539] bg-[#fdcc48] p-4 text-sm font-bold shadow-[3px_3px_0_#172539]">{toast}</p>}
    {payload?.signedIn && <button type="button" onClick={() => void reconcile()} className="mt-5 rounded-xl border-2 border-[#172539] bg-white px-4 py-2 font-mono text-xs font-black uppercase shadow-[3px_3px_0_#172539] transition hover:-translate-y-0.5">Sincronizar hitos anteriores</button>}
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{payload?.badges.map((medal) => {
      const wonAt = awards.get(medal.id);
      const current = Math.min(progress.get(medal.id) ?? 0, medal.target_value);
      const selected = open === medal.id;
      return <article key={medal.id} className={`relative overflow-hidden rounded-2xl border-2 border-[#172539] p-4 shadow-[4px_4px_0_#172539] transition ${wonAt ? "bg-[#f7f1e7]" : "bg-white/65"}`}><div className="flex items-start gap-3"><div className={`grid size-14 shrink-0 place-items-center rounded-full border-2 border-[#172539] bg-gradient-to-br ${colors[medal.rarity]} shadow-[3px_3px_0_#172539] ${wonAt ? "" : "grayscale opacity-70"}`}><span className="font-mono text-3xl font-black">{symbols[medal.emblem] ?? "◆"}</span></div><div className="min-w-0"><p className="font-mono text-[10px] font-black uppercase text-[#405065]">{medal.tagline}</p><h3 className="mt-1 font-mono text-base font-black uppercase leading-tight">{medal.name}</h3></div></div><div className="mt-4 flex items-center justify-between gap-3"><span className={`rounded-full border border-[#172539] px-2 py-1 font-mono text-[10px] font-black uppercase ${wonAt ? "bg-[#fdcc48]" : "bg-white"}`}>{wonAt ? "Obtenida" : "En progreso"}</span><button type="button" onClick={() => setOpen(selected ? null : medal.id)} className="font-mono text-[10px] font-black uppercase underline underline-offset-4">{selected ? "Cerrar" : "Ver meta"}</button></div>{selected && <div className="mt-4 rounded-xl border-2 border-[#172539] bg-[#dcebdc] p-3 text-sm"><p>{medal.description}</p><div className="mt-3 h-2 overflow-hidden rounded-full border border-[#172539] bg-white"><div className="h-full bg-[#f36d57] transition-all" style={{ width: `${Math.round((current / medal.target_value) * 100)}%` }} /></div><p className="mt-2 font-mono text-xs font-black">{wonAt ? `Conseguida el ${new Date(wonAt).toLocaleDateString("es-MX")}` : `${current} / ${medal.target_value} ${medal.target_value === 1 ? "acción" : "acciones"}`}</p>{medal.season_slug && <p className="mt-2 font-mono text-[10px] font-black uppercase text-[#d85746]">Edición limitada · no repetible</p>}</div>}</article>;
    })}</div>
  </div></section>;
}





