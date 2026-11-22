/** Minimal text-only PDF writer (A4, Helvetica) so the prototype can offer "Unduh CV" without a library. */

export interface PdfLine {
  text: string;
  size?: number;
  bold?: boolean;
  /** Extra space above the line, in points. */
  gap?: number;
}

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 50;

const WIN_ANSI: Record<string, number> = { "–": 0x96, "—": 0x97, "·": 0xb7, "’": 0x92, "‘": 0x91, "“": 0x93, "”": 0x94, "•": 0x95 };

function encode(text: string) {
  const bytes: number[] = [];
  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    const b = WIN_ANSI[ch] ?? (code < 256 ? code : ch === "≥" || ch === "≤" ? 0x3d : 0x3f);
    if (b === 0x28 || b === 0x29 || b === 0x5c) bytes.push(0x5c);
    bytes.push(b);
  }
  return Buffer.from(bytes);
}

function wrap(text: string, size: number) {
  const max = Math.floor((PAGE_W - 2 * MARGIN) / (size * 0.52));
  const out: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if (!word) continue;
    if ((line + " " + word).trim().length > max) {
      if (line) out.push(line);
      line = word;
    } else line = (line + " " + word).trim();
  }
  out.push(line);
  return out;
}

export function simplePdf(lines: PdfLine[]): Buffer {
  // Lay lines out onto pages.
  const pages: Array<Array<{ text: string; size: number; bold: boolean; y: number }>> = [[]];
  let y = PAGE_H - MARGIN;
  for (const l of lines) {
    const size = l.size ?? 11;
    const parts = l.text === "" ? [""] : wrap(l.text, size);
    y -= l.gap ?? 0;
    for (const part of parts) {
      const step = size * 1.45;
      if (y - step < MARGIN) {
        pages.push([]);
        y = PAGE_H - MARGIN;
      }
      y -= step;
      pages[pages.length - 1].push({ text: part, size, bold: Boolean(l.bold), y });
    }
  }

  const objects: Buffer[] = [];
  const add = (body: string | Buffer) => {
    objects.push(Buffer.isBuffer(body) ? body : Buffer.from(body, "latin1"));
    return objects.length;
  };
  // 1 catalog, 2 pages root, 3 and 4 fonts; page objects follow.
  add("<< /Type /Catalog /Pages 2 0 R >>");
  add("PAGES");
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  const kids: number[] = [];
  for (const page of pages) {
    const chunks: Buffer[] = [];
    for (const t of page) {
      chunks.push(Buffer.from(`BT /${t.bold ? "F2" : "F1"} ${t.size} Tf ${MARGIN} ${t.y.toFixed(1)} Td (`, "latin1"));
      chunks.push(encode(t.text));
      chunks.push(Buffer.from(") Tj ET\n", "latin1"));
    }
    const stream = Buffer.concat(chunks);
    const content = add(Buffer.concat([Buffer.from(`<< /Length ${stream.length} >>\nstream\n`, "latin1"), stream, Buffer.from("\nendstream", "latin1")]));
    const pageObj = add(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${content} 0 R >>`,
    );
    kids.push(pageObj);
  }
  objects[1] = Buffer.from(`<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(" ")}] /Count ${kids.length} >>`, "latin1");

  const parts: Buffer[] = [Buffer.from("%PDF-1.4\n", "latin1")];
  const offsets: number[] = [];
  let pos = parts[0].length;
  objects.forEach((o, i) => {
    offsets.push(pos);
    const b = Buffer.concat([Buffer.from(`${i + 1} 0 obj\n`, "latin1"), o, Buffer.from("\nendobj\n", "latin1")]);
    parts.push(b);
    pos += b.length;
  });
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const o of offsets) xref += `${String(o).padStart(10, "0")} 00000 n \n`;
  xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${pos}\n%%EOF\n`;
  parts.push(Buffer.from(xref, "latin1"));
  return Buffer.concat(parts);
}
