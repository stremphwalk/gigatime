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
      "S1 normal, S2 normal",
      "S1 loud, S2 normal", 
      "S1 normal, S2 split",
      "Grade 2/6 systolic murmur",
      "Grade 3/6 systolic murmur",
      "PMI at 5th intercostal space, midclavicular line",
      "No jugular venous distension",
      "Peripheral pulses 2+ bilaterally",
      "No peripheral edema",
      "Capillary refill <2 seconds",
      "No carotid bruits",
      "S3 gallop present",
      "S4 gallop present"
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

// Comprehensive negative findings for all systems
export const COMPREHENSIVE_NEGATIVE_FINDINGS = `Constitutional: Well-appearing, alert, no acute distress, afebrile
HEENT: Normocephalic, atraumatic, PERRL, EOM intact, oropharynx clear, no lymphadenopathy
Cardiovascular: Regular rate and rhythm, S1 and S2 normal, no murmurs/rubs/gallops, no JVD, peripheral pulses 2+ bilaterally, no edema
Pulmonary: Clear to auscultation bilaterally, good air movement, no wheezes/rales/rhonchi, respirations unlabored
Abdominal: Soft, non-tender, non-distended, normal bowel sounds in all quadrants, no hepatosplenomegaly, no masses
Musculoskeletal: Full range of motion all joints, normal strength 5/5 throughout, no joint swelling or deformity, normal gait
Neurological: Alert and oriented x3, cranial nerves II-XII intact, motor strength 5/5 throughout, sensation intact, DTRs 2+ symmetric, no focal deficits
Skin: Warm, dry, intact, no rashes or lesions, good skin turgor, no cyanosis or pallor
Psychiatric: Appropriate mood and affect, no suicidal/homicidal ideation, thought process linear and goal-directed`;

export function searchPhysicalExamOptions(query: string): PhysicalExamOption[] {
  if (!query || query.trim().length === 0) return PHYSICAL_EXAM_OPTIONS;

  // Fuzzy score each finding and include only reasonably relevant ones
  const q = query.trim();
  const threshold = 0.8; // tune for category filtering (more strict)

  return PHYSICAL_EXAM_OPTIONS
    .map(category => {
      const scored = category.findings
        .map(f => ({ text: f, score: scorePhysicalExamMatch(q, f) }))
        .filter(s => s.score >= threshold)
        .sort((a, b) => b.score - a.score)
        .map(s => s.text);
      return { ...category, findings: scored } as PhysicalExamOption;
    })
    .filter(cat => cat.findings.length > 0);
}

export function getPhysicalExamSuggestions(query: string): string[] {
  if (!query || query.trim().length === 0) return [];

  const q = query.trim();
  const scored: Array<{ text: string; score: number }> = [];

  // Special: comprehensive normal when user hints at it
  const qn = normalize(q);
  if (qn.includes('normal') || qn.includes('negative') || qn.includes('unremarkable') || qn === 'neg') {
    scored.push({ text: COMPREHENSIVE_NEGATIVE_FINDINGS, score: 10 });
  }

  // Score all findings
  for (const category of PHYSICAL_EXAM_OPTIONS) {
    for (const f of category.findings) {
      const s = scorePhysicalExamMatch(q, f);
      if (s > 0) scored.push({ text: f, score: s });
    }
  }
  // Score quick phrases
  for (const phrase of QUICK_PHYSICAL_EXAM_PHRASES) {
    const s = scorePhysicalExamMatch(q, phrase);
    if (s > 0) scored.push({ text: phrase, score: s + 0.2 }); // slight boost for templates
  }

  // Sort by score desc, dedupe preserving highest score
  const byText = new Map<string, number>();
  for (const item of scored) {
    const prev = byText.get(item.text) ?? -Infinity;
    if (item.score > prev) byText.set(item.text, item.score);
  }
  const sorted = Array.from(byText.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([text]) => text);

  return sorted.slice(0, 12);
}

// ---------- Fuzzy matching utils ----------

const ABBREV_EXPANSIONS: Record<string, string[]> = {
  // General
  'a&o': ['alert and oriented', 'oriented x3'],
  'ao': ['alert and oriented'],
  'aox3': ['alert and oriented x3'],
  'oriented x3': ['alert and oriented x3'],
  // HEENT / Neuro
  'perrl': ['pupils equal round reactive to light'],
  'perrla': ['pupils equal round reactive to light and accommodation', 'pupils equal round reactive to light'],
  'eomi': ['extraocular movements intact'],
  // Cardio / Pulm
  'rrr': ['regular rate and rhythm'],
  'mrg': ['murmurs rubs gallops'],
  'no m/r/g': ['no murmurs no rubs no gallops'],
  'jvd': ['jugular venous distension'],
  'cta': ['clear to auscultation'],
  'ra': ['room air'],
  // Abdomen
  'nt': ['non tender', 'non-tender'],
  'nd': ['non distended', 'non-distended'],
  'nt/nd': ['non-tender non-distended', 'non tender non distended'],
  // MSK
  'rom': ['range of motion'],
  // Reflexes
  'dtr': ['deep tendon reflex'],
  'dtrs': ['deep tendon reflexes'],
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s\/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(s: string): string[] {
  return normalize(s).split(/\s+|\//).filter(Boolean);
}

function expandQueryTokens(tokens: string[]): string[] {
  const expanded: string[] = [...tokens];
  for (const t of tokens) {
    if (ABBREV_EXPANSIONS[t]) {
      for (const phrase of ABBREV_EXPANSIONS[t]) {
        expanded.push(...tokenize(phrase));
      }
    }
  }
  return Array.from(new Set(expanded));
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

function scorePhysicalExamMatch(query: string, candidate: string): number {
  const qn = normalize(query);
  const cn = normalize(candidate);
  if (!qn || !cn) return 0;

  // Immediate strong matches
  if (cn.includes(qn)) return 5; // direct substring

  const qTokens = expandQueryTokens(tokenize(query));
  const cTokens = tokenize(candidate);

  // Build token sets for quick lookups
  const cSet = new Set(cTokens);

  let score = 0;

  // Token overlap and prefixes
  for (const qt of qTokens) {
    if (cSet.has(qt)) {
      score += 1.2; // exact token present
      continue;
    }
    // prefix match
    const prefixHit = cTokens.some(ct => ct.startsWith(qt) && qt.length >= 2);
    if (prefixHit) score += 0.8;

    // small typo tolerance for longer tokens
    if (qt.length >= 4) {
      const typoHit = cTokens.some(ct => Math.min(ct.length, qt.length) >= 4 && levenshtein(ct, qt) <= 1);
      if (typoHit) score += 0.6;
    }
  }

  // Abbreviation phrase presence boost: if any expansion full phrase tokens are mostly present
  for (const [abbr, phrases] of Object.entries(ABBREV_EXPANSIONS)) {
    if (qn.includes(abbr)) {
      for (const p of phrases) {
        const pTokens = tokenize(p);
        const present = pTokens.filter(t => cSet.has(t)).length / pTokens.length;
        if (present >= 0.6) score += 1.5;
      }
    }
  }

  // Category-specific hints: if query mentions a category name and candidate belongs
  // This boost is handled by calling context; optional small bonus for keywords
  const categoryHints = ['cardio', 'cardiovascular', 'pulm', 'pulmonary', 'neuro', 'heent', 'abd', 'abdominal', 'msk', 'skin', 'psych'];
  if (categoryHints.some(h => qn.includes(h))) score += 0.2;

  // Normalize by number of query tokens to avoid long queries dominating
  const norm = Math.max(1, qTokens.length);
  const final = score / norm;
  return final;
}

// Exporting for potential external reuse/tests if needed
export { scorePhysicalExamMatch };
