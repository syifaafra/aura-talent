"use client";

import { useActionState, useState, type ReactNode } from "react";
import {
  saveFinalGrade,
  saveHealth,
  uploadAssessmentReport,
  uploadInterviewResult,
  uploadLhkpn,
} from "@/lib/actions";
import type { FormState } from "@/lib/form";
import { FormMessage, SubmitButton } from "./forms";
import { Modal } from "./modal";
import { Label, buttonClass, inputClass } from "./ui";

export type ReqKind = "grade" | "assessment" | "interview" | "health" | "lhkpn";

interface Emp {
  badge: string;
  name: string;
  position: string;
  health?: string;
}

const META: Record<
  ReqKind,
  { title: string; subtitle: string; submit: string; action: (s: FormState, f: FormData) => Promise<FormState> }
> = {
  grade: {
    title: "Nilai Akhir Kinerja",
    subtitle: "Nilai Akhir Kinerja (KPI)",
    submit: "Simpan",
    action: saveFinalGrade,
  },
  assessment: {
    title: "Unggah laporan asesmen",
    subtitle: "Laporan hasil asesmen asesor / psikolog",
    submit: "Unggah dokumen",
    action: uploadAssessmentReport,
  },
  interview: {
    title: "Unggah hasil wawancara",
    subtitle: "Dokumen hasil wawancara dalam format PDF",
    submit: "Unggah dokumen",
    action: uploadInterviewResult,
  },
  health: {
    title: "Catat rekomendasi kesehatan",
    subtitle: "Hanya status rekomendasi yang disimpan",
    submit: "Simpan status",
    action: saveHealth,
  },
  lhkpn: {
    title: "Unggah bukti LHKPN",
    subtitle: "Bukti pelaporan LHKPN dalam format PDF",
    submit: "Unggah dokumen",
    action: uploadLhkpn,
  },
};

function EmpCard({ emp }: { emp: Emp }) {
  return (
    <div className="mb-5 rounded-lg bg-canvas px-4 py-3">
      <p className="text-[1.1rem] font-semibold">
        {emp.name} · {emp.badge}
      </p>
      <p className="text-base text-muted">{emp.position}</p>
    </div>
  );
}

function FileField({ hint }: { hint: string }) {
  return (
    <div>
      <Label htmlFor="file" required>
        Dokumen pendukung
      </Label>
      <div className="rounded-lg border border-dashed border-brand/50 bg-canvas/60 p-5">
        <p className="mb-3 text-base text-muted">PDF · Maksimal 10 MB · 1 dokumen</p>
        <input
          id="file"
          name="file"
          type="file"
          accept="application/pdf,.pdf"
          required
          className="block w-full text-base file:mr-4 file:rounded-lg file:border file:border-line file:bg-white file:px-4 file:py-2 file:font-semibold file:text-brand"
        />
      </div>
      <p className="mt-2 text-sm text-muted">{hint}</p>
    </div>
  );
}

function ReqModal({ kind, emp, onClose }: { kind: ReqKind; emp: Emp; onClose: () => void }) {
  const meta = META[kind];
  const [state, action] = useActionState<FormState, FormData>(meta.action, {});
  const [valid, setValid] = useState(false);
  const done = Boolean(state.ok);

  let fields: ReactNode;
  switch (kind) {
    case "grade":
      fields = (
        <>
          <div>
            <Label htmlFor="grade" required>
              Nilai
            </Label>
            <input
              id="grade"
              name="grade"
              maxLength={1}
              pattern="[AaBbCcDd]"
              placeholder="A / B / C / D"
              required
              className={`${inputClass} uppercase`}
            />
          </div>
          <div>
            <Label htmlFor="year" required>
              Tahun
            </Label>
            <input id="year" name="year" type="number" min={2020} max={2026} defaultValue={2025} required className={inputClass} />
          </div>
        </>
      );
      break;
    case "assessment":
      fields = (
        <>
          <div className="rounded-lg bg-brand-soft px-4 py-3 text-base text-brand">
            <p className="font-semibold">Ketentuan dokumen</p>
            <p className="mt-0.5 text-ink">
              Laporan resmi asesor atau psikolog yang memuat identitas karyawan, hasil asesmen, dan rekomendasi. Pastikan seluruh halaman terbaca.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="assessor" required>
                Nama asesor / psikolog
              </Label>
              <input id="assessor" name="assessor" placeholder="Masukkan nama asesor / psikolog" required className={inputClass} />
            </div>
            <div>
              <Label htmlFor="date" required>
                Tanggal asesmen
              </Label>
              <input id="date" name="date" type="date" required className={inputClass} />
            </div>
          </div>
          <FileField hint="Pastikan dokumen lengkap, terbaca, dan tidak dilindungi kata sandi." />
        </>
      );
      break;
    case "interview":
      fields = <FileField hint="Ganti dokumen yang tidak valid dengan PDF hasil wawancara." />;
      break;
    case "lhkpn":
      fields = <FileField hint="Bukti pelaporan hanya wajib untuk jabatan BOD-1 / BOD-2." />;
      break;
    case "health":
      fields = (
        <>
          <div className="rounded-lg bg-brand-soft px-4 py-3 text-base">
            <p className="font-semibold text-brand">NFR-SC-06 · Privasi data kesehatan</p>
            <p className="mt-0.5">
              Simpan hanya Direkomendasikan atau Tidak Direkomendasikan. Tidak menyimpan surat dokter, diagnosis, hasil pemeriksaan, atau rincian medis.
            </p>
          </div>
          <fieldset>
            <legend className="mb-2 text-base font-medium">Status rekomendasi *</legend>
            <div className="space-y-2">
              {["Direkomendasikan", "Tidak Direkomendasikan"].map((s) => (
                <label
                  key={s}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-line px-4 py-3 text-[1.15rem] has-[:checked]:border-brand has-[:checked]:bg-brand-soft"
                >
                  <input type="radio" name="status" value={s} required defaultChecked={emp.health === s} className="accent-brand" />
                  {s}
                </label>
              ))}
            </div>
            <p className="mt-2 text-sm text-muted">Pilih satu status. Tidak ada unggahan atau isian data medis.</p>
          </fieldset>
        </>
      );
      break;
  }

  return (
    <Modal title={meta.title} subtitle={meta.subtitle} onClose={onClose}>
      <form
        action={action}
        onInput={(e) => setValid(e.currentTarget.checkValidity())}
        className="space-y-5"
      >
        <input type="hidden" name="badge" value={emp.badge} />
        <EmpCard emp={emp} />
        {done ? null : fields}
        <FormMessage state={state} />
        {done ? null : <p className="text-sm text-muted">* Wajib diisi. Tombol aktif setelah isian valid.</p>}
        <div className="-mx-8 -mb-5 flex justify-end gap-3 rounded-b-2xl bg-canvas/60 px-8 py-5">
          <button type="button" onClick={onClose} className={buttonClass("secondary")}>
            {done ? "Tutup" : "Batal"}
          </button>
          {done ? null : (
            <SubmitButton disabled={!valid} pendingText="Menyimpan…">
              {meta.submit}
            </SubmitButton>
          )}
        </div>
      </form>
    </Modal>
  );
}

export function ReqAction({ kind, label, emp }: { kind: ReqKind; label: string; emp: Emp }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-brand-soft px-5 py-2.5 text-[1.1rem] font-semibold text-brand hover:bg-[#d3e7f7]"
      >
        {label}
      </button>
      {open ? <ReqModal kind={kind} emp={emp} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
