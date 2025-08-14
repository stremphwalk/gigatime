// Pertinent negatives organized by medical systems
export interface PertinentNegativeSystem {
  id: string;
  name: string;
  symptoms: PertinentNegativeSymptom[];
}

export interface PertinentNegativeSymptom {
  id: string;
  text: string;
  negativeForm: string; // How it appears in the final text (e.g., "no headaches")
}

export interface PertinentNegativePreset {
  id: string;
  name: string;
  selectedSymptoms: Record<string, string[]>; // systemId -> symptomIds[]
  createdAt: Date;
}

export const PERTINENT_NEGATIVE_SYSTEMS: PertinentNegativeSystem[] = [
  {
    id: "neuro",
    name: "Neurological",
    symptoms: [
      { id: "headaches", text: "Headaches", negativeForm: "no headaches" },
      { id: "weakness", text: "Weakness", negativeForm: "no weakness" },
      { id: "numbness", text: "Numbness/Tingling", negativeForm: "no numbness or tingling" },
      { id: "paresthesias", text: "Paresthesias", negativeForm: "no paresthesias" },
      { id: "seizures", text: "Seizures", negativeForm: "no seizures" },
      { id: "syncope", text: "Syncope", negativeForm: "no syncope" },
      { id: "dizziness", text: "Dizziness", negativeForm: "no dizziness" },
      { id: "confusion", text: "Confusion", negativeForm: "no confusion" },
      { id: "memory_loss", text: "Memory Loss", negativeForm: "no memory loss" },
      { id: "vision_changes", text: "Vision Changes", negativeForm: "no vision changes" }
    ]
  },
  {
    id: "cardiac",
    name: "Cardiovascular",
    symptoms: [
      { id: "chest_pain", text: "Chest Pain", negativeForm: "no chest pain" },
      { id: "palpitations", text: "Palpitations", negativeForm: "no palpitations" },
      { id: "orthopnea", text: "Orthopnea", negativeForm: "no orthopnea" },
      { id: "pnd", text: "Paroxysmal Nocturnal Dyspnea", negativeForm: "no PND" },
      { id: "edema", text: "Lower Extremity Edema", negativeForm: "no lower extremity edema" },
      { id: "claudication", text: "Claudication", negativeForm: "no claudication" },
      { id: "syncope_cardiac", text: "Syncope", negativeForm: "no syncope" },
      { id: "irregular_heartbeat", text: "Irregular Heartbeat", negativeForm: "no irregular heartbeat" }
    ]
  },
  {
    id: "respiratory",
    name: "Respiratory",
    symptoms: [
      { id: "sob", text: "Shortness of Breath", negativeForm: "no shortness of breath" },
      { id: "cough", text: "Cough", negativeForm: "no cough" },
      { id: "sputum", text: "Sputum Production", negativeForm: "no sputum production" },
      { id: "hemoptysis", text: "Hemoptysis", negativeForm: "no hemoptysis" },
      { id: "wheeze", text: "Wheezing", negativeForm: "no wheezing" },
      { id: "chest_tightness", text: "Chest Tightness", negativeForm: "no chest tightness" },
      { id: "stridor", text: "Stridor", negativeForm: "no stridor" },
      { id: "sleep_apnea", text: "Sleep Apnea Symptoms", negativeForm: "no sleep apnea symptoms" }
    ]
  },
  {
    id: "gi",
    name: "Gastrointestinal",
    symptoms: [
      { id: "nausea", text: "Nausea", negativeForm: "no nausea" },
      { id: "vomiting", text: "Vomiting", negativeForm: "no vomiting" },
      { id: "diarrhea", text: "Diarrhea", negativeForm: "no diarrhea" },
      { id: "constipation", text: "Constipation", negativeForm: "no constipation" },
      { id: "abdominal_pain", text: "Abdominal Pain", negativeForm: "no abdominal pain" },
      { id: "heartburn", text: "Heartburn/GERD", negativeForm: "no heartburn" },
      { id: "dysphagia", text: "Dysphagia", negativeForm: "no dysphagia" },
      { id: "hematemesis", text: "Hematemesis", negativeForm: "no hematemesis" },
      { id: "melena", text: "Melena", negativeForm: "no melena" },
      { id: "hematochezia", text: "Hematochezia", negativeForm: "no hematochezia" },
      { id: "jaundice", text: "Jaundice", negativeForm: "no jaundice" }
    ]
  },
  {
    id: "gu",
    name: "Genitourinary",
    symptoms: [
      { id: "dysuria", text: "Dysuria", negativeForm: "no dysuria" },
      { id: "frequency", text: "Urinary Frequency", negativeForm: "no urinary frequency" },
      { id: "urgency", text: "Urinary Urgency", negativeForm: "no urinary urgency" },
      { id: "hematuria", text: "Hematuria", negativeForm: "no hematuria" },
      { id: "incontinence", text: "Incontinence", negativeForm: "no incontinence" },
      { id: "retention", text: "Urinary Retention", negativeForm: "no urinary retention" },
      { id: "flank_pain", text: "Flank Pain", negativeForm: "no flank pain" },
      { id: "discharge", text: "Urethral Discharge", negativeForm: "no urethral discharge" }
    ]
  },
  {
    id: "musculoskeletal",
    name: "Musculoskeletal",
    symptoms: [
      { id: "joint_pain", text: "Joint Pain", negativeForm: "no joint pain" },
      { id: "muscle_pain", text: "Muscle Pain", negativeForm: "no muscle pain" },
      { id: "stiffness", text: "Morning Stiffness", negativeForm: "no morning stiffness" },
      { id: "swelling", text: "Joint Swelling", negativeForm: "no joint swelling" },
      { id: "limited_rom", text: "Limited Range of Motion", negativeForm: "no limited range of motion" },
      { id: "back_pain", text: "Back Pain", negativeForm: "no back pain" },
      { id: "neck_pain", text: "Neck Pain", negativeForm: "no neck pain" }
    ]
  },
  {
    id: "constitutional",
    name: "Constitutional",
    symptoms: [
      { id: "fever", text: "Fever", negativeForm: "no fever" },
      { id: "chills", text: "Chills", negativeForm: "no chills" },
      { id: "night_sweats", text: "Night Sweats", negativeForm: "no night sweats" },
      { id: "weight_loss", text: "Weight Loss", negativeForm: "no weight loss" },
      { id: "weight_gain", text: "Weight Gain", negativeForm: "no weight gain" },
      { id: "fatigue", text: "Fatigue", negativeForm: "no fatigue" },
      { id: "malaise", text: "Malaise", negativeForm: "no malaise" },
      { id: "appetite_loss", text: "Loss of Appetite", negativeForm: "no loss of appetite" }
    ]
  },
  {
    id: "skin",
    name: "Dermatologic",
    symptoms: [
      { id: "rash", text: "Rash", negativeForm: "no rash" },
      { id: "itching", text: "Itching", negativeForm: "no itching" },
      { id: "lesions", text: "Skin Lesions", negativeForm: "no skin lesions" },
      { id: "bruising", text: "Easy Bruising", negativeForm: "no easy bruising" },
      { id: "color_changes", text: "Color Changes", negativeForm: "no skin color changes" },
      { id: "hair_loss", text: "Hair Loss", negativeForm: "no hair loss" }
    ]
  }
];

export const formatPertinentNegatives = (selectedSymptoms: Record<string, string[]>): string => {
  const systemTexts: string[] = [];
  
  PERTINENT_NEGATIVE_SYSTEMS.forEach(system => {
    const selectedSymptomIds = selectedSymptoms[system.id] || [];
    if (selectedSymptomIds.length === 0) return;
    
    const negativeTexts = selectedSymptomIds
      .map(symptomId => {
        const symptom = system.symptoms.find(s => s.id === symptomId);
        return symptom?.negativeForm || '';
      })
      .filter(text => text.length > 0);
    
    if (negativeTexts.length > 0) {
      // Capitalize first letter of the system's text
      const systemText = negativeTexts.join(', ');
      systemTexts.push(systemText.charAt(0).toUpperCase() + systemText.slice(1));
    }
  });
  
  return systemTexts.join('. ') + (systemTexts.length > 0 ? '.' : '');
};