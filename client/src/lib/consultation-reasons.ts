// Common consultation and admission reasons for autocomplete

export const consultationReasons = [
  // Emergency/Acute Care
  "Chest pain",
  "Shortness of breath", 
  "Acute abdominal pain",
  "Fever and chills",
  "Severe headache",
  "Dizziness and syncope",
  "Nausea and vomiting",
  "Acute back pain",
  "Joint pain and swelling",
  "Skin rash and allergic reaction",
  
  // Cardiovascular
  "Hypertension management",
  "Heart palpitations",
  "Peripheral edema",
  "Cardiac arrhythmia evaluation",
  "Coronary artery disease follow-up",
  
  // Respiratory
  "Chronic cough",
  "Asthma exacerbation",
  "COPD management",
  "Upper respiratory infection",
  "Pneumonia evaluation",
  
  // Gastrointestinal
  "Chronic abdominal pain",
  "Gastroesophageal reflux disease",
  "Inflammatory bowel disease",
  "Liver function abnormalities",
  "Constipation",
  
  // Endocrine/Metabolic
  "Diabetes management",
  "Thyroid disorder evaluation",
  "Weight management",
  "Metabolic syndrome",
  "Hyperlipidemia",
  
  // Neurological
  "Headache evaluation",
  "Seizure disorder",
  "Memory concerns",
  "Peripheral neuropathy",
  "Sleep disorders",
  
  // Musculoskeletal
  "Arthritis management",
  "Chronic pain syndrome",
  "Sports injury",
  "Osteoporosis evaluation",
  "Fibromyalgia",
  
  // Mental Health
  "Depression screening",
  "Anxiety disorder",
  "Substance abuse evaluation",
  "Behavioral concerns",
  "Stress management",
  
  // Preventive Care
  "Annual physical examination",
  "Preventive health screening",
  "Vaccination consultation",
  "Cancer screening",
  "Occupational health evaluation",
  
  // Women's Health
  "Gynecological examination",
  "Pregnancy consultation",
  "Menopause management",
  "Contraception counseling",
  "Breast health concerns",
  
  // Geriatric
  "Geriatric assessment",
  "Falls risk evaluation",
  "Medication review",
  "Cognitive assessment",
  "Functional decline"
];

export const admissionReasons = [
  // Cardiovascular
  "Acute myocardial infarction",
  "Congestive heart failure exacerbation",
  "Unstable angina",
  "Cardiac arrhythmia",
  "Hypertensive crisis",
  "Deep vein thrombosis",
  "Pulmonary embolism",
  "Acute stroke",
  "Transient ischemic attack",
  
  // Respiratory
  "Acute respiratory failure",
  "Pneumonia",
  "Asthma exacerbation",
  "COPD exacerbation",
  "Pleural effusion",
  "Pneumothorax",
  "Acute bronchitis",
  
  // Gastrointestinal
  "Acute pancreatitis",
  "Gastrointestinal bleeding",
  "Bowel obstruction",
  "Acute cholecystitis",
  "Appendicitis",
  "Diverticulitis",
  "Inflammatory bowel disease flare",
  "Liver failure",
  "Acute hepatitis",
  
  // Infectious Disease
  "Sepsis",
  "Urinary tract infection",
  "Cellulitis",
  "Meningitis",
  "Endocarditis",
  "Osteomyelitis",
  "COVID-19 complications",
  
  // Neurological
  "Acute stroke",
  "Seizure disorder",
  "Altered mental status",
  "Intracranial hemorrhage",
  "Brain tumor",
  "Spinal cord injury",
  "Guillain-Barré syndrome",
  
  // Endocrine/Metabolic
  "Diabetic ketoacidosis",
  "Hyperosmolar hyperglycemic state",
  "Severe hypoglycemia",
  "Thyroid storm",
  "Adrenal crisis",
  "Electrolyte imbalance",
  
  // Renal/Genitourinary
  "Acute kidney injury",
  "Chronic kidney disease exacerbation",
  "Nephrotic syndrome",
  "Acute urinary retention",
  "Kidney stones",
  "Pyelonephritis",
  
  // Hematological/Oncological
  "Neutropenic fever",
  "Chemotherapy complications",
  "Tumor lysis syndrome",
  "Severe anemia",
  "Thrombocytopenia",
  "Sickle cell crisis",
  
  // Surgical
  "Post-operative complications",
  "Surgical site infection",
  "Wound dehiscence",
  "Anastomotic leak",
  "Bleeding complications",
  
  // Trauma
  "Multi-trauma",
  "Head injury",
  "Fractures requiring surgery",
  "Internal bleeding",
  "Burn injury",
  
  // Psychiatric
  "Suicidal ideation",
  "Psychotic episode",
  "Severe depression",
  "Substance withdrawal",
  "Eating disorder complications",
  
  // Obstetric/Gynecologic
  "Preeclampsia",
  "Obstetric hemorrhage",
  "Preterm labor",
  "Ectopic pregnancy",
  "Ovarian torsion",
  
  // Pediatric Specific
  "Failure to thrive",
  "Dehydration",
  "Febrile seizures",
  "Bronchiolitis",
  "Intussusception"
];

// Combined search function for both consultation and admission reasons
export const searchReasons = (query: string, type: 'consultation' | 'admission' = 'consultation') => {
  const reasons = type === 'consultation' ? consultationReasons : admissionReasons;
  
  if (!query.trim()) return reasons.slice(0, 10);
  
  const searchTerm = query.toLowerCase().trim();
  
  return reasons
    .filter(reason => reason.toLowerCase().includes(searchTerm))
    .sort((a, b) => {
      // Prioritize exact matches at the beginning
      const aStartsWith = a.toLowerCase().startsWith(searchTerm);
      const bStartsWith = b.toLowerCase().startsWith(searchTerm);
      
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
      return a.localeCompare(b);
    })
    .slice(0, 10);
};