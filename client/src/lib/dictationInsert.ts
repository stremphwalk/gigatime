export interface InsertState {
  value: string;
  start: number; // caret start (selectionStart)
  end: number;   // caret end (selectionEnd)
  lastInterim: string; // previously inserted interim (if any)
  lastSession: string | null;
  lastCaretPos: number | null;
}

export interface InsertResult {
  value: string;
  caret: number;
  lastInterim: string;
  lastSession: string | null;
  lastCaretPos: number | null;
}

export function insertAtCaret(
  state: InsertState,
  rawText: string,
  isInterim: boolean,
  session: string
): InsertResult {
  let { value, start, end, lastInterim, lastSession, lastCaretPos } = state;
  // If caret moved since last insert, don't try to replace previous interim
  if (isInterim && lastCaretPos != null && lastCaretPos !== start) {
    lastInterim = '';
  }

  const canReplaceInterim = Boolean(
    isInterim && lastInterim && lastSession === session && lastCaretPos != null && lastCaretPos === start
  );

  // compute slices
  let beforeSliceEnd = start;
  if (canReplaceInterim) beforeSliceEnd = Math.max(0, start - lastInterim.length);

  const before = value.substring(0, beforeSliceEnd);
  const after = value.substring(end);

  // Avoid word concatenation (if before char is alnum and text doesn't start with space/punct)
  const needsLeadingSpace = before.length > 0 && !/\s$/.test(before) && rawText && !/^\s|^[\.,;:!?\)]/.test(rawText);
  const text = (needsLeadingSpace ? ' ' : '') + rawText;

  const newValue = before + text + after;
  const caret = Math.min((before + text).length, newValue.length);

  if (isInterim) {
    return {
      value: newValue,
      caret,
      lastInterim: text,
      lastSession: session,
      lastCaretPos: caret,
    };
  }
  // Final inserts clear lastInterim and set lastSession
  return {
    value: newValue,
    caret,
    lastInterim: '',
    lastSession: session,
    lastCaretPos: caret,
  };
}
