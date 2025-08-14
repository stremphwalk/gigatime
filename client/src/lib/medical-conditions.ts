// Common medical conditions for past medical history autocomplete
export const MEDICAL_CONDITIONS = [
  // Cardiovascular
  "Hypertension",
  "Coronary Artery Disease",
  "Atrial Fibrillation",
  "Heart Failure",
  "Myocardial Infarction",
  "Peripheral Artery Disease",
  "Cardiomyopathy",
  "Valvular Disease",
  "Hyperlipidemia",
  "Dyslipidemia",
  "Deep Vein Thrombosis",
  "Pulmonary Embolism",
  "Stroke",
  "Transient Ischemic Attack",
  
  // Endocrine
  "Type 2 Diabetes Mellitus",
  "Type 1 Diabetes Mellitus",
  "Hypothyroidism",
  "Hyperthyroidism",
  "Thyroid Nodules",
  "Diabetes Insipidus",
  "Adrenal Insufficiency",
  "Cushing's Syndrome",
  "Osteoporosis",
  "Osteopenia",
  
  // Respiratory
  "Asthma",
  "Chronic Obstructive Pulmonary Disease",
  "Sleep Apnea",
  "Pulmonary Fibrosis",
  "Pneumonia",
  "Chronic Bronchitis",
  "Emphysema",
  "Lung Cancer",
  "Tuberculosis",
  
  // Gastrointestinal
  "Gastroesophageal Reflux Disease",
  "Peptic Ulcer Disease",
  "Inflammatory Bowel Disease",
  "Crohn's Disease",
  "Ulcerative Colitis",
  "Irritable Bowel Syndrome",
  "Diverticulitis",
  "Hepatitis B",
  "Hepatitis C",
  "Cirrhosis",
  "Fatty Liver Disease",
  "Gallstones",
  "Pancreatitis",
  
  // Neurological
  "Migraine",
  "Epilepsy",
  "Parkinson's Disease",
  "Alzheimer's Disease",
  "Multiple Sclerosis",
  "Neuropathy",
  "Seizure Disorder",
  "Dementia",
  "Essential Tremor",
  
  // Psychiatric
  "Major Depressive Disorder",
  "Bipolar Disorder",
  "Anxiety Disorder",
  "Generalized Anxiety Disorder",
  "Panic Disorder",
  "Post-Traumatic Stress Disorder",
  "Obsessive-Compulsive Disorder",
  "Attention Deficit Hyperactivity Disorder",
  "Schizophrenia",
  "Substance Use Disorder",
  
  // Rheumatologic/Autoimmune
  "Rheumatoid Arthritis",
  "Osteoarthritis",
  "Systemic Lupus Erythematosus",
  "Fibromyalgia",
  "Gout",
  "Psoriatic Arthritis",
  "Ankylosing Spondylitis",
  "Sjögren's Syndrome",
  "Scleroderma",
  
  // Hematologic/Oncologic
  "Anemia",
  "Iron Deficiency Anemia",
  "B12 Deficiency",
  "Thrombocytopenia",
  "Breast Cancer",
  "Prostate Cancer",
  "Colon Cancer",
  "Lymphoma",
  "Leukemia",
  
  // Genitourinary
  "Chronic Kidney Disease",
  "Kidney Stones",
  "Benign Prostatic Hyperplasia",
  "Urinary Tract Infection",
  "Incontinence",
  
  // Dermatologic
  "Eczema",
  "Psoriasis",
  "Melanoma",
  "Basal Cell Carcinoma",
  "Skin Cancer",
  
  // Other Common Conditions
  "Obesity",
  "Chronic Pain",
  "Allergies",
  "Seasonal Allergies",
  "Food Allergies",
  "Vitamin D Deficiency",
  "Chronic Fatigue Syndrome",
  "Hypothermia",
  "Hyperthermia"
];

export const searchMedicalConditions = (query: string, limit = 10): string[] => {
  if (!query || query.length < 2) return [];
  
  const normalizedQuery = query.toLowerCase().trim();
  
  // First, find exact matches at the beginning
  const exactMatches = MEDICAL_CONDITIONS.filter(condition =>
    condition.toLowerCase().startsWith(normalizedQuery)
  );
  
  // Then, find matches anywhere in the string
  const partialMatches = MEDICAL_CONDITIONS.filter(condition =>
    condition.toLowerCase().includes(normalizedQuery) &&
    !condition.toLowerCase().startsWith(normalizedQuery)
  );
  
  // Add fuzzy matching for misspelled words
  const fuzzyMatches = MEDICAL_CONDITIONS.filter(condition => {
    const conditionLower = condition.toLowerCase();
    // Skip if already matched exactly
    if (conditionLower.includes(normalizedQuery)) return false;
    
    // Simple fuzzy matching: check for similar character sequences
    return isFuzzyMatch(normalizedQuery, conditionLower);
  });
  
  // Combine and limit results
  return [...exactMatches, ...partialMatches, ...fuzzyMatches].slice(0, limit);
};

// Simple fuzzy matching algorithm for spell tolerance
function isFuzzyMatch(query: string, target: string): boolean {
  if (query.length < 3) return false;
  
  // Calculate Levenshtein-like similarity
  const maxDistance = Math.floor(query.length / 3); // Allow 1 error per 3 characters
  
  // Check if query is a subsequence of target with some tolerance
  let queryIndex = 0;
  let errors = 0;
  
  for (let i = 0; i < target.length && queryIndex < query.length; i++) {
    if (target[i] === query[queryIndex]) {
      queryIndex++;
    } else if (errors < maxDistance) {
      // Allow character substitution/insertion
      if (i + 1 < target.length && target[i + 1] === query[queryIndex]) {
        errors++;
        queryIndex++;
        i++; // Skip the mismatched character
      } else if (queryIndex + 1 < query.length && target[i] === query[queryIndex + 1]) {
        errors++;
        queryIndex += 2;
      } else {
        errors++;
      }
    }
  }
  
  return queryIndex >= query.length - 1 && errors <= maxDistance;
}

export const getMedicalConditionAbbreviations = (): Record<string, string> => {
  return {
    "dm2": "Type 2 Diabetes Mellitus",
    "dm1": "Type 1 Diabetes Mellitus",
    "htn": "Hypertension",
    "cad": "Coronary Artery Disease",
    "chf": "Heart Failure",
    "afib": "Atrial Fibrillation",
    "copd": "Chronic Obstructive Pulmonary Disease",
    "gerd": "Gastroesophageal Reflux Disease",
    "osa": "Sleep Apnea",
    "mi": "Myocardial Infarction",
    "tia": "Transient Ischemic Attack",
    "dvt": "Deep Vein Thrombosis",
    "pe": "Pulmonary Embolism",
    "ckd": "Chronic Kidney Disease",
    "bph": "Benign Prostatic Hyperplasia",
    "ra": "Rheumatoid Arthritis",
    "oa": "Osteoarthritis",
    "ibd": "Inflammatory Bowel Disease",
    "ibs": "Irritable Bowel Syndrome",
    "ptsd": "Post-Traumatic Stress Disorder",
    "adhd": "Attention Deficit Hyperactivity Disorder",
    "ocd": "Obsessive-Compulsive Disorder"
  };
};