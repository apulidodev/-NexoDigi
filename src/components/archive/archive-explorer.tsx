"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ArchiveCatalog, ArchiveKind } from "@/features/digimon/domain/digimon";

type ArchiveExplorerProps = { catalogs: ArchiveCatalog[] };
const pageSize = 36;

export function ArchiveExplorer({ catalogs }: ArchiveExplorerProps) {
  const [activeKind, setActiveKind] = useState<ArchiveKind>("attribute");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const activeCatalog = catalogs.find((catalog) => catalog.kind === activeKind) ?? catalogs[0];
  const entries = useMemo(() => activeCatalog.entries.filter((entry) => entry.name.toLowerCase().includes(query.trim().toLowerCase())), [activeCatalog.entries, query]);

  function selectKind(kind: ArchiveKind) {
    setActiveKind(kind);
    setQuery("");
    setVisibleCount(pageSize);
  }

  return <section id="archivo-categorias" className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className="grid gap-7 lg:grid-cols-[0.75fr_1.25fr]"><div><Badge>ARCHIVO DE DATOS</Badge><h2 className="mt-5 font-mono text-3xl font-black uppercase leading-none tracking-[-0.07em] sm:text-5xl">Clasifica cada senal.</h2><p className="mt-5 max-w-md leading-7 text-[#405065]">Explora los catalogos que DAPI entrega: atributos, especies, niveles, campos y tecnicas. La informacion se conserva separada del DigiDex para navegarla con claridad.</p><div className="mt-7 flex flex-wrap gap-2">{catalogs.map((catalog) => <button key={catalog.kind} type="button" onClick={() => selectKind(catalog.kind)} className={`rounded-full border-2 border-[#172539] px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider transition-colors ${activeKind === catalog.kind ? "bg-[#fdcc48]" : "bg-white hover:bg-[#79c8ea]"}`}>{catalog.name} <span className="opacity-60">{catalog.entries.length}</span></button>)}</div></div><div className="rounded-3xl border-2 border-[#172539] bg-white p-5 shadow-[6px_6px_0_#172539]"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-mono text-xs font-black uppercase tracking-widest text-[#d85746]">{activeCatalog.name}</p><p className="mt-2 max-w-xl text-sm leading-6 text-[#405065]">{activeCatalog.description}</p></div><Badge className="shrink-0 bg-[#dcebdc]">{entries.length.toLocaleString("es-MX")} entradas</Badge></div><input value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(pageSize); }} className="mt-5 h-11 w-full rounded-xl border-2 border-[#172539] bg-[#f7f1e7] px-4 font-mono text-sm outline-none focus:ring-2 focus:ring-[#79c8ea]" placeholder={`Buscar en ${activeCatalog.name.toLowerCase()}...`} /><div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3"><>{entries.slice(0, visibleCount).map((entry) => <article key={entry.id} className="rounded-xl border-2 border-[#172539] bg-[#f7f1e7] px-3 py-2 font-mono text-xs font-black uppercase shadow-[2px_2px_0_#172539]"><span className="mr-2 text-[#d85746]">{String(entry.id).padStart(3, "0")}</span>{entry.name}</article>)}</></div>{entries.length === 0 && <p className="mt-6 rounded-xl border-2 border-dashed border-[#172539] p-6 text-center font-mono text-sm">No hay coincidencias.</p>}{visibleCount < entries.length && <div className="mt-6 text-center"><Button variant="outline" onClick={() => setVisibleCount((current) => current + pageSize)}>Ver mas</Button></div>}</div></div></section>;
}