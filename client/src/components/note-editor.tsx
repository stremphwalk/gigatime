import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SmartPhraseAutocomplete } from "./smart-phrase-autocomplete";
import { FlexibleSmartPhrasePicker } from "./flexible-smart-phrase-picker";
import { SmartPhraseOverlay } from "@/components/smart-phrases";
import { isUnifiedSmartPhraseOverlayEnabled } from "@/lib/flags";
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
import { getTextareaCaretRect } from "@/lib/caret";
import { 
  Save, 
  Check, 
  Download, 
  Copy, 
  MoreVertical,
  Clock,
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
  FileSearch,
  Sparkles,
  Loader2
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useDictation } from "@/hooks/useDictation";
import { cn } from "@/lib/utils";
import { formatSmartPhrase, computeElementStrings } from "@/lib/smart-phrase-format";
import { parseSmartPhraseContent, reconstructPhraseWithSelections } from "@shared/smart-phrase-parser";
import { noteTemplates } from "../lib/note-templates";
import { COMMON_ALLERGIES, TOP_MEDICAL_ALLERGIES } from "@/lib/medical-conditions";
import { useTranslation } from 'react-i18next';
import type { Note, NoteTemplate } from "@shared/schema";

interface NoteEditorProps {
  note: Note | null;
  isCreating: boolean;
  onNoteSaved: (note: Note) => void;
  initialTemplateType?: string;
  onDirtyChange?: (dirty: boolean) => void;
  onRequestReturn?: () => void;
  onRequestOpenNote?: (noteId: string) => void;
}

interface NoteSection {
  id: string;
  name: string;
  type: string;
  required: boolean;
  content?: string;
}

export function NoteEditor({ note, isCreating, onNoteSaved, initialTemplateType, onDirtyChange, onRequestReturn, onRequestOpenNote }: NoteEditorProps) {
  const { t } = useTranslation();
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
  const [activeOverlay, setActiveOverlay] = useState<{
    sectionId: string;
    caretRect: { top: number; left: number; bottom: number; right: number } | null;
    content: string;
    regionStart: number;
    regionLength: number;
    regionId: string;
    phrase: any;
    mode: 'insert' | 'edit';
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
    position: { top: number; left: number; width: number };
    query: string;
    cursorPosition: number;
    wordStart: number;
  } | null>(null);
  const [activeAllergyAutocomplete, setActiveAllergyAutocomplete] = useState<{
    sectionId: string;
    position: { top: number; left: number; width: number };
    query: string;
    cursorPosition: number;
    wordStart: number;
  } | null>(null);
  const [activeSocialHistoryAutocomplete, setActiveSocialHistoryAutocomplete] = useState<{
    sectionId: string;
    position: { top: number; left: number; width: number };
    query: string;
    cursorPosition: number;
    wordStart: number;
  } | null>(null);
  const [activeConsultationReasonAutocomplete, setActiveConsultationReasonAutocomplete] = useState<{
    sectionId: string;
    position: { top: number; left: number; width: number };
    query: string;
    cursorPosition: number;
    wordStart: number;
    type: 'consultation' | 'admission';
  } | null>(null);
  const [activeMedicationAutocomplete, setActiveMedicationAutocomplete] = useState<{
    sectionId: string;
    position: { top: number; left: number; width: number };
    query: string;
    cursorPosition: number;
    wordStart: number;
  } | null>(null);
  const [showMedicationReorderDialog, setShowMedicationReorderDialog] = useState(false);
  const [medicationReorderSectionId, setMedicationReorderSectionId] = useState<string | null>(null);
  const [showLabParsingDialog, setShowLabParsingDialog] = useState(false);
  const [labParsingSectionId, setLabParsingSectionId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [showPertinentNegatives, setShowPertinentNegatives] = useState(false);
  const [pertinentNegativesSection, setPertinentNegativesSection] = useState<string | null>(null);
  const [activeLabValuesPopup, setActiveLabValuesPopup] = useState<string | null>(null);
  const [activePhysicalExamAutocomplete, setActivePhysicalExamAutocomplete] = useState<{
    sectionId: string;
    position: { top: number; left: number; width: number };
    query: string;
    cursorPosition: number;
    wordStart: number;
  } | null>(null);
  
  // Debounce autocomplete triggers to prevent jittery behavior
  const autocompleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Ensure only one autocomplete is open globally at a time
  const closeAllAutocompletes = () => {
    setActiveMedicalAutocomplete(null);
    setActiveAllergyAutocomplete(null);
    setActiveSocialHistoryAutocomplete(null);
    setActiveMedicationAutocomplete(null);
    setActivePhysicalExamAutocomplete(null);
    setActiveConsultationReasonAutocomplete(null);
  };

  // Helper: calculate position relative to textarea and clamp within viewport
  const calculateRelativePosition = (
    textarea: HTMLTextAreaElement,
    caretLeft: number,
    caretBottom: number,
    estimatedWidth: number = 320,
    estimatedHeight: number = 280
  ) => {
    const textareaRect = textarea.getBoundingClientRect();
    const vw = window.innerWidth || document.documentElement.clientWidth || 1024;
    const vh = window.innerHeight || document.documentElement.clientHeight || 768;
    
    // Calculate position relative to textarea
    let relativeLeft = caretLeft - textareaRect.left;
    let relativeTop = caretBottom - textareaRect.top + 5; // 5px gap below caret
    
    // Clamp within viewport bounds
    const maxLeft = vw - textareaRect.left - estimatedWidth - 8;
    const maxTop = vh - textareaRect.top - estimatedHeight - 8;
    
    relativeLeft = Math.min(Math.max(8, relativeLeft), Math.max(8, maxLeft));
    
    // Flip above if not enough space below
    if (relativeTop + estimatedHeight > maxTop) {
      relativeTop = (caretBottom - textareaRect.top) - estimatedHeight - 10;
    }
    // Final clamp within viewport
    relativeTop = Math.min(Math.max(8, relativeTop), Math.max(8, maxTop));
    
    return { top: relativeTop, left: relativeLeft };
  };

  // Helper: anchored position — stick dropdown to the bottom-left of the textarea
  const calculateAnchoredPosition = (
    textarea: HTMLTextAreaElement,
    verticalGap: number = 6
  ) => {
    const parent = textarea.parentElement as HTMLElement | null;
    const parentRect = parent?.getBoundingClientRect();
    const textareaRect = textarea.getBoundingClientRect();
    if (!parentRect) {
      return { top: textareaRect.bottom + verticalGap, left: textareaRect.left };
    }
    const top = (textareaRect.bottom - parentRect.top) + verticalGap;
    const left = (textareaRect.left - parentRect.left);
    return { top, left };
  };
  
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

  const { createNote, updateNote, isCreating: isSaving, notes: allNotes } = useNotes();
  const { templates } = useNoteTemplates();
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  // Countdown for auto-delete (only for saved notes with expiresAt)
  useEffect(() => {
    const compute = () => {
      const exp = (note && (note as any).expiresAt) ? new Date((note as any).expiresAt as any).getTime() : null;
      if (!exp) { setTimeLeft(null); return; }
      const diff = exp - Date.now();
      if (diff <= 0) { setTimeLeft('expired'); return; }
      const mins = Math.floor(diff / 60000);
      if (mins < 60) { setTimeLeft(`${mins}m left`); return; }
      const hrs = Math.floor(mins / 60);
      const rem = mins % 60;
      setTimeLeft(`${hrs}h ${rem}m left`);
    };
    compute();
    const id = setInterval(compute, 30000);
    return () => clearInterval(id);
  }, [note && (note as any).expiresAt]);
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
      setIsDirty(false);
      onDirtyChange?.(false);
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
      setIsDirty(false);
      onDirtyChange?.(false);
    }
  }, [isCreating]);

  // Apply initial template type when provided (welcome -> editor handoff)
  useEffect(() => {
    if (isCreating && initialTemplateType && !selectedTemplate) {
      handleTemplateChange(initialTemplateType);
    }
  }, [isCreating, initialTemplateType, selectedTemplate]);

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
      setIsDirty(true);
      onDirtyChange?.(true);
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
    if (!isDirty) { setIsDirty(true); onDirtyChange?.(true); }

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
        if (textarea) {
          setCursorSafe(textarea, cursorPosition - 5);
        }
      }, 10);
      
      return; // Don't process other triggers
    }

    // Check for smart phrase trigger (excluding calc) - only if no other autocomplete is active
    if (!activeMedicalAutocomplete && !activeAllergyAutocomplete && !activeSocialHistoryAutocomplete && 
        !activeMedicationAutocomplete && !activePhysicalExamAutocomplete && !activeConsultationReasonAutocomplete) {
      if (content.endsWith('/')) {
        const caret = getTextareaCaretRect(textarea, cursorPosition);
        const pos = calculateRelativePosition(textarea, caret.left, caret.bottom);
        setActiveAutocomplete({
          sectionId,
          position: { top: pos.top, left: pos.left },
          query: ''
        });
      } else if (activeAutocomplete && content.includes('/')) {
        const lastSlashIndex = content.lastIndexOf('/');
        const query = content.slice(lastSlashIndex + 1);
        // Don't show autocomplete for /calc command
        if (query === 'calc') {
          setActiveAutocomplete(null);
        } else {
          const caret = getTextareaCaretRect(textarea, cursorPosition);
          const pos = calculateRelativePosition(textarea, caret.left, caret.bottom);
          setActiveAutocomplete(prev => prev ? { ...prev, query, position: { top: pos.top, left: pos.left } } : null);
        }
      } else if (activeAutocomplete && !content.includes('/')) {
        setActiveAutocomplete(null);
      }
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
          // Clear any existing timeout
          if (autocompleteTimeoutRef.current) {
            clearTimeout(autocompleteTimeoutRef.current);
          }
          
          // Debounce the autocomplete trigger
          autocompleteTimeoutRef.current = setTimeout(() => {
            closeAllAutocompletes();
            const anchored = calculateAnchoredPosition(textarea);
            const width = textarea.clientWidth;
            setActiveMedicalAutocomplete({
              sectionId,
              position: { top: anchored.top, left: anchored.left, width },
              query: currentWord,
              cursorPosition,
              wordStart
            });
          }, 150); // 150ms debounce
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
        
        if (currentWord && currentWord.length >= 2 && !currentWord.includes('/')) {
          // Clear any existing timeout
          if (autocompleteTimeoutRef.current) {
            clearTimeout(autocompleteTimeoutRef.current);
          }
          
          // Debounce the autocomplete trigger
          autocompleteTimeoutRef.current = setTimeout(() => {
            closeAllAutocompletes();
            const anchored = calculateAnchoredPosition(textarea);
            const width = textarea.clientWidth;
            setActiveAllergyAutocomplete({
              sectionId,
              position: { top: anchored.top, left: anchored.left, width },
              query: currentWord,
              cursorPosition,
              wordStart
            });
          }, 150); // 150ms debounce
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
        
        if (currentWord && currentWord.length >= 2 && !currentWord.includes('/')) {
          // Clear any existing timeout
          if (autocompleteTimeoutRef.current) {
            clearTimeout(autocompleteTimeoutRef.current);
          }
          
          // Debounce the autocomplete trigger
          autocompleteTimeoutRef.current = setTimeout(() => {
            closeAllAutocompletes();
            const anchored = calculateAnchoredPosition(textarea);
            const width = textarea.clientWidth;
            setActiveSocialHistoryAutocomplete({
              sectionId,
              position: { top: anchored.top, left: anchored.left, width },
              query: currentWord,
              cursorPosition,
              wordStart
            });
          }, 150); // 150ms debounce
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
          // Clear any existing timeout
          if (autocompleteTimeoutRef.current) {
            clearTimeout(autocompleteTimeoutRef.current);
          }
          
          // Debounce the autocomplete trigger
          autocompleteTimeoutRef.current = setTimeout(() => {
            closeAllAutocompletes();
            const anchored = calculateAnchoredPosition(textarea);
            const width = textarea.clientWidth;
            setActiveMedicationAutocomplete({
              sectionId,
              position: { top: anchored.top, left: anchored.left, width },
              query: currentWord,
              cursorPosition,
              wordStart
            });
          }, 150); // 150ms debounce
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
          // Clear any existing timeout
          if (autocompleteTimeoutRef.current) {
            clearTimeout(autocompleteTimeoutRef.current);
          }
          
          // Debounce the autocomplete trigger
          autocompleteTimeoutRef.current = setTimeout(() => {
            closeAllAutocompletes();
            const anchored = calculateAnchoredPosition(textarea);
            const width = textarea.clientWidth;
            setActivePhysicalExamAutocomplete({
              sectionId,
              position: { top: anchored.top, left: anchored.left, width },
              query: currentWord.trim(),
              cursorPosition,
              wordStart
            });
          }, 150); // 150ms debounce
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
          // Clear any existing timeout
          if (autocompleteTimeoutRef.current) {
            clearTimeout(autocompleteTimeoutRef.current);
          }
          
          // Debounce the autocomplete trigger
          autocompleteTimeoutRef.current = setTimeout(() => {
            closeAllAutocompletes();
            const anchored = calculateAnchoredPosition(textarea);
            const width = textarea.clientWidth;
            const reasonType = section?.name.toLowerCase().includes('admission') ? 'admission' : 'consultation';
            
            setActiveConsultationReasonAutocomplete({
              sectionId,
              position: { top: anchored.top, left: anchored.left, width },
              query: currentWord.trim(),
              cursorPosition,
              wordStart,
              type: reasonType
            });
          }, 150); // 150ms debounce
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
              setCursorSafe(textarea, newCursorPos);
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
          const textarea = document.querySelector(`[data-section-id=\"${activeAutocomplete.sectionId}\"]`) as HTMLTextAreaElement | null;
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
          if (isUnifiedSmartPhraseOverlayEnabled()) {
            setPhraseRegions(prev => ([
              ...prev,
              { id: regionId, sectionId: activeAutocomplete.sectionId, start: beforeSlash.length, length: template.length, phrase, selections: {} }
            ]));
            setActiveOverlay({
              sectionId: activeAutocomplete.sectionId,
              caretRect: rect ? { top: rect.top, left: rect.left, bottom: rect.bottom, right: rect.right } : null,
              content: template,
              regionStart: beforeSlash.length,
              regionLength: template.length,
              regionId,
              phrase,
              mode: 'insert',
            });
          } else {
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
    const nextChar = currentContent.slice(actualCursorPos, actualCursorPos + 1);
    const needsSpace = nextChar && !/[\s\.,;:!\?)\]]/.test(nextChar);
    const insertion = condition + (needsSpace ? ' ' : '');
    const newContent = 
      currentContent.slice(0, wordStart) + 
      insertion + 
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
        const newCursorPos = wordStart + insertion.length;
        setCursorSafe(textarea, newCursorPos);
      }
    }, 0);
  };

  const handleAllergySelect = (allergy: string) => {
    if (!activeAllergyAutocomplete) return;
    
    const { sectionId, cursorPosition, wordStart } = activeAllergyAutocomplete;
    const currentContent = noteData.content[sectionId] || '';
    
    // Replace the current word with the selected allergy
    const nextChar = currentContent.slice(cursorPosition, cursorPosition + 1);
    const needsSpace = nextChar && !/[\s\.,;:!\?)\]]/.test(nextChar);
    const insertion = allergy + (needsSpace ? ' ' : '');
    const newContent = 
      currentContent.slice(0, wordStart) + 
      insertion + 
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
        const newCursorPos = wordStart + insertion.length;
        setCursorSafe(textarea, newCursorPos);
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
    const nextChar = currentContent.slice(cursorPosition, cursorPosition + 1);
    const needsSpace = nextChar && !/[\s\.,;:!\?)\]]/.test(nextChar);
    const insertion = formatted + (needsSpace ? ' ' : '');
    const newContent = 
      currentContent.slice(0, wordStart) + 
      insertion + 
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
        const newCursorPos = wordStart + insertion.length;
        setCursorSafe(textarea, newCursorPos);
      }
    }, 0);
  };

  const handleMedicationSelect = (medication: string) => {
    if (!activeMedicationAutocomplete) return;
    
    const { sectionId, cursorPosition, wordStart } = activeMedicationAutocomplete;
    const currentContent = noteData.content[sectionId] || '';
    
    // Replace the current word with the formatted medication
    const nextChar = currentContent.slice(cursorPosition, cursorPosition + 1);
    const needsSpace = nextChar && !/[\s\.,;:!\?)\]]/.test(nextChar);
    const insertion = medication + (needsSpace ? ' ' : '');
    const newContent = 
      currentContent.slice(0, wordStart) + 
      insertion + 
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
        const newCursorPos = wordStart + insertion.length;
        setCursorSafe(textarea, newCursorPos);
      }
    }, 0);
  };

  const handlePhysicalExamSelect = (finding: string) => {
    if (!activePhysicalExamAutocomplete) return;
    
    const { sectionId, cursorPosition, wordStart } = activePhysicalExamAutocomplete;
    const currentContent = noteData.content[sectionId] || '';
    
    // Replace the current word with the selected finding
    const nextChar = currentContent.slice(cursorPosition, cursorPosition + 1);
    const needsSpace = nextChar && !/[\s\.,;:!\?)\]]/.test(nextChar);
    const insertion = finding + (needsSpace ? ' ' : '');
    const newContent = 
      currentContent.slice(0, wordStart) + 
      insertion + 
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
        const newCursorPos = wordStart + insertion.length;
        setCursorSafe(textarea, newCursorPos);
      }
    }, 0);
  };

  const handleConsultationReasonSelect = (reason: string) => {
    if (!activeConsultationReasonAutocomplete) return;
    
    const { sectionId, cursorPosition, wordStart } = activeConsultationReasonAutocomplete;
    const currentContent = noteData.content[sectionId] || '';
    
    // Replace the current word with the selected reason
    const nextChar = currentContent.slice(cursorPosition, cursorPosition + 1);
    const needsSpace = nextChar && !/[\s\.,;:!\?)\]]/.test(nextChar);
    const insertion = reason + (needsSpace ? ' ' : '');
    const newContent = 
      currentContent.slice(0, wordStart) + 
      insertion + 
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
        const newCursorPos = wordStart + insertion.length;
        setCursorSafe(textarea, newCursorPos);
      }
    }, 0);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autocompleteTimeoutRef.current) {
        clearTimeout(autocompleteTimeoutRef.current);
      }
    };
  }, []);

  // Recompute anchored autocomplete positions on scroll/resize to keep popups stuck to textarea
  useEffect(() => {
    const reposition = () => {
      const update = <T extends { sectionId: string; position: { top: number; left: number; width?: number } }>(
        active: T | null,
        setter: React.Dispatch<React.SetStateAction<T | null>>
      ) => {
        if (!active) return;
        const textarea = document.querySelector(`[data-section-id="${active.sectionId}"]`) as HTMLTextAreaElement | null;
        if (!textarea) return;
        const anchored = calculateAnchoredPosition(textarea);
        setter(prev => {
          if (!prev) return prev as any;
          if (prev.sectionId !== active.sectionId) return prev;
          return { ...prev, position: { top: anchored.top, left: anchored.left, width: textarea.clientWidth } } as T;
        });
      };

      update(activeAutocomplete, setActiveAutocomplete);
      update(activeMedicalAutocomplete, setActiveMedicalAutocomplete);
      update(activeAllergyAutocomplete, setActiveAllergyAutocomplete);
      update(activeSocialHistoryAutocomplete, setActiveSocialHistoryAutocomplete);
      update(activeMedicationAutocomplete, setActiveMedicationAutocomplete);
      update(activePhysicalExamAutocomplete, setActivePhysicalExamAutocomplete);
      update(activeConsultationReasonAutocomplete, setActiveConsultationReasonAutocomplete);
    };

    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    document.addEventListener('selectionchange', reposition);
    window.addEventListener('keydown', reposition);
    window.addEventListener('keyup', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
      document.removeEventListener('selectionchange', reposition);
      window.removeEventListener('keydown', reposition);
      window.removeEventListener('keyup', reposition);
    };
  }, [
    activeAutocomplete,
    activeMedicalAutocomplete,
    activeAllergyAutocomplete,
    activeSocialHistoryAutocomplete,
    activeMedicationAutocomplete,
    activePhysicalExamAutocomplete,
    activeConsultationReasonAutocomplete
  ]);
  

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

  // AI dictation and processing (medications only for now)
  const { isListening: aiIsListening, finalTranscript: aiFinalTranscript, error: aiError, startDictation: startAiDictation, stopDictation: stopAiDictation } = useDictation();
  const [aiActiveSectionId, setAiActiveSectionId] = useState<string | null>(null);
  const [aiProcessingSectionId, setAiProcessingSectionId] = useState<string | null>(null);
  const [aiAwaitingProcess, setAiAwaitingProcess] = useState(false);
  const lastProcessedRef = useRef<string>("");

  const setCursorSafe = (ta: HTMLTextAreaElement, pos: number) => {
    if (!ta || typeof ta.setSelectionRange !== 'function') return;
    const len = (ta.value || '').length;
    const p = Math.max(0, Math.min(pos, len));
    ta.setSelectionRange(p, p);
  };

  const insertTextAtCaretInSection = useCallback((sectionId: string, text: string) => {
    const textarea = document.querySelector(`[data-section-id="${sectionId}"]`) as HTMLTextAreaElement | null;
    const currentContent = noteData.content[sectionId] || '';
    if (!textarea) {
      // Fallback: append at end
      const newContent = currentContent + (currentContent ? '\n' : '') + text;
      setNoteData(prev => ({ ...prev, content: { ...prev.content, [sectionId]: newContent } }));
      return;
    }
    const start = textarea.selectionStart ?? currentContent.length;
    const end = textarea.selectionEnd ?? start;
    const newContent = currentContent.slice(0, start) + text + currentContent.slice(end);
    setNoteData(prev => ({ ...prev, content: { ...prev.content, [sectionId]: newContent } }));
    // Restore focus and caret after React update
    setTimeout(() => {
      const ta = document.querySelector(`[data-section-id="${sectionId}"]`) as HTMLTextAreaElement | null;
      if (ta) {
        ta.focus();
        const newPos = start + text.length;
        setCursorSafe(ta, newPos);
      }
    }, 0);
  }, [noteData.content, setNoteData]);

  // === PMH merge utilities ===
  const parsePmhStructured = (text: string) => {
    const lines = (text || '').split('\n');
    const items: Array<{ title: string; details: string[] }> = [];
    let current: { title: string; details: string[] } | null = null;
    const numberRe = /^\s*(\d+)\)\s+(.*\S)\s*$/;
    const detailRe = /^\s{5}-\s+(.*\S)\s*$/; // exactly 5 spaces + "- "
    for (const raw of lines) {
      const line = raw.replace(/\s+$/g, '');
      const mNum = line.match(numberRe);
      if (mNum) {
        if (current) items.push(current);
        current = { title: mNum[2], details: [] };
        continue;
      }
      const mDet = line.match(detailRe);
      if (mDet && current) {
        current.details.push(mDet[1]);
        continue;
      }
      // Ignore other lines silently (keeps parser robust)
    }
    if (current) items.push(current);
    return items;
  };

  const normalizeTitle = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  const normalizeDetail = (s: string) => s.replace(/\s+/g, ' ').trim();

  const formatPmhStructured = (items: Array<{ title: string; details: string[] }>) => {
    const out: string[] = [];
    items.forEach((it, idx) => {
      out.push(`${idx + 1}) ${it.title}`);
      for (const d of it.details) {
        out.push(`     - ${d}`);
      }
    });
    return out.join('\n');
  };

  // Normalize a medication list into one-per-line: "Drug dose unit freq"
  const normalizeMedicationList = (text: string) => {
    if (!text) return '';
    const unitMap: Array<[RegExp, string]> = [
      [/\bmilligrams?\b/gi, 'mg'],
      [/\bmilligram\b/gi, 'mg'],
      [/\bgrams?\b/gi, 'g'],
      [/\bmicrograms?\b/gi, 'mcg'],
    ];
    const freqMap: Array<[RegExp, string]> = [
      [/\btwice daily\b/gi, 'BID'],
      [/\bonce daily\b/gi, 'daily'],
      [/\bthree times a week\b/gi, '3x/week'],
      [/\bthree times daily\b/gi, 'TID'],
      [/\bfour times daily\b/gi, 'QID'],
    ];
    const split = text
      .replace(/\s+/g, ' ')
      .split(/(?:\n|,|;|\band\b)+/i)
      .map(s => s.trim())
      .filter(Boolean);
    const items: string[] = [];
    const seen = new Set<string>();
    for (let raw of split) {
      let s = raw;
      for (const [re, rep] of unitMap) s = s.replace(re, rep);
      for (const [re, rep] of freqMap) s = s.replace(re, rep);
      // Normalize spacing like "mgdaily" -> "mg daily"
      s = s.replace(/(mg|mcg|g)(?=\w)/gi, '$1 ').replace(/\s{2,}/g, ' ').trim();
      // Capitalize first token (drug name)
      s = s.replace(/^([a-z])/, m => m.toUpperCase());
      if (!s) continue;
      if (!seen.has(s.toLowerCase())) {
        seen.add(s.toLowerCase());
        items.push(s);
      }
    }
    return items.join('\n');
  };

  const mergePmh = (existingText: string, incomingText: string) => {
    const existing = parsePmhStructured(existingText);
    const incoming = parsePmhStructured(incomingText);
    if (incoming.length === 0) return null; // nothing to merge
    if (existing.length === 0) return formatPmhStructured(incoming);

    const indexByNormTitle = new Map<string, number>();
    existing.forEach((it, i) => indexByNormTitle.set(normalizeTitle(it.title), i));

    for (const inc of incoming) {
      const key = normalizeTitle(inc.title);
      const idx = indexByNormTitle.get(key);
      if (idx == null) {
        // New diagnosis -> append to end
        existing.push({ title: inc.title, details: [...inc.details] });
        indexByNormTitle.set(key, existing.length - 1);
      } else {
        // Merge details: append any new ones not present (preserve order)
        const cur = existing[idx];
        const have = new Set(cur.details.map(normalizeDetail));
        for (const d of inc.details) {
          const nd = normalizeDetail(d);
          if (!have.has(nd)) {
            cur.details.push(d);
            have.add(nd);
          }
        }
      }
    }
    // Keep existing order; just renumber when formatting
    return formatPmhStructured(existing);
  };

  const handleAiToggleForSection = (sectionId: string) => {
    // Ensure textarea is focused for correct caret position
    const textarea = document.querySelector(`[data-section-id="${sectionId}"]`) as HTMLTextAreaElement | null;
    if (textarea) textarea.focus();

    if (aiActiveSectionId !== sectionId) {
      // Start listening for this section
      setAiActiveSectionId(sectionId);
      setAiAwaitingProcess(false);
      startAiDictation();
      const sec = sections.find(s => s.id === sectionId);
      const isLabs = !!sec && (sec.type === 'labs' || sec?.name?.toLowerCase().includes('lab') || sec?.name?.toLowerCase().includes('laboratory'));
      const isPmh = !!sec && (sec.type === 'pastMedicalHistory' || sec?.name?.toLowerCase().includes('past medical history') || sec?.name?.toLowerCase().includes('pmh'));
      toast({ title: "AI listening", description: isLabs ? "Dictate lab results. Click AI again to stop." : isPmh ? "Dictate Past Medical History. Click AI again to stop." : "Dictate medications. Click AI again to stop." });
    } else {
      // Stop and begin processing
      stopAiDictation();
      setAiAwaitingProcess(true);
      setAiProcessingSectionId(sectionId);
    }
  };

  // When dictation stops and we have a final transcript, send to AI and insert
  useEffect(() => {
    const doProcess = async () => {
      const sectionId = aiProcessingSectionId;
      const dictation = (aiFinalTranscript || '').trim();
      if (!sectionId || !aiAwaitingProcess) return;
      if (!dictation) {
        toast({ title: "No dictation captured", description: "Try again and speak clearly.", variant: "destructive" });
        setAiProcessingSectionId(null);
        setAiActiveSectionId(null);
        setAiAwaitingProcess(false);
        return;
      }
      // Prevent reprocessing identical transcript
      const key = sectionId + '::' + dictation;
      if (lastProcessedRef.current === key) return;
      lastProcessedRef.current = key;
      try {
        // Decide endpoint by section type/name
        const sec = sections.find(s => s.id === sectionId);
        const isLabs = !!sec && (sec.type === 'labs' || sec.name.toLowerCase().includes('lab') || sec.name.toLowerCase().includes('laboratory'));
        const isMeds = !!sec && (sec.type === 'medications' || sec.name.toLowerCase().includes('medication') || sec.name.toLowerCase().includes('meds'));
        const isPmh = !!sec && (sec.type === 'pastMedicalHistory' || sec.name.toLowerCase().includes('past medical history') || sec.name.toLowerCase().includes('pmh'));
        const endpoint = isLabs ? '/api/ai/labs' : isPmh ? '/api/ai/pmh' : '/api/ai/medications';
        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dictation })
        });
        if (!resp.ok) {
          throw new Error((await resp.json().catch(() => ({ message: 'AI service error' }))).message || 'AI service error');
        }
        const data = await resp.json();
        const cleaned: string = (data?.text || '').toString();
        if (!cleaned) throw new Error('Empty AI response');
        if (isPmh) {
          const currentContent = noteData.content[sectionId] || '';
          const merged = mergePmh(currentContent, cleaned);
          if (merged) {
            setNoteData(prev => ({ ...prev, content: { ...prev.content, [sectionId]: merged } }));
            // Focus to end of section after merge
            setTimeout(() => {
              const ta = document.querySelector(`[data-section-id="${sectionId}"]`) as HTMLTextAreaElement | null;
              if (ta) {
                ta.focus();
                setCursorSafe(ta, (ta.value || '').length);
              }
            }, 0);
            toast({ title: 'PMH updated', description: 'Merged into Past Medical History.' });
          } else {
            // If parsing failed, fall back to caret insert
            insertTextAtCaretInSection(sectionId, cleaned);
            toast({ title: 'PMH inserted', description: 'Added to Past Medical History.' });
          }
        } else {
          if (isMeds) {
            const normalized = normalizeMedicationList(cleaned);
            insertTextAtCaretInSection(sectionId, normalized || cleaned);
            toast({ title: 'Medications inserted', description: 'Medication list normalized to one per line.' });
          } else {
            insertTextAtCaretInSection(sectionId, cleaned);
            toast({ title: 'Labs inserted', description: 'AI parsed and formatted your lab results.' });
          }
        }
      } catch (err: any) {
        // Fallback: insert raw dictation at caret if AI fails or returns empty
        if (dictation) {
          insertTextAtCaretInSection(sectionId!, dictation);
          toast({ title: 'Inserted raw dictation', description: 'AI unavailable; used your original text.' });
        } else {
          toast({ title: "AI error", description: err?.message || 'Failed to process dictation', variant: 'destructive' });
        }
      } finally {
        setAiProcessingSectionId(null);
        setAiActiveSectionId(null);
        setAiAwaitingProcess(false);
      }
    };
    if (!aiIsListening && aiAwaitingProcess) {
      void doProcess();
    }
  }, [aiIsListening, aiAwaitingProcess, aiProcessingSectionId, aiFinalTranscript, insertTextAtCaretInSection, toast, sections]);

  // Surface dictation errors
  useEffect(() => {
    if (aiError) {
      toast({ title: 'Dictation error', description: aiError, variant: 'destructive' });
    }
  }, [aiError, toast]);

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
        patientName: "",
        patientMrn: "",
        patientDob: "",
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
      setIsDirty(false);
      onDirtyChange?.(false);
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  const handleFinalize = async () => {
    try {
      const notePayload = {
        title: noteData.title,
        patientName: "",
        patientMrn: "",
        patientDob: "",
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
      setIsDirty(false);
      onDirtyChange?.(false);
    } catch (error) {
      console.error("Error finalizing note:", error);
    }
  };

  const buildPlainText = () => {
    let text = `${noteData.title}\n`;
    text += `${'='.repeat(noteData.title.length)}\n\n`;
    // Sections
    sections.forEach((section) => {
      const content = noteData.content[section.id] || '';
      if (content.trim()) {
        text += `${section.name.toUpperCase()}:\n`;
        text += `-`.repeat(section.name.length + 1) + `\n`;
        text += `${content.trim()}\n\n`;
      }
    });
    text = text.trim();
    // No app signature or date in exported text
    return text;
  };

  const exportAsTxt = () => {
    const exportText = buildPlainText();
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
      toast({ title: "✓ Exported", description: "Saved as .txt" });
    } catch (error) {
      console.error("Error exporting TXT:", error);
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  const exportAsDoc = () => {
    // Word-compatible HTML (.doc)
    const content = buildPlainText()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${noteData.title}</title></head><body style="font-family:Calibri,Arial,sans-serif;white-space:normal;">${content}</body></html>`;
    try {
      const blob = new Blob([html], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${noteData.title.replace(/\s+/g, '_').replace(/[^\w-]/g, '') || 'medical_note'}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "✓ Exported", description: "Saved as Word (.doc)" });
    } catch (error) {
      console.error("Error exporting DOC:", error);
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  const exportAsPdf = () => {
    // Print-friendly PDF via browser print dialog
    const win = window.open('', '_blank');
    if (!win) return;
    const safeTitle = noteData.title.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const sectionsHtml = sections.map(s => {
      const c = (noteData.content[s.id] || '').trim();
      if (!c) return '';
      return `<h2 style="font-size:16px;margin:16px 0 8px;">${s.name}</h2><div style="white-space:pre-wrap;">${c.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>`;
    }).join('');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${safeTitle}</title>
      <style>body{font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial;line-height:1.5;padding:24px;color:#111} h1{font-size:20px;margin:0 0 8px} hr{margin:16px 0;border:none;border-top:1px solid #ddd}</style>
    </head><body>
      <h1>${safeTitle}</h1>
      <hr/>
      ${sectionsHtml}
    </body></html>`);
    win.document.close();
    win.focus();
    // Delay print to allow render
    setTimeout(() => { win.print(); }, 100);
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

    // Remove trailing newlines; do not append app signature or date
    copyText = copyText.trim();

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
        setCursorSafe(textarea, content.length);
      }
    }, 300); // Increased timeout to ensure smooth scroll completes first
  };

  const getSectionEmojiIcon = (sectionId: string, sectionName?: string, sectionType?: string) => {
    const name = sectionName?.toLowerCase() || '';
    const type = sectionType;
    
    // ICU systems specific
    if (name.includes('neuro')) return '🧠';
    if (name.includes('cardio') || name.includes('cv') || name.includes('cardiovascular')) return '🫀';
    if (name.includes('resp') || name.includes('pulm') || name.includes('respiratory') || name.includes('pulmonary')) return '🫁';
    if (name.includes('gastro') || name === 'gi' || name.includes('abdomen') || name.includes('abdominal')) return '🍽️';
    if (name.includes('nephro') || name.includes('renal') || name.includes('metabolic')) return '💧';
    if (name.includes('infect')) return '🦠';
    if (name.includes('hema') || name.includes('hematology')) return '🩸';

    // General sections
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
      {/* Top Bar - redesigned */}
      <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-900 dark:backdrop-blur-none border-b border-slate-200/60 dark:border-gray-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <Input
            value={noteData.title}
            onChange={(e) => setNoteData(prev => ({ ...prev, title: e.target.value }))}
            className="text-base sm:text-lg font-medium border-none p-0 h-auto focus-visible:ring-0 bg-transparent text-gray-900 dark:text-gray-100 min-w-0"
            placeholder={t('notes.title')}
            data-testid="input-note-title"
          />
          <div className="hidden md:flex items-center gap-2">
            <Select value={noteData.templateType} onValueChange={handleTemplateChange}>
              <SelectTrigger className="h-8 w-[170px]" data-testid="header-select-template">
                <SelectValue placeholder={t('notes.template')} />
              </SelectTrigger>
              <SelectContent>
                {(templates || []).map((t) => (
                  <SelectItem key={t.id} value={t.type}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Removed Open Recent dropdown from header */}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {timeLeft && (
            <div className="hidden sm:flex items-center text-[11px] px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300" title="Auto-deletes 48 hours after save">
              <Clock size={12} className="mr-1" /> {timeLeft}
            </div>
          )}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-xs px-3"
            data-testid="button-save-note"
          >
            <Save size={14} className="mr-1.5" />
            {isSaving ? t('common.loading') : t('common.save')}
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="text-xs px-3"
            data-testid="button-copy-note"
          >
            <Copy size={14} className="mr-1.5" />
            Copy
          </Button>
          {/* Export menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline"
                size="sm"
                className="text-xs px-3"
                data-testid="button-export-note"
              >
                <Download size={14} className="mr-1.5" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportAsTxt}>Plain Text (.txt)</DropdownMenuItem>
              <DropdownMenuItem onClick={exportAsDoc}>Word (.doc)</DropdownMenuItem>
              <DropdownMenuItem onClick={exportAsPdf}>PDF (print)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onRequestReturn && onRequestReturn()}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-xs px-3"
            data-testid="button-return-welcome"
          >
            {t('common.back')}
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
          
          {/* Patient Information Header removed */}

          {/* Note Sections */}
          <div className="bg-white/90 backdrop-blur-sm dark:bg-gray-800 dark:backdrop-blur-none rounded-lg border border-slate-200/60 dark:border-gray-700 shadow-sm">
          {sections.map((section, index) => (
            <div key={section.id} className={`section-card ${index > 0 ? 'border-t border-slate-200/60 dark:border-gray-700' : ''}`} data-section-id={section.id}>
              {/* Hide header for blank note template */}
              {selectedTemplate?.type !== 'blank' && (
                <div className="px-4 py-3 bg-slate-50/50 supports-[backdrop-filter]:backdrop-blur-sm dark:bg-gray-800/60 dark:supports-[backdrop-filter]:bg-gray-800/60 dark:backdrop-blur-none transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-wrap gap-2">
                    <h4 className="text-sm font-medium text-gray-800 dark:text-gray-100 flex items-center space-x-2 transition-colors">
                      <span className="text-gray-500 dark:text-gray-400">{getSectionIcon(section.id)}</span>
                      <span>{section.name}</span>
                      {section.required && <span className="text-red-500 text-xs">*</span>}
                      {/* Left-aligned AI button right after the section name (medications, labs, PMH) */}
                      {(
                        section.type === 'medications' ||
                        section.name.toLowerCase().includes('medications') ||
                        section.name.toLowerCase().includes('current medications') ||
                        section.name.toLowerCase().includes('meds') ||
                        section.type === 'labs' ||
                        section.name.toLowerCase().includes('lab') ||
                        section.name.toLowerCase().includes('laboratory') ||
                        section.type === 'pastMedicalHistory' ||
                        section.name.toLowerCase().includes('past medical history') ||
                        section.name.toLowerCase().includes('pmh')
                      ) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              size="sm"
                              variant={aiActiveSectionId === section.id ? 'default' : 'outline'}
                              onClick={() => handleAiToggleForSection(section.id)}
                              className={`ml-2 flex items-center gap-1 text-xs px-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-600)] focus-visible:ring-offset-2 ${aiActiveSectionId === section.id ? 'bg-[color:var(--brand-700)] text-white' : ''}`}
                              aria-pressed={aiActiveSectionId === section.id}
                              aria-busy={aiProcessingSectionId === section.id}
                              aria-label={aiActiveSectionId === section.id ? 'Stop AI dictation' : 'Start AI dictation'}
                              data-testid={`ai-button-${section.id}`}
                              disabled={aiProcessingSectionId === section.id}
                            >
                              {aiProcessingSectionId === section.id ? (
                                <Loader2 size={12} className="animate-spin" aria-hidden="true" />
                              ) : (
                                <Sparkles size={12} className={aiActiveSectionId === section.id ? 'animate-pulse' : ''} aria-hidden="true" />
                              )}
                              AI
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {aiActiveSectionId === section.id ? 'Stop dictation' : 'Start dictation'}
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {(aiActiveSectionId === section.id || aiProcessingSectionId === section.id) && (
                        <span aria-live="polite" className="sr-only">
                          {aiProcessingSectionId === section.id
                            ? (section.type === 'pastMedicalHistory' || section.name.toLowerCase().includes('past medical history') || section.name.toLowerCase().includes('pmh')
                                ? 'Processing PMH'
                                : (section.type === 'labs' || section.name.toLowerCase().includes('lab') || section.name.toLowerCase().includes('laboratory')
                                  ? 'Processing labs'
                                  : 'Processing medications'))
                            : (section.type === 'pastMedicalHistory' || section.name.toLowerCase().includes('past medical history') || section.name.toLowerCase().includes('pmh')
                                ? 'Listening for Past Medical History'
                                : (section.type === 'labs' || section.name.toLowerCase().includes('lab') || section.name.toLowerCase().includes('laboratory')
                                  ? 'Listening for lab results'
                                  : 'Listening for medications'))}
                        </span>
                      )}
                    </h4>
                    <div className="flex items-center space-x-2">
                      {/* Smart options header chips when caret is inside a phrase */}
                      {isUnifiedSmartPhraseOverlayEnabled() && (() => {
                        if (!activePhraseHint || activePhraseHint.sectionId !== section.id) return null;
                        const region = phraseRegions.find(r => r.id === activePhraseHint.regionId);
                        if (!region || !region.phrase?.content) return null;
                        const parsed = parseSmartPhraseContent(region.phrase.content);
                        const slots = parsed.slots;
                        if (!slots || slots.length === 0) return null;
                        return (
                          <div className="flex items-center gap-1 ml-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs px-2"
                              onClick={() => {
                                const ta = document.querySelector(`[data-section-id="${section.id}"]`) as HTMLTextAreaElement | null;
                                const rect = ta?.getBoundingClientRect();
                                setActiveOverlay({
                                  sectionId: section.id,
                                  caretRect: rect ? { top: rect.top, left: rect.left, bottom: rect.bottom, right: rect.right } : null,
                                  content: region.phrase.content,
                                  regionStart: region.start,
                                  regionLength: region.length,
                                  regionId: region.id,
                                  phrase: region.phrase,
                                  mode: 'edit',
                                });
                              }}
                            >
{t('smart.smartOptions')}
                            </Button>
                            {slots.map((slot, idx) => {
                              const sel = region.selections?.[slot.id];
                              const isSelected = sel != null && sel !== '';
                              const label = isSelected ? (typeof sel === 'string' ? sel : (sel instanceof Date ? sel.toISOString().slice(0,10) : String(sel))) : (slot.label || slot.placeholder || 'option');
                              return (
                                <div key={slot.id} className="relative">
                                  <Badge
                                    variant="outline"
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const ta = document.querySelector(`[data-section-id=\"${section.id}\"]`) as HTMLTextAreaElement | null; const rect = ta?.getBoundingClientRect(); setActiveOverlay({ sectionId: section.id, caretRect: rect ? { top: rect.top, left: rect.left, bottom: rect.bottom, right: rect.right } : null, content: region.phrase.content, regionStart: region.start, regionLength: region.length, regionId: region.id, phrase: region.phrase, mode: 'edit' }); }}}
                                    className={`text-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-900 ${isSelected ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}
                                    onClick={() => {
                                      const ta = document.querySelector(`[data-section-id="${section.id}"]`) as HTMLTextAreaElement | null;
                                      const rect = ta?.getBoundingClientRect();
                                      setActiveOverlay({
                                        sectionId: section.id,
                                        caretRect: rect ? { top: rect.top, left: rect.left, bottom: rect.bottom, right: rect.right } : null,
                                        content: region.phrase.content,
                                        regionStart: region.start,
                                        regionLength: region.length,
                                        regionId: region.id,
                                        phrase: region.phrase,
                                        mode: 'edit',
                                      });
                                    }}
                                  >
                                    {label}
                                  </Badge>
                                  <button
                                    aria-label="Clear selection"
                                    className="absolute -top-2 -right-2 bg-white border rounded-full p-0.5 text-gray-500 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-900"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Clear this slot and update text/metadata
                                      const parsed2 = parseSmartPhraseContent(region.phrase.content);
                                      const selections = { ...(region.selections || {}) } as Record<string, any>;
                                      delete selections[slot.id];
                                      const records: Record<string, string> = {};
                                      parsed2.slots.forEach(s => {
                                        const v = selections[s.id];
                                        records[s.id] = v == null ? '' : (typeof v === 'string' ? v : String(v));
                                      });
                                      const out = reconstructPhraseWithSelections(parsed2, records);
                                      // Replace region text in section content
                                      const currentContent = noteData.content[section.id] || '';
                                      const start = region.start;
                                      const end = start + region.length;
                                      const newContent = currentContent.slice(0, start) + out + currentContent.slice(end);
                                      setNoteData(prev => ({ ...prev, content: { ...prev.content, [section.id]: newContent } }));
                                      setPhraseRegions(prev => prev.map(r => r.id === region.id ? { ...r, length: out.length, selections } : r));
                                    }}
                                  >
                                    <X size={10} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
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
                        {/* AI button moved next to section name (left side). Keep live status here for SR. */}
                        <span aria-live="polite" className="sr-only">
                          {aiProcessingSectionId === section.id
                            ? 'Processing medications'
                            : aiActiveSectionId === section.id
                              ? 'Listening for medications'
                              : 'AI idle'}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleMedicationReorder(section.id)}
                          className="flex items-center gap-1 text-xs px-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-600)] focus-visible:ring-offset-2"
                          data-testid={`manual-reorder-button-${section.id}`}
                          title="Click medications in order to rearrange"
                          aria-label="Open manual medication reordering"
                        >
                          <ArrowUpDown size={12} aria-hidden="true" />
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
                          className="flex items-center gap-1 text-xs px-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-600)] focus-visible:ring-offset-2"
                          data-testid={`smart-reorder-button-${section.id}`}
                          title="Automatically order by therapeutic category"
                          aria-label="Apply smart medication reorder automatically"
                        >
                          <Shuffle size={12} aria-hidden="true" />
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
                    </div>
                    <div className="flex items-center space-x-1 ml-auto">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs text-gray-500 hover:text-gray-700"
                        onClick={() => moveSectionUp(section.id)}
                        disabled={sections.findIndex(s => s.id === section.id) === 0}
                        data-testid={`button-move-section-up-${section.id}`}
                        aria-label="Move section up"
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
                        aria-label="Move section down"
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
                          aria-label="Remove section"
                        >
                          <X size={12} />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="text-xs text-gray-500 hover:text-gray-700" aria-label="Expand section">
                        <Expand size={12} />
                      </Button>
                    </div>
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

                    {activeOverlay && activeOverlay.sectionId === section.id && (
                    <SmartPhraseOverlay
                      open={true}
                      caretRect={activeOverlay.caretRect ? new DOMRect(activeOverlay.caretRect.left, activeOverlay.caretRect.top, 1, 1) : null}
                      content={activeOverlay.content}
                      initialSelections={phraseRegions.find(r => r.id === activeOverlay.regionId)?.selections || {}}
                      // Focus first slot by default when opened from header button
                      initialActiveSlotId={undefined}
                      onAssemble={(output, selections) => {
                        const currentContent = noteData.content[activeOverlay.sectionId] || '';
                        const start = activeOverlay.regionStart;
                        const end = start + activeOverlay.regionLength;
                        const adjusted = applyConditionalLeadingSpace(activeOverlay.sectionId, start, output);
                        const newContent = currentContent.slice(0, start) + adjusted + currentContent.slice(end);
                        setNoteData(prev => ({
                          ...prev,
                          content: { ...prev.content, [activeOverlay.sectionId]: newContent }
                        }));
                        setPhraseRegions(prev => prev.map(r => r.id === activeOverlay.regionId ? { ...r, length: adjusted.length, selections } : r));
                      }}
                      onClose={(reason) => {
                        if (!activeOverlay) return;
                        if ((reason === 'clickOutside' || reason === 'escape' || reason === 'cancel') && activeOverlay.mode === 'insert') {
                          // Remove the pre-inserted template and metadata only when in insert mode
                          const currentContent = noteData.content[activeOverlay.sectionId] || '';
                          const start = activeOverlay.regionStart;
                          const end = start + activeOverlay.regionLength;
                          const newContent = currentContent.slice(0, start) + currentContent.slice(end);
                          setNoteData(prev => ({
                            ...prev,
                            content: { ...prev.content, [activeOverlay.sectionId]: newContent }
                          }));
                          setPhraseRegions(prev => prev.filter(r => r.id !== activeOverlay.regionId));
                        }
                        setActiveOverlay(null);
                      }}
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
                      textareaRef={{ current: document.querySelector(`[data-section-id="${section.id}"]`) as HTMLTextAreaElement }}
                    />
                  )}
                  
                  {activeSocialHistoryAutocomplete && activeSocialHistoryAutocomplete.sectionId === section.id && (
                    <SocialHistoryAutocomplete
                      query={activeSocialHistoryAutocomplete.query}
                      position={activeSocialHistoryAutocomplete.position}
                      onSelect={handleSocialHistorySelect}
                      onClose={() => setActiveSocialHistoryAutocomplete(null)}
                      sectionId={section.id}
                      textareaRef={{ current: document.querySelector(`[data-section-id="${section.id}"]`) as HTMLTextAreaElement }}
                    />
                  )}
                  
                  {activeMedicationAutocomplete && activeMedicationAutocomplete.sectionId === section.id && (
                    <MedicationAutocomplete
                      query={activeMedicationAutocomplete.query}
                      position={activeMedicationAutocomplete.position}
                      onSelect={handleMedicationSelect}
                      onClose={() => setActiveMedicationAutocomplete(null)}
                      sectionId={section.id}
                      textareaRef={{ current: document.querySelector(`[data-section-id="${section.id}"]`) as HTMLTextAreaElement }}
                    />
                  )}

                  {activePhysicalExamAutocomplete && activePhysicalExamAutocomplete.sectionId === section.id && (
                    <PhysicalExamAutocomplete
                      query={activePhysicalExamAutocomplete.query}
                      position={activePhysicalExamAutocomplete.position}
                      onSelect={handlePhysicalExamSelect}
                      onClose={() => setActivePhysicalExamAutocomplete(null)}
                      sectionId={section.id}
                      textareaRef={{ current: document.querySelector(`[data-section-id="${section.id}"]`) as HTMLTextAreaElement }}
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
                      textareaRef={{ current: document.querySelector(`[data-section-id="${section.id}"]`) as HTMLTextAreaElement }}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
          </div>

          {/* Bottom action bar removed; actions consolidated in header */}
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
