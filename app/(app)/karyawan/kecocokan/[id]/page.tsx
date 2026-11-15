import { Suspense } from "react";
import { PageFallback } from "@/components/page-fallback";
import { DetailKecocokan } from "./detail";

export const metadata = { title: "Detail kecocokan jabatan · AURA Talent" };

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<PageFallback title="Detail kecocokan jabatan" />}>
      <DetailKecocokan params={params} />
    </Suspense>
  );
}
