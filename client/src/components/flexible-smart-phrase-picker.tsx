import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, Calendar, MousePointer, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
// date-fns format not needed here; formatting handled in formatter util
import { formatSmartPhrase } from "@/lib/smart-phrase-format";

interface InteractiveElement {
  id: string;
  type: "multipicker" | "nested_multipicker" | "date";
  label: string;
  placeholder: string;
  settings?: {
    displayMode?: 'chips' | 'dropdown';
    joiner?: string; // default: single space
    outputFormat?: 'leaf' | 'fullPath'; // for nested
    optional?: boolean; // default true
  };
  options?: Array<{
    id: string;
    label: string;
    value: string;
    children?: Array<{ id: string; label: string; value: string; }>
  }>;
}

interface FlexibleSmartPhrasePickerProps {
  phrase: {
    content: string;
    elements: InteractiveElement[];
  };
  position: { top: number; left: number };
  onSelect: (result: string) => void;
  onCancel: () => void;
  autoShow?: boolean;
  onUpdate?: (result: string, selections: Record<string, any>) => void;
  initialSelections?: Record<string, any>;
  initialStep?: number;
}

export function FlexibleSmartPhrasePicker({ 
  phrase, 
  position, 
  onSelect, 
  onCancel,
  autoShow = false,
  onUpdate,
  initialSelections,
  initialStep,
}: FlexibleSmartPhrasePickerProps) {
  const [selections, setSelections] = useState<Record<string, any>>(initialSelections || {});
  const [currentStep, setCurrentStep] = useState(initialStep ?? 0);
  const [showPicker, setShowPicker] = useState(autoShow);
  const [searchQueryByElement, setSearchQueryByElement] = useState<Record<string, string>>({});
  const [freeTextByElement, setFreeTextByElement] = useState<Record<string, string>>({});
  const [nestedPathByElement, setNestedPathByElement] = useState<Record<string, string[]>>({}); // array of option ids per element
  const [focusedIndexByElement, setFocusedIndexByElement] = useState<Record<string, number>>({});
  const [openDropdownByElement, setOpenDropdownByElement] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (autoShow) {
      setShowPicker(true);
    }
  }, [autoShow]);

  useEffect(() => {
    if (initialSelections) {
      setSelections(initialSelections);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSelections && Object.keys(initialSelections).join('|')]);

  useEffect(() => {
    if (typeof initialStep === 'number') {
      setCurrentStep(Math.min(Math.max(0, initialStep), phrase.elements.length - 1));
    }
  }, [initialStep, phrase.elements.length]);

  const notifyUpdate = (nextSelections: Record<string, any>) => {
    const result = formatSmartPhrase(phrase as any, nextSelections);
    onUpdate?.(result, nextSelections);
  };

  const setSelectionsAndNotify = (updater: (prev: Record<string, any>) => Record<string, any>) => {
    setSelections(prev => {
      const next = updater(prev);
      notifyUpdate(next);
      return next;
    });
  };

  const setMultiSelection = (elementId: string, nextValues: string[]) => {
    setSelectionsAndNotify(prev => ({
      ...prev,
      [elementId]: nextValues
    }));
  };

  const handleElementSelection = (elementId: string, value: any) => {
    // generic setter (used by date)
    setSelectionsAndNotify(prev => ({ ...prev, [elementId]: value }));
    // Auto-advance for date elements
    if (currentStep < phrase.elements.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const toggleMultiSelection = (elementId: string, value: string) => {
    const current: string[] = Array.isArray(selections[elementId]) ? selections[elementId] : [];
    const exists = current.includes(value);
    const next = exists ? current.filter(v => v !== value) : [...current, value];
    setMultiSelection(elementId, next);
  };

  const addFreeform = (elementId: string, text: string) => {
    const value = text.trim();
    if (!value) return;
    const current: string[] = Array.isArray(selections[elementId]) ? selections[elementId] : [];
    setMultiSelection(elementId, [...current, value]);
    setFreeTextByElement(prev => ({ ...prev, [elementId]: '' }));
  };

  const buildResult = () => {
    // Use new formatter: defaults to space-joined items and full path for nested
    return formatSmartPhrase(phrase as any, selections);
  };

  const handleComplete = () => {
    const result = buildResult();
    onSelect(result);
  };

  const canComplete = () => true; // All elements are optional

  const renderElementPicker = (element: InteractiveElement, isActive: boolean) => {
    if (!isActive) return null;

    switch (element.type) {
      case 'date':
        return (
          <div className="space-y-3">
            <h3 className="font-medium flex items-center">
              <Calendar size={16} className="mr-2" />
              {element.label}
            </h3>
            <CalendarComponent
              mode="single"
              selected={selections[element.id]}
              onSelect={(date) => date && handleElementSelection(element.id, date)}
              className="rounded-md border"
              initialFocus
            />
          </div>
        );

      case 'multipicker': {
        const selected: string[] = Array.isArray(selections[element.id]) ? selections[element.id] : [];
        const q = (searchQueryByElement[element.id] || '').toLowerCase();
        const allOptions = element.options || [];
        const options = allOptions.filter(opt => opt.label.toLowerCase().includes(q));
        const displayMode = element.settings?.displayMode || 'chips';
        const focusedIndex = focusedIndexByElement[element.id] ?? (options.length > 0 ? 0 : -1);
        const setFocused = (idx: number) => setFocusedIndexByElement(prev => ({ ...prev, [element.id]: idx }));
        const handleListKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (options.length === 0) return;
            setFocused((focusedIndex + 1) % options.length);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (options.length === 0) return;
            setFocused((focusedIndex - 1 + options.length) % options.length);
          } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (focusedIndex >= 0 && focusedIndex < options.length) {
              const optionValue = options[focusedIndex].value || options[focusedIndex].label;
              toggleMultiSelection(element.id, optionValue);
            }
          } else if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
          } else if (e.key === 'Backspace') {
            if (!searchQueryByElement[element.id] && selected.length > 0) {
              setMultiSelection(element.id, selected.slice(0, -1));
            }
          }
        };
        return (
          <div className="space-y-3">
            <h3 className="font-medium flex items-center">
              <MousePointer size={16} className="mr-2" />
              {element.label}
            </h3>

            {/* Selected chips */}
            {selected.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {selected.map((val) => (
                    <Badge key={val} variant="secondary" className="flex items-center gap-1" aria-label={`Selected ${val}`}>
                      {val}
                      <button aria-label={`Remove ${val}`} onClick={() => setMultiSelection(element.id, selected.filter(v => v !== val))}>
                        <X size={12} />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Button variant="ghost" size="sm" onClick={() => setMultiSelection(element.id, [])}>Clear all</Button>
              </div>
            )}

            {displayMode === 'dropdown' ? (
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-haspopup="listbox"
                  aria-expanded={openDropdownByElement[element.id] ? 'true' : 'false'}
                  onClick={() => setOpenDropdownByElement(prev => ({ ...prev, [element.id]: !prev[element.id] }))}
                >
                  {selected.length > 0 ? `${selected.length} selected` : 'Select options'}
                </Button>
                {openDropdownByElement[element.id] && (
                  <div className="mt-2 rounded-md border bg-white shadow-sm p-2" role="listbox" aria-multiselectable onKeyDown={handleListKey} tabIndex={0}>
                    <div className="flex gap-2 mb-2">
                      <input
                        value={searchQueryByElement[element.id] || ''}
                        onChange={(e) => setSearchQueryByElement(prev => ({ ...prev, [element.id]: e.target.value }))}
                        placeholder="Search options"
                        className="flex-1 border rounded px-2 py-1 text-sm"
                      />
                      <input
                        value={freeTextByElement[element.id] || ''}
                        onChange={(e) => setFreeTextByElement(prev => ({ ...prev, [element.id]: e.target.value }))}
                        placeholder="Add custom…"
                        className="border rounded px-2 py-1 text-sm"
                        onKeyDown={(e: any) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addFreeform(element.id, freeTextByElement[element.id] || '');
                          }
                        }}
                      />
                      <Button size="sm" onClick={() => addFreeform(element.id, freeTextByElement[element.id] || '')}>Add</Button>
                    </div>
                    <div className="max-h-48 overflow-auto">
                      {options.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">No options</div>
                      ) : options.map((option, idx) => {
                        const optionValue = option.value || option.label;
                        const isSelected = selected.includes(optionValue);
                        const isFocused = idx === focusedIndex;
                        return (
                          <div
                            key={option.id}
                            role="option"
                            aria-selected={isSelected}
                            tabIndex={-1}
                            className={cn("flex items-center gap-2 p-2 cursor-pointer", isFocused ? 'bg-muted/70' : 'hover:bg-muted/50')}
                            onMouseEnter={() => setFocused(idx)}
                            onClick={() => toggleMultiSelection(element.id, optionValue)}
                          >
                            <input type="checkbox" readOnly checked={isSelected} />
                            <span className="text-sm">{option.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Search + custom input */}
                <div className="flex gap-2">
                  <input
                    value={searchQueryByElement[element.id] || ''}
                    onChange={(e) => setSearchQueryByElement(prev => ({ ...prev, [element.id]: e.target.value }))}
                    placeholder="Search options"
                    className="flex-1 border rounded px-2 py-1 text-sm"
                    onKeyDown={(e: any) => {
                      if (e.key === 'Backspace' && !e.currentTarget.value && selected.length > 0) {
                        setMultiSelection(element.id, selected.slice(0, -1));
                      }
                    }}
                  />
                  <input
                    value={freeTextByElement[element.id] || ''}
                    onChange={(e) => setFreeTextByElement(prev => ({ ...prev, [element.id]: e.target.value }))}
                    placeholder="Add custom…"
                    className="border rounded px-2 py-1 text-sm"
                    onKeyDown={(e: any) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addFreeform(element.id, freeTextByElement[element.id] || '');
                      }
                    }}
                  />
                  <Button size="sm" onClick={() => addFreeform(element.id, freeTextByElement[element.id] || '')}>Add</Button>
                </div>

                {/* Options list */}
                <div className="max-h-48 overflow-auto rounded border" role="listbox" aria-multiselectable tabIndex={0} onKeyDown={handleListKey}>
                  {options.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">No options</div>
                  ) : options.map((option, idx) => {
                    const optionValue = option.value || option.label;
                    const isSelected = selected.includes(optionValue);
                    const isFocused = idx === focusedIndex;
                    return (
                      <div
                        key={option.id}
                        role="option"
                        aria-selected={isSelected}
                        tabIndex={-1}
                        className={cn("flex items-center gap-2 p-2 cursor-pointer", isFocused ? 'bg-muted/70' : 'hover:bg-muted/50')}
                        onMouseEnter={() => setFocused(idx)}
                        onClick={() => toggleMultiSelection(element.id, optionValue)}
                      >
                        <input type="checkbox" readOnly checked={isSelected} />
                        <span className="text-sm">{option.label}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        );
      }

      case 'nested_multipicker': {
        // Helpers for tree navigation
        const pathIds = nestedPathByElement[element.id] || [];

        const getNodeById = (nodes: any[] | undefined, id: string): any | null => {
          if (!nodes) return null;
          for (const n of nodes) {
            if (n.id === id) return n;
            const found = getNodeById(n.children, id);
            if (found) return found;
          }
          return null;
        };

        const getNodeByPath = (nodes: any[] | undefined, ids: string[]): any | null => {
          if (!nodes || ids.length === 0) return null;
          let current: any | null = null;
          let currentChildren = nodes;
          for (const id of ids) {
            current = currentChildren?.find((c: any) => c.id === id) || null;
            currentChildren = current?.children;
            if (!current) break;
          }
          return current;
        };

        const getCurrentLevelOptions = (): any[] => {
          if (pathIds.length === 0) return element.options || [];
          const node = getNodeByPath(element.options, pathIds);
          return node?.children || [];
        };

        const q = (searchQueryByElement[element.id] || '').toLowerCase();
        const options = getCurrentLevelOptions().filter((n: any) => (n.label || '').toLowerCase().includes(q));

        const labelsForPath = (): string[] => {
          const out: string[] = [];
          let nodes = element.options || [];
          for (const id of pathIds) {
            const n = nodes.find((x: any) => x.id === id);
            if (!n) break;
            out.push(n.label || '');
            nodes = n.children || [];
          }
          return out;
        };

        const handleChooseNode = (node: any) => {
          if (node.children && node.children.length > 0) {
            // go deeper
            setNestedPathByElement(prev => ({
              ...prev,
              [element.id]: [...(prev[element.id] || []), node.id]
            }));
            setSearchQueryByElement(prev => ({ ...prev, [element.id]: '' }));
            return;
          }
          // leaf selected: set final selection as its value/label
          const val = node.value || node.label;
          setNestedPathByElement(prev => ({ ...prev, [element.id]: [...(prev[element.id] || []), node.id] }));
          setSelectionsAndNotify(prev => ({ ...prev, [element.id]: val }));
          // auto-advance to next element
          if (currentStep < phrase.elements.length - 1) {
            setCurrentStep(prev => prev + 1);
          }
        };

        const selectedValue = selections[element.id];
        let selectedPathLabels: string[] | null = null;
        if (selectedValue) {
          // compute full path labels for the selectedValue using options
          // we can traverse from pathIds when set; otherwise attempt to find by value
          const labels = labelsForPath();
          selectedPathLabels = labels.length > 0 ? labels : null;
        }

        const clearSelection = () => {
          setNestedPathByElement(prev => ({ ...prev, [element.id]: [] }));
          setSelectionsAndNotify(prev => ({ ...prev, [element.id]: undefined }));
        };

        const goToBreadcrumb = (index: number) => {
          // index is inclusive position in path to keep
          setNestedPathByElement(prev => ({
            ...prev,
            [element.id]: (prev[element.id] || []).slice(0, index + 1)
          }));
          setSearchQueryByElement(prev => ({ ...prev, [element.id]: '' }));
        };

        return (
          <div className="space-y-3">
            <h3 className="font-medium flex items-center">
              <ChevronRight size={16} className="mr-2" />
              {element.label}
            </h3>

            {/* Selected chip (full path) */}
            {selectedValue && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  {(selectedPathLabels && selectedPathLabels.length > 0) ? selectedPathLabels.join(' > ') : String(selectedValue)}
                  <button aria-label="Clear" onClick={clearSelection}><X size={12} /></button>
                </Badge>
              </div>
            )}

            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              {pathIds.length === 0 ? (
                <span>Choose a category</span>
              ) : (
                <>
                  <button
                    className="hover:underline"
                    onClick={() => setNestedPathByElement(prev => ({ ...prev, [element.id]: [] }))}
                  >
                    Root
                  </button>
                  {labelsForPath().map((lbl, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <ChevronRight size={12} />
                      <button className="hover:underline" onClick={() => goToBreadcrumb(i)}>{lbl}</button>
                    </span>
                  ))}
                </>
              )}
            </div>

            {/* Search */}
            <div className="flex gap-2">
              <input
                value={searchQueryByElement[element.id] || ''}
                onChange={(e) => setSearchQueryByElement(prev => ({ ...prev, [element.id]: e.target.value }))}
                placeholder="Search this level"
                className="flex-1 border rounded px-2 py-1 text-sm"
              />
              {pathIds.length > 0 && (
                <Button size="sm" variant="outline" onClick={() => setNestedPathByElement(prev => ({ ...prev, [element.id]: pathIds.slice(0, -1) }))}>Back</Button>
              )}
            </div>

            {/* Options at current level */}
            <div className="max-h-48 overflow-auto rounded border" role="listbox" tabIndex={0}
                 onKeyDown={(e) => {
                   // Simple keyboard support for nested
                   const focusedIndex = focusedIndexByElement[element.id] ?? (options.length > 0 ? 0 : -1);
                   if (e.key === 'ArrowDown') {
                     e.preventDefault();
                     if (options.length === 0) return;
                     setFocusedIndexByElement(prev => ({ ...prev, [element.id]: (focusedIndex + 1) % options.length }));
                   } else if (e.key === 'ArrowUp') {
                     e.preventDefault();
                     if (options.length === 0) return;
                     setFocusedIndexByElement(prev => ({ ...prev, [element.id]: (focusedIndex - 1 + options.length) % options.length }));
                   } else if (e.key === 'Enter' || e.key === ' ') {
                     e.preventDefault();
                     if (focusedIndex >= 0 && focusedIndex < options.length) handleChooseNode(options[focusedIndex]);
                   } else if (e.key === 'Escape') {
                     e.preventDefault();
                     onCancel();
                   } else if (e.key === 'Backspace') {
                     if ((nestedPathByElement[element.id] || []).length > 0) {
                       setNestedPathByElement(prev => ({ ...prev, [element.id]: (prev[element.id] || []).slice(0, -1) }));
                     }
                   }
                 }}>
              {options.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">No options</div>
              ) : options.map((node, idx) => {
                const isLeaf = !node.children || node.children.length === 0;
                const isFocused = (focusedIndexByElement[element.id] ?? 0) === idx;
                return (
                  <div
                    key={node.id}
                    role="option"
                    aria-selected={false}
                    tabIndex={-1}
                    className={cn("w-full text-left p-2 flex items-center justify-between cursor-pointer", isFocused ? 'bg-muted/70' : 'hover:bg-muted/50')}
                    onMouseEnter={() => setFocusedIndexByElement(prev => ({ ...prev, [element.id]: idx }))}
                    onClick={() => handleChooseNode(node)}
                  >
                    <span className="text-sm">{node.label}</span>
                    {!isLeaf && <ChevronRight size={14} />}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  if (!showPicker) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Smart phrase configuration"
      className="fixed z-50 bg-white border rounded-lg shadow-lg p-4 min-w-[300px] max-w-[500px]"
      style={{
        top: Math.min(position.top, window.innerHeight - 400),
        left: Math.min(position.left, window.innerWidth - 350),
        maxHeight: '400px',
        overflowY: 'auto'
      }}
      onKeyDown={(e) => { if (e.key === 'Escape') onCancel(); }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">Configure Smart Phrase</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="hover:bg-gray-100"
        >
          <X size={16} />
        </Button>
      </div>

      {phrase.elements.length > 0 && (
        <>
          {/* Step indicator */}
          <div className="flex items-center space-x-2 mb-4">
            {phrase.elements.map((element, index) => (
              <Badge
                key={element.id}
                variant={
                  selections[element.id] ? "default" :
                  index === currentStep ? "secondary" : "outline"
                }
                className="text-xs cursor-pointer"
                onClick={() => setCurrentStep(index)}
              >
                {element.label}
                {selections[element.id] && (
                  <Check size={10} className="ml-1" />
                )}
              </Badge>
            ))}
          </div>

          {/* Current element picker */}
          <div className="mb-6">
            {renderElementPicker(phrase.elements[currentStep], true)}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                >
                  Previous
                </Button>
              )}
              {currentStep < phrase.elements.length - 1 && (
                <Button
                  size="sm"
                  onClick={() => setCurrentStep(prev => prev + 1)}
                >
                  Next
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentStep(prev => Math.min(prev + 1, phrase.elements.length - 1))}
              >
                Skip
              </Button>
            </div>
            
            <Button
              onClick={handleComplete}
              className="bg-medical-teal hover:bg-medical-teal/90"
            >
              Insert Phrase
            </Button>
          </div>

          {/* Preview */}
          {Object.keys(selections).length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <div className="text-xs text-gray-600 mb-1">Preview:</div>
              <div className="text-sm">{buildResult()}</div>
            </div>
          )}
        </>
      )}

      {phrase.elements.length === 0 && (
        <div className="text-center py-4">
          <p className="text-gray-600">This phrase has no interactive elements</p>
          <Button onClick={() => onSelect(phrase.content)} className="mt-2">
            Insert Text
          </Button>
        </div>
      )}
    </div>
  );
}
