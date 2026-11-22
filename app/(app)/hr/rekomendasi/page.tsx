import { Suspense } from "react";
import { PageFallback } from "@/components/page-fallback";
import { ButtonLink, Card, DisabledButton, Notice, PageHeader, Pill } from "@/components/ui";
import { db, fmtDateTime, fmtLong } from "@/lib/db";
import {
  activeNomination,
  categoryFromScore,
  mandatoryScore,
  getEmployee,
  getPosition,
  isCategoryDeterminable,
  proposalForVacancy,
  repositoryEmployees,
} from "@/lib/queries";
import { requireRole } from "@/lib/session";
import { RecommendationTable, VacancySelect, type RecRow } from "./recommendation-table";

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
    const nom = activeNomination(r.badge, chosen.id);
    const { met, total } = mandatoryScore(e);
    return [
      {
        badge: r.badge,
        name: e.name,
        position: e.position,
        score: r.score,
        category: categoryFromScore(r.score),
        change: r.change,
        changeBy: r.changeBy,
        nominated: nom ? (nom.source === "Diri sendiri" ? "Diajukan Karyawan" : "Diajukan Atasan") : "",
        indicators: r.indicators,
        strengths: e.strengths || r.reason,
        gap: r.gap,
        reqMet: met,
        reqTotal: total,
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
    <Card className="mb-6 flex flex-wrap items-center justify-between gap-6">
      <div>
        <label className="mb-1.5 block text-base font-semibold text-muted">Jabatan</label>
        <VacancySelect value={chosen.id} options={vacancies.map((p) => ({ id: p.id, title: p.title }))} />
        <div className="mt-3 flex flex-wrap gap-2">
          <Pill tone={chosen.open ? "ok" : "neutral"}>
            {chosen.open && chosen.openUntil ? `Lowongan aktif sampai ${fmtLong(chosen.openUntil)}` : "Belum ada lowongan aktif"}
          </Pill>
          <Pill tone="brand">Prediksi kosong</Pill>
        </div>
      </div>
      {rows.length > 0 ? (
        <div className="text-right text-base">
          <p className="font-medium text-brand">Versi rekomendasi: {fmtDateTime("2026-10-31T02:00")} (terbaru)</p>
          <p className="text-brand">Lihat riwayat versi</p>
        </div>
      ) : null}
    </Card>
  );

  if (rows.length === 0) {
    return (
      <>
        <PageHeader
          title="Rekomendasi kandidat"
          subtitle={`${chosen.title} · Hasil evaluasi saat tidak ada kandidat yang memenuhi kesiapan.`}
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
        subtitle="Peringkat AI berdasarkan syarat wajib dan readiness score. Pilih 2–5 kandidat untuk disusun menjadi usulan promosi."
      />
      {selector}
      <RecommendationTable rows={rows} vacancyId={chosen.id} lockedBy={locked} versionDate="31 Okt 2026" />
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
