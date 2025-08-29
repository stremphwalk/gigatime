import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSmartPhrases } from "../hooks/use-smart-phrases";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Edit2, Trash2, Zap, Calendar, MousePointer, ChevronRight, Download, Filter, Clock, Star, SortAsc } from "lucide-react";
import { AdvancedFilterBar } from "./advanced-filter-bar";
import { FlexibleSmartPhraseBuilder } from "./flexible-smart-phrase-builder";
import { ImportSmartPhraseDialog } from "./import-smart-phrase-dialog";

export function SmartPhrasesManager() {
  const [activeTab, setActiveTab] = useState<"library" | "create" | "edit">("library");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingPhrase, setEditingPhrase] = useState<any>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "dateCreated" | "dateModified" | "lastUsed" | "type">("name");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const { phrases, createPhrase, updatePhrase, deletePhrase, isCreating } = useSmartPhrases();
  const { toast } = useToast();

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

  const handleCreateNew = () => {
    setEditingPhrase(null);
    setActiveTab("create");
  };

  const handleEdit = (phrase: any) => {
    setEditingPhrase(phrase);
    setActiveTab("edit");
  };

  const handleDelete = async (phraseId: string) => {
    if (window.confirm("Are you sure you want to delete this phrase?")) {
      try {
        await deletePhrase(phraseId);
        toast({
          title: "Success",
          description: "Smart phrase deleted successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete smart phrase",
          variant: "destructive",
        });
      }
    }
  };

  const handleSave = async (data: any) => {
    try {
      if (editingPhrase) {
        await updatePhrase({ id: editingPhrase.id, ...data });
        toast({
          title: "Success",
          description: "Smart phrase updated successfully",
        });
      } else {
        await createPhrase(data);
        toast({
          title: "Success", 
          description: "Smart phrase created successfully",
        });
      }
      setActiveTab("library");
      setEditingPhrase(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save smart phrase",
        variant: "destructive",
      });
    }
  };

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

  if (activeTab === "create" || activeTab === "edit") {
    return (
      <div className="h-full overflow-hidden">
        <FlexibleSmartPhraseBuilder
          initialData={editingPhrase ? {
            trigger: editingPhrase.trigger,
            content: editingPhrase.content,
            description: editingPhrase.description || "",
            category: editingPhrase.category || "general",
            elements: editingPhrase.elements || []
          } : undefined}
          onSave={handleSave}
          onCancel={() => setActiveTab("library")}
          isLoading={isCreating}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-200 p-6 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Smart Phrases Library</h1>
            <p className="text-gray-600 mt-1">Manage flexible smart phrases with mixed interactive elements</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setShowImportDialog(true)}
              className="border-professional-blue text-professional-blue hover:bg-professional-blue/10"
              data-testid="button-import-phrase"
            >
              <Download size={16} className="mr-2" />
              Import Phrase
            </Button>
            <Button onClick={handleCreateNew} data-testid="button-create-phrase">
              <Plus size={16} className="mr-2" />
              Create New Phrase
            </Button>
          </div>
        </div>

        {/* Enhanced Search and Filter Bar */}
        <div className="mt-4">
          <AdvancedFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search phrases by trigger, description, or category..."
            
            filterOptions={[
              { value: "interactive", label: "Interactive" },
              { value: "text", label: "Text Only" }
            ]}
            selectedFilter={filterType}
            onFilterChange={setFilterType}
            filterLabel="Type"
            
            categoryOptions={categories.map(category => ({
              value: category,
              label: category.charAt(0).toUpperCase() + category.slice(1)
            }))}
            selectedCategory={filterCategory}
            onCategoryChange={setFilterCategory}
            categoryLabel="Category"
            
            sortOptions={[
              { value: "name", label: "Name", icon: <SortAsc size={12} /> },
              { value: "dateCreated", label: "Date Created" },
              { value: "dateModified", label: "Date Modified" },
              { value: "lastUsed", label: "Last Used" },
              { value: "type", label: "Type" }
            ]}
            selectedSort={sortBy}
            onSortChange={(value: any) => setSortBy(value)}
            sortLabel="Sort by"
            
            resultCount={sortedPhrases.length}
            resultLabel="phrase(s)"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {sortedPhrases.length === 0 ? (
          <div className="text-center py-12">
            <Zap size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery || filterType !== "all" || filterCategory !== "all" ? 'No phrases found' : 'No smart phrases yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || filterType !== "all" || filterCategory !== "all"
                ? 'Try adjusting your search terms or filters' 
                : 'Create your first flexible smart phrase to speed up documentation'
              }
            </p>
            {!searchQuery && filterType === "all" && filterCategory === "all" && (
              <Button onClick={handleCreateNew} data-testid="button-create-first-phrase">
                <Plus size={16} className="mr-2" />
                Create Your First Phrase
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {sortedPhrases.map((phrase) => (
              <Card key={phrase.id} className="hover:shadow-md transition-shadow border-l-4 border-l-medical-teal">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    {/* Left side - Trigger and description */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-medical-teal">
                            /{phrase.trigger}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {phrase.category}
                          </Badge>
                        </div>
                        
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
                        <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                          {phrase.description}
                        </p>
                      )}
                      
                      <div className="text-sm text-gray-500 line-clamp-2">
                        {phrase.content}
                      </div>
                    </div>

                    {/* Right side - Metadata and actions */}
                    <div className="flex items-center gap-4 ml-4">
                      {/* Metadata */}
                      <div className="text-right text-xs text-gray-500 space-y-1">
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

                      {/* Action buttons */}
                      <div className="flex items-center space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(phrase)}
                          data-testid={`button-edit-phrase-${phrase.id}`}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(phrase.id)}
                          className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                          data-testid={`button-delete-phrase-${phrase.id}`}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <ImportSmartPhraseDialog 
        open={showImportDialog} 
        onOpenChange={setShowImportDialog} 
      />
    </div>
  );
}