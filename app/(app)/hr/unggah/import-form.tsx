"use client";

import { useActionState, useState, useTransition, type FormEvent } from "react";
import { confirmImport, validateImport } from "@/lib/actions";
import type { ImportState } from "@/lib/form";
import { SubmitButton } from "@/components/forms";
import { Card, Notice, Table, Td, Th, cn, inputClass } from "@/components/ui";

export function ImportForm() {
  const [state, action] = useActionState<ImportState, FormData>(
    async (prev, fd) =>
      fd.get("intent") === "confirm" ? confirmImport(prev, fd) : validateImport(prev, fd),
    {},
  );
  const [fileName, setFileName] = useState("");
  const [busy, startTransition] = useTransition();

  // Submitted manually (not via `action=`) so React does not reset the file input
  // between "Validasi Data" and "Konfirmasi impor".
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
    startTransition(() => action(fd));
  }
  const rows = state.rows ?? [];
  const bad = rows.filter((r) => r.error).length;
  const good = rows.length - bad;
  const confirmed = Boolean(state.ok);

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.9fr_1fr]">
        <Card>
          <h2 className="mb-5 text-[1.6rem] font-semibold">Impor data nilai akhir</h2>
          <label htmlFor="periode" className="mb-1.5 block text-base font-medium text-muted">
            Periode penilaian *
          </label>
          <select id="periode" name="periode" className={cn(inputClass, "border-0 bg-brand-soft font-medium text-brand")}>
            <option>2025 · Tahunan</option>
            <option>2024 · Tahunan</option>
          </select>

          <div className="mt-6 rounded-lg border border-dashed border-brand p-6">
            <label htmlFor="file" className="text-[1.4rem] font-semibold text-brand">
              Pilih dokumen
            </label>
            <p className="mt-3 text-[1.15rem] text-muted">Tarik dokumen ke sini atau pilih dari perangkat.</p>
            <input
              id="file"
              name="file"
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
              className="mt-3 block w-full text-base file:mr-4 file:rounded-lg file:border-0 file:bg-brand-soft file:px-4 file:py-2 file:font-semibold file:text-brand"
            />
            <p className="mt-3 text-base text-muted">
              CSV · Maksimal 10 MB · {fileName ? `Dokumen dipilih: ${fileName}` : "Belum ada dokumen dipilih"}
            </p>
          </div>

          <a
            href="/hr/unggah/template"
            className="mt-5 inline-block rounded-lg bg-brand-soft px-6 py-3 text-[1.15rem] font-semibold text-brand hover:bg-[#d3e7f7]"
          >
            Unduh Template
          </a>

          <h3 className="mt-7 text-[1.4rem] font-semibold">Validasi sebelum impor</h3>
          <p className="mt-2 text-[1.15rem] text-muted">
            Sistem memeriksa badge, periode, duplikasi, nilai akhir A/B/C/D sebelum data disimpan.
          </p>
        </Card>

        <Card>
          <h2 className="mb-4 text-[1.6rem] font-semibold">Format dan pemrosesan</h2>
          <p className="text-[1.15rem] leading-relaxed text-muted">
            Kolom wajib
            <br />
            Badge · Tahun · Periode
            <br />
            Capaian KPI · Nilai akhir
          </p>
          <ol className="mt-6 space-y-4 text-[1.2rem]">
            <li>1. Unduh dan isi template</li>
            <li>2. Pilih periode dan dokumen</li>
            <li>3. Tinjau hasil validasi</li>
            <li>4. Konfirmasi impor</li>
          </ol>
          <p className="mt-6 text-[1.05rem] text-muted">
            Data yang tidak valid tidak disimpan. Perubahan yang berhasil dicatat dalam audit trail.
          </p>
        </Card>
      </div>

      {state.error ? <Notice tone="danger">{state.error}</Notice> : null}
      {state.ok ? <Notice tone="ok">{state.ok}</Notice> : null}

      {rows.length > 0 ? (
        <Card>
          <h2 className="mb-1 text-[1.45rem] font-semibold">Hasil validasi</h2>
          <p className="mb-3 text-base text-muted">
            {good} baris valid · {bad} baris tidak valid
          </p>
          <Table>
            <thead>
              <tr>
                <Th>Baris</Th>
                <Th>Badge</Th>
                <Th>Nama</Th>
                <Th>Tahun / periode</Th>
                <Th>Capaian KPI</Th>
                <Th>Nilai</Th>
                <Th>Hasil</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.line}>
                  <Td>{r.line}</Td>
                  <Td>{r.badge}</Td>
                  <Td>{r.name ?? "-"}</Td>
                  <Td>
                    {r.year} · {r.period}
                  </Td>
                  <Td>{r.kpi}</Td>
                  <Td>{r.grade}</Td>
                  <Td className={r.error ? "text-danger" : "text-ok"}>{r.error ?? "Valid"}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton name="intent" value="validate" variant={rows.length ? "secondary" : "primary"} disabled={!fileName || busy} pendingText="Memvalidasi…">
          Validasi Data
        </SubmitButton>
        {rows.length > 0 && !confirmed ? (
          <SubmitButton name="intent" value="confirm" disabled={good === 0 || busy} pendingText="Mengimpor…">
            Konfirmasi impor ({good} baris)
          </SubmitButton>
        ) : null}
        {!fileName ? <p className="text-[1.1rem] text-muted">Pilih dokumen KPI terlebih dahulu untuk memulai validasi.</p> : null}
      </div>
    </form>
  );
}
