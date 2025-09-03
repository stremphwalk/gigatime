import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { InlineSmartPhrase } from "./inline-smart-phrase";

interface SmartPhrase {
  id: string;
  trigger: string;
  options: string[];
  selectedOptions: string[];
  startPos: number;
  endPos: number;
}

interface InlineTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSmartPhraseDetected?: (sectionId: string, trigger: string) => void;
  placeholder?: string;
  className?: string;
  sectionId: string;
  activeSmartPhrases?: Record<string, SmartPhrase>;
  onSmartPhraseOptionToggle?: (phraseId: string, option: string) => void;
  onSmartPhraseComplete?: (phraseId: string) => void;
}

export function InlineTextEditor({
  value,
  onChange,
  onSmartPhraseDetected,
  placeholder,
  className,
  sectionId,
  activeSmartPhrases = {},
  onSmartPhraseOptionToggle,
  onSmartPhraseComplete
}: InlineTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Render content with smart phrases inline
  const renderContent = useCallback(() => {
    if (!value && !isEditing) {
      return placeholder || "";
    }

    // For now, just return the text content - we'll handle smart phrases differently
    return value;
  }, [value, placeholder, isEditing]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.textContent || "";
    onChange(newContent);

    // Check for smart phrase triggers
    if (newContent.endsWith("/") && onSmartPhraseDetected) {
      // Find the trigger being typed
      const words = newContent.split(/\s+/);
      const lastWord = words[words.length - 1];
      if (lastWord.startsWith("/")) {
        const trigger = lastWord.substring(1);
        onSmartPhraseDetected(sectionId, trigger);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle special key combinations
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      // Complete any active smart phrases
      Object.keys(activeSmartPhrases).forEach(phraseId => {
        onSmartPhraseComplete?.(phraseId);
      });
    }
  };

  const handleFocus = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  // Update editor content when value changes externally
  useEffect(() => {
    if (editorRef.current && document.activeElement !== editorRef.current) {
      if (editorRef.current.textContent !== value) {
        editorRef.current.textContent = value;
      }
    }
  }, [value]);

  return (
    <div className="relative">
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={cn(
          "min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2",
          "text-sm ring-offset-background",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "whitespace-pre-wrap break-words",
          className
        )}
        style={{ 
          wordBreak: "break-word",
          overflowWrap: "break-word"
        }}
        data-section-id={sectionId}
        suppressContentEditableWarning
      >
        {!isEditing && !value && (
          <span className="text-gray-400 pointer-events-none">{placeholder}</span>
        )}
      </div>
      
      {/* Help text when smart phrases are active */}
      {Object.keys(activeSmartPhrases).length > 0 && (
        <div className="absolute -bottom-6 left-0 right-0 text-xs text-gray-500 dark:text-gray-400">
          💡 Select options above and press Ctrl+Enter to complete
        </div>
      )}
    </div>
  );
}