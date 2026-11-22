"use client";

import type { ReactNode } from "react";
import { Modal } from "@/components/modal";
import { Pill, buttonClass, cn } from "@/components/ui";
import type { CandidateView } from "@/lib/candidate-view";

export type { CandidateView };

const catTone = (c: string) => (c === "Match" ? "ok" : c === "Partial Match" ? "warn" : "danger");

/** Left-hand candidate card shared by the note stages and the Direktur Utama screen. */
export function CandidateCard({
  c,
  active,
  onOpen,
  extra,
  lead,
}: {
  c: CandidateView;
  active: boolean;
  onOpen: () => void;
  extra?: ReactNode;
  /** Radio for Direktur Utama. */
  lead?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl bg-white p-5 ring-1 transition",
        active ? "ring-2 ring-brand" : "ring-line hover:ring-brand/50",
      )}
    >
      <div className="flex items-start gap-3">
        {lead}
        <button type="button" onClick={onOpen} aria-pressed={active} className="min-w-0 flex-1 text-left">
          <p className="text-[1.3rem] font-semibold text-ink">{c.name}</p>
          <p className="mt-0.5 text-base text-muted">{c.position}</p>
          <p className="mt-2 text-[1.9rem] font-semibold leading-none text-brand">
            {c.score ?? "–"}
            <span className="ml-1 text-base font-medium text-muted">/ 100</span>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Pill tone={catTone(c.category)}>{c.category}</Pill>
            <Pill tone={c.reqMet === c.reqs.length ? "ok" : "warn"}>
              Syarat {c.reqMet}/{c.reqs.length}
            </Pill>
            {extra}
          </div>
          <p className="mt-2 text-base text-muted">Sumber: {c.source}</p>
        </button>
      </div>
    </div>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 flex items-center gap-2 text-[1.2rem] font-semibold text-ink">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-soft text-sm text-brand">{n}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

/** Right-hand profile panel, shown in a fixed order so the Approver always finds things in the same place. */
export function CandidatePanel({
  c,
  variant,
  children,
}: {
  c: CandidateView;
  variant: "catatan" | "dirut";
  children?: ReactNode;
}) {
  const career = (
    <>
      <ul className="list-disc space-y-1 pl-5 text-[1.1rem]">
        {c.history.length === 0 ? <li className="list-none text-muted">Belum ada riwayat jabatan sebelumnya.</li> : null}
        {c.history.map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ul>
      <p className="mt-2 text-[1.1rem]">Pendidikan: {c.education}</p>
      <ul className="mt-1 space-y-0.5 text-[1.1rem] text-muted">
        {c.performance.map((x) => (
          <li key={x}>Kinerja {x}</li>
        ))}
      </ul>
      <a
        href={`/approver/cv/${c.badge}`}
        className={cn(buttonClass("secondary"), "mt-3 !px-4 !py-2 text-base")}
        download
      >
        Unduh CV
      </a>
    </>
  );

  const readiness = (
    <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
      <div>
        <p className="text-[2.4rem] font-semibold leading-none text-brand">{c.score ?? "–"}</p>
        <p className="text-base text-muted">Readiness score · {c.category}</p>
      </div>
      <div className="text-[1.1rem]">
        <p>
          <span className="font-semibold text-ok">Kompetensi sesuai:</span> {c.competencies.join(" · ") || "-"}
        </p>
        <p className="mt-1">
          <span className="font-semibold text-warn">Development area:</span>{" "}
          {c.devAreas.length ? c.devAreas.join(" · ") : "tidak ada"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 rounded-xl bg-white p-6">
      <div>
        <h2 className="text-[1.7rem] font-semibold">{c.name}</h2>
        <p className="text-[1.1rem] text-muted">
          {c.position} · NIK {c.badge} · Unit {c.unit}
        </p>
      </div>

      {variant === "catatan" ? (
        <>
          <Section n={1} title="Readiness score untuk jabatan ini">
            {readiness}
          </Section>
          <Section n={2} title="Syarat wajib (PI-SDM-PD-013)">
            <ul className="divide-y divide-line">
              {c.reqs.map((r) => (
                <li key={r.label} className="flex items-start gap-3 py-2">
                  <span className={cn("font-bold", r.ok ? "text-ok" : "text-warn")}>{r.ok ? "✓" : "!"}</span>
                  <div>
                    <p className="text-[1.1rem] font-semibold">{r.label}</p>
                    <p className="text-base text-muted">{r.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Section>
          <Section n={3} title="Riwayat karier">
            {career}
          </Section>
          <Section n={4} title="Catatan tahap sebelumnya">
            {c.priorNotes.length === 0 ? (
              <p className="text-[1.1rem] text-muted">Belum ada catatan dari tahap sebelumnya.</p>
            ) : (
              <ul className="space-y-2">
                {c.priorNotes.map((n) => (
                  <li key={n.label} className="rounded-md bg-brand-soft px-3 py-2 text-[1.05rem]">
                    <span className="font-semibold text-brand">{n.label}:</span> {n.text}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </>
      ) : (
        <>
          <Section n={1} title="Readiness score dan kompetensi">
            {readiness}
          </Section>
          <Section n={2} title="Hasil wawancara">
            <p className="text-[1.1rem]">{c.interview.status}</p>
            {c.interview.schedule ? <p className="text-base text-muted">{c.interview.schedule}</p> : null}
            {c.interview.file ? <p className="text-base text-brand">Lihat berkas: {c.interview.file}</p> : null}
          </Section>
          <Section n={3} title="Syarat wajib">
            <Pill tone={c.reqMet === c.reqs.length ? "ok" : "warn"}>
              {c.reqMet} dari {c.reqs.length} terpenuhi
            </Pill>
          </Section>
          <Section n={4} title="Riwayat karier">
            {career}
          </Section>
          <Section n={5} title="Catatan jenjang sebelumnya">
            {c.priorNotes.length === 0 ? (
              <p className="text-[1.1rem] text-muted">Belum ada catatan.</p>
            ) : (
              <table className="w-full text-left text-[1.05rem]">
                <thead>
                  <tr className="text-base text-muted">
                    <th className="w-40 py-1 font-semibold">Approver</th>
                    <th className="py-1 font-semibold">Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {c.priorNotes.map((n) => (
                    <tr key={n.label} className="border-t border-line align-top">
                      <td className="py-2 pr-3 font-semibold text-brand">{n.label}</td>
                      <td className="py-2">{n.text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>
        </>
      )}

      {children}
    </div>
  );
}

/** Side-by-side comparison of all candidates. */
export function CompareModal({ candidates, onClose }: { candidates: CandidateView[]; onClose: () => void }) {
  const rows: Array<[string, (c: CandidateView) => ReactNode]> = [
    ["Readiness score", (c) => <b className="text-brand">{c.score ?? "–"} / 100</b>],
    ["Kategori", (c) => c.category],
    ["Syarat wajib", (c) => `${c.reqMet} dari ${c.reqs.length}`],
    ["Kinerja", (c) => c.performance.map((p) => <span key={p} className="block">{p}</span>)],
    ["Development area", (c) => (c.devAreas.length ? c.devAreas.join(", ") : "tidak ada")],
    ["Sumber pengajuan", (c) => c.source],
  ];
  return (
    <Modal
      title="Bandingkan kandidat"
      width="max-w-[64rem]"
      onClose={onClose}
      footer={
        <button type="button" onClick={onClose} className={buttonClass("secondary")}>
          Tutup
        </button>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] border-collapse text-left text-[1.05rem]">
          <thead>
            <tr>
              <th className="py-2 pr-4" />
              {candidates.map((c) => (
                <th key={c.badge} className="px-3 py-2 text-[1.15rem] font-semibold">
                  {c.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, f]) => (
              <tr key={label} className="border-t border-line align-top">
                <th scope="row" className="py-3 pr-4 text-base font-semibold text-muted">
                  {label}
                </th>
                {candidates.map((c) => (
                  <td key={c.badge} className="px-3 py-3">
                    {f(c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
