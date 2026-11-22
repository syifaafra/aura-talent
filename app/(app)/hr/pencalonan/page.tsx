import { Suspense } from "react";
import { PageFallback } from "@/components/page-fallback";
import Link from "next/link";
import { Card, Notice, PageHeader } from "@/components/ui";
import { db, fmtLong } from "@/lib/db";
import {
  activeNomination,
  mandatoryScore,
  categoryFor,
  getEmployee,
  isCategoryDeterminable,
  matchesFor,
  proposalForVacancy,
} from "@/lib/queries";
import { requireRole } from "@/lib/session";
import { ProposalForm, type PoolItem } from "./proposal-form";

export const metadata = { title: "Susun usulan promosi · AURA Talent" };

async function PencalonanHr({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole("hr");
  const sp = await searchParams;
  const store = db();

  // Positions with a vacancy, plus predicted vacancies HR may still propose closed (no vacancy opened).
  const options = store.positions.filter((p) => p.vacancyCode || p.id in store.recommendations);
  const requested = typeof sp.lowongan === "string" ? sp.lowongan : undefined;
  const position =
    options.find((p) => p.id === requested) ??
    options.find((p) => p.open && !proposalForVacancy(p.id)) ??
    options[0];

  const proposal = proposalForVacancy(position.id);
  const locked = proposal && proposal.stage !== "draft";

  const closed = !position.vacancyCode;
  const closeText = closed
    ? "Usulan tertutup · Tanpa lowongan"
    : `Lowongan ${position.vacancyCode} · Tutup ${position.openUntil ? fmtLong(position.openUntil) : "-"}`;
  const header = (
    <PageHeader
      title={`Susun usulan promosi: ${position.title}`}
      subtitle="Periksa kandidat, tambahkan bila perlu, tulis keterangan, lalu kirim ke VP SDM."
      back={
        <Link href="/hr/rekomendasi" className="hover:underline">
          ← Rekomendasi kandidat
        </Link>
      }
    />
  );
  const banner = (
    <Card className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-[1.45rem] font-semibold text-brand">{position.title}</p>
        <p className="mt-1 text-[1.05rem] text-muted">
          Unit {position.unit} · {closeText}
        </p>
      </div>
      <p className="text-base text-muted">
        {proposal ? `Draf ${proposal.id} tersimpan · ` : ""}Kandidat dalam draf terkunci untuk jabatan ini
      </p>
    </Card>
  );

  if (locked) {
    return (
      <>
        {header}
        {banner}
        <Notice title={`Usulan ${proposal.id} sudah dikirim`} className="mb-6">
          {proposal.candidates.length} kandidat dikirim ke VP SDM pada {fmtLong(proposal.submittedAt)}. Pencalonan baru untuk jabatan ini tidak dapat dibuat.{" "}
          <Link href={`/hr/persetujuan/${proposal.id}`} className="font-semibold underline">
            Lihat status persetujuan
          </Link>
        </Notice>
        <Card>
          <h2 className="mb-3 text-[1.45rem] font-semibold">Kandidat dalam usulan (tidak dapat diubah)</h2>
          <ul className="space-y-4 text-[1.2rem]">
            {proposal.candidates.map((c) => {
              const e = getEmployee(c.badge);
              return (
                <li key={c.badge}>
                  <span className="text-brand">✓</span> {e?.name} · {categoryFor(position.id, c.badge)} · {c.source}
                  <p className="ml-6 text-[1.05rem] text-muted">Syarat wajib memenuhi</p>
                </li>
              );
            })}
          </ul>
        </Card>
      </>
    );
  }

  // Talent pool: everyone with complete mandatory data.
  const recs = store.recommendations[position.id] ?? [];
  const pool: PoolItem[] = store.employees
    .filter(isCategoryDeterminable)
    .map((e) => {
      // A nomination already rejected by the atasan no longer counts as submitted.
      const nomination = activeNomination(e.badge, position.id);
      const rec = recs.find((r) => r.badge === e.badge);
      const { met, total } = mandatoryScore(e);
      return {
        badge: e.badge,
        name: e.name,
        position: e.position,
        score: rec?.score,
        category:
          rec || matchesFor(e).some((m) => m.position.id === position.id) ? categoryFor(position.id, e.badge) : "Talenta",
        source: nomination?.source ?? (rec ? "HR (Rekomendasi)" : "HR (Daftar Talenta)"),
        supervisor:
          nomination?.source === "Diri sendiri"
            ? nomination.response === "Diterima"
              ? ("Diterima atasan" as const)
              : ("Belum direspons atasan" as const)
            : undefined,
        recommended: Boolean(rec),
        reqMet: met,
        reqTotal: total,
      };
    });
  const nominated = store.nominations
    .filter((n) => n.vacancyId === position.id && n.response !== "Ditolak")
    .map((n) => n.badge);
  const fromParam = typeof sp.pilih === "string" ? sp.pilih.split(",") : [];
  const initial = [
    ...new Set([...(proposal?.candidates.map((c) => c.badge) ?? []), ...fromParam, ...nominated]),
  ].filter((b) => pool.some((p) => p.badge === b));

  return (
    <>
      {header}
      {banner}
      <ProposalForm
        key={position.id}
        vacancyId={position.id}
        pool={pool}
        initial={initial}
        initialNote={proposal?.hrNote ?? ""}
      />
    </>
  );
}

export default function Page(props: Parameters<typeof PencalonanHr>[0]) {
  return (
    <Suspense fallback={<PageFallback title="Susun usulan promosi" />}>
      <PencalonanHr {...props} />
    </Suspense>
  );
}
