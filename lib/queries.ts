import "server-only";
import {
  APPROVAL_STAGES,
  SLA_DAYS,
  TODAY,
  addDays,
  daysBetween,
  db,
  type Employee,
  type MatchCategory,
  type Nomination,
  type Notif,
  type Position,
  type Proposal,
  type RoleKey,
  type Stage,
} from "./db";

export function getEmployee(badge: string | undefined) {
  if (!badge) return undefined;
  return db().employees.find((e) => e.badge === badge);
}

export function getPosition(id: string) {
  return db().positions.find((p) => p.id === id);
}

export function getProposal(id: string) {
  return db().proposals.find((p) => p.id === id);
}

export function repositoryEmployees() {
  return db().employees.filter((e) => !e.system);
}

/* ---------------------------- Performance ---------------------------- */

export const GRADE_YEARS = [2025, 2024] as const;

export function finalGradeLabel(e: Employee) {
  const a = e.grades[2024];
  const b = e.grades[2025];
  if (!a && !b) return undefined;
  return `${a ?? "–"} / ${b ?? "–"}`;
}

export function hasBothGrades(e: Employee) {
  return Boolean(e.grades[2024] && e.grades[2025]);
}

export function kpiAchievedBothYears(e: Employee) {
  return e.kpi[2024] === "Tercapai" && e.kpi[2025] === "Tercapai";
}

/** Category can only be determined once final grades and assessment exist. */
export function isCategoryDeterminable(e: Employee) {
  return hasBothGrades(e) && Boolean(e.assessment);
}

/** Readiness score thresholds: Match ≥85, Partial Match 70–84, Less Match <70. */
export function categoryFromScore(score: number): MatchCategory {
  if (score >= 85) return "Match";
  if (score >= 70) return "Partial Match";
  return "Less Match";
}

export interface MatchRow {
  position: Position;
  category: MatchCategory;
}

export function matchesFor(e: Employee): MatchRow[] {
  if (!isCategoryDeterminable(e)) return [];
  const list = db().matches[e.badge] ?? [];
  return list.flatMap((m) => {
    const position = getPosition(m.positionId);
    return position ? [{ position, category: m.category }] : [];
  });
}

/* ------------------------- Requirement checklist ------------------------- */

export type ReqState = "Memenuhi" | "Menunggu";

export interface ReqItem {
  key: string;
  label: string;
  detail: string;
  state: ReqState;
}

export function documentsComplete(e: Employee) {
  return (
    e.interview.status === "Memenuhi" &&
    Boolean(e.health) &&
    e.lhkpn.uploaded
  );
}

export function pendingDocuments(e: Employee) {
  const out: string[] = [];
  if (e.interview.status !== "Memenuhi") out.push("Wawancara");
  if (!e.health) out.push("Kesehatan");
  if (!e.lhkpn.uploaded) out.push("LHKPN");
  return out;
}

export function checklist(e: Employee): ReqItem[] {
  const items: ReqItem[] = [
    { key: "formasi", label: "Formasi tersedia", detail: "Formasi jabatan tersedia", state: "Memenuhi" },
    { key: "mdg", label: "Masa dalam grade (MDG)", detail: "Memenuhi ketentuan ≥2 tahun (JG)", state: "Memenuhi" },
    { key: "sanksi", label: "Sanksi disiplin", detail: "Tidak ada sanksi disiplin", state: "Memenuhi" },
    { key: "masakerja", label: "Sisa masa kerja", detail: "Memenuhi ketentuan ≥1 tahun", state: "Memenuhi" },
  ];
  items.push(
    e.assessment
      ? {
          key: "asesmen",
          label: "Hasil asesmen",
          detail: `${e.assessment.result} · Asesmen valid`,
          state: e.assessment.result === "Direkomendasikan" ? "Memenuhi" : "Menunggu",
        }
      : { key: "asesmen", label: "Hasil asesmen", detail: "Menunggu hasil asesmen", state: "Menunggu" },
  );
  items.push(
    hasBothGrades(e) && kpiAchievedBothYears(e)
      ? {
          key: "kinerja",
          label: "Kinerja dua tahun terakhir",
          detail: `2024 & 2025: KPI tercapai · Nilai ${e.grades[2024]} / ${e.grades[2025]}`,
          state: "Memenuhi",
        }
      : { key: "kinerja", label: "Kinerja dua tahun terakhir", detail: "Menunggu nilai akhir kinerja", state: "Menunggu" },
  );
  items.push(
    e.interview.status === "Memenuhi"
      ? { key: "wawancara", label: "Hasil wawancara", detail: "Hasil wawancara tersedia", state: "Memenuhi" }
      : { key: "wawancara", label: "Hasil wawancara", detail: "Menunggu hasil wawancara", state: "Menunggu" },
  );
  items.push(
    e.health
      ? { key: "kesehatan", label: "Rekomendasi kesehatan", detail: e.health, state: "Memenuhi" }
      : { key: "kesehatan", label: "Rekomendasi kesehatan", detail: "Menunggu status rekomendasi", state: "Menunggu" },
  );
  items.push(
    e.lhkpn.uploaded
      ? { key: "lhkpn", label: "LHKPN", detail: "Bukti LHKPN tersedia", state: "Memenuhi" }
      : { key: "lhkpn", label: "LHKPN", detail: "Menunggu kelengkapan LHKPN", state: "Menunggu" },
  );
  return items;
}

export function completenessLabel(e: Employee) {
  if (!hasBothGrades(e)) return { text: "Nilai akhir belum ada", ok: false };
  if (!e.assessment) return { text: "Asesmen belum ada", ok: false };
  const n = pendingDocuments(e).length;
  if (n === 0) return { text: "Memenuhi", ok: true };
  return { text: `${n} dokumen menunggu`, ok: false };
}

/* -------------------------------- SLA -------------------------------- */

export function deadlineOf(p: Proposal) {
  return addDays(p.enteredAt, SLA_DAYS);
}

/** Positive = days late, <=0 = days remaining. */
export function lateDays(p: Proposal) {
  return daysBetween(deadlineOf(p), TODAY);
}

export function slaText(p: Proposal) {
  const d = lateDays(p);
  if (d > 0) return `Terlambat ${d} hari`;
  if (d === 0) return "Jatuh tempo hari ini";
  return `${-d} hari lagi`;
}

export function isOverdue(p: Proposal) {
  return lateDays(p) > 0;
}

/* ---------------------------- Proposals ---------------------------- */

export function inApproval(p: Proposal) {
  return APPROVAL_STAGES.includes(p.stage);
}

export function activeProposals() {
  return db().proposals.filter((p) => p.stage !== "selesai" && p.stage !== "ditolak");
}

export function queueFor(role: RoleKey): Proposal[] {
  const stage = role as Stage;
  return db()
    .proposals.filter((p) => p.stage === stage)
    .sort((a, b) => lateDays(b) - lateDays(a));
}

export function proposalsForBadge(badge: string) {
  return db().proposals.filter(
    (p) => p.stage !== "draft" && p.candidates.some((c) => c.badge === badge),
  );
}

export function recommendationFor(vacancyId: string, badge: string) {
  return db().recommendations[vacancyId]?.find((r) => r.badge === badge);
}

/** Category shown next to a candidate: derived from the readiness score when one exists. */
export function categoryFor(vacancyId: string, badge: string): MatchCategory {
  const rec = recommendationFor(vacancyId, badge);
  if (rec) return categoryFromScore(rec.score);
  const e = getEmployee(badge);
  return (e && matchesFor(e).find((m) => m.position.id === vacancyId)?.category) || "Match";
}

export function notesFor(p: Proposal, badge: string) {
  return p.notes.filter((n) => n.badge === badge);
}

export function proposalForVacancy(vacancyId: string) {
  return db().proposals.find((p) => p.vacancyId === vacancyId);
}

/* --------------------------- Notifications --------------------------- */

export function notificationsFor(role: RoleKey): Notif[] {
  return db()
    .notifs.filter((n) => n.role === role)
    .sort((a, b) => b.at.localeCompare(a.at));
}

export function unreadCount(role: RoleKey) {
  return notificationsFor(role).filter((n) => !n.read).length;
}

export function pushNotif(n: Omit<Notif, "id" | "read">) {
  db().notifs.push({ ...n, id: `n${Date.now()}${Math.random().toString(16).slice(2, 6)}`, read: false });
}

/* ----------------------------- Nominations ----------------------------- */

/** The nomination that currently counts for (badge, vacancy); one already rejected by the atasan does not. */
export function activeNomination(badge: string, vacancyId: string) {
  return db().nominations.find(
    (n) => n.badge === badge && n.vacancyId === vacancyId && n.response !== "Ditolak",
  );
}

/** Self-nomination that has an atasan who has not yet responded. */
export function awaitingSupervisor(n: Nomination) {
  return n.source === "Diri sendiri" && !n.response && Boolean(getEmployee(n.badge)?.supervisor);
}

/** Returns a user-facing reason when `badge` cannot be nominated, else undefined. */
export function nominationBlock(badge: string, vacancyId: string): string | undefined {
  const e = getEmployee(badge);
  const p = getPosition(vacancyId);
  if (!e || !p) return "Data karyawan atau jabatan tidak ditemukan.";
  if (!p.open) return "Tidak ada lowongan aktif untuk jabatan ini.";
  if (!isCategoryDeterminable(e)) return "Kategori kecocokan belum dapat ditentukan.";
  const m = matchesFor(e).find((x) => x.position.id === vacancyId);
  if (m?.category !== "Match") return "Pencalonan hanya tersedia untuk kategori Match.";
  // A candidate can be nominated only once per position, by any party.
  if (activeNomination(badge, vacancyId)) return "Kandidat sudah dicalonkan untuk jabatan ini.";
  // After a rejection only HR can still put the employee forward (from the recommendations).
  if (db().nominations.some((n) => n.badge === badge && n.vacancyId === vacancyId))
    return "Pencalonan untuk jabatan ini sudah ditolak atasan. HR yang dapat mengajukan kandidat ini.";
  const prop = db().proposals.find((x) => x.vacancyId === vacancyId);
  if (prop?.candidates.some((c) => c.badge === badge))
    return "Kandidat sudah termasuk dalam usulan untuk jabatan ini.";
  return undefined;
}

export function eligibleVacancies(e: Employee) {
  return matchesFor(e).filter((m) => !nominationBlock(e.badge, m.position.id));
}

/* ------------------------- Nomination status rows ------------------------- */

export interface StatusRow {
  key: string;
  badge: string;
  name: string;
  title: string;
  source: string;
  date: string;
  stage: Stage | "hr";
  proposal?: Proposal;
  /** Self-nomination rejected by the Atasan Langsung. */
  rejected?: boolean;
  /** Reason given by the Atasan Langsung when rejecting. */
  rejectNote?: string;
  /** Self-nomination still waiting for the Atasan Langsung. */
  awaitingSupervisor?: boolean;
}

/** Proposals (and not-yet-proposed nominations) that involve the given badges. */
export function statusRows(badges: string[]): StatusRow[] {
  const store = db();
  const rows: StatusRow[] = [];
  for (const badge of badges) {
    const e = getEmployee(badge);
    if (!e) continue;
    for (const p of store.proposals) {
      const c = p.candidates.find((x) => x.badge === badge);
      if (!c || p.stage === "draft") continue;
      rows.push({
        key: `${p.id}-${badge}`,
        badge,
        name: e.name,
        title: p.title,
        source: c.source,
        date: p.submittedAt,
        stage: p.stage,
        proposal: p,
      });
    }
    for (const n of store.nominations) {
      if (n.badge !== badge) continue;
      const inProposal = store.proposals.some(
        (p) => p.vacancyId === n.vacancyId && p.stage !== "draft" && p.candidates.some((c) => c.badge === badge),
      );
      if (inProposal) continue;
      rows.push({
        key: n.id,
        badge,
        name: e.name,
        title: getPosition(n.vacancyId)?.title ?? n.vacancyId,
        source: n.source,
        date: n.at,
        stage: "hr",
        rejected: n.response === "Ditolak",
        rejectNote: n.responseNote,
        awaitingSupervisor: awaitingSupervisor(n),
      });
    }
  }
  return rows;
}

/* ----------------------- Match presentation helpers ----------------------- */

export const CATEGORY_ORDER: MatchCategory[] = ["Match", "Partial Match", "Less Match"];

/** Match, then Partial, then Less; within a category, positions with an active vacancy first. */
export function sortedMatches(e: Employee): MatchRow[] {
  return [...matchesFor(e)].sort(
    (a, b) =>
      CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) ||
      Number(b.position.open) - Number(a.position.open),
  );
}

/** Development areas of a position: required competencies not yet reached at the requested level. */
export function devAreas(p: Position): string[] {
  return [p.developmentArea, ...(p.moreDevelopmentAreas ?? [])].filter((x) => x && x !== "-");
}

export const DEV_AREA_INFO: Record<string, string> = {
  "Perencanaan strategis":
    "Kemampuan menerjemahkan arah perusahaan menjadi rencana kerja jangka menengah, menetapkan prioritas, dan mengukur hasilnya.",
  "Pengendalian mutu lanjutan":
    "Kemampuan merancang dan memperbaiki sistem pengendalian mutu, bukan hanya menjalankan prosedur yang sudah ada.",
  "Manajemen rantai pasok":
    "Kemampuan mengelola aliran bahan, informasi, dan pemasok dari hulu sampai ke produksi dan distribusi.",
  "Sistem manajemen mutu":
    "Pemahaman dan penerapan sistem manajemen mutu (mis. ISO 9001) pada seluruh proses unit kerja.",
  "Kepemimpinan lintas unit":
    "Kemampuan memimpin dan menyelaraskan pekerjaan beberapa unit yang tidak berada di bawah garis komando langsung.",
};

/** Other positions in the employee's scope that require the same competency. */
export function relatedPositionsFor(e: Employee, area: string, excludeId: string): MatchRow[] {
  return sortedMatches(e).filter(
    (m) => m.position.id !== excludeId && (devAreas(m.position).includes(area) || m.position.competencies.includes(area)),
  );
}

/** The five mandatory requirements in plain language with the evidence behind each. */
export function mandatoryReqs(e: Employee): ReqItem[] {
  const byKey = new Map(checklist(e).map((i) => [i.key, i]));
  const rows: Array<[string, string]> = [
    ["mdg", "Masa dalam grade cukup"],
    ["kinerja", "KPI tercapai 2 tahun terakhir"],
    ["asesmen", "Hasil asesmen direkomendasikan"],
    ["sanksi", "Tidak sedang menjalani sanksi"],
    ["masakerja", "Sisa masa kerja cukup"],
  ];
  return rows.map(([key, label]) => ({ ...byKey.get(key)!, label }));
}

export function mandatoryScore(e: Employee) {
  const items = mandatoryReqs(e);
  return { met: items.filter((i) => i.state === "Memenuhi").length, total: items.length };
}

export function matchSummary(e: Employee, row: MatchRow) {
  const p = row.position;
  const dev = devAreas(p).length;
  const { met, total } = mandatoryScore(e);
  return [
    `${p.competencies.length} kompetensi sesuai`,
    `${dev} development area`,
    met === total ? "Syarat wajib lengkap" : "Syarat wajib belum lengkap",
  ].join(" · ");
}

export function daysUntil(iso: string) {
  return daysBetween(TODAY, iso);
}

/** Total steps in the approval path as shown to Karyawan/Atasan: HR + the approval stages. */
export const STEP_TOTAL = APPROVAL_STAGES.length + 1;

export function stepNumber(stage: Stage | "hr") {
  if (stage === "hr" || stage === "draft") return 1;
  const i = APPROVAL_STAGES.indexOf(stage);
  return i < 0 ? STEP_TOTAL : i + 2;
}
