import { useEffect, useState } from "react";
import { useSmartPhrases } from "../hooks/use-smart-phrases";
import { cn } from "@/lib/utils";

interface SmartPhraseAutocompleteProps {
  query: string;
  position: { top: number; left: number };
  onSelect: (phrase: string) => void;
  onClose: () => void;
}

export function SmartPhraseAutocomplete({ 
  query, 
  position, 
  onSelect, 
  onClose 
}: SmartPhraseAutocompleteProps) {
  const [filteredPhrases, setFilteredPhrases] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { phrases } = useSmartPhrases();

  useEffect(() => {
    if (query.length > 0) {
      // Filter phrases based on trigger
      const filtered = phrases?.filter(phrase => 
        phrase.trigger.toLowerCase().includes(query.toLowerCase())
      ) || [];
      setFilteredPhrases(filtered.slice(0, 10)); // Limit to 10 results
      setSelectedIndex(0);
    } else {
      // Show default phrases when no query
      const defaultPhrases = [
        { trigger: "chest-pain", content: "Patient presents with chest pain...", description: "Standard chest pain assessment" },
        { trigger: "shortness-breath", content: "Patient reports shortness of breath...", description: "Shortness of breath template" },
        { trigger: "abdominal-pain", content: "Patient presents with abdominal pain...", description: "Abdominal pain assessment" }
      ];
      setFilteredPhrases(defaultPhrases);
      setSelectedIndex(0);
    }
  }, [query, phrases]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredPhrases.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredPhrases[selectedIndex]) {
          onSelect(filteredPhrases[selectedIndex].content);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [filteredPhrases, selectedIndex, onSelect, onClose]);

  if (filteredPhrases.length === 0) {
    return null;
  }

  return (
    <div 
      className="absolute bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-50 min-w-[300px] max-w-[400px]"
      style={{ 
        top: position.top + 'px', 
        left: position.left + 'px',
        position: 'fixed'
      }}
      data-testid="smart-phrase-autocomplete"
    >
      <div className="p-2 space-y-1 max-h-60 overflow-y-auto">
        {filteredPhrases.map((phrase, index) => (
          <div
            key={phrase.trigger}
            className={cn(
              "p-2 rounded cursor-pointer text-sm transition-colors",
              index === selectedIndex 
                ? "bg-professional-blue text-white" 
                : "hover:bg-gray-100"
            )}
            onClick={() => onSelect(phrase.content)}
            data-testid={`phrase-option-${phrase.trigger}`}
          >
            <div className="font-medium">/{phrase.trigger}</div>
            {phrase.description && (
              <div className={cn(
                "text-xs mt-1",
                index === selectedIndex ? "text-blue-100" : "text-gray-500"
              )}>
                {phrase.description}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="px-2 py-1 text-xs text-gray-500 border-t border-gray-100">
        Use ↑↓ to navigate, Enter to select, Esc to close
      </div>
    </div>
  );
}
