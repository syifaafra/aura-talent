"use client";

import { useActionState, useState } from "react";
import { selectCandidate } from "@/lib/actions";
import type { FormState } from "@/lib/form";
import { FormMessage, SubmitButton } from "@/components/forms";
import { Modal } from "@/components/modal";
import { buttonClass, cn } from "@/components/ui";

export interface PickerCandidate {
  badge: string;
  name: string;
  position: string;
  score?: number;
  category: string;
  kpi: string;
  assessment: string;
  track: string;
  development: string;
  interview: string;
  notes: Array<{ label: string; text: string }>;
}

export function CandidatePicker({
  proposalId,
  candidates,
  disabled,
}: {
  proposalId: string;
  candidates: PickerCandidate[];
  disabled?: boolean;
}) {
  const [state, action] = useActionState<FormState, FormData>(selectCandidate, {});
  const [badge, setBadge] = useState(candidates[0]?.badge ?? "");
  const [notesFor, setNotesFor] = useState<PickerCandidate | null>(null);
  const chosen = candidates.find((c) => c.badge === badge);

  return (
    <form action={action}>
      <input type="hidden" name="proposalId" value={proposalId} />
      <fieldset disabled={disabled}>
        <legend className="sr-only">Pilih satu kandidat untuk promosi</legend>
        <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
          {candidates.map((c) => {
            const on = c.badge === badge;
            return (
              <div
                key={c.badge}
                className={cn(
                  "overflow-hidden rounded-xl bg-white",
                  on ? "ring-2 ring-brand" : "ring-1 ring-line",
                )}
              >
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-2 px-4 py-2.5 text-base font-semibold",
                    on ? "bg-brand text-white" : "text-muted",
                  )}
                >
                  <input
                    type="radio"
                    name="badge"
                    value={c.badge}
                    checked={on}
                    onChange={() => setBadge(c.badge)}
                    className="h-4 w-4 accent-brand"
                  />
                  {on ? "Kandidat terpilih" : "Pilih kandidat ini"}
                </label>
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[1.6rem] font-semibold">{c.name}</h3>
                    <button
                      type="button"
                      onClick={() => setNotesFor(c)}
                      className="shrink-0 rounded-md bg-warn-soft px-3 py-1.5 text-base font-medium hover:brightness-95"
                    >
                      Lihat Catatan ({c.notes.length})
                    </button>
                  </div>
                  <p className="mt-3 text-[2.6rem] font-semibold leading-none text-brand">
                    {c.score ?? "–"} / 100
                  </p>
                  <p className="mt-2 text-[1.1rem] text-muted">Readiness score · {c.category}</p>
                  <p className="mt-5 text-[1.25rem] font-semibold text-ok">Syarat wajib memenuhi</p>
                  <p className="mt-1 text-[1.1rem]">
                    {c.kpi}
                    <br />
                    {c.assessment}
                  </p>
                  <h4 className="mt-5 text-[1.15rem] font-semibold">Rekam jejak</h4>
                  <p className="text-[1.1rem] text-muted">{c.track}</p>
                  <h4 className="mt-4 text-[1.15rem] font-semibold">Area pengembangan</h4>
                  <p className="text-[1.1rem] text-muted">{c.development}</p>
                  <p className="mt-5 text-base text-brand">Wawancara: {c.interview}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          <label htmlFor="note" className="mb-1.5 block text-base font-medium text-muted">
            Catatan Direktur Utama untuk kandidat terpilih (opsional)
          </label>
          <textarea
            id="note"
            name="note"
            rows={2}
            className="w-full rounded-lg border border-line bg-white px-4 py-3 text-[1.1rem] focus:border-brand"
            placeholder="Contoh: Direkomendasikan untuk promosi karena kompetensi teknis dan leadership sesuai."
          />
        </div>
      </fieldset>

      <div className="mt-4">
        <FormMessage state={state} />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-[1.4rem] font-semibold">Kandidat terpilih: {chosen?.name ?? "—"}</p>
        <SubmitButton disabled={disabled || !chosen} pendingText="Menyimpan…">
          Simpan pilihan &amp; lanjutkan
        </SubmitButton>
      </div>

      {notesFor ? (
        <Modal
          title="Catatan"
          onClose={() => setNotesFor(null)}
          footer={
            <button type="button" onClick={() => setNotesFor(null)} className={buttonClass("secondary")}>
              Tutup
            </button>
          }
        >
          <div className="mb-4 rounded-lg bg-canvas px-4 py-3">
            <p className="text-[1.15rem] font-semibold">
              {notesFor.name} · {notesFor.badge}
            </p>
            <p className="text-base text-muted">{notesFor.position}</p>
          </div>
          {notesFor.notes.length === 0 ? (
            <p className="text-[1.1rem] text-muted">Belum ada catatan untuk kandidat ini.</p>
          ) : (
            <ul className="space-y-3">
              {notesFor.notes.map((n) => (
                <li key={n.label} className="rounded-lg bg-brand-soft px-4 py-3">
                  <p className="font-semibold text-brand">{n.label}</p>
                  <p className="mt-1 text-[1.1rem] leading-relaxed">{n.text}</p>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      ) : null}
    </form>
  );
}
