import { Suspense } from "react";
import { PageFallback } from "@/components/page-fallback";
import Link from "next/link";
import { Card, Pill, PageHeader, Stat, Table, Td, Th, cn, inputClass } from "@/components/ui";
import { STAGE_LABEL, fmtDate, db, type Stage } from "@/lib/db";
import { activeProposals, getEmployee, inApproval, isOverdue } from "@/lib/queries";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Status persetujuan · AURA Talent" };

const FILTERS: Stage[] = ["draft", "vp", "svp", "direksi1", "direksi2", "direksi3", "dirut", "pihc", "ditolak"];

async function PersetujuanList({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole("hr");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.toLowerCase() : "";
  const stage = typeof sp.jenjang === "string" ? sp.jenjang : "";

  const running = activeProposals();
  const rows = db()
    .proposals.filter((p) => p.stage !== "selesai")
    .filter((p) => !stage || p.stage === stage)
    .filter((p) => !q || `${p.id} ${p.title}`.toLowerCase().includes(q));

  return (
    <>
      <PageHeader
        title="Status persetujuan usulan"
        subtitle="Pantau seluruh usulan berjalan. Pilih usulan untuk melihat tahapan dan catatan persetujuan."
      />
      <div className="mb-6 grid gap-6 md:grid-cols-3">
        <Stat value={running.length} label="Usulan berjalan" />
        <Stat value={running.filter(inApproval).length} label="Menunggu persetujuan" />
        <Stat value={running.filter((p) => inApproval(p) && isOverdue(p)).length} label="Eskalasi SLA" danger={running.some((p) => inApproval(p) && isOverdue(p))} />
      </div>

      <form action="/hr/persetujuan" role="search" className="mb-6 grid gap-4 md:grid-cols-[1fr_20rem_auto]">
        <div>
          <label htmlFor="q" className="sr-only">
            Cari nomor usulan atau jabatan
          </label>
          <input id="q" name="q" defaultValue={sp.q as string | undefined} placeholder="Cari nomor usulan atau jabatan" className={cn(inputClass, "border-line py-3.5")} />
        </div>
        <div>
          <label htmlFor="jenjang" className="sr-only">
            Jenjang
          </label>
          <select id="jenjang" name="jenjang" defaultValue={stage} className={cn(inputClass, "py-3.5")}>
            <option value="">Status: Semua jenjang</option>
            {FILTERS.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="rounded-lg bg-brand-soft px-6 font-semibold text-brand hover:bg-[#d3e7f7]">
          Terapkan
        </button>
      </form>

      <Card>
        <Table>
          <thead className="bg-brand-soft">
            <tr>
              <Th>No. usulan</Th>
              <Th>Jabatan tujuan</Th>
              <Th>Kandidat</Th>
              <Th>Pengajuan</Th>
              <Th>Jenjang saat ini</Th>
              <Th>Aksi</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const draft = p.stage === "draft";
              const single = p.candidates.length === 1;
              return (
                <tr key={p.id}>
                  <Td>{p.id}</Td>
                  <Td>{p.title}</Td>
                  <Td>
                    {single ? getEmployee(p.candidates[0].badge)?.name : `${p.candidates.length} kandidat`}
                    {draft && single ? (
                      <div className="mt-1">
                        <Pill tone="warn">Perlu minimal 2 kandidat</Pill>
                      </div>
                    ) : null}
                  </Td>
                  <Td>{fmtDate(p.submittedAt)}</Td>
                  <Td className={cn(isOverdue(p) && inApproval(p) && "font-semibold text-danger")}>
                    {STAGE_LABEL[p.stage]}
                    {inApproval(p) && isOverdue(p) ? " · terlambat" : ""}
                  </Td>
                  <Td>
                    <Link href={`/hr/persetujuan/${p.id}`} className="font-semibold text-brand hover:underline">
                      Lihat rincian →
                    </Link>
                  </Td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <Td colSpan={6} className="text-muted">
                  Tidak ada usulan yang cocok.
                </Td>
              </tr>
            ) : null}
          </tbody>
        </Table>
        <p className="mt-4 text-[1.1rem] text-muted">Menampilkan {rows.length} usulan berjalan</p>
      </Card>
    </>
  );
}

export default function Page(props: Parameters<typeof PersetujuanList>[0]) {
  return (
    <Suspense fallback={<PageFallback title="Status persetujuan usulan" />}>
      <PersetujuanList {...props} />
    </Suspense>
  );
}
