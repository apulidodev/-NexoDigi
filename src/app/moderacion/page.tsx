"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Suggestion = {
  id: string;
  dapi_id: number;
  season: number | null;
  character_name: string | null;
  kind: string;
  explanation: string;
  created_at: string;
  series: { name: string } | null;
  sources: Array<{ id: string; url: string; title: string; note: string | null }>;
};

export default function ModerationPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [message, setMessage] = useState("Cargando cola...");
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const response = await fetch("/api/moderation/suggestions?status=pending");
    const data = await response.json().catch(() => ({})) as { suggestions?: Suggestion[]; error?: string };
    if (!response.ok) { setMessage(data.error ?? "No fue posible cargar la cola."); return; }
    setSuggestions(data.suggestions ?? []);
    setMessage(data.suggestions?.length ? "" : "No hay propuestas pendientes.");
  };

  useEffect(() => { void fetch("/api/moderation/suggestions?status=pending").then((response) => response.json().then((data) => ({ response, data }))).then(({ response, data }: { response: Response; data: { suggestions?: Suggestion[]; error?: string } }) => { if (!response.ok) { setMessage(data.error ?? "No fue posible cargar la cola."); return; } setSuggestions(data.suggestions ?? []); setMessage(data.suggestions?.length ? "" : "No hay propuestas pendientes."); }).catch(() => setMessage("No fue posible cargar la cola.")); }, []);

  const decide = async (suggestionId: string, decision: "approved" | "rejected" | "changes_requested") => {
    setBusy(suggestionId);
    const response = await fetch("/api/moderation/suggestions", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ suggestionId, decision }) });
    const data = await response.json().catch(() => ({})) as { error?: string };
    setBusy(null);
    if (!response.ok) { setMessage(data.error ?? "No fue posible guardar la decisión."); return; }
    setMessage(decision === "approved" ? "Aparición aprobada y publicada." : "Decisión guardada.");
    await load();
  };

  return <main className="min-h-screen bg-[#f7f1e7] px-5 py-12 text-[#172539]"><section className="mx-auto max-w-4xl rounded-[2rem] border-2 border-[#172539] bg-white p-6 shadow-[8px_8px_0_#172539] sm:p-10"><Link href="/#comunidad" className="font-mono text-xs font-black uppercase underline">← Volver a comunidad</Link><p className="mt-8 font-mono text-xs font-black uppercase tracking-[0.16em] text-[#d85746]">Staff NexoDigi</p><h1 className="mt-3 font-mono text-3xl font-black uppercase tracking-[-0.06em] sm:text-5xl">Cola de moderación</h1><p className="mt-4 max-w-2xl leading-7 text-[#405065]">Aprueba solo apariciones con fuente verificable. Cada decisión queda registrada en la bitácora de auditoría.</p>{message && <p className="mt-6 rounded-xl border-2 border-[#172539] bg-[#dcebdc] p-3 font-mono text-xs font-bold" role="status">{message}</p>}<div className="mt-7 grid gap-4">{suggestions.map((item) => <article key={item.id} className="rounded-2xl border-2 border-[#172539] bg-[#f7f1e7] p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-xs font-black uppercase">DAPI #{item.dapi_id} · {item.series?.name ?? "Serie desconocida"}</p><p className="mt-2 text-sm">{item.character_name && `${item.character_name} · `}{item.kind}{item.season ? ` · Temporada ${item.season}` : ""}</p></div><span className="font-mono text-[10px] uppercase text-[#405065]">{new Date(item.created_at).toLocaleDateString("es-MX")}</span></div><p className="mt-4 text-sm leading-6">{item.explanation}</p><ul className="mt-3 space-y-1 text-sm">{item.sources.map((source) => <li key={source.id}><a className="underline" href={source.url} target="_blank" rel="noreferrer">Fuente: {source.title}</a></li>)}</ul><div className="mt-5 flex flex-wrap gap-2"><Button disabled={busy === item.id} onClick={() => void decide(item.id, "approved")}>Aprobar</Button><Button variant="outline" disabled={busy === item.id} onClick={() => void decide(item.id, "changes_requested")}>Pedir cambios</Button><Button variant="outline" disabled={busy === item.id} onClick={() => void decide(item.id, "rejected")}>Rechazar</Button></div></article>)}</div></section></main>;
}