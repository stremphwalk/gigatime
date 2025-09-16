import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useFloatingAnchor } from "@/hooks/use-floating-caret";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pill, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAutocompleteItems } from "@/hooks/use-autocomplete-items";
import { 
  searchMedications, 
  getMedicationCategories,
  searchMedicationsByCategory,
  type MedicationInfo 
} from "@/lib/medications";

interface MedicationAutocompleteProps {
  query: string;
  position: { top: number; left: number; width?: number };
  onSelect: (medication: string) => void;
  onClose: () => void;
  sectionId: string;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
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

  // Stable behavior: do not close on outside click to keep popup until selection or ESC

  const handleComplete = () => {
    if (selectedDosage && selectedFrequency) {
      const fullMedication = `${medication.name} ${selectedDosage} ${selectedFrequency}`;
      onSelect(fullMedication);
    }
  };

  const handleDosageSelect = (dosage: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDosage(dosage);
    if (selectedFrequency) {
      const fullMedication = `${medication.name} ${dosage} ${selectedFrequency}`;
      onSelect(fullMedication);
    }
  };

  const handleFrequencySelect = (frequency: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
              <Pill size={16} className="text-[color:var(--brand-700)]" />
              <span className="font-medium text-sm">{medication.name}</span>
              <Badge variant="outline" className="text-xs bg-[color:var(--brand-50)] text-[color:var(--brand-700)] border-[color:var(--brand-200)]">
                {medication.subcategory || medication.category}
              </Badge>
            </div>
            {medication.genericName && (
              <div className="text-xs text-gray-400 italic mb-1">{medication.genericName}</div>
            )}
            {medication.brandNames && medication.brandNames.length > 0 && (
              <div className="text-xs text-[color:var(--brand-700)] mb-1">
                Brand names: {medication.brandNames.join(', ')}
              </div>
            )}
            {medication.indication && (
              <div className="text-xs text-gray-600 mb-2">For: {medication.indication}</div>
            )}
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
                  onClick={(e) => handleDosageSelect(dosage, e)}
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
                  onClick={(e) => handleFrequencySelect(frequency, e)}
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

interface CustomItemPickerProps {
  medText: string;
  position: { top: number; left: number };
  dosageOptions?: string[];
  frequencyOptions?: string[];
  onSelect: (fullMedication: string) => void;
  onClose: () => void;
}

function CustomItemPicker({ medText, position, dosageOptions = [], frequencyOptions = [], onSelect, onClose }: CustomItemPickerProps) {
  const [selectedDosage, setSelectedDosage] = useState<string>("");
  const [selectedFrequency, setSelectedFrequency] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Stable behavior: do not close on outside click to keep picker until selection or ESC

  const commit = (d?: string, f?: string) => {
    const full = [medText, d, f].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    onSelect(full);
  };

  return (
    <div ref={containerRef} className="fixed z-50" style={{ top: `${position.top + 10}px`, left: `${position.left}px`, maxWidth: "300px", minWidth: "280px" }} data-testid="custom-medication-picker">
      <Card className="shadow-lg border border-gray-200">
        <CardContent className="p-3">
          <div className="text-sm font-medium mb-2">{medText}</div>
          {dosageOptions.length > 0 && (
            <div className="mb-2">
              <div className="text-xs font-medium text-gray-700 mb-1">Dosage Options</div>
              <div className="flex flex-wrap gap-1">
                {dosageOptions.map(d => (
                  <Button key={d} variant={selectedDosage === d ? 'default' : 'outline'} size="sm" className="text-xs h-6 px-2" onClick={() => { setSelectedDosage(d); if (selectedFrequency) commit(d, selectedFrequency); }}>{d}</Button>
                ))}
              </div>
            </div>
          )}
          {frequencyOptions.length > 0 && (
            <div className="mb-2">
              <div className="text-xs font-medium text-gray-700 mb-1">Frequency Options</div>
              <div className="flex flex-wrap gap-1">
                {frequencyOptions.map(f => (
                  <Button key={f} variant={selectedFrequency === f ? 'default' : 'outline'} size="sm" className="text-xs h-6 px-2" onClick={() => { setSelectedFrequency(f); if (selectedDosage) commit(selectedDosage, f); }}>{f}</Button>
                ))}
              </div>
            </div>
          )}
          {(!dosageOptions.length && !frequencyOptions.length) && (
            <div className="text-xs text-gray-500">No options provided. Selecting will insert the medication name only.</div>
          )}
          {selectedDosage && selectedFrequency && (
            <div className="mt-2 p-2 bg-green-50 rounded text-xs">
              <span className="font-medium text-green-800">{medText} {selectedDosage} {selectedFrequency}</span>
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
  sectionId,
  textareaRef
}: MedicationAutocompleteProps) {
  // Caret-anchored, body‑portaled positioning using Floating UI
  // Anchor the dropdown to the entire textarea element so it appears below the typing field
  const { floatingRef, x, y, ready } = useFloatingAnchor(textareaRef as any, { placement: "bottom-start", gutter: 6 });
  const [suggestions, setSuggestions] = useState<MedicationInfo[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showDosagePopup, setShowDosagePopup] = useState<MedicationInfo | null>(null);
  const [customPicker, setCustomPicker] = useState<{ text: string; dosages?: string[]; freqs?: string[] } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { items: customItems } = useAutocompleteItems('medications');

  useEffect(() => {
    const results = searchMedications(query, 8);
    setSuggestions(results);
    setSelectedIndex(prev => Math.min(prev, Math.max(0, results.length - 1)));
  }, [query]);

  const customSuggestions = customItems
    .filter(item =>
      item.text.toLowerCase().includes(query.toLowerCase().trim()) ||
      item.description?.toLowerCase().includes(query.toLowerCase().trim())
    )
    .sort((a, b) => Number(b.isPriority) - Number(a.isPriority))
    .slice(0, 5);

  // Build a single merged list to align UI/UX with ConsultationReasonAutocomplete
  const mergedItems = [
    ...customSuggestions.map((item) => ({ type: 'custom' as const, item })),
    ...suggestions.map((med) => ({ type: 'static' as const, med })),
  ];

  // Ensure the highlighted option stays in view when navigating
  useEffect(() => {
    const el = listRef.current?.querySelector('[aria-selected="true"]') as HTMLElement | null;
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex, mergedItems.length]);

  const handleCustomSelect = (text: string, dosage?: string, frequency?: string) => {
    const full = [text, dosage, frequency].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    onSelect(full);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const total = mergedItems.length;
      if (total === 0) return;

      // Only handle these keys when autocomplete is visible and specifically for our container
      if (['ArrowDown', 'ArrowUp', 'Enter', 'Tab', 'Escape'].includes(e.key)) {
        // Check if the event is happening within our autocomplete context
        const target = e.target as Element;
        const isInAutocomplete = target && (
          containerRef.current?.contains(target) ||
          target.closest('[data-testid*="medication-autocomplete"]') ||
          target.closest('[data-testid*="medication-dosage-popup"]') ||
          target.closest('[data-testid*="custom-medication-picker"]') ||
          (textareaRef?.current && textareaRef.current.contains(target))
        );

        if (isInAutocomplete) {
          e.preventDefault();
          e.stopPropagation();
          (e as any).stopImmediatePropagation?.(); // Stop other listeners from executing
          
          switch (e.key) {
            case "ArrowDown":
              setSelectedIndex(prev => (prev + 1) % total);
              break;
            case "ArrowUp":
              setSelectedIndex(prev => (prev - 1 + total) % total);
              break;
            case "Enter":
            case "Tab": {
              const idx = selectedIndex;
              const entry = mergedItems[idx];
              if (entry?.type === 'custom') {
                const item = entry.item;
                if ((e as any).shiftKey) {
                  // Quick insert: med name only
                  onSelect(item.text);
                } else if (item.dosageOptions?.length || item.frequencyOptions?.length) {
                  setCustomPicker({ text: item.text, dosages: item.dosageOptions, freqs: item.frequencyOptions });
                } else {
                  handleCustomSelect(item.text, item.dosage, item.frequency);
                }
              } else if (entry?.type === 'static') {
                if ((e as any).shiftKey) {
                  // Quick insert: med name only
                  onSelect(entry.med.name);
                } else {
                  handleMedicationSelect(entry.med);
                }
              }
              break;
            }
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
  }, [suggestions, customSuggestions, selectedIndex, onClose, textareaRef]);

  // Stable behavior: do not close on outside click to keep popup until selection or ESC

  const handleMedicationSelect = (medication: MedicationInfo, e?: React.MouseEvent) => {
    e?.stopPropagation();
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

  const portal = createPortal(
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
        data-testid={`medication-autocomplete-${sectionId}`}
      >
        <Card className="shadow-lg border border-gray-200">
          <CardContent className="p-0">
            <div ref={listRef} className="overflow-y-auto overscroll-contain" style={{ maxHeight: 240 }} role="listbox" aria-label="Medication suggestions">
              <div className="p-2 bg-[color:var(--brand-50)] border-b flex items-center gap-2">
                <Pill size={14} className="text-[color:var(--brand-700)]" />
                <span className="text-xs font-medium text-[color:var(--brand-700)]">Medications</span>
              </div>
              {mergedItems.map((entry, index) => {
                if (entry.type === 'custom') {
                  const item = entry.item;
                  return (
                    <Button
                      key={`custom-${item.id}`}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-full justify-start text-left h-auto py-2 px-3 rounded-none border-b border-gray-50 last:border-b-0",
                        index === selectedIndex && "bg-[color:var(--brand-50)] text-slate-900 border-l-2 border-[color:var(--brand-700)]"
                      )}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        (e as any).nativeEvent?.stopImmediatePropagation?.();
                        if (e.shiftKey) {
                          // Quick insert: med name only
                          onSelect(item.text);
                        } else if (item.dosageOptions?.length || item.frequencyOptions?.length) {
                          setCustomPicker({ text: item.text, dosages: item.dosageOptions, freqs: item.frequencyOptions });
                        } else {
                          handleCustomSelect(item.text, item.dosage, item.frequency);
                        }
                      }}
                      data-testid={`medication-suggestion-${index}`}
                      role="option"
                      aria-selected={index === selectedIndex}
                      id={`medication-option-${index}`}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Pill size={16} className="text-[color:var(--brand-700)] flex-shrink-0" />
                        <div className="flex flex-col items-start gap-0.5 flex-1">
                          <span className="font-medium text-sm">{item.text}</span>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {item.dosage && <span>Dosage: {item.dosage}</span>}
                            {item.frequency && <span>Frequency: {item.frequency}</span>}
                            {item.isPriority && <Badge variant="outline" className="text-[10px]">Priority</Badge>}
                          </div>
                        </div>
                      </div>
                    </Button>
                  );
                } else {
                  const medication = entry.med;
                  return (
                    <Button
                      key={`med-${medication.name}`}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-full justify-start text-left h-auto py-2 px-3 rounded-none border-b border-gray-50 last:border-b-0",
                        index === selectedIndex && "bg-[color:var(--brand-50)] text-slate-900 border-l-2 border-[color:var(--brand-700)]"
                      )}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        (e as any).nativeEvent?.stopImmediatePropagation?.();
                        if (e.shiftKey) {
                          // Quick insert: med name only
                          onSelect(medication.name);
                        } else {
                          handleMedicationSelect(medication, e);
                        }
                      }}
                      data-testid={`medication-suggestion-${index}`}
                      role="option"
                      aria-selected={index === selectedIndex}
                      id={`medication-option-${index}`}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Pill size={16} className="text-[color:var(--brand-700)] flex-shrink-0" />
                        <div className="flex flex-col items-start gap-0.5 flex-1">
                          <span className="font-medium text-sm">{medication.name}</span>
                          {medication.genericName && (
                            <span className="text-xs text-gray-400 italic">{medication.genericName}</span>
                          )}
                          {medication.brandNames && medication.brandNames.length > 0 && (
                            <span className="text-xs text-[color:var(--brand-700)]">
                              Brand: {medication.brandNames.slice(0, 2).join(', ')}{medication.brandNames.length > 2 ? '...' : ''}
                            </span>
                          )}
                          <div className="flex items-center gap-1 flex-wrap">
                            <Badge variant="outline" className="text-xs px-1 py-0 bg-[color:var(--brand-50)] text-[color:var(--brand-700)] border-[color:var(--brand-200)]">
                              {medication.subcategory || medication.category}
                            </Badge>
                            {medication.indication && (
                              <span className="text-xs text-gray-500 truncate max-w-32">{medication.indication}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Button>
                  );
                }
              })}
            </div>
          </CardContent>
        </Card>
      </div>,
      document.body
    );

  return (
    <>
      {portal}
      {showDosagePopup && (
        createPortal(
          <DosageFrequencyPopup
            medication={showDosagePopup}
            position={{ top: ready ? y : 0, left: ready ? x : 0 }}
            onSelect={handleDosageFrequencySelect}
            onClose={handleDosagePopupClose}
          />,
          document.body
        )
      )}
      {customPicker && (
        createPortal(
          <CustomItemPicker
            medText={customPicker.text}
            position={{ top: ready ? y : 0, left: ready ? x : 0 }}
            dosageOptions={customPicker.dosages}
            frequencyOptions={customPicker.freqs}
            onSelect={(full) => { onSelect(full); setCustomPicker(null); }}
            onClose={() => { setCustomPicker(null); onClose(); }}
          />,
          document.body
        )
      )}
    </>
  );
}
