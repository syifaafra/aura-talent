import { Suspense } from "react";
import { redirect } from "next/navigation";
import { GROUP_HOME, roleGroup } from "@/lib/db";
import { readSession } from "@/lib/session";

async function Redirector(): Promise<null> {
  const session = await readSession();
  if (!session) redirect("/login");
  if (!session.role) redirect("/peran");
  redirect(GROUP_HOME[roleGroup(session.role)]);
  return null;
}

export default function Home() {
  return (
    <Suspense fallback={<div className="p-8 text-muted">Memuat…</div>}>
      <Redirector />
    </Suspense>
  );
}
