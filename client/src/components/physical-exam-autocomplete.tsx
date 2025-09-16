import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useFloatingCaret } from "@/hooks/use-floating-caret";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Stethoscope, Eye, Heart, Zap, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchPhysicalExamOptions, getPhysicalExamSuggestions, QUICK_PHYSICAL_EXAM_PHRASES, COMPREHENSIVE_NEGATIVE_FINDINGS, type PhysicalExamOption } from "@/lib/physical-exam-options";
import { useAutocompleteItems } from "@/hooks/use-autocomplete-items";

interface PhysicalExamAutocompleteProps {
  query: string;
  position: { top: number; left: number; width?: number };
  onSelect: (finding: string) => void;
  onClose: () => void;
  sectionId: string;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
}

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'cardiovascular':
      return <Heart size={14} className="text-red-500" />;
    case 'pulmonary':
      return <Zap size={14} className="text-[color:var(--brand-700)]" />;
    case 'neurological':
      return <Zap size={14} className="text-purple-500" />;
    case 'heent':
      return <Eye size={14} className="text-green-500" />;
    default:
      return <Stethoscope size={14} className="text-gray-500" />;
  }
};

export function PhysicalExamAutocomplete({ 
  query, 
  position, 
  onSelect, 
  onClose, 
  sectionId,
  textareaRef 
}: PhysicalExamAutocompleteProps) {
  // Caret-anchored, body‑portaled positioning
  const { floatingRef, x, y, ready } = useFloatingCaret(textareaRef as any, { placement: "bottom-start", gutter: 6 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showCategories, setShowCategories] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const { items: customItems } = useAutocompleteItems('physical-exam');

  // Get suggestions based on query
  // Merge custom items into quick suggestions
  const baseSuggestions = getPhysicalExamSuggestions(query);
  const customMatches = customItems
    .filter(item =>
      item.text.toLowerCase().includes(query.toLowerCase().trim()) ||
      item.description?.toLowerCase().includes(query.toLowerCase().trim())
    )
    .sort((a, b) => Number(b.isPriority) - Number(a.isPriority))
    .map(i => i.text);
  const suggestions = Array.from(new Set([...customMatches, ...baseSuggestions])).slice(0, 12);
  const categoryResults = searchPhysicalExamOptions(query);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle these keys when autocomplete is visible and specifically for our container
      if (['ArrowDown', 'ArrowUp', 'Enter', 'Tab', 'Escape'].includes(e.key)) {
        // Check if the event is happening within our autocomplete context
        const target = e.target as Element;
        const isInAutocomplete = target && (
          target.closest('[data-physical-exam-autocomplete]') ||
          target.closest('[data-testid="physical-exam-autocomplete"]') ||
          (textareaRef?.current && textareaRef.current.contains(target))
        );

        if (isInAutocomplete) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation(); // Stop other listeners from executing
          
          if (e.key === 'ArrowDown') {
            setSelectedIndex(prev => 
              prev < (showCategories ? categoryResults.reduce((acc, cat) => acc + cat.findings.length, 0) - 1 : suggestions.length - 1) ? prev + 1 : 0
            );
          } else if (e.key === 'ArrowUp') {
            setSelectedIndex(prev => 
              prev > 0 ? prev - 1 : (showCategories ? categoryResults.reduce((acc, cat) => acc + cat.findings.length, 0) - 1 : suggestions.length - 1)
            );
          } else if (e.key === 'Enter' || e.key === 'Tab') {
            if (showCategories) {
              let currentIndex = 0;
              for (const category of categoryResults) {
                for (const finding of category.findings) {
                  if (currentIndex === selectedIndex) {
                    onSelect(finding);
                    return;
                  }
                  currentIndex++;
                }
              }
            } else if (suggestions[selectedIndex]) {
              onSelect(suggestions[selectedIndex]);
            }
          } else if (e.key === 'Escape') {
            onClose();
          }
        }
      }
    };

    // Use document level for better reliability with higher priority
    document.addEventListener('keydown', handleKeyDown, { capture: true, passive: false });
    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true } as any);
    };
  }, [selectedIndex, suggestions, categoryResults, showCategories, onSelect, onClose, textareaRef]);

  // Keep highlighted item in view while navigating
  useEffect(() => {
    const el = listRef.current?.querySelector('[aria-selected="true"]') as HTMLElement | null;
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex, showCategories, suggestions.length, categoryResults.length]);

  // Keep current selection index if still in range when category toggle changes
  useEffect(() => {
    setSelectedIndex(prev => {
      const total = showCategories
        ? categoryResults.reduce((acc, cat) => acc + cat.findings.length, 0)
        : suggestions.length;
      return Math.min(prev, Math.max(0, total - 1));
    });
  }, [showCategories, categoryResults, suggestions.length]);

  // Stable behavior: do not close on outside click to keep popup until selection or query changes

  if (suggestions.length === 0 && categoryResults.length === 0) {
    return null;
  }

  return createPortal(
    <div
      ref={floatingRef as any}
      data-physical-exam-autocomplete
      className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg max-w-lg max-h-96 overflow-hidden"
      style={{
        top: ready ? y : 0,
        left: ready ? x : 0,
        width: position.width ? `${position.width}px` : undefined,
        maxHeight: '240px',
        opacity: ready ? 1 : 0,
        pointerEvents: ready ? 'auto' : 'none'
      }}
      data-testid="physical-exam-autocomplete"
    >
      {/* Header */}
      <div className="bg-gray-50 px-3 py-2 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Stethoscope size={16} className="text-[color:var(--brand-700)]" />
          <span className="text-sm font-medium">Physical Exam</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">Tab to select</Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowCategories(!showCategories);
              setSelectedIndex(0);
            }}
            className="h-6 px-2 text-xs"
          >
            {showCategories ? 'Quick' : 'Categories'}
          </Button>
        </div>
      </div>

      <div ref={listRef} className="overflow-y-auto overscroll-contain" style={{ maxHeight: 240 }}>
        {!showCategories ? (
          /* Quick Suggestions View */
          <div className="p-2">
            {suggestions.length > 0 ? (
              <div className="space-y-1" role="listbox" aria-label="Physical exam suggestions">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-2 rounded cursor-pointer text-sm border transition-colors",
                      selectedIndex === index 
                        ? "bg-[color:var(--brand-50)] border-[color:var(--brand-200)] text-slate-900 border-l-2 border-l-[color:var(--brand-700)]" 
                        : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                    )}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      (e as any).nativeEvent?.stopImmediatePropagation?.();
                      onSelect(suggestion);
                    }}
                    data-testid={`physical-exam-suggestion-${index}`}
                    role="option"
                    aria-selected={selectedIndex === index}
                    id={`physical-exam-option-${index}`}
                  >
                    <div className="flex items-center gap-2">
                      <Stethoscope size={12} className="text-gray-400 flex-shrink-0" />
                      <span className={cn(
                        "flex-1",
                        suggestion === COMPREHENSIVE_NEGATIVE_FINDINGS ? "text-green-700 font-medium" : ""
                      )}>
                        {suggestion === COMPREHENSIVE_NEGATIVE_FINDINGS 
                          ? "Complete Normal Physical Exam (All Systems)" 
                          : suggestion
                        }
                      </span>
                      <ChevronRight size={12} className="text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 text-sm">
                No matching findings found
              </div>
            )}

            {/* Quick phrases and comprehensive negative at bottom */}
            {query.length < 3 && (
              <div className="mt-3 pt-3 border-t space-y-3">
                {/* Comprehensive negative option */}
                <div>
                  <div className="text-xs text-gray-600 mb-2 font-medium">Complete Normal Exam:</div>
                  <div
                    className="p-2 rounded cursor-pointer text-xs bg-green-50 border border-green-200 hover:bg-green-100 transition-colors font-medium"
                    onClick={() => onSelect(COMPREHENSIVE_NEGATIVE_FINDINGS)}
                    data-testid="comprehensive-negative-findings"
                  >
                    🔍 Complete Normal Physical Exam (All Systems)
                  </div>
                </div>
                
                {/* Quick templates */}
                <div>
                  <div className="text-xs text-gray-600 mb-2 font-medium">System Templates:</div>
                  <div className="grid gap-1">
                    {QUICK_PHYSICAL_EXAM_PHRASES.slice(0, 4).map((phrase, index) => (
                      <div
                        key={`quick-${index}`}
                        className="p-2 rounded cursor-pointer text-xs bg-[color:var(--brand-50)] border border-[color:var(--brand-200)] hover:bg-[color:var(--brand-100)] transition-colors"
                        onClick={() => onSelect(phrase)}
                        data-testid={`quick-phrase-${index}`}
                      >
                        {phrase}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Categories View */
          <div className="p-2 space-y-3">
            {categoryResults.map((category, categoryIndex) => (
              <div key={category.category}>
                <div className="flex items-center gap-2 mb-2">
                  {getCategoryIcon(category.category)}
                  <span className="font-medium text-sm text-gray-700">
                    {category.category}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {category.findings.length}
                  </Badge>
                </div>
                
                <div className="ml-6 space-y-1" role="listbox" aria-label={`Physical exam ${category.category} findings`}>
                  {category.findings.map((finding, findingIndex) => {
                    const globalIndex = categoryResults
                      .slice(0, categoryIndex)
                      .reduce((acc, cat) => acc + cat.findings.length, 0) + findingIndex;
                    
                    return (
                      <div
                        key={findingIndex}
                    className={cn(
                      "p-2 rounded cursor-pointer text-sm border transition-colors",
                      selectedIndex === globalIndex 
                        ? "bg-[color:var(--brand-50)] border-[color:var(--brand-200)] text-slate-900 border-l-2 border-l-[color:var(--brand-700)]" 
                        : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                    )}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          (e as any).nativeEvent?.stopImmediatePropagation?.();
                          onSelect(finding);
                        }}
                        data-testid={`category-finding-${categoryIndex}-${findingIndex}`}
                        role="option"
                        aria-selected={selectedIndex === globalIndex}
                        id={`physical-exam-option-${globalIndex}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-gray-300 rounded-full flex-shrink-0"></span>
                          <span className="flex-1">{finding}</span>
                          <ChevronRight size={12} className="text-gray-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-3 py-2 border-t text-xs text-gray-600">
        <div className="flex items-center justify-between">
          <span>Use ↑↓ to navigate, Tab to select</span>
          <span>{showCategories ? `${categoryResults.reduce((acc, cat) => acc + cat.findings.length, 0)} findings` : `${suggestions.length} suggestions`}</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
