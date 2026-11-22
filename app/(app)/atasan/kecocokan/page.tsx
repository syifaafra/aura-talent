import { Suspense } from "react";
import { PageFallback } from "@/components/page-fallback";
import { SubordinateList } from "@/components/subordinate-list";
import { PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Kecocokan bawahan · AURA Talent" };

/** W-16: pick a direct report; opens the same job-match screen used for nominating (Layar B). */
async function KecocokanBawahan({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user } = await requireRole("atasan");
  const sp = await searchParams;
  const subs = db().employees.filter((e) => e.supervisor === user.badge);

  return (
    <>
      <PageHeader
        title="Kecocokan jabatan bawahan"
        subtitle="Pilih bawahan langsung untuk melihat kategori kecocokannya dengan jabatan satu level di atas. Atasan hanya melihat kategori, tanpa angka."
      />
      <SubordinateList subs={subs} q={typeof sp.q === "string" ? sp.q : ""} basePath="/atasan/kecocokan" />
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
