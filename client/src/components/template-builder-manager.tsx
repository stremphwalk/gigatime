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
import { useSmartPhrases } from "../hooks/use-smart-phrases";
import { ImportTemplateDialog } from "./import-template-dialog";
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
  ArrowDown,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NoteTemplate } from "@shared/schema";

interface TemplateSection {
  id: string;
  title: string;
  content: string;
  required?: boolean;
  sectionType?: string; // Associates with medical section types for custom tools
  smartPhrases?: string[]; // Smart phrases to auto-include in this section
}

export function TemplateBuilderManager() {
  const [activeTab, setActiveTab] = useState<'library' | 'create' | 'edit'>('library');
  const [editingTemplate, setEditingTemplate] = useState<NoteTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "progress",
    description: "",
    sections: [] as TemplateSection[]
  });

  const { templates, createTemplate, updateTemplate, deleteTemplate, isCreating, createError, updateError, isCreateError, isUpdateError } = useNoteTemplates();
  const { phrases } = useSmartPhrases();

  const templateTypes = [
    { value: "admission", label: "Admission Note" },
    { value: "progress", label: "Progress Note" },
    { value: "consult", label: "Consult Note" },
    { value: "discharge", label: "Discharge Summary" },
    { value: "procedure", label: "Procedure Note" },
    { value: "emergency", label: "Emergency Note" },
    { value: "custom", label: "Custom Template" }
  ];

  const medicalSectionTypes = [
    { value: "chief-complaint", label: "Chief Complaint", description: "Patient's primary concern" },
    { value: "history-present-illness", label: "History of Present Illness (HPI)", description: "Detailed description of current illness" },
    { value: "past-medical-history", label: "Past Medical History (PMH)", description: "Previous medical conditions and surgeries" },
    { value: "medications", label: "Medications", description: "Current medications, dosages, and allergies" },
    { value: "allergies", label: "Allergies", description: "Known allergies and adverse reactions" },
    { value: "social-history", label: "Social History", description: "Smoking, alcohol, occupation, lifestyle" },
    { value: "family-history", label: "Family History", description: "Relevant family medical history" },
    { value: "review-of-systems", label: "Review of Systems (ROS)", description: "Systematic review of body systems" },
    { value: "physical-exam", label: "Physical Examination", description: "Vital signs and physical findings" },
    { value: "assessment", label: "Assessment", description: "Clinical interpretation and diagnosis" },
    { value: "plan", label: "Plan", description: "Treatment plan and next steps" },
    { value: "assessment-plan", label: "Assessment & Plan", description: "Combined assessment and plan" },
    { value: "subjective", label: "Subjective", description: "Patient's reported symptoms (SOAP)" },
    { value: "objective", label: "Objective", description: "Observable findings (SOAP)" },
    { value: "procedures", label: "Procedures", description: "Procedures performed or planned" },
    { value: "labs", label: "Laboratory Results", description: "Lab values and interpretations" },
    { value: "imaging", label: "Imaging", description: "Radiology and imaging results" },
    { value: "discharge-instructions", label: "Discharge Instructions", description: "Patient discharge guidance" },
    { value: "follow-up", label: "Follow-up", description: "Follow-up appointments and instructions" },
    { value: "custom", label: "Custom Section", description: "User-defined section type" }
  ];

  const defaultSections = {
    admission: [
      { id: "chief-complaint", title: "Chief Complaint", content: "", required: true, sectionType: "chief-complaint", smartPhrases: [] },
      { id: "history-present-illness", title: "History of Present Illness", content: "", required: true, sectionType: "history-present-illness", smartPhrases: [] },
      { id: "past-medical-history", title: "Past Medical History", content: "", required: false, sectionType: "past-medical-history", smartPhrases: [] },
      { id: "medications", title: "Medications", content: "", required: false, sectionType: "medications", smartPhrases: [] },
      { id: "allergies", title: "Allergies", content: "", required: true, sectionType: "allergies", smartPhrases: [] },
      { id: "social-history", title: "Social History", content: "", required: false, sectionType: "social-history", smartPhrases: [] },
      { id: "physical-exam", title: "Physical Examination", content: "", required: true, sectionType: "physical-exam", smartPhrases: [] },
      { id: "assessment-plan", title: "Assessment & Plan", content: "", required: true, sectionType: "assessment-plan", smartPhrases: [] }
    ],
    progress: [
      { id: "subjective", title: "Subjective", content: "", required: true, sectionType: "subjective", smartPhrases: [] },
      { id: "objective", title: "Objective", content: "", required: true, sectionType: "objective", smartPhrases: [] },
      { id: "assessment", title: "Assessment", content: "", required: true, sectionType: "assessment", smartPhrases: [] },
      { id: "plan", title: "Plan", content: "", required: true, sectionType: "plan", smartPhrases: [] }
    ],
    consult: [
      { id: "reason-for-consult", title: "Reason for Consult", content: "", required: true, sectionType: "custom", smartPhrases: [] },
      { id: "history", title: "History", content: "", required: true, sectionType: "history-present-illness", smartPhrases: [] },
      { id: "examination", title: "Examination", content: "", required: true, sectionType: "physical-exam", smartPhrases: [] },
      { id: "recommendations", title: "Recommendations", content: "", required: true, sectionType: "plan", smartPhrases: [] }
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
      id: Math.random().toString(36).substring(2, 11),
      title: "New Section",
      content: "",
      required: false,
      sectionType: "custom",
      smartPhrases: []
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
    
    // Prevent duplicate submissions
    if (isSaving || isCreating) {
      console.log('[Template Save] Already saving, ignoring duplicate submission');
      return;
    }
    
    setSaveError(null);
    setIsSaving(true);
    
    console.log('[Template Save] Starting save operation', {
      isEditing: !!editingTemplate,
      templateId: editingTemplate?.id,
      formData: {
        name: formData.name,
        type: formData.type,
        sectionsCount: formData.sections.length
      }
    });
    
    // Create a timeout to prevent infinite saving state
    const timeoutId = setTimeout(() => {
      console.error('[Template Save] Save operation timed out after 30 seconds');
      setSaveError('Save operation timed out. Please try again.');
      setIsSaving(false);
    }, 30000);
    
    try {
      const templateData = {
        name: formData.name,
        type: formData.type,
        description: formData.description || null,
        sections: formData.sections, // Keep as array, server expects JSONB
        isDefault: false,
        isPublic: false,
        userId: null // Will be set by server
      };
      
      console.log('[Template Save] Prepared template data', {
        ...templateData,
        sections: `[${templateData.sections.length} sections]`
      });

      let result;
      if (editingTemplate) {
        console.log('[Template Save] Updating existing template', editingTemplate.id);
        result = await updateTemplate({ id: editingTemplate.id, ...templateData });
        console.log('[Template Save] Update successful', result);
      } else {
        console.log('[Template Save] Creating new template');
        result = await createTemplate(templateData);
        console.log('[Template Save] Create successful', result);
      }
      
      // Clear the timeout since operation succeeded
      clearTimeout(timeoutId);
      
      console.log('[Template Save] Resetting form state');
      setFormData({
        name: "",
        type: "progress",
        description: "",
        sections: []
      });
      
      setActiveTab('library');
      setEditingTemplate(null);
      setIsSaving(false);
      console.log('[Template Save] Save operation completed successfully');
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('[Template Save] Error during save operation:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined
      });
      setSaveError(error instanceof Error ? error.message : "Failed to save template. Please try again.");
      setIsSaving(false);
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
        <div className="border-b-2 border-medical-teal/20 p-8 bg-gradient-to-br from-medical-teal/10 via-professional-blue/5 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-medical-teal via-professional-blue to-medical-teal rounded-xl flex items-center justify-center shadow-md">
                {activeTab === 'create' ? <Plus className="text-white" size={24} /> : <Edit2 className="text-white" size={24} />}
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-medical-teal to-professional-blue bg-clip-text text-transparent">
                  {activeTab === 'create' ? 'Create Template' : 'Edit Template'}
                </h1>
                <p className="text-gray-700 font-medium mt-1">
                  {activeTab === 'create' 
                    ? 'Build a custom note template with smart phrases and medical sections' 
                    : 'Modify the selected template with enhanced features'
                  }
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setActiveTab('library')}
              className="border-medical-teal text-medical-teal hover:bg-medical-teal hover:text-white"
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
                  <CardDescription>
                    Customize the sections that will appear in your notes. Associate sections with medical types to enable specialized tools and features.
                  </CardDescription>
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
                  <div className="space-y-6">
                    {formData.sections.map((section, index) => (
                      <Card key={section.id} className="relative border-l-4 border-l-medical-teal shadow-sm hover:shadow-md transition-shadow duration-200">
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-6">
                            <div className="flex flex-col space-y-2 mt-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleMoveSectionUp(section.id)}
                                disabled={index === 0}
                                className="w-8 h-8 p-0 border-medical-teal/30 text-medical-teal hover:bg-medical-teal hover:text-white disabled:opacity-30"
                                data-testid={`button-move-up-${section.id}`}
                              >
                                <ArrowUp size={14} />
                              </Button>
                              <div className="flex justify-center">
                                <GripVertical size={16} className="text-medical-teal/60 cursor-move" />
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleMoveSectionDown(section.id)}
                                disabled={index === formData.sections.length - 1}
                                className="w-8 h-8 p-0 border-medical-teal/30 text-medical-teal hover:bg-medical-teal hover:text-white disabled:opacity-30"
                                data-testid={`button-move-down-${section.id}`}
                              >
                                <ArrowDown size={14} />
                              </Button>
                            </div>

                            <div className="flex-1 space-y-4">
                              {/* Section Header with Title and Type Badge */}
                              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-medical-teal/10 to-professional-blue/10 rounded-lg border border-medical-teal/20">
                                <div className="flex items-center space-x-3">
                                  <div className="w-3 h-3 rounded-full bg-medical-teal"></div>
                                  <h4 className="font-semibold text-gray-900">{section.title}</h4>
                                </div>
                                <Badge 
                                  variant={section.sectionType === 'custom' ? 'secondary' : 'default'} 
                                  className={cn(
                                    "text-xs font-medium",
                                    section.sectionType === 'custom' 
                                      ? 'bg-gray-100 text-gray-700' 
                                      : 'bg-medical-teal text-white'
                                  )}
                                >
                                  {medicalSectionTypes.find(t => t.value === section.sectionType)?.label || 'Custom'}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor={`section-title-${section.id}`} className="text-sm font-medium text-gray-700">
                                    Section Title
                                  </Label>
                                  <Input
                                    id={`section-title-${section.id}`}
                                    value={section.title}
                                    onChange={(e) => handleUpdateSection(section.id, { title: e.target.value })}
                                    placeholder="Section Title"
                                    className="mt-1"
                                    data-testid={`input-section-title-${section.id}`}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`section-type-${section.id}`} className="text-sm font-medium text-gray-700">
                                    Medical Section Type
                                  </Label>
                                  <Select
                                    value={section.sectionType || "custom"}
                                    onValueChange={(value) => handleUpdateSection(section.id, { sectionType: value })}
                                  >
                                    <SelectTrigger id={`section-type-${section.id}`} className="mt-1" data-testid={`select-section-type-${section.id}`}>
                                      <SelectValue placeholder="Select section type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {medicalSectionTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                          <div>
                                            <div className="font-medium">{type.label}</div>
                                            <div className="text-xs text-gray-500">{type.description}</div>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div>
                                <Label htmlFor={`section-content-${section.id}`} className="text-sm font-medium text-gray-700">
                                  Default Content
                                </Label>
                                <Textarea
                                  id={`section-content-${section.id}`}
                                  value={section.content}
                                  onChange={(e) => handleUpdateSection(section.id, { content: e.target.value })}
                                  placeholder="Default content for this section..."
                                  className="h-24 mt-1"
                                  data-testid={`textarea-section-content-${section.id}`}
                                />
                              </div>

                              {/* Smart Phrases Integration */}
                              <div>
                                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                  Auto-Include Smart Phrases
                                </Label>
                                <div className="space-y-2">
                                  <Select
                                    onValueChange={(phraseId) => {
                                      const currentPhrases = section.smartPhrases || [];
                                      if (!currentPhrases.includes(phraseId)) {
                                        handleUpdateSection(section.id, { 
                                          smartPhrases: [...currentPhrases, phraseId] 
                                        });
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="border-dashed border-medical-teal/50 text-medical-teal hover:border-medical-teal">
                                      <SelectValue placeholder="+ Add smart phrase to this section" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {phrases?.filter(phrase => !(section.smartPhrases || []).includes(phrase.id)).map((phrase) => (
                                        <SelectItem key={phrase.id} value={phrase.id}>
                                          <div className="flex items-center space-x-2">
                                            <Badge variant="outline" className="text-xs">/{phrase.trigger}</Badge>
                                            <span>{phrase.content.substring(0, 50)}...</span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  
                                  {(section.smartPhrases || []).length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {(section.smartPhrases || []).map((phraseId) => {
                                        const phrase = phrases?.find(p => p.id === phraseId);
                                        return phrase ? (
                                          <div key={phraseId} className="flex items-center space-x-1 bg-professional-blue/10 border border-professional-blue/20 rounded-md px-2 py-1">
                                            <Badge variant="outline" className="text-xs bg-white">/{phrase.trigger}</Badge>
                                            <span className="text-xs text-gray-700">{phrase.content.substring(0, 30)}...</span>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => {
                                                const updatedPhrases = (section.smartPhrases || []).filter(id => id !== phraseId);
                                                handleUpdateSection(section.id, { smartPhrases: updatedPhrases });
                                              }}
                                              className="h-4 w-4 p-0 text-gray-500 hover:text-red-600"
                                            >
                                              <X size={12} />
                                            </Button>
                                          </div>
                                        ) : null;
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                <label className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={section.required || false}
                                    onChange={(e) => handleUpdateSection(section.id, { required: e.target.checked })}
                                    className="w-4 h-4 text-medical-teal border-gray-300 rounded focus:ring-medical-teal"
                                    data-testid={`checkbox-section-required-${section.id}`}
                                  />
                                  <span className="text-sm font-medium text-gray-700">Required section</span>
                                </label>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveSection(section.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  data-testid={`button-remove-section-${section.id}`}
                                >
                                  <Trash2 size={14} className="mr-1" />
                                  Remove Section
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

            {/* Error Message */}
            {saveError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{saveError}</p>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex justify-between pt-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white rounded-lg p-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab('library')}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving || isCreating || !formData.name.trim()}
                className="bg-gradient-to-r from-medical-teal to-professional-blue hover:from-medical-teal/90 hover:to-professional-blue/90 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="button-save-template"
              >
                {(isSaving || isCreating) ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    {activeTab === 'create' ? 'Create Template' : 'Update Template'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b-2 border-medical-teal/20 p-8 bg-gradient-to-br from-professional-blue/5 via-medical-teal/5 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-professional-blue via-medical-teal to-professional-blue rounded-xl flex items-center justify-center shadow-md">
              <FileText className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-professional-blue to-medical-teal bg-clip-text text-transparent">
                Template Library
              </h1>
              <p className="text-gray-700 font-medium mt-1">Manage your note templates with smart phrases and medical sections</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setShowImportDialog(true)}
              className="border-professional-blue text-professional-blue hover:bg-professional-blue/10"
              data-testid="button-import-template"
            >
              <Download size={16} className="mr-2" />
              Import Template
            </Button>
            <Button 
              onClick={handleCreateNew} 
              className="bg-gradient-to-r from-medical-teal to-professional-blue hover:from-medical-teal/90 hover:to-professional-blue/90 text-white shadow-lg"
              data-testid="button-create-template"
            >
              <Plus size={16} className="mr-2" />
              Create New Template
            </Button>
          </div>
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
      <ImportTemplateDialog 
        open={showImportDialog} 
        onOpenChange={setShowImportDialog} 
      />
    </div>
  );
}