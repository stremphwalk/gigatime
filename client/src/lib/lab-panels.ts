// Lab panels and their corresponding lab tests with abbreviations
export interface LabTest {
  name: string;
  abbreviation: string;
  normalRange?: string;
  unit: string;
}

export interface LabPanel {
  name: string;
  abbreviation: string;
  tests: LabTest[];
  category: string;
}

export const LAB_PANELS: LabPanel[] = [
  {
    name: "Complete Blood Count",
    abbreviation: "CBC",
    category: "Hematology",
    tests: [
      { name: "White Blood Cells", abbreviation: "WBC", normalRange: "4.0-11.0", unit: "K/uL" },
      { name: "Red Blood Cells", abbreviation: "RBC", normalRange: "4.2-5.4", unit: "M/uL" },
      { name: "Hemoglobin", abbreviation: "Hgb", normalRange: "12.0-15.5", unit: "g/dL" },
      { name: "Hematocrit", abbreviation: "Hct", normalRange: "36-46", unit: "%" },
      { name: "Platelets", abbreviation: "Plt", normalRange: "150-450", unit: "K/uL" },
      { name: "Mean Corpuscular Volume", abbreviation: "MCV", normalRange: "80-100", unit: "fL" },
      { name: "Mean Corpuscular Hemoglobin", abbreviation: "MCH", normalRange: "27-33", unit: "pg" },
      { name: "Mean Corpuscular Hemoglobin Concentration", abbreviation: "MCHC", normalRange: "32-36", unit: "g/dL" },
      { name: "Red Cell Distribution Width", abbreviation: "RDW", normalRange: "11.5-14.5", unit: "%" }
    ]
  },
  {
    name: "Basic Metabolic Panel",
    abbreviation: "BMP",
    category: "Chemistry",
    tests: [
      { name: "Sodium", abbreviation: "Na", normalRange: "136-145", unit: "mEq/L" },
      { name: "Potassium", abbreviation: "K", normalRange: "3.5-5.0", unit: "mEq/L" },
      { name: "Chloride", abbreviation: "Cl", normalRange: "98-107", unit: "mEq/L" },
      { name: "Carbon Dioxide", abbreviation: "CO2", normalRange: "22-28", unit: "mEq/L" },
      { name: "Blood Urea Nitrogen", abbreviation: "BUN", normalRange: "7-20", unit: "mg/dL" },
      { name: "Creatinine", abbreviation: "Cr", normalRange: "0.6-1.2", unit: "mg/dL" },
      { name: "Glucose", abbreviation: "Glu", normalRange: "70-99", unit: "mg/dL" },
      { name: "Estimated Glomerular Filtration Rate", abbreviation: "eGFR", normalRange: ">60", unit: "mL/min/1.73m²" }
    ]
  },

  {
    name: "Liver Function Tests",
    abbreviation: "LFTs",
    category: "Chemistry",
    tests: [
      { name: "Total Bilirubin", abbreviation: "T.Bili", normalRange: "0.3-1.2", unit: "mg/dL" },
      { name: "Direct Bilirubin", abbreviation: "D.Bili", normalRange: "0.0-0.3", unit: "mg/dL" },
      { name: "Indirect Bilirubin", abbreviation: "I.Bili", normalRange: "0.2-0.8", unit: "mg/dL" },
      { name: "Alanine Aminotransferase", abbreviation: "ALT", normalRange: "7-56", unit: "U/L" },
      { name: "Aspartate Aminotransferase", abbreviation: "AST", normalRange: "10-40", unit: "U/L" },
      { name: "Alkaline Phosphatase", abbreviation: "ALP", normalRange: "44-147", unit: "U/L" },
      { name: "Gamma-Glutamyl Transferase", abbreviation: "GGT", normalRange: "9-48", unit: "U/L" },
      { name: "Albumin", abbreviation: "Alb", normalRange: "3.5-5.0", unit: "g/dL" },
      { name: "Total Protein", abbreviation: "TP", normalRange: "6.0-8.3", unit: "g/dL" },
      { name: "Prothrombin Time", abbreviation: "PT", normalRange: "11-15", unit: "sec" },
      { name: "International Normalized Ratio", abbreviation: "INR", normalRange: "0.8-1.1", unit: "" }
    ]
  },
  {
    name: "Lipid Panel",
    abbreviation: "Lipids",
    category: "Chemistry",
    tests: [
      { name: "Total Cholesterol", abbreviation: "Chol", normalRange: "<200", unit: "mg/dL" },
      { name: "Low-Density Lipoprotein", abbreviation: "LDL", normalRange: "<100", unit: "mg/dL" },
      { name: "High-Density Lipoprotein", abbreviation: "HDL", normalRange: ">40", unit: "mg/dL" },
      { name: "Triglycerides", abbreviation: "TG", normalRange: "<150", unit: "mg/dL" },
      { name: "Non-HDL Cholesterol", abbreviation: "Non-HDL", normalRange: "<130", unit: "mg/dL" }
    ]
  },
  {
    name: "Thyroid Function Tests",
    abbreviation: "TFTs",
    category: "Endocrine",
    tests: [
      { name: "Thyroid Stimulating Hormone", abbreviation: "TSH", normalRange: "0.4-4.0", unit: "mIU/L" },
      { name: "Free Thyroxine", abbreviation: "Free T4", normalRange: "0.8-1.8", unit: "ng/dL" },
      { name: "Free Triiodothyronine", abbreviation: "Free T3", normalRange: "2.3-4.2", unit: "pg/mL" },
      { name: "Total Thyroxine", abbreviation: "T4", normalRange: "4.5-12.0", unit: "μg/dL" },
      { name: "Total Triiodothyronine", abbreviation: "T3", normalRange: "80-200", unit: "ng/dL" }
    ]
  },
  {
    name: "Cardiac Markers",
    abbreviation: "Cardiac",
    category: "Cardiology",
    tests: [
      { name: "Troponin I", abbreviation: "TnI", normalRange: "<0.04", unit: "ng/mL" },
      { name: "Troponin T", abbreviation: "TnT", normalRange: "<0.01", unit: "ng/mL" },
      { name: "Creatine Kinase", abbreviation: "CK", normalRange: "30-200", unit: "U/L" },
      { name: "Creatine Kinase-MB", abbreviation: "CK-MB", normalRange: "0-6.3", unit: "ng/mL" },
      { name: "B-type Natriuretic Peptide", abbreviation: "BNP", normalRange: "<100", unit: "pg/mL" },
      { name: "N-terminal pro-B-type Natriuretic Peptide", abbreviation: "NT-proBNP", normalRange: "<125", unit: "pg/mL" }
    ]
  },
  {
    name: "Coagulation Studies",
    abbreviation: "Coags",
    category: "Hematology",
    tests: [
      { name: "Prothrombin Time", abbreviation: "PT", normalRange: "11-15", unit: "sec" },
      { name: "International Normalized Ratio", abbreviation: "INR", normalRange: "0.8-1.1", unit: "" },
      { name: "Partial Thromboplastin Time", abbreviation: "PTT", normalRange: "25-35", unit: "sec" },
      { name: "Activated Partial Thromboplastin Time", abbreviation: "aPTT", normalRange: "25-35", unit: "sec" },
      { name: "Fibrinogen", abbreviation: "Fib", normalRange: "200-400", unit: "mg/dL" },
      { name: "D-dimer", abbreviation: "D-dimer", normalRange: "<0.50", unit: "μg/mL" }
    ]
  },
  {
    name: "Inflammatory Markers",
    abbreviation: "Inflammatory",
    category: "Chemistry",
    tests: [
      { name: "C-Reactive Protein", abbreviation: "CRP", normalRange: "<3.0", unit: "mg/L" },
      { name: "Erythrocyte Sedimentation Rate", abbreviation: "ESR", normalRange: "0-30", unit: "mm/hr" },
      { name: "Procalcitonin", abbreviation: "PCT", normalRange: "<0.25", unit: "ng/mL" }
    ]
  },
  {
    name: "Arterial Blood Gas",
    abbreviation: "ABG",
    category: "Blood Gas",
    tests: [
      { name: "pH", abbreviation: "pH", normalRange: "7.35-7.45", unit: "" },
      { name: "Partial Pressure of Carbon Dioxide", abbreviation: "pCO2", normalRange: "35-45", unit: "mmHg" },
      { name: "Partial Pressure of Oxygen", abbreviation: "pO2", normalRange: "80-100", unit: "mmHg" },
      { name: "Bicarbonate", abbreviation: "HCO3", normalRange: "22-28", unit: "mEq/L" },
      { name: "Base Excess", abbreviation: "BE", normalRange: "-2 to +2", unit: "mEq/L" },
      { name: "Oxygen Saturation", abbreviation: "O2Sat", normalRange: ">95", unit: "%" }
    ]
  }
];

export interface LabValue {
  testId: string;
  abbreviation: string;
  values: number[];
  unit: string;
}

export interface LabEntry {
  panelName: string;
  panelAbbreviation: string;
  labs: LabValue[];
}

export function formatLabsForInsertion(labEntries: LabEntry[]): string {
  let result = "";
  
  labEntries.forEach((entry, entryIndex) => {
    if (entry.labs.length > 0) {
      // Add panel separator line if not first panel
      if (entryIndex > 0) {
        result += "\n";
      }
      
      entry.labs.forEach((lab) => {
        const mainValue = lab.values[0];
        const trendValues = lab.values.slice(1);
        
        let labLine = `${lab.abbreviation} ${mainValue}`;
        if (trendValues.length > 0) {
          labLine += ` (${trendValues.join(", ")})`;
        }
        
        result += labLine + "\n";
      });
    }
  });
  
  return result.trim();
}

export function findLabPanel(panelName: string): LabPanel | undefined {
  return LAB_PANELS.find(panel => 
    panel.name.toLowerCase() === panelName.toLowerCase() ||
    panel.abbreviation.toLowerCase() === panelName.toLowerCase()
  );
}

export function searchLabPanels(query: string): LabPanel[] {
  if (!query) return LAB_PANELS;
  
  const normalizedQuery = query.toLowerCase();
  return LAB_PANELS.filter(panel =>
    panel.name.toLowerCase().includes(normalizedQuery) ||
    panel.abbreviation.toLowerCase().includes(normalizedQuery) ||
    panel.category.toLowerCase().includes(normalizedQuery)
  );
}