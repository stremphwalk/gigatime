// Common medications database with dosages and frequencies
export interface MedicationInfo {
  name: string;
  genericName?: string;
  commonDosages: string[];
  commonFrequencies: string[];
  category: string;
  subcategory?: string;
  indication?: string;
}

// Medication categories for organization and filtering
export const MEDICATION_CATEGORIES = {
  "Antihypertensive Agents": {
    name: "Antihypertensive Agents",
    subcategories: [
      "ACE Inhibitors",
      "ARBs (Angiotensin Receptor Blockers)",
      "Beta Blockers",
      "Calcium Channel Blockers",
      "Diuretics",
      "Alpha Blockers"
    ]
  },
  "Antidiabetic Agents": {
    name: "Antidiabetic Agents", 
    subcategories: [
      "Biguanides",
      "Sulfonylureas",
      "Insulin",
      "DPP-4 Inhibitors",
      "GLP-1 Agonists",
      "SGLT-2 Inhibitors"
    ]
  },
  "Cardiovascular Agents": {
    name: "Cardiovascular Agents",
    subcategories: [
      "Statins",
      "Anticoagulants", 
      "Antiplatelets",
      "Antiarrhythmics",
      "Vasodilators"
    ]
  },
  "Central Nervous System": {
    name: "Central Nervous System",
    subcategories: [
      "Antidepressants (SSRIs)",
      "Antidepressants (SNRIs)", 
      "Benzodiazepines",
      "Anticonvulsants",
      "Antipsychotics",
      "Anxiolytics"
    ]
  },
  "Pain Management": {
    name: "Pain Management",
    subcategories: [
      "NSAIDs",
      "Opioid Analgesics",
      "Non-opioid Analgesics",
      "Muscle Relaxants",
      "Topical Analgesics"
    ]
  },
  "Respiratory Agents": {
    name: "Respiratory Agents",
    subcategories: [
      "Bronchodilators",
      "Corticosteroids",
      "Leukotriene Modifiers",
      "Antihistamines",
      "Decongestants"
    ]
  },
  "Gastrointestinal Agents": {
    name: "Gastrointestinal Agents",
    subcategories: [
      "Proton Pump Inhibitors (PPIs)",
      "H2 Receptor Blockers",
      "Antacids",
      "Prokinetic Agents",
      "Antidiarrheals"
    ]
  },
  "Antimicrobial Agents": {
    name: "Antimicrobial Agents",
    subcategories: [
      "Penicillins",
      "Macrolides", 
      "Fluoroquinolones",
      "Cephalosporins",
      "Antivirals",
      "Antifungals"
    ]
  },
  "Endocrine Agents": {
    name: "Endocrine Agents",
    subcategories: [
      "Thyroid Hormones",
      "Corticosteroids",
      "Sex Hormones",
      "Osteoporosis Agents"
    ]
  }
} as const;

export const COMMON_MEDICATIONS: MedicationInfo[] = [
  // Antidiabetic Agents
  {
    name: "Metformin",
    genericName: "metformin",
    commonDosages: ["250mg", "500mg", "1000mg"],
    commonFrequencies: ["BID", "TID", "QD"],
    category: "Antidiabetic Agents",
    subcategory: "Biguanides",
    indication: "Type 2 diabetes"
  },
  {
    name: "Insulin Lispro",
    genericName: "insulin lispro",
    commonDosages: ["10 units", "20 units", "30 units", "40 units"],
    commonFrequencies: ["with meals", "TID"],
    category: "Antidiabetic Agents",
    subcategory: "Insulin",
    indication: "Type 1 and Type 2 diabetes"
  },
  {
    name: "Glipizide",
    genericName: "glipizide",
    commonDosages: ["2.5mg", "5mg", "10mg"],
    commonFrequencies: ["QD", "BID"],
    category: "Antidiabetic Agents",
    subcategory: "Sulfonylureas",
    indication: "Type 2 diabetes"
  },
  {
    name: "Sitagliptin",
    genericName: "sitagliptin",
    commonDosages: ["25mg", "50mg", "100mg"],
    commonFrequencies: ["QD"],
    category: "Antidiabetic Agents",
    subcategory: "DPP-4 Inhibitors",
    indication: "Type 2 diabetes"
  },
  
  // Antihypertensive Agents - ACE Inhibitors
  {
    name: "Lisinopril",
    genericName: "lisinopril",
    commonDosages: ["2.5mg", "5mg", "10mg", "20mg"],
    commonFrequencies: ["QD", "BID"],
    category: "Antihypertensive Agents",
    subcategory: "ACE Inhibitors",
    indication: "Hypertension, heart failure"
  },
  {
    name: "Enalapril",
    genericName: "enalapril",
    commonDosages: ["2.5mg", "5mg", "10mg", "20mg"],
    commonFrequencies: ["BID"],
    category: "Antihypertensive Agents",
    subcategory: "ACE Inhibitors",
    indication: "Hypertension, heart failure"
  },
  
  // Antihypertensive Agents - ARBs
  {
    name: "Losartan",
    genericName: "losartan",
    commonDosages: ["25mg", "50mg", "100mg"],
    commonFrequencies: ["QD", "BID"],
    category: "Antihypertensive Agents",
    subcategory: "ARBs (Angiotensin Receptor Blockers)",
    indication: "Hypertension"
  },
  {
    name: "Valsartan",
    genericName: "valsartan",
    commonDosages: ["40mg", "80mg", "160mg", "320mg"],
    commonFrequencies: ["QD", "BID"],
    category: "Antihypertensive Agents",
    subcategory: "ARBs (Angiotensin Receptor Blockers)",
    indication: "Hypertension, heart failure"
  },
  
  // Antihypertensive Agents - Calcium Channel Blockers
  {
    name: "Amlodipine",
    genericName: "amlodipine",
    commonDosages: ["2.5mg", "5mg", "10mg"],
    commonFrequencies: ["QD"],
    category: "Antihypertensive Agents",
    subcategory: "Calcium Channel Blockers",
    indication: "Hypertension, angina"
  },
  {
    name: "Nifedipine",
    genericName: "nifedipine",
    commonDosages: ["30mg", "60mg", "90mg"],
    commonFrequencies: ["QD"],
    category: "Antihypertensive Agents",
    subcategory: "Calcium Channel Blockers",
    indication: "Hypertension"
  },
  
  // Antihypertensive Agents - Beta Blockers
  {
    name: "Metoprolol",
    genericName: "metoprolol",
    commonDosages: ["25mg", "50mg", "100mg"],
    commonFrequencies: ["BID", "QD"],
    category: "Antihypertensive Agents",
    subcategory: "Beta Blockers",
    indication: "Hypertension, heart failure, post-MI"
  },
  {
    name: "Atenolol",
    genericName: "atenolol",
    commonDosages: ["25mg", "50mg", "100mg"],
    commonFrequencies: ["QD"],
    category: "Antihypertensive Agents",
    subcategory: "Beta Blockers",
    indication: "Hypertension, angina"
  },
  
  // Antihypertensive Agents - Diuretics
  {
    name: "Hydrochlorothiazide",
    genericName: "hydrochlorothiazide",
    commonDosages: ["12.5mg", "25mg", "50mg"],
    commonFrequencies: ["QD"],
    category: "Antihypertensive Agents",
    subcategory: "Diuretics",
    indication: "Hypertension, edema"
  },
  {
    name: "Furosemide",
    genericName: "furosemide",
    commonDosages: ["20mg", "40mg", "80mg"],
    commonFrequencies: ["QD", "BID"],
    category: "Antihypertensive Agents",
    subcategory: "Diuretics",
    indication: "Heart failure, edema"
  },
  
  // Cardiovascular Agents - Statins
  {
    name: "Atorvastatin",
    genericName: "atorvastatin",
    commonDosages: ["10mg", "20mg", "40mg", "80mg"],
    commonFrequencies: ["QD"],
    category: "Cardiovascular Agents",
    subcategory: "Statins",
    indication: "Hyperlipidemia, CVD prevention"
  },
  {
    name: "Simvastatin",
    genericName: "simvastatin",
    commonDosages: ["10mg", "20mg", "40mg"],
    commonFrequencies: ["QD"],
    category: "Cardiovascular Agents",
    subcategory: "Statins",
    indication: "Hyperlipidemia"
  },
  {
    name: "Rosuvastatin",
    genericName: "rosuvastatin",
    commonDosages: ["5mg", "10mg", "20mg", "40mg"],
    commonFrequencies: ["QD"],
    category: "Cardiovascular Agents",
    subcategory: "Statins",
    indication: "Hyperlipidemia, CVD prevention"
  },
  
  // Cardiovascular Agents - Anticoagulants
  {
    name: "Warfarin",
    genericName: "warfarin",
    commonDosages: ["1mg", "2mg", "2.5mg", "3mg", "4mg", "5mg"],
    commonFrequencies: ["QD"],
    category: "Cardiovascular Agents",
    subcategory: "Anticoagulants",
    indication: "Atrial fibrillation, DVT/PE"
  },
  {
    name: "Rivaroxaban",
    genericName: "rivaroxaban",
    commonDosages: ["10mg", "15mg", "20mg"],
    commonFrequencies: ["QD"],
    category: "Cardiovascular Agents",
    subcategory: "Anticoagulants",
    indication: "Atrial fibrillation, DVT/PE"
  },
  
  // Pain Management - NSAIDs
  {
    name: "Ibuprofen",
    genericName: "ibuprofen",
    commonDosages: ["200mg", "400mg", "600mg", "800mg"],
    commonFrequencies: ["PRN", "TID", "QID"],
    category: "Pain Management",
    subcategory: "NSAIDs",
    indication: "Pain, inflammation, fever"
  },
  {
    name: "Naproxen",
    genericName: "naproxen",
    commonDosages: ["220mg", "375mg", "500mg"],
    commonFrequencies: ["BID", "PRN"],
    category: "Pain Management",
    subcategory: "NSAIDs",
    indication: "Pain, inflammation"
  },
  
  // Pain Management - Non-opioid Analgesics
  {
    name: "Acetaminophen",
    genericName: "acetaminophen",
    commonDosages: ["325mg", "500mg", "650mg"],
    commonFrequencies: ["PRN", "QID", "Q6H"],
    category: "Pain Management",
    subcategory: "Non-opioid Analgesics",
    indication: "Pain, fever"
  },
  
  // Pain Management - Opioid Analgesics
  {
    name: "Tramadol",
    genericName: "tramadol",
    commonDosages: ["50mg", "100mg"],
    commonFrequencies: ["BID", "TID", "QID", "PRN"],
    category: "Pain Management",
    subcategory: "Opioid Analgesics",
    indication: "Moderate to severe pain"
  },
  {
    name: "Oxycodone",
    genericName: "oxycodone",
    commonDosages: ["5mg", "10mg", "15mg", "20mg"],
    commonFrequencies: ["Q4H", "Q6H", "BID", "PRN"],
    category: "Pain Management",
    subcategory: "Opioid Analgesics",
    indication: "Moderate to severe pain"
  },
  
  // Antimicrobial Agents - Penicillins
  {
    name: "Amoxicillin",
    genericName: "amoxicillin",
    commonDosages: ["250mg", "500mg", "875mg"],
    commonFrequencies: ["BID", "TID"],
    category: "Antimicrobial Agents",
    subcategory: "Penicillins",
    indication: "Bacterial infections"
  },
  {
    name: "Amoxicillin/Clavulanate",
    genericName: "amoxicillin/clavulanate",
    commonDosages: ["500mg/125mg", "875mg/125mg"],
    commonFrequencies: ["BID", "TID"],
    category: "Antimicrobial Agents",
    subcategory: "Penicillins",
    indication: "Bacterial infections"
  },
  
  // Antimicrobial Agents - Macrolides
  {
    name: "Azithromycin",
    genericName: "azithromycin",
    commonDosages: ["250mg", "500mg"],
    commonFrequencies: ["QD", "Z-pack"],
    category: "Antimicrobial Agents",
    subcategory: "Macrolides",
    indication: "Bacterial infections, atypical pneumonia"
  },
  {
    name: "Clarithromycin",
    genericName: "clarithromycin",
    commonDosages: ["250mg", "500mg"],
    commonFrequencies: ["BID"],
    category: "Antimicrobial Agents",
    subcategory: "Macrolides",
    indication: "Bacterial infections, H. pylori"
  },
  
  // Antimicrobial Agents - Fluoroquinolones
  {
    name: "Ciprofloxacin",
    genericName: "ciprofloxacin",
    commonDosages: ["250mg", "500mg", "750mg"],
    commonFrequencies: ["BID"],
    category: "Antimicrobial Agents",
    subcategory: "Fluoroquinolones",
    indication: "UTI, respiratory infections"
  },
  {
    name: "Levofloxacin",
    genericName: "levofloxacin",
    commonDosages: ["250mg", "500mg", "750mg"],
    commonFrequencies: ["QD"],
    category: "Antimicrobial Agents",
    subcategory: "Fluoroquinolones",
    indication: "Pneumonia, UTI, skin infections"
  },
  
  // Central Nervous System - SSRIs
  {
    name: "Sertraline",
    genericName: "sertraline",
    commonDosages: ["25mg", "50mg", "100mg"],
    commonFrequencies: ["QD"],
    category: "Central Nervous System",
    subcategory: "Antidepressants (SSRIs)",
    indication: "Depression, anxiety disorders"
  },
  {
    name: "Fluoxetine",
    genericName: "fluoxetine",
    commonDosages: ["10mg", "20mg", "40mg"],
    commonFrequencies: ["QD"],
    category: "Central Nervous System",
    subcategory: "Antidepressants (SSRIs)",
    indication: "Depression, anxiety disorders"
  },
  {
    name: "Escitalopram",
    genericName: "escitalopram",
    commonDosages: ["5mg", "10mg", "20mg"],
    commonFrequencies: ["QD"],
    category: "Central Nervous System",
    subcategory: "Antidepressants (SSRIs)",
    indication: "Depression, generalized anxiety disorder"
  },
  
  // Central Nervous System - Benzodiazepines
  {
    name: "Alprazolam",
    genericName: "alprazolam",
    commonDosages: ["0.25mg", "0.5mg", "1mg"],
    commonFrequencies: ["BID", "TID", "PRN"],
    category: "Central Nervous System",
    subcategory: "Benzodiazepines",
    indication: "Anxiety disorders, panic disorder"
  },
  {
    name: "Lorazepam",
    genericName: "lorazepam",
    commonDosages: ["0.5mg", "1mg", "2mg"],
    commonFrequencies: ["BID", "TID", "PRN"],
    category: "Central Nervous System",
    subcategory: "Benzodiazepines",
    indication: "Anxiety disorders"
  },
  
  // Respiratory Agents - Bronchodilators
  {
    name: "Albuterol",
    genericName: "albuterol",
    commonDosages: ["90mcg/puff", "2.5mg/3mL"],
    commonFrequencies: ["PRN", "Q4H", "BID"],
    category: "Respiratory Agents",
    subcategory: "Bronchodilators",
    indication: "Asthma, COPD"
  },
  {
    name: "Ipratropium",
    genericName: "ipratropium",
    commonDosages: ["17mcg/puff"],
    commonFrequencies: ["QID", "PRN"],
    category: "Respiratory Agents",
    subcategory: "Bronchodilators",
    indication: "COPD, asthma"
  },
  
  // Respiratory Agents - Leukotriene Modifiers
  {
    name: "Montelukast",
    genericName: "montelukast",
    commonDosages: ["4mg", "5mg", "10mg"],
    commonFrequencies: ["QD"],
    category: "Respiratory Agents",
    subcategory: "Leukotriene Modifiers",
    indication: "Asthma, allergic rhinitis"
  },
  
  // Gastrointestinal Agents - PPIs
  {
    name: "Omeprazole",
    genericName: "omeprazole",
    commonDosages: ["20mg", "40mg"],
    commonFrequencies: ["QD", "BID"],
    category: "Gastrointestinal Agents",
    subcategory: "Proton Pump Inhibitors (PPIs)",
    indication: "GERD, peptic ulcer disease"
  },
  {
    name: "Pantoprazole",
    genericName: "pantoprazole",
    commonDosages: ["20mg", "40mg"],
    commonFrequencies: ["QD", "BID"],
    category: "Gastrointestinal Agents",
    subcategory: "Proton Pump Inhibitors (PPIs)",
    indication: "GERD, Zollinger-Ellison syndrome"
  },
  
  // Gastrointestinal Agents - H2 Blockers
  {
    name: "Famotidine",
    genericName: "famotidine",
    commonDosages: ["20mg", "40mg"],
    commonFrequencies: ["BID", "QD"],
    category: "Gastrointestinal Agents",
    subcategory: "H2 Receptor Blockers",
    indication: "GERD, peptic ulcer disease"
  },
  {
    name: "Ranitidine",
    genericName: "ranitidine",
    commonDosages: ["75mg", "150mg", "300mg"],
    commonFrequencies: ["BID", "QD"],
    category: "Gastrointestinal Agents",
    subcategory: "H2 Receptor Blockers",
    indication: "GERD, peptic ulcer disease"
  },
  
  // Endocrine Agents - Thyroid Hormones
  {
    name: "Levothyroxine",
    genericName: "levothyroxine",
    commonDosages: ["25mcg", "50mcg", "75mcg", "100mcg", "125mcg"],
    commonFrequencies: ["QD"],
    category: "Endocrine Agents",
    subcategory: "Thyroid Hormones",
    indication: "Hypothyroidism"
  },
  {
    name: "Liothyronine",
    genericName: "liothyronine",
    commonDosages: ["5mcg", "25mcg", "50mcg"],
    commonFrequencies: ["BID", "TID"],
    category: "Endocrine Agents",
    subcategory: "Thyroid Hormones",
    indication: "Hypothyroidism"
  }
];

// Medication frequency abbreviations and their meanings
export const MEDICATION_FREQUENCIES = [
  { abbr: "QD", meaning: "Once daily" },
  { abbr: "BID", meaning: "Twice daily" },
  { abbr: "TID", meaning: "Three times daily" },
  { abbr: "QID", meaning: "Four times daily" },
  { abbr: "Q4H", meaning: "Every 4 hours" },
  { abbr: "Q6H", meaning: "Every 6 hours" },
  { abbr: "Q8H", meaning: "Every 8 hours" },
  { abbr: "PRN", meaning: "As needed" },
  { abbr: "with meals", meaning: "With meals" },
  { abbr: "Z-pack", meaning: "Azithromycin 5-day pack" }
];

// Search medications with enhanced filtering capabilities
export function searchMedications(query: string, limit: number = 8): MedicationInfo[] {
  if (!query || query.length < 2) return [];
  
  const normalizedQuery = query.toLowerCase().trim();
  
  return COMMON_MEDICATIONS
    .filter(med => 
      med.name.toLowerCase().includes(normalizedQuery) ||
      (med.genericName && med.genericName.toLowerCase().includes(normalizedQuery)) ||
      med.category.toLowerCase().includes(normalizedQuery) ||
      (med.subcategory && med.subcategory.toLowerCase().includes(normalizedQuery)) ||
      (med.indication && med.indication.toLowerCase().includes(normalizedQuery))
    )
    .sort((a, b) => {
      // Prioritize exact name matches
      const aNameMatch = a.name.toLowerCase().startsWith(normalizedQuery);
      const bNameMatch = b.name.toLowerCase().startsWith(normalizedQuery);
      
      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;
      
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);
}

// Search medications by category
export function searchMedicationsByCategory(category: string, limit: number = 20): MedicationInfo[] {
  return COMMON_MEDICATIONS
    .filter(med => med.category.toLowerCase() === category.toLowerCase())
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, limit);
}

// Search medications by subcategory
export function searchMedicationsBySubcategory(subcategory: string, limit: number = 20): MedicationInfo[] {
  return COMMON_MEDICATIONS
    .filter(med => med.subcategory && med.subcategory.toLowerCase() === subcategory.toLowerCase())
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, limit);
}

// Get all unique categories
export function getMedicationCategories(): string[] {
  const categories = new Set(COMMON_MEDICATIONS.map(med => med.category));
  return Array.from(categories).sort();
}

// Get all subcategories for a specific category
export function getSubcategoriesForCategory(category: string): string[] {
  const subcategories = new Set(
    COMMON_MEDICATIONS
      .filter(med => med.category.toLowerCase() === category.toLowerCase() && med.subcategory)
      .map(med => med.subcategory!)
  );
  return Array.from(subcategories).sort();
}

// Get all unique subcategories
export function getAllSubcategories(): string[] {
  const subcategories = new Set(
    COMMON_MEDICATIONS
      .filter(med => med.subcategory)
      .map(med => med.subcategory!)
  );
  return Array.from(subcategories).sort();
}

// Advanced search with multiple filters
export interface MedicationSearchFilters {
  query?: string;
  category?: string;
  subcategory?: string;
  indication?: string;
}

export function searchMedicationsAdvanced(
  filters: MedicationSearchFilters, 
  limit: number = 20
): MedicationInfo[] {
  let results = COMMON_MEDICATIONS;
  
  // Apply filters
  if (filters.query && filters.query.length >= 2) {
    const normalizedQuery = filters.query.toLowerCase().trim();
    results = results.filter(med => 
      med.name.toLowerCase().includes(normalizedQuery) ||
      (med.genericName && med.genericName.toLowerCase().includes(normalizedQuery))
    );
  }
  
  if (filters.category) {
    results = results.filter(med => 
      med.category.toLowerCase() === filters.category!.toLowerCase()
    );
  }
  
  if (filters.subcategory) {
    results = results.filter(med => 
      med.subcategory && med.subcategory.toLowerCase() === filters.subcategory!.toLowerCase()
    );
  }
  
  if (filters.indication) {
    results = results.filter(med => 
      med.indication && med.indication.toLowerCase().includes(filters.indication!.toLowerCase())
    );
  }
  
  // Sort results
  return results
    .sort((a, b) => {
      if (filters.query) {
        const normalizedQuery = filters.query.toLowerCase();
        const aNameMatch = a.name.toLowerCase().startsWith(normalizedQuery);
        const bNameMatch = b.name.toLowerCase().startsWith(normalizedQuery);
        
        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;
      }
      
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);
}

export function getMedicationByName(name: string): MedicationInfo | undefined {
  return COMMON_MEDICATIONS.find(med => 
    med.name.toLowerCase() === name.toLowerCase() ||
    (med.genericName && med.genericName.toLowerCase() === name.toLowerCase())
  );
}