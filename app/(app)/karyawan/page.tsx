import { Suspense } from "react";
import { PageFallback } from "@/components/page-fallback";
import { MatchList, parseFilter } from "@/components/match-list";
import { NoProfile, SummaryCards, UndeterminedView, profileLine } from "@/components/profile";
import { PageHeader } from "@/components/ui";
import { isCategoryDeterminable } from "@/lib/queries";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Dashboard · AURA Talent" };

async function KaryawanDasbor({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { employee: e } = await requireRole("karyawan");
  const sp = await searchParams;
  if (!e) return <NoProfile />;

  if (!isCategoryDeterminable(e)) {
    return (
      <>
        <PageHeader title="Kecocokan jabatan saya" subtitle={profileLine(e)} />
        <UndeterminedView e={e} />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Dashboard" subtitle={profileLine(e)} />
      <SummaryCards e={e} />
      <MatchList
        e={e}
        filter={parseFilter(sp.kategori)}
        basePath="/karyawan"
        detailHref={(r) => `/karyawan/kecocokan/${r.position.id}`}
        scope="Jabatan satu level di atas jabatan Anda, dalam rumpun yang sama dengan jabatan kini atau riwayat jabatan Anda."
      />
    </>
  );
}

export default function Page(props: Parameters<typeof KaryawanDasbor>[0]) {
  return (
    <Suspense fallback={<PageFallback title="Dashboard" />}>
      <KaryawanDasbor {...props} />
    </Suspense>
  );
}
