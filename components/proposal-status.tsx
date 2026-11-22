import {
  APPROVAL_STAGES,
  STAGE_LABEL,
  STAGE_TASK,
  fmtDateTime,
  type Proposal,
  type Stage,
} from "@/lib/db";
import { cn } from "./ui";

const NOTE_STAGES: Stage[] = ["vp", "svp", "direksi1", "direksi2", "direksi3"];

type StepState = "done" | "current" | "next";

export function stepState(p: Proposal, stage: Stage): StepState {
  if (p.stage === "selesai" || p.stage === "ditolak") return "done";
  if (p.stage === "draft") return "next";
  const cur = APPROVAL_STAGES.indexOf(p.stage);
  const idx = APPROVAL_STAGES.indexOf(stage);
  return idx < cur ? "done" : idx === cur ? "current" : "next";
}

const STATE_TEXT: Record<StepState, string> = {
  done: "Selesai diproses",
  current: "Sedang diproses",
  next: "Belum dimulai",
};

/** Compact read-only view for Karyawan and Atasan (no other candidates' data). */
export function CompactSteps({ proposal }: { proposal: Proposal }) {
  const idx = APPROVAL_STAGES.indexOf(proposal.stage);
  const finished = proposal.stage === "selesai" || proposal.stage === "ditolak";
  // Read-only timeline of the stages only: no Approver notes and no result.
  const visible = finished ? APPROVAL_STAGES : APPROVAL_STAGES.slice(0, Math.max(idx, 0) + 1);
  const rest = finished ? [] : APPROVAL_STAGES.slice(idx + 1);
  return (
    <div>
      <ul className="space-y-2">
        <li className="grid grid-cols-[8rem_1fr] rounded-lg px-4 py-3 text-[1.15rem]">
          <span className="font-semibold text-brand">HR</span>
          <span className="text-muted">Sudah diteruskan</span>
        </li>
        {visible.map((s) => {
          const st = stepState(proposal, s);
          const text = STATE_TEXT[st];
          return (
            <li
              key={s}
              className={cn(
                "grid grid-cols-[8rem_1fr] rounded-lg px-4 py-3 text-[1.15rem]",
                st === "current" && "bg-brand-soft",
              )}
            >
              <span className="font-semibold text-brand">{STAGE_LABEL[s]}</span>
              <span className={st === "current" ? "text-brand" : "text-muted"}>{text}</span>
            </li>
          );
        })}
      </ul>
      {rest.length > 0 ? (
        <p className="mt-3 px-4 text-base text-muted">
          Berikutnya: {rest.map((s) => STAGE_LABEL[s]).join(" → ")}
        </p>
      ) : null}
    </div>
  );
}

/** Numbered timeline used by HR (W-35). */
export function Timeline({ proposal }: { proposal: Proposal }) {
  // Latest log entry of a stage.
  const logOf = (stage: Stage | "hr") => [...proposal.log].reverse().find((l) => l.stage === stage);
  const steps: Array<{ key: Stage | "hr"; label: string; task: string; st: StepState }> = [
    { key: "hr", label: "HR · Usulan dikirim", task: "", st: "done" },
    ...APPROVAL_STAGES.map((s) => ({
      key: s,
      label: s === "pihc" ? "PIHC · Persetujuan akhir" : s === "dirut" ? "Direktur Utama" : STAGE_LABEL[s],
      task: STAGE_TASK[s],
      st: stepState(proposal, s),
    })),
  ];
  return (
    <ol className="space-y-4">
      {steps.map((s, i) => {
        const entry = logOf(s.key);
        const detail =
          s.key === "hr"
            ? `${fmtDateTime(logOf("hr")?.at ?? proposal.submittedAt)} · ${proposal.candidates.length} kandidat`
            : s.st === "done"
              ? `${entry ? fmtDateTime(entry.at) : ""}${entry?.note ? ` · ${entry.note}` : ""}`
              : s.st === "current"
                ? `Menunggu · ${s.task}`
                : `Belum dimulai · ${s.task}`;
        return (
          <li key={s.key} className="grid grid-cols-[3.5rem_1fr] items-start">
            <span
              className={cn(
                "text-[1.35rem] font-semibold",
                s.st === "done" ? "text-ok" : s.st === "current" ? "text-brand" : "text-muted",
              )}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <p
                className={cn(
                  "text-[1.3rem] font-semibold",
                  s.st === "done" ? "text-ok" : s.st === "current" ? "text-brand" : "text-muted",
                )}
              >
                {s.key === "hr" || s.st === "next"
                  ? s.label
                  : `${s.label} · ${s.key === "pihc" && proposal.stage === "ditolak" ? "Ditolak" : s.st === "done" ? (NOTE_STAGES.includes(s.key as Stage) ? "Catatan diberikan" : "Disetujui") : "Menunggu"}`}
              </p>
              <p className="text-base text-muted">{detail}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
