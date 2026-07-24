"use client";

import Image from "next/image";
import { type ChangeEvent, useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InfoHint } from "@/components/ui/info-hint";
import { LocalMigrationButton } from "@/components/tamer/local-migration-button";
import type { Digimon, DigimonSearchFilters, DigimonSummary } from "@/features/digimon/domain/digimon";
import { useCollection } from "@/features/collection/presentation/use-collection";
import { useTamerData } from "@/features/tamer/presentation/use-tamer-data";

const quizIds = [1, 3, 34, 83, 183, 202, 336];
const levelOptions = ["Baby I", "Baby II", "Child", "Adult", "Perfect", "Ultimate", "Armor", "Hybrid"];

function dispatch(name: string, detail?: unknown) { window.dispatchEvent(new CustomEvent(name, { detail })); }

export function TamerConsole() {
  const collection = useCollection();
  const tamer = useTamerData();
  const [message, setMessage] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const hasScannedToday = tamer.history.some((record) => record.scannedAt.startsWith(today));
  const hasQuizToday = tamer.quizCorrectDates.includes(today);
  const missions = [
    { label: "Realiza un escaneo", done: hasScannedToday },
    { label: "Guarda un compañero", done: collection.ids.length > 0 },
    { label: "Forma un equipo de tres", done: tamer.team.length >= 3 },
    { label: "Acierta la trivia diaria", done: hasQuizToday },
  ];
  const achievements = [
    { label: "Primer contacto", done: tamer.history.length >= 1 },
    { label: "Archivo personal", done: collection.ids.length >= 5 },
    { label: "Escuadrón Tamer", done: tamer.team.length >= 3 },
    { label: "Analista digital", done: tamer.quizCorrectDates.length >= 3 },
  ];

  function downloadCollection() {
    const file = new Blob([collection.exportCollection()], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "nexodigi-coleccion.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Colección exportada.");
  }

  async function importCollection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const count = collection.importCollection(await file.text());
      setMessage(`${count} Digimon importados en tu colección.`);
    } catch {
      setMessage("El archivo no tiene un formato de colección válido.");
    } finally {
      event.target.value = "";
    }
  }

  return <section id="tamer" className="border-y-2 border-[#172539] bg-[#f7f1e7] py-20"><div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><Badge className="bg-[#fdcc48]">CONSOLA TAMER LOCAL</Badge><div className="mt-5 flex items-start gap-3"><h2 className="font-mono text-3xl font-black uppercase leading-none tracking-[-0.07em] sm:text-5xl">Tu progreso vive en este dispositivo.</h2><InfoHint className="mt-1" text="Esta consola organiza progreso local: no se sincroniza hasta que exista una cuenta." /></div><p className="mt-4 max-w-2xl leading-7 text-[#405065]">No requiere cuenta: colección, equipo, historial, filtros y notas se guardan solo en este navegador.</p></div><div className="flex flex-wrap items-start gap-2"><LocalMigrationButton collection={collection.ids} team={tamer.team} evoNotes={tamer.evoNotes} savedFilters={tamer.savedFilters} history={tamer.history} quizCorrectDates={tamer.quizCorrectDates} /><Button variant="outline" onClick={downloadCollection}>Exportar colección</Button><label className="inline-flex cursor-pointer items-center justify-center rounded-lg border-2 border-[#172539] bg-white px-3 py-2 font-mono text-xs font-black uppercase shadow-[3px_3px_0_#172539] transition-transform hover:-translate-y-0.5"><input className="sr-only" type="file" accept="application/json" onChange={(event) => void importCollection(event)} />Importar colección</label></div></div>{message && <p className="mt-4 font-mono text-xs font-black text-[#d85746]" aria-live="polite">{message}</p>}<div className="mt-8 grid gap-5 xl:grid-cols-2"><Panel title="Misiones de hoy" description="Se reinician cada día en este navegador."><div className="grid gap-2">{missions.map((mission) => <StatusRow key={mission.label} label={mission.label} done={mission.done} />)}</div></Panel><Panel title="Logros" description="Hitos permanentes de tu exploración local."><div className="grid gap-2">{achievements.map((achievement) => <StatusRow key={achievement.label} label={achievement.label} done={achievement.done} />)}</div></Panel><Panel title={`Equipo Tamer (${tamer.team.length}/6)`} description="Desde una ficha del DigiDex puedes añadir o quitar compañeros."><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{tamer.team.map((member) => <article key={member.id} className="relative rounded-xl border-2 border-[#172539] bg-white p-2 text-center"><button type="button" aria-label={`Quitar a ${member.name} del equipo`} onClick={() => tamer.toggleTeam(member)} className="absolute right-1 top-1 grid size-5 place-items-center rounded-full border border-[#172539] bg-[#f6a595] text-xs">×</button>{member.image && <Image src={member.image} alt="" width={52} height={52} unoptimized className="mx-auto h-11 w-11 object-contain" />}<p className="mt-1 truncate font-mono text-[10px] font-black uppercase">{member.name}</p></article>)}{Array.from({ length: Math.max(0, 6 - tamer.team.length) }).map((_, index) => <div key={index} className="grid min-h-20 place-items-center rounded-xl border-2 border-dashed border-[#172539]/40 font-mono text-[10px] text-[#405065]">ESPACIO</div>)}</div></Panel><Panel title="Historial de escaneos" description="Conserva los últimos 20 escaneos del Digivice.">{tamer.history.length ? <ul className="space-y-2">{tamer.history.slice(0, 5).map((record, index) => <li key={`${record.id}-${record.scannedAt}-${index}`} className="flex items-center justify-between rounded-lg border border-[#172539]/25 bg-white px-3 py-2"><span className="font-mono text-xs font-black uppercase">{record.name}</span><span className="font-mono text-[10px] text-[#405065]">{new Date(record.scannedAt).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}</span></li>)}</ul> : <Empty text="Escanea desde el Digivice para registrar tu primer contacto." />}</Panel><Panel title="Filtros guardados" description="Guarda un filtro desde el DigiDex y recupéralo aquí.">{tamer.savedFilters.length ? <div className="space-y-2">{tamer.savedFilters.map((filter) => <div key={filter.id} className="flex items-center justify-between gap-2 rounded-lg border border-[#172539]/25 bg-white p-2"><button type="button" className="min-w-0 truncate text-left font-mono text-xs font-black uppercase hover:underline" onClick={() => dispatch("nexodigi:apply-filter", filter.filters)}>{describeFilter(filter.filters, filter.label)}</button><button type="button" onClick={() => tamer.removeFilter(filter.id)} className="rounded border border-[#172539] px-2 py-1 font-mono text-[10px]">Quitar</button></div>)}</div> : <Empty text="Aplica un filtro en el DigiDex y usa “Guardar filtro”." />}</Panel><Panel title="Comparador" description="Contrasta dos Digimon consultando DAPI."><ComparePanel /></Panel><Panel title="Trivia de DAPI" description="Pregunta generada con información del archivo oficial."><Trivia onCorrect={tamer.markQuizCorrect} /></Panel></div></div></section>;
}

function Panel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { const reduceMotion = useReducedMotion(); return <motion.article layout initial={reduceMotion ? false : { opacity: 0, y: 14 }} whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} whileHover={reduceMotion ? undefined : { y: -3 }} transition={{ type: "spring", stiffness: 280, damping: 26 }} className="rounded-3xl border-2 border-[#172539] bg-[#dcebdc] p-5 shadow-[5px_5px_0_#172539]"><div className="flex items-start justify-between gap-3"><h3 className="font-mono text-lg font-black uppercase tracking-[-0.05em]">{title}</h3><InfoHint text={description} label={`Información sobre ${title}`} /></div><p className="mt-1 text-sm text-[#405065]">{description}</p><div className="mt-4">{children}</div></motion.article>; }
function StatusRow({ label, done }: { label: string; done: boolean }) { return <div className={`flex items-center gap-3 rounded-lg border-2 border-[#172539] px-3 py-2 font-mono text-xs font-black uppercase ${done ? "bg-[#fdcc48]" : "bg-white"}`}><span className="grid size-5 place-items-center rounded-full border border-[#172539]">{done ? "✓" : "·"}</span>{label}</div>; }
function Empty({ text }: { text: string }) { return <p className="rounded-lg border-2 border-dashed border-[#172539]/35 bg-white/60 p-4 text-sm leading-6 text-[#405065]">{text}</p>; }
function describeFilter(filters: DigimonSearchFilters, fallback: string) { return [filters.name, filters.level, filters.attribute, filters.xAntibody ? "X" : ""].filter(Boolean).join(" · ") || fallback; }

function Trivia({ onCorrect }: { onCorrect: () => void }) {
  const [question, setQuestion] = useState<Digimon | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "correct" | "wrong" | "error">("loading");

  async function loadQuestion() {
    setStatus("loading");
    try {
      const id = quizIds[Math.floor(Math.random() * quizIds.length)];
      const response = await fetch(`/api/digimon/${id}`);
      if (!response.ok) throw new Error("Quiz unavailable");
      setQuestion((await response.json()) as Digimon);
      setStatus("ready");
    } catch { setStatus("error"); }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadQuestion(), 0);
    return () => window.clearTimeout(timer);
  }, []);
  if (status === "loading") return <p className="font-mono text-sm">Preparando pregunta...</p>;
  if (status === "error" || !question) return <Empty text="No fue posible cargar la trivia. Intenta recargar la página." />;
  const options = Array.from(new Set([question.level, ...levelOptions])).slice(0, 5).sort();
  return <div><p className="font-mono text-sm font-black">¿Cuál es el nivel de {question.name}?</p><div className="mt-3 flex flex-wrap gap-2">{options.map((option) => <Button key={option} size="sm" variant={status === "correct" && option === question.level ? "inverse" : "outline"} disabled={status === "correct"} onClick={() => { if (option === question.level) { setStatus("correct"); onCorrect(); } else setStatus("wrong"); }}>{option}</Button>)}</div><div className="mt-3 flex items-center justify-between gap-3"><p className={`font-mono text-xs font-black ${status === "correct" ? "text-[#2b6d4f]" : status === "wrong" ? "text-[#d85746]" : "text-[#405065]"}`}>{status === "correct" ? "Correcto: misión actualizada." : status === "wrong" ? "Aún no. Intenta otra respuesta." : ""}</p><button type="button" onClick={() => void loadQuestion()} className="font-mono text-[10px] font-black uppercase underline">Otra pregunta</button></div></div>;
}
function ComparePanel() {
  const [candidates, setCandidates] = useState<DigimonSummary[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [pair, setPair] = useState<[Digimon, Digimon] | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "comparing" | "error">("loading");

  useEffect(() => {
    void fetch("/api/digimon?page=0&pageSize=8").then((response) => response.ok ? response.json() as Promise<{ content: DigimonSummary[] }> : Promise.reject(new Error("Unavailable"))).then((result) => { setCandidates(result.content); setStatus("ready"); }).catch(() => setStatus("error"));
  }, []);

  function select(id: number) {
    setPair(null);
    setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : current.length < 2 ? [...current, id] : [current[1], id]);
  }

  async function compare() {
    if (selectedIds.length !== 2) return;
    setStatus("comparing");
    try {
      const responses = await Promise.all(selectedIds.map((id) => fetch(`/api/digimon/${id}`)));
      if (responses.some((response) => !response.ok)) throw new Error("Comparison unavailable");
      setPair([(await responses[0].json()) as Digimon, (await responses[1].json()) as Digimon]);
      setStatus("ready");
    } catch { setStatus("error"); }
  }

  return <div><p className="text-sm leading-6 text-[#405065]">Selecciona dos tarjetas para contrastar sus datos.</p><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{candidates.map((digimon) => <button key={digimon.id} type="button" onClick={() => select(digimon.id)} className={`rounded-xl border-2 p-2 text-center transition-transform hover:-translate-y-0.5 ${selectedIds.includes(digimon.id) ? "border-[#172539] bg-[#fdcc48] shadow-[2px_2px_0_#172539]" : "border-[#172539]/40 bg-white"}`}>{digimon.image ? <Image src={digimon.image} alt={digimon.name} width={54} height={54} unoptimized className="mx-auto h-12 w-12 object-contain" /> : <span className="grid h-12 place-items-center font-mono text-[9px]">SIN IMG</span>}<p className="mt-1 truncate font-mono text-[10px] font-black uppercase">{digimon.name}</p></button>)}</div>{status === "loading" && <p className="mt-3 font-mono text-xs">Cargando señales...</p>}{status === "error" && <p className="mt-3 font-mono text-xs text-[#d85746]">No fue posible cargar el comparador.</p>}<div className="mt-4 flex items-center gap-3"><Button size="sm" disabled={selectedIds.length !== 2 || status === "comparing"} onClick={() => void compare()}>{status === "comparing" ? "Comparando..." : `Comparar (${selectedIds.length}/2)`}</Button><span className="font-mono text-[10px] text-[#405065]">Vuelve a pulsar una tarjeta para quitarla.</span></div>{pair && <div className="mt-4 grid grid-cols-2 gap-2">{pair.map((digimon) => <article key={digimon.id} className="rounded-lg border-2 border-[#172539] bg-white p-2 text-center">{digimon.image && <Image src={digimon.image} alt="" width={54} height={54} unoptimized className="mx-auto h-12 w-12 object-contain" />}<p className="mt-1 font-mono text-xs font-black uppercase">{digimon.name}</p><p className="mt-1 text-[11px]">{digimon.level} · {digimon.attribute}</p><p className="text-[11px]">{digimon.type}</p></article>)}</div>}</div>;
}