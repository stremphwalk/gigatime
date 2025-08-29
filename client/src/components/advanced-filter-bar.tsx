import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X, SortAsc, SortDesc } from "lucide-react";

interface FilterOption {
  value: string;
  label: string;
  description?: string;
}

interface SortOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface AdvancedFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  
  // Filter options
  filterOptions?: FilterOption[];
  selectedFilter?: string;
  onFilterChange?: (filter: string) => void;
  filterLabel?: string;
  
  // Category filter
  categoryOptions?: FilterOption[];
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  categoryLabel?: string;
  
  // Sort options
  sortOptions?: SortOption[];
  selectedSort?: string;
  onSortChange?: (sort: string) => void;
  sortLabel?: string;
  
  // Additional filters
  additionalFilters?: React.ReactNode;
  
  // Results count
  resultCount?: number;
  resultLabel?: string;
  
  // Actions
  actions?: React.ReactNode;
  
  // Layout
  compact?: boolean;
  showSearch?: boolean;
  showFilters?: boolean;
  showSort?: boolean;
}

export function AdvancedFilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  
  filterOptions,
  selectedFilter,
  onFilterChange,
  filterLabel = "Filter",
  
  categoryOptions,
  selectedCategory,
  onCategoryChange,
  categoryLabel = "Category",
  
  sortOptions,
  selectedSort,
  onSortChange,
  sortLabel = "Sort",
  
  additionalFilters,
  resultCount,
  resultLabel = "items",
  
  actions,
  
  compact = false,
  showSearch = true,
  showFilters = true,
  showSort = true
}: AdvancedFilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasFilters = filterOptions && filterOptions.length > 0;
  const hasCategories = categoryOptions && categoryOptions.length > 0;
  const hasSort = sortOptions && sortOptions.length > 0;
  const hasAdditionalFilters = additionalFilters;

  const showExpandButton = hasAdditionalFilters && !isExpanded;

  return (
    <div className="space-y-3">
      {/* Main Search and Filter Row */}
      <div className="flex items-center gap-3">
        {/* Search Bar */}
        {showSearch && (
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSearchChange("")}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X size={12} />
              </Button>
            )}
          </div>
        )}

        {/* Filter Controls */}
        {showFilters && (
          <div className="flex items-center gap-2">
            {hasFilters && (
              <>
                <div className="flex items-center gap-1">
                  <Filter size={14} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">{filterLabel}:</span>
                </div>
                <Select value={selectedFilter || "all"} onValueChange={onFilterChange}>
                  <SelectTrigger className={compact ? "w-28" : "w-32"}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {filterOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}

            {hasCategories && (
              <>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-gray-700">{categoryLabel}:</span>
                </div>
                <Select value={selectedCategory || "all"} onValueChange={onCategoryChange}>
                  <SelectTrigger className={compact ? "w-32" : "w-40"}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categoryOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        )}

        {/* Sort Controls */}
        {showSort && hasSort && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm font-medium text-gray-700">{sortLabel}:</span>
            <Select value={selectedSort || sortOptions[0]?.value} onValueChange={onSortChange}>
              <SelectTrigger className={compact ? "w-28" : "w-32"}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.icon}
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Result Count */}
        {resultCount !== undefined && (
          <Badge variant="secondary" className="text-sm">
            {resultCount} {resultLabel}
          </Badge>
        )}

        {/* Actions */}
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}

        {/* Expand/Collapse Button */}
        {showExpandButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="text-xs"
          >
            <Filter size={12} className="mr-1" />
            More Filters
          </Button>
        )}
      </div>

      {/* Additional Filters (Expanded) */}
      {isExpanded && hasAdditionalFilters && (
        <div className="border-t border-gray-200 pt-3">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">Additional Filters</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="h-6 w-6 p-0"
            >
              <X size={14} />
            </Button>
          </div>
          <div className="space-y-3">
            {additionalFilters}
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {(selectedFilter && selectedFilter !== "all") || 
       (selectedCategory && selectedCategory !== "all") || 
       searchQuery ? (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500">Active filters:</span>
          
          {searchQuery && (
            <Badge variant="outline" className="text-xs">
              Search: "{searchQuery}"
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSearchChange("")}
                className="h-4 w-4 p-0 ml-1"
              >
                <X size={10} />
              </Button>
            </Badge>
          )}
          
          {selectedFilter && selectedFilter !== "all" && filterOptions && (
            <Badge variant="outline" className="text-xs">
              {filterLabel}: {filterOptions.find(f => f.value === selectedFilter)?.label}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFilterChange?.("all")}
                className="h-4 w-4 p-0 ml-1"
              >
                <X size={10} />
              </Button>
            </Badge>
          )}
          
          {selectedCategory && selectedCategory !== "all" && categoryOptions && (
            <Badge variant="outline" className="text-xs">
              {categoryLabel}: {categoryOptions.find(c => c.value === selectedCategory)?.label}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCategoryChange?.("all")}
                className="h-4 w-4 p-0 ml-1"
              >
                <X size={10} />
              </Button>
            </Badge>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onSearchChange("");
              onFilterChange?.("all");
              onCategoryChange?.("all");
            }}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Clear all
          </Button>
        </div>
      ) : null}
    </div>
  );
}
