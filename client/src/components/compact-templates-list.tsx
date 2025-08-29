import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNoteTemplates } from "../hooks/use-notes";
import { Search, Filter, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NoteTemplate } from "@shared/schema";

interface CompactTemplatesListProps {
  onSelect?: (template: NoteTemplate) => void;
  showActions?: boolean;
  maxHeight?: string;
}

export function CompactTemplatesList({ 
  onSelect, 
  showActions = false, 
  maxHeight = "400px" 
}: CompactTemplatesListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "dateCreated" | "dateModified" | "type">("name");
  const [filterType, setFilterType] = useState<string>("all");

  const { templates } = useNoteTemplates();

  const templateTypes = [
    { value: "admission", label: "Admission Note" },
    { value: "progress", label: "Progress Note" },
    { value: "consult", label: "Consult Note" },
    { value: "discharge", label: "Discharge Summary" },
    { value: "procedure", label: "Procedure Note" },
    { value: "emergency", label: "Emergency Note" },
    { value: "custom", label: "Custom Template" }
  ];

  // Filter templates based on search query and filters
  const filteredTemplates = templates?.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === "all" || template.type === filterType;
    
    return matchesSearch && matchesType;
  }) || [];

  // Sort templates
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "dateCreated":
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      case "dateModified":
        return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
      case "type":
        return a.type.localeCompare(b.type);
      default:
        return 0;
    }
  });

  // Get unique template types for filter
  const templateTypeValues = Array.from(new Set(templates?.map(t => t.type) || []));

  return (
    <div className="w-full">
      {/* Search and Filter Bar */}
      <div className="space-y-3 mb-4">
        {/* Search Bar */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Search templates..."
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
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {templateTypeValues.map(type => (
                <SelectItem key={type} value={type}>
                  {templateTypes.find(t => t.value === type)?.label || type}
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
                <SelectItem value="type">Type</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Badge variant="secondary" className="text-xs">
            {sortedTemplates.length}
          </Badge>
        </div>
      </div>

      {/* Templates List */}
      <div className="space-y-2" style={{ maxHeight, overflowY: 'auto' }}>
        {sortedTemplates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText size={32} className="mx-auto mb-2 text-gray-400" />
            <p className="text-sm">
              {searchQuery || filterType !== "all" 
                ? 'No templates found' 
                : 'No templates available'
              }
            </p>
          </div>
        ) : (
          sortedTemplates.map((template) => {
            let sectionsCount = 0;
            try {
              const sections = Array.isArray(template.sections) 
                ? template.sections 
                : (typeof template.sections === 'string' ? JSON.parse(template.sections) : []);
              sectionsCount = sections.length;
            } catch (error) {
              sectionsCount = 0;
            }

            return (
              <Card 
                key={template.id} 
                className={cn(
                  "hover:shadow-md transition-shadow border-l-4 border-l-professional-blue cursor-pointer",
                  onSelect && "hover:bg-gray-50"
                )}
                onClick={() => onSelect?.(template)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    {/* Left side - Template name and description */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-professional-blue">
                          {template.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {templateTypes.find(t => t.value === template.type)?.label || template.type}
                        </Badge>
                      </div>
                      
                      {template.description && (
                        <p className="text-xs text-gray-600 mb-1 line-clamp-1">
                          {template.description}
                        </p>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">{sectionsCount}</span> section{sectionsCount !== 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Right side - Metadata */}
                    <div className="text-right text-xs text-gray-500 space-y-1 ml-3">
                      <div>
                        Created: {new Date(template.createdAt || '').toLocaleDateString()}
                      </div>
                      <div>
                        Updated: {new Date(template.updatedAt || '').toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
