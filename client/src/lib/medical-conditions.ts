// Common medical conditions for past medical history autocomplete
export const COMMON_ALLERGIES = [
  "Penicillin",
  "Sulfa drugs", 
  "Latex",
  "Iodine/Contrast dye",
  "Codeine",
  "Morphine",
  "Aspirin",
  "NSAIDs",
  "Adhesive tape",
  "Vancomycin",
  "Erythromycin",
  "Shellfish",
  "Peanuts",
  "Tree nuts",
  "Eggs", 
  "Milk/Dairy",
  "Soy",
  "Wheat/Gluten",
  "Bee stings",
  "Dust mites",
  "Pollen",
  "Pet dander",
  "Mold",
  "Food dyes",
  "Preservatives"
];

export const TOP_MEDICAL_ALLERGIES = [
  "Penicillin",
  "Sulfa drugs", 
  "NSAIDs",
  "Codeine",
  "Latex"
];

// Priority-based medical conditions (higher priority = more common)
interface MedicalConditionWithPriority {
  name: string;
  priority: number; // 1-10, where 10 is most common
}

const MEDICAL_CONDITIONS_WITH_PRIORITY: MedicalConditionWithPriority[] = [
  // Cardiovascular - Very common conditions get higher priority
  { name: "Hypertension", priority: 10 },
  { name: "Hyperlipidemia", priority: 9 },
  { name: "Coronary Artery Disease", priority: 8 },
  { name: "Atrial Fibrillation", priority: 7 },
  { name: "Heart Failure", priority: 7 },
  { name: "Dyslipidemia", priority: 7 },
  { name: "Myocardial Infarction", priority: 6 },
  { name: "Peripheral Artery Disease", priority: 5 },
  { name: "Stroke", priority: 6 },
  { name: "Transient Ischemic Attack", priority: 5 },
  { name: "Deep Vein Thrombosis", priority: 4 },
  { name: "Pulmonary Embolism", priority: 4 },
  { name: "Cardiomyopathy", priority: 3 },
  { name: "Valvular Disease", priority: 3 },
  
  // Endocrine - Type 2 Diabetes is much more common than Diabetes Insipidus
  { name: "Type 2 Diabetes Mellitus", priority: 10 },
  { name: "Diabetes Mellitus Type 2", priority: 10 }, // Alternative naming
  { name: "Diabetes Type 2", priority: 10 }, // Short version
  { name: "Hypothyroidism", priority: 8 },
  { name: "Type 1 Diabetes Mellitus", priority: 6 },
  { name: "Diabetes Mellitus Type 1", priority: 6 },
  { name: "Diabetes Type 1", priority: 6 },
  { name: "Hyperthyroidism", priority: 5 },
  { name: "Osteoporosis", priority: 6 },
  { name: "Osteopenia", priority: 5 },
  { name: "Thyroid Nodules", priority: 4 },
  { name: "Diabetes Insipidus", priority: 1 }, // Very rare condition, lowest priority
  { name: "Adrenal Insufficiency", priority: 2 },
  { name: "Cushing's Syndrome", priority: 2 },
  
  // Respiratory
  { name: "Asthma", priority: 9 },
  { name: "Chronic Obstructive Pulmonary Disease", priority: 8 },
  { name: "COPD", priority: 8 },
  { name: "Sleep Apnea", priority: 7 },
  { name: "Obstructive Sleep Apnea", priority: 7 },
  { name: "Pneumonia", priority: 6 },
  { name: "Chronic Bronchitis", priority: 5 },
  { name: "Emphysema", priority: 4 },
  { name: "Pulmonary Fibrosis", priority: 3 },
  { name: "Lung Cancer", priority: 4 },
  { name: "Tuberculosis", priority: 2 },
  
  // Gastrointestinal
  { name: "Gastroesophageal Reflux Disease", priority: 9 },
  { name: "GERD", priority: 9 },
  { name: "Irritable Bowel Syndrome", priority: 7 },
  { name: "IBS", priority: 7 },
  { name: "Fatty Liver Disease", priority: 7 },
  { name: "Non-Alcoholic Fatty Liver Disease", priority: 7 },
  { name: "NAFLD", priority: 7 },
  { name: "Gallstones", priority: 6 },
  { name: "Peptic Ulcer Disease", priority: 5 },
  { name: "Diverticulitis", priority: 5 },
  { name: "Inflammatory Bowel Disease", priority: 4 },
  { name: "Crohn's Disease", priority: 4 },
  { name: "Ulcerative Colitis", priority: 4 },
  { name: "Hepatitis B", priority: 3 },
  { name: "Hepatitis C", priority: 3 },
  { name: "Cirrhosis", priority: 4 },
  { name: "Pancreatitis", priority: 3 },
  
  // Neurological
  { name: "Migraine", priority: 8 },
  { name: "Headaches", priority: 8 },
  { name: "Neuropathy", priority: 6 },
  { name: "Peripheral Neuropathy", priority: 6 },
  { name: "Diabetic Neuropathy", priority: 5 },
  { name: "Seizure Disorder", priority: 5 },
  { name: "Epilepsy", priority: 5 },
  { name: "Dementia", priority: 5 },
  { name: "Essential Tremor", priority: 4 },
  { name: "Parkinson's Disease", priority: 4 },
  { name: "Alzheimer's Disease", priority: 4 },
  { name: "Multiple Sclerosis", priority: 3 },
  
  // Psychiatric
  { name: "Depression", priority: 9 },
  { name: "Major Depressive Disorder", priority: 9 },
  { name: "Anxiety", priority: 9 },
  { name: "Anxiety Disorder", priority: 9 },
  { name: "Generalized Anxiety Disorder", priority: 8 },
  { name: "Insomnia", priority: 7 },
  { name: "Attention Deficit Hyperactivity Disorder", priority: 6 },
  { name: "ADHD", priority: 6 },
  { name: "Bipolar Disorder", priority: 5 },
  { name: "Post-Traumatic Stress Disorder", priority: 5 },
  { name: "PTSD", priority: 5 },
  { name: "Panic Disorder", priority: 5 },
  { name: "Substance Use Disorder", priority: 5 },
  { name: "Obsessive-Compulsive Disorder", priority: 4 },
  { name: "OCD", priority: 4 },
  { name: "Schizophrenia", priority: 3 },
  
  // Rheumatologic/Autoimmune
  { name: "Osteoarthritis", priority: 8 },
  { name: "Rheumatoid Arthritis", priority: 6 },
  { name: "Fibromyalgia", priority: 6 },
  { name: "Gout", priority: 6 },
  { name: "Psoriatic Arthritis", priority: 4 },
  { name: "Ankylosing Spondylitis", priority: 3 },
  { name: "Systemic Lupus Erythematosus", priority: 3 },
  { name: "Lupus", priority: 3 },
  { name: "Sjögren's Syndrome", priority: 2 },
  { name: "Scleroderma", priority: 2 },
  
  // Hematologic/Oncologic
  { name: "Anemia", priority: 8 },
  { name: "Iron Deficiency Anemia", priority: 7 },
  { name: "Vitamin B12 Deficiency", priority: 5 },
  { name: "B12 Deficiency", priority: 5 },
  { name: "Breast Cancer", priority: 5 },
  { name: "Prostate Cancer", priority: 5 },
  { name: "Colon Cancer", priority: 4 },
  { name: "Lung Cancer", priority: 4 },
  { name: "Skin Cancer", priority: 4 },
  { name: "Thrombocytopenia", priority: 3 },
  { name: "Lymphoma", priority: 3 },
  { name: "Leukemia", priority: 3 },
  
  // Genitourinary
  { name: "Chronic Kidney Disease", priority: 7 },
  { name: "CKD", priority: 7 },
  { name: "Urinary Tract Infection", priority: 7 },
  { name: "UTI", priority: 7 },
  { name: "Benign Prostatic Hyperplasia", priority: 6 },
  { name: "BPH", priority: 6 },
  { name: "Kidney Stones", priority: 5 },
  { name: "Erectile Dysfunction", priority: 5 },
  { name: "Incontinence", priority: 4 },
  { name: "Urinary Incontinence", priority: 4 },
  
  // Dermatologic
  { name: "Eczema", priority: 6 },
  { name: "Psoriasis", priority: 5 },
  { name: "Acne", priority: 5 },
  { name: "Rosacea", priority: 4 },
  { name: "Melanoma", priority: 3 },
  { name: "Basal Cell Carcinoma", priority: 3 },
  { name: "Squamous Cell Carcinoma", priority: 3 },
  
  // Other Common Conditions
  { name: "Obesity", priority: 9 },
  { name: "Vitamin D Deficiency", priority: 7 },
  { name: "Seasonal Allergies", priority: 7 },
  { name: "Allergic Rhinitis", priority: 7 },
  { name: "Food Allergies", priority: 5 },
  { name: "Chronic Pain", priority: 6 },
  { name: "Chronic Fatigue Syndrome", priority: 4 },
  { name: "COVID-19", priority: 6 },
  { name: "Long COVID", priority: 4 },
  { name: "HIV/AIDS", priority: 3 },
  { name: "Hepatitis", priority: 3 }
];

// Keep the old array for backward compatibility
export const MEDICAL_CONDITIONS = MEDICAL_CONDITIONS_WITH_PRIORITY.map(c => c.name);

// Enhanced search function with priority-based sorting
export const searchMedicalConditions = (query: string, limit = 10): string[] => {
  if (!query || query.length < 2) return [];
  
  const normalizedQuery = query.toLowerCase().trim();
  
  // Search through conditions with priority scoring
  const results = MEDICAL_CONDITIONS_WITH_PRIORITY
    .filter(condition => {
      const conditionLower = condition.name.toLowerCase();
      return conditionLower.includes(normalizedQuery) || 
             isFuzzyMatch(normalizedQuery, conditionLower);
    })
    .map(condition => {
      const conditionLower = condition.name.toLowerCase();
      let score = condition.priority * 10; // Base score from priority (10-100)
      
      // Bonus for exact match at beginning
      if (conditionLower.startsWith(normalizedQuery)) {
        score += 50;
      }
      // Smaller bonus for word boundary match
      else if (conditionLower.includes(' ' + normalizedQuery)) {
        score += 25;
      }
      // Even smaller bonus for any match
      else if (conditionLower.includes(normalizedQuery)) {
        score += 10;
      }
      
      // Length penalty - prefer shorter, more common names
      score -= (condition.name.length / 100);
      
      return { ...condition, score };
    })
    .sort((a, b) => b.score - a.score) // Sort by score descending
    .map(item => item.name)
    .slice(0, limit);
  
  // Remove duplicates while preserving order
  return Array.from(new Set(results));
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

export const searchAllergies = (query: string, limit = 10): string[] => {
  if (!query || query.length < 1) return [];
  
  const normalizedQuery = query.toLowerCase().trim();
  
  // First, find exact matches at the beginning
  const exactMatches = COMMON_ALLERGIES.filter(allergy =>
    allergy.toLowerCase().startsWith(normalizedQuery)
  );
  
  // Then, find matches anywhere in the string
  const partialMatches = COMMON_ALLERGIES.filter(allergy =>
    allergy.toLowerCase().includes(normalizedQuery) &&
    !allergy.toLowerCase().startsWith(normalizedQuery)
  );
  
  // Add fuzzy matching for misspelled words
  const fuzzyMatches = COMMON_ALLERGIES.filter(allergy => {
    const allergyLower = allergy.toLowerCase();
    // Skip if already matched exactly
    if (allergyLower.includes(normalizedQuery)) return false;
    
    // Simple fuzzy matching: check for similar character sequences
    return isFuzzyMatch(normalizedQuery, allergyLower);
  });
  
  // Combine and limit results
  return [...exactMatches, ...partialMatches, ...fuzzyMatches].slice(0, limit);
};

// Get common medical abbreviations and their expansions
export const getMedicalConditionAbbreviations = () => {
  return {
    'DM': 'Diabetes Mellitus',
    'DM2': 'Type 2 Diabetes Mellitus',
    'DM1': 'Type 1 Diabetes Mellitus',
    'HTN': 'Hypertension',
    'HLD': 'Hyperlipidemia',
    'CAD': 'Coronary Artery Disease',
    'CHF': 'Congestive Heart Failure',
    'HF': 'Heart Failure',
    'HFrEF': 'Heart Failure with Reduced Ejection Fraction',
    'HFpEF': 'Heart Failure with Preserved Ejection Fraction',
    'COPD': 'Chronic Obstructive Pulmonary Disease',
    'OSA': 'Obstructive Sleep Apnea',
    'GERD': 'Gastroesophageal Reflux Disease',
    'IBS': 'Irritable Bowel Syndrome',
    'IBD': 'Inflammatory Bowel Disease',
    'UC': 'Ulcerative Colitis',
    'CD': 'Crohn\'s Disease',
    'NAFLD': 'Non-Alcoholic Fatty Liver Disease',
    'CKD': 'Chronic Kidney Disease',
    'ESRD': 'End-Stage Renal Disease',
    'AKI': 'Acute Kidney Injury',
    'UTI': 'Urinary Tract Infection',
    'BPH': 'Benign Prostatic Hyperplasia',
    'ADHD': 'Attention Deficit Hyperactivity Disorder',
    'MDD': 'Major Depressive Disorder',
    'GAD': 'Generalized Anxiety Disorder',
    'PTSD': 'Post-Traumatic Stress Disorder',
    'OCD': 'Obsessive-Compulsive Disorder',
    'RA': 'Rheumatoid Arthritis',
    'OA': 'Osteoarthritis',
    'SLE': 'Systemic Lupus Erythematosus',
    'MS': 'Multiple Sclerosis',
    'PD': 'Parkinson\'s Disease',
    'TIA': 'Transient Ischemic Attack',
    'CVA': 'Cerebrovascular Accident (Stroke)',
    'MI': 'Myocardial Infarction',
    'DVT': 'Deep Vein Thrombosis',
    'PE': 'Pulmonary Embolism',
    'PAD': 'Peripheral Artery Disease',
    'PVD': 'Peripheral Vascular Disease',
    'AF': 'Atrial Fibrillation',
    'AFib': 'Atrial Fibrillation',
    'VT': 'Ventricular Tachycardia',
    'SVT': 'Supraventricular Tachycardia',
    'TB': 'Tuberculosis',
    'HIV': 'Human Immunodeficiency Virus',
    'AIDS': 'Acquired Immunodeficiency Syndrome',
    'HBV': 'Hepatitis B Virus',
    'HCV': 'Hepatitis C Virus',
    'DKA': 'Diabetic Ketoacidosis',
    'HHS': 'Hyperosmolar Hyperglycemic State',
    'TSH': 'Thyroid Stimulating Hormone (for hypothyroidism/hyperthyroidism)',
    'B12': 'Vitamin B12 Deficiency'
  };
};