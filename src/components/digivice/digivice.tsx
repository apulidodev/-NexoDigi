"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { Digimon } from "@/features/digimon/domain/digimon";

type DigiviceProps = { initialDigimon: Digimon };
type DeviceMode = "scan" | "profile" | "evo";

const scanIds = [1, 3, 34, 83, 183, 202, 336];

export function Digivice({ initialDigimon }: DigiviceProps) {
  const [digimon, setDigimon] = useState(initialDigimon);
  const [isScanning, setIsScanning] = useState(false);
  const [mode, setMode] = useState<DeviceMode>("scan");
  const [screenTick, setScreenTick] = useState(0);

  const selectMode = useCallback((nextMode: DeviceMode) => {
    setMode(nextMode);
    setScreenTick((current) => current + 1);
  }, []);

  const scan = useCallback(async () => {
    selectMode("scan");
    setIsScanning(true);
    const id = scanIds[Math.floor(Math.random() * scanIds.length)];

    try {
      const response = await fetch(`/api/digimon/${id}`);
      if (response.ok) setDigimon((await response.json()) as Digimon);
    } finally {
      window.setTimeout(() => setIsScanning(false), 400);
    }
  }, [selectMode]);

  useEffect(() => {
    const triggerScan = () => void scan();
    window.addEventListener("nexodigi:scan", triggerScan);
    return () => window.removeEventListener("nexodigi:scan", triggerScan);
  }, [scan]);
  return (
    <div className="w-full max-w-[560px]">
      <div className="relative isolate aspect-[314/284] w-full select-none">
        <Image
          src="/images/digivice-reference.png"
          alt="Digivice azul con botones laterales"
          fill
          priority
          sizes="(max-width: 640px) 92vw, 560px"
          className="pointer-events-none object-contain drop-shadow-[8px_10px_0_rgba(23,37,57,0.22)]"
        />

        <div key={`${mode}-${screenTick}`} className="digivice-screen-transition absolute left-[32.5%] top-[36.25%] z-10 grid h-[27%] w-[32%] place-items-center overflow-hidden rounded-[12%] border-2 border-[#253736] bg-[#667866]/90 p-2 text-[#ecf1df] shadow-[inset_0_0_0_2px_rgba(31,45,40,0.85)]">
          <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(230,240,220,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(230,240,220,.7)_1px,transparent_1px)] [background-size:7px_7px]" />
          <Screen mode={mode} digimon={digimon} isScanning={isScanning} />
        </div>

        <button aria-label="Abrir perfil del compañero" onClick={() => selectMode("profile")} className="absolute left-[14%] top-[45%] z-20 h-[19%] w-[18%] rounded-full bg-transparent transition-[transform,background-color] duration-150 hover:bg-white/10 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#f36d57] active:scale-95 active:bg-[#172539]/15" />
        <button aria-label="Escanear otro Digimon" onClick={scan} disabled={isScanning} className="absolute right-[8%] top-[35.5%] z-20 h-[17%] w-[21%] rounded-full bg-transparent transition-[transform,background-color] duration-150 hover:bg-white/10 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#f36d57] active:scale-95 active:bg-[#172539]/15 disabled:cursor-wait" />
        <button aria-label="Ver evoluciones" onClick={() => selectMode("evo")} className="absolute right-[8%] top-[56%] z-20 h-[17%] w-[21%] rounded-full bg-transparent transition-[transform,background-color] duration-150 hover:bg-white/10 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#f36d57] active:scale-95 active:bg-[#172539]/15" />
      </div>
      <div className="mt-4 flex items-center justify-center gap-3 font-mono text-[10px] font-black uppercase tracking-[0.12em] text-[#405065]" aria-live="polite">
        <span className="rounded-full border-2 border-[#172539] bg-[#79c8ea] px-2 py-1">Izq: perfil</span>
        <span className="rounded-full border-2 border-[#172539] bg-[#79c8ea] px-2 py-1">Der: scan / evo</span>
      </div>
    </div>
  );
}

function Screen({ mode, digimon, isScanning }: { mode: DeviceMode; digimon: Digimon; isScanning: boolean }) {
  if (mode === "profile") return <ProfileView digimon={digimon} />;
  if (mode === "evo") return <EvolutionView digimon={digimon} />;
  return <ScanView digimon={digimon} isScanning={isScanning} />;
}

function ScanView({ digimon, isScanning }: { digimon: Digimon; isScanning: boolean }) {
  return <div className={`relative z-10 grid h-full w-full place-items-center text-center ${isScanning ? "animate-pulse" : ""}`}><p className="absolute top-0 font-mono text-[6px] font-black uppercase tracking-wider">Scan signal</p>{digimon.image && <Image className="mt-1 max-h-[48%] w-auto object-contain" src={digimon.image} alt={digimon.name} width={62} height={62} unoptimized />}<div><h2 className="font-mono text-[clamp(9px,2.1vw,16px)] font-black uppercase leading-none tracking-[-0.08em]">{digimon.name}</h2><p className="mt-1 font-mono text-[clamp(5px,1.1vw,8px)] font-bold uppercase">LV. {digimon.level} / {digimon.attribute}</p></div></div>;
}

function ProfileView({ digimon }: { digimon: Digimon }) { return <div className="relative z-10 grid h-full w-full place-items-center text-center"><div><p className="font-mono text-[6px] font-black uppercase tracking-wider">Partner profile</p><h2 className="mt-2 font-mono text-[clamp(10px,2.3vw,17px)] font-black uppercase leading-none tracking-[-0.08em]">{digimon.name}</h2><dl className="mx-auto mt-3 w-24 space-y-1 text-left font-mono text-[clamp(5px,1.1vw,8px)]"><Info label="LV" value={digimon.level} /><Info label="Type" value={digimon.type} /><Info label="Attr" value={digimon.attribute} /></dl></div></div>; }
function EvolutionView({ digimon }: { digimon: Digimon }) { return <div className="relative z-10 grid h-full w-full place-items-center text-center"><div className="w-full px-1"><p className="font-mono text-[6px] font-black uppercase tracking-wider">Evolution route</p><h2 className="mt-1 font-mono text-[clamp(9px,2vw,14px)] font-black uppercase tracking-[-0.08em]">{digimon.name}</h2><div className="mt-2 max-h-12 overflow-y-auto text-left font-mono text-[clamp(5px,1.1vw,8px)] font-black uppercase">{digimon.nextEvolutions.length ? digimon.nextEvolutions.map((evolution) => <p key={evolution.id} className="border-b border-[#ecf1df]/30 py-0.5">→ {evolution.name}</p>) : <p>No routes found.</p>}</div></div></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="flex justify-between border-b border-[#ecf1df]/30 pb-0.5"><dt className="font-black uppercase">{label}</dt><dd>{value}</dd></div>; }