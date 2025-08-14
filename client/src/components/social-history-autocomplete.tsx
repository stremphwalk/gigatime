import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cigarette, Wine, Pill } from "lucide-react";
import { cn } from "@/lib/utils";

interface SocialHistoryAutocompleteProps {
  query: string;
  position: { top: number; left: number };
  onSelect: (formatted: string) => void;
  onClose: () => void;
  sectionId: string;
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
  sectionId
}: SocialHistoryAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<SocialHistoryOption[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

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

    setSuggestions(results);
    setSelectedIndex(0);
  }, [query]);

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
            const selected = suggestions[selectedIndex];
            onSelect(selected.format(query));
          }
          break;
        case "Escape":
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [suggestions, selectedIndex, onSelect, onClose, query]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

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
      data-testid={`social-history-autocomplete-${sectionId}`}
    >
      <Card className="shadow-lg border border-gray-200">
        <CardContent className="p-0">
          <div className="max-h-64 overflow-y-auto">
            <div className="p-2 bg-blue-50 border-b flex items-center gap-2">
              <Wine size={14} className="text-blue-600" />
              <span className="text-xs font-medium text-blue-700">Social History</span>
            </div>
            {suggestions.map((option, index) => (
              <Button
                key={`${option.id}-${index}`}
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start text-left h-auto py-2 px-3 rounded-none border-b border-gray-50 last:border-b-0",
                  index === selectedIndex && "bg-blue-50 text-blue-900"
                )}
                onClick={() => onSelect(option.format(query))}
                data-testid={`social-history-suggestion-${index}`}
              >
                <div className="flex items-center gap-2 w-full">
                  <option.icon size={16} className="text-blue-600 flex-shrink-0" />
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
    </div>
  );
}