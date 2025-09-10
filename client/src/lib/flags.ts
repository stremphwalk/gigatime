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

export function isRunListPillsEnabled(): boolean {
  // Enable with: VITE_RUNLIST_PILLS=1
  const raw = (import.meta as any)?.env?.VITE_RUNLIST_PILLS ?? '1';
  return String(raw) === '1' || String(raw).toLowerCase() === 'true';
}

export function isUnifiedSmartPhraseOverlayEnabled(): boolean {
  // Priority: localStorage override -> env var -> dev default
  try {
    const ls = typeof window !== 'undefined' ? window.localStorage?.getItem('arinote-unified-overlay') : null;
    if (ls != null) {
      return String(ls) === '1' || String(ls).toLowerCase() === 'true';
    }
  } catch {}
  const envRaw = (import.meta as any)?.env?.VITE_UNIFIED_SMART_OVERLAY ?? undefined;
  if (envRaw !== undefined) {
    return String(envRaw) === '1' || String(envRaw).toLowerCase() === 'true';
  }
  // Default: enable in dev, disable in prod
  const isDev = Boolean((import.meta as any)?.env?.DEV);
  return isDev;
}

