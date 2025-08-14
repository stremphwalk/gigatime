import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNoteTemplates } from "../hooks/use-notes";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  FileText, 
  GripVertical, 
  X, 
  Copy,
  Save,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NoteTemplate } from "@shared/schema";

interface TemplateSection {
  id: string;
  title: string;
  content: string;
  placeholder?: string;
  required?: boolean;
}

export function TemplateBuilderManager() {
  const [activeTab, setActiveTab] = useState<'library' | 'create' | 'edit'>('library');
  const [editingTemplate, setEditingTemplate] = useState<NoteTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    type: "progress",
    description: "",
    sections: [] as TemplateSection[]
  });

  const { templates, createTemplate, updateTemplate, deleteTemplate, isCreating } = useNoteTemplates();

  const templateTypes = [
    { value: "admission", label: "Admission Note" },
    { value: "progress", label: "Progress Note" },
    { value: "consult", label: "Consult Note" },
    { value: "discharge", label: "Discharge Summary" },
    { value: "procedure", label: "Procedure Note" },
    { value: "emergency", label: "Emergency Note" },
    { value: "custom", label: "Custom Template" }
  ];

  const defaultSections = {
    admission: [
      { id: "chief-complaint", title: "Chief Complaint", content: "", placeholder: "Patient's primary concern...", required: true },
      { id: "history-present-illness", title: "History of Present Illness", content: "", placeholder: "Detailed description of current illness...", required: true },
      { id: "past-medical-history", title: "Past Medical History", content: "", placeholder: "Previous medical conditions...", required: false },
      { id: "medications", title: "Medications", content: "", placeholder: "Current medications and dosages...", required: false },
      { id: "allergies", title: "Allergies", content: "", placeholder: "Known allergies and reactions...", required: true },
      { id: "social-history", title: "Social History", content: "", placeholder: "Smoking, alcohol, occupation...", required: false },
      { id: "physical-exam", title: "Physical Examination", content: "", placeholder: "Vital signs and physical findings...", required: true },
      { id: "assessment-plan", title: "Assessment & Plan", content: "", placeholder: "Clinical assessment and treatment plan...", required: true }
    ],
    progress: [
      { id: "subjective", title: "Subjective", content: "", placeholder: "Patient's reported symptoms and concerns...", required: true },
      { id: "objective", title: "Objective", content: "", placeholder: "Vital signs, physical exam findings...", required: true },
      { id: "assessment", title: "Assessment", content: "", placeholder: "Clinical interpretation...", required: true },
      { id: "plan", title: "Plan", content: "", placeholder: "Treatment plan and next steps...", required: true }
    ],
    consult: [
      { id: "reason-for-consult", title: "Reason for Consult", content: "", placeholder: "Why consultation was requested...", required: true },
      { id: "history", title: "History", content: "", placeholder: "Relevant history for consultation...", required: true },
      { id: "examination", title: "Examination", content: "", placeholder: "Focused examination findings...", required: true },
      { id: "recommendations", title: "Recommendations", content: "", placeholder: "Specific recommendations...", required: true }
    ]
  };

  const filteredTemplates = templates?.filter(template => 
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleCreateNew = () => {
    setFormData({
      name: "",
      type: "progress",
      description: "",
      sections: defaultSections.progress.map(section => ({ ...section, id: Math.random().toString(36).substring(2, 11) }))
    });
    setEditingTemplate(null);
    setActiveTab('create');
  };

  const handleEdit = (template: NoteTemplate) => {
    try {
      const parsedSections = Array.isArray(template.sections) 
        ? template.sections 
        : (typeof template.sections === 'string' ? JSON.parse(template.sections) : []);
      setFormData({
        name: template.name,
        type: template.type,
        description: template.description || "",
        sections: parsedSections
      });
      setEditingTemplate(template);
      setActiveTab('edit');
    } catch (error) {
      console.error("Error parsing template sections:", error);
      setFormData({
        name: template.name,
        type: template.type,
        description: template.description || "",
        sections: []
      });
      setEditingTemplate(template);
      setActiveTab('edit');
    }
  };

  const handleTypeChange = (newType: string) => {
    setFormData(prev => ({
      ...prev,
      type: newType,
      sections: defaultSections[newType as keyof typeof defaultSections]?.map(section => ({ 
        ...section, 
        id: Math.random().toString(36).substring(2, 11) 
      })) || []
    }));
  };

  const handleAddSection = () => {
    const newSection: TemplateSection = {
      id: Math.random().toString(36).substr(2, 9),
      title: "New Section",
      content: "",
      placeholder: "Enter content for this section...",
      required: false
    };
    setFormData(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };

  const handleUpdateSection = (sectionId: string, updates: Partial<TemplateSection>) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId ? { ...section, ...updates } : section
      )
    }));
  };

  const handleRemoveSection = (sectionId: string) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId)
    }));
  };

  const handleMoveSectionUp = (sectionId: string) => {
    setFormData(prev => {
      const sections = [...prev.sections];
      const index = sections.findIndex(s => s.id === sectionId);
      if (index > 0) {
        [sections[index], sections[index - 1]] = [sections[index - 1], sections[index]];
      }
      return { ...prev, sections };
    });
  };

  const handleMoveSectionDown = (sectionId: string) => {
    setFormData(prev => {
      const sections = [...prev.sections];
      const index = sections.findIndex(s => s.id === sectionId);
      if (index < sections.length - 1) {
        [sections[index], sections[index + 1]] = [sections[index + 1], sections[index]];
      }
      return { ...prev, sections };
    });
  };

  const handleDuplicateTemplate = async (template: NoteTemplate) => {
    try {
      const duplicatedTemplate = {
        name: `${template.name} (Copy)`,
        type: template.type,
        description: template.description,
        sections: template.sections
      };
      await createTemplate(duplicatedTemplate);
    } catch (error) {
      console.error("Error duplicating template:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const templateData = {
        ...formData,
        sections: JSON.stringify(formData.sections)
      };

      if (editingTemplate) {
        await updateTemplate({ id: editingTemplate.id, ...templateData });
      } else {
        await createTemplate(templateData);
      }
      
      setFormData({
        name: "",
        type: "progress",
        description: "",
        sections: []
      });
      
      setActiveTab('library');
      setEditingTemplate(null);
    } catch (error) {
      console.error("Error saving template:", error);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      try {
        await deleteTemplate(templateId);
      } catch (error) {
        console.error("Error deleting template:", error);
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
                {activeTab === 'create' ? 'Create Template' : 'Edit Template'}
              </h1>
              <p className="text-gray-600 mt-1">
                {activeTab === 'create' 
                  ? 'Build a custom note template with draggable sections' 
                  : 'Modify the selected template'
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
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
            {/* Template Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Template Information</CardTitle>
                <CardDescription>Basic details about your template</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Template Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="My Custom Template"
                      required
                      data-testid="input-template-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Template Type</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={handleTypeChange}
                    >
                      <SelectTrigger data-testid="select-template-type">
                        <SelectValue placeholder="Select template type" />
                      </SelectTrigger>
                      <SelectContent>
                        {templateTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe when and how to use this template..."
                    className="h-20"
                    data-testid="textarea-template-description"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Template Sections */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Template Sections</CardTitle>
                  <CardDescription>Customize the sections that will appear in your notes</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddSection}
                  data-testid="button-add-section"
                >
                  <Plus size={16} className="mr-2" />
                  Add Section
                </Button>
              </CardHeader>
              <CardContent>
                {formData.sections.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                    <p>No sections yet. Add sections to build your template.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.sections.map((section, index) => (
                      <Card key={section.id} className="relative">
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-4">
                            <div className="flex flex-col space-y-1 mt-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMoveSectionUp(section.id)}
                                disabled={index === 0}
                                data-testid={`button-move-up-${section.id}`}
                              >
                                <ArrowUp size={14} />
                              </Button>
                              <GripVertical size={16} className="text-gray-400 cursor-move" />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMoveSectionDown(section.id)}
                                disabled={index === formData.sections.length - 1}
                                data-testid={`button-move-down-${section.id}`}
                              >
                                <ArrowDown size={14} />
                              </Button>
                            </div>

                            <div className="flex-1 space-y-3">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor={`section-title-${section.id}`}>Section Title</Label>
                                  <Input
                                    id={`section-title-${section.id}`}
                                    value={section.title}
                                    onChange={(e) => handleUpdateSection(section.id, { title: e.target.value })}
                                    placeholder="Section Title"
                                    data-testid={`input-section-title-${section.id}`}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`section-placeholder-${section.id}`}>Placeholder Text</Label>
                                  <Input
                                    id={`section-placeholder-${section.id}`}
                                    value={section.placeholder || ""}
                                    onChange={(e) => handleUpdateSection(section.id, { placeholder: e.target.value })}
                                    placeholder="Enter placeholder text..."
                                    data-testid={`input-section-placeholder-${section.id}`}
                                  />
                                </div>
                              </div>

                              <div>
                                <Label htmlFor={`section-content-${section.id}`}>Default Content</Label>
                                <Textarea
                                  id={`section-content-${section.id}`}
                                  value={section.content}
                                  onChange={(e) => handleUpdateSection(section.id, { content: e.target.value })}
                                  placeholder="Default content for this section..."
                                  className="h-24"
                                  data-testid={`textarea-section-content-${section.id}`}
                                />
                              </div>

                              <div className="flex items-center justify-between">
                                <label className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={section.required || false}
                                    onChange={(e) => handleUpdateSection(section.id, { required: e.target.checked })}
                                    data-testid={`checkbox-section-required-${section.id}`}
                                  />
                                  <span className="text-sm">Required section</span>
                                </label>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveSection(section.id)}
                                  className="text-red-600 hover:text-red-700"
                                  data-testid={`button-remove-section-${section.id}`}
                                >
                                  <X size={14} className="mr-1" />
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit Buttons */}
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
                disabled={isCreating || !formData.name.trim()}
                data-testid="button-save-template"
              >
                <Save size={16} className="mr-2" />
                {isCreating ? 'Saving...' : (activeTab === 'create' ? 'Create Template' : 'Update Template')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-200 p-6 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Template Library</h1>
            <p className="text-gray-600 mt-1">Manage your note templates and create new ones</p>
          </div>
          <Button onClick={handleCreateNew} data-testid="button-create-template">
            <Plus size={16} className="mr-2" />
            Create New Template
          </Button>
        </div>

        <div className="mt-4 flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-templates"
            />
          </div>
          <Badge variant="secondary" className="text-sm">
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No templates found' : 'No templates yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery 
                ? 'Try adjusting your search terms' 
                : 'Create your first template to streamline note creation'
              }
            </p>
            {!searchQuery && (
              <Button onClick={handleCreateNew} data-testid="button-create-first-template">
                <Plus size={16} className="mr-2" />
                Create Your First Template
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => {
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
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold">
                          {template.name}
                        </CardTitle>
                        {template.description && (
                          <CardDescription className="mt-1">
                            {template.description}
                          </CardDescription>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {templateTypes.find(t => t.value === template.type)?.label || template.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{sectionsCount}</span> section{sectionsCount !== 1 ? 's' : ''}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          {new Date(template.createdAt || '').toLocaleDateString()}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDuplicateTemplate(template)}
                            title="Duplicate template"
                            data-testid={`button-duplicate-template-${template.id}`}
                          >
                            <Copy size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(template)}
                            data-testid={`button-edit-template-${template.id}`}
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(template.id)}
                            className="text-red-600 hover:text-red-700"
                            data-testid={`button-delete-template-${template.id}`}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}