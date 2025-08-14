import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, Calendar, MousePointer, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface InteractiveElement {
  id: string;
  type: "multipicker" | "nested_multipicker" | "date";
  label: string;
  placeholder: string;
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
}

export function FlexibleSmartPhrasePicker({ 
  phrase, 
  position, 
  onSelect, 
  onCancel,
  autoShow = false 
}: FlexibleSmartPhrasePickerProps) {
  const [selections, setSelections] = useState<Record<string, any>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [showPicker, setShowPicker] = useState(autoShow);

  useEffect(() => {
    if (autoShow) {
      setShowPicker(true);
    }
  }, [autoShow]);

  const handleElementSelection = (elementId: string, value: any) => {
    setSelections(prev => ({
      ...prev,
      [elementId]: value
    }));

    // Auto-advance to next element if available
    if (currentStep < phrase.elements.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const buildResult = () => {
    let result = phrase.content;
    
    phrase.elements.forEach(element => {
      const selection = selections[element.id];
      let replacement = "";
      
      if (selection) {
        if (element.type === 'date') {
          replacement = format(selection, "PPP");
        } else if (typeof selection === 'string') {
          replacement = selection;
        } else if (Array.isArray(selection)) {
          replacement = selection.join(", ");
        } else {
          replacement = selection.toString();
        }
      }
      
      result = result.replace(element.placeholder, replacement);
    });
    
    return result;
  };

  const handleComplete = () => {
    const result = buildResult();
    onSelect(result);
  };

  const canComplete = () => {
    return phrase.elements.every(element => selections[element.id] !== undefined);
  };

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

      case 'multipicker':
        return (
          <div className="space-y-3">
            <h3 className="font-medium flex items-center">
              <MousePointer size={16} className="mr-2" />
              {element.label}
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {element.options?.map(option => (
                <Button
                  key={option.id}
                  variant={selections[element.id] === option.value ? "default" : "outline"}
                  onClick={() => handleElementSelection(element.id, option.value)}
                  className="justify-start"
                >
                  {selections[element.id] === option.value && (
                    <Check size={16} className="mr-2" />
                  )}
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        );

      case 'nested_multipicker':
        const selectedParent = selections[`${element.id}_parent`];
        const selectedParentOption = element.options?.find(opt => opt.value === selectedParent);

        return (
          <div className="space-y-3">
            <h3 className="font-medium flex items-center">
              <ChevronRight size={16} className="mr-2" />
              {element.label}
            </h3>
            
            {/* Parent selection */}
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Select category</label>
              <div className="grid grid-cols-1 gap-2">
                {element.options?.map(option => (
                  <Button
                    key={option.id}
                    variant={selectedParent === option.value ? "default" : "outline"}
                    onClick={() => {
                      setSelections(prev => ({
                        ...prev,
                        [`${element.id}_parent`]: option.value,
                        [element.id]: undefined // Reset child selection
                      }));
                    }}
                    className="justify-start"
                  >
                    {selectedParent === option.value && (
                      <Check size={16} className="mr-2" />
                    )}
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Child selection */}
            {selectedParentOption?.children && (
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Select option</label>
                <div className="grid grid-cols-1 gap-2">
                  {selectedParentOption.children.map(child => (
                    <Button
                      key={child.id}
                      variant={selections[element.id] === child.value ? "default" : "outline"}
                      onClick={() => handleElementSelection(element.id, child.value)}
                      className="justify-start ml-4"
                    >
                      {selections[element.id] === child.value && (
                        <Check size={16} className="mr-2" />
                      )}
                      {child.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (!showPicker) return null;

  return (
    <div
      className="fixed z-50 bg-white border rounded-lg shadow-lg p-4 min-w-[300px] max-w-[500px]"
      style={{
        top: Math.min(position.top, window.innerHeight - 400),
        left: Math.min(position.left, window.innerWidth - 350),
        maxHeight: '400px',
        overflowY: 'auto'
      }}
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
              {currentStep < phrase.elements.length - 1 && selections[phrase.elements[currentStep].id] && (
                <Button
                  size="sm"
                  onClick={() => setCurrentStep(prev => prev + 1)}
                >
                  Next
                </Button>
              )}
            </div>
            
            <Button
              onClick={handleComplete}
              disabled={!canComplete()}
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