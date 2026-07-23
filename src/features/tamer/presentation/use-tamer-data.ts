"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Digimon, DigimonSearchFilters } from "@/features/digimon/domain/digimon";
import type { SavedFilter, ScanRecord, TamerData, TeamMember } from "@/features/tamer/domain/tamer";

const storageKey = "nexodigi-tamer-data";
const emptyData: TamerData = { team: [], history: [], savedFilters: [], evoNotes: {}, quizCorrectDates: [] };

function readData(): TamerData {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return emptyData;
    const parsed = JSON.parse(raw) as Partial<TamerData>;
    return {
      team: Array.isArray(parsed.team) ? parsed.team.slice(0, 6) : [],
      history: Array.isArray(parsed.history) ? parsed.history.slice(0, 20) : [],
      savedFilters: Array.isArray(parsed.savedFilters) ? parsed.savedFilters.slice(0, 6) : [],
      evoNotes: parsed.evoNotes ?? {},
      quizCorrectDates: Array.isArray(parsed.quizCorrectDates) ? parsed.quizCorrectDates : [],
    };
  } catch {
    return emptyData;
  }
}

function today() { return new Date().toISOString().slice(0, 10); }
function summary(digimon: Pick<Digimon, "id" | "name" | "image">): TeamMember { return { id: digimon.id, name: digimon.name, image: digimon.image }; }

export function useTamerData() {
  const [data, setData] = useState<TamerData>(emptyData);
  const dataRef = useRef<TamerData>(emptyData);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = readData();
      dataRef.current = stored;
      setData(stored);
      setIsReady(true);
    }, 0);
    const sync = () => {
      const stored = readData();
      dataRef.current = stored;
      setData(stored);
    };
    window.addEventListener("nexodigi:tamer-change", sync);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("nexodigi:tamer-change", sync);
    };
  }, []);

  const update = useCallback((recipe: (current: TamerData) => TamerData) => {
    const next = recipe(dataRef.current);
    dataRef.current = next;
    window.localStorage.setItem(storageKey, JSON.stringify(next));
    setData(next);
    window.setTimeout(() => window.dispatchEvent(new Event("nexodigi:tamer-change")), 0);
  }, []);

  const toggleTeam = useCallback((digimon: Pick<Digimon, "id" | "name" | "image">) => {
    update((current) => {
      const exists = current.team.some((member) => member.id === digimon.id);
      if (exists) return { ...current, team: current.team.filter((member) => member.id !== digimon.id) };
      if (current.team.length >= 6) return current;
      return { ...current, team: [...current.team, summary(digimon)] };
    });
  }, [update]);

  const recordScan = useCallback((digimon: Pick<Digimon, "id" | "name" | "image">) => {
    update((current) => {
      const record: ScanRecord = { ...summary(digimon), scannedAt: new Date().toISOString() };
      return { ...current, history: [record, ...current.history].slice(0, 20) };
    });
  }, [update]);

  const saveFilter = useCallback((filters: DigimonSearchFilters) => {
    update((current) => {
      const filter: SavedFilter = { id: crypto.randomUUID(), label: `Filtro ${current.savedFilters.length + 1}`, filters };
      return { ...current, savedFilters: [...current.savedFilters, filter].slice(-6) };
    });
  }, [update]);

  const removeFilter = useCallback((id: string) => update((current) => ({ ...current, savedFilters: current.savedFilters.filter((filter) => filter.id !== id) })), [update]);
  const saveEvoNote = useCallback((digimonId: number, note: string) => update((current) => ({ ...current, evoNotes: { ...current.evoNotes, [digimonId]: note.slice(0, 280) } })), [update]);
  const markQuizCorrect = useCallback(() => update((current) => current.quizCorrectDates.includes(today()) ? current : { ...current, quizCorrectDates: [...current.quizCorrectDates, today()] }), [update]);

  return { ...data, isReady, toggleTeam, recordScan, saveFilter, removeFilter, saveEvoNote, markQuizCorrect };
}