import { Suspense } from "react";
import { PageFallback } from "@/components/page-fallback";
import Link from "next/link";
import { Card, EmptyState, PageHeader, cn } from "@/components/ui";
import { db, fmtDate } from "@/lib/db";
import { isCategoryDeterminable, matchesFor, nominationBlock } from "@/lib/queries";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Kecocokan bawahan · AURA Talent" };

async function KecocokanBawahan({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user } = await requireRole("atasan");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.toLowerCase() : "";
  const all = db().employees.filter((e) => e.supervisor === user.badge);
  const subs = all.filter((s) => !q || `${s.name} ${s.badge}`.toLowerCase().includes(q));
  const selected =
    all.find((s) => s.badge === sp.badge) ?? subs.find(isCategoryDeterminable) ?? subs[0];

  return (
    <>
      <PageHeader
        title="Kecocokan jabatan bawahan"
        subtitle="Lihat kategori kecocokan bawahan langsung sebagai bahan pembinaan dan pencalonan."
      />
      {all.length === 0 ? (
        <EmptyState title="Belum ada bawahan langsung">Akun ini tidak memiliki bawahan langsung pada data karyawan.</EmptyState>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_1.75fr]">
          <Card>
            <h2 className="text-[1.5rem] font-semibold">Bawahan langsung</h2>
            <form action="/atasan/kecocokan" role="search" className="mt-3">
              <label htmlFor="q" className="sr-only">
                Cari nama atau badge
              </label>
              <input
                id="q"
                name="q"
                defaultValue={sp.q as string | undefined}
                placeholder="Cari nama atau badge…"
                className="w-full rounded-lg border border-line px-4 py-3 text-[1.1rem]"
              />
            </form>
            <ul className="mt-4 space-y-2">
              {subs.map((s) => {
                const top = matchesFor(s)[0];
                const active = s.badge === selected?.badge;
                return (
                  <li key={s.badge}>
                    <Link
                      href={`/atasan/kecocokan?badge=${s.badge}`}
                      aria-current={active ? "true" : undefined}
                      className={cn("block rounded-lg px-4 py-3", active ? "bg-brand-soft" : "hover:bg-canvas")}
                    >
                      <p className={cn("text-[1.3rem] font-semibold", active && "text-brand")}>
                        {s.name}
                      </p>
                      <p className="text-[1.05rem] text-muted">
                        {s.badge} · {s.unit}
                      </p>
                      <p className={cn("text-[1.1rem]", top ? "text-ok" : "text-muted")}>
                        {isCategoryDeterminable(s)
                          ? top
                            ? `${top.position.title}: ${top.category}`
                            : "Belum ada kecocokan jabatan"
                          : "Kategori belum dapat ditentukan"}
                      </p>
                    </Link>
                  </li>
                );
              })}
              {subs.length === 0 ? <li className="text-muted">Tidak ada bawahan yang cocok.</li> : null}
            </ul>
          </Card>

          {selected ? (
            <div className="space-y-4">
              <Card>
                <h2 className="text-[1.7rem] font-semibold">{selected.name}</h2>
                <p className="mt-1 text-[1.25rem] text-muted">
                  {selected.position} · Rumpun {selected.unit}
                </p>
                {isCategoryDeterminable(selected) ? (
                  <>
                    <p className="mt-3 text-[1.2rem] text-ok">
                      KPI 2024 &amp; 2025: {selected.kpi[2024] === "Tercapai" && selected.kpi[2025] === "Tercapai" ? "Tercapai" : "Belum konsisten"} ·
                      Asesmen: {selected.assessment?.result}
                    </p>
                    <p className="mt-2 text-base text-muted">Syarat wajib: Memenuhi · Tanpa angka readiness score</p>
                  </>
                ) : (
                  <p className="mt-3 text-[1.2rem] text-warn">
                    Kategori belum dapat ditentukan · Data nilai akhir atau asesmen belum lengkap. Hubungi HR.
                  </p>
                )}
              </Card>

              {matchesFor(selected).map((m) => {
                const canNominate = !nominationBlock(selected.badge, m.position.id);
                return (
                  <Card key={m.position.id}>
                    <h3 className="text-[1.5rem] font-semibold">{m.position.title}</h3>
                    <p className="mt-1 text-[1.2rem] text-ok">
                      {m.category} ·{" "}
                      {m.position.open && m.position.openUntil
                        ? `Lowongan aktif sampai ${fmtDate(m.position.openUntil)}`
                        : "Belum ada lowongan aktif"}
                    </p>
                    {canNominate ? (
                      <Link
                        href={`/atasan/pencalonan?badge=${selected.badge}&jabatan=${m.position.id}`}
                        className="mt-3 inline-block text-[1.2rem] font-semibold text-brand hover:underline"
                      >
                        Lihat detail dan calonkan bawahan →
                      </Link>
                    ) : (
                      <p className="mt-3 text-base text-muted">{nominationBlock(selected.badge, m.position.id)}</p>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}

export default function Page(props: Parameters<typeof KecocokanBawahan>[0]) {
  return (
    <Suspense fallback={<PageFallback title="Kecocokan jabatan bawahan" />}>
      <KecocokanBawahan {...props} />
    </Suspense>
  );
}
