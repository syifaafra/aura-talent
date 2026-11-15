import Image from "next/image";
import { Footer } from "@/components/shell";
import { LoginForm } from "./login-form";

export const metadata = { title: "Masuk · AURA Talent" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <div className="grid flex-1 lg:grid-cols-[41fr_59fr]">
        <section className="flex flex-col items-center justify-center bg-brand px-8 py-14 text-center text-white">
          <div className="rounded-[15px] bg-white px-10 py-8 shadow-[0_4px_9px_7px_rgba(0,0,0,0.13)]">
            <Image
              src="/brand/logo-card.png"
              alt="Logo Pupuk Sriwidjaja Palembang"
              width={358}
              height={222}
              priority
              className="h-auto w-[20rem]"
            />
          </div>
          <h2 className="mt-10 text-[4rem] font-semibold leading-tight">AURA Talent</h2>
          <p className="mt-16 max-w-[34rem] text-[1.85rem] font-light italic leading-snug">
            Sistem Prediksi Kesiapan dan Suksesi Talenta PT. Pupuk Sriwijaya
          </p>
        </section>

        <section className="flex items-center px-8 py-14 lg:px-[16%]">
          <div className="w-full max-w-[38rem]">
            <p className="text-[3.5rem] font-semibold leading-tight text-slate">Selamat datang di,</p>
            <h1 className="mt-3 text-[4rem] font-semibold leading-tight text-ink">AURA Talent</h1>
            <p className="mb-6 mt-9 text-[2rem] text-slate">Masuk akun anda untuk melanjutkan</p>
            <LoginForm />
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
