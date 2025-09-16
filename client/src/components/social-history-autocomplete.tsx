import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useFloatingCaret } from "@/hooks/use-floating-caret";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cigarette, Wine, Pill, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAutocompleteItems } from "@/hooks/use-autocomplete-items";

interface SocialHistoryAutocompleteProps {
  query: string;
  position: { top: number; left: number; width?: number };
  onSelect: (formatted: string) => void;
  onClose: () => void;
  sectionId: string;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
}

interface SocialHistoryOption {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  format: (value: string) => string;
  category: string;
}

export function SocialHistoryAutocomplete({
  query,
  position,
  onSelect,
  onClose,
  sectionId,
  textareaRef
}: SocialHistoryAutocompleteProps) {
  const { floatingRef, x, y, ready } = useFloatingCaret(textareaRef as any, { placement: "bottom-start", gutter: 6 });
  const [suggestions, setSuggestions] = useState<SocialHistoryOption[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { items: customItems } = useAutocompleteItems('social-history');

  // Define social history options
  const socialHistoryOptions: SocialHistoryOption[] = [
    {
      id: "pack-years",
      label: "pack-years",
      icon: Cigarette,
      format: (value: string) => `Tobacco: ${value} pack-years`,
      category: "Tobacco use"
    },
    {
      id: "standard-drinks",
      label: "standard drinks", 
      icon: Wine,
      format: (value: string) => `Alcohol: ${value} standard drinks`,
      category: "Alcohol use"
    }
  ];

  const nilOptions: SocialHistoryOption[] = [
    {
      id: "all-nil",
      label: "All substances: nil",
      icon: Pill,
      format: () => "Tobacco: nil\nAlcohol: nil\nDrugs: nil",
      category: "Denies all use"
    }
  ];

  useEffect(() => {
    const normalizedQuery = query.toLowerCase().trim();
    
    if (!normalizedQuery) {
      setSuggestions([]);
      return;
    }

    let results: SocialHistoryOption[] = [];

    // Custom items (priority first)
    const customMatches = customItems
      .filter(item =>
        item.text.toLowerCase().includes(normalizedQuery) ||
        item.description?.toLowerCase().includes(normalizedQuery)
      )
      .sort((a, b) => Number(b.isPriority) - Number(a.isPriority))
      .map((item) => ({
        id: `custom-${item.id}`,
        label: item.text,
        icon: Pill,
        format: () => item.text,
        category: item.isPriority ? 'Custom (Priority)' : 'Custom'
      }));

    // Check if query is "nil" or similar
    if (["nil", "none", "denies", "negative"].includes(normalizedQuery)) {
      results = nilOptions;
    } 
    // Check if query is a number (for pack-years/standard drinks)
    else if (/^\d+(\.\d+)?$/.test(normalizedQuery)) {
      results = socialHistoryOptions.map(option => ({
        ...option,
        label: `${query} ${option.label}`,
        format: () => option.format(query)
      }));
    }
    // Text matching for partial queries
    else {
      results = [
        ...socialHistoryOptions.filter(option => 
          option.label.toLowerCase().includes(normalizedQuery)
        ),
        ...nilOptions.filter(option =>
          option.label.toLowerCase().includes(normalizedQuery)
        )
      ];
    }

    // Merge custom items at the top and de-dupe by label
    const merged = [...customMatches, ...results];
    const uniqueByLabel = merged.filter((opt, index, arr) => arr.findIndex(o => o.label === opt.label) === index);
    const next = uniqueByLabel.slice(0, 10);
    setSuggestions(next);
    setSelectedIndex(prev => Math.min(prev, Math.max(0, next.length - 1)));
  }, [query, customItems]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!suggestions.length) return;

      // Only handle these keys when autocomplete is visible and specifically for our container
      if (['ArrowDown', 'ArrowUp', 'Enter', 'Tab', 'Escape'].includes(e.key)) {
        // Check if the event is happening within our autocomplete context
        const target = e.target as Element;
        const isInAutocomplete = target && (
          containerRef.current?.contains(target) ||
          target.closest('[data-testid*="social-history-autocomplete"]') ||
          (textareaRef?.current && textareaRef.current.contains(target))
        );

        if (isInAutocomplete) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation(); // Stop other listeners from executing
          
          switch (e.key) {
            case "ArrowDown":
              setSelectedIndex(prev => (prev + 1) % suggestions.length);
              break;
            case "ArrowUp":
              setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
              break;
            case "Enter":
            case "Tab":
              if (suggestions[selectedIndex]) {
                const selected = suggestions[selectedIndex];
                onSelect(selected.format(query));
              }
              break;
            case "Escape":
              onClose();
              break;
          }
        }
      }
    };

    // Use document level for better reliability with higher priority
    document.addEventListener("keydown", handleKeyDown, { capture: true, passive: false });
    return () => {
      document.removeEventListener("keydown", handleKeyDown, { capture: true } as any);
    };
  }, [suggestions, selectedIndex, onSelect, onClose, query, textareaRef]);

  // Keep highlighted item in view while navigating
  useEffect(() => {
    const el = listRef.current?.querySelector('[aria-selected="true"]') as HTMLElement | null;
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex, suggestions.length]);

  // Stable behavior: do not close on outside click to keep popup until selection or query changes

  if (suggestions.length === 0) {
    return null;
  }
  return createPortal(
    <div
      ref={floatingRef as any}
      className="fixed z-50"
      style={{
        top: `${ready ? y : 0}px`,
        left: `${ready ? x : 0}px`,
        width: position.width ? `${position.width}px` : undefined,
        maxHeight: '240px',
        opacity: ready ? 1 : 0,
        pointerEvents: ready ? 'auto' : 'none'
      }}
      data-testid={`social-history-autocomplete-${sectionId}`}
    >
      <Card className="shadow-lg border border-gray-200">
        <CardContent className="p-0">
          <div ref={listRef} className="overflow-y-auto overscroll-contain" style={{ maxHeight: 240 }} role="listbox" aria-label="Social history suggestions">
            <div className="p-2 bg-[color:var(--brand-50)] border-b flex items-center gap-2">
              <Wine size={14} className="text-[color:var(--brand-700)]" />
              <span className="text-xs font-medium text-[color:var(--brand-700)]">Social History</span>
            </div>
            {suggestions.map((option, index) => (
              <Button
                key={`${option.id}-${index}`}
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start text-left h-auto py-2 px-3 rounded-none border-b border-gray-50 last:border-b-0",
                  index === selectedIndex && "bg-[color:var(--brand-50)] text-slate-900 border-l-2 border-[color:var(--brand-700)]"
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                  onSelect(option.format(query));
                }}
                data-testid={`social-history-suggestion-${index}`}
                role="option"
                aria-selected={index === selectedIndex}
                id={`social-history-option-${index}`}
              >
                <div className="flex items-center gap-2 w-full">
                  <option.icon size={16} className="text-[color:var(--brand-700)] flex-shrink-0" />
                  <div className="flex flex-col items-start gap-0.5 flex-1">
                    <span className="font-medium text-sm">{option.label}</span>
                    <span className="text-xs text-gray-500">{option.category}</span>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>,
    document.body
  );
}
