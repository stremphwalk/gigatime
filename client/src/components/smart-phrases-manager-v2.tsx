import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSmartPhrases } from "../hooks/use-smart-phrases";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Edit2, Trash2, Zap, Calendar, MousePointer, ChevronRight } from "lucide-react";
import { FlexibleSmartPhraseBuilder } from "./flexible-smart-phrase-builder";

export function SmartPhrasesManager() {
  const [activeTab, setActiveTab] = useState<"library" | "create" | "edit">("library");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingPhrase, setEditingPhrase] = useState<any>(null);

  const { phrases, createPhrase, updatePhrase, deletePhrase, isCreating } = useSmartPhrases();
  const { toast } = useToast();

  const filteredPhrases = phrases?.filter(phrase =>
    phrase.trigger.toLowerCase().includes(searchQuery.toLowerCase()) ||
    phrase.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    phrase.category?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

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
      case 'multipicker': return <MousePointer size={10} />;
      case 'nested_multipicker': return <ChevronRight size={10} />;
      case 'date': return <Calendar size={10} />;
      default: return <Zap size={10} />;
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
          <Button onClick={handleCreateNew} data-testid="button-create-phrase">
            <Plus size={16} className="mr-2" />
            Create New Phrase
          </Button>
        </div>

        <div className="mt-4 flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search phrases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-phrases"
            />
          </div>
          <Badge variant="secondary" className="text-sm">
            {filteredPhrases.length} phrase{filteredPhrases.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {filteredPhrases.length === 0 ? (
          <div className="text-center py-12">
            <Zap size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No phrases found' : 'No smart phrases yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery 
                ? 'Try adjusting your search terms' 
                : 'Create your first flexible smart phrase to speed up documentation'
              }
            </p>
            {!searchQuery && (
              <Button onClick={handleCreateNew} data-testid="button-create-first-phrase">
                <Plus size={16} className="mr-2" />
                Create Your First Phrase
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPhrases.map((phrase) => (
              <Card key={phrase.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <CardTitle className="text-lg font-semibold">
                          <span className="text-medical-teal">/{phrase.trigger}</span>
                        </CardTitle>
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
                        <CardDescription className="mt-1">
                          {phrase.description}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {phrase.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {phrase.content}
                      </p>
                    </div>
                    {phrase.elements && Array.isArray(phrase.elements) && (phrase.elements as any[]).length > 0 && (
                      <div className="text-xs text-gray-500">
                        {(phrase.elements as any[]).length} interactive element{(phrase.elements as any[]).length !== 1 ? 's' : ''}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        {phrase.content.length} characters
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(phrase)}
                          data-testid={`button-edit-phrase-${phrase.id}`}
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(phrase.id)}
                          className="text-red-600 hover:text-red-700"
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
    </div>
  );
}