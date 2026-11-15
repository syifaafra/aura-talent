import Link from "next/link";
import { Card, CardTitle, EmptyState, PageHeader, Stat } from "@/components/ui";
import { ROLE_LABEL, TODAY, fmtDate, fmtLong } from "@/lib/db";
import { deadlineOf, isOverdue, queueFor, slaText } from "@/lib/queries";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Dasbor Approver · AURA Talent" };

export default async function ApproverDasbor() {
  const { role } = await requireRole("approver");
  const queue = queueFor(role);
  const late = queue.filter(isOverdue);
  const first = queue[0];
  const rest = queue.slice(1);

  return (
    <>
      <PageHeader title="Dasbor · Approver" subtitle={`Ruang keputusan ${ROLE_LABEL[role]} · ${fmtLong(TODAY)}`} />

      <div className="mb-6 grid gap-6 md:grid-cols-2">
        <Stat
          label="Usulan menunggu keputusan Anda"
          value={queue.length}
          note={
            <Link href="/approver/antrean" className="font-semibold text-brand hover:underline">
              Buka antrean persetujuan →
            </Link>
          }
        />
        <Stat
          label="Usulan terlambat"
          value={late.length}
          danger={late.length > 0}
          note={<span className="text-brand">Prioritaskan keputusan melewati SLA</span>}
        />
      </div>

      {first ? (
        <Card tone="soft" className="mb-6">
          <h2 className="text-[1.6rem] font-semibold text-brand">Perlu keputusan Anda</h2>
          <p className="mt-4 text-[1.9rem] font-semibold">
            {first.id} · {first.title} · {first.candidates.length} kandidat
          </p>
          <p className={`mt-3 text-[1.3rem] ${isOverdue(first) ? "text-danger" : "text-muted"}`}>
            {slaText(first)} · Batas waktu {fmtLong(deadlineOf(first))} · Pengusul HR
          </p>
          <Link
            href={`/approver/usulan/${first.id}`}
            className="mt-4 inline-block text-[1.35rem] font-semibold text-brand hover:underline"
          >
            Tinjau usulan dan kirim keputusan →
          </Link>
        </Card>
      ) : (
        <EmptyState title="Tidak ada usulan yang menunggu keputusan Anda">
          Usulan baru akan muncul di sini dan pada notifikasi.
        </EmptyState>
      )}

      {rest.length > 0 ? (
        <Card>
          <CardTitle>Antrean berikutnya</CardTitle>
          <ul className="divide-y divide-line text-[1.3rem]">
            {rest.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                <span>
                  <Link href={`/approver/usulan/${p.id}`} className="hover:text-brand hover:underline">
                    {p.id}
                  </Link>{" "}
                  <span className="ml-4">{p.title}</span>
                </span>
                <span className={isOverdue(p) ? "font-semibold text-danger" : ""}>
                  {slaText(p)} <span className="sr-only">(batas {fmtDate(deadlineOf(p))})</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </>
  );
}
