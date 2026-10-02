import { ageAtEvent } from './event-age';

describe('Age at the Costa Rica event date', () => {
  const event = '2026-11-01T02:00:00Z'; // October 31 in Costa Rica.
  it('accepts the sixteenth birthday and rejects one day before it', () => {
    expect(ageAtEvent('2010-10-31', event)).toBe(16);
    expect(ageAtEvent('2010-11-01', event)).toBe(15);
  });
  it('handles dates without a timezone and older attendees', () => {
    expect(ageAtEvent('2010-10-31', '2026-10-31')).toBe(16);
    expect(ageAtEvent('2008-10-31', event)).toBe(18);
  });
  it('rejects invalid calendar dates instead of rolling them forward', () => {
    expect(ageAtEvent('2010-02-30', event)).toBeNull();
    expect(ageAtEvent('', event)).toBeNull();
    expect(ageAtEvent('2010-10-31', 'invalid')).toBeNull();
  });
});
