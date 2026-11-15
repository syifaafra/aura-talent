import { Suspense } from "react";
import { PageFallback } from "@/components/page-fallback";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Timeline } from "@/components/proposal-status";
import { Card, CardTitle, Notice, PageHeader, buttonClass } from "@/components/ui";
import { STAGE_LABEL, fmtDate, fmtDateTime, addDays, SLA_DAYS } from "@/lib/db";
import { sendReminder } from "@/lib/actions";
import {
  deadlineOf,
  getEmployee,
  getProposal,
  inApproval,
  isOverdue,
  recommendationFor,
  slaText,
} from "@/lib/queries";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Rincian status persetujuan · AURA Talent" };

async function PersetujuanDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("hr");
  const { id } = await params;
  const p = getProposal(id);
  if (!p) notFound();

  const approval = inApproval(p);
  const last = p.log[p.log.length - 1];
  const noteStages = [...new Set(p.notes.map((n) => n.stage))];

  return (
    <>
      <PageHeader
        title="Rincian status persetujuan"
        subtitle={`${p.id} · ${p.title} · Pengusul HR · ${p.candidates.length} kandidat`}
        back={
          <Link href="/hr/persetujuan" className="hover:underline">
            ← Daftar status usulan
          </Link>
        }
      />

      {p.stage === "draft" ? (
        <Notice tone="warn" title="Draf usulan belum dikirim" className="mb-6">
          Usulan harus memuat 2–5 kandidat sebelum dikirim ke VP SDM.{" "}
          <Link href={`/hr/pencalonan`} className="font-semibold underline">
            Buka formulir pencalonan
          </Link>
        </Notice>
      ) : (
        <Notice className="mb-6" tone={approval && isOverdue(p) ? "danger" : "brand"} title={p.stage === "selesai" ? "Persetujuan akhir selesai" : `Menunggu persetujuan ${STAGE_LABEL[p.stage]}`}>
          {approval ? (
            <>
              Masuk tahap ini {fmtDate(p.enteredAt)}
              {last ? ` · Terakhir: ${last.action} ${fmtDateTime(last.at)}` : ""} · Batas keputusan: {fmtDate(deadlineOf(p))} ·{" "}
              <strong>{slaText(p)}</strong>
              <span className="sr-only"> (SLA {SLA_DAYS} hari, {addDays(p.enteredAt, SLA_DAYS)})</span>
            </>
          ) : (
            "Seluruh tahapan persetujuan telah selesai."
          )}
        </Notice>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <Card>
          <CardTitle>Tahapan persetujuan</CardTitle>
          <Timeline proposal={p} />
        </Card>

        <div className="space-y-6">
          <Card>
            <CardTitle>Kandidat dalam usulan</CardTitle>
            <ul className="space-y-4">
              {p.candidates.map((c) => {
                const e = getEmployee(c.badge);
                const r = recommendationFor(p.vacancyId, c.badge);
                return (
                  <li key={c.badge}>
                    <p className="text-[1.3rem] font-semibold">
                      {e?.name}
                      {r ? ` · ${r.score} / 100` : ""}
                    </p>
                    <p className="text-[1.05rem] text-ok">Match · Syarat wajib memenuhi</p>
                    <p className="text-sm text-muted">{c.source}</p>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card>
            <CardTitle>Catatan persetujuan</CardTitle>
            {noteStages.length === 0 ? (
              <p className="text-[1.1rem] text-muted">Belum ada catatan dari approver.</p>
            ) : (
              <ul className="space-y-4 text-[1.1rem]">
                {noteStages.map((s) => (
                  <li key={s}>
                    <p className="font-semibold text-brand">{STAGE_LABEL[s]}</p>
                    {p.notes
                      .filter((n) => n.stage === s)
                      .map((n) => (
                        <p key={n.badge} className="text-muted">
                          {getEmployee(n.badge)?.name}: {n.text}
                        </p>
                      ))}
                  </li>
                ))}
              </ul>
            )}
            {approval ? (
              <div className="mt-6 flex flex-wrap gap-3">
                <form action={sendReminder}>
                  <input type="hidden" name="proposalId" value={p.id} />
                  <button type="submit" className={buttonClass("secondary", "!px-4 !py-2 !text-base")}>
                    Kirim pengingat ke {STAGE_LABEL[p.stage]}
                  </button>
                </form>
                <Link href={`/hr/wawancara?usulan=${p.id}`} className={buttonClass("soft", "!px-4 !py-2 !text-base")}>
                  Jadwalkan wawancara
                </Link>
              </div>
            ) : null}
          </Card>
        </div>
      </div>
    </>
  );
}

export default function Page(props: Parameters<typeof PersetujuanDetail>[0]) {
  return (
    <Suspense fallback={<PageFallback title="Rincian status persetujuan" />}>
      <PersetujuanDetail {...props} />
    </Suspense>
  );
}
