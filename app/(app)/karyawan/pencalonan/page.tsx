import { Suspense } from "react";
import { PageFallback } from "@/components/page-fallback";
import Link from "next/link";
import { NoProfile, UndeterminedView } from "@/components/profile";
import { NominationForm } from "@/components/nomination-form";
import { ButtonLink, Card, Notice, PageHeader } from "@/components/ui";
import { fmtLong } from "@/lib/db";
import {
  checklist,
  eligibleVacancies,
  isCategoryDeterminable,
  nominationBlock,
  pendingDocuments,
  statusRows,
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

  const options = eligibleVacancies(e);
  const requested = typeof sp.jabatan === "string" ? sp.jabatan : undefined;
  const chosen = requested
    ? options.find((o) => o.position.id === requested)
    : options.length === 1
      ? options[0]
      : undefined;

  if (requested && !chosen) {
    return (
      <>
        <PageHeader title="Formulir pencalonan diri" />
        <Notice tone="warn" title="Pencalonan tidak dapat dilakukan">
          {nominationBlock(e.badge, requested) ?? "Jabatan tidak tersedia."}
        </Notice>
        <div className="mt-6">
          <ButtonLink variant="secondary" href="/karyawan/kecocokan">
            Kembali ke kecocokan jabatan
          </ButtonLink>
        </div>
      </>
    );
  }

  if (chosen) {
    const p = chosen.position;
    return (
      <>
        <PageHeader
          title="Formulir pencalonan diri"
          subtitle={`${p.title} · Lowongan ${p.vacancyCode} · Tutup ${p.openUntil ? fmtLong(p.openUntil) : "-"}`}
          action={
            <Link
              href={`/karyawan/kecocokan/${p.id}`}
              className="rounded-lg border border-brand bg-white px-5 py-2.5 text-[1.1rem] font-semibold text-brand hover:bg-brand-soft"
            >
              Kembali ke detail jabatan
            </Link>
          }
        />
        <NominationForm
          mode="karyawan"
          vacancyId={p.id}
          positionTitle={p.title}
          vacancyCode={p.vacancyCode ?? ""}
          closeText={p.openUntil ? `Tutup ${fmtLong(p.openUntil)}` : ""}
          candidate={{ badge: e.badge, name: e.name }}
          items={checklist(e)}
          pending={pendingDocuments(e).map((x) => (x === "Kesehatan" ? "kesehatan" : x))}
          backHref="/karyawan/kecocokan"
          backLabel="Batal"
        />
      </>
    );
  }

  const mine = statusRows([e.badge]);
  return (
    <>
      <PageHeader title="Pencalonan saya" subtitle="Calonkan diri untuk jabatan satu level di atas yang memiliki lowongan aktif." />
      {options.length > 1 ? (
        <ul className="space-y-4">
          {options.map((o) => (
            <li key={o.position.id}>
              <Card className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[1.4rem] font-semibold">
                    {o.position.title} · {o.position.label}
                  </p>
                  <p className="text-[1.1rem] text-muted">Kategori Match · Lowongan aktif</p>
                </div>
                <ButtonLink href={`/karyawan/pencalonan?jabatan=${o.position.id}`}>Calonkan Diri</ButtonLink>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <Notice tone={mine.length ? "brand" : "warn"} title={mine.length ? "Anda sudah mengajukan pencalonan" : "Belum ada lowongan aktif"}>
          {mine.length ? (
            <>
              Pencalonan Anda untuk {mine.map((m) => m.title).join(", ")} sedang diproses.{" "}
              <Link href="/karyawan/status" className="font-semibold underline">
                Lihat status pencalonan
              </Link>
              .
            </>
          ) : (
            <>
              Tidak ada lowongan aktif pada kategori Match saat ini. Periksa{" "}
              <Link href="/karyawan/kecocokan" className="font-semibold underline">
                kecocokan jabatan
              </Link>
              .
            </>
          )}
        </Notice>
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
