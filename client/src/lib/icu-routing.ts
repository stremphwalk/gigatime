// ICU routing utilities: map labs, imaging, and medications to ICU system sections

export type IcuSystem = 'neuro' | 'cardio' | 'resp' | 'gi' | 'nephroMetabolic' | 'hemaInfectious';

export const ICU_SYSTEM_SECTION_IDS: Record<IcuSystem, string> = {
  neuro: 'neuro',
  cardio: 'cardio',
  resp: 'resp',
  gi: 'gi',
  nephroMetabolic: 'nephroMetabolic',
  hemaInfectious: 'hemaInfectious',
};

export function isIcuTemplateType(t?: string | null): boolean {
  if (!t) return false;
  const s = String(t).toLowerCase();
  return s === 'icu-admission' || s === 'icu-progress';
}

// -------- Labs --------

// Map standardized lab names (as produced by lab parsing) to ICU systems.
export function mapLabNameToIcuSystem(stdName: string): IcuSystem | null {
  const n = stdName.toLowerCase();

  // Hematology/Infectious
  if (/(wbc|white blood|rbc|hemoglobin|hematocrit|platelet|plt|inr|pt\b|a?ptt|d-dimer|ferritin|crp|c-reactive|esr|erythrocyte|procalcitonin)/.test(n)) {
    return 'hemaInfectious';
  }

  // Cardiovascular (include lactate per requirements)
  if (/(troponin|ck-?mb|bnp|nt-?probnp|ck total|creatine kinase|ecg|ekg|qtc|lactate)/.test(n)) {
    return 'cardio';
  }

  // Respiratory (ABG/VBG)
  if (/(abg|vbg|ph\b|pco2|po2|hco3|base excess|be|o2 sat|sao2|pao2\/fio2|p\/f ratio|etco2)/.test(n)) {
    return 'resp';
  }

  // Nephro-metabolic (BMP/CMP core electrolytes and renal)
  if (/(sodium|na\b|potassium|k\b|chloride|cl\b|co2\b|bicarbonate|hco3|bun|creatinine|mg\b|magnesium|phos|phosphate|calcium|glucose|anion gap|egfr)/.test(n)) {
    return 'nephroMetabolic';
  }

  // Gastrointestinal / Hepatic (LFTs, pancreatics, ammonia)
  if (/(ast|alt|alk phos|alp|ggt|bilirubin|lipase|amylase|albumin|ammonia)/.test(n)) {
    return 'gi';
  }

  return null;
}

// -------- Imaging --------

export function mapImagingSummaryToIcuSystem(summary: string): IcuSystem | null {
  const s = summary.toLowerCase();
  if (/chest x-?ray|cxr|chest ct|cta chest|lung|pulmonary/.test(s)) return 'resp';
  if (/ct head|head ct|brain mri|ct brain|intracranial|neuro/.test(s)) return 'neuro';
  if (/ecg|ekg|electrocardiogram|echo|echocardiogram|cardiac/.test(s)) return 'cardio';
  if (/abdomen|abdominal|ruq|liver|gallbladder|pancreas|gi\b/.test(s)) return 'gi';
  if (/renal|kidney|ct kub|retroperitoneal/.test(s)) return 'nephroMetabolic';
  return null;
}

// -------- Medications --------

export function mapMedicationToIcuSystem(medText: string): IcuSystem | null {
  const t = medText.toLowerCase();
  // Cardio: vasopressors, antiarrhythmics, anticoagulants/antiplatelets, antihypertensives
  if (/(norepinephrine|levophed|epinephrine|vasopressin|dopamine|dobutamine|amiodarone|metoprolol|diltiazem|heparin|enoxaparin|warfarin|aspirin|clopidogrel|statin|beta blocker|ace inhibitor|arb|calcium channel blocker)/.test(t)) {
    return 'cardio';
  }
  // Neuro: sedatives/analgesics/antiepileptics
  if (/(propofol|dexmedetomidine|precedex|fentanyl|midazolam|lorazepam|benzodiazepine|levetiracetam|keppra|phenytoin|lacosamide)/.test(t)) {
    return 'neuro';
  }
  // Respiratory
  if (/(albuterol|ipratropium|duoneb|budesonide|arformoterol|formoterol|tiotropium)/.test(t)) {
    return 'resp';
  }
  // Nephro-metabolic: diuretics, fluids, electrolytes, insulin/diabetes
  if (/(furosemide|lasix|bumetanide|bumex|torsemide|iv fluids|ns 0\.9%|lr\b|ringer|d5|electrolyte|potassium chloride|magnesium sulfate|insulin|glargine|lispro|aspart|metformin|glipizide|sitagliptin|liraglutide|semaglutide|sglt-?2)/.test(t)) {
    return 'nephroMetabolic';
  }
  // GI: PPI/H2, bowel regimen, antiemetics
  if (/(pantoprazole|omeprazole|esomeprazole|ppi|famotidine|ranitidine|h2 blocker|senna|docusate|polyethylene glycol|bisacodyl|ondansetron|metoclopramide|prochlorperazine)/.test(t)) {
    return 'gi';
  }
  // Hema/Infectious: antibiotics, antifungals, antivirals
  if (/(piperacillin|tazobactam|zosyn|ceftriaxone|vancomycin|meropenem|levofloxacin|azithromycin|linezolid|fluconazole|acyclovir|antibiotic|antimicrobial)/.test(t)) {
    return 'hemaInfectious';
  }
  return null;
}

// Utility to find a system section id in current template sections
export function findIcuSectionId(sections: Array<{ id: string; name: string }>, system: IcuSystem): string | null {
  const desiredId = ICU_SYSTEM_SECTION_IDS[system];
  const direct = sections.find(s => s.id === desiredId);
  if (direct) return direct.id;
  // fallback by name contains
  const nameMatch = {
    neuro: 'neuro',
    cardio: 'cardio',
    resp: 'resp',
    gi: 'gastro',
    nephroMetabolic: 'nephro',
    hemaInfectious: 'hematology',
  } as Record<IcuSystem, string>;
  const needle = nameMatch[system];
  const tryName = sections.find(s => s.name.toLowerCase().includes(needle));
  return tryName ? tryName.id : null;
}

