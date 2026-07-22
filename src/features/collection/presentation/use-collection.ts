"use client";

import { useEffect, useState } from "react";

const storageKey = "nexodigi-collection";

export function useCollection() {
  const [ids, setIds] = useState<number[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) setIds(JSON.parse(stored) as number[]);
    } finally {
      setIsReady(true);
    }
  }, []);

  function toggle(id: number) {
    setIds((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }

  return { ids, isReady, toggle, includes: (id: number) => ids.includes(id) };
}