import { describe, it, expect } from 'vitest';
import { insertAtCaret, type InsertState } from './dictationInsert';

const base = (value: string, start: number, end?: number, lastInterim = '', lastSession: string | null = null, lastCaretPos: number | null = null): InsertState => ({
  value,
  start,
  end: end ?? start,
  lastInterim,
  lastSession,
  lastCaretPos,
});

describe('insertAtCaret', () => {
  it('inserts interim at caret without overwriting surrounding text', () => {
    const st = base('Hello world', 5);
    const res = insertAtCaret(st, ' there', true, 's1');
    expect(res.value).toBe('Hello there world');
    expect(res.caret).toBe('Hello there'.length);
    expect(res.lastInterim).toBe(' there');
  });

  it('adds leading space when needed to avoid concatenation', () => {
    const st = base('Hello', 5);
    const res = insertAtCaret(st, 'world', true, 's1');
    expect(res.value).toBe('Hello world');
  });

  it('replaces previous interim when caret unchanged and session matches', () => {
    const st1 = base('Hello world', 5, 5, ' there', 's1', 'Hello there'.length);
    const res = insertAtCaret(st1, ' there again', true, 's1');
    expect(res.value).toBe('Hello there again world');
    expect(res.lastInterim).toBe(' there again');
  });

  it('does not replace interim if caret moved (commits prior interim)', () => {
    const st1 = base('Hello there world', 11, 11, ' there', 's1', 11 /* last caret pos */);
    // caret is moved earlier -> should not slice out previous interim
    const moved = { ...st1, start: 6, end: 6 };
    const res = insertAtCaret(moved, 'X', true, 's1');
    expect(res.value).toBe('Hello Xthere world');
  });

  it('final replaces interim and clears interim tracking', () => {
    const st1 = base('Hello world', 5, 5, ' there', 's1', 'Hello there'.length);
    const res = insertAtCaret(st1, ' there!', false, 's1');
    expect(res.value).toBe('Hello there! world');
    expect(res.lastInterim).toBe('');
  });
});
