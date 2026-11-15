import Link from "next/link";
import { Card, PageHeader, Stat } from "@/components/ui";
import { db } from "@/lib/db";
import { isCategoryDeterminable, statusRows } from "@/lib/queries";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Dasbor Atasan · AURA Talent" };

export default async function AtasanDasbor() {
  const { user } = await requireRole("atasan");
  const subs = db().employees.filter((e) => e.supervisor === user.badge);
  const undetermined = subs.filter((s) => !isCategoryDeterminable(s)).length;
  const rows = statusRows(subs.map((s) => s.badge));

  return (
    <>
      <PageHeader
        title="Dasbor Atasan"
        subtitle="Pantau kecocokan jabatan dan pencalonan bawahan langsung Anda."
      />
      <div className="mb-6 grid gap-6 md:grid-cols-3">
        <Stat value={subs.length} label="Bawahan langsung" />
        <Stat value={undetermined} label="Kategori belum dapat ditentukan" tone="warn" note="Data nilai akhir atau asesmen belum lengkap" />
        <Stat value={rows.filter((r) => r.stage !== "selesai").length} label="Pencalonan berjalan" />
      </div>
      <Card>
        <ul className="divide-y divide-line text-[1.25rem]">
          {[
            ["/atasan/kecocokan", "Kecocokan bawahan", "Lihat kategori kecocokan bawahan langsung."],
            ["/atasan/pencalonan", "Pencalonan bawahan", "Calonkan bawahan langsung pada lowongan aktif."],
            ["/atasan/status", "Status pencalonan", "Pantau status pencalonan bawahan (baca saja)."],
          ].map(([href, label, desc]) => (
            <li key={href} className="flex items-center justify-between gap-4 py-4">
              <div>
                <p className="font-semibold">{label}</p>
                <p className="text-[1.05rem] text-muted">{desc}</p>
              </div>
              <Link href={href} className="font-semibold text-brand hover:underline">
                Buka →
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
