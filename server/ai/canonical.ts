// Canonicalization utilities for clinical names

export function normalizeKey(s: string): string {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const labMap = new Map<string, string>([
  ['wbc', 'WBC'], ['white blood cell', 'WBC'], ['white blood cells', 'WBC'], ['leukocytes', 'WBC'],
  ['hgb', 'Hemoglobin'], ['hb', 'Hemoglobin'], ['hemoglobin', 'Hemoglobin'],
  ['hct', 'Hematocrit'], ['hematocrit', 'Hematocrit'],
  ['plt', 'Platelets'], ['platelet', 'Platelets'], ['platelets', 'Platelets'],
  ['na+', 'Sodium'], ['na', 'Sodium'], ['sodium', 'Sodium'],
  ['k+', 'Potassium'], ['k', 'Potassium'], ['potassium', 'Potassium'],
  ['cl', 'Chloride'], ['chloride', 'Chloride'],
  ['bun', 'BUN'], ['urea', 'BUN'],
  ['cr', 'Creatinine'], ['creatinine', 'Creatinine'],
  ['glucose', 'Glucose'], ['glu', 'Glucose'],
]);

const vitalsMap = new Map<string, string>([
  ['hr', 'Heart Rate'], ['heart rate', 'Heart Rate'], ['pulse', 'Heart Rate'],
  ['bp', 'Blood Pressure'], ['blood pressure', 'Blood Pressure'],
  ['rr', 'Respiratory Rate'], ['resp rate', 'Respiratory Rate'], ['respiratory rate', 'Respiratory Rate'],
  ['temp', 'Temperature'], ['temperature', 'Temperature'],
  ['spo2', 'SpO2'], ['o2 sat', 'SpO2'], ['oxygen saturation', 'SpO2'],
]);

const imagingMap = new Map<string, string>([
  ['cxr', 'Chest X-ray'], ['chest x ray', 'Chest X-ray'], ['chest xray', 'Chest X-ray'],
  ['ct', 'CT'], ['ct scan', 'CT'],
  ['mri', 'MRI'], ['magnetic resonance imaging', 'MRI'],
  ['us', 'Ultrasound'], ['ultrasound', 'Ultrasound'],
]);

export function canonicalizeLab(name: string): string {
  const key = normalizeKey(name);
  return labMap.get(key) || name;
}

export function canonicalizeVital(name: string): string {
  const key = normalizeKey(name);
  return vitalsMap.get(key) || name;
}

export function canonicalizeImagingType(name: string): string {
  const key = normalizeKey(name);
  return imagingMap.get(key) || name;
}

