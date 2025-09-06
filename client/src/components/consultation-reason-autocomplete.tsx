import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Star } from 'lucide-react';
import { searchReasons } from '@/lib/consultation-reasons';
import { useAutocompleteItems } from '@/hooks/use-autocomplete-items';
import { cn } from '@/lib/utils';

interface ConsultationReasonAutocompleteProps {
  query: string;
  position: { top: number; left: number };
  onSelect: (reason: string) => void;
  onClose: () => void;
  type?: 'consultation' | 'admission';
  sectionId: string;
}

export function ConsultationReasonAutocomplete({
  query,
  position,
  onSelect,
  onClose,
  type = 'consultation',
  sectionId
}: ConsultationReasonAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Array<{text: string, isPriority?: boolean, isCustom?: boolean}>>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get custom autocomplete items from database
  const { items: customItems } = useAutocompleteItems('consultation-reasons');

  useEffect(() => {
    // Get static reasons
    const staticResults = searchReasons(query, type);
    
    // Filter and search custom items
    const customResults = customItems
      .filter(item => 
        item.text.toLowerCase().includes(query.toLowerCase().trim()) ||
        item.description?.toLowerCase().includes(query.toLowerCase().trim())
      )
      .map(item => ({
        text: item.text,
        isPriority: item.isPriority,
        isCustom: true
      }));

    // Combine results with custom items first (especially priority ones)
    const priorityCustom = customResults.filter(item => item.isPriority);
    const regularCustom = customResults.filter(item => !item.isPriority);
    const staticSuggestions = staticResults.map(text => ({ text, isCustom: false }));

    // Combine: priority custom items, then regular custom items, then static items
    const allSuggestions = [
      ...priorityCustom,
      ...regularCustom,
      ...staticSuggestions
    ]
      .slice(0, 10); // Limit to 10 suggestions

    setSuggestions(allSuggestions);
    setSelectedIndex(0);
  }, [query, type, customItems]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!suggestions.length) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % suggestions.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
          break;
        case "Enter":
        case "Tab":
          e.preventDefault();
          if (suggestions[selectedIndex]) {
            handleReasonSelect(suggestions[selectedIndex].text);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [suggestions, selectedIndex, onClose]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

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
      className="fixed z-50"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        maxWidth: "320px",
        minWidth: "280px"
      }}
      data-testid={`consultation-reason-autocomplete-${sectionId}`}
    >
      <Card className="shadow-lg border border-gray-200">
        <CardContent className="p-0">
          <div className="max-h-64 overflow-y-auto">
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
                onClick={(e) => handleReasonSelect(suggestion.text, e)}
                data-testid={`reason-suggestion-${index}`}
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
