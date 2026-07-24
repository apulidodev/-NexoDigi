"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Notification = { id: string; title: string; body: string; href: string | null; read_at: string | null; created_at?: string };

export function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let removeChannel: (() => void) | undefined;
    void Promise.all([fetch("/api/notifications").then((response) => response.ok ? response.json() : { notifications: [] }), fetch("/api/auth/session").then((response) => response.ok ? response.json() : { user: null })]).then(([notifications, session]: [{ notifications: Notification[] }, { user: { id: string } | null }]) => {
      setItems(notifications.notifications ?? []);
      if (!session.user) return;
      try {
        const supabase = createSupabaseBrowserClient();
        const channel = supabase.channel(`notifications:${session.user.id}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${session.user.id}` }, (payload) => setItems((current) => [payload.new as Notification, ...current])).subscribe();
        removeChannel = () => { void supabase.removeChannel(channel); };
      } catch { /* Backend no configurado: el buzón sigue funcionando al recargar. */ }
    }).catch(() => {});
    return () => removeChannel?.();
  }, []);
  const unread = items.filter((item) => !item.read_at).length;
  async function read(item: Notification) { setItems((current) => current.map((value) => value.id === item.id ? { ...value, read_at: new Date().toISOString() } : value)); await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id }) }); }
  return <div className="relative"><button type="button" onClick={() => setOpen((value) => !value)} aria-label="Notificaciones" className="relative grid size-9 place-items-center rounded-lg border-2 border-[#172539] bg-white font-mono text-sm font-black">!{unread > 0 && <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-[#f36d57] text-[9px] text-white">{unread}</span>}</button>{open && <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border-2 border-[#172539] bg-[#f7f1e7] p-3 shadow-[5px_5px_0_#172539]"><p className="px-2 py-1 font-mono text-[10px] font-black uppercase">Transmisiones</p>{items.length ? <ul className="mt-1 grid gap-1">{items.map((item) => <li key={item.id}><a href={item.href ?? "#"} onClick={() => void read(item)} className={`block rounded-xl p-3 text-sm ${item.read_at ? "text-[#405065]" : "bg-[#dcebdc] font-bold"}`}><span className="block">{item.title}</span><span className="mt-1 block text-xs font-normal">{item.body}</span></a></li>)}</ul> : <p className="p-3 text-sm text-[#405065]">No tienes transmisiones nuevas.</p>}</div>}</div>;
}