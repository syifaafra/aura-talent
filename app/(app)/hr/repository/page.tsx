import { Suspense } from "react";
import { PageFallback } from "@/components/page-fallback";
import Link from "next/link";
import { Card, Notice, PageHeader, Table, Td, Th, cn, inputClass } from "@/components/ui";
import { db, fmtDateTime } from "@/lib/db";
import { completenessLabel, repositoryEmployees } from "@/lib/queries";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Repository · AURA Talent" };

async function RepositoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole("hr");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.toLowerCase() : "";
  const unit = typeof sp.unit === "string" ? sp.unit : "";
  const all = repositoryEmployees();
  const units = [...new Set(all.map((e) => e.unit))];
  const rows = all.filter(
    (e) => (!unit || e.unit === unit) && (!q || `${e.name} ${e.badge}`.toLowerCase().includes(q)),
  );
  const sync = db().piSmartSync;

  return (
    <>
      <PageHeader title="Repository · Daftar karyawan" subtitle="Kelola data kepegawaian, nilai akhir, dan dokumen pendukung promosi." />
      {sync.failed ? (
        <Notice tone="warn" title={`Data PI Smart terakhir diperbarui ${fmtDateTime(sync.at)}`} className="mb-6">
          Sinkronisasi terbaru gagal. Sistem menggunakan data terakhir yang tersimpan.
        </Notice>
      ) : null}

      <form action="/hr/repository" role="search" className="mb-6 grid gap-4 md:grid-cols-[1fr_20rem_auto]">
        <div>
          <label htmlFor="q" className="sr-only">
            Cari nama atau badge
          </label>
          <input id="q" name="q" defaultValue={sp.q as string | undefined} placeholder="Cari nama atau badge…" className={cn(inputClass, "border-0 py-4")} />
        </div>
        <div>
          <label htmlFor="unit" className="sr-only">
            Unit kerja
          </label>
          <select id="unit" name="unit" defaultValue={unit} className={cn(inputClass, "border-0 py-4 font-medium text-brand")}>
            <option value="">Unit kerja: Semua unit</option>
            {units.map((u) => (
              <option key={u} value={u}>
                Unit kerja: {u}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="rounded-lg bg-brand-soft px-6 py-3 font-semibold text-brand hover:bg-[#d3e7f7]">
          Terapkan
        </button>
      </form>

      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Badge</Th>
              <Th>Nama karyawan</Th>
              <Th>Posisi / unit</Th>
              <Th>Kelengkapan syarat</Th>
              <Th>Aksi</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => {
              const c = completenessLabel(e);
              return (
                <tr key={e.badge}>
                  <Td>{e.badge}</Td>
                  <Td>{e.name}</Td>
                  <Td>
                    {e.position.replace(` ${e.unit}`, "")} / {e.unit}
                  </Td>
                  <Td className={c.ok ? "text-ok" : "text-warn"}>{c.text}</Td>
                  <Td>
                    <Link href={`/hr/repository/${e.badge}`} className="font-semibold text-brand hover:underline">
                      Buka detail
                    </Link>
                  </Td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <Td colSpan={5} className="text-muted">
                  Tidak ada karyawan yang cocok dengan pencarian.
                </Td>
              </tr>
            ) : null}
          </tbody>
        </Table>
        <p className="mt-4 text-[1.1rem] text-muted">
          Menampilkan {rows.length ? `1–${rows.length}` : "0"} dari {all.length} karyawan
        </p>
      </Card>
    </>
  );
}

export default function Page(props: Parameters<typeof RepositoryPage>[0]) {
  return (
    <Suspense fallback={<PageFallback title="Repository · Daftar karyawan" />}>
      <RepositoryPage {...props} />
    </Suspense>
  );
}
