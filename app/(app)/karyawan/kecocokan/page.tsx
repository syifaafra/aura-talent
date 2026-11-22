import { Suspense } from "react";
import { PageFallback } from "@/components/page-fallback";
import { MatchList, parseFilter } from "@/components/match-list";
import { NoProfile, UndeterminedView, profileLine } from "@/components/profile";
import { PageHeader } from "@/components/ui";
import { isCategoryDeterminable } from "@/lib/queries";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Kecocokan jabatan · AURA Talent" };

async function KecocokanPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { employee: e } = await requireRole("karyawan");
  const sp = await searchParams;
  if (!e) return <NoProfile />;

  return (
    <>
      <PageHeader title="Kecocokan jabatan saya" subtitle={profileLine(e)} />
      {isCategoryDeterminable(e) ? (
        <MatchList
        e={e}
        filter={parseFilter(sp.kategori)}
        basePath="/karyawan/kecocokan"
        detailHref={(r) => `/karyawan/kecocokan/${r.position.id}`}
        scope="Jabatan satu level di atas jabatan Anda, dalam rumpun yang sama dengan jabatan kini atau riwayat jabatan Anda."
      />
      ) : (
        <UndeterminedView e={e} />
      )}
    </>
  );
}

export default function Page(props: Parameters<typeof KecocokanPage>[0]) {
  return (
    <Suspense fallback={<PageFallback title="Kecocokan jabatan saya" />}>
      <KecocokanPage {...props} />
    </Suspense>
  );
}
