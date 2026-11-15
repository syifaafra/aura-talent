import { NoProfile, profileLine } from "@/components/profile";
import { Card, CardTitle, Notice, PageHeader, Pill, Stat, Table, Td, Th } from "@/components/ui";
import { requireRole } from "@/lib/session";

export const metadata = { title: "KPI · AURA Talent" };

export default async function KpiPage() {
  const { employee: e } = await requireRole("karyawan");
  if (!e) return <NoProfile />;

  const years = [2025, 2024] as const;
  const achieved = years.filter((y) => e.kpi[y] === "Tercapai").length;
  const g = (y: number) => e.grades[y] ?? "Belum diinput";

  return (
    <>
      <PageHeader title="KPI dan nilai akhir kinerja" subtitle={profileLine(e)} />
      <div className="mb-6 grid gap-6 md:grid-cols-3">
        <Stat label="Periode penilaian" value={<span className="text-[1.9rem]">2024 &amp; 2025</span>} note="Dua tahun penilaian terakhir" />
        <Stat
          label="Status capaian KPI"
          value={<span className="text-[1.9rem]">{achieved} dari 2 tahun tercapai</span>}
          note={achieved === 2 ? "Konsisten pada kedua periode" : "Belum konsisten pada kedua periode"}
        />
        <Stat
          label="Nilai akhir kinerja"
          value={<span className="text-[1.9rem]">{g(2024) === "Belum diinput" && g(2025) === "Belum diinput" ? "Belum diinput" : `${g(2024)} / ${g(2025)}`}</span>}
          note={`2024: ${g(2024)} · 2025: ${g(2025)}`}
        />
      </div>

      <Card className="mb-6">
        <CardTitle>Riwayat kinerja dua tahun terakhir</CardTitle>
        <Table>
          <thead className="bg-brand-soft">
            <tr>
              <Th>Periode</Th>
              <Th>Status capaian KPI</Th>
              <Th>Nilai akhir kinerja</Th>
            </tr>
          </thead>
          <tbody>
            {years.map((y) => (
              <tr key={y}>
                <Td className="text-[1.4rem]">{y}</Td>
                <Td>
                  {e.kpi[y] ? (
                    <Pill tone={e.kpi[y] === "Tercapai" ? "ok" : "warn"}>{e.kpi[y]}</Pill>
                  ) : (
                    <span className="text-muted">Belum ada</span>
                  )}
                </Td>
                <Td className={`text-[1.4rem] font-semibold ${e.grades[y] ? "text-brand" : "text-muted"}`}>
                  {g(y)}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
        <p className="mt-3 text-base text-muted">Capaian KPI berasal dari PI Smart; nilai akhir kinerja dikelola oleh HR.</p>
      </Card>

      {achieved === 2 ? (
        <Notice title="KPI tercapai pada kedua tahun penilaian">
          Capaian 2024 dan 2025 telah tercatat. Lihat pemenuhan syarat lainnya pada menu Syarat Promosi.
        </Notice>
      ) : (
        <Notice tone="warn" title="KPI belum tercapai pada kedua tahun penilaian">
          Hubungi HR jika data capaian perlu dikonfirmasi.
        </Notice>
      )}
    </>
  );
}
