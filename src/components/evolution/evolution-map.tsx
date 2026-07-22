import type { Digimon } from "@/features/digimon/domain/digimon";

type EvolutionMapProps = { digimon: Digimon; onNavigate: (id: number) => void };

export function EvolutionMap({ digimon, onNavigate }: EvolutionMapProps) {
  if (!digimon.nextEvolutions.length) return <p className="mt-2 text-sm text-white/70">Sin rutas registradas.</p>;

  return <div className="mt-3"><div className="rounded-lg border-2 border-[#fdcc48] bg-[#fdcc48] px-2 py-2 text-center font-mono text-xs font-black uppercase text-[#172539]">{digimon.name}</div><div className="mx-auto h-4 w-px bg-[#fdcc48]" /><div className="relative grid gap-2 before:absolute before:left-1/2 before:top-0 before:h-px before:w-[72%] before:-translate-x-1/2 before:bg-[#fdcc48]">{digimon.nextEvolutions.map((evolution) => <button key={evolution.id} type="button" onClick={() => onNavigate(evolution.id)} className="relative rounded-lg border border-white/30 bg-white/10 p-2 text-left font-mono text-xs transition-colors hover:bg-[#79c8ea] hover:text-[#172539]"><span className="absolute left-1/2 top-[-9px] h-2 w-px bg-[#fdcc48]" /><p className="font-black uppercase">{evolution.name}</p>{evolution.condition && <p className="mt-1 text-[10px] opacity-70">{evolution.condition}</p>}</button>)}</div></div>;
}