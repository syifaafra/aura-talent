import { fmtLong } from "@/lib/db";
import { simplePdf, type PdfLine } from "@/lib/pdf";
import { getEmployee, mandatoryReqs } from "@/lib/queries";
import { readSession } from "@/lib/session";

/** "Unduh CV": a PDF built from the same HRIS data shown in the candidate profile. Approvers only. */
export async function GET(_: Request, { params }: { params: Promise<{ badge: string }> }) {
  const session = await readSession();
  const role = session?.role;
  const approver = ["vp", "svp", "direksi1", "direksi2", "direksi3", "dirut", "pihc"].includes(role ?? "");
  if (!approver) return new Response("Tidak berwenang", { status: 403 });

  const { badge } = await params;
  const e = getEmployee(badge);
  if (!e || e.system) return new Response("Karyawan tidak ditemukan", { status: 404 });

  const lines: PdfLine[] = [
    { text: "Riwayat karier", size: 20, bold: true },
    { text: `${e.name} · ${e.badge}`, size: 14, bold: true, gap: 4 },
    { text: `${e.position} · Unit ${e.unit} · Job grade ${e.jobGrade}`, size: 11 },
    { text: "Riwayat jabatan", size: 13, bold: true, gap: 16 },
    ...(e.history || "Belum ada riwayat jabatan sebelumnya.").split(" · ").map((x) => ({ text: `- ${x}` })),
    { text: "Pendidikan", size: 13, bold: true, gap: 14 },
    { text: e.education },
    { text: "Kinerja", size: 13, bold: true, gap: 14 },
    { text: `KPI 2024: ${e.kpi[2024] ?? "-"} · Nilai akhir ${e.grades[2024] ?? "-"}` },
    { text: `KPI 2025: ${e.kpi[2025] ?? "-"} · Nilai akhir ${e.grades[2025] ?? "-"}` },
    { text: "Asesmen", size: 13, bold: true, gap: 14 },
    { text: e.assessment ? `${e.assessment.result} · berlaku sampai ${fmtLong(e.assessment.validUntil)}` : "Belum ada hasil asesmen." },
    { text: "Syarat wajib (PI-SDM-PD-013)", size: 13, bold: true, gap: 14 },
    ...mandatoryReqs(e).map((r) => ({ text: `${r.state === "Memenuhi" ? "[v]" : "[ ]"} ${r.label}: ${r.detail}` })),
    { text: "Disusun otomatis dari data HRIS AURA Talent.", size: 9, gap: 24 },
  ];

  const pdf = simplePdf(lines);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="CV-${e.badge}.pdf"`,
    },
  });
}
