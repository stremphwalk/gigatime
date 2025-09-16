import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useFloatingAnchor } from "@/hooks/use-floating-caret";
import { searchMedicalConditions, getMedicalConditionAbbreviations, MEDICAL_CONDITIONS } from "@/lib/medical-conditions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAutocompleteItems } from "@/hooks/use-autocomplete-items";

interface MedicalConditionAutocompleteProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  isVisible: boolean;
  query: string;
  position: { top: number; left: number; width?: number };
  cursorPosition: number;
  onSelect: (condition: string, cursorPosition: number) => void;
  onClose: () => void;
}

export function MedicalConditionAutocomplete({
  textareaRef,
  isVisible,
  query,
  position,
  cursorPosition,
  onSelect,
  onClose
}: MedicalConditionAutocompleteProps) {
  // Anchor dropdown to the textarea field (below the input), consistent with admissions UX
  const { floatingRef, x, y, ready } = useFloatingAnchor(textareaRef as any, { placement: "bottom-start", gutter: 6 });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const abbreviations = getMedicalConditionAbbreviations();
  const { items: customItems } = useAutocompleteItems('past-medical-history');

  // Update suggestions when query changes
  useEffect(() => {
    // When query is empty or too short, surface recommended common conditions
    if (!query || query.length < 2) {
      const priorityCustom = customItems
        .filter(item => item.isPriority)
        .map(i => i.text);
      const recommended = Array.from(new Set([...priorityCustom, ...MEDICAL_CONDITIONS])).slice(0, 10);
      setSuggestions(recommended);
      setSelectedIndex(prev => Math.min(prev, Math.max(0, recommended.length - 1)));
      return;
    }

    // Check if query matches an abbreviation
    const abbreviation = abbreviations[query.toLowerCase() as keyof typeof abbreviations];
    if (abbreviation) {
      // Include priority custom items that also match
      const customMatches = customItems
        .filter(item =>
          item.text.toLowerCase().includes(query.toLowerCase().trim()) ||
          item.description?.toLowerCase().includes(query.toLowerCase().trim())
        )
        .sort((a, b) => Number(b.isPriority) - Number(a.isPriority))
        .map(i => i.text);
      const merged = Array.from(new Set([...customMatches, abbreviation])).slice(0, 10);
      setSuggestions(merged);
      setSelectedIndex(prev => Math.min(prev, Math.max(0, merged.length - 1)));
      return;
    }

    // Search for medical conditions and merge custom items (priority first)
    const results = searchMedicalConditions(query, 8);
    const customMatches = customItems
      .filter(item =>
        item.text.toLowerCase().includes(query.toLowerCase().trim()) ||
        item.description?.toLowerCase().includes(query.toLowerCase().trim())
      )
      .sort((a, b) => Number(b.isPriority) - Number(a.isPriority))
      .map(i => i.text);
    const merged = Array.from(new Set([...customMatches, ...results])).slice(0, 10);
    setSuggestions(merged);
    setSelectedIndex(prev => Math.min(prev, Math.max(0, merged.length - 1)));
  }, [query, customItems]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isVisible || suggestions.length === 0) return;

    // Only handle these keys when autocomplete is visible and specifically for our container
    if (['ArrowDown', 'ArrowUp', 'Enter', 'Tab', 'Escape'].includes(e.key)) {
      // Check if the event is happening within our autocomplete context
      const target = e.target as Element;
      const isInAutocomplete = target && (
        containerRef.current?.contains(target) ||
        target.closest('[data-testid*="medical-condition-autocomplete"]') ||
        (textareaRef?.current && textareaRef.current.contains(target))
      );

      if (isInAutocomplete) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation(); // Stop other listeners from executing
        
        switch (e.key) {
          case 'ArrowDown':
            setSelectedIndex(prev => (prev + 1) % suggestions.length);
            break;
          case 'ArrowUp':
            setSelectedIndex(prev => prev === 0 ? suggestions.length - 1 : prev - 1);
            break;
          case 'Enter':
            if (suggestions[selectedIndex]) {
              onSelect(suggestions[selectedIndex], cursorPosition);
            }
            break;
          case 'Tab':
            if (suggestions[selectedIndex]) {
              onSelect(suggestions[selectedIndex], cursorPosition);
            }
            break;
          case 'Escape':
            onClose();
            break;
        }
      }
    }
  }, [isVisible, suggestions, selectedIndex, onSelect, onClose, cursorPosition, textareaRef]);

  // Attach keyboard event listener at document level for better reliability
  useEffect(() => {
    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown, true); // Use capture phase
      return () => {
        document.removeEventListener('keydown', handleKeyDown, true);
      };
    }
  }, [isVisible, handleKeyDown]);

  // Keep highlighted item in view while navigating
  useEffect(() => {
    const el = (listRef.current || containerRef.current)?.querySelector('[aria-selected="true"]') as HTMLElement | null;
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex, suggestions.length]);

  // Stable behavior: do not close on outside click to keep popup until selection or query changes

  // Handle mouse selection
  const handleMouseSelect = (condition: string, index: number, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setSelectedIndex(index);
    onSelect(condition, cursorPosition);
  };

  if (!isVisible || suggestions.length === 0) {
    return null;
  }

  return createPortal(
    <div
      ref={floatingRef as any}
      className="fixed z-50"
      style={{
        top: ready ? y : 0,
        left: ready ? x : 0,
        width: position.width ? `${position.width}px` : undefined,
        maxHeight: '240px',
        opacity: ready ? 1 : 0,
        pointerEvents: ready ? 'auto' : 'none'
      }}
    >
      <Card className="border border-gray-200 shadow-lg overflow-y-auto bg-white" style={{ maxHeight: 240 }}>
        <div ref={listRef} className="p-0 overscroll-contain" role="listbox" aria-label="Medical condition suggestions">
          <div className="p-2 bg-[color:var(--brand-50)] border-b flex items-center gap-2">
            <FileText size={14} className="text-[color:var(--brand-700)]" />
            <span className="text-xs font-medium text-[color:var(--brand-700)]">Medical Conditions</span>
          </div>
          {suggestions.map((condition, index) => (
            <Button
              key={condition}
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start text-left h-auto py-2 px-3 rounded-none border-b border-gray-50 last:border-b-0",
                index === selectedIndex && "bg-[color:var(--brand-50)] text-slate-900 border-l-2 border-[color:var(--brand-700)]"
              )}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={(e) => handleMouseSelect(condition, index, e)}
              data-testid={`pmh-suggestion-${index}`}
              role="option"
              aria-selected={index === selectedIndex}
              id={`medical-condition-option-${index}`}
            >
              <div className="flex items-center gap-2 w-full">
                <FileText size={16} className="text-[color:var(--brand-700)] flex-shrink-0" />
                <span className="font-medium text-sm">{condition}</span>
              </div>
            </Button>
          ))}
        </div>
      </Card>
    </div>,
    document.body
  );
}
