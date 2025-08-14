import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useNoteTemplates } from "../hooks/use-notes";
import { 
  Plus, 
  Settings, 
  GripVertical, 
  X, 
  Save,
  Edit3
} from "lucide-react";
import type { NoteTemplate } from "@shared/schema";

interface TemplateBuilderDialogProps {
  template?: NoteTemplate;
  onClose?: () => void;
}

interface TemplateSection {
  id: string;
  name: string;
  type: "text" | "checkbox" | "dropdown";
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export function TemplateBuilderDialog({ template, onClose }: TemplateBuilderDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: template?.name || "",
    type: template?.type || "custom",
    description: ""
  });
  
  const [sections, setSections] = useState<TemplateSection[]>(
    (template?.sections as TemplateSection[]) || [
      { id: "1", name: "Chief Complaint", type: "text" as const, required: true },
      { id: "2", name: "History of Present Illness", type: "text" as const, required: true },
      { id: "3", name: "Assessment", type: "text" as const, required: false }
    ]
  );

  const { createTemplate, updateTemplate, isCreating } = useNoteTemplates();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const templateData = {
        ...formData,
        sections: sections,
        isDefault: false
      };

      if (template) {
        await updateTemplate({ id: template.id, ...templateData });
      } else {
        await createTemplate(templateData);
      }
      
      setOpen(false);
      onClose?.();
    } catch (error) {
      console.error("Error saving template:", error);
    }
  };

  const addSection = () => {
    const newSection: TemplateSection = {
      id: Date.now().toString(),
      name: "",
      type: "text",
      required: false
    };
    setSections([...sections, newSection]);
  };

  const updateSection = (id: string, updates: Partial<TemplateSection>) => {
    setSections(sections.map(section => 
      section.id === id ? { ...section, ...updates } : section
    ));
  };

  const removeSection = (id: string) => {
    setSections(sections.filter(section => section.id !== id));
  };

  const moveSection = (id: string, direction: "up" | "down") => {
    const index = sections.findIndex(s => s.id === id);
    if (index === -1) return;
    
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;
    
    const newSections = [...sections];
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    setSections(newSections);
  };

  const templateTypes = [
    "custom",
    "admission", 
    "progress-note",
    "consult",
    "discharge",
    "procedure"
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-xs hover:bg-professional-blue hover:text-white"
          data-testid="button-template-builder"
        >
          <Settings size={12} className="mr-2" />
          {template ? "Edit Template" : "Template Builder"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit3 className="text-medical-teal" size={20} />
            <span>{template ? "Edit Template" : "Create Custom Template"}</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Cardiology Consult"
                required
                data-testid="input-template-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Template Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger data-testid="select-template-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templateTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Template Sections */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Template Sections</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addSection}
                data-testid="button-add-section"
              >
                <Plus size={14} className="mr-1" />
                Add Section
              </Button>
            </div>

            <div className="space-y-3">
              {sections.map((section, index) => (
                <Card key={section.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex flex-col space-y-1 mt-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => moveSection(section.id, "up")}
                          disabled={index === 0}
                          className="h-6 w-6 p-0"
                        >
                          <GripVertical size={12} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSection(section.id)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          data-testid={`button-remove-section-${section.id}`}
                        >
                          <X size={12} />
                        </Button>
                      </div>

                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Section Name</Label>
                          <Input
                            value={section.name}
                            onChange={(e) => updateSection(section.id, { name: e.target.value })}
                            placeholder="Section name"
                            className="text-sm"
                            data-testid={`input-section-name-${section.id}`}
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Input Type</Label>
                          <Select 
                            value={section.type} 
                            onValueChange={(value: "text" | "checkbox" | "dropdown") => 
                              updateSection(section.id, { type: value })
                            }
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text Area</SelectItem>
                              <SelectItem value="checkbox">Checkbox List</SelectItem>
                              <SelectItem value="dropdown">Dropdown</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Options</Label>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={section.required ? "default" : "secondary"}
                              className="cursor-pointer text-xs"
                              onClick={() => updateSection(section.id, { required: !section.required })}
                            >
                              {section.required ? "Required" : "Optional"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {section.type !== "text" && (
                      <div className="mt-3 pl-12">
                        <Label className="text-xs">Options (comma-separated)</Label>
                        <Input
                          value={(section.options || []).join(", ")}
                          onChange={(e) => updateSection(section.id, { 
                            options: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                          })}
                          placeholder="Option 1, Option 2, Option 3"
                          className="text-sm mt-1"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isCreating}
              className="bg-medical-teal hover:bg-medical-teal/90"
              data-testid="button-save-template"
            >
              <Save size={14} className="mr-1" />
              {isCreating ? "Saving..." : template ? "Update Template" : "Create Template"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}