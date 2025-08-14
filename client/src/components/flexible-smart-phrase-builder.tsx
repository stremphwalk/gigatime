import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Calendar, MousePointer, ChevronRight, Zap, ArrowUp, ArrowDown } from "lucide-react";

interface InteractiveElement {
  id: string;
  type: "multipicker" | "nested_multipicker" | "date";
  label: string;
  placeholder: string;
  options?: Array<{
    id: string;
    label: string;
    value: string;
    children?: Array<{ id: string; label: string; value: string; }>
  }>;
}

interface FlexibleSmartPhraseBuilderProps {
  initialData?: {
    trigger: string;
    content: string;
    description: string;
    category: string;
    elements: InteractiveElement[];
  };
  onSave: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function FlexibleSmartPhraseBuilder({ 
  initialData, 
  onSave, 
  onCancel, 
  isLoading = false 
}: FlexibleSmartPhraseBuilderProps) {
  const [formData, setFormData] = useState({
    trigger: initialData?.trigger || "",
    content: initialData?.content || "",
    description: initialData?.description || "",
    category: initialData?.category || "general",
    elements: initialData?.elements || [] as InteractiveElement[]
  });

  const categories = [
    "general", "cardiology", "respiratory", "neurology", 
    "gastroenterology", "orthopedics", "emergency", "surgery"
  ];

  const addElement = (type: InteractiveElement['type']) => {
    const elementId = `element_${Date.now()}`;
    const placeholder = `{{${elementId}}}`;
    const newElement: InteractiveElement = {
      id: elementId,
      type,
      label: type === 'date' ? 'Date' : type === 'multipicker' ? 'Selection' : 'Nested Selection',
      placeholder,
      ...(type !== 'date' && { options: [] })
    };

    // Insert placeholder at cursor position in content
    const contentTextarea = document.getElementById('content') as HTMLTextAreaElement;
    if (contentTextarea) {
      const start = contentTextarea.selectionStart;
      const end = contentTextarea.selectionEnd;
      const currentContent = formData.content;
      const newContent = currentContent.substring(0, start) + placeholder + currentContent.substring(end);
      
      setFormData(prev => ({
        ...prev,
        content: newContent,
        elements: [...prev.elements, newElement]
      }));

      // Move cursor after the inserted placeholder and focus
      setTimeout(() => {
        contentTextarea.focus();
        contentTextarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
      }, 10);
    } else {
      // Fallback: append to end if we can't find cursor position
      setFormData(prev => ({
        ...prev,
        content: prev.content + ` ${placeholder}`,
        elements: [...prev.elements, newElement]
      }));
    }
  };

  const updateElement = (elementId: string, updates: Partial<InteractiveElement>) => {
    setFormData(prev => ({
      ...prev,
      elements: prev.elements.map(el => 
        el.id === elementId ? { ...el, ...updates } : el
      )
    }));
  };

  const removeElement = (elementId: string) => {
    setFormData(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== elementId),
      content: prev.content.replace(new RegExp(`\\{\\{${elementId}\\}\\}`, 'g'), '')
    }));
  };

  const moveElement = (elementId: string, direction: 'up' | 'down') => {
    setFormData(prev => {
      const elements = [...prev.elements];
      const index = elements.findIndex(el => el.id === elementId);
      if (index === -1) return prev;

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= elements.length) return prev;

      [elements[index], elements[newIndex]] = [elements[newIndex], elements[index]];
      return { ...prev, elements };
    });
  };

  const addOption = (elementId: string, parentPath?: string[]) => {
    const newOption = {
      id: `opt_${Date.now()}`,
      label: "",
      value: "",
      ...(parentPath && { children: [] })
    };

    setFormData(prev => ({
      ...prev,
      elements: prev.elements.map(el => {
        if (el.id !== elementId) return el;
        
        if (!parentPath) {
          return {
            ...el,
            options: [...(el.options || []), newOption]
          };
        }
        
        // Handle nested options
        const updateNested = (options: any[]): any[] => {
          return options.map(opt => {
            if (opt.id === parentPath[0]) {
              return {
                ...opt,
                children: [...(opt.children || []), newOption]
              };
            }
            return opt;
          });
        };
        
        return {
          ...el,
          options: updateNested(el.options || [])
        };
      })
    }));
  };

  const updateOption = (elementId: string, optionId: string, field: 'label' | 'value', value: string, parentId?: string) => {
    setFormData(prev => ({
      ...prev,
      elements: prev.elements.map(el => {
        if (el.id !== elementId) return el;
        
        const updateOptions = (options: any[]): any[] => {
          return options.map(opt => {
            if (!parentId && opt.id === optionId) {
              return { ...opt, [field]: value };
            }
            if (parentId && opt.id === parentId && opt.children) {
              return {
                ...opt,
                children: opt.children.map((child: any) =>
                  child.id === optionId ? { ...child, [field]: value } : child
                )
              };
            }
            return opt;
          });
        };
        
        return {
          ...el,
          options: updateOptions(el.options || [])
        };
      })
    }));
  };

  const removeOption = (elementId: string, optionId: string, parentId?: string) => {
    setFormData(prev => ({
      ...prev,
      elements: prev.elements.map(el => {
        if (el.id !== elementId) return el;
        
        if (!parentId) {
          return {
            ...el,
            options: (el.options || []).filter(opt => opt.id !== optionId)
          };
        }
        
        return {
          ...el,
          options: (el.options || []).map(opt =>
            opt.id === parentId
              ? { ...opt, children: (opt.children || []).filter((child: any) => child.id !== optionId) }
              : opt
          )
        };
      })
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const insertPlaceholder = (placeholder: string) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content + ` ${placeholder}`
    }));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-6 border-b bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Flexible Smart Phrase Builder</h2>
            <p className="text-gray-600">Create phrases with mixed text and interactive elements</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Phrase"}
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="trigger">Trigger (without /)</Label>
                <Input
                  id="trigger"
                  value={formData.trigger}
                  onChange={(e) => setFormData(prev => ({ ...prev, trigger: e.target.value }))}
                  placeholder="e.g., admit, discharge, progress"
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this phrase"
              />
            </div>
          </CardContent>
        </Card>

        {/* Content Template */}
        <Card>
          <CardHeader>
            <CardTitle>Content Template</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="content">Content with placeholders</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Enter your text with placeholder markers for interactive elements"
              className="min-h-[120px]"
              required
            />
            <div className="mt-2 text-sm text-gray-600">
              Click "Insert Element" buttons below to add interactive elements to your text
            </div>
          </CardContent>
        </Card>

        {/* Interactive Elements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-medical-teal">
              Add Interactive Elements
            </CardTitle>
            <p className="text-sm text-gray-600">
              Place your cursor in the content above, then click to add interactive parts to your phrase
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date Picker Card */}
              <div className="p-4 border rounded-lg hover:bg-blue-50 cursor-pointer" onClick={() => addElement("date")}>
                <div className="flex items-center gap-3 mb-2">
                  <Calendar size={20} className="text-blue-600" />
                  <h3 className="font-medium">Date Picker</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Let users select dates (admission date, discharge date, etc.)
                </p>
                <Button
                  type="button"
                  size="sm"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  data-testid="button-add-date"
                >
                  Add Date Picker
                </Button>
              </div>

              {/* Simple Selection Card */}
              <div className="p-4 border rounded-lg hover:bg-green-50 cursor-pointer" onClick={() => addElement("multipicker")}>
                <div className="flex items-center gap-3 mb-2">
                  <MousePointer size={20} className="text-green-600" />
                  <h3 className="font-medium">Selection List</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Create dropdown or checkbox options (medications, symptoms, etc.)
                </p>
                <Button
                  type="button"
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-700"
                  data-testid="button-add-multipicker"
                >
                  Add Selection List
                </Button>
              </div>

              {/* Advanced Selection Card */}
              <div className="p-4 border rounded-lg hover:bg-purple-50 cursor-pointer" onClick={() => addElement("nested_multipicker")}>
                <div className="flex items-center gap-3 mb-2">
                  <ChevronRight size={20} className="text-purple-600" />
                  <h3 className="font-medium">Grouped Selection</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Create organized options with sub-categories (body systems, procedures)
                </p>
                <Button
                  type="button"
                  size="sm"
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  data-testid="button-add-nested"
                >
                  Add Grouped Selection
                </Button>
              </div>
            </div>
            {formData.elements.length === 0 ? (
              <div className="text-center py-8 text-gray-500 mt-6">
                <Zap size={48} className="mx-auto mb-2" />
                <p>No interactive elements added yet</p>
                <p className="text-sm">Click the cards above to add interactive parts to your phrase</p>
              </div>
            ) : (
              <div className="space-y-6">
                {formData.elements.map((element, index) => (
                  <Card key={element.id} className="border-2 border-dashed">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant="outline" 
                            className={
                              element.type === 'multipicker' ? "bg-blue-50 text-blue-700" :
                              element.type === 'nested_multipicker' ? "bg-purple-50 text-purple-700" :
                              "bg-green-50 text-green-700"
                            }
                          >
                            {element.type === 'multipicker' && <MousePointer size={12} className="mr-1" />}
                            {element.type === 'nested_multipicker' && <ChevronRight size={12} className="mr-1" />}
                            {element.type === 'date' && <Calendar size={12} className="mr-1" />}
                            {element.type.replace('_', ' ')}
                          </Badge>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {element.placeholder}
                          </code>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => insertPlaceholder(element.placeholder)}
                            className="text-xs"
                          >
                            Insert
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => moveElement(element.id, 'up')}
                            disabled={index === 0}
                          >
                            <ArrowUp size={12} />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => moveElement(element.id, 'down')}
                            disabled={index === formData.elements.length - 1}
                          >
                            <ArrowDown size={12} />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeElement(element.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X size={12} />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label>Element Label</Label>
                          <Input
                            value={element.label}
                            onChange={(e) => updateElement(element.id, { label: e.target.value })}
                            placeholder="Display label for this element"
                          />
                        </div>
                        <div>
                          <Label>Placeholder (appears in content)</Label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 font-mono">{`{{`}</span>
                            <Input
                              value={element.id}
                              onChange={(e) => {
                                const oldPlaceholder = element.placeholder;
                                const newPlaceholder = `{{${e.target.value}}}`;
                                updateElement(element.id, { 
                                  id: e.target.value,
                                  placeholder: newPlaceholder 
                                });
                                // Update content with new placeholder
                                setFormData(prev => ({
                                  ...prev,
                                  content: prev.content.replace(oldPlaceholder, newPlaceholder)
                                }));
                              }}
                              placeholder="element_name"
                              className="text-sm font-mono"
                            />
                            <span className="text-sm text-gray-500 font-mono">{`}}`}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">This appears as {element.placeholder} in your content</p>
                        </div>
                      </div>

                      {/* Simple Options Table */}
                      {element.type !== 'date' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-base font-medium">Options</Label>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => addOption(element.id)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Plus size={14} className="mr-1" />
                              Add Option
                            </Button>
                          </div>
                          
                          {(element.options || []).length === 0 ? (
                            <div className="text-center py-4 bg-gray-50 rounded-lg border-2 border-dashed">
                              <p className="text-gray-500">No options added yet</p>
                              <p className="text-sm text-gray-400">Click "Add Option" to get started</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {element.type === 'multipicker' ? (
                                // Simple Selection List
                                <div className="space-y-2">
                                  {(element.options || []).map((option, optIndex) => (
                                    <div key={option.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                      <div className="flex items-center gap-2 flex-1">
                                        <span className="text-sm font-medium text-gray-600 min-w-[60px]">Option {optIndex + 1}:</span>
                                        <Input
                                          value={option.label || ''}
                                          onChange={(e) => updateOption(element.id, option.id, 'label', e.target.value)}
                                          placeholder="Enter option text..."
                                          className="flex-1"
                                        />
                                      </div>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => removeOption(element.id, option.id)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <X size={16} />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                // Nested/Grouped Selection
                                <div className="space-y-4">
                                  {(element.options || []).map((option, optIndex) => (
                                    <div key={option.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                                      {/* Parent Option */}
                                      <div className="flex items-center gap-2 mb-3">
                                        <div className="flex items-center gap-2 flex-1">
                                          <span className="text-sm font-medium text-purple-600 min-w-[60px]">Group {optIndex + 1}:</span>
                                          <Input
                                            value={option.label || ''}
                                            onChange={(e) => updateOption(element.id, option.id, 'label', e.target.value)}
                                            placeholder="Enter group name..."
                                            className="flex-1 border-purple-200 focus:border-purple-400"
                                          />
                                        </div>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          onClick={() => addOption(element.id, [option.id])}
                                          className="text-purple-600 border-purple-200 hover:bg-purple-50"
                                        >
                                          <Plus size={14} className="mr-1" />
                                          Add Sub-Option
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => removeOption(element.id, option.id)}
                                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                          <X size={16} />
                                        </Button>
                                      </div>
                                      
                                      {/* Sub-options */}
                                      {option.children && option.children.length > 0 && (
                                        <div className="ml-4 space-y-2">
                                          {option.children.map((child: any, childIndex: number) => (
                                            <div key={child.id} className="flex items-center gap-2 p-2 bg-purple-50 rounded">
                                              <span className="text-xs text-purple-600 min-w-[40px]">└ {childIndex + 1}:</span>
                                              <Input
                                                value={child.label || ''}
                                                onChange={(e) => updateOption(element.id, child.id, 'label', e.target.value, option.id)}
                                                placeholder="Enter sub-option text..."
                                                className="flex-1 text-sm"
                                                size="sm"
                                              />
                                              <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => removeOption(element.id, child.id, option.id)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-100"
                                              >
                                                <X size={12} />
                                              </Button>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </form>
        </div>
      </div>
    </div>
  );
}