import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Footer, SessionHeader } from "@/components/shell";
import { chooseRole } from "@/lib/actions";
import { ROLE_LABEL, type RoleKey } from "@/lib/db";
import { readSession } from "@/lib/session";

export const metadata = { title: "Pilih peran · AURA Talent" };

function RoleIcon({ role }: { role: RoleKey }) {
  const common = {
    width: 40,
    height: 40,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (role === "hr")
    return (
      <svg {...common}>
        <circle cx="10" cy="7" r="3.5" />
        <path d="M3.5 20c0-3.6 2.9-6 6.5-6 1 0 1.9.2 2.7.5" />
        <path d="M18 14l1 2.1 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3z" />
      </svg>
    );
  if (role === "karyawan" || role === "atasan")
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20c0-3.7 2.9-6 6.5-6s6.5 2.3 6.5 6z" />
        <circle cx="17" cy="9.5" r="2.5" />
        <path d="M17 14.5c2.6 0 4.5 1.7 4.5 4.5" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M12 3l8 3v5c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V6z" />
      <path d="M8.5 12l2.5 2.5 4.5-5" />
    </svg>
  );
}

async function RoleChoices() {
  const session = await readSession();
  if (!session) redirect("/login");
  return (
    <ul className="grid gap-6 md:grid-cols-2">
      {session.user.roles.map((role) => (
        <li key={role}>
          <form action={chooseRole}>
            <input type="hidden" name="role" value={role} />
            <button
              type="submit"
              className="flex w-full items-center gap-5 rounded-xl bg-white px-10 py-9 text-left shadow-sm transition hover:shadow-md focus-visible:ring-2"
            >
              <span className="text-ink">
                <RoleIcon role={role} />
              </span>
              <span className="flex-1 text-[1.7rem] font-semibold text-brand">{ROLE_LABEL[role]}</span>
              <span aria-hidden="true" className="text-3xl text-ink">
                ›
              </span>
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}

export default function RolePage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Suspense fallback={<div className="h-[5.4rem] bg-brand" />}>
        <SessionHeader />
      </Suspense>
      <main className="mx-auto w-full max-w-[96rem] flex-1 px-10 py-16">
        <h1 className="text-[2.6rem] font-semibold text-ink">Anda ingin melanjutkan sebagai apa?</h1>
        <p className="mb-9 mt-3 text-[1.4rem] text-muted">
          Hanya peran yang diberikan kepada akun Anda yang dapat dipilih. Berikut katalog tampilan peran.
        </p>
        <Suspense fallback={<p className="text-muted">Memuat peran…</p>}>
          <RoleChoices />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
