"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  GROUP_HOME,
  ROLE_LABEL,
  STAGE_LABEL,
  TODAY,
  APPROVAL_STAGES,
  db,
  roleGroup,
  type Grade,
  type HealthStatus,
  type Proposal,
  type RoleKey,
  type Stage,
} from "./db";
import {
  MAX_CANDIDATES,
  MAX_FILE_BYTES,
  MIN_CANDIDATES,
  MIN_JUSTIFICATION,
  type FormState,
  type ImportRow,
  type ImportState,
} from "./form";
import {
  activeNomination,
  documentsComplete,
  getEmployee,
  getPosition,
  getProposal,
  isCategoryDeterminable,
  nominationBlock,
  proposalForVacancy,
  pushNotif,
} from "./queries";
import { assertRole, clearSession, readSession, writeSession } from "./session";

function refresh() {
  revalidatePath("/", "layout");
}

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

/* ------------------------------ Auth ------------------------------ */

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const username = str(fd, "username").toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!username || !password) return { error: "Nama pengguna dan kata sandi wajib diisi." };
  const user = db().users.find((u) => u.username === username && u.password === password);
  if (!user) return { error: "Nama pengguna atau kata sandi tidak sesuai." };
  // A single granted role is selected automatically; otherwise ask.
  if (user.roles.length === 1) {
    await writeSession({ userId: user.id, role: user.roles[0] });
    redirect(GROUP_HOME[roleGroup(user.roles[0])]);
  }
  await writeSession({ userId: user.id });
  redirect("/peran");
}

export async function logout() {
  await clearSession();
  redirect("/login");
}

export async function chooseRole(fd: FormData) {
  const session = await readSession();
  if (!session) redirect("/login");
  const role = str(fd, "role") as RoleKey;
  if (!session.user.roles.includes(role)) redirect("/peran");
  await writeSession({ userId: session.user.id, role });
  redirect(GROUP_HOME[roleGroup(role)]);
}

/* ------------------------- HR · repository ------------------------- */

function checkPdf(file: FormDataEntryValue | null): string | undefined {
  if (!(file instanceof File) || file.size === 0) return "Pilih dokumen terlebih dahulu.";
  if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf")
    return "Format dokumen harus PDF.";
  if (file.size > MAX_FILE_BYTES) return "Ukuran dokumen maksimal 10 MB.";
  return undefined;
}

export async function saveFinalGrade(_: FormState, fd: FormData): Promise<FormState> {
  await assertRole("hr");
  const e = getEmployee(str(fd, "badge"));
  const year = Number(str(fd, "year"));
  const grade = str(fd, "grade").toUpperCase() as Grade;
  if (!e) return { error: "Karyawan tidak ditemukan." };
  if (!["A", "B", "C", "D"].includes(grade)) return { error: "Nilai harus A, B, C, atau D." };
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return { error: "Tahun tidak valid." };
  e.grades[year] = grade;
  if (!e.kpi[year]) e.kpi[year] = "Tercapai";
  refresh();
  return { ok: `Nilai akhir ${year} tersimpan.` };
}

export async function saveHealth(_: FormState, fd: FormData): Promise<FormState> {
  await assertRole("hr");
  const e = getEmployee(str(fd, "badge"));
  const status = str(fd, "status") as HealthStatus;
  if (!e) return { error: "Karyawan tidak ditemukan." };
  if (status !== "Direkomendasikan" && status !== "Tidak Direkomendasikan")
    return { error: "Pilih salah satu status rekomendasi." };
  // NFR-SC-06: only the recommendation status is stored, never medical data.
  e.health = status;
  refresh();
  return { ok: "Status rekomendasi kesehatan tersimpan." };
}

export async function uploadAssessmentReport(_: FormState, fd: FormData): Promise<FormState> {
  await assertRole("hr");
  const e = getEmployee(str(fd, "badge"));
  const assessor = str(fd, "assessor");
  const date = str(fd, "date");
  if (!e) return { error: "Karyawan tidak ditemukan." };
  if (!assessor) return { error: "Nama asesor / psikolog wajib diisi." };
  if (!date) return { error: "Tanggal asesmen wajib diisi." };
  const bad = checkPdf(fd.get("file"));
  if (bad) return { error: bad };
  e.assessment = {
    result: e.assessment?.result ?? "Direkomendasikan",
    validUntil: e.assessment?.validUntil ?? TODAY,
    reportUploaded: true,
    assessor,
    date,
  };
  refresh();
  return { ok: "Laporan asesmen terunggah." };
}

export async function uploadInterviewResult(_: FormState, fd: FormData): Promise<FormState> {
  await assertRole("hr");
  const e = getEmployee(str(fd, "badge"));
  if (!e) return { error: "Karyawan tidak ditemukan." };
  const bad = checkPdf(fd.get("file"));
  if (bad) return { error: bad };
  const file = fd.get("file") as File;
  e.interview = { status: "Memenuhi", file: file.name };
  // A proposal held for an interview returns to Direktur Utama once every candidate's result is on file.
  for (const p of db().proposals) {
    if (!p.held || !p.candidates.some((c) => c.badge === e.badge)) continue;
    if (p.candidates.every((c) => getEmployee(c.badge)?.interview.status === "Memenuhi")) {
      p.held = false;
      pushNotif({
        role: "dirut",
        kind: "Usulan kembali",
        title: `${p.id} · ${p.title}`,
        body: "Hasil wawancara sudah lengkap. Usulan kembali ke antrean Direktur Utama.",
        at: `${TODAY}T14:00`,
        proposalId: p.id,
      });
    }
  }
  refresh();
  return { ok: "Hasil wawancara terunggah." };
}

export async function uploadLhkpn(_: FormState, fd: FormData): Promise<FormState> {
  await assertRole("hr");
  const e = getEmployee(str(fd, "badge"));
  if (!e) return { error: "Karyawan tidak ditemukan." };
  const bad = checkPdf(fd.get("file"));
  if (bad) return { error: bad };
  const file = fd.get("file") as File;
  e.lhkpn = { uploaded: true, file: file.name };
  refresh();
  return { ok: "Bukti LHKPN terunggah." };
}

/* ------------------------ HR · bulk final grades ------------------------ */

function parseImport(text: string): ImportState {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { error: "Dokumen kosong atau tidak memiliki baris data." };
  const delimiter = lines[0].includes(";") ? ";" : ",";
  const header = lines[0].split(delimiter).map((h) => h.trim().toLowerCase());
  const need = ["badge", "tahun", "periode", "capaian kpi", "nilai akhir"];
  const idx = need.map((n) => header.indexOf(n));
  if (idx.some((i) => i < 0))
    return { error: "Kolom wajib: Badge, Tahun, Periode, Capaian KPI, Nilai akhir." };

  const seen = new Set<string>();
  const rows: ImportRow[] = lines.slice(1).map((raw, i) => {
    const cells = raw.split(delimiter).map((c) => c.trim());
    const [badge, year, period, kpi, grade] = idx.map((c) => cells[c] ?? "");
    const row: ImportRow = { line: i + 2, badge, year, period, kpi, grade: grade.toUpperCase() };
    const e = getEmployee(badge);
    row.name = e?.name;
    const key = `${badge}|${year}|${period}`;
    if (!e || e.system) row.error = "Badge tidak ditemukan";
    else if (!/^\d{4}$/.test(year)) row.error = "Tahun tidak valid";
    else if (!period) row.error = "Periode kosong";
    else if (!["Tercapai", "Belum tercapai"].includes(kpi)) row.error = "Capaian KPI tidak valid";
    else if (!["A", "B", "C", "D"].includes(row.grade)) row.error = "Nilai akhir harus A/B/C/D";
    else if (seen.has(key)) row.error = "Duplikasi baris";
    seen.add(key);
    return row;
  });
  return { rows };
}

export async function validateImport(_: ImportState, fd: FormData): Promise<ImportState> {
  await assertRole("hr");
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Pilih dokumen KPI terlebih dahulu." };
  if (file.size > MAX_FILE_BYTES) return { error: "Ukuran dokumen maksimal 10 MB." };
  if (!file.name.toLowerCase().endsWith(".csv"))
    return { error: "Pada versi demo, hanya format CSV yang dapat divalidasi. Unduh template CSV." };
  return parseImport(await file.text());
}

export async function confirmImport(_: ImportState, fd: FormData): Promise<ImportState> {
  await assertRole("hr");
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Pilih dokumen KPI terlebih dahulu." };
  const parsed = parseImport(await file.text());
  if (parsed.error || !parsed.rows) return parsed;
  const valid = parsed.rows.filter((r) => !r.error);
  // Invalid data is never stored.
  for (const r of valid) {
    const e = getEmployee(r.badge)!;
    e.grades[Number(r.year)] = r.grade as Grade;
    e.kpi[Number(r.year)] = r.kpi as "Tercapai" | "Belum tercapai";
  }
  db().lastImport = { at: `${TODAY}T10:00`, rows: valid.length };
  refresh();
  return {
    rows: parsed.rows,
    ok: `${valid.length} baris berhasil diimpor dan dicatat dalam audit trail. ${parsed.rows.length - valid.length} baris dilewati.`,
  };
}

/* ----------------------------- Nominations ----------------------------- */

export async function submitNomination(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await assertRole("karyawan", "atasan");
  const vacancyId = str(fd, "vacancyId");
  const justification = str(fd, "justification");
  const self = ctx.role === "karyawan";
  const badge = self ? ctx.user.badge : str(fd, "badge");
  if (!badge) return { error: "Kandidat tidak ditemukan." };
  if (!self) {
    const target = getEmployee(badge);
    if (!target || target.supervisor !== ctx.user.badge)
      return { error: "Anda hanya dapat mencalonkan bawahan langsung." };
  }
  if (justification.length < MIN_JUSTIFICATION)
    return { error: `Justifikasi minimal ${MIN_JUSTIFICATION} karakter.` };
  const block = nominationBlock(badge, vacancyId);
  if (block) return { error: block };

  const position = getPosition(vacancyId)!;
  db().nominations.push({
    id: `N-${String(db().nominations.length + 1).padStart(3, "0")}`,
    badge,
    vacancyId,
    source: self ? "Diri sendiri" : "Atasan Langsung",
    justification,
    by: ctx.user.badge ?? ctx.user.id,
    at: TODAY,
  });
  pushNotif({
    role: "hr",
    kind: "Pencalonan baru",
    title: `${getEmployee(badge)!.name} · ${position.title}`,
    body: `Dicalonkan oleh ${self ? "diri sendiri" : "atasan langsung"}.`,
    at: `${TODAY}T10:00`,
  });
  refresh();
  redirect(self ? "/karyawan/status?dikirim=1" : "/atasan/status?dikirim=1");
}

/** Atasan Langsung accepts or rejects a direct report's self-nomination. No notification is sent. */
export async function respondNomination(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await assertRole("atasan");
  const nom = db().nominations.find((n) => n.id === str(fd, "id"));
  if (!nom || nom.source !== "Diri sendiri") return { error: "Pencalonan tidak ditemukan." };
  const owner = getEmployee(nom.badge);
  if (!owner || owner.supervisor !== ctx.user.badge)
    return { error: "Anda hanya dapat menanggapi pencalonan bawahan langsung." };
  const decision = str(fd, "decision");
  if (decision !== "Diterima" && decision !== "Ditolak") return { error: "Pilih Terima atau Tolak." };
  if (decision === "Ditolak" && !str(fd, "note")) return { error: "Alasan penolakan wajib diisi." };
  const sent = proposalForVacancy(nom.vacancyId);
  if (sent && sent.stage !== "draft") return { error: `Usulan ${sent.id} sudah dikirim.` };
  nom.response = decision;
  nom.responseNote = str(fd, "note") || undefined;
  refresh();
  return {
    ok:
      decision === "Diterima"
        ? `Pencalonan ${owner.name} diterima.`
        : `Pencalonan ${owner.name} ditolak. HR masih dapat mengajukan karyawan ini dari rekomendasi.`,
  };
}

/* ---------------------------- HR proposal ---------------------------- */

function nextProposalId() {
  const max = db().proposals.reduce((m, p) => Math.max(m, Number(p.id.split("-")[2])), 0);
  return `U-2026-${String(max + 1).padStart(3, "0")}`;
}

export async function submitProposal(_: FormState, fd: FormData): Promise<FormState> {
  await assertRole("hr");
  const vacancyId = str(fd, "vacancyId");
  const mode = str(fd, "mode") === "save" ? "save" : "send";
  const note = str(fd, "note");
  const badges = [...new Set(fd.getAll("badge").map(String))];
  const position = getPosition(vacancyId);
  if (!position) return { error: "Jabatan tujuan tidak ditemukan." };
  const existing = proposalForVacancy(vacancyId);
  if (existing && existing.stage !== "draft")
    return { error: `Usulan ${existing.id} sudah dikirim untuk jabatan ini.` };

  for (const b of badges) {
    const e = getEmployee(b);
    if (!e || !isCategoryDeterminable(e)) return { error: "Kandidat belum memenuhi syarat wajib." };
  }
  if (mode === "send") {
    if (badges.length < MIN_CANDIDATES || badges.length > MAX_CANDIDATES)
      return {
        error: `Pengajuan gagal: jumlah kandidat harus ${MIN_CANDIDATES}–${MAX_CANDIDATES} (saat ini ${badges.length}).`,
      };
    if (note.length < MIN_JUSTIFICATION)
      return { error: `Keterangan minimal ${MIN_JUSTIFICATION} karakter.` };
  }

  const candidates = badges.map((badge) => {
    const nom = activeNomination(badge, vacancyId);
    const recommended = db().recommendations[vacancyId]?.some((r) => r.badge === badge);
    return {
      badge,
      source: nom?.source ?? (recommended ? ("HR (Rekomendasi)" as const) : ("HR (Daftar Talenta)" as const)),
    };
  });

  const proposal =
    existing ??
    (() => {
      const created: Proposal = {
        id: nextProposalId(),
        vacancyId,
        title: position.title,
        submittedAt: TODAY,
        stage: "draft",
        enteredAt: TODAY,
        candidates: [],
        log: [],
        notes: [],
        hrNote: "",
      };
      db().proposals.push(created);
      return created;
    })();

  proposal.candidates = candidates;
  proposal.hrNote = note;

  if (mode === "save") {
    refresh();
    return { ok: `Draf usulan ${proposal.id} tersimpan.` };
  }

  proposal.stage = "vp";
  proposal.submittedAt = TODAY;
  proposal.enteredAt = TODAY;
  proposal.log.push({
    at: `${TODAY}T09:00`,
    stage: "hr",
    action: "Usulan dikirim",
    note: `${candidates.length} kandidat`,
  });
  position.open = false;
  pushNotif({
    role: "vp",
    kind: "Usulan baru",
    title: `${proposal.id} · ${proposal.title}`,
    body: "Menunggu persetujuan VP SDM.",
    at: `${TODAY}T09:00`,
    proposalId: proposal.id,
  });
  refresh();
  redirect(`/hr/persetujuan/${proposal.id}`);
}

export async function scheduleInterview(_: FormState, fd: FormData): Promise<FormState> {
  await assertRole("hr");
  const p = getProposal(str(fd, "proposalId"));
  if (!p) return { error: "Usulan tidak ditemukan." };
  const date = str(fd, "date");
  const method = str(fd, "method");
  const interviewers = str(fd, "interviewers");
  const location = str(fd, "location");
  if (!date || !method || !interviewers || !location)
    return { error: "Tanggal, metode, pewawancara, dan lokasi wajib diisi." };
  const slots = p.candidates.map((c) => ({
    badge: c.badge,
    start: str(fd, `start-${c.badge}`),
    end: str(fd, `end-${c.badge}`),
  }));
  if (slots.some((s) => !s.start || !s.end || s.end <= s.start))
    return { error: "Waktu selesai harus setelah waktu mulai untuk setiap kandidat." };
  const sorted = [...slots].sort((a, b) => a.start.localeCompare(b.start));
  for (let i = 1; i < sorted.length; i++)
    if (sorted[i].start < sorted[i - 1].end) return { error: "Jadwal antar kandidat tidak boleh bertabrakan." };

  const store = db();
  store.interviews = store.interviews.filter((i) => i.proposalId !== p.id);
  store.interviews.push({
    proposalId: p.id,
    date,
    method,
    interviewers,
    location,
    slots,
    sentAt: `${TODAY}T10:00`,
  });
  pushNotif({
    role: "karyawan",
    kind: "Wawancara",
    title: `${p.id} · ${p.title}`,
    body: `Undangan wawancara ${date} telah dikirim.`,
    at: `${TODAY}T10:00`,
    proposalId: p.id,
  });
  refresh();
  return { ok: "Jadwal tersimpan dan undangan terkirim kepada kandidat dan pewawancara." };
}

export async function sendReminder(fd: FormData) {
  await assertRole("hr");
  const p = getProposal(str(fd, "proposalId"));
  if (!p || !APPROVAL_STAGES.includes(p.stage)) return;
  pushNotif({
    role: p.stage as RoleKey,
    kind: "Pengingat persetujuan",
    title: `${p.id} · ${p.title}`,
    body: `HR mengingatkan keputusan ${STAGE_LABEL[p.stage]}.`,
    at: `${TODAY}T11:00`,
    proposalId: p.id,
  });
  refresh();
}

/* ------------------------------ Approvals ------------------------------ */

function advance(p: ReturnType<typeof getProposal> & object, action: string, note?: string) {
  const idx = APPROVAL_STAGES.indexOf(p.stage);
  p.log.push({ at: `${TODAY}T12:00`, stage: p.stage, action, note });
  const next = APPROVAL_STAGES[idx + 1];
  if (!next) {
    p.stage = "selesai";
    return;
  }
  p.stage = next;
  p.enteredAt = TODAY;
  pushNotif({
    role: next as RoleKey,
    kind: "Usulan baru",
    title: `${p.id} · ${p.title}`,
    body: `Menunggu keputusan ${STAGE_LABEL[next]}.`,
    at: `${TODAY}T12:00`,
    proposalId: p.id,
  });
}

function loadForApprover(fd: FormData, role: RoleKey) {
  const p = getProposal(str(fd, "proposalId"));
  if (!p) return { error: "Usulan tidak ditemukan." as const };
  if (p.stage !== (role as Stage)) return { error: "Usulan tidak berada pada tahap Anda." as const };
  return { p };
}

function saveNotes(p: NonNullable<ReturnType<typeof getProposal>>, stage: Stage, fd: FormData) {
  p.notes = p.notes.filter((n) => n.stage !== stage);
  for (const c of p.candidates) {
    const text = str(fd, `note-${c.badge}`);
    if (text) p.notes.push({ stage, badge: c.badge, text });
  }
}

/** VP SDM, SVP SDM, and Direksi 1–3 forward the full list of candidates with their notes. */
export async function approveForward(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await assertRole("vp", "svp", "direksi1", "direksi2", "direksi3");
  const r = loadForApprover(fd, ctx.role);
  if ("error" in r) return { error: r.error };
  saveNotes(r.p, r.p.stage, fd);
  advance(r.p, "Disetujui", "Seluruh kandidat diteruskan");
  refresh();
  redirect("/approver/antrean?disetujui=1");
}

/** Direktur Utama compares the candidates and chooses exactly one; the proposal stays at Dirut for designation. */
export async function selectCandidate(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await assertRole("dirut");
  const r = loadForApprover(fd, ctx.role);
  if ("error" in r) return { error: r.error };
  if (r.p.held) return { error: "Usulan ditahan menunggu hasil wawancara." };
  const badge = str(fd, "badge");
  if (!r.p.candidates.some((c) => c.badge === badge)) return { error: "Pilih satu kandidat terlebih dahulu." };
  const text = str(fd, "note");
  r.p.notes = r.p.notes.filter((n) => n.stage !== "dirut");
  if (text) r.p.notes.push({ stage: "dirut", badge, text });
  r.p.selectedBadge = badge;
  refresh();
  redirect(`/approver/usulan/${r.p.id}`);
}

export async function designateCandidate(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await assertRole("dirut");
  const r = loadForApprover(fd, ctx.role);
  if ("error" in r) return { error: r.error };
  if (r.p.held) return { error: "Usulan ditahan menunggu hasil wawancara." };
  if (!r.p.selectedBadge) return { error: "Pilih satu kandidat terlebih dahulu." };
  r.p.designatedBadge = r.p.selectedBadge;
  advance(r.p, "Calon ditetapkan", getEmployee(r.p.selectedBadge)?.name);
  refresh();
  redirect("/approver/antrean?disetujui=1");
}

/** PIHC checks the PI-SDM-PD-013 requirements of the designated candidate, then approves or rejects. */
export async function finalApprove(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await assertRole("pihc");
  const r = loadForApprover(fd, ctx.role);
  if ("error" in r) return { error: r.error };
  const e = getEmployee(r.p.designatedBadge);
  if (!e) return { error: "Calon belum ditetapkan." };

  if (str(fd, "decision") === "reject") {
    const reason = str(fd, "reason");
    if (!reason) return { error: "Alasan penolakan wajib diisi." };
    r.p.log.push({ at: `${TODAY}T13:00`, stage: "pihc", action: "Ditolak", note: reason });
    // Final status "Ditolak PIHC"; only HR and Approvers see the result.
    r.p.stage = "ditolak";
    r.p.enteredAt = TODAY;
    pushNotif({
      role: "hr",
      kind: "Usulan ditolak PIHC",
      title: `${r.p.id} · ${r.p.title}`,
      body: `PIHC menolak calon ${e.name}: ${reason}`,
      at: `${TODAY}T13:00`,
      proposalId: r.p.id,
    });
    refresh();
    redirect("/approver/riwayat");
  }

  if (!documentsComplete(e))
    return { error: "Wawancara, kesehatan, dan LHKPN harus lengkap sebelum persetujuan akhir." };
  advance(r.p, "Persetujuan akhir", e.name);
  // The final result is visible to HR and Approvers only; SK and inauguration happen outside the system.
  pushNotif({
    role: "hr",
    kind: "Persetujuan akhir",
    title: `${r.p.id} · ${r.p.title}`,
    body: `PIHC menyetujui ${e.name}.`,
    at: `${TODAY}T13:00`,
    proposalId: r.p.id,
  });
  refresh();
  redirect("/approver/riwayat");
}

export async function requestInterview(fd: FormData) {
  const ctx = await assertRole("dirut");
  const p = getProposal(str(fd, "proposalId"));
  if (!p || p.stage !== "dirut") return;
  p.held = true;
  pushNotif({
    role: "hr",
    kind: "Permintaan wawancara",
    title: `${p.id} · ${p.title}`,
    body: `${ROLE_LABEL[ctx.role]} meminta penjadwalan wawancara kandidat. Usulan ditahan.`,
    at: `${TODAY}T11:00`,
    proposalId: p.id,
  });
  refresh();
}

export async function markAllRead() {
  const session = await readSession();
  if (!session?.role) return;
  for (const n of db().notifs) if (n.role === session.role) n.read = true;
  refresh();
}
