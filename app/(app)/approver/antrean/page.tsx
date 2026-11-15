import { Suspense } from "react";
import { PageFallback } from "@/components/page-fallback";
import Link from "next/link";
import { Card, Notice, PageHeader, Stat, Table, Td, Th, cn, inputClass } from "@/components/ui";
import { ROLE_LABEL, TODAY, fmtDate, fmtLong } from "@/lib/db";
import { isOverdue, queueFor, slaText } from "@/lib/queries";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Menunggu keputusan · AURA Talent" };

const ACTION: Record<string, string> = {
  direksi1: "Bandingkan",
  direksi2: "Tinjau",
  direksi3: "Tinjau",
  dirut: "Tetapkan",
};

async function AntreanPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { role } = await requireRole("approver");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.toLowerCase() : "";
  const status = typeof sp.status === "string" ? sp.status : "";

  const all = queueFor(role);
  const rows = all
    .filter((p) => !q || `${p.id} ${p.title}`.toLowerCase().includes(q))
    .filter((p) => !status || (status === "terlambat" ? isOverdue(p) : !isOverdue(p)));
  const late = all.filter(isOverdue).length;
  const forPick = role === "direksi1" || role === "dirut";

  return (
    <>
      <PageHeader
        title={forPick ? "Usulan menunggu pemilihan" : "Usulan menunggu keputusan"}
        subtitle={
          forPick
            ? `Antrean ${ROLE_LABEL[role]} · Pilih usulan untuk membandingkan kandidat yang telah diverifikasi.`
            : `Antrean ${ROLE_LABEL[role]} · Hanya usulan pada jenjang dan kewenangan Anda`
        }
      />

      {sp.disetujui === "1" ? (
        <Notice tone="ok" title="Keputusan tersimpan" className="mb-6">
          Usulan diteruskan ke jenjang berikutnya dan pengusul telah diberi tahu.
        </Notice>
      ) : null}

      <div className="mb-6 grid gap-6 md:grid-cols-3">
        <Stat value={all.length} label="Menunggu keputusan" />
        <Stat value={late} label="Terlambat" danger={late > 0} />
        <Stat value={all.length - late} label="Masih dalam batas waktu" />
      </div>

      <form action="/approver/antrean" role="search" className="mb-6 grid gap-4 md:grid-cols-[1fr_18rem_auto]">
        <div>
          <label htmlFor="q" className="sr-only">
            Cari nomor usulan atau jabatan
          </label>
          <input id="q" name="q" defaultValue={sp.q as string | undefined} placeholder="Cari nomor usulan atau jabatan…" className={cn(inputClass, "py-3.5")} />
        </div>
        <div>
          <label htmlFor="status" className="sr-only">
            Status
          </label>
          <select id="status" name="status" defaultValue={status} className={cn(inputClass, "py-3.5")}>
            <option value="">Status: Semua</option>
            <option value="terlambat">Terlambat</option>
            <option value="tepat">Dalam batas waktu</option>
          </select>
        </div>
        <button type="submit" className="rounded-lg bg-brand-soft px-6 font-semibold text-brand hover:bg-[#d3e7f7]">
          Terapkan
        </button>
      </form>

      <Card>
        <Table>
          <thead>
            <tr>
              <Th>No. usulan</Th>
              <Th>Jabatan</Th>
              <Th>Kandidat</Th>
              <Th>Pengusul</Th>
              <Th>Tanggal masuk</Th>
              <Th>Sisa waktu</Th>
              <Th>Aksi</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <Td>{p.id}</Td>
                <Td>{p.title}</Td>
                <Td>{p.candidates.length} kandidat</Td>
                <Td>HR</Td>
                <Td>{fmtDate(p.enteredAt)}</Td>
                <Td className={cn(isOverdue(p) ? "font-semibold text-danger" : "font-medium")}>{slaText(p)}</Td>
                <Td>
                  <Link href={`/approver/usulan/${p.id}`} className="font-semibold text-brand hover:underline">
                    {ACTION[role] ?? "Tinjau"} →
                  </Link>
                </Td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <Td colSpan={7} className="text-muted">
                  Tidak ada usulan yang menunggu keputusan.
                </Td>
              </tr>
            ) : null}
          </tbody>
        </Table>
        <p className="mt-4 text-[1.1rem] text-muted">
          Menampilkan {rows.length} usulan · {fmtLong(TODAY)}
        </p>
      </Card>
    </>
  );
}

export default function Page(props: Parameters<typeof AntreanPage>[0]) {
  return (
    <Suspense fallback={<PageFallback title="Usulan menunggu keputusan" />}>
      <AntreanPage {...props} />
    </Suspense>
  );
}
