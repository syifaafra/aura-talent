# AURA Talent

**Sistem Prediksi Kesiapan dan Suksesi Talenta** for PT Pupuk Sriwidjaja Palembang, implemented from the
Figma design file. It covers the promotion pipeline end to end: employee readiness and requirements, HR
recommendation and nomination, tiered approval (VP → SVP → Direksi 1/2/3 → Direktur Utama → PIHC), interview
scheduling, and notifications.

The UI is in Indonesian. The backend is **in-memory only** (no database), so all data resets when the server
restarts.

## Stack

- Next.js 16 (App Router, Turbopack) with **Cache Components** and partial prefetching enabled
- React 19, TypeScript, Tailwind CSS 4
- Server Components + Server Actions; no external services

> This Next.js version differs from older releases. Before changing framework-level code, read the relevant guide
> in `node_modules/next/dist/docs/` (see `AGENTS.md`).

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

```bash
npm run build      # production build (also catches Cache Components violations)
npm start          # serve the production build
npm run lint
npx tsc --noEmit   # type-check
```

## Demo accounts

All accounts use the password **`password`**. They are also listed under "Akun demo" on the login page.

Accounts are grouped by role. **Scenario / stage** says where that user sits in the seed data and what is worth testing.
Proposal stages follow `draft → VP SDM → SVP SDM → Direksi 1 → Direksi 2 → Direksi 3 → Direktur Utama → PIHC → Selesai`
(or `Ditolak PIHC`); the full proposal list is under [Seed data scenarios](#seed-data-scenarios).

#### Karyawan

| Username | Name | Roles | Scenario / stage |
| --- | --- | --- | --- |
| `budi` | Budi Budiman | Karyawan | **Self-nominated** for Manajer Produksi (N-001), now in **U-2026-006 at VP SDM** (overdue 1 day). Also a candidate in U-2026-008 (VP SDM), -011 (Dirut, *Ditahan*), -013 (Dirut), -014 (PIHC), -017 (Direksi 2). Interview, health, and LHKPN all pending. Good for dashboard, KPI, assessment, requirements, and nomination status |
| `bhima` | Bhima Adiputra | Karyawan | Candidate in **U-2026-003 at PIHC** (designated, documents complete, ready for final approval), -007 (VP SDM), -009 (SVP SDM), -016 (Direksi 1), and the rejected -010. No atasan, so self-nominations need no response |
| `lukman` | Lukman Hakim | Karyawan | **Can self-nominate** for Manajer Keuangan (open vacancy, no proposal yet). Complete documents. Candidate in U-2026-003 (PIHC), -006 (VP SDM), -007 (VP SDM), -009 (SVP SDM), -012 (Direksi 3), -013 (Dirut), -016 (Direksi 1), -017 (Direksi 2) |
| `sari` | Sari Puspadewi | Karyawan | **Category undeterminable**: no assessment yet (used for the repository dialogs) |
| `diandra` | Diandra Pertiwi | Karyawan | **Category undeterminable**: final grades missing (fixed by the bulk grade import); only in draft U-2026-005 |
| `maya` | Maya Kusuma | Karyawan | Assessment and health "Tidak Direkomendasikan", KPI 2025 not achieved, **Less Match**; cannot be nominated |
| `fajar` | Fajar Nugroho | Karyawan | Only the 2024 final grade and no assessment, so the category cannot be determined. Not in any proposal |
| `citra` | Citra Lestari | Karyawan | Complete data and documents. Self-nomination **accepted** by atasan (N-005), nominated by atasan (N-007). Candidate in U-2026-009 (SVP SDM), -011 (Dirut, *Ditahan*), -012 (Direksi 3), -013 (Dirut), -017 (Direksi 2); winner of the **finished U-2026-015** |
| `andi` | Andi Saputra | Karyawan | Match category but interview, health, and LHKPN all pending. Self-nomination **rejected by atasan** (N-006, reason shown). Candidate in **U-2026-014 at PIHC** (designated, approval blocked) and the rejected U-2026-010 (*Ditolak PIHC*) |

#### Atasan, HR

| Username | Name | Roles | Scenario / stage |
| --- | --- | --- | --- |
| `atasan` | Hendra Wijaya | Atasan + Karyawan | Supervisor of Budi, Sari, Diandra, Rizky, Maya, and Andi. **Pending self-nominations to answer**: Rizky for Manajer Perencanaan Produksi (N-004, Terima/Tolak available). N-001 (Budi) is locked because U-2026-006 was already sent; N-006 (Andi) is already rejected. Can nominate Rizky for Manajer Produksi (not yet nominated by atasan) |
| `hr` | Rina Hartati | HR + Karyawan | Everything under `/hr`: drafts (U-2026-004/-005), 13 running proposals to monitor, SLA escalation (-006 and -012), interview scheduling, and bulk grade import |

#### Approvers (one account per stage)

| Username | Name | Roles | Scenario / stage |
| --- | --- | --- | --- |
| `vp` | Dewi Anggraini | VP SDM + Atasan + Karyawan | **Stage VP SDM**: U-2026-006 (overdue 1 day), -007 (1 day left), -008 (2 days left). Three-role picker; first approval step |
| `svp` | Agus Santoso | SVP SDM | **Stage SVP SDM**: U-2026-009 (due today) |
| `direksi1` | Direksi 1 | Direksi 1 | **Stage Direksi 1**: U-2026-016 (2 days left). Approves with a note per candidate |
| `direksi2` | Direksi 2 | Direksi 2 | **Stage Direksi 2**: U-2026-017 (1 day left) |
| `direksi3` | Direksi 3 | Direksi 3 | **Stage Direksi 3**: U-2026-012 (overdue 3 days) |
| `dirut` | Direktur Utama | Direktur Utama | **Stage Direktur Utama**: U-2026-013 (compare and choose a candidate) and U-2026-011 (*Ditahan*: waiting for interview results). Can request an interview, which holds the proposal |
| `pihc` | PIHC | PIHC | **Stage PIHC**: U-2026-003 (documents complete, **Setujui** enabled) and U-2026-014 (documents missing, **Setujui** disabled). **Tolak** with a reason gives the final status "Ditolak PIHC" |

### Seed data scenarios

Seed data lives in `lib/db.ts` (`createSeed`). Besides the base proposals (U-2026-003 to -008, draft U-2026-004/-005), it
covers every approval stage so each approver queue has something to review:

| Proposal | Stage | Scenario |
| --- | --- | --- |
| U-2026-009 Manajer Anggaran | SVP | Due today (SLA boundary) |
| U-2026-010 Manajer Pemeliharaan | Ditolak PIHC | Final rejection (reason in the log, visible to HR and approvers only) |
| U-2026-011 Manajer K3 | Dirut | "Ditahan": Dirut asked for an interview (scheduled 08/12/2026); resumes once every candidate's interview result is uploaded |
| U-2026-012 Manajer Teknologi Informasi | Direksi 3 | Overdue by 3 days (SLA escalation) |
| U-2026-013 Manajer Penjualan | Dirut | Waiting for the Dirut to compare and choose a candidate |
| U-2026-016 Manajer Pelatihan | Direksi 1 | 2 days left |
| U-2026-017 Manajer Administrasi | Direksi 2 | 1 day left |
| U-2026-014 Manajer Gudang | PIHC | Designated candidate (Andi) has no documents, so **Setujui** stays disabled |
| U-2026-015 Manajer Akuntansi | Selesai | Final approval already given |

Nominations: N-005 (self, accepted), N-006 (self, rejected by atasan, reason required), N-007 (by Atasan Langsung), plus the earlier
pending ones (N-001 to N-004). Assessment `validUntil` is display-only and not enforced, so there is no expiry scenario.

### Suggested end-to-end walkthrough

1. Log in as `hr` → **Pencalonan** → choose *Manajer Keuangan* → add 2–5 candidates (otherwise a "Pengajuan gagal" pop-up appears) and a note of 50+
   characters → **Kirim Usulan**.
2. Approve in order as `vp`, `svp`, `direksi1`, `direksi2`, `direksi3` (each adds a note per candidate and forwards all
   candidates), then `dirut` (**Bandingkan** → choose one candidate → **Simpan pilihan & lanjutkan** → **Tetapkan calon &
   lanjutkan**), using **Menunggu keputusan** → **Tinjau**.
3. As `pihc`, a sample proposal (U-2026-003, Bhima designated, documents complete) is ready to approve. For
   U-2026-006 and any proposal you push through, **Setujui** stays disabled until the designated candidate has
   interview, health, and LHKPN on file; complete them as `hr` under **Repository → Buka detail**.
4. Watch the bell badge, the HR **Status persetujuan** timeline, and the employee status page update.

## Roles and screens

| Section | Role(s) | Screens |
| --- | --- | --- |
| `/karyawan` | Karyawan | Dashboard + job matches (Match / Partial / Less), KPI, Asesmen, Syarat Promosi, Kecocokan jabatan (+ detail), Pencalonan saya, Status pencalonan |
| `/atasan` | Atasan | Dashboard, Kecocokan bawahan, Pencalonan bawahan, Status pencalonan (read-only) |
| `/hr` | HR | Dashboard, Repository (+ requirement detail and pop-ups), Prediksi jabatan, Rekomendasi kandidat, Pencalonan, Status persetujuan (+ detail), Jadwal wawancara, Unggah Nilai Akhir |
| `/approver` | VP, SVP, Direksi 1/2/3, Direktur Utama, PIHC | Dashboard, Menunggu keputusan, Riwayat persetujuan, and a role-specific proposal screen |

Other routes: `/login`, `/peran` (role picker), `/hr/unggah/template` (CSV template download).

## Project layout

```
app/
  login/, peran/            public screens
  (app)/                    authenticated area (shell with header, role nav, footer)
    karyawan/ atasan/ hr/ approver/
    loading.tsx             Suspense boundary so navigations stay instant
components/                 UI primitives, shell, forms, modals, shared views
lib/
  db.ts                     types, seed data, in-memory store (globalThis)
  queries.ts                derived data: categories, checklist, SLA, queues
  actions.ts                Server Actions (all mutations and workflow transitions)
  session.ts                cookie session + role guards
  nav.ts, predictions.ts, form.ts
public/brand/               logos downloaded from Figma
figma/                      exported design frames used as the reference
```

## How it works

- **Session:** an `aura_session` cookie holds the user id and active role, re-validated against the store on
  every read. Pages call `requireRole(group)`; Server Actions call `assertRole(...)`.
- **Cache Components:** session reads happen at request time, so the shell and every page stream in behind
  `<Suspense>` (layout + `app/(app)/loading.tsx`).
- **Workflow:** a proposal moves `draft → vp → svp → direksi1 → direksi2 → direksi3 → dirut → pihc → selesai`, or `ditolak` when PIHC rejects.
  Each stage has a 2-day SLA, and advancing a stage notifies the next approver's role.
- **"Today":** the app treats today as **4 December 2026** (`TODAY` in `lib/db.ts`) so SLA and overdue figures
  match the design.

## Design notes

Where the Figma consistency findings (K-01 to K-11) conflict with individual frames, the implementation follows
the findings: one header (bell, name, role, Keluar), one menu per role, one tab style, consistent terms
("Dashboard", "VP SDM", "SVP SDM", "Direksi 1/2/3", "Direktur Utama"), and health status limited to
Direkomendasikan / Tidak Direkomendasikan (NFR-SC-06). U-2026-006 has three candidates: Budi (92, self-nominated) plus Bhima (88) and Lukman (84) from HR's
recommendation. A proposal must carry 2–5 candidates to be sent.

## Known limitations

- **In-memory data:** everything resets on restart; there is no persistence or multi-instance support.
- **Session is unsigned** (demo-grade). Do not deploy it as-is.
- **Uploads are not stored.** Assessment, interview, and LHKPN uploads validate "PDF, up to 10 MB" and record the
  filename only.
- **Bulk grade import accepts CSV only** (no XLSX). Use the downloadable template.
- **Not designed in Figma:** the Atasan dashboard and some role-picker/pop-up variants were built from the
  closest available frame or inferred from the mapping table.
