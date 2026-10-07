import { inflateSync } from 'node:zlib';

/**
 * The text PDFKit drew, one string per text operation, in drawing order.
 * PDFKit writes standard-font text as hex strings in TJ arrays (WinAnsi);
 * content streams are deflated.
 */
export function pdfText(pdf: Buffer): string[] {
  const source = pdf.toString('latin1');
  const result: string[] = [];
  const streams = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  for (const match of source.matchAll(streams)) {
    const raw = Buffer.from(match[1] ?? '', 'latin1');
    let content: string;
    try {
      content = inflateSync(raw).toString('latin1');
    } catch {
      content = raw.toString('latin1');
    }
    for (const op of content.matchAll(/\[([^\]]*)\]\s*TJ/g)) {
      const parts = [...(op[1] ?? '').matchAll(/<([0-9a-fA-F]*)>/g)].map((hex) =>
        winAnsi(Buffer.from(hex[1] ?? '', 'hex')),
      );
      result.push(parts.join(''));
    }
  }
  return result;
}

const WIN_ANSI_EXTRA: Record<number, string> = { 0x80: '€', 0x96: '–', 0x97: '—' };

function winAnsi(bytes: Buffer): string {
  return [...bytes].map((b) => WIN_ANSI_EXTRA[b] ?? String.fromCharCode(b)).join('');
}

/** All drawn text joined by newlines, with non-breaking spaces as spaces. */
export function pdfPlainText(pdf: Buffer): string {
  return pdfText(pdf)
    .join('\n')
    .replace(/\u00a0/g, ' ');
}

/** All drawn text on one line: wrapped sentences read as they were written. */
export function pdfFlatText(pdf: Buffer): string {
  return pdfPlainText(pdf).replace(/\s+/g, ' ');
}
