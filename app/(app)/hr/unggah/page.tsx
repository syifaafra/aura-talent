import { PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/session";
import { ImportForm } from "./import-form";

export const metadata = { title: "Unggah Nilai Akhir · AURA Talent" };

export default async function UnggahPage() {
  await requireRole("hr");
  return (
    <>
      <PageHeader
        title="Unggah Nilai Akhir"
        subtitle="HR · Kelola nilai akhir kinerja (A/B/C/D) karyawan secara massal untuk evaluasi persyaratan promosi."
      />
      <ImportForm />
    </>
  );
}
