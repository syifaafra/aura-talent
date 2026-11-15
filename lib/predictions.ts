/** Saved prediction results (UC-05), as of the last repository refresh. */
export const PREDICTION = {
  strategicPositions: 67,
  savedAt: "31 Oktober 2026",
  within6: 3,
  within12: 16,
  outside: 48,
  get total() {
    return this.within6 + this.within12;
  },
  vacancies: [
    { title: "VP Produksi", priority: true, cause: "Pensiun", date: "30/04/2027", range: "≤6 bulan" },
    { title: "SVP Operasi", priority: true, cause: "Akhir masa jabatan", date: "31/07/2027", range: "6–12 bulan" },
    { title: "Manajer Produksi", priority: false, cause: "Rotasi terjadwal", date: "31/08/2027", range: "6–12 bulan" },
  ],
  /** Sample officials, labelled as examples (K-10). */
  demotion: [
    { name: "Pejabat A", position: "VP Produksi" },
    { name: "Pejabat B", position: "SVP Operasi" },
  ],
} as const;
