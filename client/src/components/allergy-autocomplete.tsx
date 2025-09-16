import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useFloatingCaret } from "@/hooks/use-floating-caret";
import { FileText, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { searchAllergies } from "@/lib/medical-conditions";
import { useAutocompleteItems } from "@/hooks/use-autocomplete-items";
 
import { cn } from "@/lib/utils";

interface AllergyAutocompleteProps {
  query: string;
  position: { top: number; left: number; width?: number };
  onSelect: (allergy: string) => void;
  onClose: () => void;
  sectionId: string;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
}

export function AllergyAutocomplete({
  query,
  position,
  onSelect,
  onClose,
  sectionId,
  textareaRef
}: AllergyAutocompleteProps) {
  const { floatingRef, x, y, ready } = useFloatingCaret(textareaRef as any, { placement: "bottom-start", gutter: 6 });
  const [suggestions, setSuggestions] = useState<Array<{ text: string; isCustom?: boolean; isPriority?: boolean }>>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { items: customItems } = useAutocompleteItems('allergies');

  useEffect(() => {
    const q = (query || '').toLowerCase().trim();
    const staticResults = searchAllergies(query, 8);
    const customResults = (customItems || [])
      .filter(item =>
        (item.text || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q)
      )
      .map(item => ({ text: item.text, isCustom: true as const, isPriority: !!item.isPriority }));

    const priorityCustom = customResults.filter(i => i.isPriority);
    const regularCustom = customResults.filter(i => !i.isPriority);
    const staticSuggestions = staticResults.map(text => ({ text, isCustom: false as const }));

    const merged = [...priorityCustom, ...regularCustom, ...staticSuggestions].slice(0, 10);
    setSuggestions(merged);
    setSelectedIndex(prev => Math.min(prev, Math.max(0, merged.length - 1)));
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
          target.closest('[data-testid*="allergy-autocomplete"]') ||
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
                onSelect(suggestions[selectedIndex].text);
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
  }, [suggestions, selectedIndex, onSelect, onClose, textareaRef]);

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
      data-testid={`allergy-autocomplete-${sectionId}`}
    >
      <Card className="shadow-lg border border-gray-200">
        <CardContent className="p-0">
          <div ref={listRef} className="overflow-y-auto overscroll-contain" style={{ maxHeight: 240 }} role="listbox" aria-label="Allergy suggestions">
            <div className="p-2 bg-[color:var(--brand-50)] border-b flex items-center gap-2">
              <FileText size={14} className="text-[color:var(--brand-700)]" />
              <span className="text-xs font-medium text-[color:var(--brand-700)]">Allergies</span>
            </div>
            {suggestions.map((s, index) => (
              <Button
                key={`${s.text}-${index}`}
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start text-left h-auto py-2 px-3 rounded-none border-b border-gray-50 last:border-b-0",
                  index === selectedIndex && "bg-[color:var(--brand-50)] text-slate-900 border-l-2 border-[color:var(--brand-700)]",
                  s.isPriority && "bg-yellow-50 border-yellow-200"
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  (e as any).nativeEvent?.stopImmediatePropagation?.();
                  onSelect(s.text);
                }}
                data-testid={`allergy-suggestion-${index}`}
                role="option"
                aria-selected={index === selectedIndex}
                id={`allergy-option-${index}`}
              >
                <div className="flex items-center gap-2 w-full">
                  <FileText size={16} className="text-[color:var(--brand-700)] flex-shrink-0" />
                  <div className="flex flex-col items-start gap-0.5 flex-1">
                    <span className="font-medium text-sm">{s.text}</span>
                    <span className="text-xs text-gray-500">
                      {getAllergyCategory(s.text)}
                    </span>
                  </div>
                  {s.isCustom && <span className="text-xs text-gray-500 font-normal">Custom</span>}
                  {s.isPriority && <Star size={14} className="text-yellow-600 flex-shrink-0 fill-yellow-600" />}
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

function getAllergyCategory(allergy: string): string {
  const drugAllergies = ["Penicillin", "Sulfa drugs", "Codeine", "Morphine", "Aspirin", "NSAIDs", "Vancomycin", "Erythromycin"];
  const medicalAllergies = ["Latex", "Iodine/Contrast dye", "Adhesive tape"];
  const foodAllergies = ["Shellfish", "Peanuts", "Tree nuts", "Eggs", "Milk/Dairy", "Soy", "Wheat/Gluten"];
  const environmentalAllergies = ["Dust mites", "Pollen", "Pet dander", "Mold", "Bee stings"];
  const otherAllergies = ["Food dyes", "Preservatives"];

  if (drugAllergies.includes(allergy)) return "Medication";
  if (medicalAllergies.includes(allergy)) return "Medical material";
  if (foodAllergies.includes(allergy)) return "Food allergy"; 
  if (environmentalAllergies.includes(allergy)) return "Environmental";
  if (otherAllergies.includes(allergy)) return "Other";
  return "Allergy";
}
