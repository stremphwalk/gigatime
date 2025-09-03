import { useEffect, useRef, useState } from "react";
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
  // Human-friendly key used in content placeholders (e.g., {{reason}})
  key?: string;
  label: string;
  placeholder: string;
  settings?: {
    displayMode?: 'chips' | 'dropdown';
    joiner?: string; // default: single space
    outputFormat?: 'leaf' | 'fullPath'; // for nested
    optional?: boolean; // default true
  };
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

  // Simple counters to generate readable keys
  const [counters] = useState({ date: 1, pick: 1, nested: 1 });
  const [newOptionText, setNewOptionText] = useState<Record<string, string>>({});
  const newOptionInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const makeUniqueKey = (base: string) => {
    let key = base || 'field';
    key = slugify(key);
    if (!key) key = 'field';
    let candidate = key;
    let idx = 1;
    const existing = new Set(formData.elements.map(e => e.key).filter(Boolean) as string[]);
    while (existing.has(candidate)) {
      candidate = `${key}-${idx++}`;
    }
    return candidate;
  };

  // Migrate legacy placeholders (e.g., {{element_12345}}) to friendly keys on initial load
  useEffect(() => {
    setFormData(prev => {
      let changed = false;
      let content = prev.content || '';
      const existingKeys = new Set(prev.elements.map(e => e.key).filter(Boolean) as string[]);
      const nextElements = prev.elements.map((el, idx) => {
        if (el.key && el.placeholder === `{{${el.key}}}`) return el;
        // derive base name from label or type
        const base = el.label ? el.label : (el.type === 'date' ? `date-${idx+1}` : el.type === 'multipicker' ? `pick-${idx+1}` : `group-${idx+1}`);
        const key = el.key ? el.key : makeUniqueKey(base);
        const oldToken = el.placeholder ? el.placeholder : `{{${el.id}}}`;
        const newToken = `{{${key}}}`;
        if (oldToken !== newToken && content.includes(oldToken)) {
          content = content.split(oldToken).join(newToken);
          changed = true;
        }
        if (!el.key || el.placeholder !== newToken) {
          changed = true;
          return { ...el, key, placeholder: newToken };
        }
        return el;
      });
      if (!changed) return prev;
      return { ...prev, content, elements: nextElements };
    });
    // run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = [
    "general", "cardiology", "respiratory", "neurology", 
    "gastroenterology", "orthopedics", "emergency", "surgery"
  ];

  const addElement = (type: InteractiveElement['type']) => {
    const elementId = `element_${Date.now()}`;
    const defaultLabel = type === 'date' ? 'Date' : type === 'multipicker' ? 'Selection' : 'Nested Selection';
    const keyBase = type === 'date' ? `date-${counters.date++}` : type === 'multipicker' ? `pick-${counters.pick++}` : `group-${counters.nested++}`;
    const key = makeUniqueKey(keyBase);
    const placeholder = `{{${key}}}`;
    const newElement: InteractiveElement = {
      id: elementId,
      type,
      key,
      label: defaultLabel,
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

  const renameElementKey = (elementId: string, newKeyRaw: string) => {
    setFormData(prev => {
      const el = prev.elements.find(e => e.id === elementId);
      if (!el) return prev;
      const oldKey = el.key || el.id;
      const newKey = makeUniqueKey(newKeyRaw);
      if (newKey === oldKey) return prev;
      const oldToken = new RegExp(`\\{\\{${oldKey}\\}\\}`, 'g');
      const newContent = prev.content.replace(oldToken, `{{${newKey}}}`);
      return {
        ...prev,
        content: newContent,
        elements: prev.elements.map(e => e.id === elementId ? { ...e, key: newKey, placeholder: `{{${newKey}}}` } : e)
      };
    });
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

  // Generic nested tree operations for arbitrary depth (nested_multipicker)
  const addChildNode = (elementId: string, parentId?: string) => {
    const newNode = { id: `opt_${Date.now()}_${Math.floor(Math.random()*1000)}`, label: '', value: '', children: [] as any[] };
    setFormData(prev => ({
      ...prev,
      elements: prev.elements.map(el => {
        if (el.id !== elementId) return el;
        const insertChild = (nodes: any[]): any[] => {
          if (!parentId) return [...nodes, newNode];
          return nodes.map(n => n.id === parentId ? { ...n, children: insertChild(n.children || []) } : { ...n, children: insertChild(n.children || []) });
        };
        return { ...el, options: insertChild(el.options || []) };
      })
    }));
  };

  const updateNodeLabel = (elementId: string, nodeId: string, label: string) => {
    setFormData(prev => ({
      ...prev,
      elements: prev.elements.map(el => {
        if (el.id !== elementId) return el;
        const update = (nodes: any[]): any[] => nodes.map(n => {
          if (n.id === nodeId) return { ...n, label, value: label };
          return { ...n, children: update(n.children || []) };
        });
        return { ...el, options: update(el.options || []) };
      })
    }));
  };

  const removeNode = (elementId: string, nodeId: string) => {
    setFormData(prev => ({
      ...prev,
      elements: prev.elements.map(el => {
        if (el.id !== elementId) return el;
        const filter = (nodes: any[]): any[] => nodes
          .filter(n => n.id !== nodeId)
          .map(n => ({ ...n, children: filter(n.children || []) }));
        return { ...el, options: filter(el.options || []) };
      })
    }));
  };

  const moveNode = (elementId: string, nodeId: string, direction: 'up'|'down') => {
    setFormData(prev => ({
      ...prev,
      elements: prev.elements.map(el => {
        if (el.id !== elementId) return el;
        const reorder = (nodes: any[]): any[] => {
          const idx = nodes.findIndex((n: any) => n.id === nodeId);
          if (idx >= 0) {
            const target = direction === 'up' ? idx - 1 : idx + 1;
            if (target >= 0 && target < nodes.length) {
              const copy = [...nodes];
              [copy[idx], copy[target]] = [copy[target], copy[idx]];
              return copy;
            }
            return nodes;
          }
          return nodes.map(n => ({ ...n, children: reorder(n.children || []) }));
        };
        return { ...el, options: reorder(el.options || []) };
      })
    }));
  };

  const renderNodeTree = (elementId: string, nodes: any[] = [], depth = 0) => (
    <div className="space-y-2">
      {nodes.map((n: any, index: number) => (
        <div key={n.id} className="pl-2 border-l">
          <div className="flex items-center gap-2">
            <Input
              value={n.label || ''}
              onChange={(e) => updateNodeLabel(elementId, n.id, e.target.value)}
              placeholder={depth === 0 ? 'Group' : 'Item'}
            />
            <Button type="button" size="sm" variant="ghost" onClick={() => moveNode(elementId, n.id, 'up')}>▲</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => moveNode(elementId, n.id, 'down')}>▼</Button>
            <Button type="button" size="sm" onClick={() => addChildNode(elementId, n.id)}>Add child</Button>
            <Button type="button" size="sm" variant="ghost" className="text-red-600" onClick={() => removeNode(elementId, n.id)}>Remove</Button>
          </div>
          {n.children && n.children.length > 0 && (
            <div className="mt-2">
              {renderNodeTree(elementId, n.children, depth + 1)}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const updateOption = (elementId: string, optionId: string, field: 'label' | 'value', value: string, parentId?: string) => {
    setFormData(prev => ({
      ...prev,
      elements: prev.elements.map(el => {
        if (el.id !== elementId) return el;
        
        const updateOptions = (options: any[]): any[] => {
          return options.map(opt => {
            if (!parentId && opt.id === optionId) {
              // When updating label, automatically set value to match label for text generation
              const update = field === 'label' ? { label: value, value: value } : { [field]: value };
              return { ...opt, ...update };
            }
            if (parentId && opt.id === parentId && opt.children) {
              return {
                ...opt,
                children: opt.children.map((child: any) => {
                  if (child.id === optionId) {
                    // When updating label, automatically set value to match label for text generation
                    const update = field === 'label' ? { label: value, value: value } : { [field]: value };
                    return { ...child, ...update };
                  }
                  return child;
                })
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

  // Reorder helpers
  const reorderOption = (elementId: string, fromIndex: number, toIndex: number) => {
    setFormData(prev => ({
      ...prev,
      elements: prev.elements.map(el => {
        if (el.id !== elementId) return el;
        const list = [...(el.options || [])];
        if (toIndex < 0 || toIndex >= list.length) return el;
        const [moved] = list.splice(fromIndex, 1);
        list.splice(toIndex, 0, moved);
        return { ...el, options: list };
      })
    }));
  };

  const reorderChild = (elementId: string, parentId: string, fromIndex: number, toIndex: number) => {
    setFormData(prev => ({
      ...prev,
      elements: prev.elements.map(el => {
        if (el.id !== elementId) return el;
        const updated = (el.options || []).map(opt => {
          if (opt.id !== parentId) return opt;
          const list = [...(opt.children || [])];
          if (toIndex < 0 || toIndex >= list.length) return opt;
          const [moved] = list.splice(fromIndex, 1);
          list.splice(toIndex, 0, moved);
          return { ...opt, children: list };
        });
        return { ...el, options: updated };
      })
    }));
  };

  const addOptionWithLabel = (elementId: string, label: string, parentId?: string) => {
    if (!label.trim()) return;
    // Avoid duplicates
    const exists = formData.elements.find(e => e.id === elementId)?.options?.some(opt => {
      if (parentId) return opt.id === parentId && (opt.children || []).some(c => c.label === label);
      return opt.label === label;
    });
    if (exists) return;
    if (parentId) {
      addOption(elementId, [parentId]);
      setFormData(prev => ({
        ...prev,
        elements: prev.elements.map(el => el.id === elementId ? {
          ...el,
          options: (el.options || []).map(opt => {
            if (opt.id !== parentId) return opt;
            const children = (opt.children || []);
            return {
              ...opt,
              children: children.map((child, i, arr) => i === arr.length - 1 ? { ...child, label, value: label } : child)
            };
          })
        } : el)
      }));
    } else {
      addOption(elementId);
      setFormData(prev => ({
        ...prev,
        elements: prev.elements.map(el => el.id === elementId ? {
          ...el,
          options: (el.options || []).map((opt, i, arr) => i === arr.length - 1 ? { ...opt, label, value: label } : opt)
        } : el)
      }));
    }
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
        <div className="max-w-6xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
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
                            {`{{${element.key || element.id}}}`}
                          </code>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => insertPlaceholder(`{{${element.key || element.id}}}`)}
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
                      <div className="rounded-md bg-blue-50/60 border border-blue-200 p-2 text-[12px] text-blue-800">
                        <strong>How it works:</strong> Click <em>Insert</em> above to place {`{{${element.key || element.id}}}`} into your content. Add options below. When typing your note, selections will replace that placeholder.
                      </div>
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
                          <Label>Key (used as {'{{key}}'} in content)</Label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 font-mono">{`{{`}</span>
                            <Input
                              value={element.key || ''}
                              onChange={(e) => renameElementKey(element.id, e.target.value)}
                              placeholder="e.g., reason, discharge-date"
                              className="text-sm font-mono"
                          />
                          <span className="text-sm text-gray-500 font-mono">{`}}`}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">This appears as {`{{${element.key || element.id}}}`} in your content</p>
                        </div>
                      </div>

                      {/* Element Settings */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <Label>Display</Label>
                          <Select value={element.settings?.displayMode || 'chips'} onValueChange={(v) => updateElement(element.id, { settings: { ...(element.settings||{}), displayMode: v as any } })}>
                            <SelectTrigger><SelectValue placeholder="chips" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="chips">Chips</SelectItem>
                              <SelectItem value="dropdown">Dropdown</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Joiner (between items)</Label>
                          <Input
                            value={element.settings?.joiner ?? ' '}
                            onChange={(e) => updateElement(element.id, { settings: { ...(element.settings||{}), joiner: e.target.value } })}
                            placeholder="e.g., space, comma, etc."
                          />
                        </div>
                        {element.type === 'nested_multipicker' && (
                          <div>
                            <Label>Output</Label>
                            <Select value={element.settings?.outputFormat || 'fullPath'} onValueChange={(v) => updateElement(element.id, { settings: { ...(element.settings||{}), outputFormat: v as any } })}>
                              <SelectTrigger><SelectValue placeholder="fullPath" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fullPath">Full path</SelectItem>
                                <SelectItem value="leaf">Leaf only</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>

                      {/* Options Editors */}
                      {element.type !== 'date' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-base font-medium">Options</Label>
                            {element.type === 'multipicker' && (
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    // Focus the inline new option input; do not create a default option row
                                    requestAnimationFrame(() => newOptionInputRefs.current[element.id]?.focus());
                                  }}
                                >
                                  Add option
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            {element.type === 'multipicker' ? (
                                // Multipicker options as editable rows + quick add presets
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <Input
                                      value={newOptionText[element.id] || ''}
                                      onChange={(e) => setNewOptionText(prev => ({ ...prev, [element.id]: e.target.value }))}
                                      placeholder="Type an option and press Enter"
                                      onKeyDown={(e: any) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          const text = (newOptionText[element.id] || '').trim();
                                          if (!text) return;
                                          addOptionWithLabel(element.id, text);
                                          setNewOptionText(prev => ({ ...prev, [element.id]: '' }));
                                        }
                                      }}
                                      ref={(el) => { newOptionInputRefs.current[element.id] = el; }}
                                    />
                                    <Button type="button" size="sm" onClick={() => {
                                      const text = (newOptionText[element.id] || '').trim();
                                      if (!text) return;
                                      addOptionWithLabel(element.id, text);
                                      setNewOptionText(prev => ({ ...prev, [element.id]: '' }));
                                    }}>Add</Button>
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {['Yes','No','N/A','Mild','Moderate','Severe'].map(preset => (
                                      <Button key={preset} type="button" size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => addOptionWithLabel(element.id, preset)}>{preset}</Button>
                                    ))}
                                  </div>
                                  <div className="space-y-2">
                                    {(element.options || []).map((option, optIndex) => (
                                      <div key={option.id} className="flex items-center gap-2">
                                        <Input
                                          value={option.label}
                                          onChange={(e) => updateOption(element.id, option.id, 'label', e.target.value)}
                                          placeholder={`Option ${optIndex + 1}`}
                                          className="flex-1"
                                        />
                                        <Button type="button" size="sm" variant="ghost" onClick={() => reorderOption(element.id, optIndex, optIndex-1)} aria-label="Move up">▲</Button>
                                        <Button type="button" size="sm" variant="ghost" onClick={() => reorderOption(element.id, optIndex, optIndex+1)} aria-label="Move down">▼</Button>
                                        <Button type="button" size="sm" variant="ghost" className="text-red-600" onClick={() => removeOption(element.id, option.id)} aria-label="Remove">×</Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                // Nested tree editor (arbitrary depth)
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <Button type="button" size="sm" onClick={() => addChildNode(element.id)}>Add root item</Button>
                                  </div>
                                  {renderNodeTree(element.id, element.options || [], 0)}
                                </div>
                              )}
                          </div>
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
            <aside className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Elements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {formData.elements.length === 0 ? (
                    <div className="text-sm text-gray-500">No elements yet. Add a Date, Selection, or Grouped selection.</div>
                  ) : (
                    formData.elements.map((el) => (
                      <div key={el.id} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px]">{el.label || (el.key || '')}</Badge>
                          <span className="text-[11px] text-gray-500">{el.type === 'date' ? 'Date' : el.type === 'multipicker' ? 'Selection' : 'Grouped'}</span>
                        </div>
                        <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={() => insertPlaceholder(`{{${el.key || el.id}}}`)}>Insert into Content</Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Live Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none text-sm text-gray-700">
                    {(() => {
                      const text = formData.content || '';
                      const parts = text.split(/(\{\{[^}]+\}\})/g);
                      return (
                        <p className="whitespace-pre-wrap break-words">
                          {parts.map((part, idx) => {
                            const m = part.match(/^\{\{([^}]+)\}\}$/);
                            if (m) {
                              const key = m[1];
                              const el = formData.elements.find(e => (e.key || e.id) === key);
                              const label = el?.label || key;
                              return <span key={idx} className="bg-amber-50 text-amber-700 px-1 py-0.5 rounded text-[11px] align-baseline">[{label}]</span>;
                            }
                            return <span key={idx}>{part}</span>;
                          })}
                        </p>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
