// Smart Phrase Unified Schema for the new overlay system
// Supports single-select options (all optional), nested options with arbitrary depth,
// date options (YYYY-MM-DD format), and metadata for re-editing

import { z } from 'zod';

// Slot types supported in the unified overlay system
export type SmartSlotType = 'text' | 'single-select' | 'date' | 'nested';

// Base interface for all slot options
export interface SlotOption {
  id: string;
  label: string;
  value: string;
  children?: SlotOption[]; // For nested options
}

// Slot option schema (recursive)
export const SlotOptionSchema: z.ZodType<SlotOption> = z.lazy(() => z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  children: z.array(SlotOptionSchema).optional(),
}));

// Slot definition schema
export const SlotDefinitionSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'single-select', 'date', 'nested']),
  label: z.string().optional(),
  placeholder: z.string().optional(), // e.g., "{medication}", "{date}"
  options: z.array(SlotOptionSchema).optional(),
  required: z.boolean().default(false), // All slots are optional by default per requirements
  settings: z.object({
    dateFormat: z.string().default('YYYY-MM-DD'), // Locale-based format
    allowEmpty: z.boolean().default(true) // Allow X button to clear selection
  }).optional()
});

export type SlotDefinition = z.infer<typeof SlotDefinitionSchema>;

// Smart phrase schema with slot definitions
export const SmartPhraseSchema = z.object({
  id: z.string(),
  trigger: z.string(),
  content: z.string(), // Template with placeholders like {medication}, {date}, etc.
  description: z.string().optional(),
  category: z.string().optional(),
  slots: z.array(SlotDefinitionSchema), // Array of interactive slot definitions
  
  // Metadata for re-editing and structured representation
  metadata: z.object({
    version: z.string().default('1.0'),
    supportsReEdit: z.boolean().default(true),
    exportAsPlainText: z.boolean().default(true) // Export as plain text for copy/export
  }).optional()
});

export type SmartPhraseDefinition = z.infer<typeof SmartPhraseSchema>;

// Selection state for the overlay system
export const SlotSelectionSchema = z.object({
  slotId: z.string(),
  value: z.union([
    z.string(), // For single-select and text
    z.date(), // For date selections
    z.null() // For cleared/empty selections
  ]),
  displayText: z.string().optional(), // Computed display text for the selection
  path: z.array(z.string()).optional() // For nested selections, the path from root to selected item
});

export type SlotSelection = z.infer<typeof SlotSelectionSchema>;

// Phrase instance with selections (for re-editing and structured representation)
export const PhraseInstanceSchema = z.object({
  phraseId: z.string(),
  selections: z.array(SlotSelectionSchema),
  insertedText: z.string(), // The final text that was inserted
  createdAt: z.string(),
  lastModified: z.string().optional()
});

export type PhraseInstance = z.infer<typeof PhraseInstanceSchema>;

// Phrase parsing result
export const ParsedPhraseSchema = z.object({
  staticParts: z.array(z.string()), // Text segments between slots
  slots: z.array(SlotDefinitionSchema), // Ordered slots found in the phrase
  template: z.string() // Original template with placeholders
});

export type ParsedPhrase = z.infer<typeof ParsedPhraseSchema>;

// Legacy compatibility - convert existing elements to new slot format
export function convertLegacyElements(elements: any[]): SlotDefinition[] {
  if (!Array.isArray(elements)) return [];
  
  return elements.map((element, index) => {
    const slot: SlotDefinition = {
      id: element.id || `slot-${index}`,
      type: convertLegacyType(element.type),
      label: element.label || '',
      placeholder: element.placeholder || `{${element.id || `slot-${index}`}}`,
      required: false, // All slots are optional per requirements
    };

    // Convert options if present
    if (element.options && Array.isArray(element.options)) {
      slot.options = element.options.map((option: any, optIndex: number) => ({
        id: option.id || `option-${optIndex}`,
        label: option.label || option.value || '',
        value: option.value || option.label || '',
        children: option.children ? convertLegacyOptionsRecursive(option.children) : undefined
      }));
    }

    return slot;
  });
}

function convertLegacyType(legacyType: string): SmartSlotType {
  switch (legacyType) {
    case 'multipicker':
    case 'nested_multipicker':
      return 'single-select'; // All are single-select in new system
    case 'date':
      return 'date';
    default:
      return 'text';
  }
}

function convertLegacyOptionsRecursive(options: any[]): SlotOption[] {
  return options.map((option, index) => ({
    id: option.id || `nested-${index}`,
    label: option.label || option.value || '',
    value: option.value || option.label || '',
    children: option.children ? convertLegacyOptionsRecursive(option.children) : undefined
  }));
}

// Validation helpers
export function validateSlotDefinition(slot: unknown): slot is SlotDefinition {
  try {
    SlotDefinitionSchema.parse(slot);
    return true;
  } catch {
    return false;
  }
}

export function validatePhraseDefinition(phrase: unknown): phrase is SmartPhraseDefinition {
  try {
    SmartPhraseSchema.parse(phrase);
    return true;
  } catch {
    return false;
  }
}
