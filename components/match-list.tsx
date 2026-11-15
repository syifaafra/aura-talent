import Link from "next/link";
import { fmtLong, type MatchCategory } from "@/lib/db";
import type { MatchRow } from "@/lib/queries";
import { Card, Tabs, cn, inputClass } from "./ui";

export const TAB_KEYS = {
  match: "Match",
  partial: "Partial Match",
  less: "Less Match",
} as const satisfies Record<string, MatchCategory>;

export type TabKey = keyof typeof TAB_KEYS;

export function parseTab(value: string | string[] | undefined): TabKey {
  const v = Array.isArray(value) ? value[0] : value;
  return v === "partial" || v === "less" ? v : "match";
}

export function vacancyText(row: MatchRow) {
  return row.position.open && row.position.openUntil
    ? `Lowongan dibuka hingga ${fmtLong(row.position.openUntil)}`
    : "Belum ada lowongan aktif";
}

export function MatchList({
  rows,
  tab,
  q,
  basePath,
  unit,
  detailBase,
  detailSuffix = "",
}: {
  rows: MatchRow[];
  tab: TabKey;
  q: string;
  basePath: string;
  unit: string;
  detailBase: string;
  detailSuffix?: string;
}) {
  const count = (k: TabKey) => rows.filter((r) => r.category === TAB_KEYS[k]).length;
  const shown = rows
    .filter((r) => r.category === TAB_KEYS[tab])
    .filter((r) => !q || `${r.position.title} ${r.position.label}`.toLowerCase().includes(q.toLowerCase()));
  const qs = (t: TabKey) => `${basePath}?tab=${t}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <div>
      <form action={basePath} role="search" className="mb-2 flex gap-3">
        <input type="hidden" name="tab" value={tab} />
        <label htmlFor="q" className="sr-only">
          Cari jabatan
        </label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          placeholder={`Cari jabatan dalam rumpun ${unit}…`}
          className={cn(inputClass, "border-0 py-4 text-[1.25rem]")}
        />
        <button type="submit" className="rounded-lg bg-brand-soft px-6 font-semibold text-brand hover:bg-[#d3e7f7]">
          Cari
        </button>
      </form>
      <p className="mb-6 text-[1.05rem] text-muted">
        Satu level di atas jabatan saat ini · Rumpun yang sama dengan jabatan kini atau riwayat jabatan
      </p>

      <Tabs
        items={(Object.keys(TAB_KEYS) as TabKey[]).map((k) => ({
          label: `${TAB_KEYS[k]} (${count(k)})`,
          href: qs(k),
          active: k === tab,
        }))}
      />

      {shown.length === 0 ? (
        <Card>
          <p className="text-[1.2rem] text-muted">Tidak ada jabatan pada kategori {TAB_KEYS[tab]}.</p>
        </Card>
      ) : (
        <ul className="space-y-4">
          {shown.map((r) => (
            <li key={r.position.id}>
              <Card className="flex flex-wrap items-center justify-between gap-4 py-5">
                <div>
                  <p className="text-[1.45rem] font-semibold text-ink">
                    {r.position.title} · {r.position.label}
                  </p>
                  <p className="mt-1 text-[1.15rem] text-muted">
                    {r.category} · {vacancyText(r)}
                  </p>
                </div>
                <Link
                  href={`${detailBase}/${r.position.id}${detailSuffix}`}
                  className="text-[1.25rem] font-semibold text-brand hover:underline"
                >
                  Lihat detail →
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
