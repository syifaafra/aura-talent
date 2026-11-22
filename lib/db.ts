import "server-only";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type RoleKey =
  | "karyawan"
  | "atasan"
  | "hr"
  | "vp"
  | "svp"
  | "direksi1"
  | "direksi2"
  | "direksi3"
  | "dirut"
  | "pihc";

export type RoleGroup = "karyawan" | "atasan" | "hr" | "approver";

export const ROLE_LABEL: Record<RoleKey, string> = {
  karyawan: "Karyawan",
  atasan: "Atasan",
  hr: "HR",
  vp: "VP SDM",
  svp: "SVP SDM",
  direksi1: "Direksi 1",
  direksi2: "Direksi 2",
  direksi3: "Direksi 3",
  dirut: "Direktur Utama",
  pihc: "PIHC",
};

export function roleGroup(role: RoleKey): RoleGroup {
  if (role === "karyawan" || role === "atasan" || role === "hr") return role;
  return "approver";
}

export const GROUP_HOME: Record<RoleGroup, string> = {
  karyawan: "/karyawan",
  atasan: "/atasan",
  hr: "/hr",
  approver: "/approver",
};

export type Grade = "A" | "B" | "C" | "D";
export type HealthStatus = "Direkomendasikan" | "Tidak Direkomendasikan";
export type MatchCategory = "Match" | "Partial Match" | "Less Match";

export type Stage =
  | "draft"
  | "vp"
  | "svp"
  | "direksi1"
  | "direksi2"
  | "direksi3"
  | "dirut"
  | "pihc"
  | "selesai";

export const APPROVAL_STAGES: Stage[] = [
  "vp",
  "svp",
  "direksi1",
  "direksi2",
  "direksi3",
  "dirut",
  "pihc",
];

export const STAGE_LABEL: Record<Stage, string> = {
  draft: "Draf HR",
  vp: "VP SDM",
  svp: "SVP SDM",
  direksi1: "Direksi 1",
  direksi2: "Direksi 2",
  direksi3: "Direksi 3",
  dirut: "Direktur Utama",
  pihc: "PIHC",
  selesai: "Selesai",
};

export const STAGE_TASK: Record<Stage, string> = {
  draft: "Menyusun usulan",
  vp: "Persetujuan usulan",
  svp: "Persetujuan usulan",
  direksi1: "Pemilihan kandidat",
  direksi2: "Persetujuan kandidat",
  direksi3: "Persetujuan kandidat",
  dirut: "Penetapan calon",
  pihc: "Persetujuan akhir · Kelengkapan persyaratan",
  selesai: "Usulan selesai",
};

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  badge?: string;
  roles: RoleKey[];
}

export interface Employee {
  badge: string;
  name: string;
  position: string;
  unit: string;
  jobGrade: number;
  supervisor?: string;
  /** Hidden from the HR repository and talent list. */
  system?: boolean;
  grades: Partial<Record<number, Grade>>;
  kpi: Partial<Record<number, "Tercapai" | "Belum tercapai">>;
  assessment?: {
    result: HealthStatus;
    validUntil: string;
    reportUploaded: boolean;
    assessor?: string;
    date?: string;
  };
  interview: { status: "Memenuhi" | "Menunggu"; file?: string; invalid?: string };
  health?: HealthStatus;
  lhkpn: { uploaded: boolean; file?: string };
  history: string;
  education: string;
  talentStatus: string;
  competency: string;
  strengths: string;
}

export interface Position {
  id: string;
  title: string;
  label: string;
  unit: string;
  /** Registration state of the vacancy. */
  open: boolean;
  openUntil?: string;
  vacancyCode?: string;
  competencies: string[];
  keyStrength: string;
  developmentArea: string;
  relatedPosition: string;
}

export interface PositionMatch {
  positionId: string;
  category: MatchCategory;
}

export interface Candidate {
  badge: string;
  source: "Diri sendiri" | "Atasan Langsung" | "HR (Rekomendasi)" | "HR (Daftar Talenta)";
}

export interface LogEntry {
  at: string;
  stage: Stage | "hr";
  action: string;
  note?: string;
}

export interface Note {
  stage: Stage;
  badge: string;
  text: string;
}

export interface Proposal {
  id: string;
  vacancyId: string;
  title: string;
  submittedAt: string;
  stage: Stage;
  enteredAt: string;
  candidates: Candidate[];
  log: LogEntry[];
  notes: Note[];
  selectedBadge?: string;
  designatedBadge?: string;
  hrNote: string;
}

export interface Nomination {
  id: string;
  badge: string;
  vacancyId: string;
  source: Candidate["source"];
  justification: string;
  by: string;
  at: string;
  /** Atasan Langsung's answer to a self-nomination; undefined = not yet responded. */
  response?: "Diterima" | "Ditolak";
  responseNote?: string;
}

export interface InterviewSlot {
  badge: string;
  start: string;
  end: string;
}

export interface Interview {
  proposalId: string;
  date: string;
  method: string;
  interviewers: string;
  location: string;
  slots: InterviewSlot[];
  sentAt: string;
}

export interface Notif {
  id: string;
  role: RoleKey;
  kind: string;
  title: string;
  body: string;
  at: string;
  proposalId?: string;
  read: boolean;
}

export interface Recommendation {
  badge: string;
  score: number;
  reason: string;
  gap: string;
  change: "naik" | "turun" | "baru";
  changeBy?: number;
  indicators: { asesmen: number; kinerja: number; riwayat: number; pendidikan: number };
}

export interface Store {
  users: User[];
  employees: Employee[];
  positions: Position[];
  matches: Record<string, PositionMatch[]>;
  recommendations: Record<string, Recommendation[]>;
  proposals: Proposal[];
  nominations: Nomination[];
  interviews: Interview[];
  notifs: Notif[];
  piSmartSync: { at: string; failed: boolean };
  lastImport?: { at: string; rows: number };
}

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

/** Fixed "today" used by the design reference (SLA, deadlines). */
export const TODAY = "2026-12-04";
export const SLA_DAYS = 2;

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function dayOf(iso: string) {
  return iso.slice(0, 10);
}

export function fmtDate(iso: string) {
  const [y, m, d] = dayOf(iso).split("-");
  return `${d}/${m}/${y}`;
}

export function fmtLong(iso: string) {
  const [y, m, d] = dayOf(iso).split("-");
  return `${d} ${MONTHS[Number(m) - 1]} ${y}`;
}

export function fmtDateTime(iso: string) {
  return `${fmtDate(iso)} ${iso.slice(11, 16)}`;
}

export function addDays(iso: string, days: number) {
  const t = new Date(`${dayOf(iso)}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + days);
  return t.toISOString().slice(0, 10);
}

export function daysBetween(fromIso: string, toIso: string) {
  const a = new Date(`${dayOf(fromIso)}T00:00:00Z`).getTime();
  const b = new Date(`${dayOf(toIso)}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

/* ------------------------------------------------------------------ */
/* Seed                                                                */
/* ------------------------------------------------------------------ */

function emp(partial: Partial<Employee> & Pick<Employee, "badge" | "name" | "position" | "unit">): Employee {
  return {
    jobGrade: 7,
    grades: {},
    kpi: {},
    interview: { status: "Menunggu" },
    lhkpn: { uploaded: false },
    history: "",
    education: "S1 Teknik Industri · Lulus 2020",
    talentStatus: "Talenta potensial · Siap dikembangkan untuk jenjang berikutnya",
    competency: "Teknis: 4/5 · Kepemimpinan: 3/5 · Kolaborasi: 4/5",
    strengths: "",
    ...partial,
  };
}

const okAssessment = {
  result: "Direkomendasikan" as HealthStatus,
  validUntil: "2026-10-31",
  reportUploaded: false,
};

function createSeed(): Store {
  const employees: Employee[] = [
    emp({
      badge: "000001",
      name: "Budi Budiman",
      position: "Staf Senior Produksi",
      unit: "Produksi",
      jobGrade: 7,
      supervisor: "000007",
      grades: { 2024: "B", 2025: "B" },
      kpi: { 2024: "Tercapai", 2025: "Tercapai" },
      assessment: { ...okAssessment },
      interview: { status: "Menunggu", file: "wawancara_budi.jpg", invalid: "format tidak sesuai" },
      history: "2021–2023: Staf Produksi · 2023–sekarang: Staf Senior Produksi",
      strengths: "Pengalaman produksi lintas lini",
    }),
    emp({
      badge: "000002",
      name: "Bhima Adiputra",
      position: "Staf Senior Operasi",
      unit: "Operasi",
      grades: { 2024: "B", 2025: "A" },
      kpi: { 2024: "Tercapai", 2025: "Tercapai" },
      assessment: { ...okAssessment, reportUploaded: true },
      interview: { status: "Memenuhi", file: "wawancara_bhima.pdf" },
      health: "Direkomendasikan",
      lhkpn: { uploaded: true, file: "lhkpn_bhima.pdf" },
      history: "2020–2022: Staf Operasi · 2022–sekarang: Staf Senior Operasi",
      education: "S1 Teknik Kimia · Lulus 2019",
      strengths: "Pengalaman operasional dan pendidikan relevan",
    }),
    emp({
      badge: "000003",
      name: "Sari Puspadewi",
      position: "Analis Senior SDM",
      unit: "SDM",
      supervisor: "000007",
      grades: { 2024: "B", 2025: "B" },
      kpi: { 2024: "Tercapai", 2025: "Tercapai" },
      history: "2019–2022: Analis SDM · 2022–sekarang: Analis Senior SDM",
      strengths: "Analisis kebutuhan talenta",
    }),
    emp({
      badge: "000004",
      name: "Lukman Hakim",
      position: "Staf Senior Keuangan",
      unit: "Keuangan",
      grades: { 2024: "B", 2025: "B" },
      kpi: { 2024: "Tercapai", 2025: "Tercapai" },
      assessment: { ...okAssessment, reportUploaded: true },
      interview: { status: "Memenuhi", file: "wawancara_lukman.pdf" },
      health: "Direkomendasikan",
      lhkpn: { uploaded: true, file: "lhkpn_lukman.pdf" },
      history: "2018–2021: Staf Keuangan · 2021–sekarang: Staf Senior Keuangan",
      education: "S1 Akuntansi · Lulus 2018",
      strengths: "Kinerja dan asesmen kuat",
    }),
    emp({
      badge: "000005",
      name: "Diandra Pertiwi",
      position: "Analis Senior Produksi",
      unit: "Produksi",
      supervisor: "000007",
      grades: {},
      kpi: { 2024: "Tercapai", 2025: "Tercapai" },
      assessment: { ...okAssessment },
      history: "2020–sekarang: Analis Senior Produksi",
      strengths: "Analisis proses produksi",
    }),
    emp({
      badge: "000006",
      name: "Rina Hartati",
      position: "Analis Senior SDM",
      unit: "SDM",
      system: true,
      grades: { 2024: "B", 2025: "B" },
      kpi: { 2024: "Tercapai", 2025: "Tercapai" },
      assessment: { ...okAssessment, reportUploaded: true },
      interview: { status: "Memenuhi", file: "wawancara_rina.pdf" },
      health: "Direkomendasikan",
      lhkpn: { uploaded: true, file: "lhkpn_rina.pdf" },
      strengths: "Pengelolaan data SDM",
    }),
    emp({
      badge: "000007",
      name: "Hendra Wijaya",
      position: "Manajer Produksi",
      unit: "Produksi",
      jobGrade: 9,
      supervisor: "000008",
      system: true,
      grades: { 2024: "A", 2025: "B" },
      kpi: { 2024: "Tercapai", 2025: "Tercapai" },
      assessment: { ...okAssessment, reportUploaded: true },
      interview: { status: "Memenuhi", file: "wawancara_hendra.pdf" },
      health: "Direkomendasikan",
      lhkpn: { uploaded: true, file: "lhkpn_hendra.pdf" },
    }),
    emp({
      badge: "000009",
      name: "Rizky Pratama",
      position: "Staf Senior Produksi",
      unit: "Produksi",
      supervisor: "000007",
      system: true,
      grades: { 2024: "B", 2025: "B" },
      kpi: { 2024: "Tercapai", 2025: "Tercapai" },
      assessment: { ...okAssessment },
      history: "2019–2022: Staf Produksi · 2022–sekarang: Staf Senior Produksi",
      strengths: "Pengalaman produksi dan konsistensi capaian KPI",
    }),
    emp({
      badge: "000008",
      name: "Dewi Anggraini",
      position: "VP SDM",
      unit: "SDM",
      jobGrade: 11,
      system: true,
      grades: { 2024: "A", 2025: "A" },
      kpi: { 2024: "Tercapai", 2025: "Tercapai" },
      assessment: { ...okAssessment, reportUploaded: true },
      interview: { status: "Memenuhi", file: "wawancara_dewi.pdf" },
      health: "Direkomendasikan",
      lhkpn: { uploaded: true, file: "lhkpn_dewi.pdf" },
    }),
    // --- Extra scenarios ---------------------------------------------------
    // Assessment "Tidak Direkomendasikan" + KPI 2025 not achieved.
    emp({
      badge: "000010",
      name: "Maya Kusuma",
      position: "Staf Senior Operasi",
      unit: "Operasi",
      supervisor: "000007",
      grades: { 2024: "C", 2025: "C" },
      kpi: { 2024: "Tercapai", 2025: "Belum tercapai" },
      assessment: { result: "Tidak Direkomendasikan", validUntil: "2026-10-31", reportUploaded: true },
      interview: { status: "Menunggu" },
      health: "Tidak Direkomendasikan",
      history: "2021–sekarang: Staf Senior Operasi",
      strengths: "Pengalaman operasional dasar",
    }),
    // Only one final grade so far (2025 missing) and no assessment yet.
    emp({
      badge: "000011",
      name: "Fajar Nugroho",
      position: "Staf Senior Keuangan",
      unit: "Keuangan",
      grades: { 2024: "B" },
      kpi: { 2024: "Tercapai" },
      history: "2022–sekarang: Staf Senior Keuangan",
      strengths: "Pelaporan keuangan",
    }),
    // Fully complete: assessment, interview, health, LHKPN.
    emp({
      badge: "000012",
      name: "Citra Lestari",
      position: "Staf Senior Keuangan",
      unit: "Keuangan",
      supervisor: "000008",
      grades: { 2024: "A", 2025: "A" },
      kpi: { 2024: "Tercapai", 2025: "Tercapai" },
      assessment: { ...okAssessment, reportUploaded: true },
      interview: { status: "Memenuhi", file: "wawancara_citra.pdf" },
      health: "Direkomendasikan",
      lhkpn: { uploaded: true, file: "lhkpn_citra.pdf" },
      history: "2017–2020: Staf Keuangan · 2020–sekarang: Staf Senior Keuangan",
      education: "S1 Akuntansi · Lulus 2017",
      strengths: "Kinerja unggul dua tahun berturut-turut",
    }),
    // Category determinable, but interview/health/LHKPN all pending.
    emp({
      badge: "000013",
      name: "Andi Saputra",
      position: "Staf Senior Logistik",
      unit: "Logistik",
      supervisor: "000007",
      grades: { 2024: "B", 2025: "B" },
      kpi: { 2024: "Tercapai", 2025: "Tercapai" },
      assessment: { ...okAssessment },
      history: "2020–sekarang: Staf Senior Logistik",
      strengths: "Pengadaan dan koordinasi pemasok",
    }),
  ];

  const users: User[] = [
    { id: "u-budi", username: "budi", password: "password", name: "Budi Budiman", badge: "000001", roles: ["karyawan"] },
    { id: "u-bhima", username: "bhima", password: "password", name: "Bhima Adiputra", badge: "000002", roles: ["karyawan"] },
    { id: "u-sari", username: "sari", password: "password", name: "Sari Puspadewi", badge: "000003", roles: ["karyawan"] },
    { id: "u-lukman", username: "lukman", password: "password", name: "Lukman Hakim", badge: "000004", roles: ["karyawan"] },
    { id: "u-diandra", username: "diandra", password: "password", name: "Diandra Pertiwi", badge: "000005", roles: ["karyawan"] },
    { id: "u-hr", username: "hr", password: "password", name: "Rina Hartati", badge: "000006", roles: ["karyawan", "hr"] },
    { id: "u-atasan", username: "atasan", password: "password", name: "Hendra Wijaya", badge: "000007", roles: ["karyawan", "atasan"] },
    { id: "u-vp", username: "vp", password: "password", name: "Dewi Anggraini", badge: "000008", roles: ["karyawan", "atasan", "vp"] },
    { id: "u-maya", username: "maya", password: "password", name: "Maya Kusuma", badge: "000010", roles: ["karyawan"] },
    { id: "u-fajar", username: "fajar", password: "password", name: "Fajar Nugroho", badge: "000011", roles: ["karyawan"] },
    { id: "u-citra", username: "citra", password: "password", name: "Citra Lestari", badge: "000012", roles: ["karyawan"] },
    { id: "u-andi", username: "andi", password: "password", name: "Andi Saputra", badge: "000013", roles: ["karyawan"] },
    { id: "u-svp", username: "svp", password: "password", name: "Agus Santoso", roles: ["svp"] },
    { id: "u-direksi1", username: "direksi1", password: "password", name: "Direksi 1", roles: ["direksi1"] },
    { id: "u-direksi2", username: "direksi2", password: "password", name: "Direksi 2", roles: ["direksi2"] },
    { id: "u-direksi3", username: "direksi3", password: "password", name: "Direksi 3", roles: ["direksi3"] },
    { id: "u-dirut", username: "dirut", password: "password", name: "Direktur Utama", roles: ["dirut"] },
    { id: "u-pihc", username: "pihc", password: "password", name: "PIHC", roles: ["pihc"] },
  ];

  const positions: Position[] = [
    {
      id: "P-MP",
      title: "Manajer Produksi",
      label: "Jabatan A",
      unit: "Produksi",
      open: true,
      openUntil: "2026-11-30",
      vacancyCode: "NOV-26-006",
      competencies: ["Manajemen operasi", "Keselamatan proses", "Pemecahan masalah"],
      keyStrength:
        "Pengalaman produksi lintas lini dan konsistensi capaian KPI dua tahun terakhir mendukung tanggung jawab jabatan tujuan.",
      developmentArea: "Perencanaan strategis",
      relatedPosition: "Manajer Operasi Produksi",
    },
    {
      id: "P-MOP",
      title: "Manajer Operasi Produksi",
      label: "Jabatan B",
      unit: "Produksi",
      open: false,
      competencies: ["Manajemen operasi", "Keselamatan proses", "Pemecahan masalah"],
      keyStrength:
        "Pengalaman produksi lintas lini dan konsistensi capaian KPI dua tahun terakhir mendukung tanggung jawab jabatan tujuan.",
      developmentArea: "Perencanaan strategis",
      relatedPosition: "Manajer Produksi",
    },
    {
      id: "P-SPM",
      title: "Superintenden Mutu Produksi",
      label: "Jabatan C",
      unit: "Produksi",
      open: false,
      competencies: ["Pengendalian mutu", "Analisis data"],
      keyStrength: "Pemahaman proses produksi mendukung pengendalian mutu.",
      developmentArea: "Pengendalian mutu lanjutan",
      relatedPosition: "Manajer Produksi",
    },
    {
      id: "P-MLG",
      title: "Manajer Logistik",
      label: "Jabatan H",
      unit: "Logistik",
      open: false,
      competencies: ["Rantai pasok", "Negosiasi"],
      keyStrength: "Pengalaman lintas fungsi masih terbatas.",
      developmentArea: "Manajemen rantai pasok",
      relatedPosition: "Manajer Produksi",
    },
    {
      id: "P-MK",
      title: "Manajer Keuangan",
      label: "Jabatan F",
      unit: "Keuangan",
      open: true,
      openUntil: "2026-12-31",
      vacancyCode: "DES-26-011",
      competencies: ["Pelaporan keuangan", "Pengendalian anggaran"],
      keyStrength: "Kinerja dan asesmen kuat pada fungsi keuangan.",
      developmentArea: "Perencanaan strategis",
      relatedPosition: "Manajer Anggaran",
    },
    {
      id: "P-MPG",
      title: "Manajer Pengadaan",
      label: "Jabatan K",
      unit: "Logistik",
      open: true,
      openUntil: "2026-12-31",
      vacancyCode: "DES-26-014",
      competencies: ["Pengadaan strategis", "Negosiasi"],
      keyStrength: "Pengalaman lintas fungsi mendukung proses pengadaan.",
      developmentArea: "Manajemen rantai pasok",
      relatedPosition: "Manajer Logistik",
    },
    {
      id: "P-MQ",
      title: "Manajer Mutu",
      label: "Jabatan G",
      unit: "Produksi",
      open: true,
      openUntil: "2026-12-31",
      vacancyCode: "DES-26-012",
      competencies: ["Sistem manajemen mutu"],
      keyStrength: "-",
      developmentArea: "Sistem manajemen mutu",
      relatedPosition: "Manajer Produksi",
    },
    {
      id: "P-MSDM",
      title: "Manajer SDM",
      label: "Jabatan I",
      unit: "SDM",
      open: false,
      competencies: ["Manajemen talenta"],
      keyStrength: "Pengelolaan data SDM.",
      developmentArea: "Perencanaan strategis",
      relatedPosition: "Manajer SDM",
    },
    {
      id: "P-MOPR",
      title: "Manajer Operasi",
      label: "Jabatan J",
      unit: "Operasi",
      open: false,
      competencies: ["Manajemen operasi"],
      keyStrength: "Pengalaman operasional.",
      developmentArea: "Kepemimpinan lintas unit",
      relatedPosition: "Manajer Produksi",
    },
    {
      id: "P-MSP",
      title: "Manajer Perencanaan Produksi",
      label: "Jabatan L",
      unit: "Produksi",
      open: true,
      openUntil: "2026-12-31",
      vacancyCode: "DES-26-015",
      competencies: ["Perencanaan produksi", "Pemecahan masalah"],
      keyStrength: "Pengalaman produksi dan konsistensi capaian KPI mendukung perencanaan produksi.",
      developmentArea: "Perencanaan strategis",
      relatedPosition: "Manajer Produksi",
    },
    // Vacancies whose proposal is already in the approval chain (lowongan closed).
    ...(
      [
        ["P-MAN", "Manajer Anggaran", "Jabatan M", "Keuangan"],
        ["P-MPM", "Manajer Pemeliharaan", "Jabatan N", "Operasi"],
        ["P-MK3", "Manajer K3", "Jabatan O", "Produksi"],
        ["P-MTI", "Manajer Teknologi Informasi", "Jabatan P", "SDM"],
        ["P-MPJ", "Manajer Penjualan", "Jabatan Q", "Pemasaran"],
        ["P-MGD", "Manajer Gudang", "Jabatan R", "Logistik"],
        ["P-MAK", "Manajer Akuntansi", "Jabatan S", "Keuangan"],
      ] as const
    ).map(
      ([id, title, label, unit]): Position => ({
        id,
        title,
        label,
        unit,
        open: false,
        competencies: ["Manajemen tim", "Pemecahan masalah"],
        keyStrength: "Kinerja konsisten dan kompetensi sesuai kebutuhan jabatan.",
        developmentArea: "Perencanaan strategis",
        relatedPosition: "Manajer Produksi",
      }),
    ),
    {
      id: "P-D",
      title: "Jabatan D",
      label: "Jabatan D",
      unit: "-",
      open: false,
      competencies: [],
      keyStrength: "-",
      developmentArea: "-",
      relatedPosition: "-",
    },
    {
      id: "P-E",
      title: "Jabatan E",
      label: "Jabatan E",
      unit: "-",
      open: false,
      competencies: [],
      keyStrength: "-",
      developmentArea: "-",
      relatedPosition: "-",
    },
  ];

  const matches: Record<string, PositionMatch[]> = {
    "000001": [
      { positionId: "P-MP", category: "Match" },
      { positionId: "P-MOP", category: "Match" },
      { positionId: "P-SPM", category: "Partial Match" },
      { positionId: "P-MLG", category: "Less Match" },
    ],
    "000002": [
      { positionId: "P-MOPR", category: "Match" },
      { positionId: "P-MP", category: "Match" },
      { positionId: "P-MK", category: "Partial Match" },
    ],
    "000004": [
      { positionId: "P-MK", category: "Match" },
      { positionId: "P-MQ", category: "Less Match" },
    ],
    "000009": [
      { positionId: "P-MP", category: "Match" },
      { positionId: "P-MSP", category: "Match" },
    ],
    "000006": [
      { positionId: "P-MSDM", category: "Match" },
      { positionId: "P-MK", category: "Match" },
    ],
    "000007": [{ positionId: "P-MSDM", category: "Partial Match" }],
    "000010": [{ positionId: "P-MOPR", category: "Less Match" }],
    "000012": [
      { positionId: "P-MK", category: "Match" },
      { positionId: "P-MPG", category: "Match" },
    ],
    "000013": [
      { positionId: "P-MPG", category: "Match" },
      { positionId: "P-MLG", category: "Partial Match" },
    ],
  };

  const recommendations: Record<string, Recommendation[]> = {
    "P-MP": [
      {
        badge: "000001",
        score: 92,
        reason: "KPI dan pengalaman kuat",
        gap: "perencanaan strategis",
        change: "naik",
        changeBy: 1,
        indicators: { asesmen: 90, kinerja: 95, riwayat: 92, pendidikan: 90 },
      },
      {
        badge: "000002",
        score: 88,
        reason: "Asesmen dan pendidikan kuat",
        gap: "kepemimpinan lintas unit",
        change: "turun",
        changeBy: 1,
        indicators: { asesmen: 91, kinerja: 86, riwayat: 85, pendidikan: 92 },
      },
      {
        badge: "000004",
        score: 84,
        reason: "Kinerja dan asesmen kuat",
        gap: "pengalaman lintas fungsi",
        change: "baru",
        indicators: { asesmen: 85, kinerja: 86, riwayat: 80, pendidikan: 84 },
      },
    ],
    "P-MK": [
      {
        badge: "000004",
        score: 90,
        reason: "Kinerja dan asesmen kuat pada fungsi keuangan",
        gap: "perencanaan strategis",
        change: "naik",
        changeBy: 1,
        indicators: { asesmen: 90, kinerja: 92, riwayat: 90, pendidikan: 88 },
      },
      {
        badge: "000006",
        score: 86,
        reason: "Pengelolaan data dan pelaporan baik",
        gap: "pengalaman fungsi keuangan",
        change: "baru",
        indicators: { asesmen: 86, kinerja: 87, riwayat: 82, pendidikan: 88 },
      },
      {
        badge: "000002",
        score: 82,
        reason: "Asesmen kuat",
        gap: "pengalaman lintas fungsi",
        change: "turun",
        changeBy: 1,
        indicators: { asesmen: 90, kinerja: 80, riwayat: 76, pendidikan: 82 },
      },
    ],
    "P-MPG": [
      {
        badge: "000004",
        score: 85,
        reason: "Kinerja dan asesmen kuat",
        gap: "manajemen rantai pasok",
        change: "baru",
        indicators: { asesmen: 86, kinerja: 87, riwayat: 80, pendidikan: 86 },
      },
    ],
    "P-MQ": [],
    // Predicted vacancy whose lowongan HR has not opened: HR may still propose it closed.
    "P-SPM": [
      {
        badge: "000001",
        score: 78,
        reason: "Pemahaman proses produksi kuat",
        gap: "pengendalian mutu lanjutan",
        change: "baru",
        indicators: { asesmen: 80, kinerja: 82, riwayat: 76, pendidikan: 74 },
      },
      {
        badge: "000004",
        score: 74,
        reason: "Kinerja dan asesmen kuat",
        gap: "pengalaman proses produksi",
        change: "baru",
        indicators: { asesmen: 78, kinerja: 80, riwayat: 68, pendidikan: 72 },
      },
      {
        badge: "000002",
        score: 71,
        reason: "Asesmen dan pendidikan kuat",
        gap: "pengendalian mutu",
        change: "baru",
        indicators: { asesmen: 76, kinerja: 72, riwayat: 66, pendidikan: 70 },
      },
    ],
  };

  const mk = (
    id: string,
    vacancyId: string,
    title: string,
    submittedAt: string,
    stage: Stage,
    enteredAt: string,
    candidates: Candidate[],
    log: LogEntry[],
    notes: Note[] = [],
  ): Proposal => ({
    id,
    vacancyId,
    title,
    submittedAt,
    stage,
    enteredAt,
    candidates,
    log,
    notes,
    hrNote: "",
  });

  const proposals: Proposal[] = [
    mk(
      "U-2026-006",
      "P-MP",
      "Manajer Produksi",
      "2026-12-01",
      "vp",
      "2026-12-01",
      [
        { badge: "000001", source: "Diri sendiri" },
        { badge: "000002", source: "HR (Rekomendasi)" },
        { badge: "000004", source: "HR (Rekomendasi)" },
      ],
      [{ at: "2026-12-01T09:00", stage: "hr", action: "Usulan dikirim", note: "3 kandidat" }],
    ),
    mk(
      "U-2026-007",
      "P-MOPR",
      "Manajer Operasi",
      "2026-12-03",
      "vp",
      "2026-12-03",
      [
        { badge: "000002", source: "Diri sendiri" },
        { badge: "000004", source: "HR (Rekomendasi)" },
        { badge: "000006", source: "HR (Rekomendasi)" },
      ],
      [{ at: "2026-12-03T09:00", stage: "hr", action: "Usulan dikirim", note: "3 kandidat" }],
    ),
    mk(
      "U-2026-008",
      "P-MSDM",
      "Manajer SDM",
      "2026-12-04",
      "vp",
      "2026-12-04",
      [
        { badge: "000006", source: "Diri sendiri" },
        { badge: "000007", source: "HR (Rekomendasi)" },
        { badge: "000001", source: "HR (Rekomendasi)" },
      ],
      [{ at: "2026-12-04T09:00", stage: "hr", action: "Usulan dikirim", note: "3 kandidat" }],
    ),
    mk(
      "U-2026-004",
      "P-D",
      "Jabatan D",
      "2026-09-28",
      "draft",
      "2026-09-28",
      [{ badge: "000004", source: "HR (Daftar Talenta)" }],
      [],
    ),
    mk(
      "U-2026-005",
      "P-E",
      "Jabatan E",
      "2026-10-01",
      "draft",
      "2026-10-01",
      [{ badge: "000005", source: "HR (Daftar Talenta)" }],
      [],
    ),
    {
      ...mk(
        "U-2026-003",
        "P-MOP",
        "Manajer Operasi Produksi",
        "2026-11-20",
        "pihc",
        "2026-12-03",
        [
          { badge: "000002", source: "Diri sendiri" },
          { badge: "000004", source: "HR (Rekomendasi)" },
          { badge: "000006", source: "HR (Rekomendasi)" },
        ],
        [
          { at: "2026-11-20T09:00", stage: "hr", action: "Usulan dikirim", note: "3 kandidat" },
          { at: "2026-11-21T10:30", stage: "vp", action: "Disetujui", note: "Seluruh kandidat diteruskan" },
          { at: "2026-11-23T14:00", stage: "svp", action: "Disetujui", note: "Seluruh kandidat diteruskan" },
          { at: "2026-11-26T10:00", stage: "direksi1", action: "Disetujui", note: "Pilihan: Bhima Adiputra" },
          { at: "2026-11-28T11:15", stage: "direksi2", action: "Disetujui", note: "Calon pilihan: Bhima Adiputra" },
          { at: "2026-11-30T09:45", stage: "direksi3", action: "Disetujui", note: "Calon pilihan: Bhima Adiputra" },
          { at: "2026-12-03T10:00", stage: "dirut", action: "Calon ditetapkan", note: "Bhima Adiputra" },
        ],
        [
          { stage: "vp", badge: "000002", text: "Lanjutkan verifikasi. Perkuat kepemimpinan lintas unit." },
          { stage: "svp", badge: "000004", text: "Perlu pengalaman lintas fungsi sebagai pengembangan." },
          { stage: "direksi1", badge: "000002", text: "Direkomendasikan untuk promosi karena kompetensi teknis dan leadership sesuai kebutuhan jabatan." },
        ],
      ),
      selectedBadge: "000002",
      designatedBadge: "000002",
    },
    // U-2026-009 · SVP, due today (SLA boundary).
    mk(
      "U-2026-009",
      "P-MAN",
      "Manajer Anggaran",
      "2026-11-30",
      "svp",
      "2026-12-02",
      [
        { badge: "000012", source: "Atasan Langsung" },
        { badge: "000004", source: "HR (Rekomendasi)" },
        { badge: "000002", source: "HR (Daftar Talenta)" },
      ],
      [
        { at: "2026-11-30T09:00", stage: "hr", action: "Usulan dikirim", note: "3 kandidat" },
        { at: "2026-12-02T10:00", stage: "vp", action: "Disetujui", note: "Seluruh kandidat diteruskan" },
      ],
      [{ stage: "vp", badge: "000012", text: "Kinerja unggul; pertimbangkan penugasan lintas unit." }],
    ),
    // U-2026-010 · back at Direksi 1 after PIHC rejected the designated candidate.
    mk(
      "U-2026-010",
      "P-MPM",
      "Manajer Pemeliharaan",
      "2026-11-22",
      "direksi1",
      "2026-12-04",
      [
        { badge: "000002", source: "HR (Rekomendasi)" },
        { badge: "000013", source: "Atasan Langsung" },
        { badge: "000009", source: "HR (Daftar Talenta)" },
      ],
      [
        { at: "2026-11-22T09:00", stage: "hr", action: "Usulan dikirim", note: "3 kandidat" },
        { at: "2026-11-23T10:00", stage: "vp", action: "Disetujui", note: "Seluruh kandidat diteruskan" },
        { at: "2026-11-25T10:00", stage: "svp", action: "Disetujui", note: "Seluruh kandidat diteruskan" },
        { at: "2026-11-27T10:00", stage: "direksi1", action: "Disetujui", note: "Pilihan: Andi Saputra" },
        { at: "2026-11-29T10:00", stage: "direksi2", action: "Disetujui", note: "Calon pilihan: Andi Saputra" },
        { at: "2026-12-01T10:00", stage: "direksi3", action: "Disetujui", note: "Calon pilihan: Andi Saputra" },
        { at: "2026-12-02T10:00", stage: "dirut", action: "Calon ditetapkan", note: "Andi Saputra" },
        {
          at: "2026-12-04T13:00",
          stage: "pihc",
          action: "Ditolak",
          note: "Wawancara, kesehatan, dan LHKPN belum lengkap untuk calon yang ditetapkan.",
        },
      ],
      [{ stage: "vp", badge: "000013", text: "Dokumen persyaratan masih perlu dilengkapi." }],
    ),
    // U-2026-011 · Direksi 2, one day left, interview already scheduled.
    {
      ...mk(
        "U-2026-011",
        "P-MK3",
        "Manajer K3",
        "2026-11-25",
        "direksi2",
        "2026-12-03",
        [
          { badge: "000009", source: "Diri sendiri" },
          { badge: "000001", source: "HR (Rekomendasi)" },
          { badge: "000012", source: "HR (Daftar Talenta)" },
        ],
        [
          { at: "2026-11-25T09:00", stage: "hr", action: "Usulan dikirim", note: "3 kandidat" },
          { at: "2026-11-26T10:00", stage: "vp", action: "Disetujui", note: "Seluruh kandidat diteruskan" },
          { at: "2026-11-28T10:00", stage: "svp", action: "Disetujui", note: "Seluruh kandidat diteruskan" },
          { at: "2026-12-03T10:00", stage: "direksi1", action: "Disetujui", note: "Pilihan: Rizky Pratama" },
        ],
        [{ stage: "direksi1", badge: "000009", text: "Konsistensi KPI dan pengalaman lini produksi sesuai kebutuhan." }],
      ),
      selectedBadge: "000009",
    },
    // U-2026-012 · Direksi 3, overdue by 3 days.
    {
      ...mk(
        "U-2026-012",
        "P-MTI",
        "Manajer Teknologi Informasi",
        "2026-11-20",
        "direksi3",
        "2026-11-29",
        [
          { badge: "000004", source: "HR (Rekomendasi)" },
          { badge: "000006", source: "Diri sendiri" },
          { badge: "000012", source: "HR (Daftar Talenta)" },
        ],
        [
          { at: "2026-11-20T09:00", stage: "hr", action: "Usulan dikirim", note: "3 kandidat" },
          { at: "2026-11-22T10:00", stage: "vp", action: "Disetujui", note: "Seluruh kandidat diteruskan" },
          { at: "2026-11-24T10:00", stage: "svp", action: "Disetujui", note: "Seluruh kandidat diteruskan" },
          { at: "2026-11-27T10:00", stage: "direksi1", action: "Disetujui", note: "Pilihan: Lukman Hakim" },
          { at: "2026-11-29T10:00", stage: "direksi2", action: "Disetujui", note: "Calon pilihan: Lukman Hakim" },
        ],
      ),
      selectedBadge: "000004",
    },
    // U-2026-013 · Dirut designates.
    {
      ...mk(
        "U-2026-013",
        "P-MPJ",
        "Manajer Penjualan",
        "2026-11-24",
        "dirut",
        "2026-12-04",
        [
          { badge: "000012", source: "Atasan Langsung" },
          { badge: "000004", source: "HR (Rekomendasi)" },
          { badge: "000001", source: "HR (Daftar Talenta)" },
        ],
        [
          { at: "2026-11-24T09:00", stage: "hr", action: "Usulan dikirim", note: "3 kandidat" },
          { at: "2026-11-25T10:00", stage: "vp", action: "Disetujui", note: "Seluruh kandidat diteruskan" },
          { at: "2026-11-27T10:00", stage: "svp", action: "Disetujui", note: "Seluruh kandidat diteruskan" },
          { at: "2026-11-30T10:00", stage: "direksi1", action: "Disetujui", note: "Pilihan: Citra Lestari" },
          { at: "2026-12-02T10:00", stage: "direksi2", action: "Disetujui", note: "Calon pilihan: Citra Lestari" },
          { at: "2026-12-03T10:00", stage: "direksi3", action: "Disetujui", note: "Calon pilihan: Citra Lestari" },
        ],
      ),
      selectedBadge: "000012",
    },
    // U-2026-014 · PIHC, designated candidate has NO documents (approval must be blocked).
    {
      ...mk(
        "U-2026-014",
        "P-MGD",
        "Manajer Gudang",
        "2026-11-24",
        "pihc",
        "2026-12-04",
        [
          { badge: "000013", source: "Atasan Langsung" },
          { badge: "000009", source: "HR (Daftar Talenta)" },
          { badge: "000001", source: "HR (Daftar Talenta)" },
        ],
        [
          { at: "2026-11-24T09:00", stage: "hr", action: "Usulan dikirim", note: "3 kandidat" },
          { at: "2026-11-25T10:00", stage: "vp", action: "Disetujui", note: "Seluruh kandidat diteruskan" },
          { at: "2026-11-27T10:00", stage: "svp", action: "Disetujui", note: "Seluruh kandidat diteruskan" },
          { at: "2026-11-30T10:00", stage: "direksi1", action: "Disetujui", note: "Pilihan: Andi Saputra" },
          { at: "2026-12-02T10:00", stage: "direksi2", action: "Disetujui", note: "Calon pilihan: Andi Saputra" },
          { at: "2026-12-03T10:00", stage: "direksi3", action: "Disetujui", note: "Calon pilihan: Andi Saputra" },
          { at: "2026-12-04T09:00", stage: "dirut", action: "Calon ditetapkan", note: "Andi Saputra" },
        ],
      ),
      selectedBadge: "000013",
      designatedBadge: "000013",
    },
    // U-2026-015 · Completed (PIHC final approval).
    {
      ...mk(
        "U-2026-015",
        "P-MAK",
        "Manajer Akuntansi",
        "2026-11-05",
        "selesai",
        "2026-11-18",
        [
          { badge: "000012", source: "Diri sendiri" },
          { badge: "000004", source: "HR (Rekomendasi)" },
          { badge: "000006", source: "HR (Rekomendasi)" },
        ],
        [
          { at: "2026-11-05T09:00", stage: "hr", action: "Usulan dikirim", note: "3 kandidat" },
          { at: "2026-11-07T10:00", stage: "vp", action: "Disetujui", note: "Seluruh kandidat diteruskan" },
          { at: "2026-11-10T10:00", stage: "svp", action: "Disetujui", note: "Seluruh kandidat diteruskan" },
          { at: "2026-11-12T10:00", stage: "direksi1", action: "Disetujui", note: "Pilihan: Citra Lestari" },
          { at: "2026-11-14T10:00", stage: "direksi2", action: "Disetujui", note: "Calon pilihan: Citra Lestari" },
          { at: "2026-11-16T10:00", stage: "direksi3", action: "Disetujui", note: "Calon pilihan: Citra Lestari" },
          { at: "2026-11-17T10:00", stage: "dirut", action: "Calon ditetapkan", note: "Citra Lestari" },
          { at: "2026-11-18T13:00", stage: "pihc", action: "Persetujuan akhir", note: "Citra Lestari" },
        ],
        [{ stage: "direksi1", badge: "000012", text: "Kinerja unggul dan dokumen persyaratan lengkap." }],
      ),
      selectedBadge: "000012",
      designatedBadge: "000012",
    },
  ];

  const nominations: Nomination[] = [
    {
      id: "N-001",
      badge: "000001",
      vacancyId: "P-MP",
      source: "Diri sendiri",
      justification:
        "Saya mengajukan pencalonan karena pengalaman produksi lintas lini dan capaian KPI yang konsisten mendukung kesiapan saya memimpin tim produksi.",
      by: "000001",
      at: "2026-11-20",
    },
    {
      id: "N-002",
      badge: "000002",
      vacancyId: "P-MOPR",
      source: "Diri sendiri",
      justification:
        "Saya mengajukan pencalonan karena pengalaman operasional dan pendidikan yang relevan mendukung kesiapan saya memimpin operasi.",
      by: "000002",
      at: "2026-11-25",
    },
    {
      id: "N-003",
      badge: "000006",
      vacancyId: "P-MSDM",
      source: "Diri sendiri",
      justification:
        "Saya mengajukan pencalonan karena pengelolaan data SDM dan kinerja yang konsisten mendukung kebutuhan Manajer SDM.",
      by: "000006",
      at: "2026-11-26",
    },
    {
      id: "N-004",
      badge: "000009",
      vacancyId: "P-MSP",
      source: "Diri sendiri",
      justification:
        "Saya mengajukan pencalonan karena pengalaman produksi lintas lini dan capaian KPI yang konsisten mendukung kesiapan saya merencanakan produksi.",
      by: "000009",
      at: "2026-12-02",
    },
    // Self-nomination accepted by the Atasan Langsung (not yet proposed).
    {
      id: "N-005",
      badge: "000012",
      vacancyId: "P-MK",
      source: "Diri sendiri",
      justification:
        "Saya mengajukan pencalonan karena kinerja dua tahun berturut-turut dan pengalaman keuangan mendukung kesiapan saya memimpin fungsi keuangan.",
      by: "000012",
      at: "2026-11-28",
      response: "Diterima",
      responseNote: "Layak diproses HR.",
    },
    // Self-nomination rejected by the Atasan Langsung.
    {
      id: "N-006",
      badge: "000013",
      vacancyId: "P-MPG",
      source: "Diri sendiri",
      justification:
        "Saya mengajukan pencalonan karena pengalaman pengadaan dan koordinasi pemasok mendukung kebutuhan Manajer Pengadaan.",
      by: "000013",
      at: "2026-11-29",
      response: "Ditolak",
      responseNote: "Dokumen persyaratan belum lengkap; fokus penyelesaian dahulu.",
    },
    // Nominated by the Atasan Langsung (no self-nomination step).
    {
      id: "N-007",
      badge: "000012",
      vacancyId: "P-MPG",
      source: "Atasan Langsung",
      justification:
        "Saya mencalonkan Citra Lestari karena kinerja unggul dan pengalaman lintas fungsi mendukung kebutuhan Manajer Pengadaan.",
      by: "000008",
      at: "2026-11-27",
    },
  ];

  const notifs: Notif[] = [
    { id: "n1", role: "vp", kind: "Pengingat persetujuan", title: "U-2026-006 · Manajer Produksi", body: "Batas keputusan VP terlewati 1 hari.", at: "2026-12-04T06:00", proposalId: "U-2026-006", read: false },
    { id: "n2", role: "vp", kind: "Usulan baru", title: "U-2026-007 · Manajer Operasi", body: "Menunggu persetujuan VP SDM.", at: "2026-12-03T09:00", proposalId: "U-2026-007", read: false },
    { id: "n3", role: "vp", kind: "Usulan baru", title: "U-2026-008 · Manajer SDM", body: "Menunggu persetujuan VP SDM.", at: "2026-12-04T09:00", proposalId: "U-2026-008", read: false },
    { id: "n3b", role: "pihc", kind: "Usulan baru", title: "U-2026-003 · Manajer Operasi Produksi", body: "Calon ditetapkan: Bhima Adiputra. Menunggu persetujuan akhir PIHC.", at: "2026-12-03T10:00", proposalId: "U-2026-003", read: false },
    { id: "n4", role: "hr", kind: "Eskalasi SLA", title: "U-2026-006 · Manajer Produksi", body: "Persetujuan VP SDM melewati batas waktu 1 hari.", at: "2026-12-04T06:00", proposalId: "U-2026-006", read: false },
    { id: "n5", role: "hr", kind: "Pembaruan data", title: "Sinkronisasi PI Smart gagal", body: "Sistem menggunakan data terakhir yang tersimpan (31/10/2026).", at: "2026-11-01T01:00", read: false },
    { id: "n6", role: "hr", kind: "Usulan baru", title: "Pencalonan diri baru", body: "Budi Budiman mencalonkan diri untuk Manajer Produksi.", at: "2026-11-20T10:00", read: false },
    { id: "n7", role: "karyawan", kind: "Status pencalonan", title: "U-2026-006 · Manajer Produksi", body: "Pencalonan Anda menunggu persetujuan VP SDM.", at: "2026-12-01T09:00", proposalId: "U-2026-006", read: false },
    { id: "n8", role: "karyawan", kind: "Dokumen", title: "Syarat promosi", body: "Wawancara, kesehatan, dan LHKPN masih menunggu.", at: "2026-11-25T08:00", read: false },
    { id: "n9", role: "karyawan", kind: "Asesmen", title: "Asesmen valid", body: "Asesmen diperbarui 31 Oktober 2026.", at: "2026-10-31T08:00", read: false },
    { id: "n10", role: "atasan", kind: "Status pencalonan", title: "Budi Budiman · Manajer Produksi", body: "Pencalonan bawahan menunggu persetujuan VP SDM.", at: "2026-12-01T09:00", proposalId: "U-2026-006", read: false },
    { id: "n11", role: "atasan", kind: "Kecocokan", title: "Kecocokan bawahan", body: "2 bawahan belum dapat ditentukan kategorinya.", at: "2026-11-25T08:00", read: false },
    { id: "n12", role: "atasan", kind: "Data", title: "Diandra Pertiwi", body: "Nilai akhir kinerja belum tersedia.", at: "2026-11-25T08:00", read: false },
    { id: "n13", role: "svp", kind: "Usulan baru", title: "U-2026-009 · Manajer Anggaran", body: "Menunggu keputusan SVP SDM. Jatuh tempo hari ini.", at: "2026-12-02T10:00", proposalId: "U-2026-009", read: false },
    { id: "n14", role: "direksi1", kind: "Usulan dikembalikan", title: "U-2026-010 · Manajer Pemeliharaan", body: "PIHC menolak calon Andi Saputra: dokumen persyaratan belum lengkap.", at: "2026-12-04T13:00", proposalId: "U-2026-010", read: false },
    { id: "n15", role: "direksi2", kind: "Usulan baru", title: "U-2026-011 · Manajer K3", body: "Menunggu keputusan Direksi 2.", at: "2026-12-03T10:00", proposalId: "U-2026-011", read: false },
    { id: "n16", role: "direksi3", kind: "Pengingat persetujuan", title: "U-2026-012 · Manajer Teknologi Informasi", body: "Batas keputusan Direksi 3 terlewati 3 hari.", at: "2026-12-04T06:00", proposalId: "U-2026-012", read: false },
    { id: "n17", role: "dirut", kind: "Usulan baru", title: "U-2026-013 · Manajer Penjualan", body: "Menunggu penetapan calon Direktur Utama.", at: "2026-12-03T10:00", proposalId: "U-2026-013", read: false },
    { id: "n18", role: "pihc", kind: "Usulan baru", title: "U-2026-014 · Manajer Gudang", body: "Calon ditetapkan: Andi Saputra. Kelengkapan persyaratan belum terpenuhi.", at: "2026-12-04T09:00", proposalId: "U-2026-014", read: false },
    { id: "n19", role: "hr", kind: "Usulan dikembalikan", title: "U-2026-010 · Manajer Pemeliharaan", body: "PIHC menolak calon; usulan kembali ke Direksi 1.", at: "2026-12-04T13:00", proposalId: "U-2026-010", read: false },
    { id: "n20", role: "hr", kind: "Persetujuan akhir", title: "U-2026-015 · Manajer Akuntansi", body: "PIHC menyetujui Citra Lestari.", at: "2026-11-18T13:00", proposalId: "U-2026-015", read: true },
    { id: "n21", role: "hr", kind: "Permintaan wawancara", title: "U-2026-011 · Manajer K3", body: "Direksi 2 meminta penjadwalan wawancara kandidat.", at: "2026-12-03T11:00", proposalId: "U-2026-011", read: false },
    { id: "n22", role: "karyawan", kind: "Wawancara", title: "U-2026-011 · Manajer K3", body: "Undangan wawancara 2026-12-08 telah dikirim.", at: "2026-12-03T14:00", proposalId: "U-2026-011", read: false },
  ];

  return {
    users,
    employees,
    positions,
    matches,
    recommendations,
    proposals,
    nominations,
    interviews: [
      {
        proposalId: "U-2026-011",
        date: "2026-12-08",
        method: "Tatap muka",
        interviewers: "Direksi 2, VP SDM",
        location: "Ruang Rapat Direksi Lt. 5",
        slots: [
          { badge: "000009", start: "09:00", end: "09:45" },
          { badge: "000001", start: "10:00", end: "10:45" },
          { badge: "000012", start: "11:00", end: "11:45" },
        ],
        sentAt: "2026-12-03T14:00",
      },
    ],
    notifs,
    piSmartSync: { at: "2026-10-31T01:00", failed: true },
  };
}

const g = globalThis as unknown as { __auraStore?: Store };

/** Mutable in-memory store; survives hot reloads in dev. */
export function db(): Store {
  g.__auraStore ??= createSeed();
  return g.__auraStore;
}

export function resetDb() {
  g.__auraStore = createSeed();
}
