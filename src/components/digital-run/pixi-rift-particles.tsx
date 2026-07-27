"use client";

import { useEffect, useRef } from "react";

export function PixiRiftParticles({ active }: { active: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = host.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let disposed = false;
    let release = () => {};
    void (async () => {
      const { Application, Graphics } = await import("pixi.js");
      const app = new Application();
      await app.init({ resizeTo: element, backgroundAlpha: 0, antialias: true, autoDensity: true, resolution: Math.min(window.devicePixelRatio || 1, 2) });
      if (disposed) { app.destroy(true); return; }
      element.appendChild(app.canvas);
      const particles = Array.from({ length: active ? 68 : 38 }, (_, index) => {
        const particle = new Graphics().circle(0, 0, 1 + (index % 3)).fill({ color: index % 3 === 0 ? 0xfdcc48 : index % 3 === 1 ? 0x79c8ea : 0xf36d57, alpha: .46 + (index % 4) * .1 });
        particle.x = Math.random() * app.screen.width;
        particle.y = Math.random() * app.screen.height;
        app.stage.addChild(particle);
        return { particle, drift: .16 + Math.random() * .52, wave: Math.random() * Math.PI * 2 };
      });
      const tick = (ticker: { deltaTime: number; elapsedMS: number }) => {
        const speed = active ? 1.35 : .72;
        particles.forEach((entry, index) => {
          entry.particle.y -= entry.drift * ticker.deltaTime * speed;
          entry.particle.x += Math.sin(ticker.elapsedMS * .0014 + entry.wave) * .28;
          entry.particle.alpha = .32 + Math.sin(ticker.elapsedMS * .002 + index) * .16;
          if (entry.particle.y < -8) { entry.particle.y = app.screen.height + 8; entry.particle.x = Math.random() * app.screen.width; }
        });
      };
      app.ticker.add(tick);
      release = () => { app.ticker.remove(tick); app.destroy(true); };
    })().catch(() => { /* El fondo CSS sigue disponible si WebGL no está disponible. */ });
    return () => { disposed = true; release(); };
  }, [active]);
  return <div ref={host} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden opacity-75" />;
}
