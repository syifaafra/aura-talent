"use client";

import { useActionState, useState } from "react";
import { login } from "@/lib/actions";
import type { FormState } from "@/lib/form";
import { FormMessage, SubmitButton } from "@/components/forms";

const field =
  "w-full rounded-2xl bg-field px-6 py-5 text-[1.5rem] font-light text-slate placeholder:text-slate/80 focus:ring-2 focus:ring-brand";

const DEMO = [
  ["budi", "Karyawan"],
  ["hr", "HR + Karyawan"],
  ["atasan", "Atasan + Karyawan"],
  ["vp", "VP SDM + Atasan + Karyawan"],
  ["svp", "SVP SDM"],
  ["direksi1", "Direksi 1"],
  ["direksi2", "Direksi 2"],
  ["direksi3", "Direksi 3"],
  ["dirut", "Direktur Utama"],
  ["pihc", "PIHC"],
];

const OTHER_EMPLOYEES = ["bhima", "sari", "lukman", "diandra", "maya", "fajar", "citra", "andi"];

export function LoginForm() {
  const [state, action] = useActionState<FormState, FormData>(login, {});
  const [show, setShow] = useState(false);

  return (
    <form action={action} className="space-y-6" noValidate>
      <div>
        <label htmlFor="username" className="sr-only">
          Nama pengguna
        </label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          placeholder="usn123"
          className={field}
          required
        />
      </div>

      <div className="relative">
        <label htmlFor="password" className="sr-only">
          Kata sandi
        </label>
        <input
          id="password"
          name="password"
          type={show ? "text" : "password"}
          autoComplete="current-password"
          placeholder="*********"
          className={`${field} pr-16`}
          required
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          aria-pressed={show}
          className="absolute right-5 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink"
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
            {show ? null : <path d="M3 3l18 18" />}
          </svg>
        </button>
      </div>

      <FormMessage state={state} />

      <SubmitButton className="w-full !rounded-[1.25rem] !py-5 !text-[1.9rem]" pendingText="Memeriksa…">
        Masuk
      </SubmitButton>

      <details className="pt-2 text-base text-slate">
        <summary className="cursor-pointer font-medium">Akun demo</summary>
        <p className="mt-2">
          Kata sandi semua akun: <code className="rounded bg-white px-1.5 py-0.5">password</code>
        </p>
        <ul className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1">
          {DEMO.map(([u, r]) => (
            <li key={u}>
              <code className="rounded bg-white px-1.5 py-0.5">{u}</code> · {r}
            </li>
          ))}
        </ul>
        <p className="mt-2">
          Karyawan lain:{" "}
          {OTHER_EMPLOYEES.map((u, i) => (
            <span key={u}>
              <code className="rounded bg-white px-1">{u}</code>
              {i < OTHER_EMPLOYEES.length - 1 ? ", " : "."}
            </span>
          ))}
        </p>
      </details>
    </form>
  );
}