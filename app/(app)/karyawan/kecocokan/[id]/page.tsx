import { Suspense } from "react";
import { PageFallback } from "@/components/page-fallback";
import { DetailKecocokan } from "./detail";

export const metadata = { title: "Detail kecocokan jabatan · AURA Talent" };

export default function Page(props: Parameters<typeof DetailKecocokan>[0]) {
  return (
    <Suspense fallback={<PageFallback title="Detail kecocokan jabatan" />}>
      <DetailKecocokan {...props} />
    </Suspense>
  );
}
