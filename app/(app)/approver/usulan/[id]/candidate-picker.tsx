"use client";

import Link from "next/link";
import { useActionState, useState, type FormEvent } from "react";
import { FormMessage, SubmitButton } from "@/components/forms";
import { Notice, Pill, buttonClass, cn } from "@/components/ui";
import { selectCandidate } from "@/lib/actions";
import type { FormState } from "@/lib/form";
import { CandidateCard, CandidatePanel, CompareModal, type CandidateView } from "./candidate-panel";

/** Direktur Utama: same layout as the note stages (cards left, profile right); choose exactly one candidate. */
export function CandidatePicker({
  proposalId,
  candidates,
  held,
}: {
  proposalId: string;
  candidates: CandidateView[];
  held?: boolean;
}) {
  const [state, action] = useActionState<FormState, FormData>(selectCandidate, {});
  const [chosen, setChosen] = useState("");
  const [view, setView] = useState(candidates[0]?.badge ?? "");
  const [error, setError] = useState("");
  const [compare, setCompare] = useState(false);

  const active = candidates.find((c) => c.badge === view) ?? candidates[0];
  const picked = candidates.find((c) => c.badge === chosen);
  const heldMessage = "Pemilihan menunggu hasil wawancara. Usulan ditahan sampai HR mengunggah hasil wawancara seluruh kandidat.";

  const pick = (badge: string) => {
    if (held) return setError(heldMessage);
    setError("");
    setChosen(badge);
  };

  const onSubmit = (ev: FormEvent<HTMLFormElement>) => {
    if (held) {
      ev.preventDefault();
      setError(heldMessage);
    } else if (!picked) {
      ev.preventDefault();
      setError("Pilih satu kandidat terlebih dahulu, lalu tekan Tetapkan pilihan.");
    } else setError("");
  };

  return (
    <form action={action} onSubmit={onSubmit} noValidate>
      <input type="hidden" name="proposalId" value={proposalId} />
      <input type="hidden" name="badge" value={chosen} />

      <div className="grid gap-6 xl:grid-cols-[22rem_1fr]">
        <div className="space-y-4">
          {candidates.map((c) => (
            <CandidateCard
              key={c.badge}
              c={c}
              active={c.badge === active.badge}
              onOpen={() => setView(c.badge)}
              lead={
                <input
                  type="radio"
                  name="pilih"
                  aria-label={`Pilih ${c.name}`}
                  checked={chosen === c.badge}
                  onChange={() => pick(c.badge)}
                  className="mt-1.5 h-5 w-5 shrink-0 accent-brand"
                />
              }
              extra={
                <>
                  <Pill tone={c.interview.status.startsWith("Hasil") ? "ok" : "neutral"}>
                    {c.interview.status.startsWith("Hasil") ? "Wawancara selesai" : "Wawancara belum ada"}
                  </Pill>
                  <Pill tone="brand">{c.priorNotes.length} catatan</Pill>
                </>
              }
            />
          ))}
          <button type="button" onClick={() => setCompare(true)} className={buttonClass("secondary", "w-full")}>
            Bandingkan kandidat
          </button>
        </div>

        <CandidatePanel c={active} variant="dirut">
          <div className="border-t border-line pt-5">
            <button
              type="button"
              onClick={() => pick(active.badge)}
              className={buttonClass(chosen === active.badge ? "soft" : "primary")}
            >
              {chosen === active.badge ? "✓ Kandidat ini terpilih" : "Pilih kandidat ini"}
            </button>
          </div>
        </CandidatePanel>
      </div>

      <div className="mt-6 rounded-xl bg-white p-6">
        <label htmlFor="note" className="mb-1.5 block text-base font-medium text-muted">
          Catatan Direktur Utama (opsional)
        </label>
        <textarea
          id="note"
          name="note"
          rows={2}
          className="w-full rounded-lg border border-line bg-white px-4 py-3 text-[1.1rem] focus:border-brand"
          placeholder="Contoh: Direkomendasikan untuk promosi karena kompetensi teknis dan kepemimpinan sesuai."
        />
      </div>

      {error ? (
        <div className="mt-4">
          <Notice tone="warn">{error}</Notice>
        </div>
      ) : null}
      <div className="mt-4 empty:hidden">
        <FormMessage state={state} />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <Link href="/approver/antrean" className="font-semibold text-brand hover:underline">
          Kembali ke daftar usulan
        </Link>
        <div className="flex flex-wrap items-center gap-6">
          <p className={cn("text-[1.3rem] font-semibold", !picked && "text-muted")}>
            Kandidat terpilih: {picked?.name ?? "belum ada"}
          </p>
          <SubmitButton pendingText="Menetapkan…">Tetapkan pilihan</SubmitButton>
        </div>
      </div>

      {compare ? <CompareModal candidates={candidates} onClose={() => setCompare(false)} /> : null}
    </form>
  );
}
