import { Suspense } from "react";
import { PageFallback } from "@/components/page-fallback";
import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/forms";
import { NominationForm } from "@/components/nomination-form";
import { Card, CardTitle, EmptyState, Notice, PageHeader, inputClass } from "@/components/ui";
import { respondNomination } from "@/lib/actions";
import { db, fmtDate, fmtLong } from "@/lib/db";
import {
  checklist,
  eligibleVacancies,
  getPosition,
  nominationBlock,
  pendingDocuments,
  proposalForVacancy,
} from "@/lib/queries";
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
  const selfNominations = db().nominations.filter(
    (n) => n.source === "Diri sendiri" && subs.some((s) => s.badge === n.badge),
  );
  return (
    <>
      <PageHeader
        title="Pencalonan bawahan"
        subtitle="Pilih bawahan langsung dan lowongan aktif yang sesuai (kategori Match)."
      />
      <Card className="mb-6">
        <CardTitle>Pencalonan diri bawahan</CardTitle>
        {selfNominations.length === 0 ? (
          <p className="text-[1.1rem] text-muted">Belum ada pencalonan diri yang perlu ditanggapi.</p>
        ) : (
          <ul className="space-y-5">
            {selfNominations.map((n) => {
              const who = subs.find((s) => s.badge === n.badge)!;
              const sent = proposalForVacancy(n.vacancyId);
              const locked = sent && sent.stage !== "draft" ? sent.id : undefined;
              return (
                <li key={n.id} className="border-b border-line pb-5 last:border-0 last:pb-0">
                  <p className="text-[1.3rem] font-semibold">
                    {who.name} → {getPosition(n.vacancyId)?.title ?? n.vacancyId}
                  </p>
                  <p className="text-[1.05rem] text-muted">
                    {who.badge} · Diajukan {fmtDate(n.at)} ·{" "}
                    <span className="font-semibold text-brand">{n.response ?? "Belum direspons"}</span>
                  </p>
                  <p className="mt-2 text-[1.1rem] leading-relaxed">{n.justification}</p>
                  {locked ? (
                    <p className="mt-2 text-base text-muted">Usulan {locked} sudah dikirim.</p>
                  ) : n.response ? (
                    n.response === "Ditolak" ? (
                      <p className="mt-2 text-base text-muted">
                        {n.responseNote ? `Catatan: ${n.responseNote}. ` : ""}HR masih dapat mengajukan karyawan ini dari
                        rekomendasi.
                      </p>
                    ) : null
                  ) : (
                    <ActionForm action={respondNomination} className="mt-3">
                      <input type="hidden" name="id" value={n.id} />
                      <label htmlFor={`note-${n.id}`} className="sr-only">
                        Catatan
                      </label>
                      <input
                        id={`note-${n.id}`}
                        name="note"
                        placeholder="Catatan (opsional)"
                        className={`${inputClass} mb-3 max-w-xl`}
                      />
                      <div className="flex gap-3">
                        <SubmitButton name="decision" value="Diterima" pendingText="Menyimpan…">
                          Terima
                        </SubmitButton>
                        <SubmitButton name="decision" value="Ditolak" variant="secondary" pendingText="Menyimpan…">
                          Tolak
                        </SubmitButton>
                      </div>
                    </ActionForm>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
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
