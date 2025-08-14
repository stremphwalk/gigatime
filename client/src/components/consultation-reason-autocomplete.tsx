import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { searchReasons } from '@/lib/consultation-reasons';
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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const results = searchReasons(query, type);
    setSuggestions(results);
    setSelectedIndex(0);
  }, [query, type]);

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
            handleReasonSelect(suggestions[selectedIndex]);
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
            <div className="p-2 bg-blue-50 border-b flex items-center gap-2">
              <FileText size={14} className="text-blue-600" />
              <span className="text-xs font-medium text-blue-700">
                {type === 'admission' ? 'Admission' : 'Consultation'} Reasons
              </span>
            </div>
            {suggestions.map((reason, index) => (
              <Button
                key={reason}
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start text-left h-auto py-2 px-3 rounded-none border-b border-gray-50 last:border-b-0",
                  index === selectedIndex && "bg-blue-50 text-blue-900"
                )}
                onClick={(e) => handleReasonSelect(reason, e)}
                data-testid={`reason-suggestion-${index}`}
              >
                <div className="flex items-center gap-2 w-full">
                  <FileText size={16} className="text-blue-600 flex-shrink-0" />
                  <span className="font-medium text-sm">{reason}</span>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}