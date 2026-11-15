import { Suspense } from "react";
import { PageFallback } from "@/components/page-fallback";
import { NoProfile } from "@/components/profile";
import { StatusView } from "@/components/status-view";
import { PageHeader } from "@/components/ui";
import { statusRows } from "@/lib/queries";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Status pencalonan · AURA Talent" };

async function StatusPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { employee: e } = await requireRole("karyawan");
  const sp = await searchParams;
  if (!e) return <NoProfile />;

  return (
    <>
      <PageHeader
        title="Status pencalonan saya"
        subtitle="Pantau proses pencalonan Anda tanpa mengakses data kandidat lain."
      />
      <StatusView
        rows={statusRows([e.badge])}
        selectedKey={typeof sp.usulan === "string" ? sp.usulan : undefined}
        basePath="/karyawan/status"
        mode="karyawan"
        justSent={sp.dikirim === "1"}
      />
    </>
  );
}

export default function Page(props: Parameters<typeof StatusPage>[0]) {
  return (
    <Suspense fallback={<PageFallback title="Status pencalonan saya" />}>
      <StatusPage {...props} />
    </Suspense>
  );
}
