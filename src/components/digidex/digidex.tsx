"use client";

import Image from "next/image";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { EvolutionMap } from "@/components/evolution/evolution-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Digimon, DigimonSearchFilters, DigimonSearchResult, DigimonSummary } from "@/features/digimon/domain/digimon";
import { useCollection } from "@/features/collection/presentation/use-collection";

const levels = ["", "Baby I", "Baby II", "Child", "Adult", "Perfect", "Ultimate", "Armor", "Hybrid"];
const attributes = ["", "Vaccine", "Virus", "Data", "Free", "Variable", "Unknown"];
const defaultFilters: DigimonSearchFilters = { name: "", level: "", attribute: "", xAntibody: undefined, pageSize: 12 };

type DigiDexProps = { initialResults: DigimonSearchResult };

export function DigiDex({ initialResults }: DigiDexProps) {
  const [filters, setFilters] = useState<DigimonSearchFilters>(defaultFilters);
  const [activeFilters, setActiveFilters] = useState<DigimonSearchFilters>(defaultFilters);
  const [results, setResults] = useState(initialResults);
  const [selected, setSelected] = useState<Digimon | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const collection = useCollection();
  const [isCollectionMode, setIsCollectionMode] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  async function loadPage(page: number, nextFilters = activeFilters) {
    setIsLoading(true);
    const query = new URLSearchParams({ page: String(page), pageSize: String(nextFilters.pageSize ?? 12) });
    if (nextFilters.name) query.set("name", nextFilters.name);
    if (nextFilters.level) query.set("level", nextFilters.level);
    if (nextFilters.attribute) query.set("attribute", nextFilters.attribute);
    if (nextFilters.xAntibody !== undefined) query.set("xAntibody", String(nextFilters.xAntibody));

    try {
      const response = await fetch(`/api/digimon?${query.toString()}`);
      if (!response.ok) throw new Error("Search request failed");
      setResults((await response.json()) as DigimonSearchResult);
    } finally {
      setIsLoading(false);
    }
  }

  async function selectDigimonById(id: number) {
    setIsLoadingDetails(true);
    try {
      const response = await fetch(`/api/digimon/${id}`);
      if (!response.ok) throw new Error("Detail request failed");
      setSelected((await response.json()) as Digimon);
    } finally {
      setIsLoadingDetails(false);
    }
  }

  async function selectDigimon(summary: DigimonSummary) {
    await selectDigimonById(summary.id);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCollectionMode(false);
    const nextFilters = { ...filters, pageSize: 12 };
    setActiveFilters(nextFilters);
    void loadPage(0, nextFilters);
  }

  function clearFilters() {
    setFilters(defaultFilters);
    setActiveFilters(defaultFilters);
    void loadPage(0, defaultFilters);
  }

  useEffect(() => {
    function focusDigiDex() {
      setIsCollectionMode(false);
      window.setTimeout(() => searchInputRef.current?.focus(), 0);
    }

    async function openCollection() {
      setIsCollectionMode(true);
      setIsLoading(true);
      try {
        const savedDigimon = await Promise.all(collection.ids.map(async (id) => {
          const response = await fetch(`/api/digimon/${id}`);
          return response.ok ? (await response.json()) as Digimon : null;
        }));
        const content = savedDigimon.filter((digimon): digimon is Digimon => Boolean(digimon)).map((digimon) => ({ id: digimon.id, name: digimon.name, image: digimon.image }));
        setResults({ content, currentPage: 0, totalElements: content.length, totalPages: 1, hasPreviousPage: false, hasNextPage: false });
      } finally {
        setIsLoading(false);
      }
    }

    window.addEventListener("nexodigi:focus-digidex", focusDigiDex);
    window.addEventListener("nexodigi:open-collection", openCollection);
    return () => {
      window.removeEventListener("nexodigi:focus-digidex", focusDigiDex);
      window.removeEventListener("nexodigi:open-collection", openCollection);
    };
  }, [collection.ids]);
  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_290px]">
      <div className="min-w-0">
        <form onSubmit={submit} className="rounded-3xl border-2 border-[#172539] bg-[#f7f1e7] p-4 shadow-[5px_5px_0_#172539]">
          <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_auto_auto] md:items-end">
            <Field label="Nombre"><input value={filters.name ?? ""} onChange={(event) => setFilters({ ...filters, name: event.target.value })} ref={searchInputRef} className="h-10 w-full rounded-lg border-2 border-[#172539] bg-white px-3 font-mono text-sm outline-none focus:ring-2 focus:ring-[#79c8ea]" placeholder="Agumon" /></Field>
            <Field label="Nivel"><select value={filters.level ?? ""} onChange={(event) => setFilters({ ...filters, level: event.target.value })} className="h-10 w-full rounded-lg border-2 border-[#172539] bg-white px-2 font-mono text-xs outline-none focus:ring-2 focus:ring-[#79c8ea]">{levels.map((level) => <option key={level || "all-levels"} value={level}>{level || "Todos"}</option>)}</select></Field>
            <Field label="Atributo"><select value={filters.attribute ?? ""} onChange={(event) => setFilters({ ...filters, attribute: event.target.value })} className="h-10 w-full rounded-lg border-2 border-[#172539] bg-white px-2 font-mono text-xs outline-none focus:ring-2 focus:ring-[#79c8ea]">{attributes.map((attribute) => <option key={attribute || "all-attributes"} value={attribute}>{attribute || "Todos"}</option>)}</select></Field>
            <label className="flex h-10 items-center gap-2 rounded-lg border-2 border-[#172539] bg-white px-3 font-mono text-[10px] font-black uppercase"><input type="checkbox" checked={filters.xAntibody === true} onChange={(event) => setFilters({ ...filters, xAntibody: event.target.checked ? true : undefined })} /> X</label>
            <div className="flex gap-2"><Button type="submit" disabled={isLoading}>{isLoading ? "..." : "Buscar"}</Button><Button type="button" variant="ghost" onClick={clearFilters}>Limpiar</Button></div>
          </div>
        </form>

        <div className="mt-5 flex items-center justify-between gap-4"><p className="font-mono text-xs font-black uppercase tracking-wider">{isLoading ? "Consultando archivo..." : `${results.totalElements.toLocaleString("es-MX")} señales encontradas`}</p><Badge className="bg-[#79c8ea]">Página {results.currentPage + 1} / {Math.max(results.totalPages, 1)}</Badge></div>
        {isCollectionMode && <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border-2 border-[#172539] bg-[#fdcc48] p-3"><p className="font-mono text-xs font-black uppercase">Mostrando tu coleccion local</p><Button size="sm" variant="outline" onClick={clearFilters}>Ver archivo</Button></div>}        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {results.content.map((digimon) => <DigimonCard key={digimon.id} digimon={digimon} isSelected={selected?.id === digimon.id} onSelect={selectDigimon} />)}
          {!isLoading && results.content.length === 0 && <p className="col-span-full rounded-2xl border-2 border-dashed border-[#172539] p-8 text-center font-mono text-sm">No hubo señales con esos filtros.</p>}
        </div>
        <div className="mt-6 flex items-center justify-center gap-3"><Button variant="outline" disabled={!results.hasPreviousPage || isLoading} onClick={() => void loadPage(results.currentPage - 1)}>Anterior</Button><Button variant="outline" disabled={!results.hasNextPage || isLoading} onClick={() => void loadPage(results.currentPage + 1)}>Siguiente</Button></div>
      </div>
      <DetailPanel digimon={selected} isLoading={isLoadingDetails} isCollected={selected ? collection.includes(selected.id) : false} onToggleCollection={collection.toggle} onNavigate={(id) => void selectDigimonById(id)} />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-1 font-mono text-[10px] font-black uppercase tracking-wider">{label}{children}</label>; }
function DigimonCard({ digimon, isSelected, onSelect }: { digimon: DigimonSummary; isSelected: boolean; onSelect: (digimon: DigimonSummary) => void }) { return <button type="button" onClick={() => void onSelect(digimon)} className={`group min-h-40 rounded-2xl border-2 border-[#172539] bg-white p-3 text-left shadow-[3px_3px_0_#172539] transition-transform hover:-translate-y-1 active:translate-y-0 ${isSelected ? "bg-[#fdcc48]" : ""}`}><div className="grid h-24 place-items-center rounded-xl border border-dashed border-[#172539]/30 bg-[#dcebdc] p-2">{digimon.image ? <Image src={digimon.image} alt={digimon.name} width={88} height={88} unoptimized className="max-h-20 object-contain transition-transform group-hover:scale-110" /> : <span className="font-mono text-[10px]">NO IMG</span>}</div><p className="mt-3 font-mono text-sm font-black uppercase leading-none tracking-[-0.05em]">{digimon.name}</p></button>; }
function DetailPanel({ digimon, isLoading, isCollected, onToggleCollection, onNavigate }: { digimon: Digimon | null; isLoading: boolean; isCollected: boolean; onToggleCollection: (id: number) => void; onNavigate: (id: number) => void }) {
  return <aside className="h-fit rounded-3xl border-2 border-[#172539] bg-[#172539] p-5 text-white shadow-[5px_5px_0_#f36d57] xl:sticky xl:top-5"><p className="font-mono text-[10px] font-black uppercase tracking-widest text-[#fdcc48]">Senal seleccionada</p>{isLoading ? <p className="mt-8 font-mono text-sm">Cargando perfil...</p> : digimon ? <><div className="mt-5 grid place-items-center rounded-2xl bg-[#dcebdc] p-4">{digimon.image && <Image src={digimon.image} alt={digimon.name} width={150} height={150} unoptimized className="max-h-36 object-contain" />}</div><div className="mt-5 flex items-start justify-between gap-3"><h3 className="font-mono text-2xl font-black uppercase leading-none tracking-[-0.08em]">{digimon.name}</h3><Button size="sm" variant={isCollected ? "inverse" : "outline"} onClick={() => onToggleCollection(digimon.id)}>{isCollected ? "Guardado" : "Guardar"}</Button></div><dl className="mt-5 space-y-2 font-mono text-xs"><Detail label="Nivel" value={digimon.level} /><Detail label="Tipo" value={digimon.type} /><Detail label="Atributo" value={digimon.attribute} /></dl><p className="mt-5 border-t border-white/30 pt-4 font-mono text-[10px] font-black uppercase tracking-widest text-[#fdcc48]">Tecnicas</p><p className="mt-2 text-sm leading-6">{digimon.skills.join(" · ") || "Sin datos"}</p><p className="mt-5 border-t border-white/30 pt-4 font-mono text-[10px] font-black uppercase tracking-widest text-[#fdcc48]">Mapa EVO</p><EvolutionMap digimon={digimon} onNavigate={onNavigate} /></> : <p className="mt-8 text-sm leading-6 text-white/70">Selecciona un Digimon para abrir su ficha rapida.</p>}</aside>;
}
function Detail({ label, value }: { label: string; value: string }) { return <div className="flex justify-between border-b border-white/20 pb-2"><dt className="text-white/60">{label}</dt><dd className="font-black">{value}</dd></div>; }