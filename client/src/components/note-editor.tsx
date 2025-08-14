import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SmartPhraseAutocomplete } from "@/components/smart-phrase-autocomplete";
import { useNotes, useNoteTemplates } from "@/hooks/use-notes";
import { useSmartPhrases } from "@/hooks/use-smart-phrases";
import { 
  Save, 
  Check, 
  Download, 
  Copy, 
  MoreVertical,
  Stethoscope,
  History,
  CheckSquare,
  Pill,
  AlertTriangle,
  FileText,
  Zap,
  Mic,
  Expand
} from "lucide-react";
import { cn } from "@/lib/utils";
import { noteTemplates } from "@/lib/note-templates";
import type { Note, NoteTemplate } from "@shared/schema";

interface NoteEditorProps {
  note: Note | null;
  isCreating: boolean;
  onNoteSaved: (note: Note) => void;
}

interface NoteSection {
  id: string;
  name: string;
  type: string;
  required: boolean;
  content?: string;
}

export function NoteEditor({ note, isCreating, onNoteSaved }: NoteEditorProps) {
  const [noteData, setNoteData] = useState({
    title: "",
    patientName: "",
    patientMrn: "",
    patientDob: "",
    templateType: "",
    content: {} as Record<string, string>
  });
  const [sections, setSections] = useState<NoteSection[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<NoteTemplate | null>(null);
  const [activeAutocomplete, setActiveAutocomplete] = useState<{
    sectionId: string;
    position: { top: number; left: number };
    query: string;
  } | null>(null);

  const { createNote, updateNote, isCreating: isSaving } = useNotes();
  const { templates } = useNoteTemplates();
  const { searchPhrases } = useSmartPhrases();

  // Load note data when editing existing note
  useEffect(() => {
    if (note && !isCreating) {
      setNoteData({
        title: note.title,
        patientName: note.patientName || "",
        patientMrn: note.patientMrn || "",
        patientDob: note.patientDob || "",
        templateType: note.templateType || "",
        content: (note.content as Record<string, string>) || {}
      });
      
      // Load template sections
      if (note.templateType && templates) {
        const template = templates.find(t => t.type === note.templateType);
        if (template && template.sections) {
          setSections(template.sections as NoteSection[]);
          setSelectedTemplate(template);
        }
      }
    }
  }, [note, isCreating, templates]);

  // Reset when creating new note
  useEffect(() => {
    if (isCreating) {
      setNoteData({
        title: "New Note",
        patientName: "",
        patientMrn: "",
        patientDob: "",
        templateType: "",
        content: {}
      });
      setSections([]);
      setSelectedTemplate(null);
    }
  }, [isCreating]);

  const handleTemplateChange = (templateType: string) => {
    const template = templates?.find(t => t.type === templateType) || 
                     noteTemplates.find(t => t.type === templateType);
    
    if (template) {
      setSelectedTemplate(template);
      setSections(template.sections as NoteSection[]);
      setNoteData(prev => ({
        ...prev,
        templateType,
        title: template.name
      }));
    }
  };

  const handleSectionContentChange = (sectionId: string, content: string, textarea: HTMLTextAreaElement) => {
    setNoteData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [sectionId]: content
      }
    }));

    // Check for smart phrase trigger
    if (content.endsWith('/')) {
      const rect = textarea.getBoundingClientRect();
      setActiveAutocomplete({
        sectionId,
        position: { top: rect.bottom, left: rect.left },
        query: ''
      });
    } else if (activeAutocomplete && content.includes('/')) {
      const lastSlashIndex = content.lastIndexOf('/');
      const query = content.slice(lastSlashIndex + 1);
      setActiveAutocomplete(prev => prev ? { ...prev, query } : null);
    } else if (activeAutocomplete && !content.includes('/')) {
      setActiveAutocomplete(null);
    }
  };

  const handleSmartPhraseSelect = (phrase: string) => {
    if (activeAutocomplete) {
      const currentContent = noteData.content[activeAutocomplete.sectionId] || '';
      const lastSlashIndex = currentContent.lastIndexOf('/');
      const newContent = currentContent.slice(0, lastSlashIndex) + phrase;
      
      setNoteData(prev => ({
        ...prev,
        content: {
          ...prev.content,
          [activeAutocomplete.sectionId]: newContent
        }
      }));
      
      setActiveAutocomplete(null);
    }
  };

  const handleSave = async () => {
    try {
      const notePayload = {
        title: noteData.title,
        patientName: noteData.patientName,
        patientMrn: noteData.patientMrn,
        patientDob: noteData.patientDob,
        templateType: noteData.templateType,
        templateId: selectedTemplate?.id,
        content: noteData.content,
        status: "draft" as const
      };

      let savedNote;
      if (note && !isCreating) {
        savedNote = await updateNote({ id: note.id, ...notePayload });
      } else {
        savedNote = await createNote(notePayload);
      }

      onNoteSaved(savedNote);
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  const handleFinalize = async () => {
    try {
      const notePayload = {
        title: noteData.title,
        patientName: noteData.patientName,
        patientMrn: noteData.patientMrn,
        patientDob: noteData.patientDob,
        templateType: noteData.templateType,
        templateId: selectedTemplate?.id,
        content: noteData.content,
        status: "finalized" as const
      };

      let savedNote;
      if (note && !isCreating) {
        savedNote = await updateNote({ id: note.id, ...notePayload });
      } else {
        savedNote = await createNote(notePayload);
      }

      onNoteSaved(savedNote);
    } catch (error) {
      console.error("Error finalizing note:", error);
    }
  };

  const handleExport = () => {
    let exportText = `${noteData.title}\n`;
    exportText += `Patient: ${noteData.patientName}\n`;
    exportText += `MRN: ${noteData.patientMrn}\n`;
    exportText += `DOB: ${noteData.patientDob}\n\n`;

    sections.forEach(section => {
      const content = noteData.content[section.id] || '';
      if (content.trim()) {
        exportText += `${section.name}:\n${content}\n\n`;
      }
    });

    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${noteData.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    let copyText = `${noteData.title}\n`;
    copyText += `Patient: ${noteData.patientName}\n`;
    copyText += `MRN: ${noteData.patientMrn}\n`;
    copyText += `DOB: ${noteData.patientDob}\n\n`;

    sections.forEach(section => {
      const content = noteData.content[section.id] || '';
      if (content.trim()) {
        copyText += `${section.name}:\n${content}\n\n`;
      }
    });

    try {
      await navigator.clipboard.writeText(copyText);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
    }
  };

  const getSectionIcon = (sectionId: string) => {
    switch (sectionId) {
      case 'reason':
      case 'chief':
        return <Stethoscope className="text-medical-teal" size={16} />;
      case 'hpi':
      case 'evolution':
        return <History className="text-medical-teal" size={16} />;
      case 'ros':
        return <CheckSquare className="text-medical-teal" size={16} />;
      case 'medications':
        return <Pill className="text-medical-teal" size={16} />;
      case 'allergies':
        return <AlertTriangle className="text-medical-red" size={16} />;
      default:
        return <FileText className="text-medical-teal" size={16} />;
    }
  };

  if (!isCreating && !note) {
    return (
      <div className="flex-1 flex items-center justify-center bg-clinical-white">
        <div className="text-center text-gray-500">
          <FileText size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">No Note Selected</h3>
          <p className="text-sm">Select a note from the sidebar or create a new one to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <Input
              value={noteData.title}
              onChange={(e) => setNoteData(prev => ({ ...prev, title: e.target.value }))}
              className="text-lg font-semibold border-none p-0 h-auto focus-visible:ring-0"
              placeholder="Note Title"
              data-testid="input-note-title"
            />
            <div className="text-sm text-gray-500 flex items-center space-x-4 mt-1">
              <span>{new Date().toLocaleDateString()}</span>
              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
              <span>{selectedTemplate?.name || "No Template"}</span>
              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
              <Badge variant={note?.status === "finalized" ? "default" : "secondary"}>
                {note?.status === "finalized" ? "Finalized" : "Draft"}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            data-testid="button-save-note"
          >
            <Save size={16} className="mr-2" />
            {isSaving ? "Saving..." : "Save Draft"}
          </Button>
          <Button 
            className="bg-medical-teal hover:bg-medical-teal/90 text-white"
            size="sm"
            onClick={handleFinalize}
            disabled={isSaving}
            data-testid="button-finalize-note"
          >
            <Check size={16} className="mr-2" />
            Finalize Note
          </Button>
          <Button variant="ghost" size="sm" data-testid="button-note-options">
            <MoreVertical size={16} />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Patient Information Header */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <Label className="block text-xs text-gray-500 mb-1">Patient Name</Label>
                  <Input
                    value={noteData.patientName}
                    onChange={(e) => setNoteData(prev => ({ ...prev, patientName: e.target.value }))}
                    placeholder="Enter patient name"
                    className="h-8"
                    data-testid="input-patient-name"
                  />
                </div>
                <div>
                  <Label className="block text-xs text-gray-500 mb-1">MRN</Label>
                  <Input
                    value={noteData.patientMrn}
                    onChange={(e) => setNoteData(prev => ({ ...prev, patientMrn: e.target.value }))}
                    placeholder="Medical Record Number"
                    className="h-8"
                    data-testid="input-patient-mrn"
                  />
                </div>
                <div>
                  <Label className="block text-xs text-gray-500 mb-1">DOB</Label>
                  <Input
                    type="date"
                    value={noteData.patientDob}
                    onChange={(e) => setNoteData(prev => ({ ...prev, patientDob: e.target.value }))}
                    className="h-8"
                    data-testid="input-patient-dob"
                  />
                </div>
                <div>
                  <Label className="block text-xs text-gray-500 mb-1">Template</Label>
                  <Select value={noteData.templateType} onValueChange={handleTemplateChange}>
                    <SelectTrigger className="h-8" data-testid="select-note-template">
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates?.map((template) => (
                        <SelectItem key={template.id} value={template.type}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Note Sections */}
          {sections.map((section) => (
            <Card key={section.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-text-primary flex items-center space-x-2">
                    {getSectionIcon(section.id)}
                    <span>{section.name}</span>
                    {section.required && <span className="text-medical-red text-xs">*</span>}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="text-xs text-professional-blue hover:underline">
                      <Zap size={12} className="mr-1" />
                      Smart Phrase
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs text-professional-blue hover:underline">
                      <Mic size={12} className="mr-1" />
                      Dictation
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs text-gray-500 hover:text-gray-700">
                      <Expand size={12} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="relative">
                  <Textarea
                    value={noteData.content[section.id] || ''}
                    onChange={(e) => handleSectionContentChange(section.id, e.target.value, e.target)}
                    placeholder={`Document the ${section.name.toLowerCase()}... (Type '/' for smart phrases)`}
                    className="min-h-[100px] resize-none"
                    data-testid={`textarea-${section.id}`}
                  />
                  
                  {activeAutocomplete && activeAutocomplete.sectionId === section.id && (
                    <SmartPhraseAutocomplete
                      query={activeAutocomplete.query}
                      position={activeAutocomplete.position}
                      onSelect={handleSmartPhraseSelect}
                      onClose={() => setActiveAutocomplete(null)}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" onClick={handleExport} data-testid="button-export-text">
                <Download size={16} className="mr-2" />
                Export as Text
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopy} data-testid="button-copy-clipboard">
                <Copy size={16} className="mr-2" />
                Copy to Clipboard
              </Button>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                Cancel
              </Button>
              <Button 
                className="bg-medical-teal hover:bg-medical-teal/90 text-white"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                data-testid="button-save-continue"
              >
                <Save size={16} className="mr-2" />
                {isSaving ? "Saving..." : "Save & Continue"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
