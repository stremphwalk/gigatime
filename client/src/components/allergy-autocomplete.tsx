import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { searchAllergies } from "@/lib/medical-conditions";
import { useAutocompleteItems } from "@/hooks/use-autocomplete-items";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AllergyAutocompleteProps {
  query: string;
  position: { top: number; left: number };
  onSelect: (allergy: string) => void;
  onClose: () => void;
  sectionId: string;
}

export function AllergyAutocomplete({
  query,
  position,
  onSelect,
  onClose,
  sectionId
}: AllergyAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { items: customItems } = useAutocompleteItems('allergies');

  useEffect(() => {
    const staticResults = searchAllergies(query, 8);

    // Filter custom items by query
    const filteredCustom = customItems
      .filter(item =>
        item.text.toLowerCase().includes(query.toLowerCase().trim()) ||
        item.description?.toLowerCase().includes(query.toLowerCase().trim())
      )
      .map(item => ({ text: item.text, isPriority: item.isPriority }))
      .sort((a, b) => Number(b.isPriority) - Number(a.isPriority))
      .map(i => i.text);

    // Merge custom first (priority first), then static; de-dupe
    const merged = Array.from(new Set([...filteredCustom, ...staticResults])).slice(0, 10);

    setSuggestions(merged);
    setSelectedIndex(0);
  }, [query, customItems]);

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
            onSelect(suggestions[selectedIndex]);
          }
          break;
        case "Escape":
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [suggestions, selectedIndex, onSelect, onClose]);

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
      data-testid={`allergy-autocomplete-${sectionId}`}
    >
      <Card className="shadow-lg border border-gray-200">
        <CardContent className="p-0">
          <div className="max-h-64 overflow-y-auto">
            <div className="p-2 bg-orange-50 border-b flex items-center gap-2">
              <AlertTriangle size={14} className="text-orange-600" />
              <span className="text-xs font-medium text-orange-700">Common Allergies</span>
            </div>
            {suggestions.map((allergy, index) => (
              <Button
                key={allergy}
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start text-left h-auto py-2 px-3 rounded-none border-b border-gray-50 last:border-b-0",
                  index === selectedIndex && "bg-orange-50 text-orange-900"
                )}
                onClick={() => onSelect(allergy)}
                data-testid={`allergy-suggestion-${index}`}
              >
                <div className="flex flex-col items-start gap-0.5">
                  <span className="font-medium text-sm">{allergy}</span>
                  <span className="text-xs text-gray-500">
                    {getAllergyCategory(allergy)}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
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
