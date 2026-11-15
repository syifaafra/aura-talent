// Wraps every page in the (app) group in a Suspense boundary so navigations stay
// instant while the page reads `params`, `searchParams`, and the session.
export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="animate-pulse space-y-6">
      <span className="sr-only">Memuat halaman…</span>
      <div className="h-10 w-80 rounded-lg bg-line" />
      <div className="h-5 w-[28rem] max-w-full rounded bg-line" />
      <div className="grid gap-6 md:grid-cols-3">
        <div className="h-36 rounded-xl bg-white" />
        <div className="h-36 rounded-xl bg-white" />
        <div className="h-36 rounded-xl bg-white" />
      </div>
      <div className="h-64 rounded-xl bg-white" />
    </div>
  );
}
