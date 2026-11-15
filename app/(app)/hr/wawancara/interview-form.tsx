"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { scheduleInterview } from "@/lib/actions";
import type { FormState } from "@/lib/form";
import { FormMessage, SubmitButton } from "@/components/forms";
import { Card, Label, Table, Th, Td, inputClass } from "@/components/ui";

interface Slot {
  badge: string;
  name: string;
  start: string;
  end: string;
  sent: boolean;
}

export function InterviewForm({
  proposalId,
  slots,
  initial,
}: {
  proposalId: string;
  slots: Slot[];
  initial: { date: string; method: string; interviewers: string; location: string };
}) {
  const [state, action] = useActionState<FormState, FormData>(scheduleInterview, {});
  const [v, setV] = useState(initial);
  const [times, setTimes] = useState(slots);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setV((s) => ({ ...s, [k]: e.target.value }));

  const first = times[0]?.start;
  const last = times[times.length - 1]?.end;
  const sent = state.ok ? true : slots.some((s) => s.sent);

  return (
    <form action={action}>
      <input type="hidden" name="proposalId" value={proposalId} />
      <div className="grid gap-6 xl:grid-cols-[1.9fr_1fr]">
        <div className="space-y-6">
          <Card>
            <h2 className="mb-5 text-[1.55rem] font-semibold">Atur jadwal wawancara</h2>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <Label htmlFor="date">Tanggal wawancara</Label>
                <input id="date" name="date" type="date" required value={v.date} onChange={set("date")} className={inputClass} />
              </div>
              <div>
                <Label htmlFor="method">Metode</Label>
                <select id="method" name="method" value={v.method} onChange={set("method")} className={inputClass}>
                  <option>Tatap muka</option>
                  <option>Daring</option>
                </select>
              </div>
              <div>
                <Label htmlFor="interviewers">Pewawancara</Label>
                <input id="interviewers" name="interviewers" required value={v.interviewers} onChange={set("interviewers")} className={inputClass} />
              </div>
              <div>
                <Label htmlFor="location">Lokasi / tautan pertemuan</Label>
                <input id="location" name="location" required value={v.location} onChange={set("location")} className={inputClass} />
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 text-[1.55rem] font-semibold">Kandidat &amp; waktu wawancara</h2>
            <Table>
              <thead className="bg-brand-soft">
                <tr>
                  <Th>Kandidat</Th>
                  <Th>Mulai (WIB)</Th>
                  <Th>Selesai (WIB)</Th>
                  <Th>Undangan</Th>
                </tr>
              </thead>
              <tbody>
                {times.map((t, i) => (
                  <tr key={t.badge}>
                    <Td className="font-medium">{t.name}</Td>
                    <Td>
                      <label className="sr-only" htmlFor={`start-${t.badge}`}>
                        Mulai {t.name}
                      </label>
                      <input
                        id={`start-${t.badge}`}
                        name={`start-${t.badge}`}
                        type="time"
                        required
                        value={t.start}
                        onChange={(e) =>
                          setTimes((all) => all.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))
                        }
                        className={inputClass}
                      />
                    </Td>
                    <Td>
                      <label className="sr-only" htmlFor={`end-${t.badge}`}>
                        Selesai {t.name}
                      </label>
                      <input
                        id={`end-${t.badge}`}
                        name={`end-${t.badge}`}
                        type="time"
                        required
                        value={t.end}
                        onChange={(e) =>
                          setTimes((all) => all.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)))
                        }
                        className={inputClass}
                      />
                    </Td>
                    <Td className="text-base text-muted">{sent ? "Terkirim" : "Belum dikirim"}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </div>

        <Card tone="soft">
          <h2 className="text-[1.6rem] font-semibold text-brand">Ringkasan jadwal</h2>
          <p className="mt-1 text-base text-muted">{sent ? "Tersimpan · Undangan terkirim" : "Draf · Belum dikirim"}</p>
          <p className="mt-5 text-[1.6rem] font-semibold text-brand">👥 {times.length} kandidat</p>
          <p className="mt-5 text-[1.3rem] leading-relaxed">
            {v.date || "—"}
            <br />
            {first && last ? `${first}–${last} WIB` : "—"}
            <br />
            45 menit per kandidat
          </p>
          <p className="mt-5 text-[1.25rem] font-medium">
            {v.method} · {v.location || "—"}
          </p>
          <p className="mt-5 text-[1.15rem] text-muted">
            Pewawancara
            <br />
            {v.interviewers || "—"}
          </p>
          <p className="mt-5 text-[1.1rem] text-muted">
            Undangan dikirim kepada kandidat dan pewawancara setelah jadwal disimpan.
          </p>
        </Card>
      </div>

      <div className="mt-6 space-y-4">
        <FormMessage state={state} />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/hr/persetujuan" className="font-semibold text-brand hover:underline">
            Kembali ke daftar usulan
          </Link>
          <SubmitButton pendingText="Menyimpan…">Simpan &amp; kirim undangan</SubmitButton>
        </div>
      </div>
    </form>
  );
}
