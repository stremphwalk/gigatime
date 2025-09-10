import { format, parse } from 'date-fns';

// Format a Date or string into YYYY-MM-DD for insertion
export function formatYYYYMMDD(value: Date | string): string {
  try {
    if (typeof value === 'string') {
      // If already in YYYY-MM-DD, return as-is
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
      const d = new Date(value);
      if (!isNaN(d.getTime())) return format(d, 'yyyy-MM-dd');
      // Try strict parse from various common formats
      const p = parse(value, 'yyyy-MM-dd', new Date());
      if (!isNaN(p.getTime())) return format(p, 'yyyy-MM-dd');
      return value;
    }
    return format(value, 'yyyy-MM-dd');
  } catch {
    return String(value);
  }
}

// Parse YYYY-MM-DD string into Date (local time at 00:00)
export function parseYYYYMMDD(value: string): Date | null {
  try {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const d = parse(value, 'yyyy-MM-dd', new Date());
    if (isNaN(d.getTime())) return null;
    return d;
  } catch {
    return null;
  }
}

