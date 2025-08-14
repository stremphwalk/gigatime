import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSmartPhrases } from "../hooks/use-smart-phrases";
import { Plus, Edit2, Trash2, Search, Zap } from "lucide-react";
import type { SmartPhrase } from "@shared/schema";

export function SmartPhrasesManager() {
  const [activeTab, setActiveTab] = useState<'library' | 'create' | 'edit'>('library');
  const [editingPhrase, setEditingPhrase] = useState<SmartPhrase | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    trigger: "",
    content: "",
    description: "",
    category: "general"
  });

  const { phrases, createPhrase, updatePhrase, deletePhrase, isCreating } = useSmartPhrases();

  const categories = [
    "general",
    "cardiology",
    "respiratory", 
    "neurology",
    "gastroenterology",
    "orthopedics",
    "psychiatry",
    "dermatology",
    "endocrinology",
    "hematology"
  ];

  const filteredPhrases = phrases?.filter(phrase => 
    phrase.trigger.toLowerCase().includes(searchQuery.toLowerCase()) ||
    phrase.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    phrase.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleCreateNew = () => {
    setFormData({
      trigger: "",
      content: "",
      description: "",
      category: "general"
    });
    setEditingPhrase(null);
    setActiveTab('create');
  };

  const handleEdit = (phrase: SmartPhrase) => {
    setFormData({
      trigger: phrase.trigger,
      content: phrase.content,
      description: phrase.description || "",
      category: phrase.category || "general"
    });
    setEditingPhrase(phrase);
    setActiveTab('edit');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingPhrase) {
        await updatePhrase({ id: editingPhrase.id, ...formData });
      } else {
        await createPhrase(formData);
      }
      
      setFormData({
        trigger: "",
        content: "",
        description: "",
        category: "general"
      });
      
      setActiveTab('library');
      setEditingPhrase(null);
    } catch (error) {
      console.error("Error saving smart phrase:", error);
    }
  };

  const handleDelete = async (phraseId: string) => {
    if (window.confirm("Are you sure you want to delete this smart phrase?")) {
      try {
        await deletePhrase(phraseId);
      } catch (error) {
        console.error("Error deleting smart phrase:", error);
      }
    }
  };

  if (activeTab === 'create' || activeTab === 'edit') {
    return (
      <div className="h-full flex flex-col">
        <div className="border-b border-gray-200 p-6 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                {activeTab === 'create' ? 'Create Smart Phrase' : 'Edit Smart Phrase'}
              </h1>
              <p className="text-gray-600 mt-1">
                {activeTab === 'create' 
                  ? 'Create a new smart phrase for faster documentation' 
                  : 'Modify the selected smart phrase'
                }
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setActiveTab('library')}
              data-testid="button-back-to-library"
            >
              Back to Library
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trigger">Trigger</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">/</span>
                    <Input
                      id="trigger"
                      value={formData.trigger}
                      onChange={(e) => setFormData(prev => ({ ...prev, trigger: e.target.value }))}
                      placeholder="medication"
                      className="pl-8"
                      required
                      data-testid="input-trigger"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Type "/" followed by this trigger to insert the phrase</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger data-testid="select-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of what this phrase contains"
                  data-testid="input-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="The text that will be inserted when this phrase is triggered..."
                  className="min-h-40"
                  required
                  data-testid="textarea-content"
                />
              </div>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab('library')}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating}
                  data-testid="button-save-phrase"
                >
                  {isCreating ? 'Saving...' : (activeTab === 'create' ? 'Create Phrase' : 'Update Phrase')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-200 p-6 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Smart Phrases Library</h1>
            <p className="text-gray-600 mt-1">Manage your reusable text snippets for faster documentation</p>
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
                : 'Create your first smart phrase to speed up documentation'
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
                      <CardTitle className="text-lg font-semibold">
                        <span className="text-medical-teal">/{phrase.trigger}</span>
                      </CardTitle>
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