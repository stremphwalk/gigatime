import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSmartPhrases } from "../hooks/use-smart-phrases";
import { useToast } from "../hooks/use-toast";
import { Plus, Edit2, Trash2, Search, Zap, X, Calendar, MousePointer, ChevronRight, Save } from "lucide-react";
import type { SmartPhrase } from "@shared/schema";

interface MultipickerOption {
  label: string;
  value: string;
  children?: MultipickerOption[];
}

export function SmartPhrasesManager() {
  const [activeTab, setActiveTab] = useState<'library' | 'create' | 'edit'>('library');
  const [editingPhrase, setEditingPhrase] = useState<SmartPhrase | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    trigger: "",
    content: "",
    description: "",
    category: "general",
    type: "text" as "text" | "multipicker" | "nested_multipicker" | "date",
    options: null as any
  });

  const { phrases, createPhrase, updatePhrase, deletePhrase, isCreating } = useSmartPhrases();
  const { toast } = useToast();

  // Option builder methods
  const addOption = (parentPath?: string[]) => {
    const newOption = { label: "", value: "", children: [] };
    
    if (!formData.options) {
      setFormData(prev => ({
        ...prev,
        options: { choices: [newOption] }
      }));
    } else if (!parentPath || parentPath.length === 0) {
      setFormData(prev => ({
        ...prev,
        options: {
          ...prev.options,
          choices: [...(prev.options.choices || []), newOption]
        }
      }));
    } else {
      // Add nested option
      const updateNestedOptions = (options: MultipickerOption[], path: string[], depth = 0): MultipickerOption[] => {
        if (depth === path.length - 1) {
          return options.map(opt => 
            opt.value === path[depth]
              ? { ...opt, children: [...(opt.children || []), newOption] }
              : opt
          );
        }
        return options.map(opt =>
          opt.value === path[depth]
            ? { ...opt, children: updateNestedOptions(opt.children || [], path, depth + 1) }
            : opt
        );
      };

      setFormData(prev => ({
        ...prev,
        options: {
          ...prev.options,
          choices: updateNestedOptions(prev.options.choices || [], parentPath)
        }
      }));
    }
  };

  const updateOption = (path: string[], field: 'label' | 'value', value: string) => {
    const updateNestedOptions = (options: MultipickerOption[], currentPath: string[], depth = 0): MultipickerOption[] => {
      if (depth === currentPath.length - 1) {
        return options.map(opt => 
          opt.value === currentPath[depth] || (opt.value === '' && depth === 0 && currentPath.length === 1)
            ? { ...opt, [field]: value }
            : opt
        );
      }
      return options.map(opt =>
        opt.value === currentPath[depth]
          ? { ...opt, children: updateNestedOptions(opt.children || [], currentPath, depth + 1) }
          : opt
      );
    };

    setFormData(prev => ({
      ...prev,
      options: {
        ...prev.options,
        choices: updateNestedOptions(prev.options.choices || [], path)
      }
    }));
  };

  const removeOption = (path: string[]) => {
    if (path.length === 1) {
      setFormData(prev => ({
        ...prev,
        options: {
          ...prev.options,
          choices: (prev.options.choices || []).filter((_, index) => index !== parseInt(path[0]))
        }
      }));
    } else {
      // Remove nested option logic would go here
    }
  };

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
      category: "general",
      type: "text",
      options: null
    });
    setEditingPhrase(null);
    setActiveTab('create');
  };

  const handleEdit = (phrase: SmartPhrase) => {
    setFormData({
      trigger: phrase.trigger,
      content: phrase.content,
      description: phrase.description || "",
      category: phrase.category || "general",
      type: (phrase.type as any) || "text",
      options: phrase.options || null
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
        category: "general",
        type: "text",
        options: null
      });

      toast({
        title: "✓ Smart Phrase Saved",
        description: `Smart phrase "${formData.trigger}" has been ${editingPhrase ? 'updated' : 'created'} successfully`,
        duration: 3000,
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

              {/* Smart Phrase Type Selector */}
              <div className="space-y-2">
                <Label htmlFor="type">Smart Phrase Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: "text" | "multipicker" | "nested_multipicker" | "date") => {
                    setFormData(prev => ({ 
                      ...prev, 
                      type: value,
                      options: value === 'text' ? null : prev.options || { choices: [] }
                    }));
                  }}
                >
                  <SelectTrigger data-testid="select-phrase-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">
                      <div className="flex items-center">
                        <Zap size={16} className="mr-2" />
                        Plain Text
                      </div>
                    </SelectItem>
                    <SelectItem value="multipicker">
                      <div className="flex items-center">
                        <MousePointer size={16} className="mr-2" />
                        Multiple Choice
                      </div>
                    </SelectItem>
                    <SelectItem value="nested_multipicker">
                      <div className="flex items-center">
                        <ChevronRight size={16} className="mr-2" />
                        Nested Choices
                      </div>
                    </SelectItem>
                    <SelectItem value="date">
                      <div className="flex items-center">
                        <Calendar size={16} className="mr-2" />
                        Date Picker
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {formData.type === 'text' && "Simple text replacement"}
                  {formData.type === 'multipicker' && "Users select from predefined options"}
                  {formData.type === 'nested_multipicker' && "Users navigate through hierarchical choices"}
                  {formData.type === 'date' && "Users select dates from a calendar"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content Template</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder={
                    formData.type === 'text' ? "The text that will be inserted when this phrase is triggered..." :
                    formData.type === 'multipicker' ? "Use {option} as placeholder for selected choice. Example: Patient denies {option}." :
                    formData.type === 'nested_multipicker' ? "Use {option1}, {option2} etc. for nested selections. Example: {option1} admission to {option2}." :
                    "Use {date} as placeholder for selected date. Example: Follow-up scheduled for {date}."
                  }
                  className="min-h-32"
                  required
                  data-testid="textarea-content"
                />
                <p className="text-xs text-gray-500">
                  {formData.type === 'multipicker' && "Use {option} where the selected choice should appear"}
                  {formData.type === 'nested_multipicker' && "Use {option1}, {option2} etc. for each level of selection"}
                  {formData.type === 'date' && "Use {date} where the selected date should appear"}
                </p>
              </div>

              {/* Options Builder for Multipicker Types */}
              {(formData.type === 'multipicker' || formData.type === 'nested_multipicker') && (
                <div className="space-y-3 p-4 border border-medical-teal/20 rounded-lg bg-medical-teal/5">
                  <div className="flex items-center justify-between">
                    <Label className="text-medical-teal font-semibold">Configure Options</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addOption()}
                      className="text-medical-teal border-medical-teal hover:bg-medical-teal hover:text-white"
                      data-testid="button-add-option"
                    >
                      <Plus size={16} className="mr-1" />
                      Add Option
                    </Button>
                  </div>
                  
                  {formData.options?.choices?.map((option: MultipickerOption, index: number) => (
                    <div key={index} className="space-y-2 p-3 border border-gray-200 rounded bg-white">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Label (shown to user)</Label>
                          <Input
                            value={option.label}
                            onChange={(e) => updateOption([index.toString()], 'label', e.target.value)}
                            placeholder="e.g. Shortness of breath"
                            className="h-8"
                            data-testid={`input-option-label-${index}`}
                          />
                        </div>
                        <div className="flex items-end space-x-2">
                          <div className="flex-1">
                            <Label className="text-xs">Value (used in text)</Label>
                            <Input
                              value={option.value}
                              onChange={(e) => updateOption([index.toString()], 'value', e.target.value)}
                              placeholder="e.g. dyspnea"
                              className="h-8"
                              data-testid={`input-option-value-${index}`}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOption([index.toString()])}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            data-testid={`button-remove-option-${index}`}
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      </div>
                      
                      {formData.type === 'nested_multipicker' && (
                        <div className="ml-4 pl-4 border-l-2 border-gray-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs text-gray-600">Sub-options</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addOption([option.value])}
                              className="h-6 text-xs"
                              data-testid={`button-add-suboption-${index}`}
                            >
                              <Plus size={12} className="mr-1" />
                              Add Sub-option
                            </Button>
                          </div>
                          
                          {option.children?.map((childOption: MultipickerOption, childIndex: number) => (
                            <div key={childIndex} className="grid grid-cols-2 gap-2">
                              <Input
                                value={childOption.label}
                                onChange={(e) => updateOption([option.value, childIndex.toString()], 'label', e.target.value)}
                                placeholder="Sub-option label"
                                className="h-7 text-sm"
                                data-testid={`input-suboption-label-${index}-${childIndex}`}
                              />
                              <div className="flex items-center space-x-2">
                                <Input
                                  value={childOption.value}
                                  onChange={(e) => updateOption([option.value, childIndex.toString()], 'value', e.target.value)}
                                  placeholder="Sub-option value"
                                  className="h-7 text-sm"
                                  data-testid={`input-suboption-value-${index}-${childIndex}`}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {/* Remove suboption logic */}}
                                  className="h-7 w-7 p-0 text-red-600"
                                  data-testid={`button-remove-suboption-${index}-${childIndex}`}
                                >
                                  <X size={12} />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {(!formData.options?.choices || formData.options.choices.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <MousePointer size={24} className="mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">Click "Add Option" to create choices for this smart phrase</p>
                    </div>
                  )}
                </div>
              )}

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
                      <div className="flex items-center space-x-2">
                        <CardTitle className="text-lg font-semibold">
                          <span className="text-medical-teal">/{phrase.trigger}</span>
                        </CardTitle>
                        {/* Type indicator */}
                        {phrase.type === 'multipicker' && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            <MousePointer size={10} className="mr-1" />
                            Multi-choice
                          </Badge>
                        )}
                        {phrase.type === 'nested_multipicker' && (
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                            <ChevronRight size={10} className="mr-1" />
                            Nested
                          </Badge>
                        )}
                        {phrase.type === 'date' && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            <Calendar size={10} className="mr-1" />
                            Date
                          </Badge>
                        )}
                        {(!phrase.type || phrase.type === 'text') && (
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