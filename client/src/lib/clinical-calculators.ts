// Clinical calculators organized by body system
export interface CalculatorField {
  id: string;
  label: string;
  type: 'number' | 'select' | 'radio' | 'checkbox';
  options?: { value: string; label: string }[];
  unit?: string;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
}

export interface Calculator {
  id: string;
  name: string;
  description: string;
  system: string;
  fields: CalculatorField[];
  calculate: (values: Record<string, any>) => { result: number | string; unit?: string; interpretation?: string; details?: string };
}

export const CLINICAL_CALCULATORS: Calculator[] = [
  // Cardiovascular System
  {
    id: 'framingham-risk',
    name: 'Framingham Risk Score',
    description: '10-year cardiovascular risk assessment',
    system: 'Cardiovascular',
    fields: [
      { id: 'age', label: 'Age', type: 'number', unit: 'years', required: true, min: 30, max: 79 },
      { id: 'gender', label: 'Gender', type: 'radio', options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }], required: true },
      { id: 'totalCholesterol', label: 'Total Cholesterol', type: 'number', unit: 'mg/dL', required: true, min: 100, max: 400 },
      { id: 'hdlCholesterol', label: 'HDL Cholesterol', type: 'number', unit: 'mg/dL', required: true, min: 20, max: 100 },
      { id: 'systolicBP', label: 'Systolic Blood Pressure', type: 'number', unit: 'mmHg', required: true, min: 90, max: 200 },
      { id: 'smoking', label: 'Current Smoker', type: 'radio', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], required: true },
      { id: 'diabetes', label: 'Diabetes', type: 'radio', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], required: true }
    ],
    calculate: (values) => {
      // Simplified Framingham calculation
      let score = 0;
      const age = parseInt(values.age);
      const isMale = values.gender === 'male';
      
      // Age points
      if (isMale) {
        if (age < 35) score += -9;
        else if (age < 40) score += -4;
        else if (age < 45) score += 0;
        else if (age < 50) score += 3;
        else if (age < 55) score += 6;
        else if (age < 60) score += 8;
        else if (age < 65) score += 10;
        else if (age < 70) score += 11;
        else if (age < 75) score += 12;
        else score += 13;
      } else {
        if (age < 35) score += -7;
        else if (age < 40) score += -3;
        else if (age < 45) score += 0;
        else if (age < 50) score += 3;
        else if (age < 55) score += 6;
        else if (age < 60) score += 8;
        else if (age < 65) score += 10;
        else if (age < 70) score += 12;
        else if (age < 75) score += 14;
        else score += 16;
      }
      
      // Additional risk factors
      if (values.smoking === 'yes') score += isMale ? 5 : 7;
      if (values.diabetes === 'yes') score += isMale ? 5 : 6;
      
      // Convert to percentage risk
      const risk = Math.min(Math.max(Math.exp(score - 15) * 100, 1), 30);
      
      let interpretation = '';
      if (risk < 10) interpretation = 'Low risk';
      else if (risk < 20) interpretation = 'Intermediate risk';
      else interpretation = 'High risk';
      
      return {
        result: Math.round(risk * 10) / 10,
        unit: '%',
        interpretation,
        details: `10-year cardiovascular risk: ${interpretation}`
      };
    }
  },
  {
    id: 'wells-dvt',
    name: 'Wells Score for DVT',
    description: 'Deep vein thrombosis probability assessment',
    system: 'Cardiovascular',
    fields: [
      { id: 'calf_swelling', label: 'Calf swelling >3cm compared to other leg', type: 'checkbox' },
      { id: 'collateral_veins', label: 'Collateral superficial veins (non-varicose)', type: 'checkbox' },
      { id: 'pitting_edema', label: 'Pitting edema (confined to symptomatic leg)', type: 'checkbox' },
      { id: 'swelling_thigh', label: 'Swelling of entire leg', type: 'checkbox' },
      { id: 'localized_tenderness', label: 'Localized tenderness along deep venous system', type: 'checkbox' },
      { id: 'active_cancer', label: 'Active cancer (treatment within 6 months)', type: 'checkbox' },
      { id: 'paralysis', label: 'Paralysis or recent plaster immobilization', type: 'checkbox' },
      { id: 'bedridden', label: 'Bedridden >3 days or major surgery within 4 weeks', type: 'checkbox' },
      { id: 'previous_dvt', label: 'Previous documented DVT', type: 'checkbox' },
      { id: 'alternative_diagnosis', label: 'Alternative diagnosis as likely as DVT', type: 'checkbox' }
    ],
    calculate: (values) => {
      let score = 0;
      if (values.calf_swelling) score += 1;
      if (values.collateral_veins) score += 1;
      if (values.pitting_edema) score += 1;
      if (values.swelling_thigh) score += 1;
      if (values.localized_tenderness) score += 1;
      if (values.active_cancer) score += 1;
      if (values.paralysis) score += 1;
      if (values.bedridden) score += 1;
      if (values.previous_dvt) score += 1;
      if (values.alternative_diagnosis) score -= 2;
      
      let interpretation = '';
      let probability = '';
      
      if (score <= 0) {
        interpretation = 'Low probability';
        probability = '≤5%';
      } else if (score <= 2) {
        interpretation = 'Moderate probability';
        probability = '17-33%';
      } else {
        interpretation = 'High probability';
        probability = '≥75%';
      }
      
      return {
        result: score,
        interpretation,
        details: `Wells Score: ${score} points - ${interpretation} (${probability} chance of DVT)`
      };
    }
  },

  // Respiratory System
  {
    id: 'curb-65',
    name: 'CURB-65 Score',
    description: 'Community-acquired pneumonia severity assessment',
    system: 'Respiratory',
    fields: [
      { id: 'confusion', label: 'Confusion', type: 'checkbox' },
      { id: 'urea', label: 'Urea >19 mg/dL (>7 mmol/L)', type: 'checkbox' },
      { id: 'respiratory_rate', label: 'Respiratory rate ≥30/min', type: 'checkbox' },
      { id: 'blood_pressure', label: 'Blood pressure <90 mmHg systolic or ≤60 mmHg diastolic', type: 'checkbox' },
      { id: 'age', label: 'Age ≥65 years', type: 'checkbox' }
    ],
    calculate: (values) => {
      let score = 0;
      if (values.confusion) score += 1;
      if (values.urea) score += 1;
      if (values.respiratory_rate) score += 1;
      if (values.blood_pressure) score += 1;
      if (values.age) score += 1;
      
      let interpretation = '';
      let mortality = '';
      let recommendation = '';
      
      if (score === 0) {
        interpretation = 'Low severity';
        mortality = '0.7%';
        recommendation = 'Outpatient treatment';
      } else if (score === 1) {
        interpretation = 'Low severity';
        mortality = '2.1%';
        recommendation = 'Outpatient treatment';
      } else if (score === 2) {
        interpretation = 'Intermediate severity';
        mortality = '9.2%';
        recommendation = 'Consider inpatient treatment';
      } else if (score === 3) {
        interpretation = 'High severity';
        mortality = '14.5%';
        recommendation = 'Inpatient treatment';
      } else {
        interpretation = 'Very high severity';
        mortality = '40%';
        recommendation = 'Consider ICU';
      }
      
      return {
        result: score,
        interpretation,
        details: `CURB-65: ${score} points - ${interpretation} (${mortality} 30-day mortality) - ${recommendation}`
      };
    }
  },

  // Renal System
  {
    id: 'egfr-ckd-epi',
    name: 'eGFR (CKD-EPI)',
    description: 'Estimated glomerular filtration rate calculation',
    system: 'Renal',
    fields: [
      { id: 'creatinine', label: 'Serum Creatinine', type: 'number', unit: 'mg/dL', required: true, min: 0.1, max: 20 },
      { id: 'age', label: 'Age', type: 'number', unit: 'years', required: true, min: 18, max: 120 },
      { id: 'gender', label: 'Gender', type: 'radio', options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }], required: true },
      { id: 'race', label: 'Race', type: 'radio', options: [{ value: 'black', label: 'Black/African American' }, { value: 'other', label: 'Other' }], required: true }
    ],
    calculate: (values) => {
      const creatinine = parseFloat(values.creatinine);
      const age = parseInt(values.age);
      const isFemale = values.gender === 'female';
      const isBlack = values.race === 'black';
      
      // CKD-EPI equation
      let kappa = isFemale ? 0.7 : 0.9;
      let alpha = isFemale ? -0.329 : -0.411;
      let minCreat = Math.min(creatinine / kappa, 1);
      let maxCreat = Math.max(creatinine / kappa, 1);
      
      let egfr = 141 * Math.pow(minCreat, alpha) * Math.pow(maxCreat, -1.209) * Math.pow(0.993, age);
      
      if (isFemale) egfr *= 1.018;
      if (isBlack) egfr *= 1.159;
      
      egfr = Math.round(egfr);
      
      let stage = '';
      let interpretation = '';
      
      if (egfr >= 90) {
        stage = 'G1';
        interpretation = 'Normal or high';
      } else if (egfr >= 60) {
        stage = 'G2';
        interpretation = 'Mildly decreased';
      } else if (egfr >= 45) {
        stage = 'G3a';
        interpretation = 'Mild to moderately decreased';
      } else if (egfr >= 30) {
        stage = 'G3b';
        interpretation = 'Moderately to severely decreased';
      } else if (egfr >= 15) {
        stage = 'G4';
        interpretation = 'Severely decreased';
      } else {
        stage = 'G5';
        interpretation = 'Kidney failure';
      }
      
      return {
        result: egfr,
        unit: 'mL/min/1.73m²',
        interpretation: `CKD Stage ${stage}`,
        details: `eGFR: ${egfr} mL/min/1.73m² - ${interpretation}`
      };
    }
  },

  // Neurology
  {
    id: 'nihss',
    name: 'NIH Stroke Scale',
    description: 'Stroke severity assessment',
    system: 'Neurology',
    fields: [
      { 
        id: 'consciousness', 
        label: 'Level of consciousness', 
        type: 'select', 
        options: [
          { value: '0', label: '0 - Alert' },
          { value: '1', label: '1 - Not alert, arousable' },
          { value: '2', label: '2 - Not alert, requires stimulation' },
          { value: '3', label: '3 - Unresponsive' }
        ],
        required: true
      },
      {
        id: 'orientation',
        label: 'Orientation questions',
        type: 'select',
        options: [
          { value: '0', label: '0 - Both correct' },
          { value: '1', label: '1 - One correct' },
          { value: '2', label: '2 - Neither correct' }
        ],
        required: true
      },
      {
        id: 'commands',
        label: 'Response to commands',
        type: 'select',
        options: [
          { value: '0', label: '0 - Both correct' },
          { value: '1', label: '1 - One correct' },
          { value: '2', label: '2 - Neither correct' }
        ],
        required: true
      },
      {
        id: 'gaze',
        label: 'Horizontal eye movement',
        type: 'select',
        options: [
          { value: '0', label: '0 - Normal' },
          { value: '1', label: '1 - Partial gaze palsy' },
          { value: '2', label: '2 - Forced deviation' }
        ],
        required: true
      },
      {
        id: 'facial_palsy',
        label: 'Facial palsy',
        type: 'select',
        options: [
          { value: '0', label: '0 - Normal' },
          { value: '1', label: '1 - Minor paralysis' },
          { value: '2', label: '2 - Partial paralysis' },
          { value: '3', label: '3 - Complete paralysis' }
        ],
        required: true
      }
    ],
    calculate: (values) => {
      const score = Object.values(values).reduce((sum, val) => sum + parseInt(val as string), 0);
      
      let interpretation = '';
      if (score <= 4) interpretation = 'Minor stroke';
      else if (score <= 15) interpretation = 'Moderate stroke';
      else if (score <= 20) interpretation = 'Moderate to severe stroke';
      else interpretation = 'Severe stroke';
      
      return {
        result: score,
        interpretation,
        details: `NIHSS Score: ${score} points - ${interpretation}`
      };
    }
  },

  // Endocrine
  {
    id: 'hba1c-glucose',
    name: 'HbA1c to Average Glucose',
    description: 'Convert HbA1c to estimated average glucose',
    system: 'Endocrine',
    fields: [
      { id: 'hba1c', label: 'HbA1c', type: 'number', unit: '%', required: true, min: 4, max: 15 }
    ],
    calculate: (values) => {
      const hba1c = parseFloat(values.hba1c);
      const avgGlucose = (28.7 * hba1c) - 46.7;
      const avgGlucoseMmol = avgGlucose / 18;
      
      let diabeticStatus = '';
      if (hba1c < 5.7) diabeticStatus = 'Normal';
      else if (hba1c < 6.5) diabeticStatus = 'Prediabetes';
      else diabeticStatus = 'Diabetes';
      
      return {
        result: Math.round(avgGlucose),
        unit: 'mg/dL',
        interpretation: diabeticStatus,
        details: `HbA1c ${hba1c}% = Average glucose ${Math.round(avgGlucose)} mg/dL (${Math.round(avgGlucoseMmol * 10) / 10} mmol/L) - ${diabeticStatus}`
      };
    }
  },

  // Emergency Medicine
  {
    id: 'ottawa-ankle',
    name: 'Ottawa Ankle Rules',
    description: 'X-ray decision rule for ankle injuries',
    system: 'Emergency Medicine',
    fields: [
      { id: 'malleolar_pain', label: 'Pain in malleolar zone', type: 'checkbox' },
      { id: 'midfoot_pain', label: 'Pain in midfoot zone', type: 'checkbox' },
      { id: 'lateral_malleolus', label: 'Bone tenderness at lateral malleolus', type: 'checkbox' },
      { id: 'medial_malleolus', label: 'Bone tenderness at medial malleolus', type: 'checkbox' },
      { id: 'navicular', label: 'Bone tenderness at navicular', type: 'checkbox' },
      { id: 'fifth_metatarsal', label: 'Bone tenderness at base of 5th metatarsal', type: 'checkbox' },
      { id: 'unable_weight_bear_er', label: 'Unable to bear weight in ER (4 steps)', type: 'checkbox' },
      { id: 'unable_weight_bear_initial', label: 'Unable to bear weight immediately after injury', type: 'checkbox' }
    ],
    calculate: (values) => {
      let ankleXray = false;
      let footXray = false;
      
      // Ankle X-ray criteria
      if (values.malleolar_pain && (values.lateral_malleolus || values.medial_malleolus || values.unable_weight_bear_er || values.unable_weight_bear_initial)) {
        ankleXray = true;
      }
      
      // Foot X-ray criteria
      if (values.midfoot_pain && (values.navicular || values.fifth_metatarsal || values.unable_weight_bear_er || values.unable_weight_bear_initial)) {
        footXray = true;
      }
      
      let result = '';
      let interpretation = '';
      
      if (ankleXray && footXray) {
        result = 'Both ankle and foot X-rays indicated';
        interpretation = 'High probability of fracture';
      } else if (ankleXray) {
        result = 'Ankle X-ray indicated';
        interpretation = 'Consider ankle fracture';
      } else if (footXray) {
        result = 'Foot X-ray indicated';
        interpretation = 'Consider foot fracture';
      } else {
        result = 'No X-ray indicated';
        interpretation = 'Low probability of fracture';
      }
      
      return {
        result,
        interpretation,
        details: `Ottawa Ankle Rules: ${result} - ${interpretation}`
      };
    }
  }
];

export const CALCULATOR_SYSTEMS = [
  'Cardiovascular',
  'Respiratory', 
  'Renal',
  'Neurology',
  'Endocrine',
  'Emergency Medicine'
];

export function getCalculatorsBySystem(system: string): Calculator[] {
  return CLINICAL_CALCULATORS.filter(calc => calc.system === system);
}

export function getCalculatorById(id: string): Calculator | undefined {
  return CLINICAL_CALCULATORS.find(calc => calc.id === id);
}

export function searchCalculators(query: string): Calculator[] {
  const lowerQuery = query.toLowerCase();
  return CLINICAL_CALCULATORS.filter(calc => 
    calc.name.toLowerCase().includes(lowerQuery) ||
    calc.description.toLowerCase().includes(lowerQuery) ||
    calc.system.toLowerCase().includes(lowerQuery)
  );
}