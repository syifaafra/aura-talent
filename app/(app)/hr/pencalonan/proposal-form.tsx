"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { submitProposal } from "@/lib/actions";
import { MIN_JUSTIFICATION, type FormState } from "@/lib/form";
import { FormMessage, SubmitButton } from "@/components/forms";
import { Card, cn, inputClass } from "@/components/ui";

export interface PoolItem {
  badge: string;
  name: string;
  category: string;
  source: string;
}

export function ProposalForm({
  vacancyId,
  vacancyCode,
  closeText,
  pool,
  recommended,
  initial,
  initialNote,
}: {
  vacancyId: string;
  vacancyCode: string;
  closeText: string;
  pool: PoolItem[];
  recommended: string[];
  initial: string[];
  initialNote: string;
}) {
  const [state, action] = useActionState<FormState, FormData>(submitProposal, {});
  const [selected, setSelected] = useState<string[]>(initial);
  const [tab, setTab] = useState<"rekomendasi" | "talenta">("rekomendasi");
  const [note, setNote] = useState(initialNote);
  const [pick, setPick] = useState("");

  const byBadge = new Map(pool.map((p) => [p.badge, p]));
  const chosen = selected.flatMap((b) => (byBadge.get(b) ? [byBadge.get(b)!] : []));
  const addable = pool.filter((p) => !selected.includes(p.badge));
  const recAddable = addable.filter((p) => recommended.includes(p.badge));
  const add = (b: string) => b && setSelected((s) => (s.includes(b) ? s : [...s, b]));
  const enough = selected.length >= 2;
  const noteOk = note.trim().length >= MIN_JUSTIFICATION;

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="vacancyId" value={vacancyId} />
      {selected.map((b) => (
        <input key={b} type="hidden" name="badge" value={b} />
      ))}

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div className="space-y-6">
          <Card>
            <div role="tablist" aria-label="Sumber kandidat" className="mb-5 flex gap-8 border-b border-line">
              {(
                [
                  ["rekomendasi", "Kandidat rekomendasi"],
                  ["talenta", "Daftar Talenta"],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={tab === k}
                  onClick={() => setTab(k)}
                  className={cn(
                    "-mb-px border-b-[3px] px-1 pb-3 text-[1.25rem] font-semibold",
                    tab === k ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <ul className="space-y-5">
              {chosen.length === 0 ? <li className="text-[1.1rem] text-muted">Belum ada kandidat dipilih.</li> : null}
              {chosen.map((c) => (
                <li key={c.badge} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[1.3rem]">
                      <span className="text-brand">✓</span> {c.name} · {c.category} · {c.source}
                    </p>
                    <p className="ml-6 mt-1 text-[1.05rem] text-muted">Syarat wajib memenuhi</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected((s) => s.filter((x) => x !== c.badge))}
                    className="font-semibold text-danger hover:underline"
                    aria-label={`Batalkan ${c.name}`}
                  >
                    Batalkan
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              {tab === "talenta" ? (
                <div className="flex gap-3">
                  <label htmlFor="talent" className="sr-only">
                    Pilih kandidat dari Daftar Talenta
                  </label>
                  <select
                    id="talent"
                    value={pick}
                    onChange={(e) => setPick(e.target.value)}
                    className={cn(inputClass, "flex-1")}
                  >
                    <option value="">Pilih kandidat dari Daftar Talenta</option>
                    {addable.map((p) => (
                      <option key={p.badge} value={p.badge}>
                        {p.name} · {p.category}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!pick}
                    onClick={() => {
                      add(pick);
                      setPick("");
                    }}
                    className="rounded-lg bg-brand-soft px-5 font-semibold text-brand hover:bg-[#d3e7f7] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Tambah
                  </button>
                </div>
              ) : recAddable.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {recAddable.map((p) => (
                    <button
                      key={p.badge}
                      type="button"
                      onClick={() => add(p.badge)}
                      className="rounded-lg border border-brand px-4 py-2 font-semibold text-brand hover:bg-brand-soft"
                    >
                      + {p.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[1.05rem] text-muted">Semua kandidat rekomendasi sudah dipilih.</p>
              )}
            </div>
          </Card>

          <Card>
            <label htmlFor="note" className="mb-3 block text-[1.4rem] font-semibold">
              Keterangan
            </label>
            <textarea
              id="note"
              name="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="w-full resize-y rounded-lg border border-line px-4 py-3 text-[1.15rem] focus:border-brand"
              placeholder="Alasan pengajuan kandidat…"
            />
            <p className={cn("mt-2 text-base", noteOk ? "text-ok" : "text-muted")}>
              Minimal {MIN_JUSTIFICATION} karakter · Wajib diisi · {note.trim().length} karakter
            </p>
          </Card>
        </div>

        <Card tone="soft" className="flex flex-col">
          <h2 className="mb-4 text-[1.55rem] font-semibold text-brand">Siap dikirim ke VP SDM</h2>
          <p className="space-y-1 text-[1.25rem] leading-relaxed">
            <span className="block">{selected.length} kandidat dipilih</span>
            <span className="block">Syarat wajib: Memenuhi</span>
            <span className="block">Sumber pencalonan tercatat</span>
            <span className="block">Duplikasi kandidat dicegah</span>
          </p>
          <p className="mt-8 text-[1.1rem] leading-relaxed text-muted">
            Dokumen berstatus Menunggu tidak menggugurkan pencalonan awal. Lengkapi sebelum persetujuan akhir PIHC.
          </p>
          {!enough ? (
            <p className="mt-6 text-[1.1rem] text-warn">
              Jika kandidat kurang dari dua, tambah talenta sebelum mengirim usulan.
            </p>
          ) : null}
          <p className="mt-auto pt-6 text-sm text-muted">
            Lowongan {vacancyCode} · {closeText}
          </p>
        </Card>
      </div>

      <FormMessage state={state} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <SubmitButton name="mode" value="save" variant="secondary" pendingText="Menyimpan…">
          Simpan pencalonan
        </SubmitButton>
        <div className="flex items-center gap-4">
          <Link href="/hr/rekomendasi" className="font-semibold text-brand hover:underline">
            Kembali ke rekomendasi
          </Link>
          <SubmitButton name="mode" value="send" disabled={!enough || !noteOk} pendingText="Mengirim…">
            Kirim Usulan
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}
