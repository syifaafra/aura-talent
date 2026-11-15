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

| Username | Roles | Good for testing |
| --- | --- | --- |
| `budi` | Karyawan | Dashboard, KPI, assessment, requirements, match detail, nomination status (already nominated in U-2026-006) |
| `lukman` | Karyawan | Self-nomination for Manajer Keuangan (open vacancy) |
| `bhima` | Karyawan | Another Karyawan view |
| `diandra`, `sari` | Karyawan | "Kategori belum dapat ditentukan" state (missing final grade / assessment) |
| `hr` | HR + Karyawan | Everything under `/hr` |
| `atasan` | Atasan + Karyawan | Subordinate matches, nominating, read-only status |
| `vp` | VP SDM + Atasan + Karyawan | Three-role picker; first approval step |
| `svp` | SVP SDM | Second approval step |
| `direksi1` | Direksi 1 | Compare candidates and select one; view notes |
| `direksi2`, `direksi3` | Direksi 2 / 3 | Approve the selected candidate |
| `dirut` | Direktur Utama | Designate the final candidate |
| `pihc` | PIHC | Final approval (needs interview, health, and LHKPN complete) |

### Suggested end-to-end walkthrough

1. Log in as `hr` → **Pencalonan** → choose *Manajer Keuangan* → add at least 2 candidates and a note of 50+
   characters → **Kirim Usulan**.
2. Approve in order as `vp`, `svp`, `direksi1` (select one candidate), `direksi2`, `direksi3`, `dirut`
   (designate), using **Menunggu keputusan** → **Tinjau**.
3. As `pihc`, **Setujui** stays disabled until the designated candidate has interview, health, and LHKPN on
   file. Complete them as `hr` under **Repository → Buka detail**, then approve as `pihc`.
4. Watch the bell badge, the HR **Status persetujuan** timeline, and the employee status page update.

## Roles and screens

| Section | Role(s) | Screens |
| --- | --- | --- |
| `/karyawan` | Karyawan | Dasbor + job matches (Match / Partial / Less), KPI, Asesmen, Syarat Promosi, Kecocokan jabatan (+ detail), Pencalonan saya, Status pencalonan |
| `/atasan` | Atasan | Dasbor, Kecocokan bawahan, Pencalonan bawahan, Status pencalonan (read-only) |
| `/hr` | HR | Dasbor, Repository (+ requirement detail and pop-ups), Prediksi jabatan, Rekomendasi kandidat, Pencalonan, Status persetujuan (+ detail), Jadwal wawancara, Unggah Nilai Akhir |
| `/approver` | VP, SVP, Direksi 1/2/3, Direktur Utama, PIHC | Dasbor, Menunggu keputusan, Riwayat persetujuan, and a role-specific proposal screen |

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
- **Workflow:** a proposal moves `draft → vp → svp → direksi1 → direksi2 → direksi3 → dirut → pihc → selesai`.
  Each stage has a 2-day SLA, and advancing a stage notifies the next approver's role.
- **"Today":** the app treats today as **4 December 2026** (`TODAY` in `lib/db.ts`) so SLA and overdue figures
  match the design.

## Design notes

Where the Figma consistency findings (K-01 to K-11) conflict with individual frames, the implementation follows
the findings: one header (bell, name, role, Keluar), one menu per role, one tab style, consistent terms
("Dasbor", "VP SDM", "SVP SDM", "Direksi 1/2/3", "Direktur Utama"), and health status limited to
Direkomendasikan / Tidak Direkomendasikan (NFR-SC-06). U-2026-006 has two candidates (Budi 92, Bhima 88);
Lukman appears only as a recommendation.

## Known limitations

- **In-memory data:** everything resets on restart; there is no persistence or multi-instance support.
- **Session is unsigned** (demo-grade). Do not deploy it as-is.
- **Uploads are not stored.** Assessment, interview, and LHKPN uploads validate "PDF, up to 10 MB" and record the
  filename only.
- **Bulk grade import accepts CSV only** (no XLSX). Use the downloadable template.
- **Not designed in Figma:** the Atasan dashboard and some role-picker/pop-up variants were built from the
  closest available frame or inferred from the mapping table.
