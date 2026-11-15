import { Suspense } from "react";
import { Shell, ShellFallback } from "@/components/shell";

// Session reads happen at request time, so the chrome streams in behind a
// Suspense boundary while the route itself stays prerenderable.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}
