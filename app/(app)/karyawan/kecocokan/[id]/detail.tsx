import Link from "next/link";
import { notFound } from "next/navigation";
import { NoProfile } from "@/components/profile";
import { ButtonLink, Card, CardTitle, DisabledButton, Notice, PageHeader } from "@/components/ui";
import { fmtLong } from "@/lib/db";
import { isCategoryDeterminable, matchesFor, nominationBlock, pendingDocuments } from "@/lib/queries";
import { requireRole } from "@/lib/session";

export async function DetailKecocokan({ params }: { params: Promise<{ id: string }> }) {
  const { employee: e } = await requireRole("karyawan");
  const { id } = await params;
  if (!e) return <NoProfile />;
  if (!isCategoryDeterminable(e)) notFound();
  const row = matchesFor(e).find((m) => m.position.id === id);
  if (!row) notFound();

  const { position: p, category } = row;
  const pending = pendingDocuments(e);
  const block = nominationBlock(e.badge, p.id);
  const labels: Record<string, string> = { Wawancara: "Wawancara", Kesehatan: "rekomendasi kesehatan", LHKPN: "LHKPN" };
  const pendingText = pending.map((x) => labels[x]).join(", ");

  return (
    <>
      <PageHeader
        title="Detail kecocokan jabatan"
        subtitle={
          <>
            <Link href="/karyawan/kecocokan" className="hover:underline">
              Kecocokan jabatan
            </Link>{" "}
            / {p.title} · {p.label}
          </>
        }
      />

      <div className="space-y-6">
        <Card className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-[1.9rem] font-semibold">{p.title}</h2>
            <p className="mt-2 text-[1.25rem] font-medium text-ok">
              Unit {p.unit} · Satu level di atas · Kategori: {category}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-[1.2rem] font-semibold ${p.open ? "text-brand" : "text-warn"}`}>
              {p.open ? "Lowongan aktif" : "Tidak ada lowongan aktif"}
            </p>
            <p className="mt-1 text-[1.1rem] text-muted">
              {p.open && p.openUntil ? `Tutup ${fmtLong(p.openUntil)}` : "Pencalonan belum dibuka"}
            </p>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            <Card>
              <CardTitle>Kompetensi yang sesuai</CardTitle>
              <p className="text-[1.2rem] text-ok">{p.competencies.join(" · ")}</p>
              <h3 className="mt-5 text-[1.25rem] font-semibold">Key strength</h3>
              <p className="mt-2 text-[1.2rem] leading-relaxed">{p.keyStrength}</p>
            </Card>
            {pending.length > 0 ? (
              <Notice tone="warn" title="Syarat yang belum lengkap">
                {pendingText.charAt(0).toUpperCase() + pendingText.slice(1)}: Menunggu.
                <br />
                Tidak menggugurkan pencalonan awal; wajib lengkap sebelum persetujuan final.
              </Notice>
            ) : null}
          </div>

          <Card>
            <CardTitle>Development area</CardTitle>
            <p className="text-[1.3rem] font-semibold text-brand">{p.developmentArea} →</p>
            <p className="mt-2 text-[1.1rem] text-muted">
              Pilih kompetensi untuk melihat jabatan lain yang mensyaratkannya.
            </p>
            <h3 className="mt-6 text-[1.25rem] font-semibold">Jabatan terkait</h3>
            <p className="mt-2 text-[1.2rem]">
              {p.relatedPosition}
              <br />
              Rumpun {p.unit} · Satu level di atas
            </p>
            <Link href="/karyawan/kecocokan" className="mt-6 inline-block text-[1.2rem] font-semibold text-brand hover:underline">
              Lihat kecocokan jabatan →
            </Link>
          </Card>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-5">
          {block ? <p className="text-[1.1rem] text-muted">{block}</p> : null}
          {block ? (
            <DisabledButton>Calonkan Diri</DisabledButton>
          ) : (
            <ButtonLink href={`/karyawan/pencalonan?jabatan=${p.id}`}>Calonkan Diri</ButtonLink>
          )}
        </div>
      </div>
    </>
  );
}
