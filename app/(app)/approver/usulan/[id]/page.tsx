import { Suspense } from "react";
import { PageFallback } from "@/components/page-fallback";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Card, CardTitle, Notice, PageHeader, buttonClass, DisabledButton } from "@/components/ui";
import {
  approveForward,
  designateCandidate,
  finalApprove,
  requestInterview,
} from "@/lib/actions";
import {
  STAGE_LABEL,
  db,
  fmtDate,
  type Proposal,
  type Stage,
} from "@/lib/db";
import {
  categoryFor,
  documentsComplete,
  getEmployee,
  getProposal,
  pendingDocuments,
  recommendationFor,
} from "@/lib/queries";
import { requireRole } from "@/lib/session";
import { CandidatePicker, type PickerCandidate } from "./candidate-picker";

export const metadata = { title: "Detail usulan · AURA Talent" };

const DEFAULT_NOTES: Record<string, string> = {
  "000001": "Lanjutkan verifikasi. Perkuat perencanaan strategis.",
  "000002": "Perlu pengembangan kepemimpinan lintas unit.",
  "000004": "Perlu pengalaman lintas fungsi sebagai pengembangan.",
};

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
      title={role === "dirut" ? "Penetapan calon promosi" : role === "pihc" ? "Persetujuan akhir PIHC" : "Detail usulan dan persetujuan"}
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
        <Notice className="mb-6">Seluruh kandidat diteruskan ke tahap berikutnya. Catatan tidak membatalkan persetujuan.</Notice>
        <ActionForm action={approveForward}>
          {hidden}
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-[1.6rem] font-semibold">Kandidat yang diajukan</h2>
            <span className="text-[1.05rem] text-muted">{p.candidates.length} kandidat · Syarat wajib memenuhi</span>
          </div>
          <div className="space-y-4">
            {p.candidates.map((c) => {
              const { notes, rec } = candidateInfo(p, c.badge);
              const earlier = notes.filter((n) => n.stage !== role);
              const own = notes.find((n) => n.stage === role)?.text;
              return (
                <CandidateRow key={c.badge} p={p} badge={c.badge}>
                  {earlier.map((n) => (
                    <p key={n.label} className="mb-2 rounded-md bg-brand-soft px-3 py-2 text-base">
                      <span className="font-semibold text-brand">{n.label}:</span> {n.text}
                    </p>
                  ))}
                  <label htmlFor={`note-${c.badge}`} className="block text-base font-medium text-muted">
                    Catatan kandidat
                  </label>
                  <textarea
                    id={`note-${c.badge}`}
                    name={`note-${c.badge}`}
                    rows={2}
                    defaultValue={own ?? DEFAULT_NOTES[c.badge] ?? (rec ? `Perlu pengembangan ${rec.gap}.` : "")}
                    className="mt-1 w-full rounded-lg border border-line px-4 py-2.5 text-[1.1rem] focus:border-brand"
                  />
                </CandidateRow>
              );
            })}
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <Link href="/approver/antrean" className="font-semibold text-brand hover:underline">
              Kembali ke daftar usulan
            </Link>
            <SubmitButton pendingText="Menyimpan…">Setujui</SubmitButton>
          </div>
        </ActionForm>
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

    // Step 1: compare the candidates side by side and choose one.
    if (!p.selectedBadge) {
      const interview = db().interviews.find((i) => i.proposalId === p.id);
      const candidates: PickerCandidate[] = p.candidates.map((c) => {
        const { e, rec, notes } = candidateInfo(p, c.badge);
        const slot = interview?.slots.find((s) => s.badge === c.badge);
        return {
          badge: e.badge,
          name: e.name,
          position: e.position,
          score: rec?.score,
          category: categoryFor(p.vacancyId, c.badge),
          kpi: "KPI 2024 & 2025: Tercapai",
          assessment: `Asesmen: ${e.assessment?.result ?? "-"}`,
          track: e.strengths || rec?.reason || "-",
          development: rec?.gap ? rec.gap.charAt(0).toUpperCase() + rec.gap.slice(1) : "-",
          interview: slot ? `Dijadwalkan ${interview!.date} ${slot.start} WIB` : "Belum dijadwalkan",
          notes: notes.map((n) => ({ label: n.label, text: n.text })),
        };
      });
      return (
        <>
          <PageHeader
            title="Pilih kandidat untuk promosi"
            subtitle={`${p.id} · ${p.title} · ${p.candidates.length} kandidat`}
            back={
              <Link href="/approver/antrean" className="hover:underline">
                Daftar usulan / Perbandingan kandidat
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
          <CandidatePicker proposalId={p.id} candidates={candidates} disabled={p.held} />
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
                      {STAGE_LABEL[s]} · {l ? "Disetujui" : "Menunggu"}
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
  return (
    <>
      <PageHeader
        title="Persetujuan akhir PIHC"
        subtitle={`${p.id} · ${p.title} · Calon ditetapkan: ${designated.name} · Menunggu PIHC`}
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
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-[1.6rem] font-semibold">Calon terpilih &amp; kandidat pembanding</h2>
        <span className="text-[1.05rem] text-muted">Calon ditetapkan: {designated.name}</span>
      </div>
      <div className="space-y-4">
        {p.candidates.map((c) => {
          const { notes } = candidateInfo(p, c.badge);
          return (
            <CandidateRow key={c.badge} p={p} badge={c.badge} badgeText={c.badge === designated.badge ? "Calon terpilih" : undefined}>
              <p className="text-base font-medium text-muted">Catatan kandidat</p>
              {notes.length === 0 ? (
                <p className="mt-1 text-[1.1rem] text-muted">
                  {c.badge === designated.badge && !complete ? "Lengkapi dokumen sebelum persetujuan akhir." : "Belum ada catatan."}
                </p>
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
      <ActionForm action={finalApprove} className="mt-6">
        {hidden}
        <p className="mb-3 text-[1.1rem] text-muted">
          PIHC memeriksa pemenuhan persyaratan promosi sesuai PI-SDM-PD-013 untuk calon yang ditetapkan. Bila tidak
          terpenuhi, tolak dan isi alasannya.
        </p>
        <label htmlFor="reason" className="mb-1.5 block text-base font-semibold text-muted">
          Alasan penolakan (wajib bila menolak)
        </label>
        <textarea
          id="reason"
          name="reason"
          rows={3}
          className="mb-4 w-full resize-y rounded-lg border border-line px-4 py-3 text-[1.1rem] focus:border-brand"
        />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/approver/antrean" className="font-semibold text-brand hover:underline">
            Kembali ke daftar usulan
          </Link>
          <div className="flex items-center gap-3">
            <SubmitButton name="decision" value="reject" variant="secondary" pendingText="Menyimpan…">
              Tolak
            </SubmitButton>
            {complete ? (
              <SubmitButton name="decision" value="approve" pendingText="Menyimpan…">
                Setujui
              </SubmitButton>
            ) : (
              <DisabledButton className="!bg-[#6b7a8c] !text-white">Setujui · Menunggu dokumen</DisabledButton>
            )}
          </div>
        </div>
      </ActionForm>
      <p className="mt-3 text-base text-muted">Tanggal masuk tahap: {fmtDate(p.enteredAt)}</p>
    </>
  );
}

export default function Page(props: Parameters<typeof UsulanDetail>[0]) {
  return (
    <Suspense fallback={<PageFallback title="Detail usulan dan persetujuan" />}>
      <UsulanDetail {...props} />
    </Suspense>
  );
}
