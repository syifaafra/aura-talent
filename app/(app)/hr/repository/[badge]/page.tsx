import { Suspense } from "react";
import { PageFallback } from "@/components/page-fallback";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReqAction } from "@/components/requirement-actions";
import { Card, PageHeader, cn } from "@/components/ui";
import { fmtDate } from "@/lib/db";
import { getEmployee } from "@/lib/queries";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Detail persyaratan karyawan · AURA Talent" };

interface Row {
  label: string;
  detail: string;
  tone?: "ok" | "warn" | "muted";
}

async function DetailPersyaratan({ params }: { params: Promise<{ badge: string }> }) {
  await requireRole("hr");
  const { badge } = await params;
  const e = getEmployee(badge);
  if (!e || e.system) notFound();

  const semester = (y: number) =>
    e.kpi[y] === "Tercapai" ? `${y}: S1 & S2 tercapai` : e.kpi[y] ? `${y}: belum tercapai` : `${y}: belum ada data`;
  const grades = [2024, 2025].map((y) => `${y}: ${e.grades[y] ?? "Belum diinput"}`).join(" · ");
  const hasGrades = Boolean(e.grades[2024] || e.grades[2025]);
  const basic = e.position.replace(` ${e.unit}`, "");

  const piSmart: Row[] = [
    { label: "Identitas karyawan", detail: `Badge: ${e.badge} · Nama: ${e.name} · Posisi: ${e.position}` },
    { label: "Ketersediaan formasi (Job Grade)", detail: `Formasi tersedia · Memenuhi · Job Grade tujuan: JG ${e.jobGrade + 1}`, tone: "ok" },
    { label: "Masa Dinas Grade (MDG)", detail: "≥ 2 tahun (JG) · Memenuhi", tone: "ok" },
    { label: "Sisa masa kerja", detail: "≥ 1 tahun · Memenuhi", tone: "ok" },
    { label: "Sanksi disiplin", detail: "Tidak ada sanksi disiplin", tone: "ok" },
    { label: "Status capaian KPI per semester / tahun", detail: `${semester(2024)} · ${semester(2025)}`, tone: e.kpi[2024] === "Tercapai" && e.kpi[2025] === "Tercapai" ? "ok" : "warn" },
    { label: "Riwayat jabatan", detail: e.history || "-" },
    { label: "Riwayat pendidikan", detail: e.education },
    { label: "Status talenta", detail: e.talentStatus },
    { label: "Profil kompetensi", detail: e.competency },
    { label: "Rumpun jabatan", detail: `${basic} · Rumpun ${e.unit}` },
    { label: "Data lowongan internal", detail: "Lihat Rekomendasi kandidat untuk lowongan aktif" },
  ];

  const emp = { badge: e.badge, name: e.name, position: e.position, health: e.health };
  const hr: Array<{
    label: string;
    detail: string;
    tone: "ok" | "warn" | "muted";
    kind: "grade" | "assessment" | "interview" | "health" | "lhkpn";
    action: string;
  }> = [
    {
      label: "Nilai akhir kinerja (A/B/C/D)",
      detail: hasGrades ? grades : "Belum diinput",
      tone: e.grades[2024] && e.grades[2025] ? "ok" : hasGrades ? "warn" : "muted",
      kind: "grade",
      action: hasGrades ? "Ubah" : "Input",
    },
    {
      label: "Laporan hasil asesmen asesor / psikolog",
      detail: e.assessment
        ? `${e.assessment.result} · ${e.assessment.reportUploaded ? `Laporan diunggah${e.assessment.assessor ? ` (${e.assessment.assessor}, ${fmtDate(e.assessment.date ?? "")})` : ""}` : "Laporan belum diunggah"}`
        : "Belum ada hasil asesmen",
      tone: e.assessment?.reportUploaded ? "ok" : e.assessment ? "ok" : "muted",
      kind: "assessment",
      action: e.assessment?.reportUploaded ? "Ganti" : "Unggah",
    },
    {
      label: "Hasil wawancara",
      detail:
        e.interview.status === "Memenuhi"
          ? `Memenuhi · ${e.interview.file}`
          : `Menunggu · ${e.interview.file ? `${e.interview.file} (${e.interview.invalid ?? "belum valid"})` : "Belum diunggah"}`,
      tone: e.interview.status === "Memenuhi" ? "ok" : "warn",
      kind: "interview",
      action: e.interview.status === "Memenuhi" ? "Ganti" : "Unggah",
    },
    {
      label: "Rekomendasi kesehatan",
      detail: e.health ?? "— · Status belum dicatat",
      tone: e.health ? "ok" : "warn",
      kind: "health",
      action: e.health ? "Ubah status" : "Catat status",
    },
    {
      label: "Bukti LHKPN (khusus BOD-1/BOD-2)",
      detail: e.lhkpn.uploaded
        ? `Diunggah · ${e.lhkpn.file}`
        : "Wajib hanya untuk BOD-1/BOD-2 · Belum diunggah",
      tone: e.lhkpn.uploaded ? "ok" : "warn",
      kind: "lhkpn",
      action: e.lhkpn.uploaded ? "Ganti" : "Unggah",
    },
  ];

  const toneCls = (t?: "ok" | "warn" | "muted") =>
    t === "ok" ? "text-ok" : t === "warn" ? "text-warn" : t === "muted" ? "text-muted" : "text-ink";

  return (
    <>
      <PageHeader
        title="Detail persyaratan karyawan"
        subtitle={`${e.name} · ${e.badge} · ${e.position} · Data PI Smart: 31/10/2026`}
        back={
          <Link href="/hr/repository" className="hover:underline">
            ← Daftar karyawan
          </Link>
        }
      />
      <Card className="overflow-hidden p-0">
        <div className="px-7 pt-6">
          <h2 className="text-[1.6rem] font-semibold">Data dari PI Smart</h2>
          <p className="mt-1 text-[1.05rem] text-muted">
            Informasi karyawan dan kelayakan promosi dari sistem. Isian tambahan menggunakan contoh data.
          </p>
        </div>
        <div className="mt-4 grid grid-cols-[3rem_minmax(0,1fr)_minmax(0,1.9fr)_auto] bg-canvas/60 px-7 py-3 text-sm font-semibold uppercase tracking-wide text-muted">
          <span>No.</span>
          <span>Persyaratan</span>
          <span>Keterangan / status</span>
          <span />
        </div>
        <ul>
          {piSmart.map((r, i) => (
            <li key={r.label} className="grid grid-cols-[3rem_minmax(0,1fr)_minmax(0,1.9fr)_auto] items-center gap-x-4 border-t border-line px-7 py-4 text-[1.15rem]">
              <span className="text-muted">{String(i + 1).padStart(2, "0")}</span>
              <span className="font-medium">{r.label}</span>
              <span className={toneCls(r.tone)}>{r.detail}</span>
              <span />
            </li>
          ))}
        </ul>

        <div className="border-t-4 border-canvas bg-white px-7 pb-2 pt-5">
          <h2 className="text-[1.45rem] font-semibold">Dikelola HR</h2>
        </div>
        <ul>
          {hr.map((r, i) => (
            <li key={r.label} className={cn("grid grid-cols-[3rem_minmax(0,1fr)_minmax(0,1.9fr)_auto] items-center gap-x-4 border-t border-line px-7 py-3.5 text-[1.15rem]")}>
              <span className="text-muted">{String(piSmart.length + i + 1).padStart(2, "0")}</span>
              <span className="font-medium">{r.label}</span>
              <span className={toneCls(r.tone)}>{r.detail}</span>
              <ReqAction kind={r.kind} label={r.action} emp={emp} />
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

export default function Page(props: Parameters<typeof DetailPersyaratan>[0]) {
  return (
    <Suspense fallback={<PageFallback title="Detail persyaratan karyawan" />}>
      <DetailPersyaratan {...props} />
    </Suspense>
  );
}
