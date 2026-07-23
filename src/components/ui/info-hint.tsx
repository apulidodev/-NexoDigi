"use client";

import { useState } from "react";

type InfoHintProps = {
  text: string;
  label?: string;
  className?: string;
};

export function InfoHint({ text, label = "Más información", className = "" }: InfoHintProps) {
  const [isOpen, setIsOpen] = useState(false);

  return <span className={`relative inline-flex shrink-0 align-top ${className}`}><button type="button" aria-label={label} aria-expanded={isOpen} onClick={() => setIsOpen((current) => !current)} className="grid size-6 place-items-center rounded-full border-2 border-current bg-white font-mono text-xs font-black leading-none text-[#172539] shadow-[2px_2px_0_#172539] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f36d57]">i</button>{isOpen && <span role="status" className="absolute left-0 top-8 z-50 w-64 rounded-xl border-2 border-[#172539] bg-[#f7f1e7] p-3 text-left font-sans text-xs font-normal leading-5 normal-case tracking-normal text-[#405065] shadow-[4px_4px_0_#172539]">{text}</span>}</span>;
}