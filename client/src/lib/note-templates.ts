export const noteTemplates = [
  {
    id: "blank-note",
    name: "Blank Note",
    type: "blank",
    description: "A blank note with a single large text area for free-form documentation",
    sections: [
      {
        id: "content",
        name: "Content",
        type: "textarea",
        required: false
      }
    ]
  },
  {
    id: "radiology-report",
    name: "Radiology/Imaging Report",
    type: "radiology",
    description: "Template for documenting radiology and imaging findings",
    sections: [
      {
        id: "clinical-history",
        name: "Clinical History",
        type: "clinicalHistory",
        required: true
      },
      {
        id: "technique",
        name: "Technique",
        type: "technique",
        required: true
      },
      {
        id: "imaging-findings",
        name: "Imaging Findings",
        type: "imaging",
        required: true
      },
      {
        id: "impression",
        name: "Impression",
        type: "impression",
        required: true
      }
    ]
  },
  {
    id: "admission-template",
    name: "Admission Note",
    type: "admission",
    isDefault: true,
    sections: [
      { id: "reason", name: "Reason for Admission", type: "textarea", required: true },
      { id: "hpi", name: "History of Present Illness", type: "textarea", required: true },
      { id: "pmh", name: "Past Medical History", type: "textarea", required: false },
      { id: "allergies", name: "Allergies", type: "textarea", required: true },
      { id: "social", name: "Social History", type: "textarea", required: false },
      { id: "medications", name: "Medications", type: "textarea", required: true },
      { id: "physical", name: "Physical Exam", type: "textarea", required: true },
      { id: "labs", name: "Labs", type: "textarea", required: false },
      { id: "imaging", name: "Imaging", type: "textarea", required: false },
      { id: "impression", name: "Impression", type: "textarea", required: true },
      { id: "plan", name: "Plan", type: "textarea", required: true }
    ]
  },
  {
    id: "progress-template",
    name: "Progress Note",
    type: "progress",
    isDefault: true,
    sections: [
      { id: "evolution", name: "Evolution", type: "textarea", required: true },
      { id: "physical", name: "Physical Exam", type: "textarea", required: true },
      { id: "labs", name: "Labs", type: "textarea", required: false },
      { id: "imaging", name: "Imaging", type: "textarea", required: false },
      { id: "impression", name: "Impression", type: "textarea", required: true },
      { id: "plan", name: "Plan", type: "textarea", required: true }
    ]
  },
  {
    id: "consult-template",
    name: "Consult Note",
    type: "consult",
    isDefault: true,
    sections: [
      { id: "reason", name: "Reason for Consultation", type: "textarea", required: true },
      { id: "hpi", name: "History of Present Illness", type: "textarea", required: true },
      { id: "pmh", name: "Past Medical History", type: "textarea", required: false },
      { id: "allergies", name: "Allergies", type: "textarea", required: true },
      { id: "social", name: "Social History", type: "textarea", required: false },
      { id: "medications", name: "Medications", type: "textarea", required: true },
      { id: "physical", name: "Physical Exam", type: "textarea", required: true },
      { id: "labs", name: "Labs", type: "textarea", required: false },
      { id: "imaging", name: "Imaging", type: "textarea", required: false },
      { id: "impression", name: "Impression", type: "textarea", required: true },
      { id: "plan", name: "Plan", type: "textarea", required: true }
    ]
  }
];
