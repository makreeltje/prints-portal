import PDFDocument from 'pdfkit';
import { formatDate, formatMoney } from '../core/format.js';
import type { DocumentLine, InvoiceDocument } from './invoices.js';

/**
 * Invoice, concept, credit note, reminder and overview PDFs, laid out after
 * design-system DocInvoice, DocReminder and DocOverview (`.pp-paper`): A4, 20 mm margins,
 * black text on white, no fills, status as words. The preview is 794 px wide
 * for 595 pt, so every pixel value there is multiplied by 0.75 here.
 * Built-in Helvetica (tabular digits); tagged PDF with a real table.
 */

const PX = 0.75;
/** Light theme document colours from the DocInvoice spec. */
const INK = '#141a33';
const INK_2 = '#2b3150';
const MUTED = '#586282';
const RULE = '#c9cfdf';
const RULE_FOOTER = '#8b93ad';

const MARGIN = 56.69; // 20 mm
const BODY = 13 * PX;
const LEADING = 19 * PX;
const FOOTER_SIZE = 11 * PX;
const FOOTER_RESERVE = 44;

const REGULAR = 'Helvetica';
const BOLD = 'Helvetica-Bold';

const STATUS: Record<NonNullable<DocumentLine['status']>, string> = {
  paid: 'Betaald',
  open: 'Open',
  partial: 'Deels betaald',
};

export interface RenderOptions {
  /** PNG bytes of the uploaded logo, shown in place of the company name. */
  logo?: Buffer | null;
  /** Fixed creation date, so tests and stored files are reproducible. */
  creationDate?: Date;
}

const day = (isoDate: string) => formatDate(new Date(`${isoDate}T12:00:00Z`));
const money = (cents: number) => formatMoney(cents / 100);

export function documentTitle(document: InvoiceDocument): string {
  switch (document.kind) {
    case 'invoice':
      return `Factuur ${document.number ?? ''}`.trim();
    case 'concept':
      return `Factuur (concept) ${document.customer}`;
    case 'credit':
      return `Creditnota ${document.number ?? ''}`.trim();
    case 'reminder':
      return `Herinnering ${document.customer}`;
    case 'overview':
      return `Overzicht ${document.customer}`;
  }
}

/** Renders one document to PDF bytes. */
export function renderDocument(
  document: InvoiceDocument,
  options: RenderOptions = {},
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A4',
    margin: MARGIN,
    bufferPages: true,
    tagged: true,
    lang: 'nl-NL',
    displayTitle: true,
    pdfVersion: '1.7',
    info: {
      Title: documentTitle(document),
      // Keys must be left out rather than set to undefined: pdfkit builds the
      // file id by calling valueOf() on every info value it finds.
      ...(document.company.name === '' ? {} : { Author: document.company.name }),
      ...(options.creationDate === undefined ? {} : { CreationDate: options.creationDate }),
    },
  });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on('error', reject);
  });
  layout(doc, document, options);
  doc.end();
  return done;
}

type Doc = InstanceType<typeof PDFDocument>;
/** pdfkit's openImage (decodes once, gives the pixel size) is missing from its types. */
interface ImageOpener {
  openImage(src: Buffer): { width: number; height: number };
}
type Struct = ReturnType<Doc['struct']>;

function layout(doc: Doc, document: InvoiceDocument, options: RenderOptions): void {
  const root = doc.struct('Document');
  doc.addStructure(root);
  const width = doc.page.width - 2 * MARGIN;

  header(doc, root, document, options, width);
  if (document.kind === 'concept') band(doc, root, width);
  meta(doc, root, document, width);
  if (document.kind === 'reminder') {
    paragraph(
      doc,
      root,
      `Beste ${document.customer}, volgens onze administratie staan de onderstaande prints nog open. ` +
        'Wil je het bedrag overmaken? Heb je al betaald, dan kun je deze herinnering negeren. ' +
        'Alvast bedankt!',
      width,
    );
  }
  table(doc, root, document, width);
  totals(doc, root, document, width);
  footers(doc, root, document, width);
  root.end();
}

function text(
  doc: Doc,
  parent: Struct,
  type: string,
  value: string,
  x: number,
  y: number,
  options: PDFKit.Mixins.TextOptions & { font?: string; size?: number; color?: string } = {},
): void {
  const { font = REGULAR, size = BODY, color = INK, ...rest } = options;
  parent.add(
    doc.struct(type, {}, () => {
      doc
        .font(font)
        .fontSize(size)
        .fillColor(color)
        .text(value, x, y, { lineGap: 0, ...rest });
    }),
  );
}

/** Lines, rules and other decoration: marked as artifacts, not content. */
function artifact(doc: Doc, draw: () => void): void {
  doc.markContent('Artifact', { type: 'Layout' });
  draw();
  doc.endMarkedContent();
}

function rule(doc: Doc, x: number, y: number, width: number, thickness: number, color: string) {
  artifact(doc, () => {
    doc
      .moveTo(x, y)
      .lineTo(x + width, y)
      .lineWidth(thickness)
      .strokeColor(color)
      .stroke();
  });
}

function header(
  doc: Doc,
  root: Struct,
  document: InvoiceDocument,
  options: RenderOptions,
  width: number,
): void {
  const top = MARGIN;
  const title =
    document.kind === 'credit'
      ? 'Creditnota'
      : document.kind === 'reminder'
        ? 'Herinnering'
        : document.kind === 'overview'
          ? 'Overzicht'
          : 'Factuur';
  const subLine =
    document.kind === 'invoice'
      ? `Factuurnummer ${document.number ?? ''}`
      : document.kind === 'credit'
        ? `Creditnummer ${document.number ?? ''}`
        : document.kind === 'concept'
          ? 'Concept'
          : document.kind === 'overview'
            ? '' // The link label is internal and stays off the klant's copy (GAP-088)
            : 'Openstaande prints';
  text(doc, root, 'H1', title, MARGIN, top, { font: BOLD, size: 28 * PX });
  const subTop = top + 34 * PX + 2 * PX;
  text(doc, root, 'P', subLine, MARGIN, subTop, { color: MUTED });
  let leftBottom = subTop + LEADING;

  // Company block, right-aligned; the logo takes the place of the name.
  const blockWidth = width / 2;
  const x = MARGIN + width - blockWidth;
  let y = top;
  const { company } = document;
  const logo = options.logo ?? null;
  if (logo !== null) {
    const box: [number, number] = [blockWidth, 48];
    const image = (doc as unknown as ImageOpener).openImage(logo);
    const scale = Math.min(box[0] / image.width, box[1] / image.height, 1);
    const w = image.width * scale;
    const h = image.height * scale;
    root.add(
      doc.struct('Figure', { alt: company.name === '' ? 'Logo' : company.name }, () => {
        doc.image(logo, x + blockWidth - w, y, { width: w, height: h });
      }),
    );
    y += h + 4;
  } else if (company.name !== '') {
    text(doc, root, 'P', company.name, x, y, {
      font: BOLD,
      size: 16 * PX,
      width: blockWidth,
      align: 'right',
    });
    y = doc.y;
  }
  const details = [
    ...company.address.split(/\r?\n/).filter((line) => line.trim() !== ''),
    ...(company.email === null || company.email === '' ? [] : [company.email]),
    ...(company.phone === null || company.phone === '' ? [] : [company.phone]),
  ];
  if (details.length > 0) {
    text(doc, root, 'P', details.join('\n'), x, y, {
      color: INK_2,
      width: blockWidth,
      align: 'right',
      lineGap: LEADING - BODY * 1.15,
    });
    y = doc.y;
  }
  leftBottom = Math.max(leftBottom, y);
  const ruleY = leftBottom + 20 * PX;
  rule(doc, MARGIN, ruleY, width, 2 * PX, INK);
  doc.y = ruleY + 1;
}

function band(doc: Doc, root: Struct, width: number): void {
  const top = doc.y + 12 * PX;
  const height = BODY + 16 * PX;
  artifact(doc, () => {
    doc
      .rect(MARGIN, top, width, height)
      .lineWidth(1.5 * PX)
      .strokeColor(INK)
      .stroke();
  });
  text(doc, root, 'P', 'CONCEPT — nog niet definitief', MARGIN, top + 8 * PX, {
    font: BOLD,
    width,
    align: 'center',
    characterSpacing: 0.04 * BODY,
  });
  doc.y = top + height;
}

function meta(doc: Doc, root: Struct, document: InvoiceDocument, width: number): void {
  const period =
    document.period === null ? '—' : `${day(document.period.from)} – ${day(document.period.to)}`;
  const rows: [string, string][] =
    document.kind === 'invoice'
      ? [
          ['Klant', document.customer],
          ['Factuurdatum', day(document.issuedOn)],
          ['Periode', period],
          ['Factuurnummer', document.number ?? ''],
        ]
      : document.kind === 'concept'
        ? [
            ['Klant', document.customer],
            ['Datum', day(document.issuedOn)],
            ['Periode', period],
            ['Nummer', 'wordt toegekend bij definitief maken'],
          ]
        : document.kind === 'credit'
          ? [
              ['Klant', document.customer],
              ['Datum', day(document.issuedOn)],
              ['Betreft', `factuur ${document.creditsNumber ?? ''}`],
              ['Nummer', document.number ?? ''],
            ]
          : document.kind === 'overview'
            ? [
                ['Klant', document.customer],
                ['Datum', day(document.issuedOn)],
                // A Deel-link without expiry (Nooit) has no "Geldig tot" (GAP-049, owner decision).
                ...(document.overview?.validUntil == null
                  ? []
                  : [['Geldig tot', day(document.overview.validUntil)] as [string, string]]),
              ]
            : [
                ['Klant', document.customer],
                ['Datum', day(document.issuedOn)],
              ];
  const gap = 24 * PX;
  const column = (width - gap) / 2;
  let y = doc.y + 20 * PX;
  // A two-column table of label and value, like the preview's grid.
  const metaTable = doc.struct('Table');
  root.add(metaTable);
  for (const [label, value] of rows) {
    const row = doc.struct('TR');
    metaTable.add(row);
    row.add(
      doc.struct('TH', {}, () => {
        doc.font(REGULAR).fontSize(BODY).fillColor(MUTED).text(label, MARGIN, y, {
          width: column,
        });
      }),
    );
    row.add(
      doc.struct('TD', {}, () => {
        doc
          .font(REGULAR)
          .fontSize(BODY)
          .fillColor(INK)
          .text(value, MARGIN + column + gap, y, { width: column });
      }),
    );
    row.end();
    y = Math.max(y + LEADING, doc.y) + 4 * PX;
  }
  metaTable.end();
  doc.y = y - 4 * PX + 20 * PX;
}

function paragraph(doc: Doc, root: Struct, value: string, width: number): void {
  text(doc, root, 'P', value, MARGIN, doc.y, { width, lineGap: LEADING - BODY * 1.15 });
}

interface Column {
  title: string;
  width: number;
  align: 'left' | 'right';
  value: (line: DocumentLine) => string;
}

function columns(width: number): Column[] {
  const fixed = 66 + 40 + 62 + 78;
  const rest = width - fixed;
  return [
    { title: 'Print', width: rest * 0.55, align: 'left', value: (l) => l.description },
    { title: 'Project', width: rest * 0.45, align: 'left', value: (l) => l.project ?? '—' },
    { title: 'Datum', width: 66, align: 'left', value: (l) => day(l.date) },
    {
      title: 'Gram',
      width: 40,
      align: 'right',
      value: (l) => (l.grams === null ? '—' : String(Math.round(l.grams))),
    },
    {
      title: 'Bedrag',
      width: 62,
      align: 'right',
      value: (l) => (l.noPrice === true ? 'Prijs volgt' : money(l.amountCents)),
    },
    {
      title: 'Status',
      width: 78,
      align: 'left',
      value: (l) => (l.status === null ? '—' : STATUS[l.status]),
    },
  ];
}

const CELL_PAD = 6 * PX;

function rowHeight(doc: Doc, cells: string[], cols: Column[], font: string): number {
  doc.font(font).fontSize(BODY);
  let height = 0;
  cells.forEach((cell, index) => {
    const col = cols[index];
    if (col === undefined) return;
    height = Math.max(height, doc.heightOfString(cell, { width: col.width - 2 * CELL_PAD }));
  });
  return Math.max(height, BODY) + 2 * CELL_PAD;
}

function drawRow(
  doc: Doc,
  parent: Struct,
  cells: string[],
  cols: Column[],
  y: number,
  heading: boolean,
  width: number,
): number {
  const font = heading ? BOLD : REGULAR;
  const height = rowHeight(doc, cells, cols, font);
  const row = doc.struct('TR');
  parent.add(row);
  let x = MARGIN;
  cells.forEach((cell, index) => {
    const col = cols[index];
    if (col === undefined) return;
    const bold = heading || col.title === 'Status';
    row.add(
      doc.struct(heading ? 'TH' : 'TD', {}, () => {
        doc
          .font(bold ? BOLD : REGULAR)
          .fontSize(BODY)
          .fillColor(INK)
          .text(cell, x + CELL_PAD, y + CELL_PAD, {
            width: col.width - 2 * CELL_PAD,
            align: col.align,
            lineGap: 0,
          });
      }),
    );
    x += col.width;
  });
  row.end();
  rule(doc, MARGIN, y + height, width, heading ? 1.5 * PX : 1 * PX, heading ? INK : RULE);
  return y + height;
}

function table(doc: Doc, root: Struct, document: InvoiceDocument, width: number): void {
  const cols = columns(width);
  const titles = cols.map((col) => col.title);
  const tableStruct = doc.struct('Table');
  root.add(tableStruct);
  const bottom = () => doc.page.height - MARGIN - FOOTER_RESERVE;
  let y = drawRow(doc, tableStruct, titles, cols, doc.y + 8 * PX, true, width);
  for (const line of document.lines) {
    const cells = cols.map((col) => col.value(line));
    if (y + rowHeight(doc, cells, cols, REGULAR) > bottom()) {
      doc.addPage();
      // The table header repeats on each page.
      y = drawRow(doc, tableStruct, titles, cols, MARGIN, true, width);
    }
    y = drawRow(doc, tableStruct, cells, cols, y, false, width);
  }
  tableStruct.end();
  doc.y = y;
}

function totals(doc: Doc, root: Struct, document: InvoiceDocument, width: number): void {
  // Overzicht without a single price: no zeros, so no totals block (DocOverview 1.6).
  if (document.kind === 'overview' && document.overview?.priced === false) return;
  const rows: [string, number, boolean][] =
    document.kind === 'credit'
      ? [['Totaal', document.totalCents, true]]
      : document.kind === 'reminder'
        ? [['Totaal openstaand', document.totalCents, true]]
        : [
            ['Totaal', document.totalCents, false],
            ['Betaald', document.paidCents, false],
            ['Openstaand', document.openCents, true],
          ];
  const boxWidth = 300 * PX;
  const x = MARGIN + width - boxWidth;
  const rowH = LEADING + 8 * PX;
  const needed = 16 * PX + rows.length * rowH + 4;
  if (doc.y + needed > doc.page.height - MARGIN - FOOTER_RESERVE) {
    doc.addPage();
    doc.y = MARGIN;
  }
  let y = doc.y + 16 * PX;
  const totalsTable = doc.struct('Table');
  root.add(totalsTable);
  for (const [label, cents, big] of rows) {
    if (big) rule(doc, x, y, boxWidth, 1.5 * PX, INK);
    const size = big ? 15 * PX : BODY;
    const font = big ? BOLD : REGULAR;
    const row = doc.struct('TR');
    totalsTable.add(row);
    row.add(
      doc.struct('TH', {}, () => {
        doc
          .font(font)
          .fontSize(size)
          .fillColor(INK)
          .text(label, x + 6 * PX, y + 4 * PX, { width: boxWidth / 2, lineGap: 0 });
      }),
    );
    row.add(
      doc.struct('TD', {}, () => {
        doc
          .font(font)
          .fontSize(size)
          .fillColor(INK)
          .text(money(cents), x + boxWidth / 2, y + 4 * PX, {
            width: boxWidth / 2 - 6 * PX,
            align: 'right',
            lineGap: 0,
          });
      }),
    );
    row.end();
    y += rowH;
  }
  totalsTable.end();
  doc.y = y;
}

/**
 * Payment instructions and "Pagina n van m" on every page. The instruction
 * is content on the last page and a pagination artifact on the others.
 */
function footers(doc: Doc, root: Struct, document: InvoiceDocument, width: number): void {
  const range = doc.bufferedPageRange();
  const { company } = document;
  // Footer rules (DocInvoice 1.5): the payment sentence needs a name and an
  // IBAN; a fully paid invoice says so instead.
  const due = document.kind === 'reminder' ? document.totalCents : document.openCents;
  const canPay = company.name.trim() !== '' && company.iban.trim() !== '';
  const payment = canPay
    ? `Graag ${money(due)} overmaken naar IBAN ${company.iban} t.n.v. ${company.name}, ` +
      `onder vermelding van ${document.reference}.`
    : '';
  const instruction =
    document.kind === 'credit'
      ? `Deze creditnota corrigeert factuur ${document.creditsNumber ?? ''}.`
      : document.kind === 'overview'
        ? // DocOverview: never an invoice; payment instructions only while something is open.
          ['Dit is een overzicht, geen factuur.', due > 0 ? payment : '']
            .filter((part) => part !== '')
            .join(' ')
        : due <= 0 && document.kind !== 'reminder'
          ? 'Deze factuur is volledig betaald.'
          : payment;
  const pageLabelWidth = 70;
  for (let index = 0; index < range.count; index += 1) {
    doc.switchToPage(range.start + index);
    const top = doc.page.height - MARGIN - FOOTER_RESERVE + 10;
    // Keep the footer inside the bottom margin from creating a new page.
    const bottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    rule(doc, MARGIN, top, width, 1 * PX, RULE_FOOTER);
    const drawInstruction = () => {
      doc
        .font(REGULAR)
        .fontSize(FOOTER_SIZE)
        .fillColor(INK_2)
        .text(instruction, MARGIN, top + 10 * PX, {
          width: width - pageLabelWidth - 24 * PX,
          lineGap: 1,
        });
    };
    if (index === range.count - 1) root.add(doc.struct('P', {}, drawInstruction));
    else artifact(doc, drawInstruction);
    doc.markContent('Artifact', { type: 'Pagination' });
    doc
      .font(REGULAR)
      .fontSize(FOOTER_SIZE)
      .fillColor(INK_2)
      .text(
        `Pagina ${index + 1} van ${range.count}`,
        MARGIN + width - pageLabelWidth,
        top + 10 * PX,
        {
          width: pageLabelWidth,
          align: 'right',
          lineBreak: false,
        },
      );
    doc.endMarkedContent();
    doc.page.margins.bottom = bottomMargin;
  }
}
