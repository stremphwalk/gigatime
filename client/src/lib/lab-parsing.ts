// Lab parsing and standardization utilities (overhauled)

export interface ParsedLabValue {
  originalKey: string;
  standardizedName: string;
  currentValue: string;
  trendedValues: string[];
  unit?: string;
  category: string; // Panel name
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
      visibleByDefault: string[];
      hiddenButAvailable: string[];
      customTrendCount?: { [labName: string]: number };
    };
  };
}

// Canonical mapping with panels per product spec
export const LAB_NAME_MAPPING: { [key: string]: { name: string; unit: string; category: string; referenceRange?: string } } = {
  // Hematology (CBC)
  HB: { name: 'Hemoglobin', unit: 'g/L', category: 'Hematology', referenceRange: '120-160 g/L' },
  GB: { name: 'Leukocytes', unit: '×10⁹/L', category: 'Hematology', referenceRange: '4.0-11.0 ×10⁹/L' },
  WBC: { name: 'Leukocytes', unit: '×10⁹/L', category: 'Hematology', referenceRange: '4.0-11.0 ×10⁹/L' },
  PLT: { name: 'Platelets', unit: '×10⁹/L', category: 'Hematology', referenceRange: '150-450 ×10⁹/L' },
  VGM: { name: 'MCV', unit: 'fL', category: 'Hematology', referenceRange: '80-100 fL' },
  MCV: { name: 'MCV', unit: 'fL', category: 'Hematology', referenceRange: '80-100 fL' },
  HCT: { name: 'Hematocrit', unit: '%', category: 'Hematology', referenceRange: '36-46%' },
  RBC: { name: 'RBC', unit: '×10¹²/L', category: 'Hematology', referenceRange: '4.2-5.4 ×10¹²/L' },
  NEUT: { name: 'Neutrophils', unit: '×10⁹/L', category: 'Hematology', referenceRange: '2.0-7.5 ×10⁹/L' },
  LYMP: { name: 'Lymphocytes', unit: '×10⁹/L', category: 'Hematology', referenceRange: '1.5-4.0 ×10⁹/L' },

  // Coagulation
  RNI: { name: 'INR', unit: '', category: 'Coagulation', referenceRange: '0.8-1.2' },
  INR: { name: 'INR', unit: '', category: 'Coagulation', referenceRange: '0.8-1.2' },
  TTPA: { name: 'aPTT', unit: 'sec', category: 'Coagulation', referenceRange: '25-35' },

  // Inflammation
  CRP: { name: 'CRP', unit: 'mg/L', category: 'Inflammation', referenceRange: '<5' },
  ESR: { name: 'ESR', unit: 'mm/h', category: 'Inflammation' },
  VS: { name: 'ESR', unit: 'mm/h', category: 'Inflammation' },

  // Liver
  ALT: { name: 'ALT', unit: 'U/L', category: 'Liver', referenceRange: '10-40 U/L' },
  AST: { name: 'AST', unit: 'U/L', category: 'Liver', referenceRange: '10-40 U/L' },
  BILIT: { name: 'Bilirubin', unit: 'µmol/L', category: 'Liver', referenceRange: '5-20 µmol/L' },
  BILI: { name: 'Bilirubin', unit: 'µmol/L', category: 'Liver', referenceRange: '5-20 µmol/L' },
  GGT: { name: 'GGT', unit: 'U/L', category: 'Liver', referenceRange: '5-40 U/L' },
  'P alc': { name: 'ALP', unit: 'U/L', category: 'Liver', referenceRange: '40-120 U/L' },
  ALP: { name: 'ALP', unit: 'U/L', category: 'Liver', referenceRange: '40-120 U/L' },
  Alb: { name: 'Albumin', unit: 'g/L', category: 'Liver', referenceRange: '35-50 g/L' },
  ALB: { name: 'Albumin', unit: 'g/L', category: 'Liver', referenceRange: '35-50 g/L' },
  LDH: { name: 'LDH', unit: 'U/L', category: 'Liver' },

  // Renal
  'Créat': { name: 'Creatinine', unit: 'µmol/L', category: 'Renal', referenceRange: '60-110 µmol/L' },
  CREAT: { name: 'Creatinine', unit: 'µmol/L', category: 'Renal', referenceRange: '60-110 µmol/L' },
  Creat: { name: 'Creatinine', unit: 'µmol/L', category: 'Renal', referenceRange: '60-110 µmol/L' },
  'Urée': { name: 'Urea', unit: 'mmol/L', category: 'Renal', referenceRange: '2.5-7.5 mmol/L' },
  UREA: { name: 'Urea', unit: 'mmol/L', category: 'Renal', referenceRange: '2.5-7.5 mmol/L' },
  BUN: { name: 'BUN', unit: 'mg/dL', category: 'Renal', referenceRange: '7-20 mg/dL' },
  DFG: { name: 'eGFR', unit: 'mL/min/1.73m²', category: 'Renal' },
  'DFG ca': { name: 'eGFR', unit: 'mL/min/1.73m²', category: 'Renal' },

  // Electrolytes
  NA: { name: 'Na', unit: 'mmol/L', category: 'Electrolytes', referenceRange: '135-145 mmol/L' },
  Na: { name: 'Na', unit: 'mmol/L', category: 'Electrolytes', referenceRange: '135-145 mmol/L' },
  K: { name: 'K', unit: 'mmol/L', category: 'Electrolytes', referenceRange: '3.5-5.0 mmol/L' },
  CL: { name: 'Cl', unit: 'mmol/L', category: 'Electrolytes', referenceRange: '98-107 mmol/L' },
  Cl: { name: 'Cl', unit: 'mmol/L', category: 'Electrolytes', referenceRange: '98-107 mmol/L' },
  PHOSP: { name: 'Phosphate', unit: 'mmol/L', category: 'Electrolytes', referenceRange: '0.8-1.5 mmol/L' },
  Ca: { name: 'Ca', unit: 'mmol/L', category: 'Electrolytes', referenceRange: '2.2-2.6 mmol/L' },
  Mg: { name: 'Mg', unit: 'mmol/L', category: 'Electrolytes', referenceRange: '0.7-1.0 mmol/L' },

  // Glucose
  GLUC: { name: 'Glucose', unit: 'mmol/L', category: 'Glucose', referenceRange: '3.9-6.1 mmol/L' },
  GLUCOSE: { name: 'Glucose', unit: 'mmol/L', category: 'Glucose', referenceRange: '3.9-6.1 mmol/L' },
  Gluc: { name: 'Glucose', unit: 'mmol/L', category: 'Glucose', referenceRange: '3.9-6.1 mmol/L' },

  // Acid–Base / Blood Gas
  PHV: { name: 'pH', unit: '', category: 'Acid–Base' },
  PH: { name: 'pH', unit: '', category: 'Acid–Base' },
  HCO3: { name: 'HCO3', unit: 'mmol/L', category: 'Acid–Base' },
  'HCO3 V': { name: 'HCO3', unit: 'mmol/L', category: 'Acid–Base' },
  PCO2: { name: 'pCO2', unit: 'mmHg', category: 'Acid–Base' },
  'PCO2 V': { name: 'pCO2', unit: 'mmHg', category: 'Acid–Base' },
  LAC: { name: 'Lactate', unit: 'mmol/L', category: 'Acid–Base' },
  LACVS: { name: 'Lactate', unit: 'mmol/L', category: 'Acid–Base' },

  // Cardiac & Muscle
  CK: { name: 'CK', unit: 'U/L', category: 'Muscle', referenceRange: '30-200 U/L' },
  TROT: { name: 'Troponin', unit: 'ng/L', category: 'Cardiac', referenceRange: '<14 ng/L' },
  TROP: { name: 'Troponin', unit: 'ng/L', category: 'Cardiac' },
  TnT: { name: 'Troponin', unit: 'ng/L', category: 'Cardiac' },
  TnI: { name: 'Troponin', unit: 'ng/L', category: 'Cardiac' },
  'NT-proBNP': { name: 'NT-proBNP', unit: 'pg/mL', category: 'Cardiac' },
};

export const DEFAULT_LAB_PREFERENCES: UserLabPreferences = {
  defaultTrendCount: 3,
  panelSettings: {
    Hematology: {
      visibleByDefault: ['Hemoglobin', 'Leukocytes', 'Platelets', 'MCV', 'Neutrophils', 'Lymphocytes'],
      hiddenButAvailable: ['Hematocrit', 'RBC'],
    },
    Coagulation: {
      visibleByDefault: ['INR', 'aPTT'],
      hiddenButAvailable: [],
    },
    Inflammation: {
      visibleByDefault: ['CRP'],
      hiddenButAvailable: ['ESR'],
    },
    Liver: {
      visibleByDefault: ['ALT', 'Bilirubin', 'Albumin', 'GGT', 'ALP', 'LDH'],
      hiddenButAvailable: ['AST'],
    },
    Renal: {
      visibleByDefault: ['Creatinine', 'eGFR', 'Urea'],
      hiddenButAvailable: ['BUN'],
    },
    Electrolytes: {
      visibleByDefault: ['Na', 'K', 'Cl', 'Mg', 'Phosphate', 'Ca'],
      hiddenButAvailable: [],
    },
    Glucose: {
      visibleByDefault: ['Glucose'],
      hiddenButAvailable: [],
    },
    'Acid–Base': {
      visibleByDefault: ['pH', 'HCO3', 'pCO2', 'Lactate'],
      hiddenButAvailable: [],
    },
    Cardiac: {
      visibleByDefault: ['Troponin', 'NT-proBNP'],
      hiddenButAvailable: [],
    },
    Muscle: {
      visibleByDefault: ['CK'],
      hiddenButAvailable: [],
    },
    Other: {
      visibleByDefault: [],
      hiddenButAvailable: [],
    },
  },
};

/**
 * Parse raw lab text from EHR into structured lab values
 * Robust to multi-line parentheses and labels with spaces.
 */
export function parseLabText(rawText: string): ParsedLabValue[] {
  if (!rawText || rawText.trim() === '') return [];

  // Normalize line endings
  const text = rawText.replace(/\r\n|\r/g, '\n');

  const entries: string[] = [];
  const used: Array<[number, number]> = [];

  // Pass 1: label: current (trend...) across newlines
  const parenRegex = /([A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ0-9 .\-]*):\s*([^\s(]+)\s*\(([^)]*?)\)/g;
  let m: RegExpExecArray | null;
  while ((m = parenRegex.exec(text)) !== null) {
    const [full, label, current, inside] = m;
    const flatInside = inside.replace(/\s+/g, ' ').trim();
    entries.push(`${label}: ${current} (${flatInside})`);
    used.push([m.index, m.index + full.length]);
  }

  // Mask out used spans to find singletons next
  const mask = new Array(text.length).fill(false);
  for (const [s, e] of used) {
    for (let i = s; i < e; i++) mask[i] = true;
  }
  let remaining = '';
  for (let i = 0; i < text.length; i++) remaining += mask[i] ? ' ' : text[i];

  // Pass 2: label: value without parentheses
  const singleRegex = /([A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ0-9 .\-]*):\s*([<>]?\d+[\d.,]*)/g;
  while ((m = singleRegex.exec(remaining)) !== null) {
    const [, label, val] = m;
    entries.push(`${label}: ${val}`);
  }

  // Fallback: nothing matched -> split lines heuristics
  if (entries.length === 0) {
    return text
      .split('\n')
      .map((l) => l.trim())
      .map(parseLabEntry)
      .filter((x): x is ParsedLabValue => !!x);
  }

  const parsed: ParsedLabValue[] = [];
  for (const e of entries) {
    const p = parseLabEntry(e.trim());
    if (p) parsed.push(p);
  }
  return parsed;
}

/**
 * Parse a single lab entry string
 */
function parseLabEntry(entry: string): ParsedLabValue | null {
  const specialMatch = entry.match(/^([^:]+):\s+([^\s(]+)\s*\(([^)]*)\s*\)/);
  if (specialMatch) {
    const originalKey = specialMatch[1].trim();
    const currentValue = specialMatch[2].trim();
    const trendString = specialMatch[3] || '';
    const trendedValues = trendString
      .replace(/\s+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter((v) => v.trim() && v !== currentValue)
      .slice(0, 50);
    const standardizedInfo = findLabMapping(originalKey);
    if (!standardizedInfo) {
      return { originalKey, standardizedName: originalKey, currentValue, trendedValues, category: 'Other', isAbnormal: false };
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

  // Generic patterns
  const patterns = [/^([^:]+):\s*([^(]+?)$/, /^([^:]+):\s*([^(]+?)\s*\(([^)]*)\)$/, /^(\S+)\s+([^(]+?)(?:\s*\(([^)]*)\))?$/];
  let match: RegExpMatchArray | null = null;
  for (const p of patterns) {
    match = entry.match(p);
    if (match) break;
  }
  if (!match) return null;

  const originalKey = match[1].trim();
  const currentValue = match[2].trim();
  const trendString = match[3] || '';
  const trendedValues = trendString
    .replace(/\s+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((v) => v.trim() && v !== currentValue)
    .slice(0, 50);

  const standardizedInfo = findLabMapping(originalKey);
  if (!standardizedInfo) {
    return { originalKey, standardizedName: originalKey, currentValue, trendedValues, category: 'Other', isAbnormal: false };
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

/** Synonym resolution */
function findLabMapping(labName: string): typeof LAB_NAME_MAPPING[string] | null {
  if (LAB_NAME_MAPPING[labName]) return LAB_NAME_MAPPING[labName];
  const upper = labName.toUpperCase();
  if (LAB_NAME_MAPPING[upper]) return LAB_NAME_MAPPING[upper];
  // Remove diacritics for French labels
  const noDiac = labName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (LAB_NAME_MAPPING[noDiac]) return LAB_NAME_MAPPING[noDiac];
  const upperNoDiac = noDiac.toUpperCase();
  if (LAB_NAME_MAPPING[upperNoDiac]) return LAB_NAME_MAPPING[upperNoDiac];
  // Trim variant suffixes e.g., " V"
  const trimmed = labName.replace(/\s+V$/, '').trim();
  if (LAB_NAME_MAPPING[trimmed]) return LAB_NAME_MAPPING[trimmed];
  return null;
}

/** Determine if a lab value is abnormal based on reference range */
function determineIfAbnormal(value: string, referenceRange?: string): boolean {
  if (!referenceRange || !value) return false;
  const numericValue = parseFloat(value.replace(/[<>≤≥]/g, '').replace(',', '.'));
  if (isNaN(numericValue)) return false;
  const rangeMatch = referenceRange.match(/(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)/);
  if (rangeMatch) {
    const minValue = parseFloat(rangeMatch[1]);
    const maxValue = parseFloat(rangeMatch[2]);
    return numericValue < minValue || numericValue > maxValue;
  }
  const gtMatch = referenceRange.match(/>(\d+(?:\.\d+)?)/);
  if (gtMatch) return numericValue <= parseFloat(gtMatch[1]);
  const ltMatch = referenceRange.match(/<(\d+(?:\.\d+)?)/);
  if (ltMatch) return numericValue >= parseFloat(ltMatch[1]);
  return false;
}

/** Group parsed labs by panel */
export function groupLabsByPanel(labs: ParsedLabValue[]): LabPanel[] {
  const panels: { [category: string]: ParsedLabValue[] } = {};
  for (const lab of labs) {
    if (!panels[lab.category]) panels[lab.category] = [];
    panels[lab.category].push(lab);
  }
  return Object.entries(panels).map(([name, labs]) => ({
    name,
    labs: labs.sort((a, b) => a.standardizedName.localeCompare(b.standardizedName)),
  }));
}

/**
 * Format labs for note per product spec:
 * - No colon after label
 * - Show main value then (trends)
 * - Blank line between panels
 */
export function formatLabsForNote(
  labs: ParsedLabValue[],
  preferences: UserLabPreferences,
  customVisibility?: { [labName: string]: boolean },
  customTrendCounts?: { [labName: string]: number }
): string {
  const panels = groupLabsByPanel(labs);
  let out: string[] = [];

  for (const panel of panels) {
    const panelPrefs = preferences.panelSettings[panel.name];
    if (!panelPrefs) continue;
    const visibleLabs = panel.labs.filter((lab) => {
      const defVis = panelPrefs.visibleByDefault.includes(lab.standardizedName);
      const manual = customVisibility?.[lab.standardizedName] === true;
      return defVis || manual;
    });
    if (visibleLabs.length === 0) continue;

    for (const lab of visibleLabs) {
      const trendCount =
        customTrendCounts?.[lab.standardizedName] ||
        panelPrefs.customTrendCount?.[lab.standardizedName] ||
        preferences.defaultTrendCount;
      const displayTrends = lab.trendedValues.slice(0, trendCount);
      const trendsString = displayTrends.length ? ` (${displayTrends.join(', ')})` : '';
      // Per request: omit units and emojis in parsed output
      out.push(`${lab.standardizedName} ${lab.currentValue}${trendsString}`);
    }
    // Blank line between panels
    out.push('');
  }

  // Trim trailing blank line
  while (out.length && out[out.length - 1] === '') out.pop();
  return out.join('\n');
}

/** Get available labs for a panel (visible + hidden) */
export function getAvailableLabsForPanel(
  panelName: string,
  allLabs: ParsedLabValue[]
): { visible: ParsedLabValue[]; hidden: ParsedLabValue[] } {
  const panelLabs = allLabs.filter((lab) => lab.category === panelName);
  const preferences = DEFAULT_LAB_PREFERENCES;
  const panelPrefs = preferences.panelSettings[panelName];
  if (!panelPrefs) return { visible: panelLabs, hidden: [] };
  const visible = panelLabs.filter((lab) => panelPrefs.visibleByDefault.includes(lab.standardizedName));
  const hidden = panelLabs.filter(
    (lab) =>
      panelPrefs.hiddenButAvailable.includes(lab.standardizedName) ||
      (!panelPrefs.visibleByDefault.includes(lab.standardizedName) && !panelPrefs.hiddenButAvailable.includes(lab.standardizedName))
  );
  return { visible, hidden };
}
