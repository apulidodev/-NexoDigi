"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { TamerAccess } from "@/components/auth/tamer-access";

const links = [
  ["Inicio", "#inicio"], ["Archivo", "#archivo"], ["Consola Tamer", "#tamer"], ["NexoRift", "#nexorift"], ["Misiones", "#mision"], ["Comunidad", "#comunidad"], ["Medallas", "#medallas"],
] as const;

export function MobileNav() {
  const [open, setOpen] = useState(false);
  function collection() { setOpen(false); document.getElementById("archivo")?.scrollIntoView({ behavior: "smooth", block: "start" }); window.setTimeout(() => window.dispatchEvent(new Event("nexodigi:open-collection")), 500); }
  return <div className="md:hidden"><button type="button" aria-label="Abrir menú" aria-expanded={open} onClick={() => setOpen(true)} className="grid size-11 place-items-center rounded-xl border-2 border-[#172539] bg-[#fdcc48] font-mono text-xl font-black shadow-[3px_3px_0_#172539]"><span className="leading-none">☰</span></button><AnimatePresence>{open && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-[#172539]/55" onClick={() => setOpen(false)}><motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 320, damping: 31 }} onClick={(event) => event.stopPropagation()} className="ml-auto flex h-full w-[min(23rem,88vw)] flex-col overflow-y-auto border-l-2 border-[#172539] bg-[#f7f1e7] p-5 shadow-[-7px_0_0_#f36d57]"><div className="flex items-center justify-between"><span className="font-mono text-sm font-black uppercase tracking-[.14em]">NexoDigi</span><button type="button" aria-label="Cerrar menú" onClick={() => setOpen(false)} className="grid size-10 place-items-center rounded-xl border-2 border-[#172539] bg-white font-mono text-lg font-black">×</button></div><div className="mt-5 border-y-2 border-[#172539] py-4"><TamerAccess mobile onNavigate={() => setOpen(false)} /></div><nav className="mt-5 grid gap-2">{links.map(([label, href], index) => <a key={href} href={href} onClick={() => setOpen(false)} className="flex items-center justify-between rounded-xl border-2 border-[#172539] bg-white px-4 py-3 font-mono text-sm font-black uppercase shadow-[3px_3px_0_#172539]"><span>{label}</span><span className="text-[#d85746]">0{index + 1}</span></a>)}</nav><button type="button" onClick={collection} className="mt-5 rounded-xl border-2 border-[#172539] bg-[#79c8ea] px-4 py-3 text-left font-mono text-sm font-black uppercase shadow-[3px_3px_0_#172539]">Mi colección →</button><div className="mt-5 flex items-center justify-between rounded-xl border-2 border-[#172539] bg-white p-3"><span className="font-mono text-xs font-black uppercase">Notificaciones</span><NotificationBell /></div><p className="mt-auto pt-8 font-mono text-[10px] font-black uppercase tracking-widest text-[#405065]">Archivo digital de Tamers</p></motion.aside></motion.div>}</AnimatePresence></div>;
}
