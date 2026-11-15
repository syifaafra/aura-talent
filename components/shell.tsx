import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { logout } from "@/lib/actions";
import { ROLE_LABEL, fmtDateTime, roleGroup, type RoleKey } from "@/lib/db";
import { NAV } from "@/lib/nav";
import { notificationsFor, unreadCount } from "@/lib/queries";
import { readSession } from "@/lib/session";
import { NavLinks } from "./nav-links";
import { NotificationBell, type NotifItem } from "./notification-bell";

function notifHref(role: RoleKey, proposalId?: string) {
  if (!proposalId) return undefined;
  switch (roleGroup(role)) {
    case "approver":
      return `/approver/usulan/${proposalId}`;
    case "hr":
      return `/hr/persetujuan/${proposalId}`;
    case "karyawan":
      return "/karyawan/status";
    case "atasan":
      return "/atasan/status";
  }
}

export function Footer() {
  return (
    <footer className="flex h-14 shrink-0 items-center justify-between border-t border-line bg-white px-10 text-base text-muted">
      <span>© 2026 AURA Talent · PT Pupuk Sriwidjaja Palembang</span>
      <span>Pusat bantuan</span>
    </footer>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-6">
      <Link href="/" aria-label="AURA Talent" className="flex w-72 shrink-0 items-center pl-6">
        <Image
          src="/brand/logo-header.png"
          alt="Pupuk Sriwidjaja Palembang"
          width={504}
          height={119}
          priority
          className="h-[3.9rem] w-auto max-w-full object-contain object-left"
        />
      </Link>
      <span className="text-[1.75rem] font-semibold text-white">AURA Talent</span>
    </div>
  );
}

/** Header for screens that are shown after login but before a role is chosen. */
export async function SessionHeader() {
  const session = await readSession();
  if (!session) redirect("/login");
  return (
    <header className="flex h-[5.4rem] shrink-0 items-center justify-between bg-brand pr-8 text-white">
      <Brand />
      <div className="flex items-center gap-6 text-[1.2rem] font-medium">
        <span>{session.user.name}</span>
        <form action={logout}>
          <button type="submit" className="rounded-lg px-3 py-2 hover:bg-white/10">
            Keluar
          </button>
        </form>
      </div>
    </header>
  );
}

export async function Shell({ children }: { children: ReactNode }) {
  const session = await readSession();
  if (!session) redirect("/login");
  if (!session.role) redirect("/peran");

  const { user, role } = session;
  const group = roleGroup(role);
  const items: NotifItem[] = notificationsFor(role).map((n) => ({
    id: n.id,
    kind: n.kind,
    title: n.title,
    body: n.body,
    time: fmtDateTime(n.at),
    read: n.read,
    href: notifHref(role, n.proposalId),
  }));

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-[5.4rem] shrink-0 items-center justify-between bg-brand pr-8 text-white">
        <Brand />
        <div className="flex items-center gap-4 text-[1.2rem] font-medium">
          <NotificationBell items={items} unread={unreadCount(role)} />
          <span className="hidden text-white/90 xl:inline">{user.name}</span>
          {user.roles.length > 1 ? (
            <Link href="/peran" className="rounded-lg px-3 py-2 hover:bg-white/10" title="Ganti peran">
              Peran: {ROLE_LABEL[role]}
            </Link>
          ) : (
            <span className="px-3">Peran: {ROLE_LABEL[role]}</span>
          )}
          <form action={logout}>
            <button type="submit" className="rounded-lg px-3 py-2 hover:bg-white/10">
              Keluar
            </button>
          </form>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        <aside className="w-full shrink-0 border-line bg-white px-4 py-6 lg:w-80 lg:border-r">
          <p className="mb-4 px-3 text-sm font-semibold uppercase tracking-wide text-muted">Ruang kerja</p>
          <NavLinks items={NAV[group]} />
        </aside>
        <main className="min-w-0 flex-1 px-6 py-8 lg:px-8 lg:pt-10">{children}</main>
      </div>
      <Footer />
    </div>
  );
}

export function ShellFallback() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="h-[5.4rem] bg-brand" />
      <div className="flex flex-1">
        <div className="hidden w-80 border-r border-line bg-white lg:block" />
        <div className="flex-1 p-8 text-muted">Memuat…</div>
      </div>
    </div>
  );
}
