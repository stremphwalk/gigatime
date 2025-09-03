// Utilities to format smart phrases from element selections
// Phase 1: foundational formatter + light settings support

import { format as formatDate } from 'date-fns';

export type PickerType = 'multipicker' | 'nested_multipicker' | 'date';

export type PickerNode = {
  id: string;
  label: string;
  value?: string;
  children?: PickerNode[];
};

export type ElementSettings = {
  // chips | dropdown (advisory; used later in UI)
  displayMode?: 'chips' | 'dropdown';
  // string placed between items when multiple are present; default: single space
  joiner?: string;
  // for nested: leaf (child label) vs fullPath (Group > Child > Leaf); default fullPath
  outputFormat?: 'leaf' | 'fullPath';
  // advisory; when true we can allow empty replacement; default true (optional)
  optional?: boolean;
};

export type SmartElement = {
  id: string;
  type: PickerType;
  key?: string;
  label?: string;
  placeholder?: string; // e.g., "{{pain-scale}}"
  options?: PickerNode[];
  settings?: ElementSettings;
};

export type PhraseLike = {
  content: string;
  elements: SmartElement[];
};

// Given a tree of options, find the path of labels to a node matching the provided value or label
function findPathToValue(nodes: PickerNode[] | undefined, target: string): string[] | null {
  if (!nodes || nodes.length === 0) return null;
  for (const node of nodes) {
    const nodeVal = node.value ?? node.label;
    if (nodeVal === target) {
      return [node.label];
    }
    const childPath = findPathToValue(node.children, target);
    if (childPath) {
      return [node.label, ...childPath];
    }
  }
  return null;
}

function toArray<T>(v: T | T[] | undefined | null): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

// Resolve a single element's selection into display strings according to settings
function formatSelectionForElement(el: SmartElement, raw: any): string {
  const settings = el.settings || {};
  const joiner = settings.joiner ?? ' ';

  if (el.type === 'date') {
    if (!raw) return '';
    // Accept Date, number (timestamp), or string; default to PPP for Date
    try {
      if (raw instanceof Date) return formatDate(raw, 'PPP');
      const asDate = new Date(raw);
      if (!isNaN(asDate.getTime())) return formatDate(asDate, 'PPP');
      return String(raw);
    } catch {
      return String(raw);
    }
  }

  // Multipicker or nested
  const items = toArray<string>(raw).map((val) => String(val));
  if (items.length === 0) return '';

  if (el.type === 'multipicker') {
    // Flat: just join values in selection order, no extra punctuation by default
    return items.join(joiner);
  }

  // nested_multipicker: build full path or leaf label
  const outFormat = settings.outputFormat ?? 'fullPath';
  const formatted = items.map((val) => {
    if (outFormat === 'leaf') return val;
    const path = findPathToValue(el.options, val);
    if (!path) return val; // fallback
    return path.join(' > ');
  });
  return formatted.join(joiner);
}

// Replace all tokens for an element within the content
// Priority: element.placeholder -> {{key}} -> {{id}}
function replaceElementToken(content: string, el: SmartElement, text: string): string {
  const tokens: string[] = [];
  if (el.placeholder) tokens.push(el.placeholder);
  if (el.key) tokens.push(`{{${el.key}}}`);
  // Also support legacy or id-based placeholders
  tokens.push(`{{${el.id}}}`);
  tokens.push(`{${el.id}}`);
  tokens.push(`{${el.key ?? el.id}}`);

  let out = content;
  for (const t of tokens) {
    if (!t) continue;
    if (out.includes(t)) {
      out = out.split(t).join(text ?? '');
    }
  }
  return out;
}

export type SelectionMap = Record<string, any>; // key by element.id or element.key; values can be string | string[] | Date

// Format a phrase-like object by replacing placeholders with selections
export function formatSmartPhrase(
  phrase: PhraseLike,
  selections: SelectionMap
): string {
  let result = phrase.content || '';
  const elByKey = new Map<string, SmartElement>();
  for (const el of phrase.elements || []) {
    if (el.key) elByKey.set(el.key, el);
  }

  for (const el of phrase.elements || []) {
    // Accept selection by id or key
    const raw = selections[el.id] ?? (el.key ? selections[el.key] : undefined);
    const text = formatSelectionForElement(el, raw);
    result = replaceElementToken(result, el, text);
  }
  return result;
}

// Compute replacement strings for each element given current selections
export function computeElementStrings(
  phrase: PhraseLike,
  selections: SelectionMap
): Array<{ id: string; key?: string; text: string }> {
  const out: Array<{ id: string; key?: string; text: string }> = [];
  for (const el of phrase.elements || []) {
    const raw = selections[el.id] ?? (el.key ? selections[el.key] : undefined);
    const text = formatSelectionForElement(el as any, raw);
    out.push({ id: el.id, key: (el as any).key, text });
  }
  return out;
}
