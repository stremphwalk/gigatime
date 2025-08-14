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
  
  // Combine and limit results
  return [...exactMatches, ...partialMatches].slice(0, limit);
};

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