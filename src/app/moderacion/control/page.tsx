"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type Kind = "season" | "challenge" | "boss";
type Season = { id: string; slug: string; title: string; status: string; starts_at: string; ends_at: string };
type Challenge = { id: string; slug: string; title: string; description: string; goal_label: string; goal_key: string; target_value: number; starts_at: string; ends_at: string; is_published: boolean; season: { id: string; title: string } | null };
type Boss = { id: string; slug: string; title: string; max_hp: number; current_hp: number; status: string; starts_at: string; ends_at: string };
type Audit = { id: string; category: string; action: string; created_at: string };
type Data = { seasons: Season[]; challenges: Challenge[]; bosses: Boss[]; audit: Audit[] };
type Values = Record<string, string | number | null>;
type Editing = { resource: Kind; id: string; title: string; values: Values };
type Pending = { resource: Kind; id: string; title: string; active: boolean };

const field = "h-11 w-full rounded-lg border-2 border-[#172539] bg-white px-3 text-sm outline-none transition focus:border-[#f36d57]";
const labels: Record<Kind, string> = { season: "temporada", challenge: "reto", boss: "jefe global" };
const goalLabels: Record<string, string> = {
  collection_saved: "Guardar señales en la colección",
  rift_completed: "Completar rutas online de NexoRift",
  appearance_proposed: "Enviar apariciones a la comunidad",
};

function localDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 16);
}
function dateLabel(value: string) {
  return new Date(value).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
}
function toIso(value: FormDataEntryValue | null) {
  return new Date(String(value)).toISOString();
}
function valueOf(values: Values, key: string) {
  const value = values[key];
  return value === null || value === undefined ? "" : String(value);
}

function ResourceFields({ kind, values, seasons }: { kind: Kind; values: Values; seasons: Season[] }) {
  return <>
    <label className="grid gap-1 text-xs font-bold"><span>Título visible</span><input className={field} name="title" required minLength={3} defaultValue={valueOf(values, "title")} placeholder={kind === "boss" ? "Eclipse Protocol" : kind === "season" ? "Temporada del Vínculo" : "Primer vínculo"} /></label>
    <label className="grid gap-1 text-xs font-bold"><span>Slug único</span><input className={field} name="slug" required pattern="[a-z0-9-]+" defaultValue={valueOf(values, "slug")} placeholder="temporada-vinculo" /><small className="font-normal text-[#405065]">Minúsculas, números y guiones; se usa como identificador.</small></label>
    {kind === "challenge" && <>
      <label className="grid gap-1 text-xs font-bold"><span>Acción que cuenta progreso</span><select className={field} name="goalKey" defaultValue={valueOf(values, "goalKey") || "collection_saved"}>{Object.entries(goalLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label className="grid gap-1 text-xs font-bold"><span>Meta numérica</span><input className={field} name="targetValue" required min="1" max="100000" type="number" defaultValue={valueOf(values, "targetValue") || "3"} /><small className="font-normal text-[#405065]">Ejemplo: 3 señales guardadas o 5 rutas completadas.</small></label>
      <label className="grid gap-1 text-xs font-bold"><span>Texto para la meta</span><input className={field} name="goalLabel" required defaultValue={valueOf(values, "goalLabel")} placeholder="Señales estabilizadas" /></label>
      <label className="grid gap-1 text-xs font-bold"><span>Temporada (opcional)</span><select className={field} name="seasonId" defaultValue={valueOf(values, "seasonId")}><option value="">Sin temporada</option>{seasons.map((season) => <option key={season.id} value={season.id}>{season.title}</option>)}</select></label>
      <label className="col-span-full grid gap-1 text-xs font-bold"><span>Qué debe hacer el Tamer</span><textarea className="min-h-24 w-full rounded-lg border-2 border-[#172539] bg-white p-3 text-sm outline-none transition focus:border-[#f36d57]" name="description" required defaultValue={valueOf(values, "description")} placeholder="Guarda tres Digimon en tu colección para estabilizar el enlace inicial." /></label>
    </>}
    {kind === "boss" && <label className="grid gap-1 text-xs font-bold"><span>HP compartido del jefe</span><input className={field} name="maxHp" required min="100" type="number" defaultValue={valueOf(values, "maxHp") || "25000"} /><small className="font-normal text-[#405065]">Toda la comunidad reduce esta misma vida durante el evento.</small></label>}
    <label className="grid gap-1 text-xs font-bold"><span>Inicio</span><input className={field} name="startsAt" required type="datetime-local" defaultValue={valueOf(values, "startsAt")} /></label>
    <label className="grid gap-1 text-xs font-bold"><span>Finalización</span><input className={field} name="endsAt" required type="datetime-local" defaultValue={valueOf(values, "endsAt")} /></label>
  </>;
}

function readValues(form: HTMLFormElement, kind: Kind) {
  const data = new FormData(form);
  const base = { slug: String(data.get("slug")).trim(), title: String(data.get("title")).trim(), startsAt: toIso(data.get("startsAt")), endsAt: toIso(data.get("endsAt")) };
  if (kind === "season") return base;
  if (kind === "boss") return { ...base, maxHp: Number(data.get("maxHp")) };
  return { ...base, seasonId: String(data.get("seasonId")) || null, description: String(data.get("description")).trim(), goalLabel: String(data.get("goalLabel")).trim(), goalKey: String(data.get("goalKey")), targetValue: Number(data.get("targetValue")) };
}

function auditLabel(action: string) {
  const names: Record<string, string> = {
    create_season: "Temporada publicada", update_season: "Temporada editada", archive_season: "Temporada archivada", restore_season: "Temporada restaurada",
    create_challenge: "Reto publicado", update_challenge: "Reto editado", archive_challenge: "Reto archivado", restore_challenge: "Reto restaurado",
    create_boss: "Jefe global publicado", update_boss: "Jefe global editado", archive_boss: "Jefe global archivado", restore_boss: "Jefe global restaurado",
    global_attack: "Ataque al jefe global", server_turn: "Turno online validado",
  };
  return names[action] ?? action.replaceAll("_", " ");
}

export default function ControlPage() {
  const [data, setData] = useState<Data>({ seasons: [], challenges: [], bosses: [], audit: [] });
  const [kind, setKind] = useState<Kind>("season");
  const [message, setMessage] = useState("Cargando recursos de moderación...");
  const [editing, setEditing] = useState<Editing | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);

  const createValues = useMemo<Values>(() => ({ startsAt: "", endsAt: "", targetValue: 3, maxHp: 25000 }), []);
  async function load() {
    const response = await fetch("/api/moderation/control");
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { setMessage(body.error ?? "No fue posible cargar el control."); return; }
    setData(body as Data);
    setMessage("");
  }
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, []);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const response = await fetch("/api/moderation/control", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, ...readValues(event.currentTarget, kind) }) });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    setMessage(response.ok ? `${labels[kind][0].toUpperCase()}${labels[kind].slice(1)} publicada correctamente.` : body.error ?? "No fue posible publicar.");
    if (response.ok) { event.currentTarget.reset(); await load(); }
  }
  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setBusy(true);
    const response = await fetch("/api/moderation/control", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update", resource: editing.resource, id: editing.id, values: readValues(event.currentTarget, editing.resource) }) });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    setMessage(response.ok ? "Cambios guardados y registrados en la auditoría." : body.error ?? "No fue posible guardar los cambios.");
    if (response.ok) { setEditing(null); await load(); }
  }
  async function changeStatus() {
    if (!pending) return;
    setBusy(true);
    const action = pending.active ? "archive" : "restore";
    const response = await fetch("/api/moderation/control", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, resource: pending.resource, id: pending.id }) });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    setPending(null);
    setMessage(response.ok ? body.message : body.error ?? "No fue posible cambiar el estado.");
    if (response.ok) await load();
  }

  function editSeason(item: Season) { setEditing({ resource: "season", id: item.id, title: item.title, values: { title: item.title, slug: item.slug, startsAt: localDate(item.starts_at), endsAt: localDate(item.ends_at) } }); }
  function editChallenge(item: Challenge) { setEditing({ resource: "challenge", id: item.id, title: item.title, values: { title: item.title, slug: item.slug, description: item.description, goalLabel: item.goal_label, goalKey: item.goal_key, targetValue: item.target_value, seasonId: item.season?.id ?? "", startsAt: localDate(item.starts_at), endsAt: localDate(item.ends_at) } }); }
  function editBoss(item: Boss) { setEditing({ resource: "boss", id: item.id, title: item.title, values: { title: item.title, slug: item.slug, maxHp: item.max_hp, startsAt: localDate(item.starts_at), endsAt: localDate(item.ends_at) } }); }

  return <main className="min-h-screen bg-[#f7f1e7] px-4 py-8 text-[#172539] sm:px-6">
    <section className="mx-auto max-w-6xl">
      <Link href="/moderacion" className="font-mono text-xs font-black uppercase underline underline-offset-4">← Volver a moderación</Link>
      <header className="mt-5 rounded-3xl border-2 border-[#172539] bg-[#fdcc48] p-6 shadow-[7px_7px_0_#172539] sm:p-8">
        <p className="font-mono text-xs font-black uppercase tracking-[.12em]">Panel staff · configuración de eventos</p>
        <h1 className="mt-3 font-mono text-3xl font-black uppercase sm:text-5xl">Temporadas, retos y jefes.</h1>
        <p className="mt-4 max-w-3xl text-sm leading-6">Crea actividades con objetivos claros, modifica lo necesario y archiva sin borrar datos. Todo cambio queda visible en el registro de auditoría.</p>
      </header>

      <section className="mt-7 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border-2 border-[#172539] bg-white p-5 shadow-[4px_4px_0_#172539]"><p className="font-mono text-xs font-black uppercase text-[#f36d57]">01 · temporada</p><h2 className="mt-2 font-mono text-lg font-black uppercase">Agrupa el calendario</h2><p className="mt-2 text-sm leading-5">Define cuándo inicia y termina una etapa; los retos pueden pertenecer a ella.</p></article>
        <article className="rounded-2xl border-2 border-[#172539] bg-[#dcebdc] p-5 shadow-[4px_4px_0_#172539]"><p className="font-mono text-xs font-black uppercase text-[#f36d57]">02 · reto</p><h2 className="mt-2 font-mono text-lg font-black uppercase">Mide una acción real</h2><p className="mt-2 text-sm leading-5">Eliges la acción y la cantidad. El portal actualiza el avance automáticamente.</p></article>
        <article className="rounded-2xl border-2 border-[#172539] bg-[#172539] p-5 text-white shadow-[4px_4px_0_#f36d57]"><p className="font-mono text-xs font-black uppercase text-[#fdcc48]">03 · jefe global</p><h2 className="mt-2 font-mono text-lg font-black uppercase">Un HP para todos</h2><p className="mt-2 text-sm leading-5 text-slate-200">Los Tamer atacan una misma vida compartida durante las fechas del evento.</p></article>
      </section>

      {message && <p role="status" className="mt-6 rounded-xl border-2 border-[#172539] bg-white px-4 py-3 text-sm font-semibold shadow-[3px_3px_0_#172539]">{message}</p>}

      <section className="mt-7 rounded-3xl border-2 border-[#172539] bg-[#dcebdc] p-5 shadow-[7px_7px_0_#172539] sm:p-7">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="font-mono text-xs font-black uppercase text-[#f36d57]">Nueva configuración</p><h2 className="mt-1 font-mono text-2xl font-black uppercase">¿Qué deseas publicar?</h2></div><div className="flex rounded-xl border-2 border-[#172539] bg-white p-1">{(["season", "challenge", "boss"] as Kind[]).map((option) => <button key={option} type="button" onClick={() => setKind(option)} className={`rounded-lg px-3 py-2 font-mono text-xs font-black uppercase transition ${kind === option ? "bg-[#172539] text-white" : "hover:bg-[#fdcc48]"}`}>{option === "boss" ? "Jefe" : labels[option]}</button>)}</div></div>
        <p className="mt-3 max-w-3xl text-sm text-[#405065]">{kind === "season" ? "Crea primero la etapa que organizará los retos." : kind === "challenge" ? "Elige una acción medible; cuando el Tamer la realiza, su contador avanzará solo." : "Publica una batalla comunitaria. El daño se comparte en tiempo real entre todos los participantes."}</p>
        <form key={kind} onSubmit={(event) => void create(event)} className="mt-5 grid gap-4 md:grid-cols-2"><ResourceFields kind={kind} values={createValues} seasons={data.seasons.filter((season) => season.status === "active")} /><div className="md:col-span-2"><Button type="submit" disabled={busy}>{busy ? "Publicando..." : `Publicar ${labels[kind]}`}</Button></div></form>
      </section>

      {editing && <section className="mt-7 rounded-3xl border-2 border-[#172539] bg-[#f36d57] p-5 shadow-[7px_7px_0_#172539] sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="font-mono text-xs font-black uppercase">Edición activa</p><h2 className="mt-1 font-mono text-2xl font-black uppercase">Editar: {editing.title}</h2></div><Button variant="inverse" onClick={() => setEditing(null)}>Cancelar edición</Button></div>
        <form key={`${editing.resource}-${editing.id}`} onSubmit={(event) => void saveEdit(event)} className="mt-5 grid gap-4 rounded-2xl border-2 border-[#172539] bg-[#f7f1e7] p-4 md:grid-cols-2"><ResourceFields kind={editing.resource} values={editing.values} seasons={data.seasons} /><div className="md:col-span-2"><Button type="submit" disabled={busy}>{busy ? "Guardando..." : "Guardar cambios"}</Button></div></form>
      </section>}

      <section className="mt-8 grid gap-7 xl:grid-cols-[1.45fr_.8fr]">
        <div className="rounded-3xl border-2 border-[#172539] bg-white p-5 shadow-[7px_7px_0_#172539] sm:p-7"><div className="flex items-center justify-between gap-3"><div><p className="font-mono text-xs font-black uppercase text-[#f36d57]">Recursos configurados</p><h2 className="mt-1 font-mono text-2xl font-black uppercase">Administrar eventos</h2></div><span className="rounded-full border-2 border-[#172539] bg-[#fdcc48] px-3 py-1 font-mono text-xs font-black">{data.seasons.length + data.challenges.length + data.bosses.length} total</span></div>
          <div className="mt-5 space-y-4">
            {data.seasons.map((item) => <ResourceCard key={item.id} title={item.title} type="Temporada" active={item.status === "active"} details={[`Inicio: ${dateLabel(item.starts_at)}`, `Final: ${dateLabel(item.ends_at)}`]} onEdit={() => editSeason(item)} onStatus={() => setPending({ resource: "season", id: item.id, title: item.title, active: item.status === "active" })} pending={pending?.id === item.id ? pending : null} busy={busy} onConfirm={changeStatus} onCancel={() => setPending(null)} />)}
            {data.challenges.map((item) => <ResourceCard key={item.id} title={item.title} type="Reto" active={item.is_published} details={[`${item.target_value} · ${item.goal_label}`, goalLabels[item.goal_key] ?? item.goal_key, item.season?.title ? `Temporada: ${item.season.title}` : "Sin temporada"]} onEdit={() => editChallenge(item)} onStatus={() => setPending({ resource: "challenge", id: item.id, title: item.title, active: item.is_published })} pending={pending?.id === item.id ? pending : null} busy={busy} onConfirm={changeStatus} onCancel={() => setPending(null)} />)}
            {data.bosses.map((item) => <ResourceCard key={item.id} title={item.title} type="Jefe global" active={item.status === "active"} details={[`${item.current_hp.toLocaleString("es-MX")} / ${item.max_hp.toLocaleString("es-MX")} HP`, `Hasta: ${dateLabel(item.ends_at)}`]} onEdit={() => editBoss(item)} onStatus={() => setPending({ resource: "boss", id: item.id, title: item.title, active: item.status === "active" })} pending={pending?.id === item.id ? pending : null} busy={busy} onConfirm={changeStatus} onCancel={() => setPending(null)} />)}
            {!data.seasons.length && !data.challenges.length && !data.bosses.length && <p className="rounded-xl border-2 border-dashed border-[#405065] p-5 text-sm text-[#405065]">Aún no hay recursos. Comienza creando una temporada o un reto.</p>}
          </div>
        </div>
        <aside className="rounded-3xl border-2 border-[#172539] bg-[#172539] p-5 text-white shadow-[7px_7px_0_#f36d57] sm:p-7"><p className="font-mono text-xs font-black uppercase text-[#fdcc48]">Trazabilidad staff</p><h2 className="mt-1 font-mono text-2xl font-black uppercase">Auditoría reciente</h2><p className="mt-3 text-sm leading-5 text-slate-200">Cada publicación, edición, archivo, ataque global y turno online queda registrado aquí.</p><div className="mt-5 space-y-3">{data.audit.map((item) => <div key={item.id} className="rounded-xl border border-slate-500 bg-white/10 p-3"><p className="font-mono text-xs font-black uppercase text-[#fdcc48]">{item.category === "moderation" ? "Moderación" : item.category === "boss" ? "Jefe global" : "NexoRift"}</p><p className="mt-1 text-sm font-bold capitalize">{auditLabel(item.action)}</p><p className="mt-1 text-xs text-slate-300">{dateLabel(item.created_at)}</p></div>)}{!data.audit.length && <p className="rounded-xl border border-dashed border-slate-500 p-4 text-sm text-slate-300">Aún no hay movimientos registrados.</p>}</div></aside>
      </section>
    </section>
  </main>;
}

function ResourceCard({ title, type, active, details, onEdit, onStatus, pending, busy, onConfirm, onCancel }: { title: string; type: string; active: boolean; details: string[]; onEdit: () => void; onStatus: () => void; pending: Pending | null; busy: boolean; onConfirm: () => void; onCancel: () => void }) {
  return <article className={`rounded-2xl border-2 border-[#172539] p-4 ${active ? "bg-[#f7f1e7]" : "bg-slate-100 opacity-80"}`}><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs font-black uppercase text-[#f36d57]">{type}</span><span className={`rounded-full border border-[#172539] px-2 py-0.5 font-mono text-[10px] font-black uppercase ${active ? "bg-[#dcebdc]" : "bg-slate-300"}`}>{active ? "Activo" : "Archivado"}</span></div><h3 className="mt-2 font-mono text-lg font-black uppercase">{title}</h3><div className="mt-2 grid gap-1 text-xs text-[#405065]">{details.map((detail) => <p key={detail}>{detail}</p>)}</div></div><div className="flex shrink-0 gap-2"><Button size="sm" variant="outline" onClick={onEdit}>Editar</Button><Button size="sm" className={active ? "bg-[#f36d57] text-[#172539] hover:bg-[#ff8d7a]" : ""} onClick={onStatus}>{active ? "Archivar" : "Restaurar"}</Button></div></div>{pending && <div className="mt-4 rounded-xl border-2 border-[#172539] bg-[#fdcc48] p-3"><p className="text-sm font-bold">¿{active ? "Archivar" : "Restaurar"} “{title}”?</p><p className="mt-1 text-xs">{active ? "Dejará de estar disponible, pero su historial se conservará." : "Volverá a estar disponible para los Tamer."}</p><div className="mt-3 flex gap-2"><Button size="sm" disabled={busy} onClick={onConfirm}>{busy ? "Procesando..." : "Confirmar"}</Button><Button size="sm" variant="outline" disabled={busy} onClick={onCancel}>Cancelar</Button></div></div>}</article>;
}

