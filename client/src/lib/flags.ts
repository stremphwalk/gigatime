export function isRunListDictationV2Enabled(): boolean {
  // Enable with: VITE_RUNLIST_DICTATION_V2=1
  const raw = (import.meta as any)?.env?.VITE_RUNLIST_DICTATION_V2 ?? '0';
  return String(raw) === '1' || String(raw).toLowerCase() === 'true';
}

export function isRunListDictationDebugEnabled(): boolean {
  // Enable with: VITE_RUNLIST_DICTATION_DEBUG=1
  const raw = (import.meta as any)?.env?.VITE_RUNLIST_DICTATION_DEBUG ?? '0';
  return String(raw) === '1' || String(raw).toLowerCase() === 'true';
}

