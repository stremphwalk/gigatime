import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Stethoscope, Eye, Heart, Zap, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchPhysicalExamOptions, getPhysicalExamSuggestions, QUICK_PHYSICAL_EXAM_PHRASES, COMPREHENSIVE_NEGATIVE_FINDINGS, type PhysicalExamOption } from "@/lib/physical-exam-options";
import { useAutocompleteItems } from "@/hooks/use-autocomplete-items";

interface PhysicalExamAutocompleteProps {
  query: string;
  position: { top: number; left: number };
  onSelect: (finding: string) => void;
  onClose: () => void;
  sectionId: string;
}

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'cardiovascular':
      return <Heart size={14} className="text-red-500" />;
    case 'pulmonary':
      return <Zap size={14} className="text-blue-500" />;
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
  sectionId 
}: PhysicalExamAutocompleteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showCategories, setShowCategories] = useState(false);
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
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < (showCategories ? categoryResults.reduce((acc, cat) => acc + cat.findings.length, 0) - 1 : suggestions.length - 1) ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : (showCategories ? categoryResults.reduce((acc, cat) => acc + cat.findings.length, 0) - 1 : suggestions.length - 1)
        );
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Tab') {
        e.preventDefault();
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
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, suggestions, categoryResults, showCategories, onSelect, onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('[data-physical-exam-autocomplete]')) {
        onClose();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  if (suggestions.length === 0 && categoryResults.length === 0) {
    return null;
  }

  return (
    <div
      data-physical-exam-autocomplete
      className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg max-w-lg max-h-96 overflow-hidden"
      style={{
        top: position.top,
        left: position.left,
        minWidth: '320px'
      }}
      data-testid="physical-exam-autocomplete"
    >
      {/* Header */}
      <div className="bg-gray-50 px-3 py-2 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Stethoscope size={16} className="text-blue-600" />
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

      <div className="max-h-80 overflow-y-auto">
        {!showCategories ? (
          /* Quick Suggestions View */
          <div className="p-2">
            {suggestions.length > 0 ? (
              <div className="space-y-1">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-2 rounded cursor-pointer text-sm border transition-colors",
                      selectedIndex === index 
                        ? "bg-blue-50 border-blue-200 text-blue-900" 
                        : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                    )}
                    onClick={() => onSelect(suggestion)}
                    data-testid={`physical-exam-suggestion-${index}`}
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
                        className="p-2 rounded cursor-pointer text-xs bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
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
                
                <div className="ml-6 space-y-1">
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
                            ? "bg-blue-50 border-blue-200 text-blue-900" 
                            : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                        )}
                        onClick={() => onSelect(finding)}
                        data-testid={`category-finding-${categoryIndex}-${findingIndex}`}
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
    </div>
  );
}
