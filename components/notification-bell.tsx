"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { markAllRead } from "@/lib/actions";
import { cn } from "./ui";

export interface NotifItem {
  id: string;
  kind: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  href?: string;
}

export function NotificationBell({ items, unread }: { items: NotifItem[]; unread: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="rounded-lg px-3 py-2 text-[1.25rem] font-medium text-white hover:bg-white/10"
      >
        <span aria-hidden="true">🔔 </span>Notifikasi ({unread})
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Notifikasi"
          className="absolute right-0 top-[calc(100%+0.75rem)] z-40 max-h-[calc(100vh-7rem)] w-[min(26rem,92vw)] overflow-y-auto rounded-xl border border-line bg-white p-5 text-ink shadow-xl"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[1.5rem] font-semibold">Notifikasi</h2>
              <p className="mt-0.5 text-base text-muted">{unread} belum dibaca</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Tutup notifikasi"
              className="rounded-md px-2 text-2xl leading-none text-ink hover:bg-canvas"
            >
              ×
            </button>
          </div>

          <ul className="mt-3 space-y-2">
            {items.length === 0 ? <li className="py-4 text-muted">Belum ada notifikasi.</li> : null}
            {items.map((n) => (
              <li key={n.id} className={cn("rounded-lg px-4 py-3", n.read ? "bg-white" : "bg-brand-soft")}>
                <p className="text-sm font-semibold text-brand">{n.kind}</p>
                <p className="mt-0.5 text-[1.1rem] font-semibold">{n.title}</p>
                <p className="text-base text-muted">{n.body}</p>
                <div className="mt-1 flex items-center justify-between text-sm">
                  <span className="text-muted">{n.time}</span>
                  {n.href ? (
                    <Link
                      href={n.href}
                      onClick={() => setOpen(false)}
                      className="font-semibold text-brand hover:underline"
                    >
                      Buka usulan →
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>

          <form action={markAllRead} className="mt-3">
            <button
              type="submit"
              disabled={unread === 0}
              className="text-base font-semibold text-brand hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
            >
              Tandai semua dibaca
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
