"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { submitNomination } from "@/lib/actions";
import { MIN_JUSTIFICATION, type FormState } from "@/lib/form";
import type { ReqItem } from "@/lib/queries";
import { FormMessage, SubmitButton } from "./forms";
import { Card, CardTitle } from "./ui";

export function NominationForm({
  mode,
  vacancyId,
  positionTitle,
  vacancyCode,
  closeText,
  candidate,
  items,
  pending,
  backHref,
  backLabel,
  defaultJustification = "",
}: {
  mode: "karyawan" | "atasan";
  vacancyId: string;
  positionTitle: string;
  vacancyCode: string;
  closeText: string;
  candidate: { badge: string; name: string };
  items: ReqItem[];
  pending: string[];
  backHref: string;
  backLabel: string;
  defaultJustification?: string;
}) {
  const [state, action] = useActionState<FormState, FormData>(submitNomination, {});
  const [text, setText] = useState(defaultJustification);
  const self = mode === "karyawan";
  const ok = items.filter((i) => i.state === "Memenuhi" && ["formasi", "mdg", "sanksi", "masakerja", "asesmen", "kinerja"].includes(i.key));
  const long = text.trim().length >= MIN_JUSTIFICATION;

  const checkLabel: Record<string, string> = {
    formasi: "Formasi tersedia",
    mdg: "MDG memenuhi",
    sanksi: "Tidak ada sanksi",
    masakerja: "Sisa masa kerja memenuhi",
    asesmen: "Asesmen direkomendasikan",
    kinerja: "KPI dua tahun tercapai",
  };

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="vacancyId" value={vacancyId} />
      {!self ? <input type="hidden" name="badge" value={candidate.badge} /> : null}
      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <div className="space-y-6">
          <Card>
            <p className="text-[1.5rem] font-semibold text-ink">
              {self ? "Kandidat" : "✓ "}
              {self ? ": " : ""}
              {candidate.name} · {candidate.badge}
              {!self ? " · Bawahan langsung" : ""}
            </p>
            <p className="mt-3 text-[1.1rem] text-muted">
              {self ? "Diri sendiri dipilih otomatis · Tidak dapat diganti" : "Pilih bawahan langsung yang akan dicalonkan"}
            </p>
            <p className="mt-4 text-[1.3rem] font-semibold text-brand">
              Jabatan tujuan (terkunci): {positionTitle}
            </p>
            <p className="mt-3 text-[1.15rem] text-ok">Kategori Match · Lowongan aktif</p>
          </Card>

          <Card>
            <CardTitle>
              <label htmlFor="justification">Justifikasi{self ? " *" : ""}</label>
            </CardTitle>
            <textarea
              id="justification"
              name="justification"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              required
              aria-describedby="just-hint"
              className="w-full resize-y rounded-lg border border-line px-4 py-3 text-[1.2rem] text-ink focus:border-brand"
              placeholder="Jelaskan alasan pencalonan…"
            />
            <p id="just-hint" className={`mt-2 text-base ${long ? "text-ok" : "text-muted"}`}>
              Minimal {MIN_JUSTIFICATION} karakter · Wajib diisi · {text.trim().length} karakter
            </p>
          </Card>
        </div>

        <Card className="flex flex-col">
          <CardTitle>Ringkasan syarat</CardTitle>
          <ul className="space-y-1.5 text-[1.2rem] text-ok">
            {ok.map((i) => (
              <li key={i.key}>✓ {checkLabel[i.key]}</li>
            ))}
          </ul>
          {pending.length > 0 ? (
            <p className="mt-8 text-[1.15rem] text-warn">
              Menunggu: {pending.join(", ").toLowerCase().replace("lhkpn", "LHKPN")}. Tidak menggugurkan pencalonan awal.
            </p>
          ) : null}
          <p className="mt-auto pt-8 text-base text-muted">
            Sumber pencalonan: {self ? "Diri sendiri" : "Atasan Langsung"} · {vacancyCode} · {closeText}
          </p>
        </Card>
      </div>

      <FormMessage state={state} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href={backHref} className="font-semibold text-brand hover:underline">
          {backLabel}
        </Link>
        <SubmitButton disabled={!long} pendingText="Mengirim…">
          Kirim Pencalonan
        </SubmitButton>
      </div>
    </form>
  );
}
