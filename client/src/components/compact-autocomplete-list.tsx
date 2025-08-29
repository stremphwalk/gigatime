import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AutocompleteItem {
  id: string;
  label: string;
  description?: string;
  category?: string;
  type?: string;
  metadata?: Record<string, any>;
}

interface CompactAutocompleteListProps {
  items: AutocompleteItem[];
  onSelect: (item: AutocompleteItem) => void;
  onClose?: () => void;
  placeholder?: string;
  maxHeight?: string;
  showSearch?: boolean;
  showCategories?: boolean;
  selectedIndex?: number;
  onSelectedIndexChange?: (index: number) => void;
  renderItem?: (item: AutocompleteItem, isSelected: boolean) => React.ReactNode;
  filterItems?: (items: AutocompleteItem[], query: string) => AutocompleteItem[];
}

export function CompactAutocompleteList({
  items,
  onSelect,
  onClose,
  placeholder = "Search...",
  maxHeight = "300px",
  showSearch = true,
  showCategories = false,
  selectedIndex = 0,
  onSelectedIndexChange,
  renderItem,
  filterItems
}: CompactAutocompleteListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredItems, setFilteredItems] = useState<AutocompleteItem[]>(items);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter items based on search query
  useEffect(() => {
    if (filterItems) {
      setFilteredItems(filterItems(items, searchQuery));
    } else {
      const filtered = items.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  }, [items, searchQuery, filterItems]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!filteredItems.length) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          onSelectedIndexChange?.(
            selectedIndex < filteredItems.length - 1 ? selectedIndex + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          onSelectedIndexChange?.(
            selectedIndex > 0 ? selectedIndex - 1 : filteredItems.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (filteredItems[selectedIndex]) {
            onSelect(filteredItems[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose?.();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [filteredItems, selectedIndex, onSelect, onClose, onSelectedIndexChange]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose?.();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Group items by category if showCategories is true
  const groupedItems = showCategories 
    ? filteredItems.reduce((groups, item) => {
        const category = item.category || "Other";
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(item);
        return groups;
      }, {} as Record<string, AutocompleteItem[]>)
    : null;

  const defaultRenderItem = (item: AutocompleteItem, isSelected: boolean) => (
    <Card 
      key={item.id} 
      className={cn(
        "hover:shadow-md transition-shadow border-l-4 cursor-pointer",
        isSelected 
          ? "border-l-blue-500 bg-blue-50" 
          : "border-l-gray-200 hover:bg-gray-50"
      )}
      onClick={() => onSelect(item)}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          {/* Left side - Label and description */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                "text-sm font-medium",
                isSelected ? "text-blue-900" : "text-gray-900"
              )}>
                {item.label}
              </span>
              {item.category && (
                <Badge variant="outline" className="text-xs">
                  {item.category}
                </Badge>
              )}
              {item.type && (
                <Badge variant="secondary" className="text-xs">
                  {item.type}
                </Badge>
              )}
            </div>
            
            {item.description && (
              <p className="text-xs text-gray-600 line-clamp-1">
                {item.description}
              </p>
            )}
          </div>

          {/* Right side - Selection indicator and metadata */}
          <div className="flex items-center gap-2 ml-3">
            {isSelected && (
              <Check size={14} className="text-blue-600" />
            )}
            {item.metadata && Object.keys(item.metadata).length > 0 && (
              <div className="text-xs text-gray-500">
                {Object.entries(item.metadata).map(([key, value]) => (
                  <div key={key}>{value}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div 
      ref={containerRef}
      className="w-full bg-white border border-gray-200 rounded-lg shadow-lg"
      style={{ maxHeight, overflowY: 'auto' }}
    >
      {/* Search Bar */}
      {showSearch && (
        <div className="p-3 border-b border-gray-200">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <Input
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="p-2">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">
              {searchQuery ? 'No items found' : 'No items available'}
            </p>
          </div>
        ) : showCategories && groupedItems ? (
          // Grouped view
          <div className="space-y-4">
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
              <div key={category}>
                <div className="text-xs font-medium text-gray-500 mb-2 px-2">
                  {category}
                </div>
                <div className="space-y-1">
                  {categoryItems.map((item, index) => {
                    const globalIndex = filteredItems.findIndex(i => i.id === item.id);
                    const isSelected = globalIndex === selectedIndex;
                    return renderItem ? renderItem(item, isSelected) : defaultRenderItem(item, isSelected);
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Flat view
          <div className="space-y-1">
            {filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return renderItem ? renderItem(item, isSelected) : defaultRenderItem(item, isSelected);
            })}
          </div>
        )}
      </div>
    </div>
  );
}
