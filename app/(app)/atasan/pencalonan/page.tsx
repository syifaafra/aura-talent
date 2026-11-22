import { Suspense } from "react";
import { PageFallback } from "@/components/page-fallback";
import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/forms";
import { MatchDetail } from "@/components/match-detail";
import { MatchList, parseFilter } from "@/components/match-list";
import { NominationForm } from "@/components/nomination-form";
import { SubordinateList } from "@/components/subordinate-list";
import { ButtonLink, Card, CardTitle, Notice, PageHeader, Pill, inputClass } from "@/components/ui";
import { respondNomination } from "@/lib/actions";
import { db, fmtDate, fmtLong } from "@/lib/db";
import {
  activeNomination,
  categoryFor,
  daysUntil,
  devAreas,
  isCategoryDeterminable,
  mandatoryReqs,
  matchesFor,
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
  const detailId = typeof sp.detail === "string" ? sp.detail : undefined;
  const target = subs.find((s) => s.badge === badge);
  const listHref = `/atasan/pencalonan?badge=${target?.badge}`;

  if (target) {
    /* ------------------------- Layar B: kecocokan jabatan bawahan ------------------------- */
    if (!vacancyId && !detailId) {
      return (
        <>
          <PageHeader
            title={`Kecocokan jabatan: ${target.name}`}
            back={
              <Link href="/atasan/pencalonan" className="hover:underline">
                ← Pencalonan bawahan
              </Link>
            }
            subtitle={`${target.position} · ${target.badge} · Rumpun ${target.unit}. Hanya jabatan Match dengan lowongan aktif yang bisa dicalonkan.`}
          />
          {!isCategoryDeterminable(target) ? (
            <Notice tone="warn" title="Kategori belum dapat ditentukan">
              Data nilai akhir atau asesmen {target.name} belum lengkap. Hubungi HR.
            </Notice>
          ) : (
            <MatchList
              e={target}
              filter={parseFilter(sp.kategori)}
              basePath="/atasan/pencalonan"
              query={`badge=${target.badge}`}
              scope={`Jabatan satu level di atas ${target.position}, dalam rumpun ${target.unit}.`}
              detailHref={(r) => `${listHref}&detail=${r.position.id}`}
              actionFor={(r) => {
                const block = nominationBlock(target.badge, r.position.id);
                if (!block)
                  return (
                    <ButtonLink href={`${listHref}&jabatan=${r.position.id}`}>Calonkan →</ButtonLink>
                  );
                const existing = activeNomination(target.badge, r.position.id);
                if (existing) {
                  return existing.source === "Diri sendiri" && !existing.response ? (
                    <ButtonLink variant="secondary" href="/atasan/pencalonan#respons">
                      Tanggapi
                    </ButtonLink>
                  ) : (
                    <>
                      <Pill tone="brand">{existing.source === "Diri sendiri" ? "Dicalonkan diri sendiri" : "Sudah diajukan"}</Pill>
                      <Link href="/atasan/status" className="font-semibold text-brand hover:underline">
                        Lihat status
                      </Link>
                    </>
                  );
                }
                if (r.category !== "Match")
                  return <span className="max-w-[16rem] text-base text-muted">Belum bisa dicalonkan (bukan Match)</span>;
                if (!r.position.open)
                  return <span className="max-w-[16rem] text-base text-muted">Bisa dicalonkan saat lowongan dibuka</span>;
                return <span className="max-w-[16rem] text-base text-muted">{block}</span>;
              }}
            />
          )}
        </>
      );
    }

    /* ------------------------- Detail kecocokan (versi atasan) ------------------------- */
    if (detailId) {
      const row = matchesFor(target).find((m) => m.position.id === detailId);
      if (!row)
        return (
          <Notice tone="warn" title="Jabatan tidak ditemukan">
            Jabatan tersebut tidak termasuk dalam cakupan {target.name}.
          </Notice>
        );
      const block = nominationBlock(target.badge, detailId);
      return (
        <>
          <PageHeader
            title="Detail kecocokan jabatan"
            back={
              <Link href={listHref} className="hover:underline">
                ← Kecocokan jabatan {target.name}
              </Link>
            }
            subtitle={`${row.position.title} · ${target.name} · ${target.badge}`}
          />
          <MatchDetail
            e={target}
            row={row}
            area={typeof sp.area === "string" ? sp.area : undefined}
            subject={target.name}
            areaHref={(a) => `${listHref}&detail=${detailId}&area=${encodeURIComponent(a)}`}
            relatedHref={(pid) => `${listHref}&detail=${pid}`}
            footer={
              block ? (
                <p className="text-[1.05rem] text-muted">{block}</p>
              ) : (
                <ButtonLink href={`${listHref}&jabatan=${detailId}`}>Calonkan →</ButtonLink>
              )
            }
          />
        </>
      );
    }

    /* ----------------------------- Layar C: formulir pencalonan ----------------------------- */
    const block = nominationBlock(target.badge, vacancyId!);
    const position = getPosition(vacancyId!);
    const row = matchesFor(target).find((m) => m.position.id === vacancyId);
    if (block || !position || !row) {
      return (
        <>
          <PageHeader
            title={`Calonkan ${target.name}`}
            back={
              <Link href={listHref} className="hover:underline">
                ← Kecocokan jabatan {target.name}
              </Link>
            }
          />
          <Notice tone="warn" title="Pencalonan tidak dapat dilakukan">
            {block ?? "Jabatan tidak ditemukan."}
          </Notice>
        </>
      );
    }
    const left = position.openUntil ? daysUntil(position.openUntil) : undefined;
    return (
      <>
        <PageHeader
          title={`Calonkan ${target.name}: ${position.title}`}
          subtitle="Periksa syaratnya, tulis alasan Anda, lalu kirim."
          back={
            <Link href={listHref} className="hover:underline">
              ← Kecocokan jabatan {target.name}
            </Link>
          }
        />
        <NominationForm
          mode="atasan"
          position={{
            id: position.id,
            title: position.title,
            unit: position.unit,
            vacancyCode: position.vacancyCode ?? "",
            closeText: position.openUntil ? `Tutup ${fmtLong(position.openUntil)}` : "",
            remaining: left !== undefined && left >= 0 ? `sisa ${left} hari` : "",
            category: row.category,
            competencies: position.competencies,
            developmentAreas: devAreas(position),
          }}
          candidate={{ badge: target.badge, name: target.name, position: target.position }}
          items={mandatoryReqs(target)}
          pending={pendingDocuments(target)}
          detailHref={`${listHref}&detail=${position.id}`}
          changeCandidateHref="/atasan/pencalonan"
          changePositionHref={listHref}
          backHref={listHref}
        />
      </>
    );
  }

  /* ----------------------------- Layar A: pilih bawahan ----------------------------- */
  const selfNominations = db().nominations.filter(
    (n) => n.source === "Diri sendiri" && subs.some((s) => s.badge === n.badge),
  );
  return (
    <>
      <PageHeader
        title="Pencalonan bawahan"
        subtitle="Pilih bawahan langsung untuk melihat kecocokannya dengan jabatan satu level di atas, lalu calonkan pada jabatan yang Match."
      />
      <SubordinateList subs={subs} q={typeof sp.q === "string" ? sp.q : ""} basePath="/atasan/pencalonan" />

      <Card className="mt-8" tone={undefined}>
        <div id="respons" />
        <CardTitle>Respons pencalonan · pencalonan diri bawahan</CardTitle>
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
                    <span className="font-semibold text-brand">{n.response ?? "Menunggu tanggapan atasan"}</span>
                  </p>
                  <p className="mt-2 text-[1.1rem] leading-relaxed">{n.justification}</p>
                  <p className="mt-1 text-base text-muted">
                    Kategori {categoryFor(n.vacancyId, n.badge)} ·{" "}
                    {pendingDocuments(who).length === 0
                      ? "Syarat wajib memenuhi"
                      : `Menunggu: ${pendingDocuments(who).join(", ").toLowerCase().replace("lhkpn", "LHKPN")}`}
                  </p>
                  {locked ? (
                    <p className="mt-2 text-base text-muted">Usulan {locked} sudah dikirim.</p>
                  ) : n.response ? (
                    n.response === "Ditolak" ? (
                      <p className="mt-2 text-base text-muted">
                        {n.responseNote ? `Alasan: ${n.responseNote}. ` : ""}HR masih dapat mengajukan karyawan ini dari
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
                        placeholder="Alasan penolakan (wajib bila menolak)"
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
