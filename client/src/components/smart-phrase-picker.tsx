import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, Calendar as CalendarIcon, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface SmartPhrasePickerProps {
  phrase: {
    id: string;
    trigger: string;
    content: string;
    type: 'text' | 'multipicker' | 'nested_multipicker' | 'date';
    options?: any;
  };
  position: { top: number; left: number };
  onSelect: (result: string) => void;
  onCancel: () => void;
  autoShow?: boolean; // When true, shows picker automatically for templates
}

interface MultipickerOption {
  label: string;
  value: string;
  children?: MultipickerOption[];
}

export function SmartPhrasePicker({ 
  phrase, 
  position, 
  onSelect, 
  onCancel,
  autoShow = false 
}: SmartPhrasePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [currentOptions, setCurrentOptions] = useState<MultipickerOption[]>([]);
  const [isVisible, setIsVisible] = useState(autoShow);
  const [isHovered, setIsHovered] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phrase.type === 'multipicker' || phrase.type === 'nested_multipicker') {
      setCurrentOptions(phrase.options?.choices || []);
    }
  }, [phrase]);

  useEffect(() => {
    if (autoShow) {
      setIsVisible(true);
    }
  }, [autoShow]);

  const handleMultipickerSelect = (option: MultipickerOption, isNested = false) => {
    const newPath = [...selectedPath, option.value];
    setSelectedPath(newPath);

    if (option.children && option.children.length > 0 && phrase.type === 'nested_multipicker') {
      // Show nested options
      setCurrentOptions(option.children);
    } else {
      // Final selection - build result text
      let resultText = phrase.content;
      
      if (phrase.type === 'multipicker') {
        resultText = resultText.replace(/\{option\}/g, option.label);
      } else if (phrase.type === 'nested_multipicker') {
        // Replace placeholders with selected path
        newPath.forEach((value, index) => {
          const selectedOption = findOptionByPath(phrase.options?.choices || [], newPath.slice(0, index + 1));
          if (selectedOption) {
            resultText = resultText.replace(new RegExp(`\\{option${index + 1}\\}`, 'g'), selectedOption.label);
            resultText = resultText.replace(/\{option\}/g, selectedOption.label); // fallback
          }
        });
      }
      
      onSelect(resultText);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      let resultText = phrase.content;
      const formattedDate = format(date, "MM/dd/yyyy");
      resultText = resultText.replace(/\{date\}/g, formattedDate);
      onSelect(resultText);
    }
  };

  const handleBack = () => {
    if (selectedPath.length > 0) {
      const newPath = selectedPath.slice(0, -1);
      setSelectedPath(newPath);
      
      if (newPath.length === 0) {
        setCurrentOptions(phrase.options?.choices || []);
      } else {
        const parentOption = findOptionByPath(phrase.options?.choices || [], newPath);
        if (parentOption && parentOption.children) {
          setCurrentOptions(parentOption.children);
        }
      }
    }
  };

  const findOptionByPath = (options: MultipickerOption[], path: string[]): MultipickerOption | null => {
    if (path.length === 0) return null;
    
    let current = options.find(opt => opt.value === path[0]);
    if (!current) return null;
    
    for (let i = 1; i < path.length; i++) {
      if (!current.children) return null;
      current = current.children.find(opt => opt.value === path[i]);
      if (!current) return null;
    }
    
    return current;
  };

  // For text phrases, just return the content immediately
  if (phrase.type === 'text') {
    onSelect(phrase.content);
    return null;
  }

  if (!isVisible && !autoShow) {
    return (
      <div 
        className="inline-flex items-center px-2 py-1 bg-professional-blue/10 border border-professional-blue/20 rounded-md cursor-pointer hover:bg-professional-blue/20 transition-colors"
        onClick={() => setIsVisible(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        data-testid={`phrase-trigger-${phrase.trigger}`}
      >
        <Badge variant="outline" className="text-xs mr-1">/{phrase.trigger}</Badge>
        <span className="text-sm text-gray-700">{phrase.content.substring(0, 30)}...</span>
        {isHovered && (
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 ml-1 text-gray-500 hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
          >
            <X size={12} />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div 
      ref={pickerRef}
      className="fixed bg-white border-2 border-medical-teal/30 rounded-xl shadow-2xl z-50 min-w-[320px] max-w-[450px]"
      style={{ 
        top: position.top + 'px', 
        left: position.left + 'px',
      }}
      data-testid={`phrase-picker-${phrase.trigger}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-medical-teal/10 to-professional-blue/10">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-medical-teal text-white border-medical-teal">
            /{phrase.trigger}
          </Badge>
          <span className="font-medium text-gray-800">Smart Phrase Selection</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
          data-testid="button-close-picker"
        >
          <X size={14} />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4">
        {phrase.type === 'date' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-3">Select a date:</p>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="rounded-md border"
              data-testid="date-picker"
            />
          </div>
        )}

        {(phrase.type === 'multipicker' || phrase.type === 'nested_multipicker') && (
          <div className="space-y-3">
            {selectedPath.length > 0 && (
              <div className="flex items-center space-x-2 mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBack}
                  className="h-7"
                  data-testid="button-back"
                >
                  <ChevronLeft size={14} className="mr-1" />
                  Back
                </Button>
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  {selectedPath.map((value, index) => {
                    const option = findOptionByPath(phrase.options?.choices || [], selectedPath.slice(0, index + 1));
                    return (
                      <div key={index} className="flex items-center">
                        <span>{option?.label}</span>
                        {index < selectedPath.length - 1 && <ChevronRight size={12} className="mx-1" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="text-sm text-gray-600 mb-3">
              {selectedPath.length === 0 ? 'Choose an option:' : 'Choose next option:'}
            </p>
            
            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
              {currentOptions.map((option) => (
                <Button
                  key={option.value}
                  variant="outline"
                  className="justify-start text-left h-auto p-3 hover:bg-medical-teal/10 hover:border-medical-teal/50"
                  onClick={() => handleMultipickerSelect(option)}
                  data-testid={`option-${option.value}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{option.label}</span>
                    {option.children && option.children.length > 0 && (
                      <ChevronRight size={16} className="text-gray-400" />
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
        <p className="text-xs text-gray-500">
          {phrase.type === 'date' && "Click on a date to select it"}
          {phrase.type === 'multipicker' && "Click on an option to use it in your note"}
          {phrase.type === 'nested_multipicker' && "Navigate through options to make your selection"}
        </p>
      </div>
    </div>
  );
}