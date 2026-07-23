"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InfoHint } from "@/components/ui/info-hint";
import type { ArchiveCatalog, ArchiveKind } from "@/features/digimon/domain/digimon";

type ArchiveExplorerProps = { catalogs: ArchiveCatalog[] };

export function ArchiveExplorer({ catalogs }: ArchiveExplorerProps) {
  const reduceMotion = useReducedMotion();
  const [catalogsState, setCatalogsState] = useState(catalogs);
  const [activeKind, setActiveKind] = useState<ArchiveKind>("attribute");
  const [query, setQuery] = useState("");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const activeCatalog = catalogsState.find((catalog) => catalog.kind === activeKind) ?? catalogsState[0];
  const entries = useMemo(
    () => activeCatalog.entries.filter((entry) => entry.name.toLowerCase().includes(query.trim().toLowerCase())),
    [activeCatalog.entries, query],
  );

  function selectKind(kind: ArchiveKind) {
    setActiveKind(kind);
    setQuery("");
  }

  async function loadMore() {
    if (!activeCatalog.hasNextPage || isLoadingMore) return;
    setIsLoadingMore(true);

    try {
      const response = await fetch(`/api/archive/${activeCatalog.kind}?page=${activeCatalog.currentPage + 1}`);
      if (!response.ok) throw new Error("No se pudo cargar el catalogo.");
      const nextCatalog = (await response.json()) as ArchiveCatalog;

      setCatalogsState((current) => current.map((catalog) => {
        if (catalog.kind !== nextCatalog.kind) return catalog;
        const uniqueEntries = Array.from(new Map([...catalog.entries, ...nextCatalog.entries].map((entry) => [entry.id, entry])).values());
        return { ...nextCatalog, entries: uniqueEntries };
      }));
    } finally {
      setIsLoadingMore(false);
    }
  }

  return <section id="archivo-categorias" className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className="grid gap-7 lg:grid-cols-[0.75fr_1.25fr]"><div><Badge>ARCHIVO DE DATOS</Badge><div className="mt-5 flex items-start gap-3"><h2 className="font-mono text-3xl font-black uppercase leading-none tracking-[-0.07em] sm:text-5xl">Explora el archivo de datos.</h2><InfoHint className="mt-1" text="Elige una categoría, busca entre los registros ya cargados y usa Cargar más registros para ampliar el catálogo." /></div><p className="mt-5 max-w-md leading-7 text-[#405065]">Elige una categoria para consultar sus registros oficiales. Los catalogos grandes se cargan por partes para que la exploracion sea rapida.</p><div className="mt-7 flex flex-wrap gap-2">{catalogsState.map((catalog) => <motion.button key={catalog.kind} type="button" onClick={() => selectKind(catalog.kind)} whileHover={reduceMotion ? undefined : { y: -3, scale: 1.02 }} whileTap={reduceMotion ? undefined : { scale: 0.96 }} transition={{ type: "spring", stiffness: 440, damping: 24 }} className={`rounded-full border-2 border-[#172539] px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0_#172539] transition-[transform,background-color] hover:-translate-y-0.5 ${activeKind === catalog.kind ? "bg-[#fdcc48]" : "bg-white hover:bg-[#79c8ea]"}`}>{catalog.name} <span className="opacity-60">{catalog.totalElements.toLocaleString("es-MX")}</span></motion.button>)}</div></div><div className="rounded-3xl border-2 border-[#172539] bg-white p-5 shadow-[6px_6px_0_#172539]"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-mono text-xs font-black uppercase tracking-widest text-[#d85746]">{activeCatalog.name}</p><p className="mt-2 max-w-xl text-sm leading-6 text-[#405065]">{activeCatalog.description}</p></div><Badge className="shrink-0 bg-[#dcebdc]">{activeCatalog.isAvailable ? `${activeCatalog.entries.length.toLocaleString("es-MX")} de ${activeCatalog.totalElements.toLocaleString("es-MX")} cargados` : "Sin conexion"}</Badge></div><input value={query} onChange={(event) => setQuery(event.target.value)} className="mt-5 h-11 w-full rounded-xl border-2 border-[#172539] bg-[#f7f1e7] px-4 font-mono text-sm outline-none focus:ring-2 focus:ring-[#79c8ea]" placeholder={`Buscar entre los ${activeCatalog.entries.length.toLocaleString("es-MX")} registros cargados...`} /><motion.div layout className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3"><AnimatePresence mode="popLayout">{entries.map((entry) => <motion.article layout key={entry.id} initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={reduceMotion ? undefined : { opacity: 0, scale: 0.92 }} transition={{ duration: 0.2 }} className="rounded-xl border-2 border-[#172539] bg-[#f7f1e7] px-3 py-2 font-mono text-xs font-black uppercase shadow-[2px_2px_0_#172539]"><span className="mr-2 text-[#d85746]">{String(entry.id).padStart(3, "0")}</span>{entry.name}</motion.article>)}</AnimatePresence></motion.div>{entries.length === 0 && <p className="mt-6 rounded-xl border-2 border-dashed border-[#172539] p-6 text-center font-mono text-sm">{activeCatalog.isAvailable ? "No encontramos coincidencias entre los registros cargados. Prueba otra busqueda o carga mas." : "No pudimos cargar este catalogo desde DAPI. Intenta de nuevo mas tarde."}</p>}{activeCatalog.hasNextPage && <div className="mt-6 text-center"><Button variant="outline" disabled={isLoadingMore} onClick={() => void loadMore()}>{isLoadingMore ? "Cargando..." : "Cargar mas registros"}</Button></div>}</div></div></section>;
}