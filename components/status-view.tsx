import Link from "next/link";
import { STAGE_LABEL, fmtDate } from "@/lib/db";
import type { StatusRow } from "@/lib/queries";
import { CompactSteps } from "./proposal-status";
import { Card, CardTitle, EmptyState, Notice, Stat, Table, Td, Th, cn } from "./ui";

function statusOf(r: StatusRow) {
  if (r.rejected) return "Ditolak atasan";
  if (r.stage === "selesai" || r.stage === "ditolak") return "Selesai";
  if (r.stage === "hr") return r.awaitingSupervisor ? "Menunggu persetujuan atasan" : "Diterima HR";
  return "Menunggu";
}

/** Read-only nomination status for Karyawan (own) and Atasan (direct reports). */
export function StatusView({
  rows,
  selectedKey,
  basePath,
  mode,
  justSent,
}: {
  rows: StatusRow[];
  selectedKey?: string;
  basePath: string;
  mode: "karyawan" | "atasan";
  justSent: boolean;
}) {
  const finished = (r: StatusRow) => r.stage === "selesai" || r.stage === "ditolak";
  const running = rows.filter((r) => !finished(r) && !r.rejected).length;
  const waiting = rows.filter((r) => !finished(r) && r.stage !== "hr").length;
  const done = rows.filter(finished).length;
  const selected = rows.find((r) => r.key === selectedKey) ?? rows[0];

  return (
    <div className="space-y-6">
      {justSent ? (
        <Notice tone="ok" title="Pencalonan terkirim">
          HR akan menyusun usulan dari pencalonan ini. Pantau tahapannya di halaman ini.
        </Notice>
      ) : null}

      <div className="grid gap-6 md:grid-cols-3">
        <Stat value={running} label="Pencalonan berjalan" />
        <Stat value={waiting} label="Menunggu persetujuan" />
        <Stat value={done} label="Selesai" />
      </div>

      {rows.length === 0 ? (
        <EmptyState title="Belum ada pencalonan">
          {mode === "karyawan"
            ? "Calonkan diri dari detail kecocokan jabatan yang memiliki lowongan aktif."
            : "Calonkan bawahan langsung dari menu Pencalonan bawahan."}
        </EmptyState>
      ) : (
        <>
          <Card>
            <Table>
              <thead>
                <tr>
                  <Th>No. usulan</Th>
                  <Th>Jabatan tujuan</Th>
                  {mode === "atasan" ? <Th>Karyawan</Th> : <Th>Sumber</Th>}
                  <Th>Pengajuan</Th>
                  <Th>Tahap saat ini</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key} className={cn(r.key === selected.key && "bg-brand-soft/50")}>
                    <Td>
                      <Link
                        href={`${basePath}?usulan=${r.key}`}
                        className="font-medium text-ink hover:text-brand hover:underline"
                      >
                        {r.proposal?.id ?? "Belum ada usulan"}
                      </Link>
                    </Td>
                    <Td>{r.title}</Td>
                    <Td>{mode === "atasan" ? r.name : r.source}</Td>
                    <Td>{fmtDate(r.date)}</Td>
                    <Td className="font-semibold text-brand">
                      {r.rejected ? "Atasan Langsung" : r.stage === "hr" ? "HR" : STAGE_LABEL[r.stage]}
                    </Td>
                    <Td className="font-semibold text-brand">{statusOf(r)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
            <Card>
              <CardTitle>Rincian status · {selected.proposal?.id ?? "Menunggu usulan HR"}</CardTitle>
              <p className="mb-4 text-[1.15rem] text-muted">
                {selected.name} · {selected.badge} · {selected.title}
              </p>
              {selected.proposal ? (
                <CompactSteps proposal={selected.proposal} />
              ) : (
                <p className="text-[1.15rem] text-muted">
                  {selected.rejected
                    ? `Pencalonan ditolak Atasan Langsung${selected.rejectNote ? ` · Alasan: ${selected.rejectNote}` : ""}. Pencalonan tidak diteruskan sebagai pencalonan diri; HR masih dapat mengajukan karyawan ini dari rekomendasi.`
                    : selected.awaitingSupervisor
                      ? "Pencalonan menunggu persetujuan Atasan Langsung dan sudah tercatat pada daftar kandidat HR."
                      : "Pencalonan sudah diterima HR dan menunggu dimasukkan ke dalam usulan."}
                </p>
              )}
            </Card>
            <Card>
              <CardTitle>Tindak lanjut</CardTitle>
              <p className="text-[1.2rem] leading-relaxed text-muted">
                {mode === "karyawan"
                  ? "Belum ada tindakan dari pengusul yang diperlukan pada tahap ini."
                  : "HR mengelola penerusan usulan. Anda hanya dapat memantau pencalonan bawahan langsung sesuai kewenangan."}
              </p>
              <h3 className="mt-6 text-[1.2rem] font-semibold">Catatan proses</h3>
              <p className="mt-2 text-[1.1rem] leading-relaxed text-muted">
                Keputusan promosi mengikuti persetujuan berjenjang. Status menunggu bukan berarti pencalonan ditolak.
              </p>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
