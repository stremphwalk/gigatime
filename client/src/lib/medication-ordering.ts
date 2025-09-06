import { getMedicationByName, COMMON_MEDICATIONS } from "./medications";

// Therapeutic priority order for smart medication reordering
const THERAPEUTIC_PRIORITY_ORDER = [
  // Critical cardiac and anticoagulation first
  "Anticoagulants",
  "Antiplatelets", 
  "Antiarrhythmics",
  
  // Cardiovascular medications
  "ACE Inhibitors",
  "ARBs (Angiotensin Receptor Blockers)",
  "Beta Blockers",
  "Calcium Channel Blockers",
  "Statins",
  "Vasodilators",
  
  // Blood pressure and heart failure
  "Diuretics",
  "Alpha Blockers",
  
  // Diabetes management
  "Insulin",
  "Biguanides",
  "Sulfonylureas",
  "DPP-4 Inhibitors",
  "GLP-1 Agonists",
  "SGLT-2 Inhibitors",
  
  // Mental health medications
  "Antidepressants (SSRIs)",
  "Antidepressants (SNRIs)",
  "Antipsychotics",
  "Anxiolytics",
  "Benzodiazepines",
  
  // Neurological
  "Anticonvulsants",
  
  // Pain management
  "Non-opioid Analgesics",
  "NSAIDs",
  "Opioid Analgesics",
  "Muscle Relaxants",
  "Topical Analgesics",
  
  // Respiratory
  "Bronchodilators",
  "Corticosteroids",
  "Leukotriene Modifiers",
  
  // GI medications
  "Proton Pump Inhibitors (PPIs)",
  "H2 Receptor Blockers",
  "Antacids",
  "Prokinetic Agents",
  "Antidiarrheals",
  
  // Antibiotics
  "Penicillins",
  "Macrolides",
  "Fluoroquinolones", 
  "Cephalosporins",
  "Antivirals",
  "Antifungals",
  
  // Endocrine
  "Thyroid Hormones",
  "Bisphosphonates",
  
  // Allergy/immunology
  "Antihistamines",
  "Decongestants"
];

export interface ParsedMedication {
  originalLine: string;
  medicationName: string;
  dosage?: string;
  frequency?: string;
  route?: string;
  indication?: string;
  lineNumber: number;
  matchedMedication?: any;
}

/**
 * Parse medication text and extract individual medications with their details
 */
export function parseMedicationsFromText(text: string): ParsedMedication[] {
  if (!text || text.trim() === '') return [];

  const lines = text.split('\n').filter(line => line.trim());
  const medications: ParsedMedication[] = [];

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    // Try to parse each line as a medication
    const parsedMed = parseMedicationLine(trimmedLine, index);
    if (parsedMed) {
      medications.push(parsedMed);
    }
  });

  return medications;
}

/**
 * Parse a single line to extract medication information
 */
function parseMedicationLine(line: string, lineNumber: number): ParsedMedication | null {
  // Remove common prefixes and bullet points
  let cleanLine = line.replace(/^[-*•\d+\.\)]\s*/, '').trim();
  
  // Common medication patterns to match
  const medicationPatterns = [
    // Pattern: Medication dosage frequency
    /^([A-Za-z\s\-]+?)\s+(\d+(?:\.\d+)?\s*(?:mg|g|mcg|IU|mL|puffs?|units|tablets?|caps?)\b)\s*(.*?)(?:\s+for\s+(.+))?$/i,
    // Pattern: Medication with dosage and route
    /^([A-Za-z\s\-]+?)\s+(\d+(?:\.\d+)?\s*(?:mg|g|mcg|IU|mL|puffs?|units)\b)\s*(PO|IV|IM|SC|SL|IN|topical|inhaled|PR|PV)?\s*(.*?)$/i,
    // Simple pattern: Just medication name (possibly with dosage/frequency after)
    /^([A-Za-z\s\-]+?)(?:\s+(.+))?$/
  ];

  for (const pattern of medicationPatterns) {
    const match = cleanLine.match(pattern);
    if (match) {
      const medicationName = match[1].trim();
      
      // Try to find this medication in our database
      const matchedMedication = findMedicationInDatabase(medicationName);
      
      if (matchedMedication || isMedicationName(medicationName)) {
        const parsed: ParsedMedication = {
          originalLine: line,
          medicationName,
          lineNumber,
          matchedMedication
        };

        // Extract additional information if available
        if (match[2]) {
          const remainder = match[2];
          parsed.dosage = extractDosage(remainder);
          parsed.frequency = extractFrequency(remainder);
          parsed.route = extractRoute(remainder);
          parsed.indication = extractIndication(remainder);
        }

        return parsed;
      }
    }
  }

  return null;
}

/**
 * Find medication in our database by name (fuzzy matching)
 */
function findMedicationInDatabase(name: string) {
  // First try exact match
  let found = getMedicationByName(name);
  if (found) return found;

  // Try partial match
  const normalizedName = name.toLowerCase().trim();
  found = COMMON_MEDICATIONS.find(med => 
    med.name.toLowerCase().includes(normalizedName) ||
    normalizedName.includes(med.name.toLowerCase()) ||
    (med.genericName && (
      med.genericName.toLowerCase().includes(normalizedName) ||
      normalizedName.includes(med.genericName.toLowerCase())
    ))
  );

  return found;
}

/**
 * Check if a name looks like a medication (basic heuristic)
 */
function isMedicationName(name: string): boolean {
  const normalizedName = name.toLowerCase().trim();
  
  // Common medication suffixes/patterns
  const medicationIndicators = [
    /^[a-z]+pril$/i,      // ACE inhibitors (lisinopril, enalapril)
    /^[a-z]+sartan$/i,    // ARBs (losartan, valsartan)
    /^[a-z]+olol$/i,      // Beta blockers (metoprolol, atenolol)
    /^[a-z]+dipine$/i,    // Calcium channel blockers (amlodipine)
    /^[a-z]+statin$/i,    // Statins (simvastatin, atorvastatin)
    /^[a-z]+mycin$/i,     // Antibiotics (erythromycin, azithromycin)
    /^[a-z]+cillin$/i,    // Penicillins (amoxicillin, ampicillin)
    /^[a-z]+ide$/i,       // Diuretics (furosemide, hydrochlorothiazide)
    /^[a-z]+prazole$/i,   // PPIs (omeprazole, pantoprazole)
  ];

  // Check for common patterns
  if (medicationIndicators.some(pattern => pattern.test(normalizedName))) {
    return true;
  }

  // Length-based heuristic (medication names are usually 5-20 characters)
  return normalizedName.length >= 5 && normalizedName.length <= 25 && 
         /^[a-z\s\-]+$/i.test(normalizedName);
}

/**
 * Extract dosage information from text
 */
function extractDosage(text: string): string | undefined {
  const dosageMatch = text.match(/(\d+(?:\.\d+)?\s*(?:mg|g|mcg|IU|mL|puffs?|units|tablets?|caps?))/i);
  return dosageMatch ? dosageMatch[1] : undefined;
}

/**
 * Extract frequency information from text
 */
function extractFrequency(text: string): string | undefined {
  const frequencyPatterns = [
    /\b(once|twice|three times|four times)\s+(?:a\s+|per\s+)?day\b/i,
    /\b(daily|BID|TID|QID|Q\d+H|PRN|as needed)\b/i,
    /\b(\d+)\s*times?\s*(?:a\s+|per\s+)?day\b/i,
    /\bevery\s+(\d+)\s*hours?\b/i
  ];

  for (const pattern of frequencyPatterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }

  return undefined;
}

/**
 * Extract route information from text
 */
function extractRoute(text: string): string | undefined {
  const routeMatch = text.match(/\b(PO|IV|IM|SC|SL|IN|topical|inhaled|intranasal|PR|PV|oral|by mouth)\b/i);
  return routeMatch ? routeMatch[1] : undefined;
}

/**
 * Extract indication information from text
 */
function extractIndication(text: string): string | undefined {
  const indicationMatch = text.match(/\bfor\s+(.+?)(?:\s|$)/i);
  return indicationMatch ? indicationMatch[1] : undefined;
}

/**
 * Get therapeutic priority for a medication (lower number = higher priority)
 */
function getTherapeuticPriority(medication: ParsedMedication): number {
  if (!medication.matchedMedication) {
    return 999; // Unknown medications go to the end
  }

  const subcategory = medication.matchedMedication.subcategory;
  if (!subcategory) {
    return 900; // Medications without subcategory go near the end
  }

  const priority = THERAPEUTIC_PRIORITY_ORDER.indexOf(subcategory);
  return priority >= 0 ? priority : 800; // Unknown subcategories go near the end
}

/**
 * Smart reorder medications by therapeutic category
 */
export function smartReorderMedications(medications: ParsedMedication[]): ParsedMedication[] {
  return medications
    .slice() // Create a copy
    .sort((a, b) => {
      const priorityA = getTherapeuticPriority(a);
      const priorityB = getTherapeuticPriority(b);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Within same therapeutic class, sort alphabetically
      return a.medicationName.localeCompare(b.medicationName);
    });
}

/**
 * Convert parsed medications back to text format
 */
export function medicationsToText(medications: ParsedMedication[]): string {
  return medications
    .map(med => med.originalLine)
    .join('\n');
}

/**
 * Manual reorder medications based on user selection order
 */
export function manualReorderMedications(
  medications: ParsedMedication[], 
  selectionOrder: number[]
): ParsedMedication[] {
  if (selectionOrder.length !== medications.length) {
    return medications; // Invalid selection order
  }

  return selectionOrder.map(index => medications[index]);
}
