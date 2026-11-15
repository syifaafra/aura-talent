import { Suspense } from "react";
import { PageFallback } from "@/components/page-fallback";
import { StatusView } from "@/components/status-view";
import { PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { statusRows } from "@/lib/queries";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Status pencalonan · AURA Talent" };

async function StatusBawahan({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user } = await requireRole("atasan");
  const sp = await searchParams;
  const badges = db()
    .employees.filter((e) => e.supervisor === user.badge)
    .map((e) => e.badge);

  return (
    <>
      <PageHeader
        title="Status pencalonan bawahan"
        subtitle="Pantau pencalonan bawahan langsung yang Anda ajukan. Tampilan baca saja."
      />
      <StatusView
        rows={statusRows(badges)}
        selectedKey={typeof sp.usulan === "string" ? sp.usulan : undefined}
        basePath="/atasan/status"
        mode="atasan"
        justSent={sp.dikirim === "1"}
      />
    </>
  );
}

export default function Page(props: Parameters<typeof StatusBawahan>[0]) {
  return (
    <Suspense fallback={<PageFallback title="Status pencalonan bawahan" />}>
      <StatusBawahan {...props} />
    </Suspense>
  );
}
