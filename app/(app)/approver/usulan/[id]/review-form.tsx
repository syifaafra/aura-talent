"use client";

import Link from "next/link";
import { useActionState, useState, type FormEvent } from "react";
import { FormMessage, SubmitButton } from "@/components/forms";
import { Notice, Pill, buttonClass } from "@/components/ui";
import { approveForward } from "@/lib/actions";
import type { FormState } from "@/lib/form";
import { CandidateCard, CandidatePanel, CompareModal, type CandidateView } from "./candidate-panel";

/** VP SDM, SVP SDM, Direksi 1–3: write a note for every candidate, then send all notes at once. */
export function ReviewForm({ proposalId, candidates }: { proposalId: string; candidates: CandidateView[] }) {
  const [state, action] = useActionState<FormState, FormData>(approveForward, {});
  const [notes, setNotes] = useState<Record<string, string>>(() =>
    Object.fromEntries(candidates.map((c) => [c.badge, c.ownNote])),
  );
  const [badge, setBadge] = useState(candidates[0]?.badge ?? "");
  const [error, setError] = useState("");
  const [compare, setCompare] = useState(false);

  const active = candidates.find((c) => c.badge === badge) ?? candidates[0];
  const idx = candidates.findIndex((c) => c.badge === active.badge);
  const next = candidates[idx + 1];
  const filled = candidates.filter((c) => notes[c.badge]?.trim()).length;

  const onSubmit = (ev: FormEvent<HTMLFormElement>) => {
    const missing = candidates.find((c) => !notes[c.badge]?.trim());
    if (missing) {
      ev.preventDefault();
      setBadge(missing.badge);
      setError(`Catatan untuk ${missing.name} belum diisi. Isi catatan semua kandidat sebelum mengirim.`);
      requestAnimationFrame(() => document.getElementById("own-note")?.focus());
    } else setError("");
  };

  return (
    <form action={action} onSubmit={onSubmit} noValidate>
      <input type="hidden" name="proposalId" value={proposalId} />
      {candidates.map((c) => (
        <input key={c.badge} type="hidden" name={`note-${c.badge}`} value={notes[c.badge] ?? ""} />
      ))}

      <Notice className="mb-6">
        Catatan Anda akan dibaca tahap berikutnya dan menjadi bahan pertimbangan Direktur Utama. Semua kandidat tetap
        diteruskan.
      </Notice>

      <div className="grid gap-6 xl:grid-cols-[22rem_1fr]">
        <div className="space-y-4">
          {candidates.map((c) => (
            <CandidateCard
              key={c.badge}
              c={c}
              active={c.badge === active.badge}
              onOpen={() => setBadge(c.badge)}
              extra={notes[c.badge]?.trim() ? <Pill tone="ok">Catatan diisi</Pill> : undefined}
            />
          ))}
          <button type="button" onClick={() => setCompare(true)} className={buttonClass("secondary", "w-full")}>
            Bandingkan kandidat
          </button>
        </div>

        <CandidatePanel c={active} variant="catatan">
          <section>
            <label htmlFor="own-note" className="mb-1.5 block text-[1.2rem] font-semibold">
              Catatan Anda untuk kandidat ini
            </label>
            <textarea
              id="own-note"
              rows={3}
              value={notes[active.badge] ?? ""}
              onChange={(e) => setNotes((n) => ({ ...n, [active.badge]: e.target.value }))}
              placeholder="Tulis pertimbangan Anda: kekuatan, hal yang perlu dikembangkan, atau hal yang perlu diperhatikan."
              className="w-full resize-y rounded-lg border border-line px-4 py-3 text-[1.1rem] focus:border-brand"
            />
            {next ? (
              <button
                type="button"
                onClick={() => setBadge(next.badge)}
                className="mt-3 font-semibold text-brand hover:underline"
              >
                Lanjut ke {next.name} →
              </button>
            ) : null}
          </section>
        </CandidatePanel>
      </div>

      {error ? (
        <div className="mt-4">
          <Notice tone="danger">{error}</Notice>
        </div>
      ) : null}
      <div className="mt-4 empty:hidden">
        <FormMessage state={state} />
      </div>

      <div className="sticky bottom-0 mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white px-6 py-4 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <div className="flex flex-wrap items-center gap-6">
          <Link href="/approver/antrean" className="font-semibold text-brand hover:underline">
            Kembali ke daftar usulan
          </Link>
          <p className="text-[1.1rem] font-medium">
            {filled} dari {candidates.length} catatan terisi
          </p>
        </div>
        <SubmitButton pendingText="Mengirim…">Kirim catatan</SubmitButton>
      </div>

      {compare ? <CompareModal candidates={candidates} onClose={() => setCompare(false)} /> : null}
    </form>
  );
}
