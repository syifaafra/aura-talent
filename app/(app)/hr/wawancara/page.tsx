import { Suspense } from "react";
import { PageFallback } from "@/components/page-fallback";
import Link from "next/link";
import { EmptyState, PageHeader, cn } from "@/components/ui";
import { db } from "@/lib/db";
import { getEmployee, inApproval } from "@/lib/queries";
import { requireRole } from "@/lib/session";
import { InterviewForm } from "./interview-form";

export const metadata = { title: "Jadwal wawancara · AURA Talent" };

function addMinutes(time: string, mins: number) {
  const [h, m] = time.split(":").map(Number);
  const t = h * 60 + m + mins;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

async function WawancaraPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole("hr");
  const sp = await searchParams;
  const store = db();
  const candidates = store.proposals.filter(inApproval);
  const proposal =
    candidates.find((p) => p.id === sp.usulan) ??
    candidates.find((p) => !store.interviews.some((i) => i.proposalId === p.id)) ??
    candidates[0];

  if (!proposal) {
    return (
      <>
        <PageHeader title="Penjadwalan wawancara" />
        <EmptyState title="Belum ada usulan yang perlu dijadwalkan">
          Wawancara dijadwalkan untuk usulan yang sedang berjalan pada jenjang persetujuan.
        </EmptyState>
      </>
    );
  }

  const saved = store.interviews.find((i) => i.proposalId === proposal.id);
  const slots = proposal.candidates.map((c, i) => {
    const s = saved?.slots.find((x) => x.badge === c.badge);
    const start = s?.start ?? addMinutes("09:00", i * 60);
    return {
      badge: c.badge,
      name: getEmployee(c.badge)?.name ?? c.badge,
      start,
      end: s?.end ?? addMinutes(start, 45),
      sent: Boolean(saved),
    };
  });

  return (
    <>
      <PageHeader
        title="Penjadwalan wawancara"
        subtitle={`${proposal.id} · ${proposal.title} · ${proposal.candidates.length} kandidat perlu dijadwalkan`}
      />
      {candidates.length > 1 ? (
        <nav aria-label="Pilih usulan" className="mb-6 flex flex-wrap gap-3">
          {candidates.map((p) => (
            <Link
              key={p.id}
              href={`/hr/wawancara?usulan=${p.id}`}
              aria-current={p.id === proposal.id ? "page" : undefined}
              className={cn(
                "rounded-lg px-4 py-2 text-[1.05rem] font-semibold",
                p.id === proposal.id ? "bg-brand text-white" : "border border-line bg-white text-brand hover:bg-brand-soft",
              )}
            >
              {p.id} · {p.title}
            </Link>
          ))}
        </nav>
      ) : null}
      <InterviewForm
        key={proposal.id}
        proposalId={proposal.id}
        slots={slots}
        initial={{
          date: saved?.date ?? "2026-12-09",
          method: saved?.method ?? "Tatap muka",
          interviewers: saved?.interviewers ?? "Direksi 1, Direksi 2, Direksi 3",
          location: saved?.location ?? "Ruang Rapat SDM",
        }}
      />
    </>
  );
}

export default function Page(props: Parameters<typeof WawancaraPage>[0]) {
  return (
    <Suspense fallback={<PageFallback title="Penjadwalan wawancara" />}>
      <WawancaraPage {...props} />
    </Suspense>
  );
}
