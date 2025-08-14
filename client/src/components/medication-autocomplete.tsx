import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pill, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchMedications, type MedicationInfo } from "@/lib/medications";

interface MedicationAutocompleteProps {
  query: string;
  position: { top: number; left: number };
  onSelect: (medication: string) => void;
  onClose: () => void;
  sectionId: string;
}

interface DosageFrequencyPopupProps {
  medication: MedicationInfo;
  position: { top: number; left: number };
  onSelect: (fullMedication: string) => void;
  onClose: () => void;
}

function DosageFrequencyPopup({ medication, position, onSelect, onClose }: DosageFrequencyPopupProps) {
  const [selectedDosage, setSelectedDosage] = useState<string>("");
  const [selectedFrequency, setSelectedFrequency] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleComplete = () => {
    if (selectedDosage && selectedFrequency) {
      const fullMedication = `${medication.name} ${selectedDosage} ${selectedFrequency}`;
      onSelect(fullMedication);
    }
  };

  const handleDosageSelect = (dosage: string) => {
    setSelectedDosage(dosage);
    if (selectedFrequency) {
      const fullMedication = `${medication.name} ${dosage} ${selectedFrequency}`;
      onSelect(fullMedication);
    }
  };

  const handleFrequencySelect = (frequency: string) => {
    setSelectedFrequency(frequency);
    if (selectedDosage) {
      const fullMedication = `${medication.name} ${selectedDosage} ${frequency}`;
      onSelect(fullMedication);
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed z-50"
      style={{
        top: `${position.top + 10}px`,
        left: `${position.left}px`,
        maxWidth: "300px",
        minWidth: "280px"
      }}
      data-testid="medication-dosage-popup"
    >
      <Card className="shadow-lg border border-gray-200">
        <CardContent className="p-3">
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Pill size={16} className="text-blue-600" />
              <span className="font-medium text-sm">{medication.name}</span>
              <Badge variant="outline" className="text-xs">{medication.category}</Badge>
            </div>
            <div className="text-xs text-gray-500">
              Select dosage and frequency (ESC to cancel)
            </div>
          </div>
          
          {/* Dosage Selection */}
          <div className="mb-3">
            <div className="text-xs font-medium text-gray-700 mb-1">Dosage:</div>
            <div className="flex flex-wrap gap-1">
              {medication.commonDosages.map((dosage) => (
                <Button
                  key={dosage}
                  variant={selectedDosage === dosage ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-6 px-2"
                  onClick={() => handleDosageSelect(dosage)}
                  data-testid={`dosage-${dosage}`}
                >
                  {dosage}
                </Button>
              ))}
            </div>
          </div>

          {/* Frequency Selection */}
          <div className="mb-2">
            <div className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Clock size={12} />
              Frequency:
            </div>
            <div className="flex flex-wrap gap-1">
              {medication.commonFrequencies.map((frequency) => (
                <Button
                  key={frequency}
                  variant={selectedFrequency === frequency ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-6 px-2"
                  onClick={() => handleFrequencySelect(frequency)}
                  data-testid={`frequency-${frequency}`}
                >
                  {frequency}
                </Button>
              ))}
            </div>
          </div>

          {selectedDosage && selectedFrequency && (
            <div className="mt-2 p-2 bg-green-50 rounded text-xs">
              <span className="font-medium text-green-800">
                {medication.name} {selectedDosage} {selectedFrequency}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function MedicationAutocomplete({
  query,
  position,
  onSelect,
  onClose,
  sectionId
}: MedicationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<MedicationInfo[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showDosagePopup, setShowDosagePopup] = useState<MedicationInfo | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const results = searchMedications(query, 8);
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
            handleMedicationSelect(suggestions[selectedIndex]);
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleMedicationSelect = (medication: MedicationInfo) => {
    // Show dosage/frequency popup
    setShowDosagePopup(medication);
  };

  const handleDosageFrequencySelect = (fullMedication: string) => {
    onSelect(fullMedication);
    setShowDosagePopup(null);
  };

  const handleDosagePopupClose = () => {
    setShowDosagePopup(null);
    onClose();
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <>
      <div
        ref={containerRef}
        className="fixed z-50"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          maxWidth: "320px",
          minWidth: "280px"
        }}
        data-testid={`medication-autocomplete-${sectionId}`}
      >
        <Card className="shadow-lg border border-gray-200">
          <CardContent className="p-0">
            <div className="max-h-64 overflow-y-auto">
              <div className="p-2 bg-purple-50 border-b flex items-center gap-2">
                <Pill size={14} className="text-purple-600" />
                <span className="text-xs font-medium text-purple-700">Common Medications</span>
              </div>
              {suggestions.map((medication, index) => (
                <Button
                  key={medication.name}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-left h-auto py-2 px-3 rounded-none border-b border-gray-50 last:border-b-0",
                    index === selectedIndex && "bg-purple-50 text-purple-900"
                  )}
                  onClick={() => handleMedicationSelect(medication)}
                  data-testid={`medication-suggestion-${index}`}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Pill size={16} className="text-purple-600 flex-shrink-0" />
                    <div className="flex flex-col items-start gap-0.5 flex-1">
                      <span className="font-medium text-sm">{medication.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{medication.category}</span>
                        <Badge variant="secondary" className="text-xs px-1 py-0">
                          {medication.commonDosages.length} dosages
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {showDosagePopup && (
        <DosageFrequencyPopup
          medication={showDosagePopup}
          position={position}
          onSelect={handleDosageFrequencySelect}
          onClose={handleDosagePopupClose}
        />
      )}
    </>
  );
}