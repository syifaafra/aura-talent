import type { Employee } from "@/lib/db";
import { fmtLong } from "@/lib/db";
import { hasBothGrades, pendingDocuments } from "@/lib/queries";
import { Card, EmptyState, Notice, DisabledButton, Stat } from "./ui";

export function profileLine(e: Employee) {
  return `${e.name} · ${e.badge} · ${e.position} · Rumpun ${e.unit}`;
}

export function NoProfile() {
  return (
    <EmptyState title="Profil karyawan tidak ditemukan">
      Akun ini belum terhubung dengan data karyawan. Hubungi HR.
    </EmptyState>
  );
}

/** W-15: category cannot be determined because mandatory data is missing. */
export function UndeterminedView({ e }: { e: Employee }) {
  const noGrade = !hasBothGrades(e);
  const reason = noGrade
    ? "Nilai akhir kinerja belum tersedia."
    : "Hasil asesmen belum tersedia.";
  return (
    <div className="space-y-6">
      <Notice tone="warn" title="Kategori belum dapat ditentukan">
        {reason} Kategori akan ditampilkan setelah data lengkap dan dievaluasi ulang.
      </Notice>
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <p className="text-base text-muted">Capaian KPI</p>
          <p className="mt-2 text-[1.5rem] font-semibold text-brand">
            {Object.keys(e.kpi).length ? "Data capaian tersedia" : "Belum tersedia"}
          </p>
          <p className="mt-3 text-base text-muted">
            {noGrade ? "Nilai akhir kinerja belum tersedia" : "Nilai akhir kinerja tersedia"}
          </p>
        </Card>
        <Card>
          <p className="text-base text-muted">Asesmen terakhir</p>
          <p className="mt-2 text-[1.5rem] font-semibold text-brand">
            {e.assessment ? "Data tersedia" : "Belum tersedia"}
          </p>
          <p className="mt-3 text-base text-muted">Konfirmasi kelengkapan melalui HR</p>
        </Card>
        <Card>
          <p className="text-base text-muted">Kategori kecocokan</p>
          <p className="mt-2 text-[1.5rem] font-semibold text-brand">Belum dapat ditentukan</p>
          <p className="mt-3 text-base text-muted">Bukan kategori Less Match</p>
        </Card>
      </div>
      <Card>
        <h2 className="mb-3 text-[1.45rem] font-semibold">Apa yang perlu dilakukan?</h2>
        <ol className="list-inside list-decimal space-y-1 text-[1.15rem] text-muted">
          <li>Hubungi HR untuk melengkapi {noGrade ? "nilai akhir kinerja" : "hasil asesmen"}.</li>
          <li>Periksa ringkasan KPI dan syarat promosi.</li>
          <li>Tunggu pembaruan kategori setelah evaluasi ulang.</li>
        </ol>
      </Card>
      <div className="flex flex-wrap items-center gap-6">
        <DisabledButton>Calonkan Diri</DisabledButton>
        <p className="text-[1.1rem] text-muted">
          Pencalonan belum tersedia karena kategori belum dapat ditentukan.
        </p>
      </div>
    </div>
  );
}

export function SummaryCards({ e }: { e: Employee }) {
  const pending = pendingDocuments(e);
  const kpi = (y: number) => e.kpi[y] ?? "Belum ada";
  const grade = (y: number) => e.grades[y] ?? "Belum diinput";
  return (
    <div className="mb-6 grid gap-6 md:grid-cols-3">
      <Stat
        label="KPI dua tahun terakhir"
        value={<span className="text-[1.5rem]">{`2024: ${kpi(2024)} · 2025: ${kpi(2025)}`}</span>}
        note={`Nilai akhir: ${grade(2024)} / ${grade(2025)}`.replace("Belum diinput / Belum diinput", "Belum diinput")}
      />
      <Stat
        label="Asesmen terakhir"
        value={<span className="text-[1.5rem]">{e.assessment ? "Valid" : "Belum ada"}</span>}
        note={e.assessment ? `Diperbarui ${fmtLong(e.assessment.validUntil)}` : "Hubungi HR"}
      />
      <Stat
        label="Syarat promosi"
        value={
          <span className="text-[1.5rem]">
            {pending.length === 0 ? "Seluruh syarat lengkap" : "Syarat wajib lengkap"}
          </span>
        }
        note={pending.length === 0 ? "Wawancara, kesehatan, LHKPN: Lengkap" : `${pending.join(", ")}: Menunggu`}
      />
    </div>
  );
}
