"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { DigimonSearchFilters } from "@/features/digimon/domain/digimon";

type Props = { collection: number[]; team: Array<{ id: number }>; evoNotes: Record<number, string>; savedFilters: Array<{ label: string; filters: DigimonSearchFilters }>; history: Array<{ id: number; scannedAt: string }>; quizCorrectDates: string[] };

export function LocalMigrationButton({ collection, team, evoNotes, savedFilters, history, quizCorrectDates }: Props) {
  const [message, setMessage] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  async function migrate() {
    setMessage(""); setIsSyncing(true);
    try {
      const session = await fetch("/api/auth/session").then((response) => response.json() as Promise<{ user: unknown }>);
      if (!session.user) throw new Error("Inicia sesión con tu cuenta Tamer para sincronizar.");
      const response = await fetch("/api/tamer/local-migration", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ collection, team, evoNotes, savedFilters, history, quizCorrectDates }) });
      const result = await response.json() as { error?: string; migrated?: { collection: number; team: number } };
      if (!response.ok) throw new Error(result.error ?? "No fue posible sincronizar.");
      setMessage(`Sincronizado: ${result.migrated?.collection ?? 0} señales y ${result.migrated?.team ?? 0} miembros de equipo. Tus datos locales se conservaron.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "No fue posible sincronizar."); }
    finally { setIsSyncing(false); }
  }
  return <div className="text-right"><Button variant="inverse" onClick={() => void migrate()} disabled={isSyncing}>{isSyncing ? "Sincronizando..." : "Sincronizar Tamer"}</Button>{message && <p className="mt-2 max-w-72 text-right font-mono text-[10px] font-black text-[#405065]" role="status">{message}</p>}</div>;
}