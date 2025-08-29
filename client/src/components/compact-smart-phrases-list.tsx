import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSmartPhrases } from "../hooks/use-smart-phrases";
import { Search, Filter, Clock, Zap, Calendar, MousePointer, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompactSmartPhrasesListProps {
  onSelect?: (phrase: any) => void;
  showActions?: boolean;
  maxHeight?: string;
}

export function CompactSmartPhrasesList({ 
  onSelect, 
  showActions = false, 
  maxHeight = "400px" 
}: CompactSmartPhrasesListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "dateCreated" | "dateModified" | "lastUsed" | "type">("name");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const { phrases } = useSmartPhrases();

  // Filter phrases based on search query and filters
  const filteredPhrases = phrases?.filter(phrase => {
    const matchesSearch = phrase.trigger.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phrase.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phrase.category?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === "all" || 
      (filterType === "interactive" && phrase.elements && phrase.elements.length > 0) ||
      (filterType === "text" && (!phrase.elements || phrase.elements.length === 0));
    
    const matchesCategory = filterCategory === "all" || phrase.category === filterCategory;
    
    return matchesSearch && matchesType && matchesCategory;
  }) || [];

  // Sort phrases
  const sortedPhrases = [...filteredPhrases].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.trigger.localeCompare(b.trigger);
      case "dateCreated":
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      case "dateModified":
        return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
      case "lastUsed":
        return new Date(b.lastUsed || 0).getTime() - new Date(a.lastUsed || 0).getTime();
      case "type":
        const aHasElements = a.elements && a.elements.length > 0;
        const bHasElements = b.elements && b.elements.length > 0;
        if (aHasElements === bHasElements) return a.trigger.localeCompare(b.trigger);
        return aHasElements ? -1 : 1;
      default:
        return 0;
    }
  });

  // Get unique categories for filter
  const categories = Array.from(new Set(phrases?.map(p => p.category).filter(Boolean) || []));

  const getElementTypeIcon = (type: string) => {
    switch (type) {
      case 'multipicker': return <MousePointer size={12} />;
      case 'nested_multipicker': return <ChevronRight size={12} />;
      case 'date': return <Calendar size={12} />;
      default: return <Zap size={12} />;
    }
  };

  const getElementTypeColor = (type: string) => {
    switch (type) {
      case 'multipicker': return "bg-blue-50 text-blue-700 border-blue-200";
      case 'nested_multipicker': return "bg-purple-50 text-purple-700 border-purple-200";  
      case 'date': return "bg-green-50 text-green-700 border-green-200";
      default: return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  return (
    <div className="w-full">
      {/* Search and Filter Bar */}
      <div className="space-y-3 mb-4">
        {/* Search Bar */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Search phrases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
          </div>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="interactive">Interactive</SelectItem>
              <SelectItem value="text">Text Only</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm font-medium text-gray-700">Sort:</span>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="dateCreated">Created</SelectItem>
                <SelectItem value="dateModified">Modified</SelectItem>
                <SelectItem value="lastUsed">Last Used</SelectItem>
                <SelectItem value="type">Type</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Badge variant="secondary" className="text-xs">
            {sortedPhrases.length}
          </Badge>
        </div>
      </div>

      {/* Phrases List */}
      <div className="space-y-2" style={{ maxHeight, overflowY: 'auto' }}>
        {sortedPhrases.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Zap size={32} className="mx-auto mb-2 text-gray-400" />
            <p className="text-sm">
              {searchQuery || filterType !== "all" || filterCategory !== "all" 
                ? 'No phrases found' 
                : 'No smart phrases available'
              }
            </p>
          </div>
        ) : (
          sortedPhrases.map((phrase) => (
            <Card 
              key={phrase.id} 
              className={cn(
                "hover:shadow-md transition-shadow border-l-4 border-l-medical-teal cursor-pointer",
                onSelect && "hover:bg-gray-50"
              )}
              onClick={() => onSelect?.(phrase)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  {/* Left side - Trigger and description */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-medical-teal">
                        /{phrase.trigger}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {phrase.category}
                      </Badge>
                      
                      {/* Interactive elements indicators */}
                      {phrase.elements && Array.isArray(phrase.elements) && (phrase.elements as any[]).length > 0 && (
                        <div className="flex space-x-1">
                          {(phrase.elements as any[]).map((element: any, index: number) => (
                            <Badge 
                              key={index}
                              variant="outline" 
                              className={`text-xs ${getElementTypeColor(element.type)}`}
                            >
                              {getElementTypeIcon(element.type)}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {(!phrase.elements || !Array.isArray(phrase.elements) || (phrase.elements as any[]).length === 0) && (
                        <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
                          <Zap size={10} className="mr-1" />
                          Text
                        </Badge>
                      )}
                    </div>
                    
                    {phrase.description && (
                      <p className="text-xs text-gray-600 mb-1 line-clamp-1">
                        {phrase.description}
                      </p>
                    )}
                    
                    <div className="text-xs text-gray-500 line-clamp-1">
                      {phrase.content}
                    </div>
                  </div>

                  {/* Right side - Metadata */}
                  <div className="text-right text-xs text-gray-500 space-y-1 ml-3">
                    <div className="flex items-center gap-1">
                      <Clock size={10} />
                      {phrase.lastUsed ? new Date(phrase.lastUsed).toLocaleDateString() : 'Never used'}
                    </div>
                    <div>
                      {phrase.content.length} chars
                    </div>
                    {phrase.elements && Array.isArray(phrase.elements) && (phrase.elements as any[]).length > 0 && (
                      <div>
                        {(phrase.elements as any[]).length} element{(phrase.elements as any[]).length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
