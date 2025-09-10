import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, ChevronDown, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Calendar as DayPickerCalendar } from '@/components/ui/calendar';
import { formatYYYYMMDD, parseYYYYMMDD } from '@/lib/date-format';
import { useTranslation } from 'react-i18next';
import { buildRenderSegments, parseSmartPhraseContent, reconstructPhraseWithSelections } from '@shared/smart-phrase-parser';
import type { RenderSegment } from '@shared/smart-phrase-parser';
import type { SlotDefinition } from '@shared/smart-phrase-schema';
import { cn } from '@/lib/utils';

export type SmartSelections = Record<string, string | Date | null>;

export interface SmartPhraseOverlayProps {
  open: boolean;
  caretRect: DOMRect | null;
  content: string;
  initialSelections?: SmartSelections;
  initialActiveSlotId?: string;
  onChange?: (selections: SmartSelections) => void;
  onClose?: (reason: 'completed' | 'cancel' | 'clickOutside' | 'escape') => void;
  onComplete?: (selections: SmartSelections) => void;
  onAssemble?: (output: string, selections: SmartSelections) => void; // optional convenience
}

// Distinct color classes by slot type
const slotColors: Record<SlotDefinition['type'], string> = {
  'text': 'bg-gray-200 text-gray-700 border-gray-300',
  'single-select': 'bg-sky-100 text-sky-900 border-sky-300',
  'date': 'bg-violet-100 text-violet-900 border-violet-300',
  'nested': 'bg-amber-100 text-amber-900 border-amber-300',
};

export function SmartPhraseOverlay({
  open,
  caretRect,
  content,
  initialSelections,
  initialActiveSlotId,
  onChange,
  onClose,
  onComplete,
  onAssemble,
}: SmartPhraseOverlayProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selections, setSelections] = useState<SmartSelections>(initialSelections || {});
  const [cleared, setCleared] = useState<Set<string>>(new Set());
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);

  useEffect(() => {
    setSelections(initialSelections || {});
  }, [initialSelections]);

  useEffect(() => {
    if (open && initialActiveSlotId) {
      setActiveSlotId(initialActiveSlotId);
    }
    if (open) {
      // Focus first chip button for keyboard users
      requestAnimationFrame(() => {
        const firstChip = containerRef.current?.querySelector<HTMLElement>("[data-chip-button='1']");
        firstChip?.focus();
      });
    }
  }, [open, initialActiveSlotId]);

  const segments: RenderSegment[] = useMemo(() => buildRenderSegments(content), [content]);

  // Positioning near caret
  const positionStyle = useMemo(() => {
    if (!caretRect) return { display: 'none' } as React.CSSProperties;
    const top = Math.max(8, caretRect.bottom + 8);
    const left = Math.max(8, caretRect.left);
    return { top, left, display: open ? 'block' : 'none' } as React.CSSProperties;
  }, [caretRect, open]);

  // Assemble final output string based on current selections/clears
  const computeOutputString = useMemo(() => {
    return () => {
      const parsed = parseSmartPhraseContent(content);
      const records: Record<string, string> = {};
      for (const seg of segments) {
        if (seg.kind !== 'slot') continue;
        const id = seg.slot.id;
        if (cleared.has(id)) {
          records[id] = '';
        } else {
          const v = selections[id];
          if (v == null) continue;
          records[id] = typeof v === 'string' ? v : (v instanceof Date ? formatYYYYMMDD(v) : String(v));
        }
      }
      return reconstructPhraseWithSelections(parsed, records);
    };
  }, [content, segments, selections, cleared]);

  // Auto-complete when all slots are either selected or cleared
  useEffect(() => {
    if (!open) return;
    const slotIds: string[] = segments.filter(s => s.kind === 'slot').map(s => (s as any).slot.id);
    if (slotIds.length === 0) return;
    const outstanding = slotIds.filter(id => !cleared.has(id) && (selections[id] == null || selections[id] === ''));
    if (outstanding.length === 0) {
      const out = computeOutputString();
      onAssemble?.(out, selections);
      onComplete?.(selections);
      onClose?.('completed');
    }
  }, [segments, selections, cleared, open, computeOutputString, onAssemble, onComplete, onClose]);

  // Click outside to cancel
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      const el = containerRef.current;
      if (el && !el.contains(e.target as Node)) {
        onClose?.('clickOutside');
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open, onClose]);

  // Escape to cancel
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.('escape');
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const updateSelection = (slot: SlotDefinition, value: string | Date | null) => {
    const next = { ...selections, [slot.id]: value };
    setSelections(next);
    onChange?.(next);
  };

  const clearSlot = (slotId: string) => {
    const nextCleared = new Set(cleared);
    nextCleared.add(slotId);
    setCleared(nextCleared);
    const nextSel = { ...selections };
    delete nextSel[slotId];
    setSelections(nextSel);
    onChange?.(nextSel);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'fixed z-50 rounded-md border bg-white shadow-xl p-3 text-sm max-w-[640px] w-fit',
        'dark:bg-neutral-900 dark:border-neutral-700',
        // subtle animation
        'animate-in fade-in-0 zoom-in-95 duration-150'
      )}
      style={positionStyle}
      role="dialog"
      aria-modal="true"
      aria-label={t('smart.overlayAriaLabel')}
      onKeyDown={(e) => {
        if (e.key !== 'Tab') return;
        const root = containerRef.current;
        if (!root) return;
        const focusables = Array.from(root.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )).filter(el => !el.hasAttribute('disabled') && el.tabIndex !== -1);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const current = document.activeElement as HTMLElement | null;
        if (e.shiftKey) {
          if (!current || current === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (!current || current === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }}
    >
      {/* Pointer nub */}
      <div className="absolute -top-2 left-4 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white dark:border-b-neutral-900" />

      <div
        className="flex flex-wrap gap-1 items-center"
        onKeyDown={(e) => {
          const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
          if (!keys.includes(e.key)) return;
          const buttons = Array.from(containerRef.current?.querySelectorAll<HTMLButtonElement>("[data-chip-button='1']") || []);
          if (buttons.length === 0) return;
          const idx = buttons.findIndex((b) => b === document.activeElement);
          const delta = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1;
          const next = idx === -1 ? 0 : (idx + delta + buttons.length) % buttons.length;
          buttons[next]?.focus();
          e.preventDefault();
        }}
      >
        {segments.map((seg, idx) => {
          if (seg.kind === 'text') {
            return (
              <span key={`t-${idx}`} className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                {seg.text}
              </span>
            );
          }

          const slot = seg.slot;
          if (cleared.has(slot.id)) {
            return <span key={`c-${slot.id}-${idx}`} className="text-gray-400 select-none"> </span>;
          }

          const common = slotColors[slot.type];
          const selected = selections[slot.id];

          return (
            <span key={`s-${slot.id}-${idx}`} className="relative inline-flex items-center">
              {/* Clear button overlay */}
              <button
                aria-label="Clear option"
                className="absolute -top-1 -right-1 p-0.5 rounded-full bg-white shadow border text-gray-500 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-900"
                onClick={() => clearSlot(slot.id)}
              >
                <X size={10} />
              </button>

              {slot.type === 'single-select' && (
                <SingleSelectChip
                  slot={slot}
                  value={typeof selected === 'string' ? selected : null}
                  onChange={(v) => updateSelection(slot, v)}
                  active={activeSlotId === slot.id}
                  onFocus={() => setActiveSlotId(slot.id)}
                  className={common}
                />
              )}

              {slot.type === 'nested' && (
                <NestedChip
                  slot={slot}
                  value={typeof selected === 'string' ? selected : null}
                  onChange={(v) => updateSelection(slot, v)}
                  active={activeSlotId === slot.id}
                  onFocus={() => setActiveSlotId(slot.id)}
                  className={common}
                />
              )}

              {slot.type === 'date' && (
                <DateChip
                  slot={slot}
                  value={selected instanceof Date || typeof selected === 'string' ? selected : null}
                  onChange={(v) => updateSelection(slot, v)}
                  active={activeSlotId === slot.id}
                  onFocus={() => setActiveSlotId(slot.id)}
                  className={common}
                />
              )}

              {slot.type === 'text' && (
                <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5', common)}>
                  {slot.label || slot.placeholder || 'text'}
                </span>
              )}
            </span>
          );
        })}
      </div>

      {/* Footer controls could go here later (e.g., Insert button if needed) */}
    </div>
  );
}

interface ChipPropsBase {
  slot: SlotDefinition;
  className?: string;
  active?: boolean;
  onFocus?: () => void;
}

interface SingleSelectChipProps extends ChipPropsBase {
  value: string | null;
  onChange: (value: string | null) => void;
}

const SingleSelectChip = React.memo(function SingleSelectChip({ slot, value, onChange, className, active, onFocus }: SingleSelectChipProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === 'Escape') setOpen(false);
      // number hotkeys 1-9
      if (/^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        const options = slot.options || [];
        if (idx >= 0 && idx < options.length) {
          onChange(options[idx].value);
          setOpen(false);
          btnRef.current?.focus();
        }
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, slot.options, onChange]);

  const label = value || slot.label || 'choose';
  const options = slot.options || [];

  return (
    <span className="inline-flex relative">
      <button
        ref={btnRef}
        type="button"
        className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-900', className)}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onFocus={onFocus}
        data-chip-button="1"
      >
        <span>{label}</span>
        <ChevronDown size={14} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={slot.label || 'options'}
          className="absolute top-full left-0 mt-1 w-max max-w-[320px] rounded-md border bg-white shadow z-50 p-1"
        >
          {options.length === 0 && (
            <div className="px-2 py-1 text-gray-500 text-xs">No options</div>
          )}
          {options.map((opt) => (
            <button
              key={opt.id}
              role="option"
              aria-selected={opt.value === value}
              className={cn('block w-full text-left px-2 py-1 rounded hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-600)] focus-visible:ring-offset-1',
                opt.value === value && 'bg-gray-100 font-medium')}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
                btnRef.current?.focus();
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </span>
  );
});

interface DateChipProps extends ChipPropsBase {
  value: Date | string | null;
  onChange: (value: Date | string | null) => void;
}

const DateChip = React.memo(function DateChip({ slot, value, onChange, className, onFocus }: DateChipProps) {
  const [open, setOpen] = useState(false);

  const asDate: Date | undefined = typeof value === 'string'
    ? parseYYYYMMDD(value) || undefined
    : (value instanceof Date ? value : undefined);
  const display = value ? (typeof value === 'string' ? value : formatYYYYMMDD(value)) : (slot.label || 'date');

  const setDate = (d: Date | undefined) => {
    if (!d) return;
    const s = formatYYYYMMDD(d);
    onChange(s);
    setOpen(false);
  };

  const setToday = () => setDate(new Date());
  const setYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setDate(d);
  };

  return (
    <span className="inline-flex relative">
      <button
        type="button"
        className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-900', className)}
        onClick={() => setOpen((v) => !v)}
        onFocus={onFocus}
        aria-haspopup="dialog"
        aria-expanded={open}
        data-chip-button="1"
      >
        <Calendar size={14} />
        <span>{display}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 rounded-md border bg-white shadow z-50 p-2 w-[280px]">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-gray-600">Select date</div>
            <div className="flex gap-1">
              <button className="px-2 py-1 text-xs rounded border hover:bg-gray-50" onClick={setToday}>Today</button>
              <button className="px-2 py-1 text-xs rounded border hover:bg-gray-50" onClick={setYesterday}>Yesterday</button>
            </div>
          </div>
          <DayPickerCalendar
            mode="single"
            selected={asDate}
            onSelect={(d: any) => setDate(d || undefined)}
            initialFocus
          />
        </div>
      )}
    </span>
  );
});

interface NestedChipProps extends ChipPropsBase {
  value: string | null;
  onChange: (value: string | null) => void;
}

const NestedChip = React.memo(function NestedChip({ slot, value, onChange, className, onFocus }: NestedChipProps) {
  const [open, setOpen] = useState(false);
  const [stack, setStack] = useState<{ id: string; label: string; index: number }[]>([]);
  const [current, setCurrent] = useState(slot.options || []);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  const label = value || slot.label || 'choose';

  function pushLevel(id: string, label: string, next: any[]) {
    setStack((s) => [...s, { id, label, index: s.length }]);
    setCurrent(next || []);
    setFocusedIndex(-1);
  }
  function popLevel() {
    setStack((s) => s.slice(0, -1));
    if (stack.length <= 1) {
      setCurrent(slot.options || []);
    } else {
      // Find the options list at the new top
      let opts = slot.options || [];
      for (let i = 0; i < stack.length - 1; i++) {
        const id = stack[i].id;
        const found = opts.find((o) => o.id === id);
        opts = found?.children || [];
      }
      setCurrent(opts);
    }
    setFocusedIndex(-1);
  }

  // Global hotkeys while menu is open
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (current.length > 0) setFocusedIndex((i) => (i + 1) % current.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (current.length > 0) setFocusedIndex((i) => (i - 1 + current.length) % current.length);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        popLevel();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        const idx = focusedIndex >= 0 ? focusedIndex : 0;
        const opt = current[idx];
        if (!opt) return;
        if (opt.children && opt.children.length > 0) {
          pushLevel(opt.id, opt.label, opt.children);
        } else {
          onChange(opt.value);
          setOpen(false);
        }
      } else if (/^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        const opt = current[idx];
        if (opt) {
          if (opt.children && opt.children.length > 0) {
            pushLevel(opt.id, opt.label, opt.children);
          } else {
            onChange(opt.value);
            setOpen(false);
          }
        }
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, current, focusedIndex, onChange]);

  return (
    <span className="inline-flex relative">
      <button
        type="button"
        className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5', className)}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onFocus={onFocus}
        data-chip-button="1"
      >
        <span>{label}</span>
        <ChevronDown size={14} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-max max-w-[360px] rounded-md border bg-white shadow z-50 p-2">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-gray-600">
              {stack.length > 0 ? stack.map((s, i) => (
                <span key={s.id}>
                  {i > 0 && ' > '} {s.label}
                </span>
              )) : 'Choose'}
            </div>
            <div className="flex gap-1">
              <button className="p-1 rounded hover:bg-gray-100" onClick={popLevel} disabled={stack.length === 0} aria-label="Back">
                <ChevronLeft size={14} />
              </button>
            </div>
          </div>
          <div role="listbox" aria-label={slot.label || 'options'} className="max-h-60 overflow-auto">
            {current.length === 0 && (
              <div className="px-2 py-1 text-gray-500 text-xs">No options</div>
            )}
            {current.map((opt, i) => (
              <div key={opt.id} className="flex items-center justify-between">
                <button
                  role="option"
                  aria-selected={opt.value === value}
                  className={cn('px-2 py-1 rounded text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-600)] focus-visible:ring-offset-1',
                    focusedIndex === i ? 'bg-gray-100' : 'hover:bg-gray-100')}
                  onMouseEnter={() => setFocusedIndex(i)}
                  onClick={() => {
                    if (opt.children && opt.children.length > 0) {
                      pushLevel(opt.id, opt.label, opt.children);
                    } else {
                      onChange(opt.value);
                      setOpen(false);
                    }
                  }}
                >
                  <span className="text-xs text-gray-500 mr-2">{i < 9 ? i + 1 : ''}</span>
                  {opt.label}
                </button>
                {opt.children && opt.children.length > 0 && (
                  <button className="p-1 rounded hover:bg-gray-100" onClick={() => pushLevel(opt.id, opt.label, opt.children || [])} aria-label="Next">
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </span>
  );
});

