import Link from "next/link";
import { db, type Employee } from "@/lib/db";
import { CATEGORY_ORDER, eligibleVacancies, getPosition, isCategoryDeterminable, matchesFor } from "@/lib/queries";
import { Card, EmptyState, buttonClass, inputClass } from "./ui";

function note(s: Employee) {
  if (!isCategoryDeterminable(s)) return { text: "Kategori belum dapat ditentukan", tone: "text-warn" };
  const self = db().nominations.find((n) => n.badge === s.badge && n.source === "Diri sendiri" && n.response !== "Ditolak");
  if (self) return { text: `Sudah mencalonkan diri ke ${getPosition(self.vacancyId)?.title ?? self.vacancyId}`, tone: "text-brand" };
  const n = eligibleVacancies(s).length;
  return n > 0
    ? { text: `${n} bisa dicalonkan sekarang`, tone: "text-ok" }
    : { text: "Belum ada yang bisa dicalonkan", tone: "text-muted" };
}

/** Layar A: choose a direct report. The search box stays because the list can be long (same as W-16). */
export function SubordinateList({
  subs,
  q,
  basePath,
}: {
  subs: Employee[];
  q: string;
  basePath: string;
}) {
  const shown = subs.filter((s) => !q || `${s.name} ${s.badge}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <form action={basePath} role="search" className="mb-6 flex gap-3">
        <label htmlFor="q" className="sr-only">
          Cari nama atau NIK
        </label>
        <input id="q" name="q" defaultValue={q} placeholder="Cari nama atau NIK bawahan…" className={inputClass} />
        <button type="submit" className="rounded-lg bg-brand-soft px-6 font-semibold text-brand hover:bg-[#d3e7f7]">
          Cari
        </button>
      </form>
      {subs.length === 0 ? (
        <EmptyState title="Belum ada bawahan langsung">Akun ini tidak memiliki bawahan langsung pada data karyawan.</EmptyState>
      ) : shown.length === 0 ? (
        <EmptyState title="Tidak ada bawahan yang cocok">Ubah kata kunci pencarian.</EmptyState>
      ) : (
        <ul className="space-y-4">
          {shown.map((s) => {
            const rows = matchesFor(s);
            const counts = CATEGORY_ORDER.map((c) => `${c.replace(" Match", "")} ${rows.filter((r) => r.category === c).length}`);
            const n = note(s);
            return (
              <li key={s.badge}>
                <Card className="flex flex-wrap items-center justify-between gap-4 py-5">
                  <div className="flex items-center gap-4">
                    <span
                      aria-hidden
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-[1.2rem] font-semibold text-brand"
                    >
                      {s.name
                        .split(" ")
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join("")}
                    </span>
                    <div>
                      <p className="text-[1.35rem] font-semibold">{s.name}</p>
                      <p className="text-[1.05rem] text-muted">
                        {s.position} · {s.badge}
                      </p>
                      <p className="mt-1 text-[1.05rem]">
                        {isCategoryDeterminable(s) ? counts.join(" · ") : "—"}
                        <span className={`ml-3 font-medium ${n.tone}`}>{n.text}</span>
                      </p>
                    </div>
                  </div>
                  <Link href={`/atasan/pencalonan?badge=${s.badge}`} className={buttonClass("secondary")}>
                    Lihat jabatan →
                  </Link>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
