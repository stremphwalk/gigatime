import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface InlineSmartPhraseProps {
  trigger: string;
  options: string[];
  selectedOptions: string[];
  onOptionToggle: (option: string) => void;
  onComplete: () => void;
  position?: 'inline' | 'overlay';
}

export function InlineSmartPhrase({
  trigger,
  options,
  selectedOptions,
  onOptionToggle,
  onComplete,
  position = 'inline'
}: InlineSmartPhraseProps) {
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        onComplete();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onComplete]);

  if (position === 'overlay') {
    return (
      <div className="inline-flex items-center bg-blue-50 dark:bg-blue-950/30 rounded-lg px-2 py-1 border-l-4 border-blue-500 ml-2">
        <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm mr-2">
          /{trigger}
        </span>
        <div className="inline-flex gap-1.5 flex-wrap">
          {options.map((option) => {
            const isSelected = selectedOptions.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => onOptionToggle(option)}
                onMouseEnter={() => setHoveredOption(option)}
                onMouseLeave={() => setHoveredOption(null)}
                className={cn(
                  "px-3 py-1 text-xs rounded-full transition-all duration-150 font-medium",
                  "border cursor-pointer transform",
                  isSelected
                    ? "bg-blue-500 text-white border-blue-600 shadow-sm scale-105"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600",
                  "hover:scale-105 hover:shadow-md",
                  hoveredOption === option && !isSelected && "bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700"
                )}
                aria-pressed={isSelected}
                data-testid={`smart-phrase-option-${option}`}
              >
                {isSelected && (
                  <Check className="inline-block w-3 h-3 mr-1" />
                )}
                {option}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Inline style (default)
  return (
    <span className="inline-smart-phrase" data-trigger={trigger}>
      <span className="text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/30 px-1.5 py-0.5 rounded text-sm">
        /{trigger}
      </span>
      <span className="inline-flex gap-1 ml-2 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950/20 dark:to-transparent px-2 py-1 rounded-lg">
        {options.map((option) => {
          const isSelected = selectedOptions.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onOptionToggle(option)}
              className={cn(
                "px-2.5 py-0.5 text-xs rounded-full transition-all duration-150",
                "border cursor-pointer",
                isSelected
                  ? "bg-blue-500 text-white border-blue-600"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700",
                "hover:scale-105"
              )}
              aria-pressed={isSelected}
              data-testid={`inline-option-${option}`}
            >
              {option}
            </button>
          );
        })}
      </span>
    </span>
  );
}