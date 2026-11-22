import Link from "next/link";
import type { ReactNode } from "react";
import { fmtLong, type Employee } from "@/lib/db";
import {
  DEV_AREA_INFO,
  devAreas,
  mandatoryScore,
  pendingDocuments,
  relatedPositionsFor,
  type MatchRow,
} from "@/lib/queries";
import { CategoryBadge, vacancyText } from "./match-list";
import { Card, CardTitle, Notice, cn } from "./ui";

const DOC_LABEL: Record<string, string> = { Wawancara: "wawancara", Kesehatan: "rekomendasi kesehatan", LHKPN: "LHKPN" };

/**
 * W-05 Detail kecocokan jabatan. Shared by Karyawan (own) and Atasan (direct report); the only
 * differences are the links and the footer action passed in by the page. Never shows a score.
 */
export function MatchDetail({
  e,
  row,
  area,
  areaHref,
  relatedHref,
  footer,
  subject,
}: {
  e: Employee;
  row: MatchRow;
  /** Selected development area (query string); defaults to the first one. */
  area?: string;
  areaHref: (area: string) => string;
  relatedHref: (positionId: string) => string;
  footer: ReactNode;
  /** "Anda" for Karyawan, the employee's name for Atasan. */
  subject: string;
}) {
  const { position: p, category } = row;
  const areas = devAreas(p);
  const current = areas.includes(area ?? "") ? (area as string) : areas[0];
  const related = current ? relatedPositionsFor(e, current, p.id) : [];
  const { met, total } = mandatoryScore(e);
  const pending = pendingDocuments(e)
    .map((x) => DOC_LABEL[x])
    .join(", ");
  const you = subject === "Anda";

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-[1.9rem] font-semibold">{p.title}</h2>
            <CategoryBadge category={category} />
          </div>
          <p className="mt-2 text-[1.2rem] text-muted">
            Unit {p.unit} · Satu level di atas · {p.competencies.length} kompetensi sesuai · {areas.length} development
            area
          </p>
          <p className={cn("mt-1 text-[1.15rem] font-medium", met === total ? "text-ok" : "text-warn")}>
            Syarat wajib: {met === total ? "lengkap" : `${met} dari ${total} terpenuhi`}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-[1.2rem] font-semibold ${p.open ? "text-brand" : "text-warn"}`}>
            {p.open ? "Lowongan aktif" : "Tidak ada lowongan aktif"}
          </p>
          <p className="mt-1 text-[1.1rem] text-muted">
            {p.open && p.openUntil ? `Tutup ${fmtLong(p.openUntil)}` : "Pencalonan belum dibuka"}
          </p>
        </div>
      </Card>

      <Card>
        <CardTitle>Kompetensi yang sesuai</CardTitle>
        <p className="text-[1.2rem] text-ok">{p.competencies.join(" · ") || "Belum ada kompetensi yang sesuai."}</p>
        <h3 className="mt-5 text-[1.25rem] font-semibold">Key strength</h3>
        <p className="mt-2 text-[1.2rem] leading-relaxed">{p.keyStrength}</p>
      </Card>

      <Card>
        <CardTitle>Development area ({areas.length})</CardTitle>
        {areas.length === 0 ? (
          <p className="text-[1.15rem] text-muted">Tidak ada development area untuk jabatan ini.</p>
        ) : (
          <>
            <p className="text-[1.15rem] text-muted">
              Kompetensi yang disyaratkan jabatan ini tetapi belum mencapai level yang diminta.
            </p>
            <div className="mt-4 flex flex-wrap gap-3" role="tablist" aria-label="Development area">
              {areas.map((a) => (
                <Link
                  key={a}
                  href={areaHref(a)}
                  scroll={false}
                  role="tab"
                  aria-selected={a === current}
                  className={cn(
                    "rounded-full border px-5 py-2 text-[1.1rem] font-semibold",
                    a === current
                      ? "border-brand bg-brand text-white"
                      : "border-line bg-white text-brand hover:bg-brand-soft",
                  )}
                >
                  {a}
                </Link>
              ))}
            </div>

            <div className="mt-6 grid gap-8 lg:grid-cols-2">
              <div className="space-y-5">
                <div>
                  <h3 className="text-[1.2rem] font-semibold">Apa artinya</h3>
                  <p className="mt-1 text-[1.15rem] leading-relaxed text-muted">
                    {DEV_AREA_INFO[current] ?? "Kompetensi yang disyaratkan jabatan ini."}
                  </p>
                </div>
                <div>
                  <h3 className="text-[1.2rem] font-semibold">Posisi {subject}</h3>
                  <p className="mt-1 text-[1.15rem] leading-relaxed text-muted">
                    {you ? "Level Anda" : `Level ${e.name}`} belum mencapai level yang disyaratkan jabatan ini. Sumber:{" "}
                    {e.assessment
                      ? `asesmen terakhir (${e.assessment.date ? fmtLong(e.assessment.date) : `berlaku sampai ${fmtLong(e.assessment.validUntil)}`})`
                      : "belum ada hasil asesmen"}
                    .
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-[1.2rem] font-semibold">
                  Jabatan lain yang mensyaratkan kompetensi ini ({related.length})
                </h3>
                <p className="mt-1 text-base text-muted">Hanya jabatan satu level di atas dalam rumpun yang sama.</p>
                {related.length === 0 ? (
                  <div className="mt-3 rounded-lg bg-canvas px-5 py-4">
                    <p className="text-[1.15rem] font-semibold">
                      Tidak ada jabatan lain dalam cakupan {you ? "Anda" : subject}
                    </p>
                    <p className="mt-1 text-base text-muted">
                      Kompetensi ini hanya disyaratkan oleh jabatan yang sedang dilihat.
                    </p>
                  </div>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {related.map((m) => (
                      <li
                        key={m.position.id}
                        className="flex items-center justify-between gap-4 rounded-lg bg-canvas px-5 py-3"
                      >
                        <div>
                          <p className="text-[1.15rem] font-semibold">{m.position.title}</p>
                          <p className="text-base text-muted">
                            Unit {m.position.unit} · {m.category} · {vacancyText(m)}
                          </p>
                        </div>
                        <Link href={relatedHref(m.position.id)} className="shrink-0 font-semibold text-brand hover:underline">
                          Lihat detail →
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </Card>

      {pending ? (
        <Notice tone="warn" title="Syarat yang belum lengkap">
          {pending.charAt(0).toUpperCase() + pending.slice(1)}: menunggu. Tidak menggugurkan pencalonan awal; wajib
          lengkap sebelum persetujuan final.
        </Notice>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-5">
        <p className="text-[1.1rem] text-muted">
          {p.open && p.openUntil ? `Lowongan aktif sampai ${fmtLong(p.openUntil)}` : "Belum ada lowongan aktif"}
        </p>
        <div className="flex flex-wrap items-center gap-4">{footer}</div>
      </div>
    </div>
  );
}
