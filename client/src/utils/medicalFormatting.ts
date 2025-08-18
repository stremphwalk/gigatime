/**
 * Medical terminology and formatting utilities for dictation
 * Enhances accuracy and consistency of medical dictation
 */

// Common medical abbreviations and their proper formatting
export const MEDICAL_ABBREVIATIONS = {
  // Dosing frequency
  'bid': 'BID',
  'b.i.d.': 'BID',
  'b i d': 'BID',
  'twice daily': 'BID',
  'tid': 'TID', 
  't.i.d.': 'TID',
  't i d': 'TID',
  'three times daily': 'TID',
  'qid': 'QID',
  'q.i.d.': 'QID',
  'q i d': 'QID',
  'four times daily': 'QID',
  'qd': 'QD',
  'q.d.': 'QD',
  'q d': 'QD',
  'daily': 'daily',
  'once daily': 'daily',
  'prn': 'PRN',
  'p.r.n.': 'PRN',
  'p r n': 'PRN',
  'as needed': 'PRN',
  'q4h': 'Q4H',
  'q 4 h': 'Q4H',
  'every 4 hours': 'Q4H',
  'q6h': 'Q6H',
  'q 6 h': 'Q6H',
  'every 6 hours': 'Q6H',
  'q8h': 'Q8H',
  'q 8 h': 'Q8H',
  'every 8 hours': 'Q8H',
  'q12h': 'Q12H',
  'q 12 h': 'Q12H',
  'every 12 hours': 'Q12H',

  // Routes of administration
  'po': 'PO',
  'p.o.': 'PO',
  'p o': 'PO',
  'by mouth': 'PO',
  'oral': 'PO',
  'orally': 'PO',
  'iv': 'IV',
  'i.v.': 'IV',
  'i v': 'IV',
  'intravenous': 'IV',
  'intravenously': 'IV',
  'im': 'IM',
  'i.m.': 'IM',
  'i m': 'IM',
  'intramuscular': 'IM',
  'intramuscularly': 'IM',
  'sc': 'SC',
  's.c.': 'SC',
  's c': 'SC',
  'sq': 'SQ',
  's.q.': 'SQ',
  's q': 'SQ',
  'subcutaneous': 'SC',
  'subcutaneously': 'SC',
  'sl': 'SL',
  's.l.': 'SL',
  's l': 'SL',
  'sublingual': 'SL',
  'sublingually': 'SL',
  'pr': 'PR',
  'p.r.': 'PR',
  'p r': 'PR',
  'per rectum': 'PR',
  'rectally': 'PR',
  'pv': 'PV',
  'p.v.': 'PV',
  'p v': 'PV',
  'per vagina': 'PV',
  'vaginally': 'PV',

  // Medical units
  'milligrams': 'mg',
  'milligram': 'mg',
  'mgs': 'mg',
  'milliequivalents': 'mEq',
  'milliequivalent': 'mEq',
  'international units': 'IU',
  'international unit': 'IU',
  'units': 'units',
  'unit': 'unit',
  'milliliters': 'mL',
  'milliliter': 'mL',
  'mls': 'mL',
  'cc': 'cc',
  'cubic centimeters': 'cc',
  'cubic centimeter': 'cc',
  'liters': 'L',
  'liter': 'L',
  'micrograms': 'mcg',
  'microgram': 'mcg',
  'mcgs': 'mcg',
  'grams': 'g',
  'gram': 'g',
  'kilograms': 'kg',
  'kilogram': 'kg',
  'pounds': 'lbs',
  'pound': 'lb',

  // Common medical terms
  'npo': 'NPO',
  'n.p.o.': 'NPO',
  'n p o': 'NPO',
  'nothing by mouth': 'NPO',
  'dnr': 'DNR',
  'd.n.r.': 'DNR',
  'd n r': 'DNR',
  'do not resuscitate': 'DNR',
  'cpr': 'CPR',
  'c.p.r.': 'CPR',
  'c p r': 'CPR',
  'cardiopulmonary resuscitation': 'CPR',
  'icu': 'ICU',
  'i.c.u.': 'ICU',
  'i c u': 'ICU',
  'intensive care unit': 'ICU',
  'er': 'ER',
  'e.r.': 'ER',
  'e r': 'ER',
  'emergency room': 'ER',
  'emergency department': 'ED',
  'ed': 'ED',
  'e.d.': 'ED',
  'e d': 'ED',
  'or': 'OR',
  'o.r.': 'OR',
  'o r': 'OR',
  'operating room': 'OR',
};

// Medical terminology that should be capitalized
export const MEDICAL_PROPER_NOUNS = new Set([
  // Anatomical structures
  'Achilles', 'Adam\'s apple', 'Bartholin', 'Broca', 'Wernicke',
  'Eustachian', 'Fallopian', 'Graafian', 'Hassall', 'Henle',
  'Kupffer', 'Langerhans', 'Leydig', 'Meibomian', 'Pacinian',
  'Peyer', 'Purkinje', 'Ranvier', 'Schwann', 'Sertoli',
  
  // Diseases and syndromes
  'Alzheimer', 'Parkinson', 'Huntington', 'Crohn', 'Graves',
  'Hashimoto', 'Addison', 'Cushing', 'Marfan', 'Turner',
  'Down', 'Hodgkin', 'Non-Hodgkin', 'Lou Gehrig', 'Bell',
  'Guillain-Barré', 'Sjögren', 'Raynaud', 'Ménière',
  
  // Tests and procedures
  'Gram', 'Papanicolaou', 'Pap', 'Western blot', 'Northern blot',
  'Southern blot', 'ELISA', 'PCR', 'MRI', 'CT', 'PET',
  'ECG', 'EKG', 'EEG', 'EMG', 'ECHO',
  
  // Medications (brand names)
  'Tylenol', 'Advil', 'Motrin', 'Aspirin', 'Lipitor', 'Nexium',
  'Prilosec', 'Zocor', 'Crestor', 'Plavix', 'Coumadin',
  'Warfarin', 'Heparin', 'Insulin', 'Metformin', 'Lisinopril',
]);

// Common drug suffixes that help identify medications
export const DRUG_SUFFIXES = new Set([
  'cillin', 'mycin', 'cycline', 'floxacin', 'sulfa', 'prazole',
  'sartan', 'pril', 'olol', 'pine', 'statin', 'zide', 'thiazide',
  'furosemide', 'metformin', 'insulin', 'warfarin', 'heparin',
]);

// Medical formatting patterns
export const MEDICAL_PATTERNS = {
  // Dosage patterns: "50 milligrams" -> "50 mg"
  dosage: /(\d+(?:\.\d+)?)\s*(milligrams?|mgs?|milliliters?|mls?|units?|international\s+units?|grams?|kilograms?|micrograms?|mcgs?|milliequivalents?|cubic\s+centimeters?|cc)/gi,
  
  // Vital signs patterns
  bloodPressure: /(\d{2,3})\s*(?:over|\/)\s*(\d{2,3})/gi,
  temperature: /(\d{2,3}(?:\.\d+)?)\s*degrees?(?:\s+fahrenheit|\s+celsius|°?[fc])?/gi,
  heartRate: /(\d{2,3})\s*(?:beats?\s+per\s+minute|bpm)/gi,
  
  // Time patterns for medical schedules
  timePattern: /(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)/gi,
  
  // Medical abbreviation patterns
  abbreviationPattern: /\b([a-z])\s*\.?\s*([a-z])\s*\.?\s*([a-z])?\s*\.?\b/gi,
};

/**
 * Applies comprehensive medical formatting to transcribed text
 */
export function formatMedicalText(text: string): string {
  if (!text || typeof text !== 'string') return text;

  let formatted = text;

  // Apply medical abbreviation replacements
  Object.entries(MEDICAL_ABBREVIATIONS).forEach(([key, value]) => {
    const regex = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    formatted = formatted.replace(regex, value as string);
  });

  // Format dosages
  formatted = formatted.replace(MEDICAL_PATTERNS.dosage, (match, amount, unit) => {
    const standardUnit = MEDICAL_ABBREVIATIONS[unit.toLowerCase() as keyof typeof MEDICAL_ABBREVIATIONS] || unit;
    return `${amount} ${standardUnit}`;
  });

  // Format blood pressure
  formatted = formatted.replace(MEDICAL_PATTERNS.bloodPressure, '$1/$2');

  // Format temperature
  formatted = formatted.replace(MEDICAL_PATTERNS.temperature, (match, temp, ...args) => {
    return `${temp}°F`; // Default to Fahrenheit in medical context
  });

  // Format heart rate
  formatted = formatted.replace(MEDICAL_PATTERNS.heartRate, '$1 BPM');

  // Capitalize proper medical nouns
  MEDICAL_PROPER_NOUNS.forEach(term => {
    const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    formatted = formatted.replace(regex, term);
  });

  // Smart capitalization for drug names (basic heuristic)
  formatted = formatted.replace(/\b(\w+(?:cillin|mycin|cycline|floxacin|prazole|sartan|pril|olol|pine|statin|zide))\b/gi, 
    (match) => match.toLowerCase());

  // Clean up extra spaces
  formatted = formatted.replace(/\s+/g, ' ').trim();

  return formatted;
}

/**
 * Enhanced context hints for Deepgram to improve medical recognition
 * Limited to top 20 most important terms to avoid URL length issues
 */
export const MEDICAL_CONTEXT_HINTS = [
  // Most critical medical terms
  'blood pressure', 'heart rate', 'chest pain', 'diabetes', 'hypertension',
  'milligrams', 'twice daily', 'three times daily', 'by mouth', 'intravenously',
  'lisinopril', 'metformin', 'aspirin', 'insulin', 'prednisone',
  'pneumonia', 'asthma', 'fever', 'nausea', 'headache'
];

/**
 * Smart punctuation for medical dictation
 */
export function addMedicalPunctuation(text: string): string {
  let formatted = text;

  // Add periods after dosages
  formatted = formatted.replace(/(\d+\s*(?:mg|mL|cc|units?|IU|mEq))\s+(?=[A-Z])/g, '$1. ');
  
  // Add periods after time-based instructions
  formatted = formatted.replace(/(BID|TID|QID|QD|PRN|Q\d+H)\s+(?=[A-Z])/g, '$1. ');
  
  // Add periods after route abbreviations when followed by dosing
  formatted = formatted.replace(/(PO|IV|IM|SC|SL|PR|PV)\s+(\d+)/g, '$1. $2');
  
  // Ensure sentences start with capital letters
  formatted = formatted.replace(/^\w/g, (match) => match.toUpperCase());
  formatted = formatted.replace(/\.\s+\w/g, (match) => match.toUpperCase());

  return formatted;
}

/**
 * Validates if text contains medical context
 */
export function isMedicalContext(text: string): boolean {
  const medicalKeywords = [
    'patient', 'diagnosis', 'treatment', 'medication', 'prescription',
    'symptom', 'examination', 'vital signs', 'blood pressure', 'heart rate',
    'mg', 'mL', 'BID', 'TID', 'PO', 'IV', 'pain', 'fever', 'nausea'
  ];
  
  const lowerText = text.toLowerCase();
  return medicalKeywords.some(keyword => lowerText.includes(keyword));
}