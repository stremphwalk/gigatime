import { useCallback } from "react";
import type { ImagingStudy } from "@/components/imaging-autocomplete";

interface UseImagingAutocompleteProps {
  onInsert: (text: string) => void;
}

export function useImagingAutocomplete({ onInsert }: UseImagingAutocompleteProps) {
  const handleImagingSelect = useCallback((study: ImagingStudy, selectedNegatives: string[]) => {
    // If this is a custom snippet, insert as-is
    if (study.abbreviation === "__CUSTOM__") {
      onInsert(study.fullName);
      return;
    }
    // Generate the formatted text to insert
    let insertText = `${study.fullName} (${study.abbreviation}):\n\n`;
    
    // Add common findings
    insertText += "FINDINGS:\n";
    study.commonFindings.forEach(finding => {
      insertText += `• ${finding}\n`;
    });
    
    // Add selected pertinent negatives if any
    if (selectedNegatives.length > 0) {
      insertText += "\nPERTINENT NEGATIVES:\n";
      selectedNegatives.forEach(negative => {
        insertText += `• ${negative}\n`;
      });
    }
    
    insertText += "\nIMPRESSION:\n[Insert impression here]\n";
    
    onInsert(insertText);
  }, [onInsert]);

  const formatImagingTemplate = useCallback((abbreviation: string, negatives: string[] = []) => {
    // Quick format for common abbreviations when typing
    const commonTemplates: Record<string, { fullName: string; negatives: string[] }> = {
      'CXR': {
        fullName: 'Chest X-Ray',
        negatives: ['No pneumonia', 'No pneumothorax', 'No pleural effusion', 'No cardiomegaly']
      },
      'CT HEAD': {
        fullName: 'CT Head without contrast',
        negatives: ['No intracranial hemorrhage', 'No mass effect', 'No midline shift', 'No acute stroke']
      },
      'ECG': {
        fullName: 'Electrocardiogram',
        negatives: ['No ST elevation', 'No ST depression', 'No T wave inversions', 'No arrhythmias']
      }
    };

    const template = commonTemplates[abbreviation.toUpperCase()];
    if (!template) return null;

    let text = `${template.fullName}:\n\n`;
    text += "FINDINGS:\n";
    text += "• [Insert findings here]\n\n";
    
    if (negatives.length > 0 || template.negatives.length > 0) {
      text += "PERTINENT NEGATIVES:\n";
      const negativesToUse = negatives.length > 0 ? negatives : template.negatives;
      negativesToUse.forEach(negative => {
        text += `• ${negative}\n`;
      });
      text += "\n";
    }
    
    text += "IMPRESSION:\n[Insert impression here]\n";
    
    return text;
  }, []);

  return {
    handleImagingSelect,
    formatImagingTemplate
  };
}
