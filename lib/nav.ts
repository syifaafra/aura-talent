import type { RoleGroup } from "./db";

export interface NavItem {
  label: string;
  href: string;
}

/** One menu per role (consistency finding K-02 / K-03). */
export const NAV: Record<RoleGroup, NavItem[]> = {
  karyawan: [
    { label: "Dashboard", href: "/karyawan" },
    { label: "KPI", href: "/karyawan/kpi" },
    { label: "Asesmen", href: "/karyawan/asesmen" },
    { label: "Syarat Promosi", href: "/karyawan/syarat" },
    { label: "Kecocokan jabatan", href: "/karyawan/kecocokan" },
    { label: "Pencalonan saya", href: "/karyawan/pencalonan" },
    { label: "Status pencalonan", href: "/karyawan/status" },
  ],
  atasan: [
    { label: "Dashboard", href: "/atasan" },
    { label: "Kecocokan bawahan", href: "/atasan/kecocokan" },
    { label: "Pencalonan bawahan", href: "/atasan/pencalonan" },
    { label: "Status pencalonan", href: "/atasan/status" },
  ],
  hr: [
    { label: "Dashboard", href: "/hr" },
    { label: "Repository", href: "/hr/repository" },
    { label: "Prediksi jabatan", href: "/hr/prediksi" },
    { label: "Rekomendasi kandidat", href: "/hr/rekomendasi" },
    { label: "Susun usulan", href: "/hr/pencalonan" },
    { label: "Status persetujuan", href: "/hr/persetujuan" },
    { label: "Jadwal wawancara", href: "/hr/wawancara" },
    { label: "Unggah Nilai Akhir", href: "/hr/unggah" },
  ],
  approver: [
    { label: "Dashboard", href: "/approver" },
    { label: "Menunggu keputusan", href: "/approver/antrean" },
    { label: "Riwayat persetujuan", href: "/approver/riwayat" },
  ],
};
