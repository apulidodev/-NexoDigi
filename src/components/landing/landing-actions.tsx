"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

function dispatch(name: string) {
  window.dispatchEvent(new Event(name));
}

export function LandingActions() {
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  function startTransmission() {
    dispatch("nexodigi:scan");
    document.getElementById("digivice")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return <><div className="flex flex-wrap gap-3"><Button onClick={startTransmission}>Iniciar transmision <ArrowIcon /></Button><Button variant="ghost" onClick={() => setIsGuideOpen(true)}>Como funciona</Button></div>{isGuideOpen && <GuideDialog onClose={() => setIsGuideOpen(false)} />}</>;
}

export function RadarButton() {
  function openRadar() {
    document.getElementById("archivo")?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => dispatch("nexodigi:focus-digidex"), 500);
  }

  return <Button variant="inverse" onClick={openRadar}>Abrir el radar <ArrowIcon /></Button>;
}

export function CollectionShortcut() {
  function openCollection() {
    document.getElementById("archivo")?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => dispatch("nexodigi:open-collection"), 500);
  }

  return <Button variant="outline" size="sm" className="hidden sm:inline-flex" onClick={openCollection}>Mi coleccion</Button>;
}

function GuideDialog({ onClose }: { onClose: () => void }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-[#172539]/60 p-5" role="dialog" aria-modal="true" aria-labelledby="guide-title"><div className="w-full max-w-xl rounded-3xl border-2 border-[#172539] bg-[#f7f1e7] p-6 shadow-[9px_9px_0_#fdcc48]"><div className="flex items-start justify-between gap-5"><div><p className="font-mono text-[10px] font-black uppercase tracking-widest text-[#d85746]">Guia de transmision</p><h2 id="guide-title" className="mt-3 font-mono text-3xl font-black uppercase leading-none tracking-[-0.07em]">Como usar NexoDigi</h2></div><Button variant="ghost" size="sm" onClick={onClose} aria-label="Cerrar guia">Cerrar</Button></div><ol className="mt-7 grid gap-3"><GuideStep number="01" title="Inicia un escaneo" description="Usa el Digivice o el boton de transmision para encontrar una nueva senal." /><GuideStep number="02" title="Explora el DigiDex" description="Filtra por nombre, nivel, atributo y X-Antibody; selecciona una ficha para ver detalles." /><GuideStep number="03" title="Sigue la ruta EVO" description="Los nodos del mapa EVO cargan la siguiente ficha para continuar tu exploracion." /><GuideStep number="04" title="Guarda tu expedicion" description="Tu coleccion se conserva en este navegador y puedes abrirla desde el menu." /></ol></div></div>;
}

function GuideStep({ number, title, description }: { number: string; title: string; description: string }) { return <li className="grid grid-cols-[2.5rem_1fr] gap-3 rounded-xl border-2 border-[#172539] bg-white p-3"><span className="grid size-9 place-items-center rounded-lg bg-[#79c8ea] font-mono text-xs font-black">{number}</span><div><h3 className="font-mono text-sm font-black uppercase">{title}</h3><p className="mt-1 text-sm leading-5 text-[#405065]">{description}</p></div></li>; }
function ArrowIcon() { return <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg>; }