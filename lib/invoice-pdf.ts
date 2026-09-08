import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export type InvoiceData = {
  id: string; billing_month: string; total_profit: number; previous_losses: number;
  fee_amount: number; status: string; created_at: string; due_date: string | null;
};

export async function createInvoicePdf(invoice: InvoiceData, customer: { full_name?: string | null; email?: string | null }) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const bytes = await readFile(path.join(process.cwd(), 'node_modules/@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff'));
  const font = await doc.embedFont(bytes, { subset: true });
  const page = doc.addPage([595.28, 841.89]);
  const ink = rgb(.06, .09, .16), muted = rgb(.34, .39, .46), accent = rgb(.30, .27, .80);
  const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value) || 0);
  const date = (value: string | null) => value ? new Date(value.slice(0, 10) + 'T00:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : 'Not specified';
  function text(value: string, x: number, y: number, size = 11, color = ink) {
    page.drawText(value, { x, y, size, font, color });
  }
  function right(value: string, y: number, size = 11, color = ink) {
    text(value, 547 - font.widthOfTextAtSize(value, size), y, size, color);
  }
  function rule(y: number) { page.drawLine({ start: { x: 48, y }, end: { x: 547, y }, thickness: .7, color: rgb(.85, .87, .90) }); }
  // Wrap customer-supplied text, including long unbroken email addresses.
  function wrapped(value: string, y: number, size = 11) {
    let line = '';
    for (const char of value.replace(/[\r\n\t]/g, ' ')) {
      if (font.widthOfTextAtSize(line + char, size) > 495) { text(line, 48, y, size); y -= 17; line = ''; }
      line += char;
    }
    if (line) text(line, 48, y, size);
    return y - 22;
  }
  doc.setTitle(`ProfitPilot Invoice ${invoice.id.split('-')[0].toUpperCase()}`);
  doc.setAuthor('ProfitPilot');
  text('ProfitPilot', 48, 778, 24, accent);
  right('INVOICE', 780, 20);
  text('Performance fee statement', 48, 753, 10, muted);
  right(`#${invoice.id.split('-')[0].toUpperCase()}`, 755, 11, muted);
  rule(731);
  text('BILLING PERIOD', 48, 700, 9, muted);
  text(invoice.billing_month, 48, 678, 15);
  text('ISSUED', 290, 700, 9, muted);
  text(date(invoice.created_at), 290, 678, 10);
  text('DUE DATE', 438, 700, 9, muted);
  text(date(invoice.due_date), 438, 678, 10);
  text('BILLED TO', 48, 634, 9, muted);
  let y = wrapped(customer.full_name || 'Valued Customer', 610, 13);
  y = wrapped(customer.email || '', y);
  y -= 26;
  page.drawRectangle({ x: 48, y: y - 12, width: 499, height: 32, color: rgb(.95, .96, .98) });
  text('DESCRIPTION', 60, y, 9, muted); right('AMOUNT (USD)', y, 9, muted);
  y -= 48;
  const entries: Array<[string, number]> = [
    ['Realized trading profit', invoice.total_profit],
    ['Previous losses carried forward', -Number(invoice.previous_losses)],
    ['Net billable profit', Math.max(0, Number(invoice.total_profit) - Number(invoice.previous_losses))],
  ];
  for (const [label, value] of entries) { text(label, 48, y); right(money(value), y); rule(y - 16); y -= 46; }
  text('Performance fee rate', 48, y, 11, muted); right('30%', y, 11, muted);
  y -= 57;
  text('Invoice total', 48, y, 18); right(money(invoice.fee_amount), y, 22, accent);
  y -= 42;
  const status = invoice.status === 'Paid' ? 'PAID IN FULL' : invoice.status === 'No Fee' ? 'NO PAYMENT REQUIRED' : 'PAYMENT REQUIRED';
  right(status, y, 10, invoice.status === 'Paid' || invoice.status === 'No Fee' ? rgb(.02, .43, .31) : rgb(.7, .17, .17));
  rule(124);
  text('Generated from your billing records. All amounts are in USD.', 48, 103, 9, muted);
  text(`Reference: ${invoice.id}`, 48, 85, 8, muted);
  text('Thank you for trading with ProfitPilot.', 48, 58, 9, muted);
  right('1 / 1', 58, 9, muted);
  return doc.save();
}
