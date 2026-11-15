import { Suspense } from "react";
import { PageFallback } from "@/components/page-fallback";
import Link from "next/link";
import { NominationForm } from "@/components/nomination-form";
import { Card, EmptyState, Notice, PageHeader } from "@/components/ui";
import { db, fmtLong } from "@/lib/db";
import { checklist, eligibleVacancies, nominationBlock, pendingDocuments } from "@/lib/queries";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Pencalonan bawahan · AURA Talent" };

async function PencalonanBawahan({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user } = await requireRole("atasan");
  const sp = await searchParams;
  const subs = db().employees.filter((e) => e.supervisor === user.badge);

  const badge = typeof sp.badge === "string" ? sp.badge : undefined;
  const vacancyId = typeof sp.jabatan === "string" ? sp.jabatan : undefined;
  const target = subs.find((s) => s.badge === badge);

  if (target && vacancyId) {
    const block = nominationBlock(target.badge, vacancyId);
    const position = db().positions.find((p) => p.id === vacancyId);
    if (block || !position) {
      return (
        <>
          <PageHeader title="Formulir pencalonan bawahan" />
          <Notice tone="warn" title="Pencalonan tidak dapat dilakukan">
            {block ?? "Jabatan tidak ditemukan."}
          </Notice>
        </>
      );
    }
    return (
      <>
        <PageHeader
          title="Formulir pencalonan bawahan"
          subtitle={`${position.title} · Lowongan ${position.vacancyCode} · Tutup ${position.openUntil ? fmtLong(position.openUntil) : "-"}`}
        />
        <NominationForm
          mode="atasan"
          vacancyId={position.id}
          positionTitle={position.title}
          vacancyCode={position.vacancyCode ?? ""}
          closeText={position.openUntil ? `Tutup ${fmtLong(position.openUntil)}` : ""}
          candidate={{ badge: target.badge, name: target.name }}
          items={checklist(target)}
          pending={pendingDocuments(target)}
          backHref="/atasan/kecocokan"
          backLabel="Batal"
        />
      </>
    );
  }

  const options = subs.flatMap((s) => eligibleVacancies(s).map((o) => ({ s, o })));
  return (
    <>
      <PageHeader
        title="Pencalonan bawahan"
        subtitle="Pilih bawahan langsung dan lowongan aktif yang sesuai (kategori Match)."
      />
      {options.length === 0 ? (
        <EmptyState title="Belum ada pencalonan yang dapat diajukan">
          Tidak ada bawahan langsung dengan kategori Match pada lowongan aktif. Periksa{" "}
          <Link href="/atasan/kecocokan" className="font-semibold text-brand underline">
            kecocokan bawahan
          </Link>
          .
        </EmptyState>
      ) : (
        <ul className="space-y-4">
          {options.map(({ s, o }) => (
            <li key={`${s.badge}-${o.position.id}`}>
              <Card className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[1.4rem] font-semibold">
                    {s.name} → {o.position.title}
                  </p>
                  <p className="text-[1.1rem] text-muted">
                    {s.badge} · Kategori Match · Lowongan aktif
                  </p>
                </div>
                <Link
                  href={`/atasan/pencalonan?badge=${s.badge}&jabatan=${o.position.id}`}
                  className="font-semibold text-brand hover:underline"
                >
                  Calonkan →
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function Page(props: Parameters<typeof PencalonanBawahan>[0]) {
  return (
    <Suspense fallback={<PageFallback title="Pencalonan bawahan" />}>
      <PencalonanBawahan {...props} />
    </Suspense>
  );
}
