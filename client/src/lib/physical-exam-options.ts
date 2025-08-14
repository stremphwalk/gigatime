// Physical exam autocomplete options organized by body systems
export interface PhysicalExamOption {
  category: string;
  findings: string[];
}

export const PHYSICAL_EXAM_OPTIONS: PhysicalExamOption[] = [
  {
    category: "General Appearance",
    findings: [
      "Well-appearing, alert and oriented x3",
      "Appears comfortable, no acute distress",
      "Appears ill, in moderate distress",
      "Well-developed, well-nourished",
      "Appears older/younger than stated age",
      "Cooperative with examination",
      "Anxious appearing",
      "Lethargic but arousable"
    ]
  },
  {
    category: "Vital Signs",
    findings: [
      "Afebrile, vitals stable",
      "Hypertensive with BP 140/90",
      "Hypotensive with BP 90/60",
      "Tachycardic with HR 110",
      "Bradycardic with HR 55",
      "Tachypneic with RR 24",
      "Febrile with temp 101.5°F",
      "Oxygen saturation 98% on room air"
    ]
  },
  {
    category: "HEENT",
    findings: [
      "Normocephalic, atraumatic",
      "Pupils equal, round, reactive to light",
      "Extraocular movements intact",
      "Conjunctiva pink, sclera anicteric",
      "Tympanic membranes clear bilaterally",
      "Nares patent, no discharge",
      "Oropharynx clear, no erythema",
      "Moist mucous membranes",
      "No lymphadenopathy",
      "Thyroid non-enlarged"
    ]
  },
  {
    category: "Cardiovascular",
    findings: [
      "Regular rate and rhythm",
      "No murmurs, rubs, or gallops",
      "S1 and S2 heart sounds normal",
      "Grade 2/6 systolic murmur",
      "PMI at 5th intercostal space, midclavicular line",
      "No jugular venous distension",
      "Peripheral pulses 2+ bilaterally",
      "No peripheral edema",
      "Capillary refill <2 seconds",
      "No carotid bruits"
    ]
  },
  {
    category: "Pulmonary",
    findings: [
      "Clear to auscultation bilaterally",
      "Good air movement throughout",
      "No wheezes, rales, or rhonchi",
      "Respirations unlabored",
      "No use of accessory muscles",
      "Decreased breath sounds at bases",
      "Fine crackles at bases",
      "Expiratory wheeze bilaterally",
      "Dullness to percussion",
      "Tactile fremitus normal"
    ]
  },
  {
    category: "Abdominal",
    findings: [
      "Soft, non-tender, non-distended",
      "Bowel sounds normal in all quadrants",
      "No hepatosplenomegaly",
      "No masses palpated",
      "No rebound or guarding",
      "Tender in RUQ with Murphy's sign",
      "Tender in RLQ with McBurney's point",
      "Distended with tympany",
      "No costovertebral angle tenderness",
      "Negative psoas and obturator signs"
    ]
  },
  {
    category: "Musculoskeletal",
    findings: [
      "Full range of motion all joints",
      "Normal strength 5/5 throughout",
      "No joint swelling or deformity",
      "Normal gait and station",
      "No tenderness to palpation",
      "Decreased range of motion in shoulder",
      "Tenderness over lateral epicondyle",
      "Swelling and warmth in knee joint",
      "Antalgic gait favoring right leg",
      "Muscle atrophy in left quadriceps"
    ]
  },
  {
    category: "Neurological",
    findings: [
      "Alert and oriented x3",
      "Cranial nerves II-XII intact",
      "Motor strength 5/5 throughout",
      "Sensation intact to light touch",
      "Deep tendon reflexes 2+ symmetric",
      "Negative Babinski sign",
      "Cerebellar function intact",
      "No focal neurologic deficits",
      "Memory and cognition intact",
      "Speech clear and fluent"
    ]
  },
  {
    category: "Skin",
    findings: [
      "Warm, dry, intact",
      "No rashes or lesions",
      "Good skin turgor",
      "No cyanosis or pallor",
      "Erythematous rash on chest",
      "Multiple nevi, no suspicious lesions",
      "Dry skin with scaling",
      "Petechial rash on lower extremities",
      "Well-healed surgical scars",
      "No clubbing of fingernails"
    ]
  },
  {
    category: "Psychiatric",
    findings: [
      "Appropriate mood and affect",
      "No suicidal or homicidal ideation",
      "Thought process linear and goal-directed",
      "No hallucinations or delusions",
      "Insight and judgment intact",
      "Cooperative with interview",
      "Anxious mood, worried affect",
      "Depressed mood, flat affect",
      "Flight of ideas",
      "Tangential thought process"
    ]
  }
];

// Common physical exam phrases for quick insertion
export const QUICK_PHYSICAL_EXAM_PHRASES = [
  "Constitutional: Well-appearing, no acute distress",
  "HEENT: Normocephalic, atraumatic, PERRL, EOM intact",
  "CV: RRR, no murmurs, peripheral pulses 2+",
  "Pulm: CTA bilaterally, no respiratory distress",
  "Abd: Soft, NT/ND, normal bowel sounds",
  "MSK: Full ROM, strength 5/5 throughout",
  "Neuro: A&O x3, CN II-XII intact, no focal deficits",
  "Skin: Warm, dry, intact, no rashes",
  "Psych: Appropriate mood and affect"
];

export function searchPhysicalExamOptions(query: string): PhysicalExamOption[] {
  if (!query || query.length < 2) return PHYSICAL_EXAM_OPTIONS;
  
  const searchTerm = query.toLowerCase();
  
  return PHYSICAL_EXAM_OPTIONS.map(category => ({
    ...category,
    findings: category.findings.filter(finding => 
      finding.toLowerCase().includes(searchTerm) ||
      category.category.toLowerCase().includes(searchTerm)
    )
  })).filter(category => category.findings.length > 0);
}

export function getPhysicalExamSuggestions(query: string): string[] {
  if (!query || query.length < 2) return [];
  
  const searchTerm = query.toLowerCase();
  const suggestions: string[] = [];
  
  // Search through all findings
  PHYSICAL_EXAM_OPTIONS.forEach(category => {
    category.findings.forEach(finding => {
      if (finding.toLowerCase().includes(searchTerm)) {
        suggestions.push(finding);
      }
    });
  });
  
  // Also include quick phrases
  QUICK_PHYSICAL_EXAM_PHRASES.forEach(phrase => {
    if (phrase.toLowerCase().includes(searchTerm)) {
      suggestions.push(phrase);
    }
  });
  
  return suggestions.slice(0, 8); // Limit to 8 suggestions
}