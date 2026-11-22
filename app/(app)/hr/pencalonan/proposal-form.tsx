"use client";

import Link from "next/link";
import { useActionState, useState, type FormEvent } from "react";
import { submitProposal } from "@/lib/actions";
import { MAX_CANDIDATES, MIN_CANDIDATES, MIN_JUSTIFICATION, type FormState } from "@/lib/form";
import { FormMessage, SubmitButton } from "@/components/forms";
import { Card, CardTitle, Notice, Pill, Table, Th, cn, inputClass } from "@/components/ui";

export interface PoolItem {
  badge: string;
  name: string;
  position: string;
  score?: number;
  category: string;
  /** Candidate.source as stored with the proposal. */
  source: string;
  /** Answer of the Atasan Langsung to a self-nomination, or undefined when not applicable. */
  supervisor?: "Diterima atasan" | "Belum direspons atasan";
  recommended: boolean;
  reqMet: number;
  reqTotal: number;
}

const catTone = (c: string) => (c === "Match" ? "ok" : c === "Partial Match" ? "warn" : c === "Less Match" ? "danger" : "neutral");

export function ProposalForm({
  vacancyId,
  pool,
  initial,
  initialNote,
  savedAt,
}: {
  vacancyId: string;
  pool: PoolItem[];
  initial: string[];
  initialNote: string;
  savedAt?: string;
}) {
  const [state, action] = useActionState<FormState, FormData>(submitProposal, {});
  const [selected, setSelected] = useState<string[]>(initial);
  const [tab, setTab] = useState<"rekomendasi" | "talenta">("rekomendasi");
  const [note, setNote] = useState(initialNote);
  const [search, setSearch] = useState("");
  const [problems, setProblems] = useState<string[]>([]);

  const byBadge = new Map(pool.map((p) => [p.badge, p]));
  const chosen = selected.flatMap((b) => (byBadge.get(b) ? [byBadge.get(b)!] : []));
  const recList = pool.filter((p) => p.recommended);
  const talentList = pool.filter((p) => !search || `${p.name} ${p.badge}`.toLowerCase().includes(search.toLowerCase()));

  const countOk = selected.length >= MIN_CANDIDATES && selected.length <= MAX_CANDIDATES;
  const reqOk = chosen.every((c) => c.reqMet === c.reqTotal);
  const noteOk = note.trim().length >= MIN_JUSTIFICATION;
  const checks: Array<[boolean, string, string]> = [
    [countOk, `Jumlah kandidat ${MIN_CANDIDATES}–${MAX_CANDIDATES} (saat ini ${selected.length})`, `Jumlah kandidat harus ${MIN_CANDIDATES}–${MAX_CANDIDATES}; saat ini ${selected.length}`],
    [reqOk, "Semua syarat wajib terpenuhi", "Ada kandidat yang syarat wajibnya belum terpenuhi"],
    [true, "Tidak ada kandidat ganda", ""],
    [noteOk, `Keterangan diisi (min. ${MIN_JUSTIFICATION} karakter)`, `Keterangan usulan wajib diisi, minimal ${MIN_JUSTIFICATION} karakter`],
  ];

  const add = (b: string) => {
    if (selected.includes(b)) return;
    if (selected.length >= MAX_CANDIDATES) {
      setProblems([`Usulan memuat paling banyak ${MAX_CANDIDATES} kandidat. Keluarkan salah satu kandidat dahulu.`]);
      return;
    }
    setProblems([]);
    setSelected((s) => [...s, b]);
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (submitter?.value !== "send") return setProblems([]);
    const missing = checks.filter(([ok]) => !ok).map(([, , msg]) => msg);
    if (missing.length > 0) {
      e.preventDefault();
      setProblems(missing);
    } else setProblems([]);
  };

  const addRow = (p: PoolItem) => (
    <li key={p.badge} className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-[1.15rem] font-semibold">
          {p.name} <span className="font-normal text-muted">· {p.position}</span>
        </p>
        <p className="text-base text-muted">
          {p.score !== undefined ? `${p.score} / 100 · ` : ""}
          {p.category}
        </p>
      </div>
      {selected.includes(p.badge) ? (
        <span className="text-base text-muted">Sudah di usulan</span>
      ) : (
        <button
          type="button"
          onClick={() => add(p.badge)}
          className="rounded-lg border border-brand px-4 py-2 font-semibold text-brand hover:bg-brand-soft"
        >
          + Tambahkan
        </button>
      )}
    </li>
  );

  return (
    <form action={action} onSubmit={onSubmit} noValidate className="space-y-6">
      <input type="hidden" name="vacancyId" value={vacancyId} />
      {selected.map((b) => (
        <input key={b} type="hidden" name="badge" value={b} />
      ))}

      <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
        <div className="space-y-6">
          <Card className="p-2">
            <div className="px-4 pt-4">
              <CardTitle className="mb-0">Kandidat dalam usulan ({chosen.length})</CardTitle>
            </div>
            {chosen.length === 0 ? (
              <p className="px-4 py-5 text-[1.1rem] text-muted">Belum ada kandidat dipilih. Tambahkan dari kartu di bawah.</p>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Kandidat</Th>
                    <Th>Readiness score</Th>
                    <Th>Syarat</Th>
                    <Th>Sumber</Th>
                    <Th>
                      <span className="sr-only">Aksi</span>
                    </Th>
                  </tr>
                </thead>
                <tbody>
                  {chosen.map((c) => (
                    <tr key={c.badge}>
                      <td className="border-t border-line px-4 py-3 align-middle">
                        <p className="text-[1.15rem] font-semibold">{c.name}</p>
                        <p className="text-base text-muted">{c.position}</p>
                      </td>
                      <td className="border-t border-line px-4 py-3 align-middle">
                        <span className="mr-2 font-semibold text-brand">{c.score !== undefined ? `${c.score} / 100` : "–"}</span>
                        <Pill tone={catTone(c.category)}>{c.category}</Pill>
                      </td>
                      <td className={cn("border-t border-line px-4 py-3 align-middle font-semibold", c.reqMet === c.reqTotal ? "text-ok" : "text-warn")}>
                        {c.reqMet === c.reqTotal ? "✓" : "!"} {c.reqMet}/{c.reqTotal}
                      </td>
                      <td className="border-t border-line px-4 py-3 align-middle text-[1.05rem]">
                        {c.source}
                        {c.supervisor ? (
                          <span className="mt-1 block">
                            <Pill tone={c.supervisor === "Diterima atasan" ? "ok" : "warn"}>{c.supervisor}</Pill>
                          </span>
                        ) : null}
                      </td>
                      <td className="border-t border-line px-4 py-3 text-right align-middle">
                        <button
                          type="button"
                          onClick={() => setSelected((s) => s.filter((x) => x !== c.badge))}
                          className="font-semibold text-danger hover:underline"
                          aria-label={`Keluarkan ${c.name} dari usulan`}
                        >
                          Keluarkan
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>

          <Card>
            <CardTitle>Tambah kandidat</CardTitle>
            <div role="tablist" aria-label="Sumber kandidat" className="mb-4 flex gap-8 border-b border-line">
              {(
                [
                  ["rekomendasi", `Rekomendasi AI (${recList.length})`],
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
                    "-mb-px border-b-[3px] px-1 pb-3 text-[1.2rem] font-semibold",
                    tab === k ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            {tab === "talenta" ? (
              <>
                <label htmlFor="cari" className="sr-only">
                  Cari nama atau NIK
                </label>
                <input
                  id="cari"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama atau NIK…"
                  className={cn(inputClass, "mb-2")}
                />
              </>
            ) : null}
            <ul className="divide-y divide-line">{(tab === "rekomendasi" ? recList : talentList).map(addRow)}</ul>
            {(tab === "rekomendasi" ? recList : talentList).length === 0 ? (
              <p className="text-[1.1rem] text-muted">Tidak ada kandidat.</p>
            ) : null}
          </Card>

          <Card>
            <label htmlFor="note" className="mb-1 block text-[1.4rem] font-semibold">
              Keterangan usulan *
            </label>
            <p className="mb-3 text-[1.05rem] text-muted">Jelaskan dasar penyusunan usulan ini untuk dibaca Approver.</p>
            <textarea
              id="note"
              name="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="w-full resize-y rounded-lg border border-line px-4 py-3 text-[1.15rem] focus:border-brand"
              placeholder="Contoh: Ketiga kandidat memenuhi syarat wajib dan memiliki readiness score tertinggi untuk jabatan ini…"
            />
            <p className={cn("mt-2 text-base", noteOk ? "text-ok" : "text-muted")}>
              Minimal {MIN_JUSTIFICATION} karakter · {note.trim().length} karakter
            </p>
          </Card>
        </div>

        <Card tone="soft" className="h-fit">
          <h2 className="mb-4 text-[1.5rem] font-semibold text-brand">Kesiapan usulan</h2>
          <ul className="space-y-3">
            {checks.map(([ok, label]) => (
              <li key={label} className="flex items-start gap-3 text-[1.1rem]">
                <span className={cn("font-bold", ok ? "text-ok" : "text-warn")}>{ok ? "✓" : "!"}</span>
                <span>{label}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[1.05rem] leading-relaxed text-muted">
            Setelah dikirim, usulan masuk ke VP SDM dan kandidat tidak bisa diubah. Wawancara, kesehatan, dan LHKPN tetap
            dilengkapi sebelum persetujuan akhir PIHC.
          </p>
        </Card>
      </div>

      {problems.length > 0 ? (
        <Notice tone="warn" title="Usulan belum bisa dikirim">
          <ul className="list-disc pl-5">
            {problems.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </Notice>
      ) : null}
      <FormMessage state={state} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <SubmitButton name="mode" value="save" variant="secondary" pendingText="Menyimpan…">
            Simpan draf
          </SubmitButton>
          <Link href="/hr/rekomendasi" className="sr-only">
            Kembali
          </Link>
          {savedAt ? <span className="text-base text-muted">Draf tersimpan {savedAt}</span> : null}
        </div>
        <SubmitButton name="mode" value="send" pendingText="Mengirim…">
          Kirim ke VP SDM
        </SubmitButton>
      </div>
    </form>
  );
}
