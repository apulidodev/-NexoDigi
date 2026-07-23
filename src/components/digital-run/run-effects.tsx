"use client";

import Image from "next/image";
import type { AttackProfile } from "@/features/digital-run/domain/digital-run";
import { useCallback, useEffect, useRef, useState } from "react";

export function RiftParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let frame = 0;
    const particles = Array.from({ length: 30 }, () => ({ x: Math.random(), y: Math.random(), speed: 0.00025 + Math.random() * 0.0006, size: 1 + Math.random() * 2, hue: Math.random() > 0.5 ? 48 : 196 }));
    const resize = () => { canvas.width = canvas.clientWidth * devicePixelRatio; canvas.height = canvas.clientHeight * devicePixelRatio; context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); };
    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      context.clearRect(0, 0, width, height);
      particles.forEach((particle) => {
        particle.y -= particle.speed * 16;
        if (particle.y < -0.04) { particle.y = 1.04; particle.x = Math.random(); }
        context.fillStyle = `hsla(${particle.hue}, 90%, 70%, .65)`;
        context.fillRect(particle.x * width, particle.y * height, particle.size, particle.size);
      });
      frame = requestAnimationFrame(draw);
    };
    resize();
    window.addEventListener("resize", resize);
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 size-full opacity-60" />;
}

type SoundKind = "attack" | "hit" | "win" | "evolution" | "scan";
export function useRunSounds() {
  const [isMuted, setIsMuted] = useState(false);
  const contextRef = useRef<AudioContext | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => setIsMuted(window.localStorage.getItem("nexodigi-run-muted") === "true"), 0);
    return () => window.clearTimeout(timer);
  }, []);
  const toggle = useCallback(() => setIsMuted((current) => { const next = !current; window.localStorage.setItem("nexodigi-run-muted", String(next)); return next; }), []);
  const play = useCallback((kind: SoundKind) => {
    if (isMuted || typeof window === "undefined") return;
    const audioWindow = window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };
    const AudioContextConstructor = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
    if (!AudioContextConstructor) return;
    const context = contextRef.current ?? new AudioContextConstructor();
    contextRef.current = context;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const notes: Record<SoundKind, [number, number, number]> = { attack: [310, 0.07, 0.05], hit: [120, 0.09, 0.06], win: [480, 0.16, 0.08], evolution: [220, 0.42, 0.1], scan: [680, 0.12, 0.05] };
    const [start, duration, volume] = notes[kind];
    oscillator.type = kind === "hit" ? "square" : "sine";
    oscillator.frequency.setValueAtTime(start, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(kind === "evolution" ? start * 3 : start * 0.72, context.currentTime + duration);
    gain.gain.setValueAtTime(volume, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  }, [isMuted]);
  return { isMuted, toggle, play };
}

export function ModuleOrbit({ modules }: { modules: number }) {
  return <div className="relative grid size-14 place-items-center rounded-full border-2 border-[#172539] bg-[#79c8ea] shadow-[2px_2px_0_#172539]"><span className="font-mono text-[9px] font-black">RIFT<br />CORE</span>{Array.from({ length: Math.min(modules, 5) }).map((_, index) => <i key={index} aria-hidden="true" className="run-orbit-module absolute size-2 rounded-full border border-[#172539] bg-[#fdcc48]" style={{ animationDelay: `${index * -0.45}s` }} />)}</div>;
}

export function EvolutionOverlay({ image, targetName }: { image?: string; targetName: string }) {
  return <div className="absolute inset-0 z-30 grid place-items-center overflow-hidden rounded-[1.6rem] bg-[#172539]/90 text-center text-white"><div className="run-evo-flash absolute inset-0" />{Array.from({ length: 18 }).map((_, index) => <i key={index} className="run-evo-particle absolute size-1 rounded-full bg-[#fdcc48]" style={{ left: `${12 + (index * 29) % 76}%`, top: `${10 + (index * 47) % 76}%`, animationDelay: `${index * -0.06}s` }} />)}<div className="relative z-10"><p className="font-mono text-[10px] font-black uppercase tracking-[.22em]">Evolution sequence</p>{image && <Image src={image} alt="" width={140} height={140} unoptimized className="run-evo-silhouette mx-auto my-4 size-28 object-contain" />}<p className="font-mono text-lg font-black uppercase">{targetName}</p></div></div>;
}
export function AttackSequence({ attack, direction = "player", critical = false }: { attack: AttackProfile; direction?: "player" | "enemy"; critical?: boolean }) {
  return <div aria-live="polite" className={`run-attack-sequence run-attack-${direction} pointer-events-none absolute inset-x-[10%] top-[28%] z-20 h-24`}><p className="run-attack-callout absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap rounded-full border-2 border-[#172539] bg-[#f7f1e7] px-3 py-1 font-mono text-[10px] font-black uppercase text-[#172539] shadow-[2px_2px_0_#172539]">{critical ? "PERFECT · " : ""}{attack.name}</p><div className={`run-attack-projectile run-attack-style-${attack.style} ${critical ? "run-attack-critical" : ""}`}><span>{attack.style === "flame" ? "✦" : attack.style === "frost" ? "✧" : attack.style === "electric" ? "ϟ" : attack.style === "nature" ? "✤" : attack.style === "virus" ? "✹" : attack.style === "sonic" ? "◌" : "◆"}</span></div><i className={`run-attack-impact run-attack-style-${attack.style}`} /></div>;
}

export function TimingMeter({ technique, onResolve, onCancel }: { technique: AttackProfile; onResolve: (multiplier: number, label: "PERFECT" | "GOOD" | "NORMAL") => void; onCancel: () => void }) {
  const [position, setPosition] = useState(0);
  const startRef = useRef(0);
  const frameRef = useRef(0);
  useEffect(() => {
    const update = (time: number) => { if (!startRef.current) startRef.current = time; setPosition(((time - startRef.current) % 1550) / 1550); frameRef.current = requestAnimationFrame(update); };
    frameRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);
  function confirm() {
    const distance = Math.abs(position - 0.5);
    const label = distance < 0.055 ? "PERFECT" : distance < 0.16 ? "GOOD" : "NORMAL";
    onResolve(label === "PERFECT" ? 1.52 : label === "GOOD" ? 1.23 : 1, label);
  }
  return <div className="mt-6 rounded-2xl border-2 border-[#172539] bg-[#172539] p-4 text-white"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] font-black uppercase tracking-widest text-[#fdcc48]">Sincronización de técnica</p><p className="mt-1 font-mono text-sm font-black uppercase">{technique.name}</p></div><button type="button" onClick={onCancel} className="font-mono text-[10px] font-black uppercase text-white/75 underline">Cancelar</button></div><p className="mt-3 text-xs text-white/75">Detén el pulso dentro del núcleo para amplificar el ataque.</p><button type="button" onClick={confirm} className="relative mt-4 h-8 w-full overflow-hidden rounded-full border-2 border-white bg-[#405065]" aria-label="Sincronizar técnica"><span className="absolute inset-y-0 left-[43%] w-[14%] border-x-2 border-[#fdcc48] bg-[#fdcc48]/25" /><span className="run-timing-cursor absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#172539] bg-white shadow-[1px_1px_0_#fdcc48]" style={{ left: `${position * 100}%` }} /></button><div className="mt-2 flex justify-between font-mono text-[9px] font-black uppercase"><span>Normal</span><span className="text-[#fdcc48]">Perfect</span><span>Normal</span></div></div>;
}