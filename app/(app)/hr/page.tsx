import Link from "next/link";
import { Card, PageHeader, Stat, Table, Td, Th, Notice } from "@/components/ui";
import { STAGE_LABEL, db, fmtDate } from "@/lib/db";
import { PREDICTION } from "@/lib/predictions";
import { activeProposals, inApproval, isOverdue } from "@/lib/queries";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Dashboard HR · AURA Talent" };

export default async function HrDasbor() {
  await requireRole("hr");
  const running = activeProposals();
  const waiting = running.filter(inApproval);
  const overdue = running.filter((p) => inApproval(p) && isOverdue(p));
  const needInterview = waiting.find(
    (p) => !db().interviews.some((i) => i.proposalId === p.id),
  );

  return (
    <>
      <PageHeader title="Dashboard HR" subtitle="Pantau kesiapan pengisian jabatan dan tindak lanjut usulan promosi." />

      <div className="mb-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Jabatan diprediksi kosong"
          value={PREDICTION.total}
          note={`${PREDICTION.within6} dalam ≤6 bulan · ${PREDICTION.within12} dalam 6–12 bulan`}
        />
        <Stat label="Usulan berjalan" value={running.length} note="Pantau seluruh jenjang persetujuan" />
        <Stat
          label="Usulan menunggu keputusan"
          value={waiting.length}
          note="Persetujuan berjenjang hingga PIHC"
        />
        <Stat
          label="Eskalasi SLA"
          value={overdue.length}
          danger={overdue.length > 0}
          note={
            <>
              Butuh tindak lanjut HR ·{" "}
              <Link href="/hr/persetujuan" className="font-semibold text-brand hover:underline">
                Buka status
              </Link>
            </>
          }
        />
      </div>

      {needInterview ? (
        <Notice className="mb-6 flex flex-wrap items-center justify-between gap-4" title={`${needInterview.candidates.length} kandidat belum dijadwalkan wawancara`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span>Usulan {needInterview.title} · Tetapkan tanggal, waktu, dan pewawancara</span>
            <Link
              href={`/hr/wawancara?usulan=${needInterview.id}`}
              className="font-semibold text-brand hover:underline"
            >
              Jadwalkan wawancara →
            </Link>
          </div>
        </Notice>
      ) : null}

      <Card>
        <div className="mb-2 flex items-center justify-between gap-4">
          <h2 className="text-[1.6rem] font-semibold">Usulan berjalan</h2>
          <Link href="/hr/persetujuan" className="font-semibold text-brand hover:underline">
            Lihat status persetujuan →
          </Link>
        </div>
        <Table>
          <thead>
            <tr>
              <Th>No. usulan</Th>
              <Th>Usulan jabatan</Th>
              <Th>Tanggal pengajuan</Th>
              <Th>Jenjang saat ini</Th>
              <Th>Tindak lanjut</Th>
            </tr>
          </thead>
          <tbody>
            {running.map((p) => (
              <tr key={p.id}>
                <Td>{p.id}</Td>
                <Td>{p.title}</Td>
                <Td>{fmtDate(p.submittedAt)}</Td>
                <Td>{STAGE_LABEL[p.stage]}</Td>
                <Td>
                  <Link href={`/hr/persetujuan/${p.id}`} className="font-semibold text-brand hover:underline">
                    Lihat rincian
                  </Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
