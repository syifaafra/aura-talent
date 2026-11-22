import { Suspense } from "react";
import { PageFallback } from "@/components/page-fallback";
import Link from "next/link";
import { ButtonLink, Card, DisabledButton, Notice, PageHeader, cn, inputClass } from "@/components/ui";
import { db, fmtDateTime } from "@/lib/db";
import {
  categoryFromScore,
  getEmployee,
  getPosition,
  isCategoryDeterminable,
  proposalForVacancy,
  repositoryEmployees,
} from "@/lib/queries";
import { MIN_CANDIDATES } from "@/lib/form";
import { requireRole } from "@/lib/session";
import { RecommendationTable, type RecRow } from "./recommendation-table";

export const metadata = { title: "Rekomendasi kandidat · AURA Talent" };

async function RekomendasiPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole("hr");
  const sp = await searchParams;
  const vacancies = db().positions.filter((p) => p.id in db().recommendations);
  const chosen = vacancies.find((p) => p.id === sp.jabatan) ?? vacancies[0];
  const recs = db().recommendations[chosen.id] ?? [];
  const proposal = proposalForVacancy(chosen.id);
  const locked = proposal && proposal.stage !== "draft" ? proposal.id : undefined;

  const rows: RecRow[] = recs.flatMap((r) => {
    const e = getEmployee(r.badge);
    if (!e) return [];
    const cat = categoryFromScore(r.score);
    return [
      {
        ...r,
        name: e.name,
        category: cat,
        strengths: e.strengths || r.reason,
        development: r.gap,
      },
    ];
  });

  const incomplete = repositoryEmployees()
    .filter((e) => !isCategoryDeterminable(e))
    .map((e) => ({
      name: e.name.split(" ")[0],
      reason: e.assessment ? "nilai akhir belum ada" : "asesmen tertunda",
    }));

  const selector = (
    <form action="/hr/rekomendasi" className="mb-6 flex flex-wrap items-end gap-4">
      <div className="min-w-[22rem]">
        <label htmlFor="jabatan" className="mb-1.5 block text-base font-semibold text-muted">
          Posisi / jabatan
        </label>
        <select id="jabatan" name="jabatan" defaultValue={chosen.id} className={cn(inputClass, "border-brand font-medium")}>
          {vacancies.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} · {p.label}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="rounded-lg bg-brand-soft px-6 py-3 font-semibold text-brand hover:bg-[#d3e7f7]">
        Tampilkan
      </button>
      {rows.length > 0 ? (
        <div className="rounded-lg bg-white px-5 py-2.5 text-base">
          <p className="text-sm font-semibold text-muted">Versi rekomendasi</p>
          <p className="font-medium text-brand">Versi: {fmtDateTime("2026-10-31T02:00")} (terbaru)</p>
          <p className="text-brand">Lihat riwayat versi</p>
        </div>
      ) : null}
    </form>
  );

  if (rows.length === 0) {
    return (
      <>
        <PageHeader
          title="Rekomendasi kandidat"
          subtitle={`${chosen.title} · ${chosen.label} · Hasil evaluasi saat tidak ada kandidat yang memenuhi kesiapan.`}
        />
        {selector}
        <div className="space-y-6">
          <Notice tone="warn" title="Tidak ada kandidat siap">
            Belum ada kandidat yang memenuhi syarat wajib dan kesiapan untuk jabatan ini. HR perlu meninjau gap serta kelengkapan data.
          </Notice>
          <Card>
            <h2 className="text-[1.6rem] font-semibold">Belum ada rekomendasi yang dapat diajukan</h2>
            <p className="mt-3 text-[1.15rem] leading-relaxed text-muted">
              Daftar kandidat siap akan muncul setelah evaluasi menghasilkan kandidat yang memenuhi ketentuan.
              <br />
              Tidak ada peringkat atau readiness score yang ditampilkan pada kondisi ini.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <ButtonLink href="/hr/repository">Tinjau Repository</ButtonLink>
              <DisabledButton>Ajukan Pencalonan</DisabledButton>
            </div>
          </Card>
          <p className="text-[1.1rem] text-muted">Tindak lanjut: lengkapi data yang kurang dan tinjau kebutuhan pengembangan kandidat.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Rekomendasi kandidat"
        subtitle={`${chosen.title} · ${chosen.label} · Peringkat berdasarkan syarat wajib dan readiness score`}
      />
      {selector}
      {locked ? (
        <Notice className="mb-6" title={`Usulan ${locked} sudah dikirim`}>
          Jabatan ini sudah memiliki usulan berjalan.{" "}
          <Link href={`/hr/persetujuan/${locked}`} className="font-semibold underline">
            Lihat status persetujuan
          </Link>
          .
        </Notice>
      ) : null}
      {rows.length < MIN_CANDIDATES ? (
        <Notice tone="warn" title={`Rekomendasi hanya menghasilkan ${rows.length} kandidat`} className="mb-6">
          Pencalonan membutuhkan minimal {MIN_CANDIDATES} kandidat. Lanjutkan ke formulir pencalonan dan tambahkan kandidat
          lain dari Daftar Talenta sebelum mengirim usulan.
        </Notice>
      ) : null}
      <RecommendationTable rows={rows} vacancyId={chosen.id} lockedBy={locked} />
      {incomplete.length > 0 ? (
        <Notice tone="warn" title="Data kandidat belum lengkap" className="mt-6">
          {incomplete.map((i) => (
            <span key={i.name} className="block">
              {i.name}: {i.reason}.
            </span>
          ))}
          <span className="block">Rincian kebutuhan data tersedia di repository.</span>
        </Notice>
      ) : null}
      <p className="sr-only">{getPosition(chosen.id)?.title}</p>
    </>
  );
}

export default function Page(props: Parameters<typeof RekomendasiPage>[0]) {
  return (
    <Suspense fallback={<PageFallback title="Rekomendasi kandidat" />}>
      <RekomendasiPage {...props} />
    </Suspense>
  );
}
