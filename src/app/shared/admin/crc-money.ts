import { Pipe, PipeTransform } from '@angular/core';

const amountFormat = new Intl.NumberFormat('es-CR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: true
});

/** Display only. ASCII spaces also render correctly in the PDF's built-in font. */
export function formatCRC(value: number | string | null | undefined): string {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount)
    ? `CRC ${amountFormat.format(amount).replace(/\s/g, ' ')}`
    : '—';
}

@Pipe({ name: 'crcMoney', standalone: true })
export class CrcMoneyPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    return formatCRC(value);
  }
}
