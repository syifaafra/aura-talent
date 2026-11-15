import { Suspense } from "react";
import { PageFallback } from "@/components/page-fallback";
import Link from "next/link";
import { Card, Notice, PageHeader, Stat, Table, Tabs, Td, Th } from "@/components/ui";
import { PREDICTION } from "@/lib/predictions";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Prediksi jabatan · AURA Talent" };

async function PrediksiPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole("hr");
  const demosi = (await searchParams).tab === "demosi";

  return (
    <>
      <PageHeader
        title="Prediksi jabatan kosong"
        subtitle={`${PREDICTION.strategicPositions} jabatan strategis · Hasil tersimpan ${PREDICTION.savedAt} · Khusus HR`}
      />
      <Tabs
        items={[
          { label: "Prediksi Kekosongan", href: "/hr/prediksi", active: !demosi },
          { label: "Potensi Demosi", href: "/hr/prediksi?tab=demosi", active: demosi },
        ]}
      />

      {demosi ? (
        <div className="space-y-6">
          <Notice tone="warn" title="Potensi demosi · Pejabat berkinerja rendah dua periode">
            Daftar pejabat dengan kinerja rendah pada kedua periode penilaian. Potensi demosi bukan keputusan demosi.
          </Notice>
          <Card>
            <Table>
              <thead>
                <tr>
                  <Th>Pejabat</Th>
                  <Th>Jabatan saat ini</Th>
                  <Th>Kinerja dua periode</Th>
                  <Th>Status</Th>
                  <Th>Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {PREDICTION.demotion.map((d) => (
                  <tr key={d.name}>
                    <Td>{d.name} · Contoh</Td>
                    <Td>{d.position}</Td>
                    <Td>
                      Periode 1: Rendah
                      <br />
                      Periode 2: Rendah
                    </Td>
                    <Td className="text-warn">Potensi demosi</Td>
                    <Td>
                      <Link href="/hr/repository" className="font-semibold text-brand hover:underline">
                        Tinjau kinerja →
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <p className="mt-4 text-base text-muted">
              {PREDICTION.demotion.length} pejabat contoh · Kinerja rendah pada dua periode · Bukan daftar data belum lengkap
            </p>
          </Card>
          <Card>
            <h2 className="mb-2 text-[1.5rem] font-semibold">Tindak lanjut HR</h2>
            <p className="text-[1.15rem] text-muted">
              Tinjau kinerja kedua periode sesuai ketentuan laporan sebelum menetapkan tindak lanjut terhadap pejabat terkait.
            </p>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Stat value={PREDICTION.within6} label="Diprediksi kosong ≤6 bulan" />
            <Stat value={PREDICTION.within12} label="Diprediksi kosong 6–12 bulan" />
            <Stat value={PREDICTION.outside} label="Di luar rentang 12 bulan" />
          </div>
          <Notice tone="warn">Prediksi terbaru ditunda: perbarui repository. Hasil tersimpan tetap ditampilkan.</Notice>
          <Card>
            <Table>
              <thead>
                <tr>
                  <Th>Jabatan / prioritas</Th>
                  <Th>Penyebab</Th>
                  <Th>Perkiraan kosong</Th>
                  <Th>Status</Th>
                  <Th>Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {PREDICTION.vacancies.map((v) => (
                  <tr key={v.title}>
                    <Td>
                      {v.title}
                      {v.priority ? " · Prioritas" : ""}
                    </Td>
                    <Td>{v.cause}</Td>
                    <Td>{v.date}</Td>
                    <Td>{v.range}</Td>
                    <Td>
                      <Link href="/hr/rekomendasi" className="font-semibold text-brand hover:underline">
                        Lihat rekomendasi
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <p className="mt-4 text-base text-muted">
              Menampilkan {PREDICTION.vacancies.length} contoh dari {PREDICTION.total} jabatan dalam rentang prediksi.
            </p>
          </Card>
        </div>
      )}
    </>
  );
}

export default function Page(props: Parameters<typeof PrediksiPage>[0]) {
  return (
    <Suspense fallback={<PageFallback title="Prediksi jabatan kosong" />}>
      <PrediksiPage {...props} />
    </Suspense>
  );
}
