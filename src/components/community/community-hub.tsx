"use client";

import Image from "next/image";
import { type FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { DigimonSummary } from "@/features/digimon/domain/digimon";

type Series = { id: number; name: string };
type Appearance = { id: string; season: number | null; character_name: string | null; kind: string; series: { name: string } | null; sources: Array<{ url: string; title: string }>; votes: unknown[] };
type Comment = { id: string; body: string; created_at: string };

export function CommunityHub() {
  const [candidates, setCandidates] = useState<DigimonSummary[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [selected, setSelected] = useState<DigimonSummary | null>(null);
  const [appearances, setAppearances] = useState<Appearance[]>([]);
  const [message, setMessage] = useState("");
  useEffect(() => { void fetch("/api/digimon?page=0&pageSize=8").then((r) => r.json()).then((d: { content: DigimonSummary[] }) => setCandidates(d.content)).catch(() => setMessage("No fue posible cargar señales.")); void fetch("/api/series").then((r) => r.ok ? r.json() : Promise.reject()).then((d: { series: Series[] }) => setSeries(d.series)).catch(() => setMessage("Configura y aplica la migración de comunidad para ver las series.")); }, []);
  useEffect(() => { if (!selected) return; void fetch(`/api/appearances?dapiId=${selected.id}`).then((r) => r.ok ? r.json() : Promise.reject()).then((d: { appearances: Appearance[] }) => setAppearances(d.appearances)).catch(() => setAppearances([])); }, [selected]);
  async function suggest(form: FormData) {
    if (!selected) return;
    setMessage("");
    const response = await fetch("/api/appearances", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dapiId: selected.id, seriesId: Number(form.get("seriesId")), season: form.get("season") ? Number(form.get("season")) : null, characterName: String(form.get("character") || "") || null, kind: String(form.get("kind")), explanation: String(form.get("explanation")), sources: [{ url: String(form.get("sourceUrl")), title: String(form.get("sourceTitle")) }] }) });
    const data = await response.json().catch(() => ({})) as { error?: string };
    setMessage(response.ok ? "Sugerencia enviada a moderación." : data.error ?? "No fue posible enviar la sugerencia.");
  }
  return <div className="mt-7 grid min-w-0 gap-5"><p className="max-w-xl text-sm leading-6 text-[#405065]">Selecciona una señal para consultar sus apariciones verificadas o enviar una propuesta con fuente. Explorar es público; proponer requiere una cuenta Tamer.</p><div className="grid grid-cols-2 gap-2 md:grid-cols-3">{candidates.map((digimon) => <button key={digimon.id} type="button" onClick={() => setSelected(digimon)} className={`min-w-0 rounded-xl border-2 p-2 text-center ${selected?.id === digimon.id ? "border-[#172539] bg-[#fdcc48] shadow-[2px_2px_0_#172539]" : "border-[#172539]/40 bg-[#f7f1e7]"}`}>{digimon.image && <Image src={digimon.image} alt={digimon.name} width={56} height={56} unoptimized className="mx-auto h-12 w-12 max-w-full object-contain" />}<p className="mt-1 truncate font-mono text-[10px] font-black uppercase">{digimon.name}</p></button>)}</div>{selected && <div className="grid min-w-0 gap-5"><div className="min-w-0 rounded-2xl border-2 border-[#172539] bg-[#dcebdc] p-4"><p className="font-mono text-xs font-black uppercase">Apariciones verificadas: {selected.name}</p>{appearances.length ? <ul className="mt-3 space-y-2">{appearances.map((appearance) => <AppearanceItem key={appearance.id} appearance={appearance} />)}</ul> : <p className="mt-3 text-sm text-[#405065]">Aún no hay apariciones aprobadas para esta señal.</p>}</div><form className="min-w-0 rounded-2xl border-2 border-[#172539] bg-white p-4" onSubmit={(event) => { event.preventDefault(); void suggest(new FormData(event.currentTarget)); }}><p className="font-mono text-xs font-black uppercase">Proponer aparición</p><div className="mt-3 grid gap-2"><select name="seriesId" required className="h-10 w-full min-w-0 rounded-lg border-2 border-[#172539] px-2 text-sm"><option value="">Serie</option>{series.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input name="season" type="number" min="1" max="99" placeholder="Temporada (opcional)" className="h-10 w-full min-w-0 rounded-lg border-2 border-[#172539] px-3 text-sm" /><input name="character" maxLength={120} placeholder="Personaje / partner (opcional)" className="h-10 w-full min-w-0 rounded-lg border-2 border-[#172539] px-3 text-sm" /><select name="kind" className="h-10 w-full min-w-0 rounded-lg border-2 border-[#172539] px-2 text-sm"><option value="supporting">Secundario</option><option value="partner">Partner</option><option value="main">Principal</option><option value="cameo">Cameo</option><option value="reference">Referencia</option></select><textarea name="explanation" required minLength={20} maxLength={1500} placeholder="Explica la aparición (20 caracteres mínimo)" className="min-h-20 w-full min-w-0 rounded-lg border-2 border-[#172539] p-3 text-sm" /><input name="sourceTitle" required placeholder="Título de la fuente" className="h-10 w-full min-w-0 rounded-lg border-2 border-[#172539] px-3 text-sm" /><input name="sourceUrl" required type="url" placeholder="https://fuente-verificable..." className="h-10 w-full min-w-0 rounded-lg border-2 border-[#172539] px-3 text-sm" /><Button type="submit">Enviar a moderación</Button></div></form></div>}{message && <p className="font-mono text-xs font-black text-[#d85746]" role="status">{message}</p>}</div>;
}
function AppearanceItem({ appearance }: { appearance: Appearance }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [voted, setVoted] = useState(false);
  const [votes, setVotes] = useState(appearance.votes.length);
  const [message, setMessage] = useState("");
  async function loadComments() {
    const response = await fetch(`/api/appearances/${appearance.id}/comments`);
    const data = await response.json().catch(() => ({})) as { comments?: Comment[]; error?: string };
    setShowComments(true);
    if (response.ok) setComments(data.comments ?? []); else setMessage(data.error ?? "No fue posible cargar comentarios.");
  }
  async function toggleVote() {
    const response = await fetch(`/api/appearances/${appearance.id}/vote`, { method: voted ? "DELETE" : "POST" });
    const data = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) { setMessage(data.error ?? "Inicia sesión para votar."); return; }
    setVoted((current) => !current); setVotes((current) => Math.max(0, current + (voted ? -1 : 1)));
  }
  async function publishComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(`/api/appearances/${appearance.id}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: comment }) });
    const data = await response.json().catch(() => ({})) as { comment?: Comment; error?: string };
    if (!response.ok || !data.comment) { setMessage(data.error ?? "Inicia sesión para comentar."); return; }
    setComments((current) => [...current, data.comment!]); setComment(""); setShowComments(true); setMessage("Comentario publicado.");
  }
  async function report() {
    const response = await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetType: "appearance", targetId: appearance.id, reason: "incorrect", details: "Reporte enviado desde el archivo comunitario." }) });
    const data = await response.json().catch(() => ({})) as { error?: string };
    setMessage(response.ok ? "Reporte enviado al staff." : data.error ?? "Inicia sesión para reportar.");
  }
  return <li className="rounded-xl border border-[#172539]/30 bg-white p-3 text-sm"><strong>{appearance.series?.name}</strong>{appearance.season ? ` · Temp. ${appearance.season}` : ""}{appearance.character_name ? ` · ${appearance.character_name}` : ""}<span className="ml-2 font-mono text-[10px] uppercase">{appearance.kind}</span>{appearance.sources[0] && <a className="mt-1 block text-xs underline" href={appearance.sources[0].url} target="_blank" rel="noreferrer">Fuente: {appearance.sources[0].title}</a>}<div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant={voted ? "inverse" : "outline"} onClick={() => void toggleVote()}>↑ Útil {votes}</Button><Button size="sm" variant="outline" onClick={() => void loadComments()}>{showComments ? "Actualizar comentarios" : "Comentarios"}</Button><Button size="sm" variant="ghost" onClick={() => void report()}>Reportar</Button></div>{showComments && <div className="mt-3 border-t border-[#172539]/20 pt-3"><ul className="space-y-2">{comments.length ? comments.map((item) => <li key={item.id} className="rounded-lg bg-[#f7f1e7] p-2 text-xs">{item.body}</li>) : <li className="text-xs text-[#405065]">Aún no hay comentarios.</li>}</ul><form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={(event) => void publishComment(event)}><input value={comment} onChange={(event) => setComment(event.target.value)} required minLength={1} maxLength={1000} placeholder="Añade contexto o una fuente..." className="h-9 min-w-0 flex-1 rounded-lg border-2 border-[#172539] px-3 text-xs" /><Button size="sm" type="submit">Comentar</Button></form></div>}{message && <p className="mt-2 font-mono text-[10px] font-black text-[#d85746]" role="status">{message}</p>}</li>;
}