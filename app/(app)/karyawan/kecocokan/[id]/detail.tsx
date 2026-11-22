import Link from "next/link";
import { notFound } from "next/navigation";
import { MatchDetail } from "@/components/match-detail";
import { NoProfile } from "@/components/profile";
import { ButtonLink, DisabledButton, PageHeader } from "@/components/ui";
import { isCategoryDeterminable, matchesFor, nominationBlock } from "@/lib/queries";
import { requireRole } from "@/lib/session";

export async function DetailKecocokan({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { employee: e } = await requireRole("karyawan");
  const { id } = await params;
  const sp = await searchParams;
  if (!e) return <NoProfile />;
  if (!isCategoryDeterminable(e)) notFound();
  const row = matchesFor(e).find((m) => m.position.id === id);
  if (!row) notFound();

  const p = row.position;
  const block = nominationBlock(e.badge, p.id);
  // "Calonkan diri" is shown only for an active vacancy in category Match (FR-24).
  const canShow = p.open && row.category === "Match";

  return (
    <>
      <PageHeader
        title="Detail kecocokan jabatan"
        back={
          <Link href="/karyawan/kecocokan" className="hover:underline">
            ← Kecocokan jabatan
          </Link>
        }
        subtitle={`${p.title} · Unit ${p.unit}`}
      />
      <MatchDetail
        e={e}
        row={row}
        area={typeof sp.area === "string" ? sp.area : undefined}
        subject="Anda"
        areaHref={(a) => `/karyawan/kecocokan/${p.id}?area=${encodeURIComponent(a)}`}
        relatedHref={(pid) => `/karyawan/kecocokan/${pid}`}
        footer={
          <>
            {block && canShow ? <p className="text-[1.05rem] text-muted">{block}</p> : null}
            {canShow ? (
              block ? (
                <DisabledButton>Calonkan diri</DisabledButton>
              ) : (
                <ButtonLink href={`/karyawan/pencalonan?jabatan=${p.id}`}>Calonkan diri</ButtonLink>
              )
            ) : null}
          </>
        }
      />
    </>
  );
}
