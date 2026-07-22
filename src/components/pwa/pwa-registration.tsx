"use client";

import { useEffect } from "react";

export function PwaRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        void navigator.serviceWorker.register("/sw.js");
      }, { once: true });
    }
  }, []);

  return null;
}