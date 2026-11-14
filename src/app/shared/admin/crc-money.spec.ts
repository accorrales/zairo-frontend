import { describe, expect, it } from 'vitest';
import { CrcMoneyPipe, formatCRC } from './crc-money';

describe('CRC display format', () => {
  it('uses explicit CRC, space grouping and two comma decimals for numbers and database strings', () => {
    for (const value of [15000, '15000.00']) expect(formatCRC(value)).toBe('CRC 15 000,00');
    expect(formatCRC(33000)).toBe('CRC 33 000,00');
    expect(formatCRC(-1500.5)).toBe('CRC -1 500,50');
    expect(formatCRC(0)).toBe('CRC 0,00');
  });
  it('shares the same function between templates and PDF without changing source values', () => {
    const value = '12345.678';
    expect(new CrcMoneyPipe().transform(value)).toBe(formatCRC(value));
    expect(formatCRC(value)).toBe('CRC 12 345,68');
    expect(value).toBe('12345.678');
    expect(formatCRC('invalid')).toBe('—');
  });
});
