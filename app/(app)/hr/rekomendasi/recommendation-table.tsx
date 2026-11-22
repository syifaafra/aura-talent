"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MAX_CANDIDATES, MIN_CANDIDATES } from "@/lib/form";
import { Card, Notice, Pill, Table, Th, buttonClass, cn } from "@/components/ui";

export interface RecRow {
  badge: string;
  name: string;
  position: string;
  score: number;
  category: string;
  change: "naik" | "turun" | "baru";
  changeBy?: number;
  /** "Diajukan Karyawan" / "Diajukan Atasan" or empty. */
  nominated: string;
  indicators: { asesmen: number; kinerja: number; riwayat: number; pendidikan: number };
  strengths: string;
  gap: string;
  reqMet: number;
  reqTotal: number;
}

const catTone = (c: string) => (c === "Match" ? "ok" : c === "Partial Match" ? "warn" : "danger");

function changeText(r: RecRow) {
  if (r.change === "baru") return "Baru masuk";
  if (!r.changeBy) return "Tetap";
  return `${r.change === "naik" ? "Naik" : "Turun"} ${r.changeBy}`;
}

export function VacancySelect({
  value,
  options,
}: {
  value: string;
  options: Array<{ id: string; title: string }>;
}) {
  const router = useRouter();
  return (
    <select
      aria-label="Jabatan"
      value={value}
      onChange={(e) => router.push(`/hr/rekomendasi?jabatan=${e.target.value}`)}
      className="w-full min-w-[20rem] rounded-lg border border-brand bg-white px-4 py-3 text-[1.1rem] font-medium text-ink"
    >
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.title}
        </option>
      ))}
    </select>
  );
}

export function RecommendationTable({
  rows,
  vacancyId,
  lockedBy,
  versionDate,
}: {
  rows: RecRow[];
  vacancyId: string;
  lockedBy?: string;
  versionDate: string;
}) {
  const router = useRouter();
  const [picked, setPicked] = useState<string[]>([]);
  const [detail, setDetail] = useState(rows[0]?.badge);
  const [message, setMessage] = useState("");
  const active = rows.find((r) => r.badge === detail) ?? rows[0];

  const toggle = (b: string) => setPicked((p) => (p.includes(b) ? p.filter((x) => x !== b) : [...p, b]));

  const compose = () => {
    if (picked.length < MIN_CANDIDATES)
      return setMessage(`Pilih minimal ${MIN_CANDIDATES} kandidat. Saat ini ${picked.length} dipilih.`);
    if (picked.length > MAX_CANDIDATES)
      return setMessage(`Pilih paling banyak ${MAX_CANDIDATES} kandidat. Saat ini ${picked.length} dipilih.`);
    router.push(`/hr/pencalonan?lowongan=${vacancyId}&pilih=${picked.join(",")}`);
  };

  return (
    <div className="space-y-6">
      {lockedBy ? (
        <Notice title={`Usulan ${lockedBy} sudah dikirim`}>
          <Link href={`/hr/persetujuan/${lockedBy}`} className="font-semibold underline">
            Lihat status persetujuan
          </Link>
        </Notice>
      ) : null}

      <Card className="p-2">
        <Table>
          <thead>
            <tr>
              {lockedBy ? null : <Th>Pilih</Th>}
              <Th>#</Th>
              <Th>Kandidat</Th>
              <Th>Readiness score</Th>
              <Th>Perubahan peringkat</Th>
              <Th>Status pencalonan</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const on = detail === r.badge;
              return (
                <tr
                  key={r.badge}
                  onClick={() => setDetail(r.badge)}
                  className={cn("cursor-pointer", on ? "bg-brand-soft shadow-[inset_4px_0_0_var(--color-brand)]" : "bg-white")}
                >
                  {lockedBy ? null : (
                    <td className="px-4 py-4 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={picked.includes(r.badge)}
                        onChange={() => {
                          toggle(r.badge);
                          setMessage("");
                        }}
                        aria-label={`Pilih ${r.name} untuk usulan`}
                        className="h-5 w-5 accent-brand"
                      />
                    </td>
                  )}
                  <td className="px-4 py-4 align-middle text-[1.2rem]">{i + 1}</td>
                  <td className="px-4 py-4 align-middle">
                    <p className="text-[1.2rem] font-semibold">{r.name}</p>
                    <p className="text-base text-muted">{r.position}</p>
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <span className="mr-2 text-[1.2rem] font-semibold text-brand">{r.score} / 100</span>
                    <Pill tone={catTone(r.category)}>{r.category}</Pill>
                  </td>
                  <td className="px-4 py-4 align-middle text-[1.1rem]">{changeText(r)}</td>
                  <td className="px-4 py-4 align-middle">
                    {r.nominated ? <Pill tone="brand">{r.nominated}</Pill> : <span className="text-muted">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>
      <p className="text-base text-muted">
        Semua kandidat sudah memenuhi syarat wajib. Perubahan peringkat dibandingkan versi sebelumnya ({versionDate}).
        Klik baris untuk melihat rincian.
      </p>

      {active ? (
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[1.5rem] font-semibold">Rincian · {active.name}</h2>
              <p className="text-[1.05rem] text-muted">
                {active.position} · NIK {active.badge} · Peringkat {rows.indexOf(active) + 1}
              </p>
            </div>
            <Link href={`/hr/repository/${active.badge}`} className="font-semibold text-brand hover:underline">
              Lihat profil lengkap →
            </Link>
          </div>
          <div className="mt-5 grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 text-[1.15rem] font-semibold">Indikator readiness score (0–100)</h3>
              {(
                [
                  ["Asesmen", active.indicators.asesmen],
                  ["Kinerja", active.indicators.kinerja],
                  ["Riwayat jabatan", active.indicators.riwayat],
                  ["Pendidikan", active.indicators.pendidikan],
                ] as const
              ).map(([label, v]) => (
                <div key={label} className="mb-2 grid grid-cols-[9rem_1fr_3rem] items-center gap-3 text-[1.05rem]">
                  <span>{label}</span>
                  <span className="h-3 overflow-hidden rounded-full bg-canvas">
                    <span className="block h-full rounded-full bg-brand" style={{ width: `${v}%` }} />
                  </span>
                  <span className="text-right font-semibold">{v}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3 text-[1.1rem]">
              <p>
                <span className="font-semibold text-ok">Kekuatan:</span> {active.strengths}
              </p>
              <p>
                <span className="font-semibold text-warn">Gap terbesar:</span> {active.gap}
              </p>
              <p>
                <span className="font-semibold">Syarat wajib:</span> {active.reqMet} dari {active.reqTotal} terpenuhi
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      {lockedBy ? null : (
        <div className="space-y-3">
          {message ? <Notice tone="warn">{message}</Notice> : null}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-[1.1rem] text-muted">
              {picked.length} kandidat dipilih · usulan memuat {MIN_CANDIDATES}–{MAX_CANDIDATES} kandidat
            </p>
            <button type="button" onClick={compose} className={buttonClass("primary")}>
              Susun usulan ({picked.length}) →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
