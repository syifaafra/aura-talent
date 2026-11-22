import "server-only";
import { STAGE_LABEL, db, fmtLong, type Proposal } from "./db";
import {
  categoryFor,
  devAreas,
  getEmployee,
  getPosition,
  mandatoryReqs,
  recommendationFor,
} from "./queries";

/** Serializable profile of one candidate for the Approver screens (readiness score is allowed here). */
export interface CandidateView {
  badge: string;
  name: string;
  position: string;
  unit: string;
  score?: number;
  category: string;
  source: string;
  reqs: Array<{ label: string; detail: string; ok: boolean }>;
  reqMet: number;
  competencies: string[];
  devAreas: string[];
  history: string[];
  education: string;
  performance: string[];
  interview: { status: string; schedule?: string; file?: string };
  /** Notes from earlier stages (not including the viewer's own stage). */
  priorNotes: Array<{ label: string; text: string }>;
  ownNote: string;
  indicators?: { asesmen: number; kinerja: number; riwayat: number; pendidikan: number };
}

export function candidateViews(p: Proposal, ownStage?: string): CandidateView[] {
  const position = getPosition(p.vacancyId);
  const interview = db().interviews.find((i) => i.proposalId === p.id);
  return p.candidates.flatMap((c) => {
    const e = getEmployee(c.badge);
    if (!e) return [];
    const rec = recommendationFor(p.vacancyId, c.badge);
    const reqs = mandatoryReqs(e).map((r) => ({ label: r.label, detail: r.detail, ok: r.state === "Memenuhi" }));
    const slot = interview?.slots.find((s) => s.badge === c.badge);
    const notes = p.notes.filter((n) => n.badge === c.badge);
    return [
      {
        badge: e.badge,
        name: e.name,
        position: e.position,
        unit: e.unit,
        score: rec?.score,
        category: categoryFor(p.vacancyId, c.badge),
        source: c.source,
        reqs,
        reqMet: reqs.filter((r) => r.ok).length,
        competencies: position?.competencies ?? [],
        devAreas: position ? devAreas(position) : [],
        history: e.history ? e.history.split(" · ") : [],
        education: e.education,
        performance: [2024, 2025].map(
          (y) => `${y}: KPI ${e.kpi[y] ?? "belum ada"} · nilai akhir ${e.grades[y] ?? "belum ada"}`,
        ),
        interview: {
          status: e.interview.status === "Memenuhi" ? "Hasil wawancara tersedia" : "Belum ada hasil wawancara",
          schedule: slot && interview ? `Dijadwalkan ${fmtLong(interview.date)} pukul ${slot.start} WIB` : undefined,
          file: e.interview.file,
        },
        priorNotes: notes
          .filter((n) => n.stage !== ownStage)
          .map((n) => ({ label: STAGE_LABEL[n.stage], text: n.text })),
        ownNote: notes.find((n) => n.stage === ownStage)?.text ?? "",
        indicators: rec?.indicators,
      },
    ];
  });
}
