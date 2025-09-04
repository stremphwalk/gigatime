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
import { LabLineOverlay } from "./lab-line-overlay";
import { LabParsingDialog } from "./lab-parsing-dialog";
import { PhysicalExamAutocomplete } from "./physical-exam-autocomplete";
import { PertinentNegativesPopup } from "./pertinent-negatives-popup";
import { PertinentNegativePresetSelector } from "./pertinent-negative-preset-selector";
import { ImagingAutocomplete } from "./imaging-autocomplete";
import type { ImagingStudy } from "./imaging-autocomplete";
import { ConsultationReasonAutocomplete } from "./consultation-reason-autocomplete";
import { ClinicalCalculatorPopup } from "./clinical-calculator-popup";
import { IcuActionBar } from "./icu-action-bar";
import { VentilationSettingsPopup } from "./ventilation-settings-popup";
import { IOEntryPopup } from "./io-entry-popup";
import { MedQuickAddPopup } from "./med-quick-add-popup";
import { ImagingQuickDialog } from "./imaging-quick-dialog";
import type { ParsedLabValue } from "@/lib/lab-parsing";
import { isIcuTemplateType, mapLabNameToIcuSystem, mapImagingSummaryToIcuSystem, mapMedicationToIcuSystem, findIcuSectionId } from "@/lib/icu-routing";
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
import { formatSmartPhrase, computeElementStrings } from "@/lib/smart-phrase-format";
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
    regionStart: number;
    regionLength: number;
    regionId: string;
  } | null>(null);
  const [phraseRegions, setPhraseRegions] = useState<Array<{ id: string; sectionId: string; start: number; length: number; phrase: any; selections: Record<string, any> }>>([]);
  const [activePhraseHint, setActivePhraseHint] = useState<{
    regionId: string;
    sectionId: string;
    position: { top: number; left: number };
    elementIndex?: number;
  } | null>(null);
  const [openPhraseMenuSection, setOpenPhraseMenuSection] = useState<string | null>(null);
  const [isHoveringOverlay, setIsHoveringOverlay] = useState(false);
  const [activeLabOverlay, setActiveLabOverlay] = useState<{
    sectionId: string;
    top: number;
    left: number;
    label: string;
    count: number;
    lineStart: number;
    lineEnd: number;
    max?: number;
  } | null>(null);
  const [labSeriesBySection, setLabSeriesBySection] = useState<Record<string, Record<string, { current: string; trends: string[]; unit?: string }>>>({});
  
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
  // ICU action bar + popups state
  const [showVentPopup, setShowVentPopup] = useState(false);
  const [showIOPopup, setShowIOPopup] = useState(false);
  const [showMedQuickAdd, setShowMedQuickAdd] = useState<null | { dripsOnly?: boolean }>(null);
  const [showImagingQuick, setShowImagingQuick] = useState(false);
  const [icuLabRouting, setIcuLabRouting] = useState(false);
  
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
          title: "Imaging summary added",
          description: "Inserted concise imaging negatives summary.",
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
    const prevContent = noteData.content[sectionId] || '';
    const nextContent = content;

    if (prevContent !== nextContent) {
      const a = prevContent;
      const b = nextContent;
      let i = 0;
      const minLen = Math.min(a.length, b.length);
      while (i < minLen && a[i] === b[i]) i++;
      let j = 0;
      while (j < (minLen - i) && a[a.length - 1 - j] === b[b.length - 1 - j]) j++;
      const changeStart = i;
      const prevChangedLen = a.length - i - j;
      const nextChangedLen = b.length - i - j;
      const delta = nextChangedLen - prevChangedLen;
      const changeEndPrev = changeStart + prevChangedLen;

      setPhraseRegions(prev => {
        const updated: typeof prev = [];
        for (const r of prev) {
          if (r.sectionId !== sectionId) { updated.push(r); continue; }
          if (r.start + r.length <= changeStart) { updated.push(r); continue; }
          if (r.start >= changeEndPrev) { updated.push({ ...r, start: r.start + delta }); continue; }
          // overlap: drop linkage and close active picker if tied
          if (activePicker && activePicker.regionId === r.id) setActivePicker(null);
          // do not push r
        }
        return updated;
      });
    }
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
        if (textarea && typeof textarea.setSelectionRange === 'function') {
          textarea.setSelectionRange(cursorPosition - 5, cursorPosition - 5);
        }
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

    // If a slash command is actively being typed at the caret,
    // suppress all other autocomplete popovers for this section.
    // We detect this by checking for the nearest '/' before the cursor
    // and ensuring there is no whitespace between it and the cursor.
    {
      const lastSlashAt = beforeCursor.lastIndexOf('/');
      const isSlashCommandActive = lastSlashAt !== -1 && !beforeCursor.slice(lastSlashAt + 1).includes(' ');
      if (isSlashCommandActive) {
        if (activeMedicalAutocomplete?.sectionId === sectionId) setActiveMedicalAutocomplete(null);
        if (activeAllergyAutocomplete?.sectionId === sectionId) setActiveAllergyAutocomplete(null);
        if (activeSocialHistoryAutocomplete?.sectionId === sectionId) setActiveSocialHistoryAutocomplete(null);
        if (activeMedicationAutocomplete?.sectionId === sectionId) setActiveMedicationAutocomplete(null);
        if (activePhysicalExamAutocomplete?.sectionId === sectionId) setActivePhysicalExamAutocomplete(null);
        if (activeConsultationReasonAutocomplete?.sectionId === sectionId) setActiveConsultationReasonAutocomplete(null);
        // Do not process other autocomplete triggers while slash is active
        return;
      }
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
    const isPlanSection = section?.type === 'plan' ||
                          section?.name.toLowerCase().includes('plan') ||
                          section?.name.toLowerCase().includes('management');
    
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
    if (isMedicationsSection || isPlanSection) {
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
            title: `${abbreviation} summary inserted`,
            description: "Inserted concise imaging negatives summary.",
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
          // Live insert template at the slash and open picker
          const textarea = document.querySelector(`[data-section-id="${activeAutocomplete.sectionId}"]`) as HTMLTextAreaElement | null;
          const currentText = noteData.content[activeAutocomplete.sectionId] || '';
          const lastSlashIndex = currentText.lastIndexOf('/');
          const beforeSlash = lastSlashIndex >= 0 ? currentText.slice(0, lastSlashIndex) : currentText;
          const template = phrase.content || '';
          const newText = beforeSlash + template;

          setNoteData(prev => ({
            ...prev,
            content: {
              ...prev.content,
              [activeAutocomplete.sectionId]: newText
            }
          }));

          const rect = textarea?.getBoundingClientRect();
          const regionId = `reg_${Date.now()}_${Math.floor(Math.random()*1000)}`;
          setActivePicker({
            phrase,
            sectionId: activeAutocomplete.sectionId,
            position: rect ? { top: rect.bottom + 10, left: rect.left } : { top: 200, left: 200 },
            regionStart: beforeSlash.length,
            regionLength: template.length,
            regionId,
          });
          setPhraseRegions(prev => ([
            ...prev,
            { id: regionId, sectionId: activeAutocomplete.sectionId, start: beforeSlash.length, length: template.length, phrase, selections: {} }
          ]));
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

  const applyConditionalLeadingSpace = (sectionId: string, start: number, text: string) => {
    // Add a single leading space if not at line start and previous char is not whitespace
    if (!text) return text;
    const content = noteData.content[sectionId] || '';
    const lineStart = content.lastIndexOf('\n', start - 1) + 1; // -1 => 0
    const atLineStart = start <= lineStart;
    if (atLineStart) return text;
    const prevChar = content[Math.max(0, start - 1)] || '';
    if (/\s/.test(prevChar)) return text;
    return ' ' + text;
  };

  const handlePickerSelect = (result: string) => {
    if (activePicker) {
      const currentContent = noteData.content[activePicker.sectionId] || '';
      const start = activePicker.regionStart;
      const end = start + activePicker.regionLength;
      const adjusted = applyConditionalLeadingSpace(activePicker.sectionId, start, result);
      const newContent = currentContent.slice(0, start) + adjusted + currentContent.slice(end);
      setNoteData(prev => ({
        ...prev,
        content: {
          ...prev.content,
          [activePicker.sectionId]: newContent
        }
      }));
      setPhraseRegions(prev => prev.map(r => r.id === activePicker.regionId ? { ...r, length: adjusted.length } : r));
      setActivePicker(null);
    }
  };

  const handlePickerUpdate = (result: string, selections?: Record<string, any>) => {
    if (!activePicker) return;
    const currentContent = noteData.content[activePicker.sectionId] || '';
    const start = activePicker.regionStart;
    const end = start + activePicker.regionLength;
    const adjusted = applyConditionalLeadingSpace(activePicker.sectionId, start, result);
    const newContent = currentContent.slice(0, start) + adjusted + currentContent.slice(end);
    setNoteData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [activePicker.sectionId]: newContent
      }
    }));
    setActivePicker(prev => (prev ? { ...prev, regionLength: adjusted.length } : prev));
    setPhraseRegions(prev => prev.map(r => r.id === activePicker.regionId ? { ...r, length: adjusted.length, selections: selections || r.selections } : r));
  };

  const tryReopenPickerAtCaret = (sectionId: string, textarea: HTMLTextAreaElement) => {
    // No auto-open; only show hint on caret presence
    const pos = textarea.selectionStart ?? 0;
    const candidates = phraseRegions.filter(r => r.sectionId === sectionId);
    const found = candidates.find(r => pos >= r.start && pos <= r.start + r.length);
    if (!found) { setActivePhraseHint(null); return; }
    const rect = textarea.getBoundingClientRect();
    setActivePhraseHint({ regionId: found.id, sectionId, position: { top: rect.top, left: rect.left } });
  };

  const handleTextareaMouseMove = (sectionId: string, textarea: HTMLTextAreaElement, e: React.MouseEvent) => {
    const content = noteData.content[sectionId] || '';
    const rect = textarea.getBoundingClientRect();
    const style = window.getComputedStyle(textarea);
    const lineHeight = parseInt(style.lineHeight) || 20;
    const paddingTop = parseInt(style.paddingTop) || 8;
    const paddingLeft = parseInt(style.paddingLeft) || 12;
    const charWidth = 8;
    const x = e.clientX - rect.left - paddingLeft;
    const y = e.clientY - rect.top - paddingTop;
    const line = Math.max(0, Math.floor(y / lineHeight));
    const col = Math.max(0, Math.floor(x / charWidth));
    const lines = content.split('\n');
    let pos = 0;
    for (let i = 0; i < line && i < lines.length; i++) pos += lines[i].length + 1;
    pos += Math.min(col, (lines[line] || '').length);

    const found = phraseRegions.filter(r => r.sectionId === sectionId).find(r => pos >= r.start && pos <= r.start + r.length);
    if (!found) {
      setActivePhraseHint(null);
    } else {
      // Determine which element index is nearest to pos
      const regionText = content.slice(found.start, found.start + found.length);
      const replacements = computeElementStrings(found.phrase, found.selections);
      const full = formatSmartPhrase(found.phrase, found.selections);
      let offset = 0;
      const segments: Array<{ idx: number; start: number; end: number }> = [];
      for (let i = 0; i < replacements.length; i++) {
        const txt = replacements[i].text || '';
        if (!txt) continue;
        const at = full.indexOf(txt, offset);
        if (at >= 0) {
          segments.push({ idx: i, start: at, end: at + txt.length });
          offset = at + txt.length;
        }
      }
      const rel = pos - found.start;
      let elementIndex: number | undefined = undefined;
      for (const seg of segments) {
        if (rel >= seg.start && rel <= seg.end) { elementIndex = seg.idx; break; }
      }
      const top = e.clientY + 6;
      const left = e.clientX + 6;
      setActivePhraseHint({ regionId: found.id, sectionId, position: { top, left }, elementIndex });
    }

    // Now compute the lab overlay for the hovered line regardless of phrase regions
    // Helper: measure document (content) offsets for a given index using a hidden mirror
    const getCaretDocOffsets = (ta: HTMLTextAreaElement, idx: number) => {
      const mirror = document.createElement('div');
      const s = window.getComputedStyle(ta);
      Object.assign(mirror.style, {
        position: 'absolute',
        top: '0px',
        left: '0px',
        width: `${ta.clientWidth}px`,
        padding: s.padding,
        border: '0',
        boxSizing: s.boxSizing,
        font: s.font,
        letterSpacing: s.letterSpacing,
        whiteSpace: 'pre-wrap',
        overflow: 'visible',
        visibility: 'hidden',
        lineHeight: s.lineHeight as string,
      } as CSSStyleDeclaration);
      mirror.textContent = ta.value.substring(0, idx);
      const marker = document.createElement('span');
      marker.textContent = '\u200b';
      mirror.appendChild(marker);
      // Container to ensure offsetTop reflects content coordinates
      const container = document.createElement('div');
      Object.assign(container.style, { position: 'fixed', top: '0', left: '0', zIndex: '-1', visibility: 'hidden' } as CSSStyleDeclaration);
      container.appendChild(mirror);
      document.body.appendChild(container);
      const topDoc = marker.offsetTop; // content Y offset independent of scroll
      const leftDoc = marker.offsetLeft;
      document.body.removeChild(container);
      return { topDoc, leftDoc };
    };

    // Map mouse Y to nearest logical line using mirror doc offsets of each line end
    const logicalLines = content.split('\n');
    let startIdx = 0;
    let best = { i: -1, dist: Number.POSITIVE_INFINITY, topDoc: 0, leftDoc: 0, start: 0, end: 0 };
    const mouseDocY = textarea.scrollTop + (e.clientY - rect.top - paddingTop);
    for (let i = 0; i < logicalLines.length; i++) {
      const endIdx = startIdx + logicalLines[i].length; // exclusive
      const c = getCaretDocOffsets(textarea, endIdx);
      const d = Math.abs(mouseDocY - c.topDoc);
      if (d < best.dist) {
        best = { i, dist: d, topDoc: c.topDoc, leftDoc: c.leftDoc, start: startIdx, end: endIdx };
      }
      startIdx = endIdx + 1; // skip the newline
    }
    if (best.i === -1) { setActiveLabOverlay(null); return; }
    const rawLine = content.slice(best.start, best.end);
    const lm = rawLine.trim().match(/^([A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ0-9\-]*(?: [A-Za-z0-9\-]+)*)\s+([^()\s]+)(?:\s*\(([^)]*)\))?\s*$/);
    if (!lm) { setActiveLabOverlay(null); return; }
    const label = lm[1];
    const trends = (lm[3] || '').split(',').map(s => s.trim()).filter(Boolean);
    let overlayTop = rect.top + paddingTop + (best.topDoc - textarea.scrollTop) - 4;
    let overlayLeft = rect.left + paddingLeft + Math.min(best.leftDoc + 8, textarea.clientWidth - 150);
    const max = labSeriesBySection[sectionId]?.[label]?.trends?.length;
    setActiveLabOverlay({ sectionId, top: overlayTop, left: overlayLeft, label, count: trends.length, lineStart: best.start, lineEnd: best.end, max });

    // Hover overlay computed above; nothing else to do
  };

  const handleTextareaMouseLeave = () => {
    setActivePhraseHint(null);
    // Delay hiding slightly to allow pointer to enter overlay without flicker
    setTimeout(() => {
      if (!isHoveringOverlay) {
        setActiveLabOverlay(null);
      }
    }, 80);
  };

  // (hover-only) no multi-line overlays

  const replaceLineInSection = (sectionId: string, lineStart: number, lineEnd: number, newLine: string) => {
    const content = noteData.content[sectionId] || '';
    const before = content.slice(0, lineStart);
    const after = content.slice(lineEnd);
    const newContent = (before + newLine + (after.startsWith('\n') ? '' : '\n') + after).replace(/\n{3,}/g, '\n\n');
    setNoteData(prev => ({ ...prev, content: { ...prev.content, [sectionId]: newContent } }));
  };

  const adjustLabTrendCount = (direction: 'inc' | 'dec') => {
    if (!activeLabOverlay) return;
    const { sectionId, label, lineStart, lineEnd } = activeLabOverlay;
    const content = noteData.content[sectionId] || '';
    const line = content.slice(lineStart, lineEnd);
    const m = line.match(/^\s*([A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ0-9\-]*(?: [A-Za-z0-9\-]+)*)\s+([^()\s]+)(?:\s*\(([^)]*)\))?\s*$/);
    if (!m) return;
    const current = m[2];
    const currentTrends = (m[3] || '').split(',').map(s => s.trim()).filter(Boolean);
    if (direction === 'dec') {
      if (currentTrends.length === 0) return;
      const nextTrends = currentTrends.slice(0, -1);
      const newLine = nextTrends.length > 0 ? `${label} ${current} (${nextTrends.join(', ')})` : `${label} ${current}`;
      replaceLineInSection(sectionId, lineStart, lineEnd, newLine);
      setActiveLabOverlay(prev => prev ? { ...prev, count: Math.max(0, prev.count - 1), lineEnd: lineStart + newLine.length } : prev);
      return;
    }
    // inc
    const full = labSeriesBySection[sectionId]?.[label];
    if (!full) {
      // If no stored series, repeat last trend value to allow growth cycling
      const nextTrends = currentTrends.concat([]).filter(Boolean);
      if (nextTrends.length === 0) return;
      const last = nextTrends[nextTrends.length - 1];
      const newLine = `${label} ${current} (${nextTrends.concat([last]).join(', ')})`;
      replaceLineInSection(sectionId, lineStart, lineEnd, newLine);
      setActiveLabOverlay(prev => prev ? { ...prev, count: prev.count + 1, lineEnd: lineStart + newLine.length } : prev);
      return;
    }
    const available = full.trends || [];
    if (currentTrends.length >= available.length) return;
    const nextValue = available[currentTrends.length];
    const nextTrends = currentTrends.concat([nextValue]).filter(Boolean);
    const newLine = `${label} ${current} (${nextTrends.join(', ')})`;
    replaceLineInSection(sectionId, lineStart, lineEnd, newLine);
    setActiveLabOverlay(prev => prev ? { ...prev, count: prev.count + 1, lineEnd: lineStart + newLine.length } : prev);
  };

  const deleteLabLine = () => {
    if (!activeLabOverlay) return;
    const { sectionId, lineStart, lineEnd } = activeLabOverlay;
    const content = noteData.content[sectionId] || '';
    const before = content.slice(0, lineStart);
    const after = content.slice(lineEnd);
    const newContent = (before.replace(/\n?$/, '') + '\n' + after).replace(/\n{3,}/g, '\n\n');
    setNoteData(prev => ({ ...prev, content: { ...prev.content, [sectionId]: newContent.trimEnd() } }));
    setActiveLabOverlay(null);
  };

  const openPickerForRegion = (regionId: string, initialStep?: number) => {
    const found = phraseRegions.find(r => r.id === regionId);
    if (!found) return;
    const textarea = document.querySelector(`[data-section-id="${found.sectionId}"]`) as HTMLTextAreaElement | null;
    const rect = textarea?.getBoundingClientRect();
    setActivePicker({
      phrase: found.phrase,
      sectionId: found.sectionId,
      position: rect ? { top: rect.bottom + 10, left: rect.left } : { top: 200, left: 200 },
      regionStart: found.start,
      regionLength: found.length,
      regionId: found.id,
    });
    setActivePhraseHint(null);
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
      if (textarea && typeof textarea.setSelectionRange === 'function') {
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
      if (textarea && typeof textarea.setSelectionRange === 'function') {
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
      if (textarea && typeof textarea.setSelectionRange === 'function') {
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
      if (textarea && typeof textarea.setSelectionRange === 'function') {
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
      if (textarea && typeof textarea.setSelectionRange === 'function') {
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
      if (textarea && typeof textarea.setSelectionRange === 'function') {
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
    // Keep region as-is to allow reopening later
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

  const [labParsingInitialTab, setLabParsingInitialTab] = useState<'paste' | 'customize' | 'global-settings' | 'preview'>('paste');

  const handleLabParsing = (sectionId: string, initialTab: 'paste' | 'customize' | 'global-settings' | 'preview' = 'paste') => {
    setLabParsingSectionId(sectionId);
    setLabParsingInitialTab(initialTab);
    setShowLabParsingDialog(true);
  };

  const handleLabParsingConfirm = async (formattedLabs: string, parsedLabs?: ParsedLabValue[]) => {
    const isIcu = isIcuTemplateType(noteData.templateType);
    if (isIcu && icuLabRouting && parsedLabs && parsedLabs.length > 0) {
      // Group labs by ICU system and insert blocks into system sections
      const groups: Record<string, ParsedLabValue[]> = {};
      for (const lab of parsedLabs) {
        const sys = mapLabNameToIcuSystem(lab.standardizedName);
        if (!sys) continue;
        if (!groups[sys]) groups[sys] = [] as ParsedLabValue[];
        groups[sys]!.push(lab);
      }
      // Lazy import formatter to reuse formatting per group
      const { formatLabsForNote, DEFAULT_LAB_PREFERENCES } = await import('@/lib/lab-parsing');
      const updates: Record<string, string> = {};
      for (const [sys, labs] of Object.entries(groups)) {
        const sectionId = findIcuSectionId(sections, sys as any);
        if (!sectionId) continue;
        const formatted = formatLabsForNote(labs, DEFAULT_LAB_PREFERENCES, {}, {});
        const content = noteData.content[sectionId] || '';
        const newContent = content + (content ? '\n\n' : '') + formatted;
        updates[sectionId] = newContent;
      }
      if (Object.keys(updates).length > 0) {
        setNoteData(prev => ({ ...prev, content: { ...prev.content, ...updates } }));
        toast({ title: 'Labs routed to systems', description: 'Parsed labs were added into ICU system sections.' });
      } else {
        toast({ title: 'No routable labs', description: 'Parsed labs did not match ICU systems.' });
      }
    } else if (labParsingSectionId) {
      const content = noteData.content[labParsingSectionId] || '';
      const newContent = content + (content ? '\n\n' : '') + formattedLabs;
      setNoteData(prev => ({ ...prev, content: { ...prev.content, [labParsingSectionId]: newContent } }));
      toast({ title: 'Lab values parsed and added', description: 'EHR lab results have been standardized and inserted.' });
    }
    setShowLabParsingDialog(false);
    setLabParsingSectionId(null);
    setIcuLabRouting(false);
  };

  // ICU action handlers
  const handleIcuLabsClick = () => {
    setIcuLabRouting(true);
    setLabParsingSectionId('nephroMetabolic'); // placeholder; content will be routed
    setLabParsingInitialTab('paste');
    setShowLabParsingDialog(true);
  };

  const insertIntoSection = (sectionId: string, text: string) => {
    const content = noteData.content[sectionId] || '';
    const newContent = content + (content ? '\n\n' : '') + text;
    setNoteData(prev => ({ ...prev, content: { ...prev.content, [sectionId]: newContent } }));
  };

  const handleIcuImagingSelect = (study: ImagingStudy, selectedNegatives: string[]) => {
    const formattedNegatives = (selectedNegatives || []).map((n: string) => n.replace(/^No\s+/i, 'no ')).join(', ');
    const summary = formattedNegatives ? `${study.fullName}: ${formattedNegatives}.` : `${study.fullName}.`;
    const sys = mapImagingSummaryToIcuSystem(summary);
    const targetId = sys ? findIcuSectionId(sections, sys) : null;
    if (targetId) {
      insertIntoSection(targetId, summary);
      toast({ title: 'Imaging added', description: `Inserted into ${sys} section.` });
    } else if (activeImageEditorSection) {
      insertIntoSection(activeImageEditorSection, summary);
      toast({ title: 'Imaging added', description: 'Inserted into current section.' });
    } else {
      toast({ title: 'No target section', description: 'Could not determine ICU system section.' });
    }
  };

  const handleIcuMedAdd = (medLine: string, opts?: { dripsOnly?: boolean }) => {
    const sys = mapMedicationToIcuSystem(medLine);
    const targetId = sys ? findIcuSectionId(sections, sys) : null;
    if (targetId) {
      insertIntoSection(targetId, medLine);
      toast({ title: opts?.dripsOnly ? 'Drip added' : 'Medication added', description: `Routed to ${sys} section.` });
    } else {
      toast({ title: 'No target section', description: 'Could not determine system for medication.' });
    }
  };

  const handleIcuVentConfirm = (settingsLine: string) => {
    const targetId = findIcuSectionId(sections, 'resp');
    if (targetId) {
      insertIntoSection(targetId, settingsLine);
      toast({ title: 'Vent settings added', description: 'Inserted into Respiratory section.' });
    }
    setShowVentPopup(false);
  };

  const handleIcuIOConfirm = (ioLine: string) => {
    const targetId = findIcuSectionId(sections, 'nephroMetabolic');
    if (targetId) {
      insertIntoSection(targetId, ioLine);
      toast({ title: 'I/O added', description: 'Inserted into Nephro-metabolic section.' });
    }
    setShowIOPopup(false);
  };

  // Quick helper to build series map from parsed labs
  const buildSeriesMap = (sectionId: string, parsed: Array<{ standardizedName: string; currentValue: string; trendedValues: string[]; unit?: string }>) => {
    const map: Record<string, { current: string; trends: string[]; unit?: string }> = {};
    for (const p of parsed) {
      map[p.standardizedName] = { current: p.currentValue, trends: p.trendedValues, unit: p.unit };
    }
    setLabSeriesBySection(prev => ({ ...prev, [sectionId]: map }));
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
      const textarea = document.querySelector(`[data-testid="textarea-${sectionId}"]`) as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        // Position cursor at the end of existing content
        const content = textarea.value || '';
        textarea.setSelectionRange(content.length, content.length);
      }
    }, 300); // Increased timeout to ensure smooth scroll completes first
  };

  const getSectionEmojiIcon = (sectionId: string, sectionName?: string, sectionType?: string) => {
    const name = sectionName?.toLowerCase() || '';
    const type = sectionType;
    
    if (type === 'chiefComplaint' || name.includes('chief complaint') || name.includes('reason') || sectionId === 'reason' || sectionId === 'chief') return '📋';
    if (type === 'historyPresentIllness' || name.includes('hpi') || name.includes('history of present') || sectionId === 'hpi' || sectionId === 'evolution') return '📖';
    if (type === 'pastMedicalHistory' || name.includes('past medical') || name.includes('pmh')) return '🏥';
    if (type === 'medications' || name.includes('medication') || name.includes('meds') || sectionId === 'medications') return '💊';
    if (type === 'allergies' || name.includes('allergies') || name.includes('allergy') || sectionId === 'allergies') return '⚠️';
    if (type === 'socialHistory' || name.includes('social history') || name.includes('social hx')) return '🏠';
    if (type === 'familyHistory' || name.includes('family history') || name.includes('fhx')) return '👨‍👩‍👧‍👦';
    if (type === 'reviewOfSystems' || name.includes('review of systems') || name.includes('ros') || sectionId === 'ros') return '🔍';
    if (type === 'physicalExam' || name.includes('physical') || name.includes('exam')) return '🩺';
    if (type === 'labs' || name.includes('lab') || name.includes('laboratory')) return '🧪';
    if (type === 'imaging' || name.includes('imaging') || name.includes('radiology')) return '📷';
    if (name.includes('assessment') || name.includes('impression')) return '🎯';
    if (name.includes('plan') || name.includes('management')) return '📝';
    return '📄';
  };

  const getSectionIcon = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    const emoji = getSectionEmojiIcon(sectionId, section?.name, section?.type);
    return <span className="text-base">{emoji}</span>;
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
                      {/* Local templates - only blank note */}
                      {noteTemplates
                        .filter(template => ['blank','icu-admission','icu-progress'].includes(template.type as string))
                        .map((template) => (
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
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          {sections.map((section, index) => (
            <div key={section.id} className={`section-card ${index > 0 ? 'border-t border-gray-100' : ''}`} data-section-id={section.id}>
              {/* Hide header for blank note template */}
              {selectedTemplate?.type !== 'blank' && (
                <div className="px-4 py-3 bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                      <span className="text-gray-500">{getSectionIcon(section.id)}</span>
                      <span>{section.name}</span>
                      {section.required && <span className="text-red-500 text-xs">*</span>}
                    </h4>
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
                          onClick={async () => {
                            try {
                              const text = await navigator.clipboard.readText();
                              if (!text || !text.trim()) {
                                toast({ title: 'Clipboard empty', description: 'No text found in clipboard.' });
                                return;
                              }
                              const { parseLabText, formatLabsForNote, DEFAULT_LAB_PREFERENCES } = await import('@/lib/lab-parsing');
                              const parsed = parseLabText(text);
                              if (parsed.length === 0) {
                                toast({ title: 'No labs detected', description: 'Could not parse labs from clipboard.' });
                                return;
                              }
                              // store full series for overlay expansion
                              buildSeriesMap(section.id, parsed);
                              // Try to load user's most recent preset
                              let customVisibility: Record<string, boolean> | undefined;
                              let customTrendCounts: Record<string, number> | undefined;
                              try {
                                const resp = await fetch('/api/lab-presets');
                                if (resp.ok) {
                                  const list = await resp.json();
                                  if (Array.isArray(list) && list.length > 0) {
                                    customVisibility = list[0]?.settings?.customVisibility;
                                    customTrendCounts = list[0]?.settings?.customTrendCounts;
                                  }
                                }
                              } catch {}
                              const formatted = formatLabsForNote(parsed, DEFAULT_LAB_PREFERENCES, customVisibility, customTrendCounts);
                              const content = noteData.content[section.id] || '';
                              const newContent = content + (content ? '\n\n' : '') + formatted;
                              setNoteData(prev => ({
                                ...prev,
                                content: { ...prev.content, [section.id]: newContent }
                              }));
                              toast({ title: 'Quick parse added', description: 'Labs parsed from clipboard and appended.' });
                            } catch (err) {
                              console.error(err);
                              toast({ title: 'Clipboard access denied', description: 'Allow clipboard permission to use Quick Parse.' });
                            }
                          }}
                          className="flex items-center gap-1 text-xs px-2"
                          title="Quickly parse labs from clipboard and append"
                        >
                          Quick Parse
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleLabParsing(section.id, 'paste')}
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
                          onClick={() => handleLabParsing(section.id, 'global-settings')}
                          className="flex items-center gap-1 text-xs px-2"
                          title="Lab settings and presets"
                        >
                          Settings
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
                    {/* Smart Phrases chip per section */}
                    {(() => {
                      const regions = phraseRegions.filter(r => r.sectionId === section.id);
                      if (regions.length === 0) return null;
                      return (
                        <div className="relative">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="text-xs px-2"
                            onClick={() => setOpenPhraseMenuSection(prev => prev === section.id ? null : section.id)}
                          >
                            Smart phrases
                            <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">{regions.length}</Badge>
                          </Button>
                          {openPhraseMenuSection === section.id && (
                            <div className="absolute right-0 mt-1 w-64 bg-white border rounded shadow z-30">
                              <div className="p-2 text-[11px] text-muted-foreground">Click to edit</div>
                              <div className="max-h-64 overflow-auto">
                                {regions.map((r, idx) => (
                                  <button
                                    key={r.id}
                                    className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted/50"
                                    onClick={() => { openPickerForRegion(r.id); setOpenPhraseMenuSection(null); }}
                                  >
                                    {r.phrase?.trigger ? `/${r.phrase.trigger}` : `Phrase ${idx + 1}`}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
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
                </div>
              )}
              <div className="p-4">
                {selectedTemplate?.type === 'blank' && (() => {
                  const regions = phraseRegions.filter(r => r.sectionId === section.id);
                  if (regions.length === 0) return null;
                  return (
                    <div className="flex justify-end mb-2">
                      <div className="relative">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="text-xs px-2"
                          onClick={() => setOpenPhraseMenuSection(prev => prev === section.id ? null : section.id)}
                        >
                          Smart phrases
                          <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">{regions.length}</Badge>
                        </Button>
                        {openPhraseMenuSection === section.id && (
                          <div className="absolute right-0 mt-1 w-64 bg-white border rounded shadow z-30">
                            <div className="p-2 text-[11px] text-muted-foreground">Click to edit</div>
                            <div className="max-h-64 overflow-auto">
                              {regions.map((r, idx) => (
                                <button
                                  key={r.id}
                                  className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted/50"
                                  onClick={() => { openPickerForRegion(r.id); setOpenPhraseMenuSection(null); }}
                                >
                                  {r.phrase?.trigger ? `/${r.phrase.trigger}` : `Phrase ${idx + 1}`}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
                <div className="relative">
                  <div className="relative">
                  <Textarea
                    value={noteData.content[section.id] || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleSectionContentChange(section.id, e.target.value, e.target)}
                    onClick={(e: React.MouseEvent<HTMLTextAreaElement>) => { tryReopenPickerAtCaret(section.id, e.currentTarget as HTMLTextAreaElement); }}
                    onKeyUp={(e: React.KeyboardEvent<HTMLTextAreaElement>) => { tryReopenPickerAtCaret(section.id, e.currentTarget as HTMLTextAreaElement); }}
                    onMouseMove={(e: React.MouseEvent<HTMLTextAreaElement>) => handleTextareaMouseMove(section.id, e.currentTarget as HTMLTextAreaElement, e)}
                    onMouseLeave={handleTextareaMouseLeave}
                    
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
                    className={`flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none ${selectedTemplate?.type === 'blank' ? 'min-h-[300px]' : 'min-h-[120px]'}`}
                    data-testid={`textarea-${section.id}`}
                    data-section-id={section.id}
                  />
                  {/* Lab line overlay controls */}
                  {activeLabOverlay && activeLabOverlay.sectionId === section.id && (
                    <LabLineOverlay
                      visible={true}
                      top={activeLabOverlay.top}
                      left={activeLabOverlay.left}
                      count={activeLabOverlay.count}
                      max={activeLabOverlay.max}
                      onIncrease={() => adjustLabTrendCount('inc')}
                      onDecrease={() => adjustLabTrendCount('dec')}
                      onDelete={() => deleteLabLine()}
                      onMouseEnter={() => setIsHoveringOverlay(true)}
                      onMouseLeave={() => setIsHoveringOverlay(false)}
                    />
                  )}
                  {/* Smart phrase hover chip disabled per updated UX preference */}
                  </div>
                  
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
                      onUpdate={handlePickerUpdate}
                      initialSelections={
                        (phraseRegions.find(r => r.id === activePicker.regionId)?.selections) || {}
                      }
                      initialStep={activePhraseHint?.elementIndex}
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
              </div>
            </div>
          ))}
          </div>

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
          {/* ICU Right Action Bar floating (fixed) */}
        </div>
        {isIcuTemplateType(noteData.templateType) && (
          <div className="hidden xl:block fixed right-6 top-24 z-40">
            <IcuActionBar
              onLabs={handleIcuLabsClick}
              onImaging={() => setShowImagingQuick(true)}
              onMeds={() => setShowMedQuickAdd({})}
              onDrips={() => setShowMedQuickAdd({ dripsOnly: true })}
              onVent={() => setShowVentPopup(true)}
              onIO={() => setShowIOPopup(true)}
            />
          </div>
        )}
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
        initialTab={labParsingInitialTab}
      />
      {/* ICU Imaging Quick Dialog */}
      <ImagingQuickDialog
        isOpen={showImagingQuick}
        onClose={() => setShowImagingQuick(false)}
        onSelect={handleIcuImagingSelect}
      />
      {/* Clinical Calculator Popup */}
      <ClinicalCalculatorPopup
        isOpen={showClinicalCalculator}
        onClose={() => setShowClinicalCalculator(false)}
        onCalculationComplete={handleCalculatorComplete}
      />
      {/* ICU Ventilation Popup */}
      <VentilationSettingsPopup
        isOpen={showVentPopup}
        onClose={() => setShowVentPopup(false)}
        onConfirm={handleIcuVentConfirm}
      />
      {/* ICU I&O Popup */}
      <IOEntryPopup
        isOpen={showIOPopup}
        onClose={() => setShowIOPopup(false)}
        onConfirm={handleIcuIOConfirm}
      />
      {/* ICU Med Quick Add */}
      <MedQuickAddPopup
        isOpen={!!showMedQuickAdd}
        onClose={() => setShowMedQuickAdd(null)}
        onConfirm={(line) => handleIcuMedAdd(line, showMedQuickAdd || undefined)}
        dripsOnly={showMedQuickAdd?.dripsOnly}
      />


    </div>
  );
}
