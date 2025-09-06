// Centralized client-side prompt references (future-ready for additional sections)
// Not used by runtime models (server owns system prompts). Useful for UI/help text.

export const MEDICATIONS_PROMPT_SUMMARY = `
Convert dictated medications into a clean, standardized, newline-delimited list.
Output only the list. No bullets or commentary. One medication per line.
Normalize units (mg, mcg, g, mL, IU, puff[s]), routes (PO, IV, SC, IM, SL, inhaled, PR, IN),
and frequencies (OD, BID, TID, QID, PRN, q4h, q6h, q8h, q12h, qHS, qAM). If unsure, omit.
`;

