import { Suspense } from "react";
import { PageFallback } from "@/components/page-fallback";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Card, CardTitle, Notice, PageHeader, buttonClass, DisabledButton } from "@/components/ui";
import {
  designateCandidate,
  finalApprove,
  requestInterview,
} from "@/lib/actions";
import {
  STAGE_LABEL,
  fmtDate,
  type Proposal,
  type Stage,
} from "@/lib/db";
import {
  categoryFor,
  checklist,
  documentsComplete,
  getEmployee,
  getProposal,
  pendingDocuments,
  recommendationFor,
} from "@/lib/queries";
import { requireRole } from "@/lib/session";
import { candidateViews } from "@/lib/candidate-view";
import { CandidatePicker } from "./candidate-picker";
import { ReviewForm } from "./review-form";

export const metadata = { title: "Detail usulan dan catatan · AURA Talent" };

function candidateInfo(p: Proposal, badge: string) {
  const e = getEmployee(badge)!;
  const rec = recommendationFor(p.vacancyId, badge);
  const notes = p.notes
    .filter((n) => n.badge === badge)
    .map((n) => ({ label: STAGE_LABEL[n.stage], text: n.text, stage: n.stage }));
  return { e, rec, notes };
}

function CandidateRow({
  p,
  badge,
  badgeText,
  children,
}: {
  p: Proposal;
  badge: string;
  badgeText?: string;
  children?: ReactNode;
}) {
  const { e, rec } = candidateInfo(p, badge);
  return (
    <div className="grid gap-5 rounded-xl bg-white p-6 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <h3 className="text-[1.5rem] font-semibold">
          {e.name}
          {badgeText ? ` · ${badgeText}` : ""}
        </h3>
        <p className="mt-2 text-[1.15rem] font-medium text-ok">
          {rec ? `Readiness ${rec.score} / 100 · ` : ""}{categoryFor(p.vacancyId, badge)} · Syarat wajib memenuhi
        </p>
        <p className="mt-2 text-[1.1rem] text-muted">{e.strengths || rec?.reason}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}

function Header({ p, role }: { p: Proposal; role: string }) {
  return (
    <PageHeader
      title={role === "dirut" ? "Penetapan calon promosi" : role === "pihc" ? "Persetujuan akhir PIHC" : "Detail usulan dan catatan"}
      subtitle={`${p.id} · ${p.title} · Pengusul HR · ${p.candidates.length} kandidat`}
      back={
        <Link href="/approver/antrean" className="hover:underline">
          ← Daftar usulan
        </Link>
      }
    />
  );
}

async function UsulanDetail({ params }: { params: Promise<{ id: string }> }) {
  const { role } = await requireRole("approver");
  const { id } = await params;
  const p = getProposal(id);
  if (!p || p.stage === "draft") notFound();

  const mine = p.stage === (role as Stage);
  const hidden = <input type="hidden" name="proposalId" value={p.id} />;

  /* ------------------------ Not on this approver's stage ------------------------ */
  if (!mine) {
    return (
      <>
        <Header p={p} role={role} />
        <Notice className="mb-6" title={`Usulan berada pada tahap ${STAGE_LABEL[p.stage]}`}>
          Tampilan baca saja. Keputusan hanya dapat diberikan oleh approver pada tahap yang sedang berjalan.
        </Notice>
        <div className="space-y-4">
          {p.candidates.map((c) => {
            const { notes } = candidateInfo(p, c.badge);
            return (
              <CandidateRow key={c.badge} p={p} badge={c.badge} badgeText={p.selectedBadge === c.badge ? "Calon terpilih" : undefined}>
                <p className="text-base font-medium text-muted">Catatan kandidat</p>
                {notes.length === 0 ? (
                  <p className="mt-1 text-[1.1rem] text-muted">Belum ada catatan.</p>
                ) : (
                  notes.map((n) => (
                    <p key={n.label} className="mt-1 text-[1.1rem]">
                      <span className="font-semibold text-brand">{n.label}:</span> {n.text}
                    </p>
                  ))
                )}
              </CandidateRow>
            );
          })}
        </div>
        <div className="mt-6">
          <Link href="/approver/antrean" className="font-semibold text-brand hover:underline">
            Kembali ke daftar usulan
          </Link>
        </div>
      </>
    );
  }

  /* -------------------- VP SDM, SVP SDM, Direksi 1, 2, and 3 -------------------- */
  if (role === "vp" || role === "svp" || role === "direksi1" || role === "direksi2" || role === "direksi3") {
    return (
      <>
        <Header p={p} role={role} />
        <ReviewForm proposalId={p.id} candidates={candidateViews(p, role)} />
      </>
    );
  }

  /* ---------------------------------- Direktur Utama ---------------------------------- */
  if (role === "dirut") {
    const heldNotice = p.held ? (
      <Notice tone="warn" title="Usulan ditahan" className="mb-6">
        Direktur Utama meminta wawancara kandidat. Pemilihan dilanjutkan setelah HR mengunggah hasil wawancara seluruh
        kandidat.
      </Notice>
    ) : null;

    // Choose exactly one candidate; "Tetapkan pilihan" designates it and forwards the proposal to PIHC.
    if (!p.selectedBadge) {
      return (
        <>
          <PageHeader
            title="Pilih kandidat untuk promosi"
            subtitle={`${p.id} · ${p.title} · ${p.candidates.length} kandidat`}
            back={
              <Link href="/approver/antrean" className="hover:underline">
                ← Daftar usulan
              </Link>
            }
            action={
              p.held ? null : (
                <form action={requestInterview}>
                  <input type="hidden" name="proposalId" value={p.id} />
                  <button type="submit" className={buttonClass("secondary")}>
                    Jadwalkan wawancara
                  </button>
                </form>
              )
            }
          />
          {heldNotice}
          <CandidatePicker proposalId={p.id} candidates={candidateViews(p, "dirut")} held={p.held} />
        </>
      );
    }

    // Step 2: designate the chosen candidate and forward to PIHC.
    const selected = candidateInfo(p, p.selectedBadge);
    const others = p.candidates.filter((c) => c.badge !== p.selectedBadge);
    return (
      <>
        <PageHeader
          title="Penetapan calon promosi"
          subtitle={`${p.id} · ${p.title} · ${p.candidates.length} kandidat telah ditinjau oleh Direksi`}
          back={
            <Link href="/approver/antrean" className="hover:underline">
              ← Daftar usulan
            </Link>
          }
        />
        {heldNotice}
        <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          <Card>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand">Kandidat terpilih</p>
            <h2 className="mt-2 text-[2rem] font-semibold">{selected.e.name}</h2>
            <p className="mt-3 text-[2.1rem] font-semibold text-brand">
              {selected.rec ? `${selected.rec.score} / 100 · ` : ""}{categoryFor(p.vacancyId, selected.e.badge)}
            </p>
            <p className="mt-3 text-[1.25rem] font-semibold text-ok">Syarat wajib memenuhi</p>
            <p className="mt-2 text-[1.2rem] leading-relaxed">
              KPI 2024 &amp; 2025: Tercapai
              <br />
              Asesmen: {selected.e.assessment?.result}
              <br />
              Rekam jejak: {selected.e.strengths}
            </p>
            <h3 className="mt-5 text-[1.2rem] font-semibold">Area pengembangan</h3>
            <p className="text-[1.15rem] text-muted">{selected.rec?.gap ?? "-"}</p>
          </Card>
          <Card tone="soft">
            <h2 className="mb-4 text-[1.6rem] font-semibold text-brand">Persetujuan Direksi</h2>
            <ul className="space-y-5">
              {(["direksi1", "direksi2", "direksi3"] as const).map((s) => {
                const l = p.log.find((x) => x.stage === s);
                const note = p.notes.find((n) => n.stage === s && n.badge === selected.e.badge);
                return (
                  <li key={s}>
                    <p className={`text-[1.3rem] font-semibold ${l ? "text-ok" : "text-muted"}`}>
                      {STAGE_LABEL[s]} · {l ? "Catatan diberikan" : "Menunggu"}
                    </p>
                    <p className="text-[1.1rem] text-muted">{note ? note.text : (l?.note ?? "")}</p>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
        <div className="mt-6">
          <Card>
            <CardTitle>Kandidat pembanding</CardTitle>
            <p className="text-[1.2rem] text-muted">
              {others
                .map((c) => {
                  const r = recommendationFor(p.vacancyId, c.badge);
                  return `${getEmployee(c.badge)?.name}${r ? ` · ${r.score} / 100` : ""}`;
                })
                .join("      ") || "Tidak ada kandidat pembanding."}
            </p>
          </Card>
        </div>
        <ActionForm action={designateCandidate} className="mt-6">
          {hidden}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link href="/approver/antrean" className="font-semibold text-brand hover:underline">
              Kembali ke daftar usulan
            </Link>
            {p.held ? (
              <DisabledButton>Tetapkan calon &amp; lanjutkan</DisabledButton>
            ) : (
              <SubmitButton pendingText="Menetapkan…">Tetapkan calon &amp; lanjutkan</SubmitButton>
            )}
          </div>
        </ActionForm>
      </>
    );
  }

  /* ------------------------------------- PIHC ------------------------------------- */
  const designated = getEmployee(p.designatedBadge ?? p.selectedBadge);
  if (!designated) notFound();
  const complete = documentsComplete(designated);
  const pending = pendingDocuments(designated);
  const items = checklist(designated);
  return (
    <>
      <PageHeader
        title="Persetujuan akhir PIHC"
        subtitle={`${p.id} · ${p.title} · Calon ditetapkan: ${designated.name}`}
        back={
          <Link href="/approver/antrean" className="hover:underline">
            ← Daftar usulan
          </Link>
        }
      />
      <Notice tone={complete ? "ok" : "brand"} className="mb-6">
        {complete
          ? "Wawancara, kesehatan, dan LHKPN sudah lengkap. Persetujuan akhir dapat diberikan."
          : `Menunggu kelengkapan ${pending.join(", ").toLowerCase().replace("lhkpn", "LHKPN")} sebelum persetujuan akhir.`}
      </Notice>
      <Card>
        <CardTitle>
          Syarat promosi (PI-SDM-PD-013) · {designated.name}
        </CardTitle>
        <p className="mb-3 text-[1.1rem] text-muted">
          {designated.position} · NIK {designated.badge}. Periksa pemenuhan setiap syarat, lalu setujui atau tolak.
          PIHC tidak mengisi catatan.
        </p>
        <ul className="divide-y divide-line">
          {items.map((i) => (
            <li key={i.key} className="flex items-start gap-3 py-3">
              <span className={`mt-0.5 text-[1.2rem] font-bold ${i.state === "Memenuhi" ? "text-ok" : "text-warn"}`}>
                {i.state === "Memenuhi" ? "✓" : "!"}
              </span>
              <div>
                <p className="text-[1.2rem] font-semibold">{i.label}</p>
                <p className="text-base text-muted">{i.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>
      <ActionForm action={finalApprove} className="mt-6">
        {hidden}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/approver/antrean" className="font-semibold text-brand hover:underline">
            Kembali ke daftar usulan
          </Link>
          <div className="flex items-center gap-3">
            <SubmitButton name="decision" value="reject" variant="secondary" pendingText="Menyimpan…">
              Tolak
            </SubmitButton>
            <SubmitButton name="decision" value="approve" pendingText="Menyimpan…">
              Setujui
            </SubmitButton>
          </div>
        </div>
      </ActionForm>
      <p className="mt-3 text-base text-muted">Tanggal masuk tahap: {fmtDate(p.enteredAt)}</p>
    </>
  );
}

export default function Page(props: Parameters<typeof UsulanDetail>[0]) {
  return (
    <Suspense fallback={<PageFallback title="Detail usulan dan catatan" />}>
      <UsulanDetail {...props} />
    </Suspense>
  );
}
