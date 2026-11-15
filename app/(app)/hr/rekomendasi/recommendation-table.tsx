"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, DisabledButton, Table, Th, buttonClass, cn } from "@/components/ui";

export interface RecRow {
  badge: string;
  name: string;
  score: number;
  category: string;
  reason: string;
  gap: string;
  change: "naik" | "turun" | "baru";
  changeBy?: number;
  indicators: { asesmen: number; kinerja: number; riwayat: number; pendidikan: number };
  strengths: string;
  development: string;
}

export function RecommendationTable({
  rows,
  vacancyId,
  lockedBy,
}: {
  rows: RecRow[];
  vacancyId: string;
  lockedBy?: string;
}) {
  const [picked, setPicked] = useState<string[]>(rows.slice(0, 2).map((r) => r.badge));
  const [detail, setDetail] = useState(rows[0]?.badge);
  const active = rows.find((r) => r.badge === detail) ?? rows[0];

  const toggle = (b: string) =>
    setPicked((p) => (p.includes(b) ? p.filter((x) => x !== b) : [...p, b]));

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        {lockedBy ? (
          <DisabledButton>Usulan {lockedBy} sudah dikirim</DisabledButton>
        ) : picked.length === 0 ? (
          <DisabledButton>Ajukan Pencalonan →</DisabledButton>
        ) : (
          <Link
            href={`/hr/pencalonan?lowongan=${vacancyId}&pilih=${picked.join(",")}`}
            className={buttonClass("primary")}
          >
            Ajukan Pencalonan → ({picked.length})
          </Link>
        )}
      </div>

      <Card className="p-2">
        <Table>
          <thead>
            <tr>
              <Th>Peringkat</Th>
              <Th>Kandidat</Th>
              <Th>Readiness</Th>
              <Th>Syarat wajib</Th>
              <Th>Alasan / gap terbesar</Th>
              <Th>Perubahan peringkat</Th>
              <Th>
                <span className="sr-only">Pilih</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const on = picked.includes(r.badge);
              return (
                <tr key={r.badge} className={cn(on && "bg-[#cfdceb]/70")}>
                  <td className="px-4 py-4 text-center align-middle text-[1.2rem]">{i + 1}</td>
                  <td className="px-4 py-4 align-middle">
                    <button
                      type="button"
                      onClick={() => setDetail(r.badge)}
                      aria-pressed={detail === r.badge}
                      className="text-left text-[1.2rem] hover:text-brand hover:underline"
                    >
                      {r.name}
                    </button>
                  </td>
                  <td className="px-4 py-4 align-middle text-[1.2rem] font-semibold text-brand">{r.score} / 100</td>
                  <td className="px-4 py-4 align-middle text-[1.15rem] text-ok">Memenuhi</td>
                  <td className="px-4 py-4 align-middle text-[1.1rem]">
                    {r.reason};
                    <br />
                    gap: {r.gap}
                  </td>
                  <td className="px-4 py-4 text-center align-middle text-[1.15rem]">
                    {r.change === "naik" ? (
                      <span className="text-ok">↑ {r.changeBy}</span>
                    ) : r.change === "turun" ? (
                      <span className="text-danger">↓ {r.changeBy}</span>
                    ) : (
                      <span className="text-warn">Baru masuk</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center align-middle">
                    <input
                      type="checkbox"
                      checked={on}
                      disabled={Boolean(lockedBy)}
                      onChange={() => toggle(r.badge)}
                      aria-label={`Pilih ${r.name} untuk diajukan`}
                      className="h-5 w-5 accent-brand"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>

      {active ? (
        <Card>
          <h2 className="text-[1.6rem] font-semibold">Rincian indikator · {active.name}</h2>
          <p className="mt-3 text-[1.2rem] font-medium text-brand">
            Asesmen {active.indicators.asesmen} · Kinerja {active.indicators.kinerja} · Riwayat jabatan{" "}
            {active.indicators.riwayat} · Pendidikan {active.indicators.pendidikan}
          </p>
          <p className="mt-4 text-[1.15rem] leading-relaxed text-muted">
            Kekuatan: {active.strengths}.
            <br />
            Development area: {active.development}.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
