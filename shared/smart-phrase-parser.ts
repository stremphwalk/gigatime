// Smart Phrase Parser - converts phrase definitions (using slash syntax) 
// into structured token arrays with support for nested options

import { SlotDefinition, SmartSlotType, ParsedPhrase, SlotOption } from './smart-phrase-schema';

// Token types for parsing
type TokenType = 'text' | 'placeholder' | 'slash-options';

interface Token {
  type: TokenType;
  content: string;
  startIndex: number;
  endIndex: number;
  slotId?: string;
}

// Regex patterns for different token types
const PATTERNS = {
  // Matches {placeholder} or {{placeholder}}
  placeholder: /\{(\{?)([^}]+)\}(\}?)/g,
  // Matches /option1/option2/option3/
  slashOptions: /\/([^\/\s]+(?:\/[^\/\s]+)*)\//g,
  // Nested slash pattern for options like /parent/child/grandchild/
  nestedSlash: /\/([^\/]+)(?:\/([^\/]+))*\//g
};

/**
 * Parse a smart phrase content string into tokens
 */
export function parseSmartPhraseContent(content: string): ParsedPhrase {
  const tokens = tokenizeContent(content);
  const slots = extractSlotsFromTokens(tokens);
  const staticParts = extractStaticParts(content, tokens);

  return {
    staticParts,
    slots,
    template: content
  };
}

/**
 * Tokenize the content string into different token types
 */
function tokenizeContent(content: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;

  // Find all pattern matches and sort by position
  const matches: Array<{ type: TokenType; match: RegExpExecArray; pattern: RegExp }> = [];

  // Find placeholder patterns
  let match: RegExpExecArray | null;
  const placeholderPattern = new RegExp(PATTERNS.placeholder.source, 'g');
  while ((match = placeholderPattern.exec(content)) !== null) {
    matches.push({ type: 'placeholder', match, pattern: placeholderPattern });
  }

  // Find slash option patterns
  const slashPattern = new RegExp(PATTERNS.slashOptions.source, 'g');
  while ((match = slashPattern.exec(content)) !== null) {
    matches.push({ type: 'slash-options', match, pattern: slashPattern });
  }


  // Sort matches by position
  matches.sort((a, b) => a.match.index - b.match.index);

  // Create tokens from matches
  matches.forEach((matchInfo, index) => {
    const { type, match } = matchInfo;
    
    // Add text token before this match if there's text
    if (match.index > lastIndex) {
      tokens.push({
        type: 'text',
        content: content.slice(lastIndex, match.index),
        startIndex: lastIndex,
        endIndex: match.index
      });
    }

    // Add the matched token
    tokens.push({
      type,
      content: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      slotId: generateSlotId(type, index)
    });

    lastIndex = match.index + match[0].length;
  });

  // Add remaining text if any
  if (lastIndex < content.length) {
    tokens.push({
      type: 'text',
      content: content.slice(lastIndex),
      startIndex: lastIndex,
      endIndex: content.length
    });
  }

  return tokens;
}

/**
 * Extract slot definitions from tokens
 */
function extractSlotsFromTokens(tokens: Token[]): SlotDefinition[] {
  const slots: SlotDefinition[] = [];

  tokens.forEach((token, index) => {
    if (token.type === 'text') return;

    const slotId = token.slotId || `slot-${index}`;
    
    switch (token.type) {
      case 'placeholder':
        slots.push(createPlaceholderOrDateSlot(token, slotId));
        break;
      case 'slash-options':
        slots.push(createSlashOptionsSlot(token, slotId));
        break;
    }
  });

  return slots;
}

/**
 * Create a placeholder slot (for simple text replacement) or date slot if placeholder is {date}
 */
function createPlaceholderOrDateSlot(token: Token, slotId: string): SlotDefinition {
  // Extract placeholder name from {name} or {{name}}
  const placeholderMatch = token.content.match(/\{(\{?)([^}]+)\}(\}?)/);
  const placeholderName = placeholderMatch ? placeholderMatch[2] : 'text';

  if (/^date$/i.test(placeholderName.trim())) {
    return createDateSlot(token, slotId);
  }

  return {
    id: slotId,
    type: 'text',
    label: placeholderName,
    placeholder: token.content,
    required: false
  };
}

/**
 * Create a slash options slot (single-select with possible nesting)
 */
function createSlashOptionsSlot(token: Token, slotId: string): SlotDefinition {
  // Extract options from /option1/option2/option3/
  const optionsContent = token.content.slice(1, -1); // Remove leading and trailing slashes
  const optionParts = optionsContent.split('/').filter(part => part.trim() !== '');

  // Determine if this is nested based on the structure
  const isNested = detectNestedStructure(optionParts);
  const options = isNested ? parseNestedOptions(optionParts) : parseSimpleOptions(optionParts);

  return {
    id: slotId,
    type: isNested ? 'nested' : 'single-select',
    label: `Options (${optionParts.length} choices)`,
    placeholder: token.content,
    options,
    required: false
  };
}

/**
 * Create a date slot
 */
function createDateSlot(token: Token, slotId: string): SlotDefinition {
  return {
    id: slotId,
    type: 'date',
    label: 'Date',
    placeholder: token.content,
    required: false,
    settings: {
      dateFormat: 'YYYY-MM-DD',
      allowEmpty: true
    }
  };
}

/**
 * Detect if options have nested structure
 * For now, simple heuristic: if any option contains common hierarchy indicators
 */
function detectNestedStructure(options: string[]): boolean {
  const hierarchyIndicators = ['>', '->', ':', '|', '\\'];
  return options.some(option => 
    hierarchyIndicators.some(indicator => option.includes(indicator))
  );
}

/**
 * Parse simple options (flat list)
 */
function parseSimpleOptions(optionParts: string[]): SlotOption[] {
  return optionParts.map((option, index) => ({
    id: `option-${index}`,
    label: option.trim(),
    value: option.trim()
  }));
}

/**
 * Parse nested options with hierarchy
 * Supports syntax like: /parent>child>grandchild/parent2>child2/
 */
function parseNestedOptions(optionParts: string[]): SlotOption[] {
  const rootOptions: SlotOption[] = [];
  const optionMap = new Map<string, SlotOption>();

  optionParts.forEach((optionPath, index) => {
    // Split by hierarchy indicators (>, ->, :, |)
    const hierarchyParts = optionPath.split(/[>:|\->]+/).map(part => part.trim());
    
    if (hierarchyParts.length === 0) return;

    let currentLevel = rootOptions;
    let currentPath = '';

    hierarchyParts.forEach((part, depth) => {
      currentPath = depth === 0 ? part : `${currentPath}>${part}`;
      
      // Check if this option already exists at this level
      let existingOption = currentLevel.find(opt => opt.value === part);
      
      if (!existingOption) {
        // Create new option
        existingOption = {
          id: `option-${currentPath.replace(/>/g, '-')}`,
          label: part,
          value: part,
          children: depth < hierarchyParts.length - 1 ? [] : undefined
        };
        currentLevel.push(existingOption);
        optionMap.set(currentPath, existingOption);
      }

      // Move to next level if we have children
      if (existingOption.children && depth < hierarchyParts.length - 1) {
        currentLevel = existingOption.children;
      }
    });
  });

  return rootOptions;
}

/**
 * Extract static text parts between slots
 */
function extractStaticParts(content: string, tokens: Token[]): string[] {
  const staticParts: string[] = [];
  
  const textTokens = tokens.filter(token => token.type === 'text');
  textTokens.forEach(token => {
    if (token.content.trim() !== '') {
      staticParts.push(token.content);
    }
  });

  return staticParts;
}

/**
 * Generate a unique slot ID based on type and index
 */
function generateSlotId(type: TokenType, index: number): string {
  const prefix = {
    'placeholder': 'ph',
    'slash-options': 'opt',
    'text': 'tx'
  }[type];
  
  return `${prefix}-${index}-${Date.now().toString(36)}`;
}

/**
 * Convert a parsed phrase back to a content string with selections applied
 */
export function reconstructPhraseWithSelections(
  parsedPhrase: ParsedPhrase,
  selections: Record<string, string>
): string {
  let result = parsedPhrase.template;

  // Replace each slot's placeholder with selected value or leave empty
  parsedPhrase.slots.forEach(slot => {
    const selectedValue = selections[slot.id];
    const replacementText = selectedValue || '';
    
    if (slot.placeholder) {
      result = result.replace(slot.placeholder, replacementText);
    }
  });

  return result;
}

/**
 * Utility to create a phrase definition from legacy format
 */
export function createPhraseFromLegacyFormat(
  trigger: string,
  content: string,
  legacyElements?: any[]
): { content: string; slots: SlotDefinition[] } {
  // First try to parse the content for inline patterns
  const parsedPhrase = parseSmartPhraseContent(content);
  
  // If we have legacy elements, convert them and merge
  if (legacyElements && legacyElements.length > 0) {
    // This would use the conversion from smart-phrase-schema.ts
    // For now, prioritize parsed content
  }

  return {
    content,
    slots: parsedPhrase.slots
  };
}

/**
 * Validate parsed phrase structure
 */
export function validateParsedPhrase(parsedPhrase: ParsedPhrase): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check if slots have valid types
  parsedPhrase.slots.forEach((slot, index) => {
    if (!slot.id) {
      errors.push(`Slot ${index} missing ID`);
    }
    
    if (!['text', 'single-select', 'date', 'nested'].includes(slot.type)) {
      errors.push(`Slot ${slot.id} has invalid type: ${slot.type}`);
    }
    
    if (slot.type === 'single-select' || slot.type === 'nested') {
      if (!slot.options || slot.options.length === 0) {
        errors.push(`Slot ${slot.id} of type ${slot.type} must have options`);
      }
    }
  });

  // Check for placeholder conflicts
  const placeholders = parsedPhrase.slots.map(slot => slot.placeholder).filter(Boolean);
  const uniquePlaceholders = new Set(placeholders);
  if (placeholders.length !== uniquePlaceholders.size) {
    errors.push('Duplicate placeholders detected');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Render segments used by UI to display full phrase with embedded interactive chips
export type RenderSegment =
  | { kind: 'text'; text: string }
  | { kind: 'slot'; slot: SlotDefinition };

export function buildRenderSegments(content: string): RenderSegment[] {
  const segments: RenderSegment[] = [];
  const tokens = tokenizeContent(content);
  tokens.forEach((t, idx) => {
    if (t.type === 'text') {
      if (t.content) segments.push({ kind: 'text', text: t.content });
    } else if (t.type === 'placeholder') {
      const slot = createPlaceholderOrDateSlot(t as any, t.slotId || `ph-${idx}`);
      segments.push({ kind: 'slot', slot });
    } else if (t.type === 'slash-options') {
      const slot = createSlashOptionsSlot(t as any, t.slotId || `opt-${idx}`);
      segments.push({ kind: 'slot', slot });
    }
  });
  return segments;
}
