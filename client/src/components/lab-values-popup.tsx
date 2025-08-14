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

export function LabValuesPopup({ isOpen, onClose, onConfirm }: LabValuesPopupProps) {
  const [openPanels, setOpenPanels] = useState<Set<string>>(new Set());
  const [labInputs, setLabInputs] = useState<LabInputState>({});
  const [searchQuery, setSearchQuery] = useState("");
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

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
        values: prev[testId]?.values.filter((_, i) => i !== index) || []
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

    LAB_PANELS.forEach(panel => {
      const panelLabs: LabValue[] = [];

      panel.tests.forEach(test => {
        const testInputs = labInputs[test.abbreviation];
        if (testInputs && testInputs.values.length > 0) {
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

  const handleClose = () => {
    setLabInputs({});
    setOpenPanels(new Set());
    setSearchQuery("");
    onClose();
  };

  const hasAnyValues = Object.values(labInputs).some(input => input.values && input.values.length > 0);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Beaker size={20} className="text-blue-600" />
            Lab Values Entry
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 max-h-[60vh] overflow-hidden">
          {/* Search */}
          <div className="flex-shrink-0">
            <Input
              placeholder="Search lab panels (CBC, LFTs, BMP, etc.)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
              data-testid="lab-search-input"
            />
          </div>

          {/* Lab Panels */}
          <div className="flex-1 overflow-y-auto space-y-1">
            {filteredPanels.map((panel) => (
              <Collapsible
                key={panel.abbreviation}
                open={openPanels.has(panel.abbreviation)}
                onOpenChange={() => togglePanel(panel.abbreviation)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start p-3 h-auto"
                    data-testid={`panel-${panel.abbreviation}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        {openPanels.has(panel.abbreviation) ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                        <div className="text-left">
                          <div className="font-medium">{panel.name}</div>
                          <div className="text-sm text-gray-500">
                            {panel.abbreviation} • {panel.category} • {panel.tests.length} tests
                          </div>
                        </div>
                      </div>
                      {/* Show count of entered values for this panel */}
                      {panel.tests.some(test => labInputs[test.abbreviation]?.values?.length > 0) && (
                        <Badge variant="secondary" className="ml-2">
                          {panel.tests.filter(test => labInputs[test.abbreviation]?.values?.length > 0).length} entered
                        </Badge>
                      )}
                    </div>
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="pt-2">
                  <div className="ml-6 space-y-3 pb-2">
                    {panel.tests.map((test) => {
                      const testInputs = labInputs[test.abbreviation];
                      const hasValues = testInputs && testInputs.values.length > 0;

                      return (
                        <div key={test.abbreviation} className="border rounded-lg p-3">
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium text-sm">{test.abbreviation}</span>
                                <span className="text-xs text-gray-500">({test.name})</span>
                                {test.normalRange && (
                                  <Badge variant="outline" className="text-xs">
                                    Normal: {test.normalRange} {test.unit}
                                  </Badge>
                                )}
                              </div>

                              {/* Input for new value */}
                              <div className="flex items-center gap-2 mb-2">
                                <Input
                                  ref={(el) => {
                                    inputRefs.current[test.abbreviation] = el;
                                  }}
                                  type="number"
                                  step="any"
                                  placeholder={`Enter ${test.abbreviation} value`}
                                  value={testInputs?.currentInput || ""}
                                  onChange={(e) => handleLabValueChange(test.abbreviation, e.target.value)}
                                  onKeyDown={(e) => handleKeyDown(e, test.abbreviation)}
                                  className="flex-1 text-sm"
                                  data-testid={`lab-input-${test.abbreviation}`}
                                />
                                <span className="text-xs text-gray-500 min-w-fit">{test.unit}</span>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => addLabValue(test.abbreviation)}
                                  disabled={!testInputs?.currentInput?.trim() || isNaN(Number(testInputs.currentInput))}
                                  data-testid={`add-value-${test.abbreviation}`}
                                >
                                  <Plus size={14} />
                                </Button>
                              </div>

                              {/* Display entered values */}
                              {hasValues && (
                                <div className="space-y-1">
                                  <div className="text-xs text-gray-600 font-medium">
                                    Entered Values (most recent first):
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {testInputs.values.map((value, index) => (
                                      <Badge
                                        key={index}
                                        variant={index === 0 ? "default" : "secondary"}
                                        className="flex items-center gap-1"
                                      >
                                        {value} {test.unit}
                                        {index === 0 && <CheckCircle size={12} />}
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="ghost"
                                          className="h-4 w-4 p-0 hover:bg-red-100"
                                          onClick={() => removeLabValue(test.abbreviation, index)}
                                          data-testid={`remove-value-${test.abbreviation}-${index}`}
                                        >
                                          <Trash2 size={10} />
                                        </Button>
                                      </Badge>
                                    ))}
                                  </div>
                                  
                                  {/* Preview how it will appear */}
                                  <div className="text-xs text-green-700 bg-green-50 p-2 rounded border-l-2 border-green-200">
                                    <strong>Preview:</strong> {test.abbreviation} {testInputs.values[0]}
                                    {testInputs.values.length > 1 && ` (${testInputs.values.slice(1).join(", ")})`}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
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