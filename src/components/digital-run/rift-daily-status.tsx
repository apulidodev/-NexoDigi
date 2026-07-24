"use client";

import { useEffect, useState } from "react";

type Leader = { rank: number; handle: string; score: number };

export function RiftDailyStatus() {
  const [day, setDay] = useState<string | null>(null);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  useEffect(() => { void fetch("/api/rift/daily").then((response) => response.ok ? response.json() : Promise.reject()).then((data: { day: string; leaderboard: Leader[] }) => { setDay(data.day); setLeaders(data.leaderboard ?? []); }).catch(() => {}); }, []);
  return <aside className="w-full rounded-2xl border-2 border-white/30 bg-white/10 p-4 font-mono text-xs sm:w-auto sm:min-w-56"><p className="text-[10px] font-black uppercase tracking-widest text-[#fdcc48]">Rift diario online</p><p className="mt-2 font-black">{day ? `Semilla compartida · ${day}` : "Conectando señal..."}</p>{leaders.length > 0 ? <ol className="mt-3 space-y-1 text-[11px] text-white/80">{leaders.slice(0, 3).map((leader) => <li key={`${leader.handle}-${leader.rank}`} className="flex justify-between gap-4"><span>#{leader.rank} @{leader.handle}</span><strong>{leader.score}</strong></li>)}</ol> : <p className="mt-2 text-[11px] leading-5 text-white/65">Inicia sesión y termina una ruta para aparecer en el ranking.</p>}</aside>;
}