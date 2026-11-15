import { readSession } from "@/lib/session";

export async function GET() {
  const session = await readSession();
  if (session?.role !== "hr") return new Response("Tidak berwenang", { status: 403 });

  const csv = [
    "Badge,Tahun,Periode,Capaian KPI,Nilai akhir",
    "000005,2024,Tahunan,Tercapai,B",
    "000005,2025,Tahunan,Tercapai,B",
  ].join("\r\n");

  return new Response(`﻿${csv}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="template-nilai-akhir.csv"',
    },
  });
}
