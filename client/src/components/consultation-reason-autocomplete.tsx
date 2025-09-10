import { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Star } from 'lucide-react';
import { searchReasons } from '@/lib/consultation-reasons';
import { useAutocompleteItems } from '@/hooks/use-autocomplete-items';
import { cn } from '@/lib/utils';

interface ConsultationReasonAutocompleteProps {
  query: string;
  position: { top: number; left: number; width?: number };
  onSelect: (reason: string) => void;
  onClose: () => void;
  type?: 'consultation' | 'admission';
  sectionId: string;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
}

export function ConsultationReasonAutocomplete({
  query,
  position,
  onSelect,
  onClose,
  type = 'consultation',
  sectionId,
  textareaRef
}: ConsultationReasonAutocompleteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get custom autocomplete items from database
  const { items: customItems } = useAutocompleteItems('consultation-reasons');

  const suggestions = useMemo(() => {
    const q = (query || '').toLowerCase().trim();
    const staticResults = searchReasons(query, type);
    const customResults = (customItems || [])
      .filter(item =>
        (item.text || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q)
      )
      .map(item => ({ text: item.text, isPriority: item.isPriority, isCustom: true }));
    const priorityCustom = customResults.filter(item => item.isPriority);
    const regularCustom = customResults.filter(item => !item.isPriority);
    const staticSuggestions = staticResults.map(text => ({ text, isCustom: false }));
    return [...priorityCustom, ...regularCustom, ...staticSuggestions].slice(0, 10);
  }, [query, type, customItems]);

  // Reset selection when query or type changes
  useEffect(() => { setSelectedIndex(0); }, [query, type]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!suggestions.length) return;

      // Only handle these keys when autocomplete is visible and specifically for our container
      if (['ArrowDown', 'ArrowUp', 'Enter', 'Tab', 'Escape'].includes(e.key)) {
        // Check if the event is happening within our autocomplete context
        const target = e.target as Element;
        const isInAutocomplete = target && (
          containerRef.current?.contains(target) ||
          target.closest('[data-testid*="consultation-reason-autocomplete"]') ||
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
                handleReasonSelect(suggestions[selectedIndex].text);
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
  }, [suggestions, selectedIndex, onClose, textareaRef]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Don't close if clicking within our autocomplete container
      if (containerRef.current && containerRef.current.contains(target)) {
        return;
      }
      
      // Don't close if clicking on the textarea
      const textarea = textareaRef?.current;
      if (textarea && textarea.contains(target)) {
        return;
      }
      
      onClose();
    };

    // Small delay to prevent immediate closure when popup appears
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside, true); // Use capture
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [onClose, textareaRef]);

  const handleReasonSelect = (reason: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    onSelect(reason);
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="absolute z-50"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: position.width ? `${position.width}px` : undefined,
        maxHeight: '240px'
      }}
      data-testid={`consultation-reason-autocomplete-${sectionId}`}
    >
      <Card className="shadow-lg border border-gray-200">
        <CardContent className="p-0">
          <div className="overflow-y-auto" style={{ maxHeight: 240 }} role="listbox" aria-label="Consultation/admission reasons">
            <div className="p-2 bg-[color:var(--brand-50)] border-b flex items-center gap-2">
              <FileText size={14} className="text-[color:var(--brand-700)]" />
              <span className="text-xs font-medium text-[color:var(--brand-700)]">
                {type === 'admission' ? 'Admission' : 'Consultation'} Reasons
              </span>
              {suggestions.some(s => s.isCustom) && (
                <span className="text-xs text-[color:var(--brand-700)] ml-auto">+ Custom</span>
              )}
            </div>
            {suggestions.map((suggestion, index) => (
              <Button
                key={`${suggestion.text}-${suggestion.isCustom}`}
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start text-left h-auto py-2 px-3 rounded-none border-b border-gray-50 last:border-b-0",
                  index === selectedIndex && "bg-[color:var(--brand-50)] text-slate-900",
                  suggestion.isPriority && "bg-yellow-50 border-yellow-200"
                )}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                  handleReasonSelect(suggestion.text, e);
                }}
                data-testid={`reason-suggestion-${index}`}
                role="option"
                aria-selected={index === selectedIndex}
                id={`consultation-reason-option-${index}`}
              >
                <div className="flex items-center gap-2 w-full">
                  {suggestion.isPriority ? (
                    <Star size={16} className="text-yellow-600 flex-shrink-0 fill-yellow-600" />
                  ) : (
                    <FileText size={16} className="text-[color:var(--brand-700)] flex-shrink-0" />
                  )}
                  <span className={cn(
                    "font-medium text-sm flex-1",
                    suggestion.isPriority && "text-yellow-800"
                  )}>
                    {suggestion.text}
                  </span>
                  {suggestion.isCustom && (
                    <span className="text-xs text-gray-500 font-normal">Custom</span>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
