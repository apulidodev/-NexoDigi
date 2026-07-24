"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type Profile = { handle: string; avatarUrl: string | null; bio: string | null; joinedAt: string; collectionCount: number; completedRuns: number };

export default function PublicTamerPage({ params }: { params: Promise<{ handle: string }> }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [message, setMessage] = useState("Localizando transmisión...");
  useEffect(() => {
    void params.then(({ handle }) => fetch(`/api/tamers/${encodeURIComponent(handle)}`)).then((response) => response.json().then((data) => ({ response, data }))).then(({ response, data }: { response: Response; data: { profile?: Profile; error?: string } }) => {
      if (!response.ok || !data.profile) { setMessage(data.error ?? "Perfil no disponible."); return; }
      setProfile(data.profile); setMessage("");
    }).catch(() => setMessage("No fue posible localizar el perfil."));
  }, [params]);
  return <main className="min-h-screen bg-[#f7f1e7] px-5 py-12 text-[#172539]"><section className="mx-auto max-w-2xl rounded-[2rem] border-2 border-[#172539] bg-white p-7 shadow-[8px_8px_0_#172539] sm:p-10"><Link href="/" className="font-mono text-xs font-black uppercase underline">← Volver a NexoDigi</Link>{profile ? <><div className="mt-10 flex items-center gap-5">{profile.avatarUrl ? <Image src={profile.avatarUrl} alt="" width={96} height={96} unoptimized className="size-20 rounded-2xl border-2 border-[#172539] object-cover" /> : <div className="grid size-20 place-items-center rounded-2xl border-2 border-[#172539] bg-[#fdcc48] font-mono text-3xl font-black">@</div>}<div><p className="font-mono text-xs font-black uppercase tracking-widest text-[#d85746]">Perfil público Tamer</p><h1 className="mt-2 font-mono text-3xl font-black uppercase">@{profile.handle}</h1></div></div><p className="mt-7 text-base leading-7 text-[#405065]">{profile.bio || "Este Tamer aún no ha registrado una biografía."}</p><div className="mt-8 grid gap-3 sm:grid-cols-2"><article className="rounded-2xl border-2 border-[#172539] bg-[#dcebdc] p-4"><p className="font-mono text-[10px] font-black uppercase">Archivo personal</p><p className="mt-2 font-mono text-3xl font-black">{profile.collectionCount}</p><p className="text-xs text-[#405065]">señales guardadas</p></article><article className="rounded-2xl border-2 border-[#172539] bg-[#79c8ea] p-4"><p className="font-mono text-[10px] font-black uppercase">Rutas Rift</p><p className="mt-2 font-mono text-3xl font-black">{profile.completedRuns}</p><p className="text-xs text-[#405065]">completadas online</p></article></div></> : <p className="mt-10 rounded-xl border-2 border-[#172539] bg-[#dcebdc] p-4 text-sm" role="status">{message}</p>}</section></main>;
}