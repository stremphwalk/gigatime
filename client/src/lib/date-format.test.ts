import { describe, it, expect } from 'vitest';
import { formatYYYYMMDD, parseYYYYMMDD } from './date-format';

describe('date-format helpers', () => {
  it('formats Date to YYYY-MM-DD', () => {
    const d = new Date(2025, 8, 9); // Sep 9 2025 local
    expect(formatYYYYMMDD(d)).toBe('2025-09-09');
  });

  it('passes through YYYY-MM-DD string', () => {
    expect(formatYYYYMMDD('2025-09-09')).toBe('2025-09-09');
  });

  it('parses YYYY-MM-DD to Date and formats back', () => {
    const d = parseYYYYMMDD('2025-09-09');
    expect(d).not.toBeNull();
    if (!d) return;
    expect(formatYYYYMMDD(d)).toBe('2025-09-09');
  });
});

