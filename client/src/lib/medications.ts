// Common medications database with dosages and frequencies
export interface MedicationInfo {
  name: string;
  genericName?: string;
  commonDosages: string[];
  commonFrequencies: string[];
  category: string;
}

export const COMMON_MEDICATIONS: MedicationInfo[] = [
  // Diabetes medications
  {
    name: "Metformin",
    genericName: "metformin",
    commonDosages: ["250mg", "500mg", "1000mg"],
    commonFrequencies: ["BID", "TID", "QD"],
    category: "Antidiabetic"
  },
  {
    name: "Insulin",
    genericName: "insulin",
    commonDosages: ["10 units", "20 units", "30 units", "40 units"],
    commonFrequencies: ["QD", "BID", "TID", "with meals"],
    category: "Antidiabetic"
  },
  {
    name: "Glipizide",
    genericName: "glipizide",
    commonDosages: ["2.5mg", "5mg", "10mg"],
    commonFrequencies: ["QD", "BID"],
    category: "Antidiabetic"
  },
  
  // Blood pressure medications
  {
    name: "Lisinopril",
    genericName: "lisinopril",
    commonDosages: ["2.5mg", "5mg", "10mg", "20mg"],
    commonFrequencies: ["QD", "BID"],
    category: "ACE Inhibitor"
  },
  {
    name: "Amlodipine",
    genericName: "amlodipine",
    commonDosages: ["2.5mg", "5mg", "10mg"],
    commonFrequencies: ["QD"],
    category: "Calcium Channel Blocker"
  },
  {
    name: "Losartan",
    genericName: "losartan",
    commonDosages: ["25mg", "50mg", "100mg"],
    commonFrequencies: ["QD", "BID"],
    category: "ARB"
  },
  {
    name: "Hydrochlorothiazide",
    genericName: "hydrochlorothiazide",
    commonDosages: ["12.5mg", "25mg", "50mg"],
    commonFrequencies: ["QD"],
    category: "Diuretic"
  },
  {
    name: "Metoprolol",
    genericName: "metoprolol",
    commonDosages: ["25mg", "50mg", "100mg"],
    commonFrequencies: ["BID", "QD"],
    category: "Beta Blocker"
  },
  
  // Cholesterol medications
  {
    name: "Atorvastatin",
    genericName: "atorvastatin",
    commonDosages: ["10mg", "20mg", "40mg", "80mg"],
    commonFrequencies: ["QD"],
    category: "Statin"
  },
  {
    name: "Simvastatin",
    genericName: "simvastatin",
    commonDosages: ["10mg", "20mg", "40mg"],
    commonFrequencies: ["QD"],
    category: "Statin"
  },
  
  // Pain medications
  {
    name: "Ibuprofen",
    genericName: "ibuprofen",
    commonDosages: ["200mg", "400mg", "600mg", "800mg"],
    commonFrequencies: ["PRN", "TID", "QID"],
    category: "NSAID"
  },
  {
    name: "Acetaminophen",
    genericName: "acetaminophen",
    commonDosages: ["325mg", "500mg", "650mg"],
    commonFrequencies: ["PRN", "QID", "Q6H"],
    category: "Analgesic"
  },
  {
    name: "Tramadol",
    genericName: "tramadol",
    commonDosages: ["50mg", "100mg"],
    commonFrequencies: ["BID", "TID", "QID", "PRN"],
    category: "Opioid Analgesic"
  },
  
  // Antibiotics
  {
    name: "Amoxicillin",
    genericName: "amoxicillin",
    commonDosages: ["250mg", "500mg", "875mg"],
    commonFrequencies: ["BID", "TID"],
    category: "Antibiotic"
  },
  {
    name: "Azithromycin",
    genericName: "azithromycin",
    commonDosages: ["250mg", "500mg"],
    commonFrequencies: ["QD", "Z-pack"],
    category: "Antibiotic"
  },
  {
    name: "Ciprofloxacin",
    genericName: "ciprofloxacin",
    commonDosages: ["250mg", "500mg", "750mg"],
    commonFrequencies: ["BID"],
    category: "Antibiotic"
  },
  
  // Mental health
  {
    name: "Sertraline",
    genericName: "sertraline",
    commonDosages: ["25mg", "50mg", "100mg"],
    commonFrequencies: ["QD"],
    category: "SSRI"
  },
  {
    name: "Fluoxetine",
    genericName: "fluoxetine",
    commonDosages: ["10mg", "20mg", "40mg"],
    commonFrequencies: ["QD"],
    category: "SSRI"
  },
  {
    name: "Alprazolam",
    genericName: "alprazolam",
    commonDosages: ["0.25mg", "0.5mg", "1mg"],
    commonFrequencies: ["BID", "TID", "PRN"],
    category: "Benzodiazepine"
  },
  
  // Respiratory
  {
    name: "Albuterol",
    genericName: "albuterol",
    commonDosages: ["90mcg/puff", "2.5mg/3mL"],
    commonFrequencies: ["PRN", "Q4H", "BID"],
    category: "Bronchodilator"
  },
  {
    name: "Montelukast",
    genericName: "montelukast",
    commonDosages: ["4mg", "5mg", "10mg"],
    commonFrequencies: ["QD"],
    category: "Leukotriene Receptor Antagonist"
  },
  
  // Acid reflux
  {
    name: "Omeprazole",
    genericName: "omeprazole",
    commonDosages: ["20mg", "40mg"],
    commonFrequencies: ["QD", "BID"],
    category: "PPI"
  },
  {
    name: "Famotidine",
    genericName: "famotidine",
    commonDosages: ["20mg", "40mg"],
    commonFrequencies: ["BID", "QD"],
    category: "H2 Blocker"
  },
  
  // Thyroid
  {
    name: "Levothyroxine",
    genericName: "levothyroxine",
    commonDosages: ["25mcg", "50mcg", "75mcg", "100mcg", "125mcg"],
    commonFrequencies: ["QD"],
    category: "Thyroid Hormone"
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

export function searchMedications(query: string, limit: number = 8): MedicationInfo[] {
  if (!query || query.length < 2) return [];
  
  const normalizedQuery = query.toLowerCase().trim();
  
  return COMMON_MEDICATIONS
    .filter(med => 
      med.name.toLowerCase().includes(normalizedQuery) ||
      (med.genericName && med.genericName.toLowerCase().includes(normalizedQuery))
    )
    .slice(0, limit);
}

export function getMedicationByName(name: string): MedicationInfo | undefined {
  return COMMON_MEDICATIONS.find(med => 
    med.name.toLowerCase() === name.toLowerCase() ||
    (med.genericName && med.genericName.toLowerCase() === name.toLowerCase())
  );
}