"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type Profile = { handle: string; avatarUrl: string | null; bio: string | null; joinedAt: string; collectionCount: number; completedRuns: number; badges: Array<{ awarded_at: string; badge: { slug: string; name: string; rarity: string; emblem: string } | null }> };
const symbols: Record<string, string> = { signal: "⌁", radar: "◉", archive: "▤", voice: "✦", rift: "ϟ", core: "◈", crown: "♛", eclipse: "◐" };
const rarity: Record<string, string> = { common: "bg-[#dcebdc]", rare: "bg-[#79c8ea]", epic: "bg-[#f36d57]", legendary: "bg-[#fdcc48]" };

export default function PublicTamerPage({ params }: { params: Promise<{ handle: string }> }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [message, setMessage] = useState("Localizando transmisión...");
  useEffect(() => {
    void params.then(({ handle }) => fetch(`/api/tamers/${encodeURIComponent(handle)}`)).then((response) => response.json().then((data) => ({ response, data }))).then(({ response, data }: { response: Response; data: { profile?: Profile; error?: string } }) => {
      if (!response.ok || !data.profile) { setMessage(data.error ?? "Perfil no disponible."); return; }
      setProfile(data.profile); setMessage("");
    }).catch(() => setMessage("No fue posible localizar el perfil."));
  }, [params]);
  return <main className="min-h-screen bg-[#f7f1e7] px-5 py-12 text-[#172539]"><section className="mx-auto max-w-2xl rounded-[2rem] border-2 border-[#172539] bg-white p-7 shadow-[8px_8px_0_#172539] sm:p-10"><Link href="/" className="font-mono text-xs font-black uppercase underline">← Volver a NexoDigi</Link>{profile ? <><div className="mt-10 flex items-center gap-5">{profile.avatarUrl ? <Image src={profile.avatarUrl} alt="" width={96} height={96} unoptimized className="size-20 rounded-2xl border-2 border-[#172539] object-cover" /> : <div className="grid size-20 place-items-center rounded-2xl border-2 border-[#172539] bg-[#fdcc48] font-mono text-3xl font-black">@</div>}<div><p className="font-mono text-xs font-black uppercase tracking-widest text-[#d85746]">Perfil público Tamer</p><h1 className="mt-2 font-mono text-3xl font-black uppercase">@{profile.handle}</h1></div></div><p className="mt-7 text-base leading-7 text-[#405065]">{profile.bio || "Este Tamer aún no ha registrado una biografía."}</p><div className="mt-8 grid gap-3 sm:grid-cols-2"><article className="rounded-2xl border-2 border-[#172539] bg-[#dcebdc] p-4"><p className="font-mono text-[10px] font-black uppercase">Archivo personal</p><p className="mt-2 font-mono text-3xl font-black">{profile.collectionCount}</p><p className="text-xs text-[#405065]">señales guardadas</p></article><article className="rounded-2xl border-2 border-[#172539] bg-[#79c8ea] p-4"><p className="font-mono text-[10px] font-black uppercase">Rutas Rift</p><p className="mt-2 font-mono text-3xl font-black">{profile.completedRuns}</p><p className="text-xs text-[#405065]">completadas online</p></article></div><section className="mt-8 rounded-2xl border-2 border-[#172539] bg-[#172539] p-5 text-white"><p className="font-mono text-[10px] font-black uppercase text-[#fdcc48]">Insignias obtenidas</p><h2 className="mt-2 font-mono text-xl font-black uppercase">Medallero Tamer</h2>{profile.badges.length ? <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{profile.badges.filter((item) => item.badge).map((item) => <article key={item.badge!.slug} className="rounded-xl border border-slate-500 bg-white/10 p-3 text-center"><div className={`mx-auto grid size-10 place-items-center rounded-full border-2 border-[#172539] text-xl text-[#172539] ${rarity[item.badge!.rarity] ?? "bg-white"}`}>{symbols[item.badge!.emblem] ?? "◆"}</div><p className="mt-2 font-mono text-[10px] font-black uppercase leading-tight">{item.badge!.name}</p></article>)}</div> : <p className="mt-3 text-sm text-slate-300">Este Tamer todavía no ha desbloqueado insignias públicas.</p>}</section></> : <p className="mt-10 rounded-xl border-2 border-[#172539] bg-[#dcebdc] p-4 text-sm" role="status">{message}</p>}</section></main>;
}
