import Link from "next/link";
import type { ReactNode } from "react";
import { fmtLong, type Employee, type MatchCategory } from "@/lib/db";
import { matchSummary, sortedMatches, type MatchRow } from "@/lib/queries";
import { Card, Pill, cn, type Tone } from "./ui";

export const CATEGORY_TONE: Record<MatchCategory, Tone> = {
  Match: "ok",
  "Partial Match": "warn",
  "Less Match": "danger",
};

const FILTER_KEYS = {
  match: "Match",
  partial: "Partial Match",
  less: "Less Match",
} as const satisfies Record<string, MatchCategory>;

export type FilterKey = "semua" | keyof typeof FILTER_KEYS;

export function parseFilter(value: string | string[] | undefined): FilterKey {
  const v = Array.isArray(value) ? value[0] : value;
  return v === "match" || v === "partial" || v === "less" ? v : "semua";
}

export function CategoryBadge({ category }: { category: MatchCategory }) {
  return <Pill tone={CATEGORY_TONE[category]}>{category}</Pill>;
}

export function vacancyText(row: MatchRow) {
  return row.position.open && row.position.openUntil
    ? `Lowongan aktif sampai ${fmtLong(row.position.openUntil)}`
    : "Belum ada lowongan aktif";
}

/**
 * W-04 Kecocokan jabatan. One list ordered Match → Partial → Less (vacancy first within a category),
 * filtered with chips instead of tabs; no search box because the scope holds only a handful of positions.
 * Shows categories only, never a score. Reused by Atasan for a direct report (`actionFor`).
 */
export function MatchList({
  e,
  filter,
  basePath,
  query,
  detailHref,
  actionFor,
  scope,
}: {
  e: Employee;
  filter: FilterKey;
  basePath: string;
  /** Extra query string kept on every chip link (e.g. `badge=000001`). */
  query?: string;
  detailHref: (row: MatchRow) => string;
  actionFor?: (row: MatchRow) => ReactNode;
  scope: string;
}) {
  const rows = sortedMatches(e);
  const count = (k: keyof typeof FILTER_KEYS) => rows.filter((r) => r.category === FILTER_KEYS[k]).length;
  const chips: Array<{ key: FilterKey; label: string; n: number }> = [
    { key: "semua", label: "Semua", n: rows.length },
    ...(Object.keys(FILTER_KEYS) as Array<keyof typeof FILTER_KEYS>)
      .map((k) => ({ key: k as FilterKey, label: FILTER_KEYS[k] as string, n: count(k) }))
      .filter((c) => c.n > 0),
  ];
  const shown = filter === "semua" ? rows : rows.filter((r) => r.category === FILTER_KEYS[filter]);
  const href = (k: FilterKey) => {
    const parts = [query, k === "semua" ? "" : `kategori=${k}`].filter(Boolean).join("&");
    return parts ? `${basePath}?${parts}` : basePath;
  };

  return (
    <div>
      <p className="mb-4 text-[1.1rem] text-muted">{scope}</p>

      <nav aria-label="Filter kategori" className="mb-6 flex flex-wrap gap-3">
        {chips.map((c) => {
          const on = c.key === filter;
          return (
            <Link
              key={c.key}
              href={href(c.key)}
              aria-current={on ? "true" : undefined}
              className={cn(
                "rounded-full border px-5 py-2 text-[1.1rem] font-semibold",
                on ? "border-brand bg-brand text-white" : "border-line bg-white text-muted hover:text-ink",
              )}
            >
              {c.label} ({c.n})
            </Link>
          );
        })}
      </nav>

      {shown.length === 0 ? (
        <Card>
          <p className="text-[1.2rem] text-muted">Belum ada jabatan dalam cakupan kecocokan.</p>
        </Card>
      ) : (
        <ul className="space-y-4">
          {shown.map((r) => (
            <li key={r.position.id}>
              <Card className="flex flex-wrap items-center justify-between gap-4 py-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-[1.4rem] font-semibold text-ink">{r.position.title}</p>
                    <CategoryBadge category={r.category} />
                  </div>
                  <p className="mt-1 text-[1.1rem] text-muted">
                    Unit {r.position.unit} · {matchSummary(e, r)}
                  </p>
                  <p className={cn("mt-1 text-[1.05rem]", r.position.open ? "text-brand" : "text-muted")}>
                    {vacancyText(r)}
                  </p>
                </div>
                <div className="flex items-center gap-5">
                  {actionFor?.(r)}
                  <Link href={detailHref(r)} className="text-[1.2rem] font-semibold text-brand hover:underline">
                    Lihat detail →
                  </Link>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
