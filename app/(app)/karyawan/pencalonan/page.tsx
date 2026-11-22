import { Suspense } from "react";
import { PageFallback } from "@/components/page-fallback";
import Link from "next/link";
import { CategoryBadge } from "@/components/match-list";
import { NoProfile, UndeterminedView } from "@/components/profile";
import { NominationForm } from "@/components/nomination-form";
import { ButtonLink, Card, EmptyState, Notice, PageHeader, Pill } from "@/components/ui";
import { fmtLong } from "@/lib/db";
import {
  activeNomination,
  daysUntil,
  devAreas,
  isCategoryDeterminable,
  mandatoryReqs,
  matchesFor,
  nominationBlock,
  pendingDocuments,
  sortedMatches,
} from "@/lib/queries";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Pencalonan saya · AURA Talent" };

async function PencalonanPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { employee: e } = await requireRole("karyawan");
  const sp = await searchParams;
  if (!e) return <NoProfile />;

  if (!isCategoryDeterminable(e)) {
    return (
      <>
        <PageHeader title="Pencalonan saya" subtitle="Pencalonan belum tersedia." />
        <UndeterminedView e={e} />
      </>
    );
  }

  /* ----------------------- Layar B: formulir pencalonan diri ----------------------- */
  const requested = typeof sp.jabatan === "string" ? sp.jabatan : undefined;
  if (requested) {
    const row = matchesFor(e).find((m) => m.position.id === requested);
    const block = nominationBlock(e.badge, requested);
    if (!row || block) {
      return (
        <>
          <PageHeader
            title="Calonkan diri"
            back={
              <Link href="/karyawan/pencalonan" className="hover:underline">
                ← Pilih jabatan
              </Link>
            }
          />
          <Notice tone="warn" title="Pencalonan tidak dapat dilakukan">
            {block ?? "Jabatan tidak tersedia dalam cakupan Anda."}
          </Notice>
          <div className="mt-6">
            <ButtonLink variant="secondary" href="/karyawan/pencalonan">
              Kembali ke daftar jabatan
            </ButtonLink>
          </div>
        </>
      );
    }
    const p = row.position;
    const left = p.openUntil ? daysUntil(p.openUntil) : undefined;
    return (
      <>
        <PageHeader
          title={`Calonkan diri: ${p.title}`}
          subtitle="Periksa jabatan dan syaratnya, tulis alasan Anda, lalu kirim."
          back={
            <Link href="/karyawan/pencalonan" className="hover:underline">
              ← Pilih jabatan
            </Link>
          }
        />
        <NominationForm
          mode="karyawan"
          position={{
            id: p.id,
            title: p.title,
            unit: p.unit,
            vacancyCode: p.vacancyCode ?? "",
            closeText: p.openUntil ? `Tutup ${fmtLong(p.openUntil)}` : "",
            remaining: left !== undefined && left >= 0 ? `sisa ${left} hari` : "",
            category: row.category,
            competencies: p.competencies,
            developmentAreas: devAreas(p),
          }}
          candidate={{ badge: e.badge, name: e.name, position: e.position }}
          items={mandatoryReqs(e)}
          pending={pendingDocuments(e)}
          detailHref={`/karyawan/kecocokan/${p.id}`}
          backHref="/karyawan/pencalonan"
        />
      </>
    );
  }

  /* ----------------------------- Layar A: pilih jabatan ----------------------------- */
  const open = sortedMatches(e).filter((m) => m.position.open);
  return (
    <>
      <PageHeader title="Pilih jabatan yang ingin Anda lamar" subtitle="Calonkan diri untuk jabatan yang sedang membuka lowongan." />
      <Notice className="mb-6">
        Hanya jabatan satu level di atas dalam rumpun Anda yang sedang membuka lowongan yang ditampilkan.
      </Notice>
      {open.length === 0 ? (
        <EmptyState title="Belum ada lowongan aktif">
          Tidak ada jabatan dalam cakupan Anda yang sedang membuka lowongan. Periksa{" "}
          <Link href="/karyawan/kecocokan" className="font-semibold text-brand underline">
            kecocokan jabatan
          </Link>
          .
        </EmptyState>
      ) : (
        <ul className="space-y-4">
          {open.map((m) => {
            const p = m.position;
            const block = nominationBlock(e.badge, p.id);
            const existing = activeNomination(e.badge, p.id);
            const state = !block
              ? { chip: "Syarat lengkap", tone: "ok" as const }
              : existing
                ? {
                    chip: existing.source === "Diri sendiri" ? "Sudah Anda ajukan" : "Sudah diajukan atasan langsung",
                    tone: "brand" as const,
                  }
                : { chip: "Belum bisa dicalonkan", tone: "warn" as const };
            return (
              <li key={p.id}>
                <Card className="flex flex-wrap items-center justify-between gap-4 py-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-[1.4rem] font-semibold">{p.title}</p>
                      <CategoryBadge category={m.category} />
                      <Pill tone={state.tone}>{state.chip}</Pill>
                    </div>
                    <p className="mt-1 text-[1.1rem] text-muted">
                      Unit {p.unit} · Lowongan {p.vacancyCode} · Tutup {p.openUntil ? fmtLong(p.openUntil) : "-"}
                    </p>
                  </div>
                  {!block ? (
                    <ButtonLink href={`/karyawan/pencalonan?jabatan=${p.id}`}>Calonkan diri →</ButtonLink>
                  ) : existing ? (
                    <ButtonLink variant="secondary" href="/karyawan/status">
                      Lihat status
                    </ButtonLink>
                  ) : (
                    <ButtonLink variant="secondary" href={`/karyawan/kecocokan/${p.id}`}>
                      Lihat alasannya
                    </ButtonLink>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export default function Page(props: Parameters<typeof PencalonanPage>[0]) {
  return (
    <Suspense fallback={<PageFallback title="Pencalonan saya" />}>
      <PencalonanPage {...props} />
    </Suspense>
  );
}
