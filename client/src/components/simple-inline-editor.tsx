import React, { useState, useRef, useEffect } from "react";
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

interface SimpleInlineEditorProps {
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

export function SimpleInlineEditor({
  value,
  onChange,
  onSmartPhraseDetected,
  placeholder,
  className,
  sectionId,
  activeSmartPhrases = {},
  onSmartPhraseOptionToggle,
  onSmartPhraseComplete
}: SimpleInlineEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [showSmartPhrases, setShowSmartPhrases] = useState(false);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    onChange(newContent);

    // Check for smart phrase triggers
    if (newContent.endsWith("/") && onSmartPhraseDetected) {
      onSmartPhraseDetected(sectionId, "");
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

  // Show smart phrases when they're active
  useEffect(() => {
    setShowSmartPhrases(Object.keys(activeSmartPhrases).length > 0);
  }, [activeSmartPhrases]);

  // Find smart phrase positions in text for overlay positioning
  const getSmartPhrasePosition = (phrase: SmartPhrase) => {
    if (!editorRef.current) return { x: 0, y: 0 };

    const textarea = editorRef.current;
    const rect = textarea.getBoundingClientRect();
    const style = window.getComputedStyle(textarea);

    const paddingTop = parseInt(style.paddingTop || '0', 10) || 0;
    const paddingLeft = parseInt(style.paddingLeft || '0', 10) || 0;
    const fontSizePx = parseInt(style.fontSize || '14', 10) || 14;
    const lineHeightPx = parseInt(style.lineHeight || `${Math.round(fontSizePx * 1.5)}`, 10) || Math.round(fontSizePx * 1.5);

    // Measure average character width using canvas to better align with caret
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let charWidth = Math.max(7, Math.round(fontSizePx * 0.6));
    if (ctx) {
      const fontWeight = style.fontWeight || '400';
      const fontFamily = style.fontFamily || 'monospace';
      ctx.font = `${fontWeight} ${fontSizePx}px ${fontFamily}`;
      const metrics = ctx.measureText('MMMMMMMMMM');
      if (metrics && metrics.width) {
        charWidth = metrics.width / 10;
      }
    }

    // Determine line/column of the phrase start
    const textBeforePhrase = value.slice(0, phrase.startPos);
    const lines = textBeforePhrase.split('\n');
    const lineNumber = lines.length - 1;
    const colNumber = lines[lineNumber].length;

    // Account for textarea scroll positions and internal padding
    const x = rect.left + paddingLeft - textarea.scrollLeft + colNumber * charWidth;
    const y = rect.top + paddingTop - textarea.scrollTop + (lineNumber + 1) * lineHeightPx;

    return { x, y };
  };

  return (
    <div className="relative">
      <textarea
        ref={editorRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          "min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2",
          "text-sm ring-offset-background",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "resize-none font-mono leading-6",
          className
        )}
        data-section-id={sectionId}
      />
      
      {/* Render smart phrase overlays */}
      {showSmartPhrases && Object.entries(activeSmartPhrases).map(([phraseId, phrase]) => {
        const position = getSmartPhrasePosition(phrase);
        return (
          <div
            key={phraseId}
            className="fixed z-50 pointer-events-auto"
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`,
            }}
          >
            <InlineSmartPhrase
              trigger={phrase.trigger}
              options={phrase.options}
              selectedOptions={phrase.selectedOptions}
              onOptionToggle={(option: string) => onSmartPhraseOptionToggle?.(phraseId, option)}
              onComplete={() => onSmartPhraseComplete?.(phraseId)}
            />
          </div>
        );
      })}
      
      {/* Help text when smart phrases are active */}
      {showSmartPhrases && (
        <div className="absolute -bottom-6 left-0 right-0 text-xs text-gray-500 dark:text-gray-400">
          💡 Select options above and press Ctrl+Enter to complete
        </div>
      )}
    </div>
  );
}