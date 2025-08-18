// Common medications database with dosages and frequencies
export interface MedicationInfo {
  name: string;
  genericName?: string;
  brandNames?: string[];
  commonDosages: string[];
  commonFrequencies: string[];
  category: string;
  subcategory?: string;
  indication?: string;
  priority?: number; // 1-10, where 10 is most commonly prescribed
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
    brandNames: ["Glucophage", "Fortamet", "Glumetza"],
    commonDosages: ["250mg", "500mg", "850mg", "1000mg"],
    commonFrequencies: ["BID", "QD"],
    category: "Antidiabetic Agents",
    subcategory: "Biguanides",
    indication: "Type 2 diabetes",
    priority: 10 // Most common diabetes medication
  },
  {
    name: "Insulin Lispro",
    genericName: "insulin lispro",
    brandNames: ["Humalog", "Admelog"],
    commonDosages: ["10 units", "20 units", "30 units", "40 units"],
    commonFrequencies: ["with meals", "TID"],
    category: "Antidiabetic Agents",
    subcategory: "Insulin",
    indication: "Type 1 and Type 2 diabetes"
  },
  {
    name: "Glipizide",
    genericName: "glipizide",
    brandNames: ["Glucotrol", "Glucotrol XL"],
    commonDosages: ["2.5mg", "5mg", "10mg"],
    commonFrequencies: ["QD", "BID"],
    category: "Antidiabetic Agents",
    subcategory: "Sulfonylureas",
    indication: "Type 2 diabetes"
  },
  {
    name: "Gliclazide",
    genericName: "gliclazide",
    brandNames: ["Diamicron"],
    commonDosages: ["80mg", "160mg"],
    commonFrequencies: ["QD", "BID"],
    category: "Antidiabetic Agents",
    subcategory: "Sulfonylureas",
    indication: "Type 2 diabetes"
  },
  {
    name: "Gliclazide MR",
    genericName: "gliclazide MR",
    brandNames: ["Diamicron MR"],
    commonDosages: ["30mg", "60mg", "90mg", "120mg"],
    commonFrequencies: ["QD"],
    category: "Antidiabetic Agents",
    subcategory: "Sulfonylureas",
    indication: "Type 2 diabetes"
  },
  {
    name: "Glyburide",
    genericName: "glyburide",
    brandNames: ["Diabeta"],
    commonDosages: ["2.5mg", "5mg", "7.5mg", "10mg"],
    commonFrequencies: ["QD", "BID"],
    category: "Antidiabetic Agents",
    subcategory: "Sulfonylureas",
    indication: "Type 2 diabetes"
  },
  {
    name: "Sitagliptin",
    genericName: "sitagliptin",
    brandNames: ["Januvia"],
    commonDosages: ["25mg", "50mg", "100mg"],
    commonFrequencies: ["QD"],
    category: "Antidiabetic Agents",
    subcategory: "DPP-4 Inhibitors",
    indication: "Type 2 diabetes"
  },
  {
    name: "Alogliptin",
    genericName: "Alogliptin",
    brandNames: ["Nesina"],
    commonDosages: ["6.25mg", "12.5mg", "25mg"],
    commonFrequencies: ["QD"],
    category: "Antidiabetic Agents",
    subcategory: "DPP-4 Inhibitors",
    indication: "Type 2 diabetes"
  },
  {
    name: "Linagliptin",
    genericName: "Linagliptin",
    brandNames: ["Trajenta"],
    commonDosages: ["5mg"],
    commonFrequencies: ["QD"],
    category: "Antidiabetic Agents",
    subcategory: "DPP-4 Inhibitors",
    indication: "Type 2 diabetes"
  },
  {
    name: "Saxagliptin",
    genericName: "Saxagliptin",
    brandNames: ["Onglyza"],
    commonDosages: ["2.5mg", "5mg"],
    commonFrequencies: ["QD"],
    category: "Antidiabetic Agents",
    subcategory: "DPP-4 Inhibitors",
    indication: "Type 2 diabetes"
  },
  {
    name: "Acarbose",
    genericName: "acarbose",
    brandNames: ["Glucobay"],
    commonDosages: ["25mg", "50mg", "75mg", "100mg"],
    commonFrequencies: ["QD"],
    category: "Antidiabetic Agents",
    subcategory: "Alpha-Glucosidase Inhibitors",
    indication: "Type 2 diabetes"
  },
  {
    name: "Dulaglutide",
    genericName: "Dulaglutide",
    brandNames: ["Trulicity"],
    commonDosages: ["0.75mg", "1.5mg"],
    commonFrequencies: ["Q Weekly"],
    category: "Antidiabetic Agents",
    subcategory: "GLP-1 Agonists",
    indication: "Type 2 diabetes"
  },
  {
    name: "Liraglutide",
    genericName: "Liraglutide",
    brandNames: ["Victoza"],
    commonDosages: ["0.6mg", "1.2mg", "1.8mg"],
    commonFrequencies: ["QD"],
    category: "Antidiabetic Agents",
    subcategory: "GLP-1 Agonists",
    indication: "Type 2 diabetes"
  },
  {
    name: "Semaglutide",
    genericName: "Semaglutide",
    brandNames: ["Ozempic"],
    commonDosages: ["0.25mg", "0.5mg", "1mg", "1.5mg", "2mg"],
    commonFrequencies: ["Q Weekly"],
    category: "Antidiabetic Agents",
    subcategory: "GLP-1 Agonists",
    indication: "Type 2 diabetes"
  },
  {
    name: "Tirzepatide",
    genericName: "Tirzepatide",
    brandNames: ["Mounjaro"],
    commonDosages: ["2.5mg", "5mg", "7.5mg", "10mg", "12.5mg", "15mg"],
    commonFrequencies: ["Q Weekly"],
    category: "Antidiabetic Agents",
    subcategory: "GLP-1 Agonist and GIP agonist",
    indication: "Type 2 diabetes"
  },
  {
    name: "Canagliflozin",
    genericName: "canagliflozin",
    brandNames: ["Invokana"],
    commonDosages: ["100mg", "200mg", "300mg"],
    commonFrequencies: ["QD"],
    category: "Antidiabetic Agents",
    subcategory: "SGLT2 inhibitor",
    indication: "Type 2 diabetes"
  },
  {
    name: "Dapagliflozin",
    genericName: "dapagliflozin",
    brandNames: ["Forxiga"],
    commonDosages: ["5mg", "10mg"],
    commonFrequencies: ["QD"],
    category: "Antidiabetic Agents",
    subcategory: "SGLT2 inhibitor",
    indication: "Type 2 diabetes"
  },
  {
    name: "Empagliflozin",
    genericName: "empagliflozin",
    brandNames: ["Jardiance"],
    commonDosages: ["10mg", "25mg"],
    commonFrequencies: ["QD"],
    category: "Antidiabetic Agents",
    subcategory: "SGLT2 inhibitor",
    indication: "Type 2 diabetes"
  },
  {
    name: "Repaglinide",
    genericName: "repaglinide",
    brandNames: ["Gluconorm"],
    commonDosages: ["0.5mg", "1mg", "2mg", "4mg"],
    commonFrequencies: ["QD", "BID", "TID", "QID"],
    category: "Antidiabetic Agents",
    subcategory: "Meglitinides",
    indication: "Type 2 diabetes"
  },
  // Antihypertensive Agents - ACE Inhibitors
  {
    name: "Benazepril",
    genericName: "benazepril",
    brandNames: ["Lotensin"],
    commonDosages: ["5mg", "10mg", "20mg"],
    commonFrequencies: ["QD"],
    category: "Antihypertensive Agents",
    subcategory: "Angiotensin-Converting Enzyme Inhibitors (ACEI)",
    indication: "Hypertension"
  },
  {
    name: "Captopril",
    genericName: "captopril",
    brandNames: ["Capoten"],
    commonDosages: ["6.25mg", "12.5mg", "25mg", "50mg", "100mg"],
    commonFrequencies: ["TID"],
    category: "Antihypertensive Agents",
    subcategory: "Angiotensin-Converting Enzyme Inhibitors (ACEI)",
    indication: "Hypertension, heart failure, post-MI"
  },
  {
    name: "Cilazapril",
    genericName: "cilazapril",
    brandNames: ["Inhibace"],
    commonDosages: ["1mg", "2.5mg", "5mg"],
    commonFrequencies: ["QD"],
    category: "Antihypertensive Agents",
    subcategory: "Angiotensin-Converting Enzyme Inhibitors (ACEI)",
    indication: "Hypertension"
  },
  {
    name: "Enalapril",
    genericName: "enalapril",
    brandNames: ["Vasotec"],
    commonDosages: ["2.5mg", "5mg", "10mg", "20mg"],
    commonFrequencies: ["QD", "BID"],
    category: "Antihypertensive Agents",
    subcategory: "Angiotensin-Converting Enzyme Inhibitors (ACEI)",
    indication: "Hypertension, heart failure"
  },
  {
    name: "Fosinopril",
    genericName: "fosinopril",
    brandNames: ["Monopril"],
    commonDosages: ["10mg", "20mg"],
    commonFrequencies: ["QD", "BID"],
    category: "Antihypertensive Agents",
    subcategory: "Angiotensin-Converting Enzyme Inhibitors (ACEI)",
    indication: "Hypertension, heart failure"
  },
  {
    name: "Lisinopril",
    genericName: "lisinopril",
    brandNames: ["Prinivil", "Zestril"],
    commonDosages: ["5mg", "10mg", "20mg"],
    commonFrequencies: ["QD"],
    category: "Antihypertensive Agents",
    subcategory: "Angiotensin-Converting Enzyme Inhibitors (ACEI)",
    indication: "Hypertension, heart failure, post-MI",
    priority: 10 // Very common ACE inhibitor
  },
  {
    name: "Perindopril",
    genericName: "perindopril",
    brandNames: ["Coversyl"],
    commonDosages: ["2mg", "4mg", "8mg"],
    commonFrequencies: ["QD"],
    category: "Antihypertensive Agents",
    subcategory: "Angiotensin-Converting Enzyme Inhibitors (ACEI)",
    indication: "Hypertension"
  },
  {
    name: "Quinapril",
    genericName: "quinapril",
    brandNames: ["Accupril"],
    commonDosages: ["5mg", "10mg", "20mg", "40mg"],
    commonFrequencies: ["QD", "BID"],
    category: "Antihypertensive Agents",
    subcategory: "Angiotensin-Converting Enzyme Inhibitors (ACEI)",
    indication: "Hypertension, heart failure"
  },
  {
    name: "Ramipril",
    genericName: "ramipril",
    brandNames: ["Altace"],
    commonDosages: ["1.25mg", "2.5mg", "5mg", "10mg", "15mg"],
    commonFrequencies: ["QD"],
    category: "Antihypertensive Agents",
    subcategory: "Angiotensin-Converting Enzyme Inhibitors (ACEI)",
    indication: "Hypertension, heart failure, post-MI"
  },
  {
    name: "Trandolapril",
    genericName: "trandolapril",
    brandNames: ["Mavik"],
    commonDosages: ["1mg", "2mg", "4mg"],
    commonFrequencies: ["QD"],
    category: "Antihypertensive Agents",
    subcategory: "Angiotensin-Converting Enzyme Inhibitors (ACEI)",
    indication: "Hypertension, heart failure"
  },
  
  // Antihypertensive Agents - Calcium Channel Blockers
  {
    name: "Amlodipine",
    genericName: "amlodipine",
    brandNames: ["Norvasc"],
    commonDosages: ["2.5mg", "5mg", "10mg"],
    commonFrequencies: ["QD"],
    category: "Antihypertensive Agents",
    subcategory: "Calcium Channel Blockers",
    indication: "Hypertension, angina"
  },
  {
    name: "Diltiazem",
    genericName: "diltiazem",
    brandNames: ["Cardizem", "Cardizem CD", "Tiazac", "Tiazac XC"],
    commonDosages: ["30mg", "60mg", "120mg", "180mg", "240mg", "300mg", "360mg"],
    commonFrequencies: ["QID", "QD"],
    category: "Antihypertensive Agents",
    subcategory: "Calcium Channel Blockers",
    indication: "Hypertension, angina, rate control in atrial fibrillation"
  },
  {
    name: "Verapamil",
    genericName: "verapamil",
    brandNames: ["Isoptin", "Isoptin-SR", "Verelan"],
    commonDosages: ["80mg", "120mg", "180mg", "240mg"],
    commonFrequencies: ["TID", "QID", "QD", "BID"],
    category: "Antihypertensive Agents",
    subcategory: "Calcium Channel Blockers",
    indication: "Hypertension, angina, arrhythmias (rate control)"
  },

  {
    name: "Nifedipine",
    genericName: "nifedipine",
    brandNames: ["Procardia", "Adalat"],
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
    brandNames: ["Lopressor", "Toprol-XL"],
    commonDosages: ["25mg", "50mg", "100mg"],
    commonFrequencies: ["BID", "QD"],
    category: "Antihypertensive Agents",
    subcategory: "Beta Blockers",
    indication: "Hypertension, heart failure, post-MI",
    priority: 9 // Very common beta blocker
  },
  {
    name: "Atenolol",
    genericName: "atenolol",
    brandNames: ["Tenormin"],
    commonDosages: ["25mg", "50mg", "100mg"],
    commonFrequencies: ["QD"],
    category: "Antihypertensive Agents",
    subcategory: "Beta Blockers",
    indication: "Hypertension, angina"
  },
  {
    name: "Acebutolol",
    genericName: "acebutolol",
    brandNames: ["Sectral", "Monitan", "Rhotral"],
    commonDosages: ["100mg", "200mg", "400mg"],
    commonFrequencies: ["BID"],
    category: "Antihypertensive Agents",
    subcategory: "Beta Blockers",
    indication: "Hypertension"
  },
  {
    name: "Bisoprolol",
    genericName: "bisoprolol",
    brandNames: ["Monocor"],
    commonDosages: ["1.25mg", "2.5mg", "5mg", "10mg"],
    commonFrequencies: ["QD"],
    category: "Antihypertensive Agents",
    subcategory: "Beta Blockers",
    indication: "Hypertension, heart failure (HFrEF)"
  },
  {
    name: "Carvedilol",
    genericName: "carvedilol",
    brandNames: ["Coreg"],
    commonDosages: ["3.125mg", "6.25mg", "12.5mg", "25mg"],
    commonFrequencies: ["BID"],
    category: "Antihypertensive Agents",
    subcategory: "Beta Blockers",
    indication: "Heart failure (HFrEF), hypertension"
  },
  {
    name: "Labetalol",
    genericName: "labetalol",
    brandNames: ["Trandate"],
    commonDosages: ["100mg", "200mg"],
    commonFrequencies: ["BID"],
    category: "Antihypertensive Agents",
    subcategory: "Beta Blockers",
    indication: "Hypertension, hypertensive emergencies"
  },
  {
    name: "Nadolol",
    genericName: "nadolol",
    brandNames: ["Corgard"],
    commonDosages: ["40mg", "80mg", "160mg"],
    commonFrequencies: ["QD"],
    category: "Antihypertensive Agents",
    subcategory: "Beta Blockers",
    indication: "Hypertension, angina"
  },
  {
    name: "Pindolol",
    genericName: "pindolol",
    brandNames: ["Visken"],
    commonDosages: ["5mg", "10mg", "15mg"],
    commonFrequencies: ["BID"],
    category: "Antihypertensive Agents",
    subcategory: "Beta Blockers",
    indication: "Hypertension, angina"
  },
  {
    name: "Propranolol",
    genericName: "propranolol",
    brandNames: ["Propranolol", "Inderal-LA"],
    commonDosages: ["10mg", "20mg", "40mg", "80mg", "60mg LA", "80mg LA", "120mg LA", "160mg LA"],
    commonFrequencies: ["BID", "TID", "QD (LA)"],
    category: "Antihypertensive Agents",
    subcategory: "Beta Blockers",
    indication: "Hypertension, angina, arrhythmias, migraine prophylaxis"
  },
  {
    name: "Sotalol",
    genericName: "sotalol",
    brandNames: ["Sotacor"],
    commonDosages: ["80mg", "160mg"],
    commonFrequencies: ["BID"],
    category: "Antihypertensive Agents",
    subcategory: "Beta Blockers (also Class III antiarrhythmic)",
    indication: "Arrhythmias, hypertension"
  },
  {
    name: "Timolol",
    genericName: "timolol",
    brandNames: ["Blocadren"],
    commonDosages: ["5mg", "10mg", "20mg"],
    commonFrequencies: ["BID"],
    category: "Antihypertensive Agents",
    subcategory: "Beta Blockers",
    indication: "Hypertension, migraine prophylaxis"
  },
  
  // Antihypertensive Agents - Diuretics
  // Antihypertensive Agents - Diuretics
{
  name: "Ethacrynic acid",
  genericName: "ethacrynic acid",
  brandNames: ["Edecrin"],
  commonDosages: ["25mg"],
  commonFrequencies: ["QD"],
  category: "Antihypertensive Agents",
  subcategory: "Diuretics (Loop)",
  indication: "Edema, hypertension (sulfa allergy alternative)"
},
{
  name: "Amiloride",
  genericName: "amiloride",
  brandNames: ["Midamor"],
  commonDosages: ["5mg"],
  commonFrequencies: ["QD"],
  category: "Antihypertensive Agents",
  subcategory: "Diuretics (Potassium-sparing)",
  indication: "Hypertension, heart failure, hypokalemia prevention"
},
{
  name: "Bumetanide",
  genericName: "bumetanide",
  brandNames: ["Burinex"],
  commonDosages: ["1mg", "5mg"],
  commonFrequencies: ["QD"],
  category: "Antihypertensive Agents",
  subcategory: "Diuretics (Loop)",
  indication: "Edema, hypertension"
},
{
  name: "Chlorthalidone",
  genericName: "chlorthalidone",
  brandNames: ["Hygroton"],
  commonDosages: ["12.5mg", "25mg", "50mg", "100mg"],
  commonFrequencies: ["QD"],
  category: "Antihypertensive Agents",
  subcategory: "Diuretics (Thiazide-like)",
  indication: "Hypertension, edema"
},
{
  name: "Eplerenone",
  genericName: "eplerenone",
  brandNames: ["Inspra"],
  commonDosages: ["25mg", "50mg"],
  commonFrequencies: ["QD"],
  category: "Antihypertensive Agents",
  subcategory: "Diuretics (Potassium-sparing, aldosterone antagonist)",
  indication: "Heart failure, hypertension"
},
{
  name: "Finerenone",
  genericName: "finerenone",
  brandNames: ["Kerendia"],
  commonDosages: ["10mg", "20mg"],
  commonFrequencies: ["QD"],
  category: "Antihypertensive Agents",
  subcategory: "Diuretics (Mineralocorticoid receptor antagonist)",
  indication: "Chronic kidney disease with type 2 diabetes"
},
{
  name: "Furosemide",
  genericName: "furosemide",
  brandNames: ["Lasix"],
  commonDosages: ["20mg", "40mg", "80mg", "500mg"],
  commonFrequencies: ["BID", "QD (high dose)"],
  category: "Antihypertensive Agents",
  subcategory: "Diuretics (Loop)",
  indication: "Edema, hypertension, acute heart failure"
},
{
  name: "Hydrochlorothiazide",
  genericName: "hydrochlorothiazide",
  brandNames: ["Hydrodiuril"],
  commonDosages: ["12.5mg", "25mg", "50mg"],
  commonFrequencies: ["QD"],
  category: "Antihypertensive Agents",
  subcategory: "Diuretics (Thiazide)",
  indication: "Hypertension, edema"
},
{
  name: "Indapamide",
  genericName: "indapamide",
  brandNames: ["Lozide"],
  commonDosages: ["1.25mg", "2.5mg"],
  commonFrequencies: ["QD"],
  category: "Antihypertensive Agents",
  subcategory: "Diuretics (Thiazide-like)",
  indication: "Hypertension, edema"
},
{
  name: "Metolazone",
  genericName: "metolazone",
  brandNames: ["Zaroxolyn"],
  commonDosages: ["2.5mg"],
  commonFrequencies: ["QD"],
  category: "Antihypertensive Agents",
  subcategory: "Diuretics (Thiazide-like)",
  indication: "Hypertension, edema, resistant edema with loop diuretic"
},
{
  name: "Spironolactone",
  genericName: "spironolactone",
  brandNames: ["Aldactone"],
  commonDosages: ["12.5mg", "25mg", "50mg", "100mg"],
  commonFrequencies: ["QD"],
  category: "Antihypertensive Agents",
  subcategory: "Diuretics (Potassium-sparing, aldosterone antagonist)",
  indication: "Heart failure, resistant hypertension, hyperaldosteronism"
},


  // Antihypertensive Agents - Angiotensin II Receptor Blockers (ARB)
  {
    name: "Azilsartan",
    genericName: "azilsartan",
    brandNames: ["Edarbi"],
    commonDosages: ["40mg", "80mg"],
    commonFrequencies: ["QD"],
    category: "Antihypertensive Agents",
    subcategory: "Angiotensin II Receptor Blockers (ARB)",
    indication: "Hypertension, heart failure, diabetic nephropathy"
  },
  {
    name: "Candesartan",
    genericName: "candesartan",
    brandNames: ["Atacand"],
    commonDosages: ["4mg", "8mg", "16mg", "32mg"],
    commonFrequencies: ["QD"],
    category: "Antihypertensive Agents",
    subcategory: "Angiotensin II Receptor Blockers (ARB)",
    indication: "Hypertension, heart failure"
  },
  {
    name: "Eprosartan",
    genericName: "eprosartan",
    brandNames: ["Teveten"],
    commonDosages: ["400mg", "600mg"],
    commonFrequencies: ["QD"],
    category: "Antihypertensive Agents",
    subcategory: "Angiotensin II Receptor Blockers (ARB)",
    indication: "Hypertension"
  },
  {
    name: "Irbesartan",
    genericName: "irbesartan",
    brandNames: ["Avapro"],
    commonDosages: ["75mg", "150mg", "300mg"],
    commonFrequencies: ["QD"],
    category: "Antihypertensive Agents",
    subcategory: "Angiotensin II Receptor Blockers (ARB)",
    indication: "Hypertension, diabetic nephropathy"
  },
  {
    name: "Losartan",
    genericName: "losartan",
    brandNames: ["Cozaar"],
    commonDosages: ["25mg", "50mg", "100mg"],
    commonFrequencies: ["QD"],
    category: "Antihypertensive Agents",
    subcategory: "Angiotensin II Receptor Blockers (ARB)",
    indication: "Hypertension, diabetic nephropathy, stroke risk reduction"
  },
  {
    name: "Olmesartan",
    genericName: "olmesartan",
    brandNames: ["Olmetec"],
    commonDosages: ["20mg", "40mg"],
    commonFrequencies: ["QD"],
    category: "Antihypertensive Agents",
    subcategory: "Angiotensin II Receptor Blockers (ARB)",
    indication: "Hypertension"
  },
  {
    name: "Telmisartan",
    genericName: "telmisartan",
    brandNames: ["Micardis"],
    commonDosages: ["40mg", "80mg"],
    commonFrequencies: ["QD"],
    category: "Antihypertensive Agents",
    subcategory: "Angiotensin II Receptor Blockers (ARB)",
    indication: "Hypertension, cardiovascular risk reduction"
  },
  {
    name: "Valsartan",
    genericName: "valsartan",
    brandNames: ["Diovan"],
    commonDosages: ["40mg", "80mg", "160mg", "320mg"],
    commonFrequencies: ["QD"],
    category: "Antihypertensive Agents",
    subcategory: "Angiotensin II Receptor Blockers (ARB)",
    indication: "Hypertension, heart failure, post-MI"
  },
  
  // Cardiovascular Agents - Statins
  {
    name: "Atorvastatin",
    genericName: "atorvastatin",
    brandNames: ["Lipitor"],
    commonDosages: ["10mg", "20mg", "40mg", "80mg"],
    commonFrequencies: ["QD"],
    category: "Cardiovascular Agents",
    subcategory: "Statins",
    indication: "Hyperlipidemia, CVD prevention",
    priority: 10 // Most prescribed statin
  },
  {
    name: "Simvastatin",
    genericName: "simvastatin",
    brandNames: ["Zocor"],
    commonDosages: ["10mg", "20mg", "40mg"],
    commonFrequencies: ["QD"],
    category: "Cardiovascular Agents",
    subcategory: "Statins",
    indication: "Hyperlipidemia"
  },
  {
    name: "Rosuvastatin",
    genericName: "rosuvastatin",
    brandNames: ["Crestor"],
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
    brandNames: ["Advil", "Motrin"],
    commonDosages: ["200mg", "400mg", "600mg", "800mg"],
    commonFrequencies: ["PRN", "TID", "QID"],
    category: "Pain Management",
    subcategory: "NSAIDs",
    indication: "Pain, inflammation, fever"
  },
  {
    name: "Naproxen",
    genericName: "naproxen",
    brandNames: ["Aleve", "Naprosyn"],
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
    brandNames: ["Tylenol"],
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
    brandNames: ["Zoloft"],
    commonDosages: ["25mg", "50mg", "100mg"],
    commonFrequencies: ["QD"],
    category: "Central Nervous System",
    subcategory: "Antidepressants (SSRIs)",
    indication: "Depression, anxiety disorders"
  },
  {
    name: "Fluoxetine",
    genericName: "fluoxetine",
    brandNames: ["Prozac"],
    commonDosages: ["10mg", "20mg", "40mg"],
    commonFrequencies: ["QD"],
    category: "Central Nervous System",
    subcategory: "Antidepressants (SSRIs)",
    indication: "Depression, anxiety disorders"
  },
  {
    name: "Escitalopram",
    genericName: "escitalopram",
    brandNames: ["Lexapro"],
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

// Search medications with enhanced filtering capabilities including brand names and priority
export function searchMedications(query: string, limit: number = 8): MedicationInfo[] {
  if (!query || query.length < 2) return [];
  
  const normalizedQuery = query.toLowerCase().trim();
  
  return COMMON_MEDICATIONS
    .filter(med => {
      // Check generic name and medication name
      const nameMatch = med.name.toLowerCase().includes(normalizedQuery);
      const genericMatch = med.genericName && med.genericName.toLowerCase().includes(normalizedQuery);
      
      // Check brand names
      const brandMatch = med.brandNames && med.brandNames.some(brand => 
        brand.toLowerCase().includes(normalizedQuery)
      );
      
      // Check other fields
      const categoryMatch = med.category.toLowerCase().includes(normalizedQuery);
      const subcategoryMatch = med.subcategory && med.subcategory.toLowerCase().includes(normalizedQuery);
      const indicationMatch = med.indication && med.indication.toLowerCase().includes(normalizedQuery);
      
      return nameMatch || genericMatch || brandMatch || categoryMatch || subcategoryMatch || indicationMatch;
    })
    .map(med => {
      const medLower = med.name.toLowerCase();
      const priority = med.priority || 5; // Default priority if not specified
      let score = priority * 10; // Base score from priority (10-100)
      
      // Bonus for exact name match at beginning
      if (medLower.startsWith(normalizedQuery)) {
        score += 50;
      }
      // Bonus for exact generic match at beginning
      else if (med.genericName && med.genericName.toLowerCase().startsWith(normalizedQuery)) {
        score += 45;
      }
      // Bonus for brand name match at beginning
      else if (med.brandNames && med.brandNames.some(brand => 
        brand.toLowerCase().startsWith(normalizedQuery)
      )) {
        score += 40;
      }
      // Smaller bonus for word boundary match
      else if (medLower.includes(' ' + normalizedQuery) || 
               (med.genericName && med.genericName.toLowerCase().includes(' ' + normalizedQuery))) {
        score += 25;
      }
      // Even smaller bonus for any match
      else if (medLower.includes(normalizedQuery)) {
        score += 10;
      }
      
      return { ...med, score };
    })
    .sort((a, b) => b.score - a.score) // Sort by score descending
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
      (med.genericName && med.genericName.toLowerCase().includes(normalizedQuery)) ||
      (med.brandNames && med.brandNames.some(brand => 
        brand.toLowerCase().includes(normalizedQuery)
      ))
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
    (med.genericName && med.genericName.toLowerCase() === name.toLowerCase()) ||
    (med.brandNames && med.brandNames.some(brand => 
      brand.toLowerCase() === name.toLowerCase()
    ))
  );
}