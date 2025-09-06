import { useState, useEffect, useRef, useCallback } from "react";
import { searchMedicalConditions, getMedicalConditionAbbreviations } from "@/lib/medical-conditions";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAutocompleteItems } from "@/hooks/use-autocomplete-items";

interface MedicalConditionAutocompleteProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  isVisible: boolean;
  query: string;
  position: { top: number; left: number };
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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const abbreviations = getMedicalConditionAbbreviations();
  const { items: customItems } = useAutocompleteItems('past-medical-history');

  // Update suggestions when query changes
  useEffect(() => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    // Check if query matches an abbreviation
    const abbreviation = abbreviations[query.toLowerCase()];
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
      setSelectedIndex(0);
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
    setSelectedIndex(0);
  }, [query, customItems]);

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
      case 'Enter':
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          onSelect(suggestions[selectedIndex], cursorPosition);
        }
        break;
      case 'Tab':
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          onSelect(suggestions[selectedIndex], cursorPosition);
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
    onSelect(condition, cursorPosition);
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
            Medical Conditions (Press Tab to select, Enter for new line)
          </div>
          {suggestions.map((condition, index) => (
            <div
              key={condition}
              className={cn(
                "flex items-center justify-between p-2 rounded cursor-pointer text-sm",
                index === selectedIndex
                  ? "bg-[color:var(--brand-50)] border border-[color:var(--brand-200)] text-slate-900"
                  : "hover:bg-gray-50"
              )}
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={() => handleMouseSelect(condition, index)}
              data-testid={`suggestion-${index}`}
            >
              <span className="font-medium">{condition}</span>
              {index === selectedIndex && (
                <Check size={14} className="text-[color:var(--brand-700)]" />
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
