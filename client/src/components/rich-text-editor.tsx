import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "../lib/utils";
import { SmartPhraseElement } from "./smart-phrase-element";

interface SmartPhraseData {
  id: string;
  trigger: string;
  type: 'text' | 'date' | 'multipicker' | 'nested_multipicker';
  options?: any[];
  selectedOptions?: string[];
  content: string;
  startPos: number;
  endPos: number;
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSmartPhraseDetected?: (sectionId: string, trigger: string) => void;
  placeholder?: string;
  className?: string;
  sectionId: string;
  activeSmartPhrases?: Record<string, SmartPhraseData>;
  onSmartPhraseOptionToggle?: (phraseId: string, option: string) => void;
  onSmartPhraseComplete?: (phraseId: string) => void;
  onSmartPhraseEdit?: (phraseId: string) => void;
  onSmartPhraseDelete?: (phraseId: string) => void;
}

export function RichTextEditor({
  value,
  onChange,
  onSmartPhraseDetected,
  placeholder,
  className,
  sectionId,
  activeSmartPhrases = {},
  onSmartPhraseOptionToggle,
  onSmartPhraseComplete,
  onSmartPhraseEdit,
  onSmartPhraseDelete
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isComposing, setIsComposing] = useState(false);
  const lastHtml = useRef("");

  // Convert plain text to HTML with smart phrase elements
  const valueToHtml = useCallback((text: string, phrases: Record<string, SmartPhraseData>) => {
    let html = text;
    Object.entries(phrases).forEach(([id, phrase]) => {
      const phraseHtml = `<span data-smart-phrase-id="${id}" class="smart-phrase" contenteditable="false">${phrase.content}</span>`;
      html = html.slice(0, phrase.startPos) + phraseHtml + html.slice(phrase.endPos);
    });
    return html;
  }, []);

  // Convert HTML to plain text by removing smart phrase tags
  const htmlToValue = useCallback((html: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    tempDiv.querySelectorAll('.smart-phrase').forEach(el => {
      el.replaceWith(document.createTextNode(el.textContent || ''));
    });
    return tempDiv.textContent || '';
  }, []);

  // Update HTML content when value or smart phrases change
  useEffect(() => {
    if (!editorRef.current) return;
    
    const newHtml = valueToHtml(value, activeSmartPhrases);
    if (newHtml !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = newHtml;
      lastHtml.current = newHtml;
    }
  }, [value, activeSmartPhrases, valueToHtml]);

  const handleInput = useCallback(() => {
    if (!editorRef.current || isComposing) return;
    
    const currentHtml = editorRef.current.innerHTML;
    if (currentHtml === lastHtml.current) return;
    
    lastHtml.current = currentHtml;
    const plainText = htmlToValue(currentHtml);
    onChange(plainText);

    // Check for smart phrase triggers
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const text = range.startContainer.textContent || '';
      const offset = range.startOffset;
      
      if (text[offset - 1] === '/' && onSmartPhraseDetected) {
        onSmartPhraseDetected(sectionId, text.slice(0, offset));
      }
    }
  }, [onChange, isComposing, htmlToValue, onSmartPhraseDetected, sectionId]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      Object.keys(activeSmartPhrases).forEach(phraseId => {
        onSmartPhraseComplete?.(phraseId);
      });
    }
  }, [activeSmartPhrases, onSmartPhraseComplete]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  const handleCopy = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const selection = window.getSelection();
    if (selection) {
      const plainText = selection.toString();
      e.clipboardData.setData('text/plain', plainText);
    }
  }, []);

  return (
    <div className="relative">
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onCopy={handleCopy}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        className={cn(
          "min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2",
          "text-sm ring-offset-background",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "resize-none font-mono leading-6 whitespace-pre-wrap",
          className
        )}
        data-section-id={sectionId}
        data-testid={`editor-${sectionId}`}
      />
      
      {/* Render interactive smart phrase elements */}
      {Object.entries(activeSmartPhrases).map(([phraseId, phrase]) => (
        <SmartPhraseElement
          key={phraseId}
          phraseId={phraseId}
          trigger={phrase.trigger}
          type={phrase.type}
          options={phrase.options || []}
          selectedOptions={phrase.selectedOptions || []}
          content={phrase.content}
          onOptionToggle={onSmartPhraseOptionToggle}
          onComplete={onSmartPhraseComplete}
          onEdit={onSmartPhraseEdit}
          onDelete={onSmartPhraseDelete}
        />
      ))}
    </div>
  );
}