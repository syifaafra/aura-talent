export interface FormState {
  error?: string;
  ok?: string;
}

export interface ImportRow {
  line: number;
  badge: string;
  name?: string;
  year: string;
  period: string;
  kpi: string;
  grade: string;
  error?: string;
}

export interface ImportState {
  error?: string;
  ok?: string;
  rows?: ImportRow[];
}

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MIN_JUSTIFICATION = 50;
