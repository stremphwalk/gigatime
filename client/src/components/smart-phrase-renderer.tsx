import React, { useState, useEffect, useRef } from "react";
import { InlineSmartPhrase } from "./inline-smart-phrase";
import { cn } from "@/lib/utils";

interface SmartPhraseData {
  id: string;
  trigger: string;
  options: string[];
  selectedOptions: string[];
  startPos: number;
  endPos: number;
}

interface SmartPhraseRendererProps {
  content: string;
  onContentChange: (content: string) => void;
  className?: string;
  placeholder?: string;
  sectionId: string;
}

export function SmartPhraseRenderer({
  content,
  onContentChange,
  className,
  placeholder,
  sectionId
}: SmartPhraseRendererProps) {
  const [smartPhrases, setSmartPhrases] = useState<SmartPhraseData[]>([]);
  const [renderedContent, setRenderedContent] = useState<React.ReactNode[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  // Common smart phrase templates
  const smartPhraseTemplates: Record<string, string[]> = {
    symptom: ["headache", "dizziness", "nausea", "fatigue", "chest pain", "shortness of breath"],
    diagnosis: ["tension headache", "migraine", "sinusitis", "viral syndrome", "hypertension", "diabetes"],
    medication: ["ibuprofen", "acetaminophen", "naproxen", "aspirin", "metformin", "lisinopril"],
    exam: ["unremarkable", "mild tenderness", "swelling", "redness", "normal range of motion"],
    severity: ["mild", "moderate", "severe", "intermittent", "constant"],
    duration: ["hours", "days", "weeks", "months", "acute", "chronic"],
    location: ["bilateral", "unilateral", "diffuse", "localized", "radiating"],
    quality: ["sharp", "dull", "throbbing", "burning", "aching", "stabbing"]
  };

  // Parse content for smart phrases
  useEffect(() => {
    const parseSmartPhrases = () => {
      const regex = /\/(\w+)/g;
      const matches = [];
      let match;

      while ((match = regex.exec(content)) !== null) {
        const trigger = match[1].toLowerCase();
        if (smartPhraseTemplates[trigger]) {
          matches.push({
            id: `${trigger}-${match.index}`,
            trigger,
            options: smartPhraseTemplates[trigger],
            selectedOptions: [],
            startPos: match.index,
            endPos: match.index + match[0].length
          });
        }
      }

      setSmartPhrases(matches);
    };

    parseSmartPhrases();
  }, [content]);

  // Render content with inline smart phrases
  useEffect(() => {
    if (smartPhrases.length === 0) {
      setRenderedContent([content]);
      return;
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    smartPhrases.forEach((phrase, index) => {
      // Add text before smart phrase
      if (phrase.startPos > lastIndex) {
        parts.push(content.slice(lastIndex, phrase.startPos));
      }

      // Add smart phrase component
      parts.push(
        <InlineSmartPhrase
          key={phrase.id}
          trigger={phrase.trigger}
          options={phrase.options}
          selectedOptions={phrase.selectedOptions}
          onOptionToggle={(option) => handleOptionToggle(phrase.id, option)}
          onComplete={() => handlePhraseComplete(phrase.id)}
          position="overlay"
        />
      );

      lastIndex = phrase.endPos;
    });

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }

    setRenderedContent(parts);
  }, [smartPhrases, content]);

  const handleOptionToggle = (phraseId: string, option: string) => {
    setSmartPhrases(prev => prev.map(phrase => {
      if (phrase.id === phraseId) {
        const isSelected = phrase.selectedOptions.includes(option);
        return {
          ...phrase,
          selectedOptions: isSelected
            ? phrase.selectedOptions.filter(o => o !== option)
            : [...phrase.selectedOptions, option]
        };
      }
      return phrase;
    }));
  };

  const handlePhraseComplete = (phraseId: string) => {
    const phrase = smartPhrases.find(p => p.id === phraseId);
    if (!phrase || phrase.selectedOptions.length === 0) return;

    // Replace the smart phrase with selected options
    const beforePhrase = content.slice(0, phrase.startPos);
    const afterPhrase = content.slice(phrase.endPos);
    const selectedText = phrase.selectedOptions.join(", ");
    
    const newContent = beforePhrase + selectedText + afterPhrase;
    onContentChange(newContent);

    // Remove the completed phrase from tracking
    setSmartPhrases(prev => prev.filter(p => p.id !== phraseId));
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.textContent || "";
    
    // Check if user is typing a smart phrase trigger
    if (newContent.endsWith("/")) {
      // Position for showing suggestions
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        // Could show autocomplete suggestions here
      }
    }
    
    onContentChange(newContent);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle special keys for smart phrases
    if (e.key === "Tab" && smartPhrases.length > 0) {
      e.preventDefault();
      // Navigate through smart phrase options
    }
  };

  return (
    <div className="relative">
      <div
        ref={contentRef}
        contentEditable
        className={cn(
          "min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2",
          "text-sm ring-offset-background",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "whitespace-pre-wrap",
          className
        )}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        data-section-id={sectionId}
        suppressContentEditableWarning
      >
        {renderedContent.length > 0 ? (
          renderedContent
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </div>
      
      {/* Inline help text */}
      {smartPhrases.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white dark:from-gray-900 to-transparent p-2 pointer-events-none">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Click options to select • Ctrl+Enter to complete
          </div>
        </div>
      )}
    </div>
  );
}