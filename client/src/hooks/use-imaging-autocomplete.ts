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
    // Generate concise summary text with selected negatives only
    const formattedNegatives = selectedNegatives
      .map(n => n.replace(/^No\s+/i, "no "))
      .join(", ");

    const summary = formattedNegatives
      ? `${study.fullName}: ${formattedNegatives}.`
      : `${study.fullName}.`;

    onInsert(summary);
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

    const negativesToUse = (negatives && negatives.length > 0)
      ? negatives
      : template.negatives;

    const formattedNegatives = negativesToUse
      .map(n => n.replace(/^No\s+/i, "no "))
      .join(", ");

    const summary = formattedNegatives
      ? `${template.fullName}: ${formattedNegatives}.`
      : `${template.fullName}.`;

    return summary;
  }, []);

  return {
    handleImagingSelect,
    formatImagingTemplate
  };
}
