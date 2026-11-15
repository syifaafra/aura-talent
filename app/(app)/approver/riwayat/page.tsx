import { Suspense } from "react";
import { PageFallback } from "@/components/page-fallback";
import Link from "next/link";
import { Card, EmptyState, PageHeader, Table, Td, Th, cn, inputClass } from "@/components/ui";
import { STAGE_LABEL, db, fmtDateTime, type Stage } from "@/lib/db";
import { getEmployee } from "@/lib/queries";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Riwayat persetujuan · AURA Talent" };

const STAGES: Stage[] = ["vp", "svp", "direksi1", "direksi2", "direksi3", "dirut", "pihc"];

async function RiwayatPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole("approver");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.toLowerCase() : "";
  const stage = typeof sp.jenjang === "string" ? sp.jenjang : "";

  const rows = db()
    .proposals.flatMap((p) =>
      p.log
        .filter((l) => l.stage !== "hr")
        .map((l) => ({ p, l })),
    )
    .filter(({ p, l }) => (!stage || l.stage === stage) && (!q || `${p.id} ${p.title}`.toLowerCase().includes(q)))
    .sort((a, b) => b.l.at.localeCompare(a.l.at));

  const latest = rows[0]?.p;
  const chosenName = latest?.selectedBadge ? getEmployee(latest.selectedBadge)?.name : undefined;

  return (
    <>
      <PageHeader
        title="Riwayat persetujuan"
        subtitle="Telusuri persetujuan, kandidat pilihan, serta catatan pada setiap jenjang."
      />

      {latest ? (
        <Card tone="soft" className="mb-6">
          <h2 className="text-[1.6rem] font-semibold text-brand">
            {latest.id} · {latest.title}
          </h2>
          <p className="mt-2 text-[1.25rem] text-muted">
            {chosenName ? `Pilihan Direksi 1: ${chosenName} · ` : ""}
            Tahap berikutnya: {STAGE_LABEL[latest.stage]}
          </p>
        </Card>
      ) : null}

      <form action="/approver/riwayat" role="search" className="mb-6 grid gap-4 md:grid-cols-[1fr_18rem_auto]">
        <div>
          <label htmlFor="q" className="sr-only">
            Cari nomor usulan atau jabatan
          </label>
          <input id="q" name="q" defaultValue={sp.q as string | undefined} placeholder="Cari nomor usulan atau jabatan…" className={cn(inputClass, "py-3.5")} />
        </div>
        <div>
          <label htmlFor="jenjang" className="sr-only">
            Jenjang
          </label>
          <select id="jenjang" name="jenjang" defaultValue={stage} className={cn(inputClass, "py-3.5")}>
            <option value="">Semua jenjang</option>
            {STAGES.map((s) => (
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

      {rows.length === 0 ? (
        <EmptyState title="Belum ada persetujuan tercatat">
          Persetujuan akan muncul di sini setelah approver menyetujui usulan.
        </EmptyState>
      ) : (
        <Card>
          <Table>
            <thead className="bg-brand-soft">
              <tr>
                <Th>Waktu</Th>
                <Th>Usulan / jenjang</Th>
                <Th>Kandidat</Th>
                <Th>Persetujuan</Th>
                <Th>Catatan</Th>
                <Th>Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ p, l }, i) => (
                <tr key={`${p.id}-${l.at}-${i}`}>
                  <Td>{fmtDateTime(l.at)}</Td>
                  <Td>
                    {p.id}
                    <br />
                    {STAGE_LABEL[l.stage as Stage]}
                  </Td>
                  <Td>{p.candidates.length} kandidat</Td>
                  <Td className="font-semibold text-ok">{l.action}</Td>
                  <Td>{l.note ?? "—"}</Td>
                  <Td>
                    <Link href={`/approver/usulan/${p.id}`} className="font-semibold text-brand hover:underline">
                      Lihat rincian →
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <p className="mt-4 text-[1.1rem] text-muted">{rows.length} persetujuan tercatat</p>
        </Card>
      )}
    </>
  );
}

export default function Page(props: Parameters<typeof RiwayatPage>[0]) {
  return (
    <Suspense fallback={<PageFallback title="Riwayat persetujuan" />}>
      <RiwayatPage {...props} />
    </Suspense>
  );
}
