"use client";

import { useEffect, useState } from "react";

const storageKey = "nexodigi-collection";

function validIds(value: unknown): number[] {
  return Array.from(new Set(Array.isArray(value) ? value.filter((item): item is number => typeof item === "number" && Number.isInteger(item) && item > 0) : []));
}

export function useCollection() {
  const [ids, setIds] = useState<number[]>([]);
  const [isReady, setIsReady] = useState(false);

  function persist(next: number[]) {
    window.localStorage.setItem(storageKey, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("nexodigi:collection-change", { detail: next }));
  }

  useEffect(() => {
    try {
      setIds(validIds(JSON.parse(window.localStorage.getItem(storageKey) ?? "[]")));
    } finally {
      setIsReady(true);
    }

    const sync = (event: Event) => setIds(validIds((event as CustomEvent<unknown>).detail));
    window.addEventListener("nexodigi:collection-change", sync);
    return () => window.removeEventListener("nexodigi:collection-change", sync);
  }, []);

  function toggle(id: number) {
    const next = ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
    setIds(next);
    persist(next);
    if (!ids.includes(id)) { void fetch("/api/challenges/primer-vinculo/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ increment: 1 }) }).catch(() => {}); }
  }

  function exportCollection() { return JSON.stringify({ version: 1, digimonIds: ids, exportedAt: new Date().toISOString() }, null, 2); }
  function importCollection(raw: string) {
    const parsed = JSON.parse(raw) as { digimonIds?: unknown } | unknown;
    const next = validIds(typeof parsed === "object" && parsed !== null && "digimonIds" in parsed ? parsed.digimonIds : parsed);
    setIds(next);
    persist(next);
    return next.length;
  }

  return { ids, isReady, toggle, includes: (id: number) => ids.includes(id), exportCollection, importCollection };
}