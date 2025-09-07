import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineSmartPhraseProps {
  trigger: string;
  options: string[];
  selectedOptions: string[];
  onOptionToggle: (option: string) => void;
  onComplete: () => void;
}

export function InlineSmartPhrase({
  trigger,
  options,
  selectedOptions,
  onOptionToggle,
  onComplete
}: InlineSmartPhraseProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 min-w-[200px] max-w-[300px]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <Badge variant="secondary" className="text-xs">
            /{trigger}
          </Badge>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onComplete}
          className="h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      
      {options.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
            Select options:
          </p>
          {options.map((option, index) => {
            const isSelected = selectedOptions.includes(option);
            return (
              <button
                key={index}
                onClick={() => onOptionToggle(option)}
                className={cn(
                  "flex items-center gap-2 w-full text-left px-2 py-1 rounded text-xs",
                  "hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                  isSelected && "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                )}
              >
                <div className={cn(
                  "w-3 h-3 rounded border flex items-center justify-center",
                  isSelected ? "bg-blue-500 border-blue-500" : "border-gray-300 dark:border-gray-600"
                )}>
                  {isSelected && <Check className="w-2 h-2 text-white" />}
                </div>
                <span className="flex-1 truncate">{option}</span>
              </button>
            );
          })}
        </div>
      )}
      
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {selectedOptions.length} selected
        </p>
        <Button
          size="sm"
          onClick={onComplete}
          disabled={selectedOptions.length === 0}
          className="text-xs px-2 py-1 h-6"
        >
          Insert
        </Button>
      </div>
    </div>
  );
}
