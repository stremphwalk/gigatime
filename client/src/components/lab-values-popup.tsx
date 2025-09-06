import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Beaker, Plus, Trash2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  LAB_PANELS, 
  type LabPanel, 
  type LabTest, 
  type LabValue, 
  type LabEntry, 
  formatLabsForInsertion 
} from "@/lib/lab-panels";

interface LabValuesPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (formattedLabs: string) => void;
}

interface LabInputState {
  [key: string]: {
    values: string[];
    currentInput: string;
  };
}

interface CustomLabEntry {
  name: string;
  abbreviation: string;
  unit: string;
  values: string[];
  currentInput: string;
}

export function LabValuesPopup({ isOpen, onClose, onConfirm }: LabValuesPopupProps) {
  const [openPanels, setOpenPanels] = useState<Set<string>>(new Set());
  const [labInputs, setLabInputs] = useState<LabInputState>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [customLabs, setCustomLabs] = useState<CustomLabEntry[]>([]);
  const [newCustomLab, setNewCustomLab] = useState({
    name: "",
    abbreviation: "",
    unit: ""
  });
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const customInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const filteredPanels = searchQuery
    ? LAB_PANELS.filter(panel =>
        panel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        panel.abbreviation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        panel.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : LAB_PANELS;

  const togglePanel = (panelId: string) => {
    const newOpenPanels = new Set(openPanels);
    if (newOpenPanels.has(panelId)) {
      newOpenPanels.delete(panelId);
    } else {
      newOpenPanels.add(panelId);
    }
    setOpenPanels(newOpenPanels);
  };

  const handleLabValueChange = (testId: string, value: string) => {
    setLabInputs(prev => ({
      ...prev,
      [testId]: {
        ...prev[testId],
        currentInput: value
      }
    }));
  };

  const addLabValue = (testId: string) => {
    const currentInput = labInputs[testId]?.currentInput?.trim();
    if (!currentInput || isNaN(Number(currentInput))) return;

    setLabInputs(prev => ({
      ...prev,
      [testId]: {
        values: [...(prev[testId]?.values || []), currentInput],
        currentInput: ""
      }
    }));

    // Focus back to input
    setTimeout(() => {
      const inputRef = inputRefs.current[testId];
      if (inputRef) {
        inputRef.focus();
      }
    }, 0);
  };

  const removeLabValue = (testId: string, index: number) => {
    setLabInputs(prev => ({
      ...prev,
      [testId]: {
        ...prev[testId],
        values: (prev[testId]?.values || []).filter((_, i) => i !== index)
      }
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent, testId: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addLabValue(testId);
    }
  };

  const getLabEntries = (): LabEntry[] => {
    const entries: LabEntry[] = [];

    // Add custom labs first
    if (customLabs.length > 0) {
      const customLabValues: LabValue[] = [];
      
      customLabs.forEach(lab => {
        if (lab.values && lab.values.length > 0) {
          customLabValues.push({
            testId: lab.abbreviation,
            abbreviation: lab.abbreviation,
            values: lab.values.map(v => parseFloat(v)),
            unit: lab.unit
          });
        }
      });

      if (customLabValues.length > 0) {
        entries.push({
          panelName: "Custom Labs",
          panelAbbreviation: "Custom",
          labs: customLabValues
        });
      }
    }

    // Add standard panel labs
    LAB_PANELS.forEach(panel => {
      const panelLabs: LabValue[] = [];

      panel.tests.forEach(test => {
        const testInputs = labInputs[test.abbreviation];
        if (testInputs && testInputs.values && testInputs.values.length > 0) {
          panelLabs.push({
            testId: test.abbreviation,
            abbreviation: test.abbreviation,
            values: testInputs.values.map(v => parseFloat(v)),
            unit: test.unit
          });
        }
      });

      if (panelLabs.length > 0) {
        entries.push({
          panelName: panel.name,
          panelAbbreviation: panel.abbreviation,
          labs: panelLabs
        });
      }
    });

    return entries;
  };

  const handleConfirm = () => {
    const labEntries = getLabEntries();
    const formattedLabs = formatLabsForInsertion(labEntries);
    onConfirm(formattedLabs);
    handleClose();
  };

  const addCustomLab = () => {
    if (!newCustomLab.name.trim() || !newCustomLab.abbreviation.trim()) return;
    
    const customLab: CustomLabEntry = {
      ...newCustomLab,
      values: [],
      currentInput: ""
    };
    
    setCustomLabs(prev => [...prev, customLab]);
    setNewCustomLab({ name: "", abbreviation: "", unit: "" });
  };

  const removeCustomLab = (index: number) => {
    setCustomLabs(prev => prev.filter((_, i) => i !== index));
  };

  const handleCustomLabValueChange = (index: number, value: string) => {
    setCustomLabs(prev => prev.map((lab, i) => 
      i === index ? { ...lab, currentInput: value } : lab
    ));
  };

  const addCustomLabValue = (index: number) => {
    const lab = customLabs[index];
    const currentInput = lab.currentInput?.trim();
    if (!currentInput || isNaN(Number(currentInput))) return;

    setCustomLabs(prev => prev.map((lab, i) => 
      i === index ? { 
        ...lab, 
        values: [...lab.values, currentInput],
        currentInput: ""
      } : lab
    ));

    // Focus back to input
    setTimeout(() => {
      const inputRef = customInputRefs.current[`custom-${index}`];
      if (inputRef) {
        inputRef.focus();
      }
    }, 0);
  };

  const removeCustomLabValue = (labIndex: number, valueIndex: number) => {
    setCustomLabs(prev => prev.map((lab, i) => 
      i === labIndex ? { 
        ...lab, 
        values: lab.values.filter((_, vi) => vi !== valueIndex)
      } : lab
    ));
  };

  const handleCustomLabKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomLabValue(index);
    }
  };

  const handleClose = () => {
    setLabInputs({});
    setOpenPanels(new Set());
    setSearchQuery("");
    setCustomLabs([]);
    setNewCustomLab({ name: "", abbreviation: "", unit: "" });
    onClose();
  };

  const hasAnyValues = Object.values(labInputs).some(input => input && input.values && input.values.length > 0) || 
                      customLabs.some(lab => lab.values && lab.values.length > 0);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Beaker size={20} className="text-[color:var(--brand-700)]" />
            Lab Values Entry
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 max-h-[70vh] overflow-hidden">
          {/* Custom Lab Entry Section */}
          <div className="flex-shrink-0 border-b pb-3">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium text-sm">Custom Lab Entry</h4>
              <Badge variant="outline" className="text-xs">Any lab with trending</Badge>
            </div>
            
            {/* Add new custom lab */}
            <div className="flex items-center gap-2 mb-3">
              <Input
                placeholder="Lab name (e.g., Vitamin D)"
                value={newCustomLab.name}
                onChange={(e) => setNewCustomLab(prev => ({ ...prev, name: e.target.value }))}
                className="flex-1 text-sm h-8"
                data-testid="custom-lab-name-input"
              />
              <Input
                placeholder="Abbrev"
                value={newCustomLab.abbreviation}
                onChange={(e) => setNewCustomLab(prev => ({ ...prev, abbreviation: e.target.value }))}
                className="w-20 text-sm h-8"
                data-testid="custom-lab-abbrev-input"
              />
              <Input
                placeholder="Unit"
                value={newCustomLab.unit}
                onChange={(e) => setNewCustomLab(prev => ({ ...prev, unit: e.target.value }))}
                className="w-20 text-sm h-8"
                data-testid="custom-lab-unit-input"
              />
              <Button
                type="button"
                size="sm"
                onClick={addCustomLab}
                disabled={!newCustomLab.name.trim() || !newCustomLab.abbreviation.trim()}
                className="h-8 px-3"
                data-testid="add-custom-lab"
              >
                <Plus size={14} />
              </Button>
            </div>

            {/* Custom labs list */}
            {customLabs.length > 0 && (
              <div className="space-y-2">
                {customLabs.map((lab, index) => (
                  <div key={index} className="border rounded p-2 bg-[color:var(--brand-50)]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-[color:var(--brand-700)]">{lab.abbreviation}</span>
                        <span className="text-xs text-gray-600">({lab.name})</span>
                        {lab.unit && <Badge variant="outline" className="text-xs px-1 py-0">{lab.unit}</Badge>}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeCustomLab(index)}
                        className="h-6 w-6 p-0 hover:bg-red-100"
                        data-testid={`remove-custom-lab-${index}`}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                    
                    {/* Value entry */}
                    <div className="flex items-center gap-1 mb-1">
                      <Input
                        ref={(el) => {
                          customInputRefs.current[`custom-${index}`] = el;
                        }}
                        type="number"
                        step="any"
                        placeholder="Value"
                        value={lab.currentInput}
                        onChange={(e) => handleCustomLabValueChange(index, e.target.value)}
                        onKeyDown={(e) => handleCustomLabKeyDown(e, index)}
                        className="flex-1 text-xs h-8"
                        data-testid={`custom-lab-input-${index}`}
                      />
                      <span className="text-xs text-gray-500 min-w-fit">{lab.unit}</span>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => addCustomLabValue(index)}
                        disabled={!lab.currentInput?.trim() || isNaN(Number(lab.currentInput))}
                        className="h-8 w-8 p-0"
                        data-testid={`add-custom-value-${index}`}
                      >
                        <Plus size={12} />
                      </Button>
                    </div>

                    {/* Values display */}
                    {lab.values && lab.values.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex flex-wrap gap-1">
                          {lab.values.map((value, valueIndex) => (
                            <Badge
                              key={valueIndex}
                              variant={valueIndex === 0 ? "default" : "secondary"}
                              className="text-xs flex items-center gap-1 h-6"
                            >
                              {value} {lab.unit}
                              {valueIndex === 0 && <CheckCircle size={10} />}
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-3 w-3 p-0 hover:bg-red-100"
                                onClick={() => removeCustomLabValue(index, valueIndex)}
                                data-testid={`remove-custom-value-${index}-${valueIndex}`}
                              >
                                <Trash2 size={8} />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                        
                        {/* Preview */}
                        <div className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded text-center">
                          {lab.abbreviation} {lab.values[0]}
                          {lab.values.length > 1 && ` (${lab.values.slice(1).join(", ")})`}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search */}
          <div className="flex-shrink-0">
            <Input
              placeholder="Search standard lab panels (CBC, LFTs, BMP, etc.)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
              data-testid="lab-search-input"
            />
          </div>

          {/* Lab Panels - Improved Compact Layout */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredPanels.map((panel) => (
              <Collapsible
                key={panel.abbreviation}
                open={openPanels.has(panel.abbreviation)}
                onOpenChange={() => togglePanel(panel.abbreviation)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start p-2 h-auto hover:bg-gray-50"
                    data-testid={`panel-${panel.abbreviation}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        {openPanels.has(panel.abbreviation) ? (
                          <ChevronDown size={14} />
                        ) : (
                          <ChevronRight size={14} />
                        )}
                        <div className="text-left">
                          <div className="font-medium text-sm">{panel.abbreviation}</div>
                          <div className="text-xs text-gray-500">
                            {panel.name} • {panel.tests.length} tests
                          </div>
                        </div>
                      </div>
                      {/* Show count of entered values for this panel */}
                      {panel.tests.some(test => labInputs[test.abbreviation]?.values?.length > 0) && (
                        <Badge variant="secondary" className="text-xs">
                          {panel.tests.filter(test => labInputs[test.abbreviation]?.values?.length > 0).length} entered
                        </Badge>
                      )}
                    </div>
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="pt-1">
                  <div className="ml-4 space-y-2 pb-1">
                    {/* Grid Layout for Tests */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {panel.tests.map((test) => {
                        const testInputs = labInputs[test.abbreviation];
                        const hasValues = testInputs && testInputs.values && testInputs.values.length > 0;

                        return (
                          <div key={test.abbreviation} className="border rounded p-2 bg-gray-50">
                            {/* Compact Test Header */}
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm text-[color:var(--brand-700)]">{test.abbreviation}</span>
                              {test.normalRange && (
                                <Badge variant="outline" className="text-xs px-1 py-0">
                                  {test.normalRange} {test.unit}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-gray-600 mb-2 truncate" title={test.name}>
                              {test.name}
                            </div>

                            {/* Compact Input Row */}
                            <div className="flex items-center gap-1 mb-1">
                              <Input
                                ref={(el) => {
                                  inputRefs.current[test.abbreviation] = el;
                                }}
                                type="number"
                                step="any"
                                placeholder="Value"
                                value={testInputs?.currentInput || ""}
                                onChange={(e) => handleLabValueChange(test.abbreviation, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, test.abbreviation)}
                                className="flex-1 text-xs h-8"
                                data-testid={`lab-input-${test.abbreviation}`}
                              />
                              <span className="text-xs text-gray-500 min-w-fit">{test.unit}</span>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => addLabValue(test.abbreviation)}
                                disabled={!testInputs?.currentInput?.trim() || isNaN(Number(testInputs.currentInput))}
                                className="h-8 w-8 p-0"
                                data-testid={`add-value-${test.abbreviation}`}
                              >
                                <Plus size={12} />
                              </Button>
                            </div>

                            {/* Compact Values Display */}
                            {hasValues && (
                              <div className="space-y-1">
                                <div className="flex flex-wrap gap-1">
                                  {(testInputs.values || []).map((value, index) => (
                                    <Badge
                                      key={index}
                                      variant={index === 0 ? "default" : "secondary"}
                                      className="text-xs flex items-center gap-1 h-6"
                                    >
                                      {value}
                                      {index === 0 && <CheckCircle size={10} />}
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="h-3 w-3 p-0 hover:bg-red-100"
                                        onClick={() => removeLabValue(test.abbreviation, index)}
                                        data-testid={`remove-value-${test.abbreviation}-${index}`}
                                      >
                                        <Trash2 size={8} />
                                      </Button>
                                    </Badge>
                                  ))}
                                </div>
                                
                                {/* Compact Preview */}
                                <div className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded text-center">
                                  {test.abbreviation} {(testInputs.values || [])[0]}
                                  {(testInputs.values || []).length > 1 && ` (${(testInputs.values || []).slice(1).join(", ")})`}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-gray-500">
              {hasAnyValues ? "Values entered. Click Confirm to insert." : "Enter lab values and press Enter or click + to add"}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} data-testid="cancel-labs">
                Cancel
              </Button>
              <Button 
                onClick={handleConfirm} 
                disabled={!hasAnyValues}
                data-testid="confirm-labs"
              >
                Confirm & Insert Labs
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
