"use client";

import Link from "next/link";
import { useActionState, useState, type FormEvent } from "react";
import { submitNomination } from "@/lib/actions";
import { MIN_JUSTIFICATION, type FormState } from "@/lib/form";
import type { ReqItem } from "@/lib/queries";
import { FormMessage, SubmitButton } from "./forms";
import { Card, CardTitle, Pill, buttonClass, cn } from "./ui";

export interface NominationPosition {
  id: string;
  title: string;
  unit: string;
  vacancyCode: string;
  closeText: string;
  /** e.g. "sisa 12 hari"; empty when unknown. */
  remaining: string;
  category: string;
  competencies: string[];
  developmentAreas: string[];
}

/**
 * Shared nomination form. Karyawan (Layar B): "Calonkan diri: [jabatan]".
 * Atasan (Layar C): "Calonkan [bawahan]: [jabatan]", with the two-column subject/position card.
 * The submit button is always enabled; validation is shown inline.
 */
export function NominationForm({
  mode,
  position,
  candidate,
  items,
  pending,
  detailHref,
  changeCandidateHref,
  changePositionHref,
  backHref,
}: {
  mode: "karyawan" | "atasan";
  position: NominationPosition;
  candidate: { badge: string; name: string; position: string };
  items: ReqItem[];
  pending: string[];
  detailHref: string;
  changeCandidateHref?: string;
  changePositionHref?: string;
  backHref: string;
}) {
  const [state, action] = useActionState<FormState, FormData>(submitNomination, {});
  const [text, setText] = useState("");
  const [showError, setShowError] = useState(false);
  const self = mode === "karyawan";
  const met = items.filter((i) => i.state === "Memenuhi").length;
  const len = text.trim().length;
  const short = len < MIN_JUSTIFICATION;

  const onSubmit = (ev: FormEvent<HTMLFormElement>) => {
    if (short) {
      ev.preventDefault();
      setShowError(true);
      document.getElementById("justification")?.focus();
    }
  };

  const positionCard = (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-[1.6rem] font-semibold">{position.title}</h2>
        <Pill tone={position.category === "Match" ? "ok" : position.category === "Partial Match" ? "warn" : "danger"}>
          {position.category}
        </Pill>
      </div>
      <p className="mt-1 text-[1.1rem] text-muted">Unit {position.unit}</p>
      <p className="mt-2 text-[1.1rem] text-muted">
        Lowongan {position.vacancyCode} · {position.closeText}
        {position.remaining ? ` (${position.remaining})` : ""}
      </p>
    </>
  );

  return (
    <form action={action} onSubmit={onSubmit} noValidate className="space-y-6">
      <input type="hidden" name="vacancyId" value={position.id} />
      {!self ? <input type="hidden" name="badge" value={candidate.badge} /> : null}

      {self ? (
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>{positionCard}</div>
            <Link href={detailHref} className="font-semibold text-brand hover:underline">
              Lihat kecocokan →
            </Link>
          </div>
          <div className="mt-5 grid gap-6 border-t border-line pt-5 md:grid-cols-2">
            <div>
              <h3 className="text-[1.15rem] font-semibold">Kompetensi yang sesuai</h3>
              <p className="mt-1 text-[1.1rem] text-ok">{position.competencies.join(" · ") || "-"}</p>
            </div>
            <div>
              <h3 className="text-[1.15rem] font-semibold">Development area</h3>
              <p className="mt-1 text-[1.1rem] text-muted">{position.developmentAreas.join(" · ") || "Tidak ada"}</p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <div className="flex items-start justify-between gap-3">
              <p className="text-base font-semibold text-muted">Bawahan yang dicalonkan</p>
              {changeCandidateHref ? (
                <Link href={changeCandidateHref} className="text-base font-semibold text-brand hover:underline">
                  Ganti
                </Link>
              ) : null}
            </div>
            <h2 className="mt-2 text-[1.6rem] font-semibold">{candidate.name}</h2>
            <p className="mt-1 text-[1.1rem] text-muted">
              {candidate.position} · {candidate.badge}
            </p>
          </Card>
          <Card>
            <div className="flex items-start justify-between gap-3">
              <p className="text-base font-semibold text-muted">Jabatan yang dilamar</p>
              {changePositionHref ? (
                <Link href={changePositionHref} className="text-base font-semibold text-brand hover:underline">
                  Ganti
                </Link>
              ) : null}
            </div>
            <div className="mt-2">{positionCard}</div>
          </Card>
        </div>
      )}

      <Card>
        <CardTitle>
          Syarat wajib{self ? "" : ` · ${candidate.name}`}{" "}
          <span className={cn("ml-2 text-[1.15rem] font-semibold", met === items.length ? "text-ok" : "text-warn")}>
            {met} dari {items.length} terpenuhi
          </span>
        </CardTitle>
        <ul className="divide-y divide-line">
          {items.map((i) => (
            <li key={i.key} className="flex items-start gap-3 py-3">
              <span className={cn("mt-0.5 text-[1.2rem] font-bold", i.state === "Memenuhi" ? "text-ok" : "text-warn")}>
                {i.state === "Memenuhi" ? "✓" : "!"}
              </span>
              <div>
                <p className="text-[1.2rem] font-semibold">{i.label}</p>
                <p className="text-base text-muted">{i.detail}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-base text-muted">
          Data bersumber dari HRIS. Hubungi HR bila ada yang tidak sesuai.
        </p>
        <p className="mt-3 rounded-lg bg-canvas px-4 py-3 text-[1.05rem] text-muted">
          Diperiksa HR di tahap berikutnya: wawancara, kesehatan, LHKPN. Tidak menggugurkan pencalonan ini.
          {pending.length > 0 ? ` Saat ini masih menunggu: ${pending.map((x) => (x === "LHKPN" ? x : x.toLowerCase())).join(", ")}.` : ""}
        </p>
      </Card>

      <Card>
        <CardTitle>
          <label htmlFor="justification">Alasan pencalonan *</label>
        </CardTitle>
        <p className="mb-3 text-[1.05rem] text-muted">
          {self
            ? "Jelaskan pengalaman, capaian, dan alasan Anda siap untuk jabatan ini."
            : "Jelaskan kinerja yang Anda amati langsung dan kesiapan bawahan untuk memimpin."}
        </p>
        <textarea
          id="justification"
          name="justification"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          aria-describedby="just-hint"
          aria-invalid={showError && short}
          className={cn(
            "w-full resize-y rounded-lg border px-4 py-3 text-[1.2rem] text-ink focus:border-brand",
            showError && short ? "border-danger" : "border-line",
          )}
          placeholder={
            self
              ? "Contoh: Dua tahun terakhir saya memimpin perbaikan lini produksi dan menurunkan waktu henti mesin…"
              : "Contoh: Selama dua tahun memimpin shift, tim mencapai seluruh target KPI dan ia siap mengambil tanggung jawab lebih besar…"
          }
        />
        <p id="just-hint" className={cn("mt-2 text-base", showError && short ? "text-danger" : "text-muted")}>
          {showError && short
            ? `Alasan pencalonan wajib diisi, minimal ${MIN_JUSTIFICATION} karakter. `
            : `Minimal ${MIN_JUSTIFICATION} karakter. `}
          {len} karakter
        </p>
      </Card>

      <FormMessage state={state} />

      <div className="space-y-3">
        <p className="text-right text-base text-muted">
          Setelah dikirim, Anda bisa memantau tahapnya di Status pencalonan. Keputusan akhir disampaikan melalui SK.
        </p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href={backHref} className={buttonClass("secondary")}>
            Batal
          </Link>
          <SubmitButton pendingText="Mengirim…">Kirim pencalonan</SubmitButton>
        </div>
      </div>
    </form>
  );
}
