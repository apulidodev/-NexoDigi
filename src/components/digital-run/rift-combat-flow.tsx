"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";

type Phase = "ready" | "charge" | "impact" | "counter" | "resolve";
const copy: Record<Phase, { label: string; detail: string; tone: string }> = {
  ready: { label: "Canal abierto", detail: "Elige una acción para estabilizar la señal.", tone: "bg-[#dcebdc]" },
  charge: { label: "Carga de técnica", detail: "El Digivice concentra energía digital.", tone: "bg-[#79c8ea]" },
  impact: { label: "Impacto confirmado", detail: "La señal absorbió la descarga.", tone: "bg-[#fdcc48]" },
  counter: { label: "Respuesta hostil", detail: "La señal prepara un contraataque.", tone: "bg-[#f6a595]" },
  resolve: { label: "Recalibrando núcleo", detail: "Calculando el siguiente estado de batalla.", tone: "bg-white" },
};

export function RiftCombatFlow({ phase, enemyName, node, hpPercent }: { phase: Phase; enemyName: string; node: number; hpPercent: number }) {
  const reduced = useReducedMotion();
  const enemyIntent = hpPercent <= 28 ? "Sobrecarga crítica" : node === 5 ? "Ataque de núcleo" : phase === "ready" ? "Analizando patrón" : "Señal inestable";
  const current = copy[phase];
  return <div className="mt-4 grid gap-3 rounded-2xl border-2 border-[#172539] bg-[#172539] p-3 text-white sm:grid-cols-[1fr_auto] sm:items-center">
    <div className="min-w-0">
      <p className="font-mono text-[10px] font-black uppercase tracking-widest text-[#fdcc48]">Flujo de combate</p>
      <AnimatePresence mode="wait"><motion.div key={phase} initial={reduced ? false : { opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? undefined : { opacity: 0, y: -7 }} transition={{ duration: .18 }}><p className="mt-1 font-mono text-sm font-black uppercase">{current.label}</p><p className="mt-1 text-xs text-white/70">{current.detail}</p></motion.div></AnimatePresence>
    </div>
    <div className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 p-2 text-right">
      {node === 5 && <Image aria-hidden="true" src="/assets/rift/rift-boss-core.png" alt="" width={76} height={76} unoptimized className="rift-boss-core size-12 object-contain" />}
      <div><p className="font-mono text-[9px] font-black uppercase text-white/65">Intención · {enemyName}</p><p className="mt-1 font-mono text-xs font-black text-[#fdcc48]">{enemyIntent}</p></div>
    </div>
    <div className="sm:col-span-2 flex gap-1" aria-hidden="true">{(["ready", "charge", "impact", "counter", "resolve"] as Phase[]).map((step) => <i key={step} className={`h-1 flex-1 rounded-full ${step === phase ? current.tone : "bg-white/20"}`} />)}</div>
  </div>;
}

export function RiftRewardDeck({ canEvolve, onSelect }: { canEvolve: boolean; onSelect: (kind: "heal" | "module" | "evolution") => void }) {
  const reduced = useReducedMotion();
  const rewards = [{ kind: "heal" as const, code: "REC", title: "Reparar núcleo", detail: "+35% HP y +25 energía", tone: "bg-[#dcebdc]" }, { kind: "module" as const, code: "MOD", title: "Instalar módulo", detail: "+3 poder y escudo", tone: "bg-[#79c8ea]" }, ...(canEvolve ? [{ kind: "evolution" as const, code: "EVO", title: "Ejecutar EVO", detail: "Abrir siguiente evolución", tone: "bg-[#fdcc48]" }] : [])];
  return <div className="mt-6"><p className="text-center font-mono text-xs font-black uppercase tracking-widest">Elige una recompensa de Rift</p><div className="mt-3 grid gap-3 sm:grid-cols-3">{rewards.map((reward, index) => <motion.button key={reward.kind} type="button" onClick={() => onSelect(reward.kind)} initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .08, type: "spring", stiffness: 320, damping: 25 }} whileHover={reduced ? undefined : { y: -4 }} whileTap={reduced ? undefined : { scale: .97 }} className={`rounded-2xl border-2 border-[#172539] p-4 text-left shadow-[4px_4px_0_#172539] ${reward.tone}`}><p className="font-mono text-[10px] font-black uppercase">{reward.code}</p><p className="mt-3 font-mono text-base font-black uppercase">{reward.title}</p><p className="mt-1 text-xs text-[#405065]">{reward.detail}</p></motion.button>)}</div></div>;
}

export function RiftOutcomeCard({ victory, onAction }: { victory: boolean; onAction: () => void }) {
  const reduced = useReducedMotion();
  return <motion.div initial={reduced ? false : { opacity: 0, scale: .92, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 280, damping: 22 }} className={`mt-6 overflow-hidden rounded-2xl border-2 border-[#172539] p-5 text-center shadow-[5px_5px_0_#172539] ${victory ? "bg-[#fdcc48]" : "bg-[#f6a595]"}`}><p className="font-mono text-[10px] font-black uppercase tracking-[.18em]">{victory ? "Rift estabilizado" : "Transmisión interrumpida"}</p><h4 className="mt-2 font-mono text-2xl font-black uppercase">{victory ? "Núcleo asegurado" : "Señal dispersada"}</h4><p className="mx-auto mt-2 max-w-md text-sm text-[#405065]">{victory ? "La ruta quedó registrada. Vuelve al mapa para conservar el récord y preparar la siguiente expedición." : "El Digivice necesita una nueva calibración. Intenta otra ruta con una estrategia distinta."}</p><Button className="mt-5" variant={victory ? "default" : "outline"} onClick={onAction}>{victory ? "Registrar victoria" : "Reintentar ruta"}</Button></motion.div>;
}