import { Suspense } from "react";
import { PageFallback } from "@/components/page-fallback";
import Link from "next/link";
import { Card, Notice, PageHeader, cn, inputClass } from "@/components/ui";
import { db, fmtLong } from "@/lib/db";
import {
  getEmployee,
  isCategoryDeterminable,
  matchesFor,
  proposalForVacancy,
} from "@/lib/queries";
import { requireRole } from "@/lib/session";
import { ProposalForm, type PoolItem } from "./proposal-form";

export const metadata = { title: "Formulir pencalonan · AURA Talent" };

async function PencalonanHr({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole("hr");
  const sp = await searchParams;
  const store = db();

  // Vacancies that either accept a proposal or already have one.
  const options = store.positions.filter((p) => p.vacancyCode);
  const requested = typeof sp.lowongan === "string" ? sp.lowongan : undefined;
  const position =
    options.find((p) => p.id === requested) ??
    options.find((p) => p.open && !proposalForVacancy(p.id)) ??
    options[0];

  const proposal = proposalForVacancy(position.id);
  const locked = proposal && proposal.stage !== "draft";

  const selector = (
    <form action="/hr/pencalonan" className="mb-6 flex flex-wrap items-end gap-4">
      <div className="min-w-[22rem]">
        <label htmlFor="lowongan" className="mb-1.5 block text-base font-semibold text-muted">
          Jabatan tujuan
        </label>
        <select id="lowongan" name="lowongan" defaultValue={position.id} className={cn(inputClass, "border-brand font-medium")}>
          {options.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} · Lowongan {p.vacancyCode}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="rounded-lg bg-brand-soft px-6 py-3 font-semibold text-brand hover:bg-[#d3e7f7]">
        Tampilkan
      </button>
    </form>
  );

  const header = (
    <PageHeader
      title="Formulir pencalonan"
      subtitle={`Mode HR · ${locked ? `Usulan ${proposal.id}` : proposal ? `Draf usulan ${proposal.id}` : "Usulan baru"} · ${position.title}`}
    />
  );

  const closeText = `Tutup ${position.openUntil ? fmtLong(position.openUntil) : "-"}`;
  const banner = (
    <Card className="mb-6">
      <p className="text-[1.45rem] font-semibold text-brand">
        Jabatan tujuan (terkunci): {position.title} · Lowongan {position.vacancyCode}
      </p>
      <p className="mt-1 text-[1.05rem] text-muted">
        {closeText.replace("Tutup ", "Tutup ")} · HR meninjau kandidat sebelum meneruskan usulan ke VP SDM.
      </p>
    </Card>
  );

  if (locked) {
    return (
      <>
        {header}
        {selector}
        {banner}
        <Notice title={`Usulan ${proposal.id} sudah dikirim`} className="mb-6">
          {proposal.candidates.length} kandidat dikirim ke VP SDM pada {fmtLong(proposal.submittedAt)}. Pencalonan baru untuk jabatan ini tidak dapat dibuat.{" "}
          <Link href={`/hr/persetujuan/${proposal.id}`} className="font-semibold underline">
            Lihat status persetujuan
          </Link>
        </Notice>
        <Card>
          <h2 className="mb-3 text-[1.45rem] font-semibold">Kandidat dalam usulan</h2>
          <ul className="space-y-4 text-[1.2rem]">
            {proposal.candidates.map((c) => {
              const e = getEmployee(c.badge);
              return (
                <li key={c.badge}>
                  <span className="text-brand">✓</span> {e?.name} · Match · {c.source}
                  <p className="ml-6 text-[1.05rem] text-muted">Syarat wajib memenuhi</p>
                </li>
              );
            })}
          </ul>
        </Card>
      </>
    );
  }

  // Talent pool: everyone with complete mandatory data.
  const pool: PoolItem[] = store.employees
    .filter(isCategoryDeterminable)
    .map((e) => {
      const nomination = store.nominations.find((n) => n.badge === e.badge && n.vacancyId === position.id);
      return {
        badge: e.badge,
        name: e.name,
        category: matchesFor(e).find((m) => m.position.id === position.id)?.category ?? "Talenta",
        source: nomination?.source ?? "Ditambahkan HR dari Daftar Talenta",
      };
    });
  const recommended = (store.recommendations[position.id] ?? []).map((r) => r.badge);
  const nominated = store.nominations.filter((n) => n.vacancyId === position.id).map((n) => n.badge);
  const fromParam = typeof sp.pilih === "string" ? sp.pilih.split(",") : [];
  const initial = [
    ...new Set([...(proposal?.candidates.map((c) => c.badge) ?? []), ...fromParam, ...nominated]),
  ].filter((b) => pool.some((p) => p.badge === b));

  return (
    <>
      {header}
      {selector}
      {banner}
      <ProposalForm
        key={position.id}
        vacancyId={position.id}
        vacancyCode={position.vacancyCode ?? ""}
        closeText={closeText}
        pool={pool.map((p) => ({
          ...p,
          source: p.source.startsWith("Ditambahkan")
            ? "Ditambahkan HR dari Daftar Talenta"
            : `Pencalonan ${p.source.toLowerCase()}`,
        }))}
        recommended={recommended}
        initial={initial}
        initialNote={proposal?.hrNote ?? ""}
      />
    </>
  );
}

export default function Page(props: Parameters<typeof PencalonanHr>[0]) {
  return (
    <Suspense fallback={<PageFallback title="Formulir pencalonan" />}>
      <PencalonanHr {...props} />
    </Suspense>
  );
}
