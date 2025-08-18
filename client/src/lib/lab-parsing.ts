// Lab parsing and standardization utilities
export interface ParsedLabValue {
  originalKey: string;
  standardizedName: string;
  currentValue: string;
  trendedValues: string[];
  unit?: string;
  category: string;
  isAbnormal?: boolean;
  referenceRange?: string;
}

export interface LabPanel {
  name: string;
  labs: ParsedLabValue[];
}

export interface UserLabPreferences {
  defaultTrendCount: number;
  panelSettings: {
    [panelName: string]: {
      visibleByDefault: string[]; // Lab names that show by default
      hiddenButAvailable: string[]; // Labs that are hidden but can be toggled on
      customTrendCount?: { [labName: string]: number }; // Per-lab trend count overrides
    };
  };
}

// Comprehensive lab name standardization mapping
export const LAB_NAME_MAPPING: { [key: string]: { name: string; unit: string; category: string; referenceRange?: string } } = {
  // Hematology
  'HB': { name: 'Hemoglobin', unit: 'g/L', category: 'Hematology', referenceRange: '120-160 g/L' },
  'GB': { name: 'White Blood Cells', unit: '×10⁹/L', category: 'Hematology', referenceRange: '4.0-11.0 ×10⁹/L' },
  'WBC': { name: 'White Blood Cells', unit: '×10⁹/L', category: 'Hematology', referenceRange: '4.0-11.0 ×10⁹/L' },
  'PLT': { name: 'Platelets', unit: '×10⁹/L', category: 'Hematology', referenceRange: '150-450 ×10⁹/L' },
  'VGM': { name: 'Mean Corpuscular Volume', unit: 'fL', category: 'Hematology', referenceRange: '80-100 fL' },
  'MCV': { name: 'Mean Corpuscular Volume', unit: 'fL', category: 'Hematology', referenceRange: '80-100 fL' },
  'HCT': { name: 'Hematocrit', unit: '%', category: 'Hematology', referenceRange: '36-46%' },
  'RBC': { name: 'Red Blood Cells', unit: '×10¹²/L', category: 'Hematology', referenceRange: '4.2-5.4 ×10¹²/L' },
  'NEUT': { name: 'Neutrophils', unit: '×10⁹/L', category: 'Hematology', referenceRange: '2.0-7.5 ×10⁹/L' },
  'LYMP': { name: 'Lymphocytes', unit: '×10⁹/L', category: 'Hematology', referenceRange: '1.5-4.0 ×10⁹/L' },
  'RNI': { name: 'Reticulocyte Index', unit: '', category: 'Hematology', referenceRange: '0.5-2.5' },
  
  // Chemistry
  'Créat': { name: 'Creatinine', unit: 'µmol/L', category: 'Chemistry', referenceRange: '60-110 µmol/L' },
  'CREAT': { name: 'Creatinine', unit: 'µmol/L', category: 'Chemistry', referenceRange: '60-110 µmol/L' },
  'Urée': { name: 'Urea', unit: 'mmol/L', category: 'Chemistry', referenceRange: '2.5-7.5 mmol/L' },
  'UREA': { name: 'Urea', unit: 'mmol/L', category: 'Chemistry', referenceRange: '2.5-7.5 mmol/L' },
  'BUN': { name: 'Blood Urea Nitrogen', unit: 'mg/dL', category: 'Chemistry', referenceRange: '7-20 mg/dL' },
  'NA': { name: 'Sodium', unit: 'mmol/L', category: 'Chemistry', referenceRange: '135-145 mmol/L' },
  'K': { name: 'Potassium', unit: 'mmol/L', category: 'Chemistry', referenceRange: '3.5-5.0 mmol/L' },
  'CL': { name: 'Chloride', unit: 'mmol/L', category: 'Chemistry', referenceRange: '98-107 mmol/L' },
  'Cl': { name: 'Chloride', unit: 'mmol/L', category: 'Chemistry', referenceRange: '98-107 mmol/L' },
  'CO2': { name: 'Carbon Dioxide', unit: 'mmol/L', category: 'Chemistry', referenceRange: '22-28 mmol/L' },
  'GLUC': { name: 'Glucose', unit: 'mmol/L', category: 'Chemistry', referenceRange: '3.9-6.1 mmol/L' },
  'GLUCOSE': { name: 'Glucose', unit: 'mmol/L', category: 'Chemistry', referenceRange: '3.9-6.1 mmol/L' },
  'Gluc': { name: 'Glucose', unit: 'mmol/L', category: 'Chemistry', referenceRange: '3.9-6.1 mmol/L' },
  'PHOSP': { name: 'Phosphate', unit: 'mmol/L', category: 'Chemistry', referenceRange: '0.8-1.5 mmol/L' },
  'Ca': { name: 'Calcium', unit: 'mmol/L', category: 'Chemistry', referenceRange: '2.2-2.6 mmol/L' },
  'Mg': { name: 'Magnesium', unit: 'mmol/L', category: 'Chemistry', referenceRange: '0.7-1.0 mmol/L' },
  
  // Liver Function
  'ALT': { name: 'Alanine Aminotransferase', unit: 'U/L', category: 'Liver Function', referenceRange: '10-40 U/L' },
  'AST': { name: 'Aspartate Aminotransferase', unit: 'U/L', category: 'Liver Function', referenceRange: '10-40 U/L' },
  'BILIT': { name: 'Total Bilirubin', unit: 'µmol/L', category: 'Liver Function', referenceRange: '5-20 µmol/L' },
  'BILI': { name: 'Total Bilirubin', unit: 'µmol/L', category: 'Liver Function', referenceRange: '5-20 µmol/L' },
  'GGT': { name: 'Gamma-Glutamyl Transferase', unit: 'U/L', category: 'Liver Function', referenceRange: '5-40 U/L' },
  'P alc': { name: 'Alkaline Phosphatase', unit: 'U/L', category: 'Liver Function', referenceRange: '40-120 U/L' },
  'ALP': { name: 'Alkaline Phosphatase', unit: 'U/L', category: 'Liver Function', referenceRange: '40-120 U/L' },
  'Alb': { name: 'Albumin', unit: 'g/L', category: 'Liver Function', referenceRange: '35-50 g/L' },
  'ALB': { name: 'Albumin', unit: 'g/L', category: 'Liver Function', referenceRange: '35-50 g/L' },
  
  // Cardiac/Muscle
  'CK': { name: 'Creatine Kinase', unit: 'U/L', category: 'Cardiac', referenceRange: '30-200 U/L' },
  'TROT': { name: 'Troponin T', unit: 'ng/L', category: 'Cardiac', referenceRange: '<14 ng/L' },
  'TROP': { name: 'Troponin', unit: 'ng/L', category: 'Cardiac', referenceRange: '<14 ng/L' },
  'NT-proBNP': { name: 'NT-proBNP', unit: 'ng/L', category: 'Cardiac', referenceRange: '<125 ng/L' },
  'BNP': { name: 'BNP', unit: 'pg/mL', category: 'Cardiac', referenceRange: '<100 pg/mL' },
  'LDH': { name: 'Lactate Dehydrogenase', unit: 'U/L', category: 'General', referenceRange: '135-225 U/L' },
  
  // Inflammatory
  'CRP': { name: 'C-Reactive Protein', unit: 'mg/L', category: 'Inflammatory', referenceRange: '<3 mg/L' },
  'ESR': { name: 'Erythrocyte Sedimentation Rate', unit: 'mm/hr', category: 'Inflammatory', referenceRange: '<20 mm/hr' },
  'PCT': { name: 'Procalcitonin', unit: 'ng/mL', category: 'Inflammatory', referenceRange: '<0.25 ng/mL' },
  
  // Coagulation
  'TTPA': { name: 'aPTT', unit: 's', category: 'Coagulation', referenceRange: '25-35 s' },
  'PTT': { name: 'aPTT', unit: 's', category: 'Coagulation', referenceRange: '25-35 s' },
  'INR': { name: 'INR', unit: '', category: 'Coagulation', referenceRange: '0.9-1.1' },
  
  // Blood Gas
  'PHV': { name: 'pH', unit: '', category: 'Blood Gas', referenceRange: '7.35-7.45' },
  'PH': { name: 'pH', unit: '', category: 'Blood Gas', referenceRange: '7.35-7.45' },
  'HCO3 V': { name: 'Bicarbonate', unit: 'mmol/L', category: 'Blood Gas', referenceRange: '22-28 mmol/L' },
  'HCO3': { name: 'Bicarbonate', unit: 'mmol/L', category: 'Blood Gas', referenceRange: '22-28 mmol/L' },
  'PCO2 V': { name: 'Partial Pressure CO2', unit: 'mmHg', category: 'Blood Gas', referenceRange: '35-45 mmHg' },
  'PCO2': { name: 'Partial Pressure CO2', unit: 'mmHg', category: 'Blood Gas', referenceRange: '35-45 mmHg' },
  'PO2': { name: 'Partial Pressure O2', unit: 'mmHg', category: 'Blood Gas', referenceRange: '80-100 mmHg' },
  'LACVS': { name: 'Lactate', unit: 'mmol/L', category: 'Blood Gas', referenceRange: '0.5-2.2 mmol/L' },
  'LACTATE': { name: 'Lactate', unit: 'mmol/L', category: 'Blood Gas', referenceRange: '0.5-2.2 mmol/L' },
  
  // Renal Function
  'DFG ca': { name: 'eGFR', unit: 'mL/min/1.73m²', category: 'Renal Function', referenceRange: '>90 mL/min/1.73m²' },
  'eGFR': { name: 'eGFR', unit: 'mL/min/1.73m²', category: 'Renal Function', referenceRange: '>90 mL/min/1.73m²' },
  'GFR': { name: 'eGFR', unit: 'mL/min/1.73m²', category: 'Renal Function', referenceRange: '>90 mL/min/1.73m²' },
  
  // Endocrine
  'TSH': { name: 'Thyroid Stimulating Hormone', unit: 'mU/L', category: 'Endocrine', referenceRange: '0.3-4.2 mU/L' },
  'T4': { name: 'Free Thyroxine', unit: 'pmol/L', category: 'Endocrine', referenceRange: '12-22 pmol/L' },
  'T3': { name: 'Free Triiodothyronine', unit: 'pmol/L', category: 'Endocrine', referenceRange: '3.1-6.8 pmol/L' },
  
  // Lipids
  'CHOL': { name: 'Total Cholesterol', unit: 'mmol/L', category: 'Lipids', referenceRange: '<5.2 mmol/L' },
  'HDL': { name: 'HDL Cholesterol', unit: 'mmol/L', category: 'Lipids', referenceRange: '>1.0 mmol/L' },
  'LDL': { name: 'LDL Cholesterol', unit: 'mmol/L', category: 'Lipids', referenceRange: '<3.4 mmol/L' },
  'TG': { name: 'Triglycerides', unit: 'mmol/L', category: 'Lipids', referenceRange: '<1.7 mmol/L' },
  'TRIG': { name: 'Triglycerides', unit: 'mmol/L', category: 'Lipids', referenceRange: '<1.7 mmol/L' },
};

// Default lab preferences for different panels
export const DEFAULT_LAB_PREFERENCES: UserLabPreferences = {
  defaultTrendCount: 3,
  panelSettings: {
    'Hematology': {
      visibleByDefault: ['Hemoglobin', 'White Blood Cells', 'Platelets'],
      hiddenButAvailable: ['Mean Corpuscular Volume', 'Hematocrit', 'Red Blood Cells'],
    },
    'Chemistry': {
      visibleByDefault: ['Sodium', 'Potassium', 'Creatinine', 'Urea', 'Glucose'],
      hiddenButAvailable: ['Chloride', 'Carbon Dioxide'],
    },
    'Liver Function': {
      visibleByDefault: ['Alanine Aminotransferase', 'Total Bilirubin', 'Albumin'],
      hiddenButAvailable: ['Aspartate Aminotransferase', 'Gamma-Glutamyl Transferase', 'Alkaline Phosphatase'],
    },
    'Cardiac': {
      visibleByDefault: ['Troponin T', 'Creatine Kinase', 'NT-proBNP'],
      hiddenButAvailable: ['BNP'],
    },
    'Inflammatory': {
      visibleByDefault: ['C-Reactive Protein'],
      hiddenButAvailable: ['Erythrocyte Sedimentation Rate', 'Procalcitonin'],
    },
    'Blood Gas': {
      visibleByDefault: ['pH', 'Bicarbonate', 'Partial Pressure CO2', 'Lactate'],
      hiddenButAvailable: ['Partial Pressure O2'],
    },
    'Renal Function': {
      visibleByDefault: ['eGFR'],
      hiddenButAvailable: [],
    },
    'Endocrine': {
      visibleByDefault: [],
      hiddenButAvailable: ['Thyroid Stimulating Hormone', 'Free Thyroxine', 'Free Triiodothyronine'],
    },
    'Lipids': {
      visibleByDefault: ['Total Cholesterol', 'HDL Cholesterol', 'LDL Cholesterol'],
      hiddenButAvailable: ['Triglycerides'],
    },
  },
};

/**
 * Parse raw lab text from EHR into structured lab values
 */
export function parseLabText(rawText: string): ParsedLabValue[] {
  if (!rawText || rawText.trim() === '') {
    return [];
  }

  const parsedLabs: ParsedLabValue[] = [];
  
  // First, normalize the text by replacing various separators
  const normalizedText = rawText
    .replace(/\r\n/g, '\n')  // Normalize line endings
    .replace(/\r/g, '\n');    // Handle Mac line endings
  
  // Split by lines
  const lines = normalizedText.trim().split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines
    
    // Try different splitting strategies
    let labEntries: string[] = [];
    
    // First try: split by tabs and recombine lab name with value
    if (line.includes('\t')) {
      const tabSeparated = line.split('\t').filter(entry => entry.trim());
      
      labEntries = [];
      for (let i = 0; i < tabSeparated.length; i++) {
        const current = tabSeparated[i].trim();
        
        // If current entry ends with ':' and next entry looks like a value with parentheses
        if (current.endsWith(':') && i + 1 < tabSeparated.length) {
          const next = tabSeparated[i + 1].trim();
          if (next.match(/^[<>]?[\d.]+\(/)) { // Looks like "VALUE(" format
            // Combine lab name with its value
            labEntries.push(`${current}    ${next}`);
            i++; // Skip the next entry since we've combined it
            continue;
          }
        }
        
        // Otherwise, keep the entry as is
        labEntries.push(current);
      }
    }
    // Second try: split by pattern that matches "LAB:    VALUE(TRENDS)    " followed by multiple spaces
    else if (line.match(/[A-Za-z][^:]*:\s+[^(]*\([^)]*\)\s{3,}/)) {
      // Use regex to find all matches of the pattern "LAB_NAME:    VALUE(TRENDS)    "
      const matches = line.match(/[A-Za-z][^:]*:\s+[^(]*\([^)]*\)\s*/g);
      if (matches) {
        labEntries = matches.map(m => m.trim());
      } else {
        labEntries = [line];
      }
    }
    // Third try: split by multiple spaces (4 or more) for lab data
    else if (line.match(/\s{4,}/)) {
      labEntries = line.split(/\s{4,}/).filter(entry => entry.trim());
    }
    // Fourth try: split by commas
    else if (line.includes(',')) {
      labEntries = line.split(',').filter(entry => entry.trim());
    }
    // Otherwise treat the whole line as one entry
    else {
      labEntries = [line];
    }
    
    for (const entry of labEntries) {
      const trimmedEntry = entry.trim();
      if (!trimmedEntry) continue;
      
      const parsed = parseLabEntry(trimmedEntry);
      if (parsed) {
        parsedLabs.push(parsed);
      }
    }
  }
  
  return parsedLabs;
}

/**
 * Parse a single lab entry with flexible format support
 * Supports formats like:
 * - "HB:    68(63 67 68 71 74...)" (multiple spaces, value concatenated with parenthesis)
 * - "HB: 68 (63 67 68 71 74)"
 * - "Hemoglobin: 12.5 g/dL"
 * - "WBC 4.5"
 */
function parseLabEntry(entry: string): ParsedLabValue | null {
  // Special pattern for the exact format: "LAB_NAME:    VALUE(TRENDS )"
  // This handles multiple spaces and value directly concatenated with parenthesis
  const specialMatch = entry.match(/^([^:]+):\s+([^(\s]+)\(([^)]*)\s*\)/);
  
  if (specialMatch) {
    const originalKey = specialMatch[1].trim();
    const currentValue = specialMatch[2].trim();
    const trendString = specialMatch[3] || '';
    
    // Parse trended values
    const trendedValues = trendString
      .split(/\s+/)
      .filter(val => val.trim() && val !== currentValue && val !== '')
      .slice(0, 10); // Limit to 10 trended values max
    
    // Standardize the lab name
    const standardizedInfo = findLabMapping(originalKey);
    
    if (!standardizedInfo) {
      return {
        originalKey,
        standardizedName: originalKey,
        currentValue,
        trendedValues,
        category: 'Other',
        isAbnormal: false
      };
    }
    
    return {
      originalKey,
      standardizedName: standardizedInfo.name,
      currentValue,
      trendedValues,
      unit: standardizedInfo.unit,
      category: standardizedInfo.category,
      referenceRange: standardizedInfo.referenceRange,
      isAbnormal: determineIfAbnormal(currentValue, standardizedInfo.referenceRange)
    };
  }
  
  // Try other patterns if special format doesn't match
  const patterns = [
    // Pattern 1: "LAB_NAME: CURRENT_VALUE" (no trends)
    /^([^:]+):\s*([^(]+?)$/,
    // Pattern 2: "LAB_NAME: CURRENT_VALUE (TREND_VALUES)"
    /^([^:]+):\s*([^(]+?)\s*\(([^)]*)\)$/,
    // Pattern 3: "LAB_NAME CURRENT_VALUE (TREND_VALUES)" - no colon
    /^(\S+)\s+([^(]+?)(?:\s*\(([^)]*)\))?$/
  ];
  
  let match = null;
  for (const pattern of patterns) {
    match = entry.match(pattern);
    if (match) {
      break;
    }
  }
  
  if (!match) {
    return null;
  }
  
  const originalKey = match[1].trim();
  const currentValue = match[2].trim();
  const trendString = match[3] || '';
  
  // Parse trended values
  const trendedValues = trendString
    .split(/\s+/)
    .filter(val => val.trim() && val !== currentValue && val !== '')
    .slice(0, 10); // Limit to 10 trended values max
  
  // Standardize the lab name
  const standardizedInfo = findLabMapping(originalKey);
  
  if (!standardizedInfo) {
    // If not in mapping, use original name but still parse
    return {
      originalKey,
      standardizedName: originalKey,
      currentValue,
      trendedValues,
      category: 'Other',
      isAbnormal: false
    };
  }
  
  return {
    originalKey,
    standardizedName: standardizedInfo.name,
    currentValue,
    trendedValues,
    unit: standardizedInfo.unit,
    category: standardizedInfo.category,
    referenceRange: standardizedInfo.referenceRange,
    isAbnormal: determineIfAbnormal(currentValue, standardizedInfo.referenceRange),
  };
}

/**
 * Find lab mapping for a given lab name
 */
function findLabMapping(labName: string): typeof LAB_NAME_MAPPING[string] | null {
  // Direct match (including multi-word names like "HCO3 V")
  if (LAB_NAME_MAPPING[labName]) {
    return LAB_NAME_MAPPING[labName];
  }
  
  // Try uppercase
  const upperName = labName.toUpperCase();
  if (LAB_NAME_MAPPING[upperName]) {
    return LAB_NAME_MAPPING[upperName];
  }
  
  // Try without spaces (for cases like "HCO3V" vs "HCO3 V")
  const nameNoSpaces = labName.replace(/\s+/g, '');
  if (LAB_NAME_MAPPING[nameNoSpaces]) {
    return LAB_NAME_MAPPING[nameNoSpaces];
  }
  
  // Try with space before last character (for "HCO3V" -> "HCO3 V")
  if (labName.match(/^[A-Z]+\d+[A-Z]$/i)) {
    const withSpace = labName.slice(0, -1) + ' ' + labName.slice(-1);
    if (LAB_NAME_MAPPING[withSpace]) {
      return LAB_NAME_MAPPING[withSpace];
    }
  }
  
  // Try to find partial matches
  for (const [key, info] of Object.entries(LAB_NAME_MAPPING)) {
    if (key.toUpperCase() === upperName || 
        info.name.toUpperCase().includes(upperName) ||
        upperName.includes(key.toUpperCase())) {
      return info;
    }
  }
  
  return null;
}

/**
 * Determine if a lab value is abnormal based on reference range
 */
function determineIfAbnormal(value: string, referenceRange?: string): boolean {
  if (!referenceRange || !value) {
    return false;
  }
  
  const numericValue = parseFloat(value.replace(/[<>≤≥]/, ''));
  if (isNaN(numericValue)) {
    return false;
  }
  
  // Simple range checking for numeric ranges like "120-160"
  const rangeMatch = referenceRange.match(/(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)/);
  if (rangeMatch) {
    const minValue = parseFloat(rangeMatch[1]);
    const maxValue = parseFloat(rangeMatch[2]);
    return numericValue < minValue || numericValue > maxValue;
  }
  
  // Handle ">" or "<" ranges
  const gtMatch = referenceRange.match(/>(\d+(?:\.\d+)?)/);
  if (gtMatch) {
    const threshold = parseFloat(gtMatch[1]);
    return numericValue <= threshold;
  }
  
  const ltMatch = referenceRange.match(/<(\d+(?:\.\d+)?)/);
  if (ltMatch) {
    const threshold = parseFloat(ltMatch[1]);
    return numericValue >= threshold;
  }
  
  return false;
}

/**
 * Group parsed labs by category/panel
 */
export function groupLabsByPanel(labs: ParsedLabValue[]): LabPanel[] {
  const panels: { [category: string]: ParsedLabValue[] } = {};
  
  for (const lab of labs) {
    if (!panels[lab.category]) {
      panels[lab.category] = [];
    }
    panels[lab.category].push(lab);
  }
  
  return Object.entries(panels).map(([name, labs]) => ({
    name,
    labs: labs.sort((a, b) => a.standardizedName.localeCompare(b.standardizedName))
  }));
}

/**
 * Format labs according to user preferences
 */
export function formatLabsForNote(
  labs: ParsedLabValue[],
  preferences: UserLabPreferences,
  customVisibility?: { [labName: string]: boolean },
  customTrendCounts?: { [labName: string]: number }
): string {
  const panels = groupLabsByPanel(labs);
  let formattedOutput = '';
  
  for (const panel of panels) {
    const panelPrefs = preferences.panelSettings[panel.name];
    if (!panelPrefs) {
      continue;
    }
    
    const visibleLabs = panel.labs.filter(lab => {
      const isVisibleByDefault = panelPrefs.visibleByDefault.includes(lab.standardizedName);
      const isManuallyShown = customVisibility?.[lab.standardizedName] === true;
      return isVisibleByDefault || isManuallyShown;
    });
    
    if (visibleLabs.length === 0) {
      continue;
    }
    
    formattedOutput += `**${panel.name}:**\n`;
    
    for (const lab of visibleLabs) {
      const trendCount = customTrendCounts?.[lab.standardizedName] || 
                        panelPrefs.customTrendCount?.[lab.standardizedName] || 
                        preferences.defaultTrendCount;
      
      const displayTrends = lab.trendedValues.slice(0, trendCount);
      const trendsString = displayTrends.length > 0 ? ` (${displayTrends.join(', ')})` : '';
      const unitString = lab.unit ? ` ${lab.unit}` : '';
      const abnormalFlag = lab.isAbnormal ? ' ⚠️' : '';
      
      formattedOutput += `- ${lab.standardizedName}: ${lab.currentValue}${unitString}${trendsString}${abnormalFlag}\n`;
    }
    
    formattedOutput += '\n';
  }
  
  return formattedOutput.trim();
}

/**
 * Get all available labs for a panel (visible + hidden)
 */
export function getAvailableLabsForPanel(
  panelName: string, 
  allLabs: ParsedLabValue[]
): { visible: ParsedLabValue[]; hidden: ParsedLabValue[] } {
  const panelLabs = allLabs.filter(lab => lab.category === panelName);
  const preferences = DEFAULT_LAB_PREFERENCES;
  const panelPrefs = preferences.panelSettings[panelName];
  
  if (!panelPrefs) {
    return { visible: panelLabs, hidden: [] };
  }
  
  const visible = panelLabs.filter(lab => 
    panelPrefs.visibleByDefault.includes(lab.standardizedName)
  );
  
  const hidden = panelLabs.filter(lab => 
    panelPrefs.hiddenButAvailable.includes(lab.standardizedName) ||
    (!panelPrefs.visibleByDefault.includes(lab.standardizedName) && 
     !panelPrefs.hiddenButAvailable.includes(lab.standardizedName))
  );
  
  return { visible, hidden };
}