import { useState, useEffect, useRef, useCallback } from "react";
import { searchMedicalConditions, getMedicalConditionAbbreviations } from "@/lib/medical-conditions";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface MedicalConditionAutocompleteProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  isVisible: boolean;
  query: string;
  position: { top: number; left: number };
  onSelect: (condition: string) => void;
  onClose: () => void;
}

export function MedicalConditionAutocomplete({
  textareaRef,
  isVisible,
  query,
  position,
  onSelect,
  onClose
}: MedicalConditionAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const abbreviations = getMedicalConditionAbbreviations();

  // Update suggestions when query changes
  useEffect(() => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    // Check if query matches an abbreviation
    const abbreviation = abbreviations[query.toLowerCase()];
    if (abbreviation) {
      setSuggestions([abbreviation]);
      setSelectedIndex(0);
      return;
    }

    // Search for medical conditions
    const results = searchMedicalConditions(query, 8);
    setSuggestions(results);
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isVisible || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev === 0 ? suggestions.length - 1 : prev - 1);
        break;
      case 'Tab':
      case 'Enter':
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          onSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [isVisible, suggestions, selectedIndex, onSelect, onClose]);

  // Attach keyboard event listener
  useEffect(() => {
    if (isVisible && textareaRef.current) {
      textareaRef.current.addEventListener('keydown', handleKeyDown);
      return () => {
        textareaRef.current?.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isVisible, handleKeyDown, textareaRef]);

  // Handle mouse selection
  const handleMouseSelect = (condition: string, index: number) => {
    setSelectedIndex(index);
    onSelect(condition);
  };

  if (!isVisible || suggestions.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="fixed z-50"
      style={{
        top: position.top,
        left: position.left,
        maxWidth: '300px',
        minWidth: '250px'
      }}
    >
      <Card className="border border-gray-200 shadow-lg max-h-64 overflow-y-auto bg-white">
        <div className="p-2">
          <div className="text-xs text-gray-500 mb-2 px-2">
            Past Medical History Suggestions (Press Tab to select)
          </div>
          {suggestions.map((condition, index) => (
            <div
              key={condition}
              className={cn(
                "flex items-center justify-between p-2 rounded cursor-pointer text-sm",
                index === selectedIndex
                  ? "bg-blue-50 border border-blue-200 text-blue-900"
                  : "hover:bg-gray-50"
              )}
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={() => handleMouseSelect(condition, index)}
              data-testid={`suggestion-${index}`}
            >
              <span className="font-medium">{condition}</span>
              {index === selectedIndex && (
                <Check size={14} className="text-blue-600" />
              )}
            </div>
          ))}
          {query && abbreviations[query.toLowerCase()] && (
            <div className="border-t border-gray-100 mt-2 pt-2">
              <div className="text-xs text-gray-500 px-2">
                Abbreviation: <span className="font-mono font-medium">{query.toUpperCase()}</span>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}