import { NoProfile, profileLine } from "@/components/profile";
import { Card, CardTitle, EmptyState, PageHeader, Pill } from "@/components/ui";
import { fmtLong } from "@/lib/db";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Asesmen · AURA Talent" };

export default async function AsesmenPage() {
  const { employee: e } = await requireRole("karyawan");
  if (!e) return <NoProfile />;
  const a = e.assessment;

  return (
    <>
      <PageHeader title="Kesimpulan hasil asesmen" subtitle={profileLine(e)} />
      {!a ? (
        <EmptyState title="Hasil asesmen belum tersedia">
          Hubungi HR untuk mengonfirmasi kelengkapan data asesmen Anda.
        </EmptyState>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.9fr_1fr]">
          <Card>
            <p className="text-base text-muted">Kesimpulan asesmen terakhir</p>
            <p className="mt-2 text-[2.1rem] font-semibold text-brand">{a.result}</p>
            <p className="mt-2 text-[1.3rem]">
              {a.result === "Direkomendasikan"
                ? "Hasil asesmen memenuhi syarat asesmen untuk proses promosi."
                : "Hasil asesmen belum memenuhi syarat asesmen untuk proses promosi."}
            </p>
            <p className="mt-5 text-base text-muted">Kesimpulan ini merupakan salah satu persyaratan, bukan keputusan promosi.</p>
          </Card>

          <Card>
            <p className="text-base text-muted">Status asesmen</p>
            <div className="mt-2">
              <Pill tone="ok">Valid</Pill>
            </div>
            <p className="mt-5 text-base text-muted">Pembaruan terakhir</p>
            <p className="mt-1 text-[1.5rem] font-semibold text-brand">{fmtLong(a.validUntil)}</p>
          </Card>

          <Card>
            <CardTitle>Ringkasan hasil asesmen</CardTitle>
            <dl className="divide-y divide-line text-[1.2rem]">
              {[
                ["Karyawan", `${e.name} · ${e.badge}`],
                ["Jabatan saat ini", e.position],
                ["Rumpun jabatan", e.unit],
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-2 py-3.5">
                  <dt className="text-muted">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
              <div className="grid grid-cols-2 py-3.5">
                <dt className="text-muted">Pemenuhan syarat asesmen</dt>
                <dd className={`font-medium ${a.result === "Direkomendasikan" ? "text-ok" : "text-warn"}`}>
                  {a.result === "Direkomendasikan" ? "Memenuhi" : "Belum memenuhi"}
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <CardTitle>Tindak lanjut</CardTitle>
            <ol className="space-y-5 text-[1.15rem]">
              <li>
                <p className="font-semibold text-brand">1. Periksa syarat promosi</p>
                <p className="mt-1 text-muted">Pantau wawancara, kesehatan, dan LHKPN yang masih menunggu.</p>
              </li>
              <li>
                <p className="font-semibold text-brand">2. Konfirmasi melalui HR</p>
                <p className="mt-1 text-muted">Hubungi HR jika kesimpulan atau data asesmen perlu dikonfirmasi.</p>
              </li>
            </ol>
          </Card>
        </div>
      )}
    </>
  );
}
