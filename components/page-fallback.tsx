import { PageHeader } from "./ui";

/** Suspense fallback: the static page title plus a skeleton approximating the layout. */
export function PageFallback({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} />
      <div role="status" className="animate-pulse space-y-6">
        <span className="sr-only">Memuat…</span>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="h-32 rounded-xl bg-white" />
          <div className="h-32 rounded-xl bg-white" />
          <div className="h-32 rounded-xl bg-white" />
        </div>
        <div className="h-64 rounded-xl bg-white" />
      </div>
    </>
  );
}
