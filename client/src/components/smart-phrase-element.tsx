import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X, Edit } from "lucide-react";

interface SmartPhraseElementProps {
  phraseId: string;
  trigger: string;
  type: 'text' | 'date' | 'multipicker' | 'nested_multipicker';
  options: any[];
  selectedOptions: string[];
  content: string;
  onOptionToggle?: (phraseId: string, option: string) => void;
  onComplete?: (phraseId: string) => void;
  onEdit?: (phraseId: string) => void;
  onDelete?: (phraseId: string) => void;
}

export function SmartPhraseElement({
  phraseId,
  trigger,
  type,
  options,
  selectedOptions,
  content,
  onOptionToggle,
  onComplete,
  onEdit,
  onDelete
}: SmartPhraseElementProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <span
      className={cn(
        "smart-phrase inline-flex items-center bg-blue-100 border border-blue-300 rounded px-1 mx-0.5",
        "cursor-pointer relative group"
      )}
      contentEditable={false}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onEdit?.(phraseId)}
    >
      {content}
      
      {isHovered && (
        <div className="absolute -top-6 -right-2 flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 bg-blue-200 hover:bg-blue-300"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(phraseId);
            }}
          >
            <Edit size={10} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 bg-red-200 hover:bg-red-300"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(phraseId);
            }}
          >
            <X size={10} />
          </Button>
        </div>
      )}
    </span>
  );
}