import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SmartPhraseAutocomplete } from "./smart-phrase-autocomplete";
import { FlexibleSmartPhrasePicker } from "./flexible-smart-phrase-picker";
import { MedicalConditionAutocomplete } from "./medical-condition-autocomplete";
import { AllergyAutocomplete } from "./allergy-autocomplete";
import { SocialHistoryAutocomplete } from "./social-history-autocomplete";
import { MedicationAutocomplete } from "./medication-autocomplete";
import { MedicationReorderDialog } from "./medication-reorder-dialog";
import { LabValuesPopup } from "./lab-values-popup";
import { LabParsingDialog } from "./lab-parsing-dialog";
import { PhysicalExamAutocomplete } from "./physical-exam-autocomplete";
import { PertinentNegativesPopup } from "./pertinent-negatives-popup";
import { PertinentNegativePresetSelector } from "./pertinent-negative-preset-selector";
import { ImagingAutocomplete } from "./imaging-autocomplete";
import { ConsultationReasonAutocomplete } from "./consultation-reason-autocomplete";
import { ClinicalCalculatorPopup } from "./clinical-calculator-popup";
import { SectionNavigator } from "./section-navigator";
import { useNotes, useNoteTemplates } from "../hooks/use-notes";
import { useSmartPhrases } from "../hooks/use-smart-phrases";
import { useToast } from "../hooks/use-toast";
import { useImagingAutocomplete } from "../hooks/use-imaging-autocomplete";
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
  Expand,
  Beaker,
  ChevronUp,
  ChevronDown,
  X,
  UserCheck,
  Camera,
  ArrowUpDown,
  Shuffle,
  FileSearch
} from "lucide-react";
import { cn } from "@/lib/utils";
import { noteTemplates } from "../lib/note-templates";
import { COMMON_ALLERGIES, TOP_MEDICAL_ALLERGIES } from "@/lib/medical-conditions";
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
  const [activePicker, setActivePicker] = useState<{
    phrase: any;
    sectionId: string;
    position: { top: number; left: number };
  } | null>(null);
  
  const [activeMedicalAutocomplete, setActiveMedicalAutocomplete] = useState<{
    sectionId: string;
    position: { top: number; left: number };
    query: string;
    cursorPosition: number;
    wordStart: number;
  } | null>(null);
  const [activeAllergyAutocomplete, setActiveAllergyAutocomplete] = useState<{
    sectionId: string;
    position: { top: number; left: number };
    query: string;
    cursorPosition: number;
    wordStart: number;
  } | null>(null);
  const [activeSocialHistoryAutocomplete, setActiveSocialHistoryAutocomplete] = useState<{
    sectionId: string;
    position: { top: number; left: number };
    query: string;
    cursorPosition: number;
    wordStart: number;
  } | null>(null);
  const [activeConsultationReasonAutocomplete, setActiveConsultationReasonAutocomplete] = useState<{
    sectionId: string;
    position: { top: number; left: number };
    query: string;
    cursorPosition: number;
    wordStart: number;
    type: 'consultation' | 'admission';
  } | null>(null);
  const [activeMedicationAutocomplete, setActiveMedicationAutocomplete] = useState<{
    sectionId: string;
    position: { top: number; left: number };
    query: string;
    cursorPosition: number;
    wordStart: number;
  } | null>(null);
  const [showMedicationReorderDialog, setShowMedicationReorderDialog] = useState(false);
  const [medicationReorderSectionId, setMedicationReorderSectionId] = useState<string | null>(null);
  const [showLabParsingDialog, setShowLabParsingDialog] = useState(false);
  const [labParsingSectionId, setLabParsingSectionId] = useState<string | null>(null);

  const [showPertinentNegatives, setShowPertinentNegatives] = useState(false);
  const [pertinentNegativesSection, setPertinentNegativesSection] = useState<string | null>(null);
  const [activeLabValuesPopup, setActiveLabValuesPopup] = useState<string | null>(null);
  const [activePhysicalExamAutocomplete, setActivePhysicalExamAutocomplete] = useState<{
    sectionId: string;
    position: { top: number; left: number };
    query: string;
    cursorPosition: number;
    wordStart: number;
  } | null>(null);
  
  // Clinical calculator popup state
  const [showClinicalCalculator, setShowClinicalCalculator] = useState(false);
  const [calculatorTargetSection, setCalculatorTargetSection] = useState<string | null>(null);
  const [calculatorInsertPosition, setCalculatorInsertPosition] = useState<number>(0);
  
  // Section navigator state
  const [showSectionNavigator, setShowSectionNavigator] = useState(false);
  const [currentActiveSection, setCurrentActiveSection] = useState<string | null>(null);
  const [navigatorMode, setNavigatorMode] = useState<'hidden' | 'icons' | 'full'>('icons');

  const { createNote, updateNote, isCreating: isSaving } = useNotes();
  const { templates } = useNoteTemplates();
  const { phrases, searchPhrases } = useSmartPhrases();
  const { toast } = useToast();
  
  // Add imaging autocomplete functionality
  const [activeImageEditorSection, setActiveImageEditorSection] = useState<string | null>(null);
  const { handleImagingSelect, formatImagingTemplate } = useImagingAutocomplete({
    onInsert: (text: string) => {
      if (activeImageEditorSection) {
        const currentContent = noteData.content[activeImageEditorSection] || '';
        const newContent = currentContent + (currentContent ? '\n\n' : '') + text;
        
        setNoteData(prev => ({
          ...prev,
          content: {
            ...prev.content,
            [activeImageEditorSection]: newContent
          }
        }));
        
        setActiveImageEditorSection(null);
        
        toast({
          title: "Imaging template added",
          description: "Medical imaging findings and pertinent negatives have been inserted.",
        });
      }
    }
  });

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
    const dbTemplate = templates?.find(t => t.type === templateType);
    const localTemplate = noteTemplates.find(t => t.type === templateType);
    const template = dbTemplate || localTemplate;
    
    if (template) {
      setSelectedTemplate(template as NoteTemplate);
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

    // Check for calc command trigger
    const cursorPosition = textarea.selectionStart;
    const beforeCursor = content.slice(0, cursorPosition);
    
    // Check for /calc command specifically
    if (beforeCursor.endsWith('/calc')) {
      setCalculatorTargetSection(sectionId);
      setCalculatorInsertPosition(cursorPosition - 5); // Remove '/calc' when inserting
      setShowClinicalCalculator(true);
      
      // Remove the /calc text from the content
      const newContent = content.slice(0, cursorPosition - 5) + content.slice(cursorPosition);
      setNoteData(prev => ({
        ...prev,
        content: {
          ...prev.content,
          [sectionId]: newContent
        }
      }));
      
      // Reset cursor position
      setTimeout(() => {
        textarea.setSelectionRange(cursorPosition - 5, cursorPosition - 5);
      }, 10);
      
      return; // Don't process other triggers
    }

    // Check for smart phrase trigger (excluding calc)
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
      // Don't show autocomplete for /calc command
      if (query === 'calc') {
        setActiveAutocomplete(null);
      } else {
        setActiveAutocomplete(prev => prev ? { ...prev, query } : null);
      }
    } else if (activeAutocomplete && !content.includes('/')) {
      setActiveAutocomplete(null);
    }

    // Check for medical condition and allergy autocomplete
    const section = sections.find(s => s.id === sectionId);
    const isPastMedicalHistory = section?.type === 'pastMedicalHistory' || 
                                section?.name.toLowerCase().includes('past medical history') ||
                                section?.name.toLowerCase().includes('pmh');
    const isAllergiesSection = section?.type === 'allergies' || 
                               section?.name.toLowerCase().includes('allergies') ||
                               section?.name.toLowerCase().includes('allergy');
    const isSocialHistorySection = section?.type === 'socialHistory' || 
                                   section?.name.toLowerCase().includes('social history') ||
                                   section?.name.toLowerCase().includes('social hx');
    const isMedicationsSection = section?.type === 'medications' || 
                                 section?.name.toLowerCase().includes('medications') ||
                                 section?.name.toLowerCase().includes('current medications') ||
                                 section?.name.toLowerCase().includes('meds');
    
    if (isPastMedicalHistory) {
      const cursorPosition = textarea.selectionStart;
      
      // Find the current word being typed at cursor position
      const beforeCursor = content.slice(0, cursorPosition);
      const afterCursor = content.slice(cursorPosition);
      
      // Find word boundaries
      const wordStartMatch = beforeCursor.match(/\S+$/);
      const wordEndMatch = afterCursor.match(/^\S*/);
      
      if (wordStartMatch) {
        const wordStart = cursorPosition - wordStartMatch[0].length;
        const currentWord = wordStartMatch[0] + (wordEndMatch ? wordEndMatch[0] : '');
        
        if (currentWord && currentWord.length >= 2 && !currentWord.includes('/')) {
          // Calculate precise cursor position in the textarea
          const textBeforeCursor = content.slice(0, cursorPosition);
          const lines = textBeforeCursor.split('\n');
          const currentLine = lines.length - 1;
          const charInLine = lines[lines.length - 1].length;
          
          // Get textarea position and line height
          const rect = textarea.getBoundingClientRect();
          const style = window.getComputedStyle(textarea);
          const lineHeight = parseInt(style.lineHeight) || 20;
          const paddingTop = parseInt(style.paddingTop) || 8;
          const paddingLeft = parseInt(style.paddingLeft) || 12;
          
          // Approximate character width (monospace assumption)
          const charWidth = 8;
          
          setActiveMedicalAutocomplete({
            sectionId,
            position: { 
              top: rect.top + paddingTop + (currentLine * lineHeight) + lineHeight + 5,
              left: rect.left + paddingLeft + (charInLine * charWidth)
            },
            query: currentWord,
            cursorPosition,
            wordStart
          });
        } else {
          setActiveMedicalAutocomplete(null);
        }
      } else {
        setActiveMedicalAutocomplete(null);
      }
    }

    // Handle allergy autocomplete for allergies sections
    if (isAllergiesSection) {
      const cursorPosition = textarea.selectionStart;
      
      // Find the current word being typed at cursor position
      const beforeCursor = content.slice(0, cursorPosition);
      const afterCursor = content.slice(cursorPosition);
      
      // Find word boundaries
      const wordStartMatch = beforeCursor.match(/\S+$/);
      const wordEndMatch = afterCursor.match(/^\S*/);
      
      if (wordStartMatch) {
        const wordStart = cursorPosition - wordStartMatch[0].length;
        const currentWord = wordStartMatch[0] + (wordEndMatch ? wordEndMatch[0] : '');
        
        if (currentWord && currentWord.length >= 1 && !currentWord.includes('/')) {
          // Calculate precise cursor position in the textarea
          const textBeforeCursor = content.slice(0, cursorPosition);
          const lines = textBeforeCursor.split('\n');
          const currentLine = lines.length - 1;
          const charInLine = lines[lines.length - 1].length;
          
          // Get textarea position and line height
          const rect = textarea.getBoundingClientRect();
          const style = window.getComputedStyle(textarea);
          const lineHeight = parseInt(style.lineHeight) || 20;
          const paddingTop = parseInt(style.paddingTop) || 8;
          const paddingLeft = parseInt(style.paddingLeft) || 12;
          
          // Approximate character width (monospace assumption)
          const charWidth = 8;
          
          setActiveAllergyAutocomplete({
            sectionId,
            position: { 
              top: rect.top + paddingTop + (currentLine * lineHeight) + lineHeight + 5,
              left: rect.left + paddingLeft + (charInLine * charWidth)
            },
            query: currentWord,
            cursorPosition,
            wordStart
          });
        } else {
          setActiveAllergyAutocomplete(null);
        }
      } else {
        setActiveAllergyAutocomplete(null);
      }
    } else if (activeAllergyAutocomplete && activeAllergyAutocomplete.sectionId === sectionId) {
      setActiveAllergyAutocomplete(null);
    }

    // Handle social history autocomplete
    if (isSocialHistorySection) {
      const cursorPosition = textarea.selectionStart;
      
      // Find the current word being typed at cursor position
      const beforeCursor = content.slice(0, cursorPosition);
      const afterCursor = content.slice(cursorPosition);
      
      // Find word boundaries - more flexible for numbers and text
      const wordStartMatch = beforeCursor.match(/[\w\d\.]+$/);
      const wordEndMatch = afterCursor.match(/^[\w\d\.]*/);
      
      if (wordStartMatch) {
        const wordStart = cursorPosition - wordStartMatch[0].length;
        const currentWord = wordStartMatch[0] + (wordEndMatch ? wordEndMatch[0] : '');
        
        if (currentWord && currentWord.length >= 1 && !currentWord.includes('/')) {
          // Calculate precise cursor position in the textarea
          const textBeforeCursor = content.slice(0, cursorPosition);
          const lines = textBeforeCursor.split('\n');
          const currentLine = lines.length - 1;
          const charInLine = lines[lines.length - 1].length;
          
          // Get textarea position and line height
          const rect = textarea.getBoundingClientRect();
          const style = window.getComputedStyle(textarea);
          const lineHeight = parseInt(style.lineHeight) || 20;
          const paddingTop = parseInt(style.paddingTop) || 8;
          const paddingLeft = parseInt(style.paddingLeft) || 12;
          
          // Approximate character width (monospace assumption)
          const charWidth = 8;
          
          setActiveSocialHistoryAutocomplete({
            sectionId,
            position: { 
              top: rect.top + paddingTop + (currentLine * lineHeight) + lineHeight + 5,
              left: rect.left + paddingLeft + (charInLine * charWidth)
            },
            query: currentWord,
            cursorPosition,
            wordStart
          });
        } else {
          setActiveSocialHistoryAutocomplete(null);
        }
      } else {
        setActiveSocialHistoryAutocomplete(null);
      }
    } else if (activeSocialHistoryAutocomplete && activeSocialHistoryAutocomplete.sectionId === sectionId) {
      setActiveSocialHistoryAutocomplete(null);
    }

    // Handle medication autocomplete
    if (isMedicationsSection) {
      const cursorPosition = textarea.selectionStart;
      
      // Find the current word being typed at cursor position
      const beforeCursor = content.slice(0, cursorPosition);
      const afterCursor = content.slice(cursorPosition);
      
      // Find word boundaries for medication names
      const wordStartMatch = beforeCursor.match(/[A-Za-z][A-Za-z\-]*$/);
      const wordEndMatch = afterCursor.match(/^[A-Za-z\-]*/);
      
      if (wordStartMatch) {
        const wordStart = cursorPosition - wordStartMatch[0].length;
        const currentWord = wordStartMatch[0] + (wordEndMatch ? wordEndMatch[0] : '');
        
        if (currentWord && currentWord.length >= 2) {
          // Calculate precise cursor position in the textarea
          const textBeforeCursor = content.slice(0, cursorPosition);
          const lines = textBeforeCursor.split('\n');
          const currentLine = lines.length - 1;
          const charInLine = lines[lines.length - 1].length;
          
          // Get textarea position and line height
          const rect = textarea.getBoundingClientRect();
          const style = window.getComputedStyle(textarea);
          const lineHeight = parseInt(style.lineHeight) || 20;
          const paddingTop = parseInt(style.paddingTop) || 8;
          const paddingLeft = parseInt(style.paddingLeft) || 12;
          
          // Approximate character width (monospace assumption)
          const charWidth = 8;
          
          setActiveMedicationAutocomplete({
            sectionId,
            position: { 
              top: rect.top + paddingTop + (currentLine * lineHeight) + lineHeight + 5,
              left: rect.left + paddingLeft + (charInLine * charWidth)
            },
            query: currentWord,
            cursorPosition,
            wordStart
          });
        } else {
          setActiveMedicationAutocomplete(null);
        }
      } else {
        setActiveMedicationAutocomplete(null);
      }
    } else if (activeMedicationAutocomplete && activeMedicationAutocomplete.sectionId === sectionId) {
      setActiveMedicationAutocomplete(null);
    }

    // Handle physical exam autocomplete
    const isPhysicalExamSection = section?.type === 'physicalExam' || 
      section?.name.toLowerCase().includes('physical') || 
      section?.name.toLowerCase().includes('exam') ||
      section?.name.toLowerCase().includes('pe');

    if (isPhysicalExamSection) {
      const cursorPosition = textarea.selectionStart;
      
      // Find the current word being typed at cursor position
      const beforeCursor = content.slice(0, cursorPosition);
      const afterCursor = content.slice(cursorPosition);
      
      // Find word boundaries for physical exam terms (more flexible)
      const wordStartMatch = beforeCursor.match(/[A-Za-z][A-Za-z\s\-\,]*$/);
      const wordEndMatch = afterCursor.match(/^[A-Za-z\s\-\,]*/);
      
      if (wordStartMatch) {
        const wordStart = cursorPosition - wordStartMatch[0].length;
        const currentWord = wordStartMatch[0] + (wordEndMatch ? wordEndMatch[0] : '');
        
        if (currentWord && currentWord.length >= 2) {
          // Calculate precise cursor position in the textarea
          const textBeforeCursor = content.slice(0, cursorPosition);
          const lines = textBeforeCursor.split('\n');
          const currentLine = lines.length - 1;
          const charInLine = lines[lines.length - 1].length;
          
          // Get textarea position and line height
          const rect = textarea.getBoundingClientRect();
          const style = window.getComputedStyle(textarea);
          const lineHeight = parseInt(style.lineHeight) || 20;
          const paddingTop = parseInt(style.paddingTop) || 8;
          const paddingLeft = parseInt(style.paddingLeft) || 12;
          
          // Approximate character width (monospace assumption)
          const charWidth = 8;
          
          setActivePhysicalExamAutocomplete({
            sectionId,
            position: { 
              top: rect.top + paddingTop + (currentLine * lineHeight) + lineHeight + 5,
              left: rect.left + paddingLeft + (charInLine * charWidth)
            },
            query: currentWord.trim(),
            cursorPosition,
            wordStart
          });
        } else {
          setActivePhysicalExamAutocomplete(null);
        }
      } else {
        setActivePhysicalExamAutocomplete(null);
      }
    } else if (activePhysicalExamAutocomplete && activePhysicalExamAutocomplete.sectionId === sectionId) {
      setActivePhysicalExamAutocomplete(null);
    }

    // Handle consultation reason autocomplete
    const isConsultationReasonSection = section?.id === 'reason' || section?.id === 'chief' ||
      section?.name.toLowerCase().includes('reason for consultation') ||
      section?.name.toLowerCase().includes('reason for admission') ||
      section?.name.toLowerCase().includes('chief complaint');

    if (isConsultationReasonSection) {
      const cursorPosition = textarea.selectionStart;
      
      // Find the current word being typed at cursor position
      const beforeCursor = content.slice(0, cursorPosition);
      const afterCursor = content.slice(cursorPosition);
      
      // Find word boundaries for reason terms (more flexible)
      const wordStartMatch = beforeCursor.match(/[A-Za-z][A-Za-z\s\-\,]*$/);
      const wordEndMatch = afterCursor.match(/^[A-Za-z\s\-\,]*/);
      
      if (wordStartMatch) {
        const wordStart = cursorPosition - wordStartMatch[0].length;
        const currentWord = wordStartMatch[0] + (wordEndMatch ? wordEndMatch[0] : '');
        
        if (currentWord && currentWord.length >= 2) {
          // Calculate precise cursor position in the textarea
          const textBeforeCursor = content.slice(0, cursorPosition);
          const lines = textBeforeCursor.split('\n');
          const currentLine = lines.length - 1;
          const charInLine = lines[lines.length - 1].length;
          
          // Get textarea position and line height
          const rect = textarea.getBoundingClientRect();
          const style = window.getComputedStyle(textarea);
          const lineHeight = parseInt(style.lineHeight) || 20;
          const paddingTop = parseInt(style.paddingTop) || 8;
          const paddingLeft = parseInt(style.paddingLeft) || 12;
          
          // Approximate character width (monospace assumption)
          const charWidth = 8;
          
          const reasonType = section?.name.toLowerCase().includes('admission') ? 'admission' : 'consultation';
          
          setActiveConsultationReasonAutocomplete({
            sectionId,
            position: { 
              top: rect.top + paddingTop + (currentLine * lineHeight) + lineHeight + 5,
              left: rect.left + paddingLeft + (charInLine * charWidth)
            },
            query: currentWord.trim(),
            cursorPosition,
            wordStart,
            type: reasonType
          });
        } else {
          setActiveConsultationReasonAutocomplete(null);
        }
      } else {
        setActiveConsultationReasonAutocomplete(null);
      }
    } else if (activeConsultationReasonAutocomplete && activeConsultationReasonAutocomplete.sectionId === sectionId) {
      setActiveConsultationReasonAutocomplete(null);
    }
    
    // Handle imaging abbreviation detection for quick template insertion
    const isImagingSection = section?.type === 'imaging' || 
      section?.type === 'radiology' ||
      section?.name.toLowerCase().includes('imaging') ||
      section?.name.toLowerCase().includes('radiology') ||
      section?.name.toLowerCase().includes('x-ray') ||
      section?.name.toLowerCase().includes('ct') ||
      section?.name.toLowerCase().includes('mri') ||
      section?.name.toLowerCase().includes('ultrasound');
      
    if (isImagingSection) {
      const cursorPosition = textarea.selectionStart;
      const beforeCursor = content.slice(0, cursorPosition);
      const wordMatch = beforeCursor.match(/\b([A-Z]{2,})\s*$/);
      
      if (wordMatch) {
        const abbreviation = wordMatch[1];
        const template = formatImagingTemplate(abbreviation);
        
        if (template) {
          // Auto-suggest quick template insertion
          const wordStart = cursorPosition - wordMatch[0].length;
          const newContent = 
            content.slice(0, wordStart) + 
            template + 
            content.slice(cursorPosition);
          
          setNoteData(prev => ({
            ...prev,
            content: {
              ...prev.content,
              [sectionId]: newContent
            }
          }));
          
          toast({
            title: `${abbreviation} template inserted`,
            description: "Common findings and pertinent negatives added automatically.",
          });
          
          // Focus back to textarea at end of inserted content
          setTimeout(() => {
            if (textarea) {
              textarea.focus();
              const newCursorPos = wordStart + template.length;
              textarea.setSelectionRange(newCursorPos, newCursorPos);
            }
          }, 0);
        }
      }
    }
  };

  const handleSmartPhraseSelect = async (phraseOrContent: string | any) => {
    if (activeAutocomplete) {
      let finalContent: string;
      
      if (typeof phraseOrContent === 'string') {
        // Traditional text phrase
        finalContent = phraseOrContent;
      } else {
        // Advanced phrase object - need to find the phrase from our phrases data
        const phrase = phrases?.find(p => p.trigger === phraseOrContent.trigger);
        
        if (!phrase) return;
        
        if (!phrase.elements || (Array.isArray(phrase.elements) && phrase.elements.length === 0)) {
          finalContent = phrase.content;
        } else {
          // Show picker for interactive phrases
          const rect = document.querySelector(`[data-section-id="${activeAutocomplete.sectionId}"]`)?.getBoundingClientRect();
          if (rect) {
            setActivePicker({
              phrase,
              sectionId: activeAutocomplete.sectionId,
              position: { top: rect.bottom + 10, left: rect.left }
            });
          }
          setActiveAutocomplete(null);
          return;
        }
      }
      
      const currentContent = noteData.content[activeAutocomplete.sectionId] || '';
      const lastSlashIndex = currentContent.lastIndexOf('/');
      const newContent = currentContent.slice(0, lastSlashIndex) + finalContent;
      
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

  const handlePickerSelect = (result: string) => {
    if (activePicker) {
      const currentContent = noteData.content[activePicker.sectionId] || '';
      const lastSlashIndex = currentContent.lastIndexOf('/');
      const beforeSlash = lastSlashIndex >= 0 ? currentContent.slice(0, lastSlashIndex) : currentContent;
      const newContent = beforeSlash + result;
      
      setNoteData(prev => ({
        ...prev,
        content: {
          ...prev.content,
          [activePicker.sectionId]: newContent
        }
      }));
      
      setActivePicker(null);
    }
  };

  const handleMedicalConditionSelect = (condition: string, cursorPosition?: number) => {
    if (!activeMedicalAutocomplete) return;
    
    const { sectionId, wordStart } = activeMedicalAutocomplete;
    const currentContent = noteData.content[sectionId] || '';
    const actualCursorPos = cursorPosition ?? activeMedicalAutocomplete.cursorPosition;
    
    // Replace the current word with the selected condition
    const newContent = 
      currentContent.slice(0, wordStart) + 
      condition + 
      currentContent.slice(actualCursorPos);
    
    setNoteData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [sectionId]: newContent
      }
    }));
    
    setActiveMedicalAutocomplete(null);
    
    // Focus back to the textarea
    setTimeout(() => {
      const textarea = document.querySelector(`[data-section-id="${sectionId}"]`) as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        const newCursorPos = wordStart + condition.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleAllergySelect = (allergy: string) => {
    if (!activeAllergyAutocomplete) return;
    
    const { sectionId, cursorPosition, wordStart } = activeAllergyAutocomplete;
    const currentContent = noteData.content[sectionId] || '';
    
    // Replace the current word with the selected allergy
    const newContent = 
      currentContent.slice(0, wordStart) + 
      allergy + 
      currentContent.slice(cursorPosition);
    
    setNoteData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [sectionId]: newContent
      }
    }));
    
    setActiveAllergyAutocomplete(null);
    
    // Focus back to the textarea
    setTimeout(() => {
      const textarea = document.querySelector(`[data-section-id="${sectionId}"]`) as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        const newCursorPos = wordStart + allergy.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleAllergyChipSelect = (allergy: string, sectionId: string) => {
    const currentContent = noteData.content[sectionId] || '';
    const newContent = currentContent ? `${currentContent}, ${allergy}` : allergy;
    
    setNoteData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [sectionId]: newContent
      }
    }));
    
    toast({
      title: "Allergy added",
      description: `${allergy} has been added to allergies.`,
    });
  };

  const handleSocialHistorySelect = (formatted: string) => {
    if (!activeSocialHistoryAutocomplete) return;
    
    const { sectionId, cursorPosition, wordStart } = activeSocialHistoryAutocomplete;
    const currentContent = noteData.content[sectionId] || '';
    
    // Replace the current word with the formatted text
    const newContent = 
      currentContent.slice(0, wordStart) + 
      formatted + 
      currentContent.slice(cursorPosition);
    
    setNoteData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [sectionId]: newContent
      }
    }));
    
    setActiveSocialHistoryAutocomplete(null);
    
    // Focus back to the textarea
    setTimeout(() => {
      const textarea = document.querySelector(`[data-section-id="${sectionId}"]`) as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        const newCursorPos = wordStart + formatted.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleMedicationSelect = (medication: string) => {
    if (!activeMedicationAutocomplete) return;
    
    const { sectionId, cursorPosition, wordStart } = activeMedicationAutocomplete;
    const currentContent = noteData.content[sectionId] || '';
    
    // Replace the current word with the formatted medication
    const newContent = 
      currentContent.slice(0, wordStart) + 
      medication + 
      currentContent.slice(cursorPosition);
    
    setNoteData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [sectionId]: newContent
      }
    }));
    
    setActiveMedicationAutocomplete(null);
    
    // Focus back to the textarea
    setTimeout(() => {
      const textarea = document.querySelector(`[data-section-id="${sectionId}"]`) as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        const newCursorPos = wordStart + medication.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handlePhysicalExamSelect = (finding: string) => {
    if (!activePhysicalExamAutocomplete) return;
    
    const { sectionId, cursorPosition, wordStart } = activePhysicalExamAutocomplete;
    const currentContent = noteData.content[sectionId] || '';
    
    // Replace the current word with the selected finding
    const newContent = 
      currentContent.slice(0, wordStart) + 
      finding + 
      currentContent.slice(cursorPosition);
    
    setNoteData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [sectionId]: newContent
      }
    }));
    
    setActivePhysicalExamAutocomplete(null);
    
    // Focus back to the textarea
    setTimeout(() => {
      const textarea = document.querySelector(`[data-section-id="${sectionId}"]`) as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        const newCursorPos = wordStart + finding.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleConsultationReasonSelect = (reason: string) => {
    if (!activeConsultationReasonAutocomplete) return;
    
    const { sectionId, cursorPosition, wordStart } = activeConsultationReasonAutocomplete;
    const currentContent = noteData.content[sectionId] || '';
    
    // Replace the current word with the selected reason
    const newContent = 
      currentContent.slice(0, wordStart) + 
      reason + 
      currentContent.slice(cursorPosition);
    
    setNoteData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [sectionId]: newContent
      }
    }));
    
    setActiveConsultationReasonAutocomplete(null);
    
    // Focus back to the textarea
    setTimeout(() => {
      const textarea = document.querySelector(`[data-section-id="${sectionId}"]`) as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        const newCursorPos = wordStart + reason.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handlePertinentNegativesClick = (sectionId: string) => {
    setPertinentNegativesSection(sectionId);
    setShowPertinentNegatives(true);
  };

  const handlePertinentNegativesConfirm = (negativeText: string, targetSectionId?: string) => {
    const sectionId = targetSectionId || pertinentNegativesSection;
    if (sectionId && negativeText.trim()) {
      const currentContent = noteData.content[sectionId] || '';
      const newContent = currentContent + (currentContent ? '\n\n' : '') + negativeText;
      
      setNoteData(prev => ({
        ...prev,
        content: {
          ...prev.content,
          [sectionId]: newContent
        }
      }));
      
      toast({
        title: "Pertinent negatives added",
        description: "The selected pertinent negatives have been added to your note.",
      });
    }
    setShowPertinentNegatives(false);
    setPertinentNegativesSection(null);
  };

  const handlePickerCancel = () => {
    setActivePicker(null);
  };

  const handleMedicationReorder = (sectionId: string) => {
    setMedicationReorderSectionId(sectionId);
    setShowMedicationReorderDialog(true);
  };

  const handleMedicationReorderConfirm = (reorderedText: string) => {
    if (medicationReorderSectionId) {
      setNoteData(prev => ({
        ...prev,
        content: {
          ...prev.content,
          [medicationReorderSectionId]: reorderedText
        }
      }));
      
      toast({
        title: "Medications reordered",
        description: "The medication list has been reorganized successfully.",
      });
    }
    setShowMedicationReorderDialog(false);
    setMedicationReorderSectionId(null);
  };

  const handleLabParsing = (sectionId: string) => {
    setLabParsingSectionId(sectionId);
    setShowLabParsingDialog(true);
  };

  const handleLabParsingConfirm = (formattedLabs: string) => {
    if (labParsingSectionId) {
      const content = noteData.content[labParsingSectionId] || '';
      const newContent = content + (content ? '\n\n' : '') + formattedLabs;
      
      setNoteData(prev => ({
        ...prev,
        content: {
          ...prev.content,
          [labParsingSectionId]: newContent
        }
      }));
      
      toast({
        title: "Lab values parsed and added",
        description: "EHR lab results have been standardized and inserted with customizable trending data.",
      });
    }
    setShowLabParsingDialog(false);
    setLabParsingSectionId(null);
  };

  const handleCalculatorComplete = (resultText: string) => {
    if (calculatorTargetSection) {
      const currentContent = noteData.content[calculatorTargetSection] || '';
      const beforeInsert = currentContent.slice(0, calculatorInsertPosition);
      const afterInsert = currentContent.slice(calculatorInsertPosition);
      const newContent = beforeInsert + resultText + afterInsert;
      
      setNoteData(prev => ({
        ...prev,
        content: {
          ...prev.content,
          [calculatorTargetSection]: newContent
        }
      }));
      
      toast({
        title: "Calculator result inserted",
        description: "Clinical calculation has been added to your note.",
      });
    }
    
    setShowClinicalCalculator(false);
    setCalculatorTargetSection(null);
    setCalculatorInsertPosition(0);
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
    // Create the same comprehensive plain text format as copy function
    let exportText = `${noteData.title}\n`;
    exportText += `${'='.repeat(noteData.title.length)}\n\n`;
    
    // Patient information section
    if (noteData.patientName || noteData.patientMrn || noteData.patientDob) {
      exportText += `PATIENT INFORMATION:\n`;
      exportText += `-`.repeat(20) + `\n`;
      if (noteData.patientName.trim()) exportText += `Patient: ${noteData.patientName}\n`;
      if (noteData.patientMrn.trim()) exportText += `MRN: ${noteData.patientMrn}\n`;
      if (noteData.patientDob.trim()) exportText += `DOB: ${noteData.patientDob}\n`;
      exportText += `\n`;
    }

    // Note sections with content
    sections.forEach((section, index) => {
      const content = noteData.content[section.id] || '';
      if (content.trim()) {
        exportText += `${section.name.toUpperCase()}:\n`;
        exportText += `-`.repeat(section.name.length + 1) + `\n`;
        exportText += `${content.trim()}\n\n`;
      }
    });

    // Remove trailing newlines and add footer
    exportText = exportText.trim();
    exportText += `\n\n---\nGenerated from Medical Documentation System\nDate: ${new Date().toLocaleString()}`;

    try {
      const blob = new Blob([exportText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${noteData.title.replace(/\s+/g, '_').replace(/[^\w-]/g, '') || 'medical_note'}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "✓ Export Complete",
        description: `Note exported as plain text file: ${noteData.title.replace(/\s+/g, '_').replace(/[^\w-]/g, '') || 'medical_note'}.txt`,
        duration: 3000,
      });
    } catch (error) {
      console.error("Error exporting file:", error);
      toast({
        title: "Export Failed",
        description: "Unable to export file. Please try again.",
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  const handleCopy = async () => {
    // Create a comprehensive plain text format with proper structure
    let copyText = `${noteData.title}\n`;
    copyText += `${'='.repeat(noteData.title.length)}\n\n`;
    
    // Patient information section
    if (noteData.patientName || noteData.patientMrn || noteData.patientDob) {
      copyText += `PATIENT INFORMATION:\n`;
      copyText += `-`.repeat(20) + `\n`;
      if (noteData.patientName.trim()) copyText += `Patient: ${noteData.patientName}\n`;
      if (noteData.patientMrn.trim()) copyText += `MRN: ${noteData.patientMrn}\n`;
      if (noteData.patientDob.trim()) copyText += `DOB: ${noteData.patientDob}\n`;
      copyText += `\n`;
    }

    // Note sections with content
    sections.forEach((section, index) => {
      const content = noteData.content[section.id] || '';
      if (content.trim()) {
        copyText += `${section.name.toUpperCase()}:\n`;
        copyText += `-`.repeat(section.name.length + 1) + `\n`;
        copyText += `${content.trim()}\n\n`;
      }
    });

    // Remove trailing newlines and add footer
    copyText = copyText.trim();
    copyText += `\n\n---\nGenerated from Medical Documentation System\nDate: ${new Date().toLocaleString()}`;

    try {
      await navigator.clipboard.writeText(copyText);
      toast({
        title: "✓ Copied Successfully",
        description: "Note content has been copied to clipboard as plain text with section headings",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard. Please try again or check browser permissions.",
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  const moveSectionUp = (sectionId: string) => {
    const index = sections.findIndex(s => s.id === sectionId);
    if (index > 0) {
      const newSections = [...sections];
      [newSections[index], newSections[index - 1]] = [newSections[index - 1], newSections[index]];
      setSections(newSections);
    }
  };

  const moveSectionDown = (sectionId: string) => {
    const index = sections.findIndex(s => s.id === sectionId);
    if (index < sections.length - 1) {
      const newSections = [...sections];
      [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
      setSections(newSections);
    }
  };

  const removeSection = (sectionId: string) => {
    setSections(sections.filter(s => s.id !== sectionId));
    // Remove content for this section
    setNoteData(prev => {
      const newContent = { ...prev.content };
      delete newContent[sectionId];
      return { ...prev, content: newContent };
    });
  };

  const handleSectionSelect = (sectionId: string) => {
    setCurrentActiveSection(sectionId);
    // Scroll to section and focus on textarea
    setTimeout(() => {
      const sectionElement = document.querySelector(`[data-section-id="${sectionId}"]`) as HTMLTextAreaElement;
      if (sectionElement) {
        sectionElement.focus();
      }
    }, 100);
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
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div>
            <Input
              value={noteData.title}
              onChange={(e) => setNoteData(prev => ({ ...prev, title: e.target.value }))}
              className="text-lg font-medium border-none p-0 h-auto focus-visible:ring-0 bg-transparent text-gray-900 dark:text-gray-100"
              placeholder="Untitled Note"
              data-testid="input-note-title"
            />
            <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center space-x-3 mt-1">
              <span>{new Date().toLocaleDateString()}</span>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span>{selectedTemplate?.name || "No Template"}</span>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <Badge 
                variant={note?.status === "finalized" ? "default" : "secondary"}
                className="text-xs px-2 py-0.5 font-normal"
              >
                {note?.status === "finalized" ? "Finalized" : "Draft"}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-xs px-3"
            data-testid="button-save-note"
          >
            <Save size={14} className="mr-1.5" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 h-8"
            size="sm"
            onClick={handleFinalize}
            disabled={isSaving}
            data-testid="button-finalize-note"
          >
            <Check size={14} className="mr-1.5" />
            Finalize
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 px-2" data-testid="button-note-options">
            <MoreVertical size={14} />
          </Button>
        </div>
      </div>
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex gap-6">
          {/* Section Navigator */}
          <SectionNavigator
            sections={sections}
            isOpen={true}
            onToggle={() => {}} // Always open in this layout
            onSectionSelect={handleSectionSelect}
            currentSection={currentActiveSection || undefined}
            mode={navigatorMode}
            onModeChange={setNavigatorMode}
          />
          
          {/* Note Content */}
          <div className="flex-1 max-w-4xl space-y-6">
          
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
                      {/* Local templates */}
                      {noteTemplates.map((template) => (
                        <SelectItem key={`local-${template.id}`} value={template.type}>
                          {template.name}
                        </SelectItem>
                      ))}
                      {/* Database templates */}
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
            <Card key={section.id} className="section-card" data-section-id={section.id}>
              {/* Hide header for blank note template */}
              {selectedTemplate?.type !== 'blank' && (
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-text-primary flex items-center space-x-2">
                      {getSectionIcon(section.id)}
                      <span>{section.name}</span>
                      {section.required && <span className="text-medical-red text-xs">*</span>}
                    </h3>
                  <div className="flex items-center space-x-2">
                    {/* Imaging Autocomplete Button - Show for imaging or radiology sections */}
                    {(section.type === 'imaging' || 
                      section.type === 'radiology' ||
                      section.name.toLowerCase().includes('imaging') ||
                      section.name.toLowerCase().includes('radiology') ||
                      section.name.toLowerCase().includes('x-ray') ||
                      section.name.toLowerCase().includes('ct') ||
                      section.name.toLowerCase().includes('mri') ||
                      section.name.toLowerCase().includes('ultrasound')) && (
                      <ImagingAutocomplete
                        onSelect={handleImagingSelect}
                        trigger={
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setActiveImageEditorSection(section.id)}
                            className="flex items-center gap-2 text-xs"
                            data-testid={`imaging-autocomplete-button-${section.id}`}
                          >
                            <Camera size={14} />
                            Imaging Templates
                          </Button>
                        }
                      />
                    )}
                    
                    {/* Medication Reorder Buttons - Show for medication sections */}
                    {(section.type === 'medications' || 
                      section.name.toLowerCase().includes('medications') ||
                      section.name.toLowerCase().includes('current medications') ||
                      section.name.toLowerCase().includes('meds')) && (
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleMedicationReorder(section.id)}
                          className="flex items-center gap-1 text-xs px-2"
                          data-testid={`manual-reorder-button-${section.id}`}
                          title="Click medications in order to rearrange"
                        >
                          <ArrowUpDown size={12} />
                          Reorder
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setMedicationReorderSectionId(section.id);
                            // Directly trigger smart reorder
                            const currentContent = noteData.content[section.id] || '';
                            if (currentContent.trim()) {
                              import('@/lib/medication-ordering').then(({ parseMedicationsFromText, smartReorderMedications, medicationsToText }) => {
                                const parsed = parseMedicationsFromText(currentContent);
                                const smartOrdered = smartReorderMedications(parsed);
                                const reorderedText = medicationsToText(smartOrdered);
                                
                                setNoteData(prev => ({
                                  ...prev,
                                  content: {
                                    ...prev.content,
                                    [section.id]: reorderedText
                                  }
                                }));
                                
                                toast({
                                  title: "Smart reorder applied",
                                  description: "Medications ordered by therapeutic category (anticoagulants, antiplatelets, cardiac, diabetes, etc.)",
                                });
                              });
                            }
                          }}
                          className="flex items-center gap-1 text-xs px-2"
                          data-testid={`smart-reorder-button-${section.id}`}
                          title="Automatically order by therapeutic category"
                        >
                          <Shuffle size={12} />
                          Smart
                        </Button>
                      </div>
                    )}
                    
                    {/* Lab Values Buttons - Show for lab sections in header */}
                    {(section.type === 'labs' || 
                      section.name.toLowerCase().includes('lab') ||
                      section.name.toLowerCase().includes('laboratory')) && (
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleLabParsing(section.id)}
                          className="flex items-center gap-1 text-xs px-2"
                          data-testid={`lab-smart-parser-button-${section.id}`}
                          title="Parse and standardize EHR lab results with customizable trending"
                        >
                          <FileSearch size={12} />
                          Smart Parser
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setActiveLabValuesPopup(section.id)}
                          className="flex items-center gap-1 text-xs px-2"
                          data-testid={`lab-entry-button-${section.id}`}
                          title="Manual lab value entry with trending"
                        >
                          <Beaker size={12} />
                          Manual Entry
                        </Button>
                      </div>
                    )}
                    {(section.type === 'historyOfPresentIllness' || 
                      section.name.toLowerCase().includes('history of present illness') ||
                      section.name.toLowerCase().includes('hpi')) && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePertinentNegativesClick(section.id)}
                          className="text-xs text-professional-blue hover:underline"
                          data-testid={`button-pertinent-negatives-${section.id}`}
                        >
                          <UserCheck size={12} className="mr-1" />
                          Pertinent Negatives
                        </Button>
                        <PertinentNegativePresetSelector 
                          onSelectPreset={(negativeText) => handlePertinentNegativesConfirm(negativeText, section.id)}
                        />
                      </div>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs text-gray-500 hover:text-gray-700"
                      onClick={() => moveSectionUp(section.id)}
                      disabled={sections.findIndex(s => s.id === section.id) === 0}
                      data-testid={`button-move-section-up-${section.id}`}
                    >
                      <ChevronUp size={12} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs text-gray-500 hover:text-gray-700"
                      onClick={() => moveSectionDown(section.id)}
                      disabled={sections.findIndex(s => s.id === section.id) === sections.length - 1}
                      data-testid={`button-move-section-down-${section.id}`}
                    >
                      <ChevronDown size={12} />
                    </Button>
                    {!section.required && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs text-red-500 hover:text-red-700"
                        onClick={() => removeSection(section.id)}
                        data-testid={`button-remove-section-${section.id}`}
                      >
                        <X size={12} />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-xs text-gray-500 hover:text-gray-700">
                      <Expand size={12} />
                    </Button>
                  </div>
                </div>
                
                {/* Allergy chips for allergies section */}
                {(section.type === 'allergies' || 
                  section.name.toLowerCase().includes('allergies') ||
                  section.name.toLowerCase().includes('allergy')) && (
                  <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-100">
                    <div className="text-xs text-gray-500 mr-2 mt-1">Common medications:</div>
                    {TOP_MEDICAL_ALLERGIES.map((allergy) => (
                      <Badge
                        key={allergy}
                        variant="outline"
                        className="text-xs cursor-pointer hover:bg-orange-50 hover:border-orange-300 transition-colors"
                        onClick={() => handleAllergyChipSelect(allergy, section.id)}
                        data-testid={`allergy-chip-${allergy.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                      >
                        <AlertTriangle size={10} className="mr-1 text-orange-500" />
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                )}
                </CardHeader>
              )}
              <CardContent className="p-6 mt-[9px] mb-[9px] pt-[3px] pb-[3px]">
                <div className="relative">
                  <Textarea
                    value={noteData.content[section.id] || ''}
                    onChange={(e) => handleSectionContentChange(section.id, e.target.value, e.target)}
                    placeholder={selectedTemplate?.type === 'blank' 
                      ? "Start typing your note here... (Type '/' for smart phrases, '/calc' for clinical calculators)"
                      : `Document the ${section.name.toLowerCase()}... (Type '/' for smart phrases, '/calc' for calculators${
                      section.id === 'reason' || section.id === 'chief' ||
                      section.name.toLowerCase().includes('reason for consultation') ||
                      section.name.toLowerCase().includes('reason for admission') ||
                      section.name.toLowerCase().includes('chief complaint')
                        ? ', click dropdown for common consultation/admission reasons'
                        : section.type === 'pastMedicalHistory' || 
                          section.name.toLowerCase().includes('past medical history') || 
                          section.name.toLowerCase().includes('pmh') 
                        ? ', start typing medical conditions for autocomplete' 
                        : section.type === 'allergies' || 
                          section.name.toLowerCase().includes('allergies') ||
                          section.name.toLowerCase().includes('allergy')
                        ? ', start typing allergies for autocomplete'
                        : section.type === 'socialHistory' ||
                          section.name.toLowerCase().includes('social history') ||
                          section.name.toLowerCase().includes('social hx')
                        ? ', type numbers for pack-years/standard drinks or "nil" for negatives'
                        : section.type === 'medications' ||
                          section.name.toLowerCase().includes('medications') ||
                          section.name.toLowerCase().includes('current medications') ||
                          section.name.toLowerCase().includes('meds')
                        ? ', start typing medication names for autocomplete with dosages'
                        : section.type === 'labs' ||
                          section.name.toLowerCase().includes('lab') ||
                          section.name.toLowerCase().includes('laboratory')
                        ? ', use Lab Entry button for structured lab value entry with trending'
                        : section.type === 'physicalExam' ||
                          section.name.toLowerCase().includes('physical') ||
                          section.name.toLowerCase().includes('exam')
                        ? ', start typing for physical exam findings autocomplete'
                        : section.id === 'reason' || section.id === 'chief' ||
                          section.name.toLowerCase().includes('reason for consultation') ||
                          section.name.toLowerCase().includes('reason for admission') ||
                          section.name.toLowerCase().includes('chief complaint')
                        ? ', start typing consultation/admission reasons for autocomplete'
                        : ''
                    })`}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none min-h-[400px] mt-[24px] mb-[24px] pl-[15px] pr-[15px] pt-[15px] pb-[15px]"
                    data-testid={`textarea-${section.id}`}
                    data-section-id={section.id}
                  />
                  
                  {activeAutocomplete && activeAutocomplete.sectionId === section.id && (
                    <SmartPhraseAutocomplete
                      query={activeAutocomplete.query}
                      position={activeAutocomplete.position}
                      onSelect={handleSmartPhraseSelect}
                      onClose={() => setActiveAutocomplete(null)}
                    />
                  )}
                  
                  {activePicker && activePicker.sectionId === section.id && (
                    <FlexibleSmartPhrasePicker
                      phrase={activePicker.phrase}
                      position={activePicker.position}
                      onSelect={handlePickerSelect}
                      onCancel={handlePickerCancel}
                      autoShow={true}
                    />
                  )}
                  
                  {activeMedicalAutocomplete && activeMedicalAutocomplete.sectionId === section.id && (
                    <MedicalConditionAutocomplete
                      textareaRef={{ current: document.querySelector(`[data-section-id="${section.id}"]`) as HTMLTextAreaElement }}
                      isVisible={true}
                      query={activeMedicalAutocomplete.query}
                      position={activeMedicalAutocomplete.position}
                      cursorPosition={activeMedicalAutocomplete.cursorPosition}
                      onSelect={handleMedicalConditionSelect}
                      onClose={() => setActiveMedicalAutocomplete(null)}
                    />
                  )}
                  
                  {activeAllergyAutocomplete && activeAllergyAutocomplete.sectionId === section.id && (
                    <AllergyAutocomplete
                      query={activeAllergyAutocomplete.query}
                      position={activeAllergyAutocomplete.position}
                      onSelect={handleAllergySelect}
                      onClose={() => setActiveAllergyAutocomplete(null)}
                      sectionId={section.id}
                    />
                  )}
                  
                  {activeSocialHistoryAutocomplete && activeSocialHistoryAutocomplete.sectionId === section.id && (
                    <SocialHistoryAutocomplete
                      query={activeSocialHistoryAutocomplete.query}
                      position={activeSocialHistoryAutocomplete.position}
                      onSelect={handleSocialHistorySelect}
                      onClose={() => setActiveSocialHistoryAutocomplete(null)}
                      sectionId={section.id}
                    />
                  )}
                  
                  {activeMedicationAutocomplete && activeMedicationAutocomplete.sectionId === section.id && (
                    <MedicationAutocomplete
                      query={activeMedicationAutocomplete.query}
                      position={activeMedicationAutocomplete.position}
                      onSelect={handleMedicationSelect}
                      onClose={() => setActiveMedicationAutocomplete(null)}
                      sectionId={section.id}
                    />
                  )}

                  {activePhysicalExamAutocomplete && activePhysicalExamAutocomplete.sectionId === section.id && (
                    <PhysicalExamAutocomplete
                      query={activePhysicalExamAutocomplete.query}
                      position={activePhysicalExamAutocomplete.position}
                      onSelect={handlePhysicalExamSelect}
                      onClose={() => setActivePhysicalExamAutocomplete(null)}
                      sectionId={section.id}
                    />
                  )}

                  {activeConsultationReasonAutocomplete && activeConsultationReasonAutocomplete.sectionId === section.id && (
                    <ConsultationReasonAutocomplete
                      query={activeConsultationReasonAutocomplete.query}
                      position={activeConsultationReasonAutocomplete.position}
                      onSelect={handleConsultationReasonSelect}
                      onClose={() => setActiveConsultationReasonAutocomplete(null)}
                      type={activeConsultationReasonAutocomplete.type}
                      sectionId={section.id}
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
      {/* Pertinent Negatives Popup */}
      <PertinentNegativesPopup
        isOpen={showPertinentNegatives}
        onClose={() => {
          setShowPertinentNegatives(false);
          setPertinentNegativesSection(null);
        }}
        onConfirm={(negativeText: string) => handlePertinentNegativesConfirm(negativeText)}
      />
      {/* Lab Values Popup */}
      {activeLabValuesPopup && (
        <LabValuesPopup
          isOpen={true}
          onClose={() => setActiveLabValuesPopup(null)}
          onConfirm={(formattedLabs) => {
            if (activeLabValuesPopup && formattedLabs) {
              const content = noteData.content[activeLabValuesPopup] || '';
              const newContent = content + (content ? '\n\n' : '') + formattedLabs;
              
              setNoteData(prev => ({
                ...prev,
                content: {
                  ...prev.content,
                  [activeLabValuesPopup]: newContent
                }
              }));
              
              toast({
                title: "Lab values added",
                description: "Laboratory values have been inserted with trending data.",
              });
            }
            setActiveLabValuesPopup(null);
          }}
        />
      )}
      {/* Medication Reorder Dialog */}
      <MedicationReorderDialog
        isOpen={showMedicationReorderDialog}
        onClose={() => setShowMedicationReorderDialog(false)}
        medicationText={medicationReorderSectionId ? (noteData.content[medicationReorderSectionId] || '') : ''}
        onReorder={handleMedicationReorderConfirm}
      />
      {/* Lab Parsing Dialog */}
      <LabParsingDialog
        isOpen={showLabParsingDialog}
        onClose={() => setShowLabParsingDialog(false)}
        onConfirm={handleLabParsingConfirm}
      />
      {/* Clinical Calculator Popup */}
      <ClinicalCalculatorPopup
        isOpen={showClinicalCalculator}
        onClose={() => setShowClinicalCalculator(false)}
        onCalculationComplete={handleCalculatorComplete}
      />


    </div>
  );
}
