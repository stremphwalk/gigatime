// Utility to compute precise caret coordinates in a textarea
// Returns viewport coordinates for the caret position using a mirror element
export function getTextareaCaretRect(textarea: HTMLTextAreaElement, position?: number) {
  // In some edge cases, callers may pass an element that isn't a textarea.
  // Gracefully handle by falling back to element bounds.
  const rect = textarea.getBoundingClientRect();
  const hasValueProp = typeof (textarea as any).value === 'string';
  const selEnd = position ?? (hasValueProp ? ((textarea as any).selectionEnd ?? 0) : 0);

  // If no value/text is available, return the element's bounding rect as a safe fallback.
  if (!hasValueProp) {
    return { left: rect.left, top: rect.top, bottom: rect.bottom, height: rect.height };
  }

  const computed = window.getComputedStyle(textarea);

  // Create a mirror div positioned at the same viewport location as the textarea
  const mirror = document.createElement('div');
  mirror.style.position = 'fixed';
  mirror.style.left = `${rect.left}px`;
  mirror.style.top = `${rect.top}px`;
  mirror.style.visibility = 'hidden';
  mirror.style.whiteSpace = 'pre-wrap';
  mirror.style.wordWrap = 'break-word';
  mirror.style.overflow = 'auto';
  mirror.style.width = `${rect.width}px`;
  mirror.style.height = `${rect.height}px`;
  // Box model: include padding but ignore borders to avoid double-adding with rect
  mirror.style.boxSizing = 'border-box';
  mirror.style.padding = computed.padding;
  mirror.style.border = '0';

  // Font and text properties to match rendering
  mirror.style.fontFamily = computed.fontFamily;
  mirror.style.fontSize = computed.fontSize;
  mirror.style.fontWeight = computed.fontWeight;
  mirror.style.fontStyle = computed.fontStyle;
  mirror.style.lineHeight = computed.lineHeight;
  mirror.style.letterSpacing = computed.letterSpacing;
  mirror.style.textTransform = computed.textTransform;
  mirror.style.textAlign = computed.textAlign as any;
  mirror.style.direction = computed.direction;
  // Tabs width
  // @ts-ignore - not in all TS DOM typings
  mirror.style.tabSize = (computed as any).tabSize ?? '8';

  // Sync scroll
  mirror.scrollTop = textarea.scrollTop;
  mirror.scrollLeft = textarea.scrollLeft;

  document.body.appendChild(mirror);

  // Build content up to caret, then insert a marker span at caret
  const value: string = (textarea as any).value as string;
  const before = value.slice(0, selEnd);
  const after = value.slice(selEnd);

  const textNode = document.createTextNode(before);
  const marker = document.createElement('span');
  // Use a placeholder character to guarantee measurable box
  marker.textContent = after.length > 0 ? after[0] : '.';

  mirror.appendChild(textNode);
  mirror.appendChild(marker);

  const markerRect = marker.getBoundingClientRect();

  // Compute caret box: left/top of marker corresponds to caret position
  const caretLeft = markerRect.left;
  const caretTop = markerRect.top;
  const caretBottom = markerRect.bottom;
  const caretHeight = markerRect.height;

  document.body.removeChild(mirror);

  return { left: caretLeft, top: caretTop, bottom: caretBottom, height: caretHeight };
}

