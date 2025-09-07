import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRunList } from "@/hooks/use-run-list";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Copy, ChevronDown, ChevronUp, ArrowUp, ArrowDown, Mic, Bot, Settings as SettingsIcon } from "lucide-react";
import { useDictation } from "@/hooks/useDictation";
import { isRunListDictationV2Enabled, isRunListDictationDebugEnabled } from "@/lib/flags";
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function statusBadge(status?: string) {
  if (!status) return null;
  const s = status.toLowerCase();
  if (s === 'preround') return <Badge variant="secondary">Pre</Badge>;
  if (s === 'postround') return <Badge variant="secondary">Post</Badge>;
  if (s === 'complete') return <Badge>Done</Badge>;
  return <Badge variant="outline">Draft</Badge>;
}

export function RunListView() {
  const RUNLIST_DICTATION_V2 = isRunListDictationV2Enabled();
  const RUNLIST_DEBUG = isRunListDictationDebugEnabled();
  const { data, isLoading, addPatient, reorderPatients, updatePatient, archivePatient, saveNote, refetch, updateRunListMode } = useRunList({ carryForward: false, autoclone: false });
  const { toast } = useToast();
  const runList = data?.runList;
  const patients = data?.patients || [];

  const [localNotes, setLocalNotes] = useState<Record<string, string>>({}); // listPatientId -> text
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [editingAlias, setEditingAlias] = useState<Record<string, string>>({});
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const localNotesRef = useRef<Record<string, string>>({});
  const [dirtyMap, setDirtyMap] = useState<Record<string, boolean>>({});
  const prevLocalNotesRef = useRef<Record<string, string>>({});

  // AI dictation state
  const { isListening, finalTranscript, interimTranscript, startDictation, stopDictation, sessionId, audioLevel } = useDictation();
  const [aiRecordingFor, setAiRecordingFor] = useState<string | null>(null);
  const [aiProcessingFor, setAiProcessingFor] = useState<string | null>(null);
  const [liveDictatingFor, setLiveDictatingFor] = useState<string | null>(null);
  const lastInterimRef = useRef<string>('');
  const lastSessionRef = useRef<string>('');
  const lastCaretPosRef = useRef<number | null>(null);
  const bufferTimeoutRef = useRef<any>(null);
  const isBufferingRef = useRef<boolean>(false);
  const isSwitchingRef = useRef<boolean>(false);

  // Helper function to capture current DOM state and sync to React state
  const captureAndSyncTextareaState = useCallback((textarea: HTMLTextAreaElement | null = null) => {
    if (!RUNLIST_DICTATION_V2) return;
    
    // If no specific textarea provided, try to find the currently active one
    const targetTextarea = textarea || document.activeElement as HTMLTextAreaElement;
    if (!targetTextarea || targetTextarea.tagName !== 'TEXTAREA') return;
    
    const listPatientId = (targetTextarea as any).dataset?.listPatientId;
    if (!listPatientId) return;
    
    const currentDOMValue = targetTextarea.value || '';
    const currentStateValue = localNotesRef.current[listPatientId] || '';
    
    // Only update if DOM value differs from React state
    if (currentDOMValue !== currentStateValue) {
      if (RUNLIST_DEBUG) {
        console.debug('[runlist] captureAndSyncTextareaState', {
          listPatientId,
          fromState: currentStateValue.length,
          fromDOM: currentDOMValue.length,
          sample: currentDOMValue.slice(0, 40)
        });
      }
      
      // Update React state and refs immediately
      setLocalNotes(prev => ({ ...prev, [listPatientId]: currentDOMValue }));
      localNotesRef.current = { ...localNotesRef.current, [listPatientId]: currentDOMValue };
      setDirtyMap(prev => ({ ...prev, [listPatientId]: true }));
      localStorage.setItem(`runlist_note_draft_${listPatientId}`, currentDOMValue);
    }
  }, [RUNLIST_DICTATION_V2, RUNLIST_DEBUG]);

  // Insert or update text at current caret position inside the active textarea
const insertTextAtCaret = useCallback((rawText: string, isInterim: boolean, session: string) => {
    if (!RUNLIST_DICTATION_V2) return;
    const activeEl = document.activeElement as HTMLTextAreaElement | HTMLInputElement | null;
    if (!activeEl || (activeEl.tagName !== 'TEXTAREA' && activeEl.tagName !== 'INPUT')) return;

    try {
      const input = activeEl as HTMLTextAreaElement;
      let start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      let value = input.value;

      // If caret moved since last insert, treat previous interim as committed
      if (isInterim) {
        if (lastCaretPosRef.current != null && lastCaretPosRef.current !== start) {
          lastInterimRef.current = '';
        }
      }

      // Remove previous interim only if we are in the same session and caret hasn't moved relative to last insert
      const canReplaceInterim = !!lastInterimRef.current && isInterim && lastSessionRef.current === session && lastCaretPosRef.current != null && lastCaretPosRef.current === start;

      // Compute the slice to remove if replacing interim
      let beforeSliceEnd = start;
      if (canReplaceInterim) {
        beforeSliceEnd = Math.max(0, start - lastInterimRef.current.length);
      }

      const before = value.substring(0, beforeSliceEnd);
      const after = value.substring(end);

      // Avoid word concatenation: add leading space if needed
      const needsLeadingSpace = before.length > 0 && !/\s$/.test(before) && rawText && !/^\s|^[\.,;:!?\)]/.test(rawText);
      const text = (needsLeadingSpace ? ' ' : '') + rawText;

      const newValue = before + text + after;
      input.value = newValue;
      const pos = Math.min((before + text).length, newValue.length);
      input.setSelectionRange(pos, pos);

      if (isInterim) {
        lastInterimRef.current = text;
        lastSessionRef.current = session;
      } else {
        // Final replaces any interim at caret; clear interim tracking
        lastInterimRef.current = '';
        lastSessionRef.current = session;
      }
      lastCaretPosRef.current = pos;

      // trigger React onChange
      const evt = new Event('input', { bubbles: true });
      input.dispatchEvent(evt);
      
      // CRITICAL: Immediately sync DOM changes to React state to prevent loss
      const listPatientId = (input as any).dataset?.listPatientId;
      if (listPatientId) {
        localNotesRef.current = { ...localNotesRef.current, [listPatientId]: newValue };
        setLocalNotes(prev => ({ ...prev, [listPatientId]: newValue }));
      }
    } catch {}
  }, [RUNLIST_DICTATION_V2]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Debounce timers per patient
  const timersRef = useRef<Record<string, any>>({});

  // Initialize local state when data loads
  useEffect(() => {
    if (!patients.length) return;
    setLocalNotes((prev) => {
      const next: Record<string, string> = { ...prev };
      for (const p of patients) {
        const lid = p.note?.listPatientId || p.id; // fallback
        const serverText = p.note?.rawText || '';
        if (!(lid in next)) {
          // try restoring from localStorage if server is empty
          const cacheKey = `runlist_note_draft_${lid}`;
          const cached = localStorage.getItem(cacheKey);
          next[lid] = serverText || cached || '';
        }
      }
      return next;
    });
    // initialize dirty flags for loaded patients as not dirty
    setDirtyMap((prev) => {
      const next: Record<string, boolean> = { ...prev };
      for (const p of patients) {
        const lid = p.note?.listPatientId || p.id;
        if (!(lid in next)) next[lid] = false;
      }
      return next;
    });
    if (!selectedPatientId && patients[0]) setSelectedPatientId(patients[0].id);
  }, [patients.length]);

  // Keep a ref of latest localNotes for beforeunload persistence
  useEffect(() => { localNotesRef.current = localNotes; }, [localNotes]);
  
  // CRITICAL: Periodic backup of all textarea states to prevent any possible loss
  useEffect(() => {
    const interval = setInterval(() => {
      // Capture state from all visible textareas
      const textareas = document.querySelectorAll('textarea[data-list-patient-id]') as NodeListOf<HTMLTextAreaElement>;
      let syncedCount = 0;
      
      textareas.forEach(textarea => {
        const listPatientId = textarea.dataset.listPatientId;
        if (!listPatientId) return;
        
        const currentDOMValue = textarea.value || '';
        const currentStateValue = localNotesRef.current[listPatientId] || '';
        
        if (currentDOMValue !== currentStateValue) {
          // Silently sync without triggering React updates if values differ
          localNotesRef.current = { ...localNotesRef.current, [listPatientId]: currentDOMValue };
          localStorage.setItem(`runlist_note_draft_${listPatientId}`, currentDOMValue);
          syncedCount++;
          
          if (RUNLIST_DEBUG) {
            console.debug('[runlist] periodic backup sync', {
              listPatientId,
              stateLen: currentStateValue.length,
              domLen: currentDOMValue.length
            });
          }
        }
      });
      
      if (syncedCount > 0 && RUNLIST_DEBUG) {
        console.debug(`[runlist] periodic backup: synced ${syncedCount} textareas`);
      }
    }, 2000); // Every 2 seconds
    
    return () => clearInterval(interval);
  }, [RUNLIST_DEBUG]);

  // Debug: log localNotes diffs (value length changes per patient)
  useEffect(() => {
    if (!RUNLIST_DEBUG) return;
    const prev = prevLocalNotesRef.current || {};
    for (const [id, val] of Object.entries(localNotes)) {
      const p = prev[id];
      if (p !== val) {
        console.debug('[runlist] localNotes change', { listPatientId: id, from: (p||'').length, to: (val||'').length, sample: String(val||'').slice(0, 40) });
      }
    }
    prevLocalNotesRef.current = localNotes;
  }, [localNotes, RUNLIST_DEBUG]);
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Persist drafts
      const entries = Object.entries(localNotesRef.current || {});
      for (const [lid, value] of entries) {
        try { localStorage.setItem(`runlist_note_draft_${lid}`, value || ''); } catch {}
      }
      // Warn if there are unsaved changes
      const hasDirty = Object.values(dirtyMap).some(Boolean);
      if (hasDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirtyMap]);

  const onAddPatient = async () => {
    if (!runList) return;
    const alias = prompt("Optional alias (PHI-safe)") || undefined;
    try {
      await addPatient({ runListId: runList.id, alias });
      toast({ title: "Patient added" });
    } catch {
      toast({ title: "Failed to add patient", variant: "destructive" });
    }
  };

  const onCopyNote = async (pId: string, label: string) => {
    const p = patients.find(x => x.id === pId);
    const text = (p?.note?.rawText || '').trim();
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `Copied: ${label}` });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const onCopyAll = async () => {
    const parts: string[] = [];
    patients.forEach((p, idx) => {
      const label = `#${idx + 1}${p.alias ? ` – ${p.alias}` : ''}`;
      const body = (p.note?.rawText || '').trim();
      parts.push(`${label}\n${'-'.repeat(label.length)}\n${body}\n`);
    });
    const text = parts.join("\n").trim();
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied all patients" });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const setNoteValue = (listPatientId: string, value: string) => {
    if (RUNLIST_DEBUG) console.debug('[runlist] setNoteValue', { listPatientId, len: value.length, sample: value.slice(0, 40) });
    setLocalNotes(prev => ({ ...prev, [listPatientId]: value }));
    // CRITICAL: Always keep refs in sync
    localNotesRef.current = { ...localNotesRef.current, [listPatientId]: value };
    setDirtyMap(prev => ({ ...prev, [listPatientId]: true }));
    localStorage.setItem(`runlist_note_draft_${listPatientId}`, value);
  };

  const scheduleSave = (listPatientId: string) => {
    if (RUNLIST_DEBUG) console.debug('[runlist] scheduleSave queued', { listPatientId });
    if (timersRef.current[listPatientId]) clearTimeout(timersRef.current[listPatientId]);
    timersRef.current[listPatientId] = setTimeout(async () => {
      const rawText = (localNotesRef.current?.[listPatientId] ?? '').toString();
      if (RUNLIST_DEBUG) console.debug('[runlist] scheduleSave firing', { listPatientId, len: rawText.length });
      try {
        await saveNote({ listPatientId, rawText });
        if (RUNLIST_DEBUG) console.debug('[runlist] scheduleSave success', { listPatientId });
        setDirtyMap(prev => ({ ...prev, [listPatientId]: false }));
      } catch (e) {
        if (RUNLIST_DEBUG) console.debug('[runlist] scheduleSave error', { listPatientId, e });
      }
    }, 800);
  };

  const immediateSaveByListPatientId = useCallback(async (listPatientId: string) => {
    try {
      const ta = document.querySelector(`textarea[data-list-patient-id=\"${listPatientId}\"]`) as HTMLTextAreaElement | null;
      const rawText = (localNotesRef.current?.[listPatientId] ?? ta?.value ?? '').toString();
      const p = patients.find(x => (x.note?.listPatientId || x.id) === listPatientId);
      const expectedUpdatedAt = p?.note?.updatedAt;
      if (RUNLIST_DEBUG) console.debug('[runlist] immediateSave start', { listPatientId, len: rawText.length });
      await saveNote({ listPatientId, rawText, ...(expectedUpdatedAt ? { expectedUpdatedAt } as any : {}) });
      if (RUNLIST_DEBUG) console.debug('[runlist] immediateSave success', { listPatientId });
      setDirtyMap(prev => ({ ...prev, [listPatientId]: false }));
    } catch (e: any) {
      if (RUNLIST_DEBUG) console.debug('[runlist] immediateSave error', { listPatientId, e });
      if (e?.status === 409) {
        toast({ title: 'Conflict: note changed elsewhere. Refreshed.', variant: 'destructive' });
        refetch();
      }
    }
  }, [patients, saveNote, toast, refetch]);

  // Removed onBlur saves per request

  const onReorder = async (fromIdx: number, toIdx: number) => {
    if (!runList) return;
    if (fromIdx < 0 || toIdx < 0 || fromIdx >= patients.length || toIdx >= patients.length) return;
    const order = [...patients].map(p => p.id);
    const [moved] = order.splice(fromIdx, 1);
    order.splice(toIdx, 0, moved);
    try {
      await reorderPatients({ runListId: runList.id, order });
    } catch {
      toast({ title: "Reorder failed", variant: "destructive" });
    }
  };

  // Keyboard navigation: Cmd/Ctrl + Up/Down to move selection
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      const idx = patients.findIndex(p => p.id === selectedPatientId);
      if (idx < 0) return;
      e.preventDefault();
      const nextIdx = e.key === 'ArrowUp' ? Math.max(0, idx - 1) : Math.min(patients.length - 1, idx + 1);
      const next = patients[nextIdx];
      if (next) {
        setSelectedPatientId(next.id);
        const el = document.getElementById(`patientCard-${next.id}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
  }, [patients, selectedPatientId]);

  const patientLabel = (idx: number, alias?: string | null) => `#${idx + 1}${alias ? ` – ${alias}` : ''}`;

  function phiAliasWarning(s: string): string | null {
    const v = (s || '').trim();
    if (!v) return null;
    // Likely First Last: two words with initial capitals, length>3
    if (/^[A-Z][a-z]+\s+[A-Z][a-z]+$/.test(v)) return 'Alias looks like a person\'s full name. Consider a PHI-safe alias.';
    // Long digit sequences (>=8)
    if (/\d{8,}/.test(v)) return 'Alias contains a long digit sequence (MRN-like). Consider a PHI-safe alias.';
    // Common patterns like Last, First
    if (/^[A-Z][a-z]+,\s*[A-Z][a-z]+$/.test(v)) return 'Alias resembles a full name. Consider a PHI-safe alias.';
    return null;
  }

  // DnD sensors
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (!runList) return;
    const ids = patients.map(p => p.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = arrayMove(ids, oldIndex, newIndex);
    try {
      await reorderPatients({ runListId: runList.id, order: newOrder });
    } catch {
      toast({ title: 'Reorder failed', variant: 'destructive' });
    }
  };

  function SortablePatientItem({ id, idx, label, status, selected, onSelect }: { id: string; idx: number; label: string; status?: string; selected: boolean; onSelect: () => void; }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.6 : 1,
      cursor: 'grab'
    };
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <button
          onClick={onSelect}
          className={`w-full text-left px-2 py-2 rounded border ${selected ? 'bg-[color:var(--brand-50)] dark:bg-blue-900/40 border-[color:var(--brand-200)]' : 'bg-white/60 dark:bg-gray-800/60 border-slate-200 dark:border-gray-700'}`}
        >
          <div className="flex items-center justify-between">
            <span className="truncate text-sm">{label}</span>
            <span className="ml-2">{statusBadge(status)}</span>
          </div>
        </button>
      </div>
    );
  }

  // Day-start modal state
  const [showStartModal, setShowStartModal] = useState(false);
  const [startStrategy, setStartStrategy] = useState<'none' | 'selected' | 'all'>('selected');
  const [cfDefaults, setCfDefaults] = useState<{ [k: string]: boolean }>({});
  const [isCloning, setIsCloning] = useState(false);

  // Settings dialog state
  const [showSettings, setShowSettings] = useState(false);

  // Fetch existing carry-forward defaults
  const fetchCFDefaults = useCallback(async () => {
    if (!runList) return;
    try {
      const resp = await fetch(`/api/run-list/${runList.id}/carry-forward`);
      if (resp.ok) {
        const json = await resp.json();
        setCfDefaults(json?.carryForwardDefaults || {});
      }
    } catch {}
  }, [runList?.id]);

  useEffect(() => { fetchCFDefaults(); }, [fetchCFDefaults]);

  // Show day-start modal when no patients and not previously started today
  useEffect(() => {
    if (!runList) return;
    const dayKey = new Date(String((runList as any).day)).toISOString().slice(0, 10);
    const startedFlag = localStorage.getItem(`runlist_started_${dayKey}`);
    if ((patients?.length || 0) === 0 && !startedFlag) {
      setShowStartModal(true);
    }
  }, [runList?.id, patients.length]);

  // Keep a local settings-mode mirror for settings dialog
  const [settingsMode, setSettingsMode] = useState<'prepost' | 'full'>('prepost');
  useEffect(() => {
    const m = (data?.runList?.mode || 'prepost') as 'prepost' | 'full';
    setSettingsMode(m);
  }, [data?.runList?.mode]);

  const handleConfirmStart = async () => {
    if (!runList) return;
    const dayKey = new Date(String((runList as any).day)).toISOString().slice(0, 10);
    try {
      setIsCloning(true);
      // Save defaults first
      await fetch(`/api/run-list/${runList.id}/carry-forward`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carryForwardDefaults: cfDefaults })
      });

      if (startStrategy === 'none') {
        // Do not clone; mark started
        localStorage.setItem(`runlist_started_${dayKey}`, '1');
        setShowStartModal(false);
        return;
      }

      const res = await fetch(`/api/run-list/${runList.id}/clone-from-previous?strategy=${encodeURIComponent(startStrategy)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carryForwardDefaults: cfDefaults })
      });
      if (!res.ok) {
        if (res.status === 404) {
          // No previous day; proceed empty
          setShowStartModal(false);
          localStorage.setItem(`runlist_started_${dayKey}`, '1');
          toast({ title: 'No previous list found, started empty' });
          return;
        }
        throw new Error('Clone failed');
      }
      await refetch();
      setShowStartModal(false);
      localStorage.setItem(`runlist_started_${dayKey}`, '1');
      toast({ title: 'Today\'s list initialized' });
    } catch (e) {
      toast({ title: 'Failed to initialize today\'s list', variant: 'destructive' });
    } finally {
      setIsCloning(false);
    }
  };

  // Helper: upload blob for transcription; fallback to streaming transcript if server not configured
  const transcribeBlob = async (blob: Blob): Promise<string> => {
    try {
      const res = await fetch('/api/transcribe?mime=' + encodeURIComponent(blob.type || 'application/octet-stream'), {
        method: 'POST',
        headers: { 'Content-Type': blob.type || 'application/octet-stream' },
        body: blob
      });
      if (res.ok) {
        const json = await res.json();
        return String(json?.text || '').trim();
      }
    } catch {}
    // Fallback: use finalTranscript from streaming if available
    return String(finalTranscript || '').trim();
  };

  const startAiRecording = async (patientId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 48000, channelCount: 1 } });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        chunksRef.current = [];
        try {
          const p = patients.find(x => x.id === patientId);
          if (!p) return;
          const listPatientId = p.note?.listPatientId || p.id;
          setAiProcessingFor(patientId);
          const transcript = await transcribeBlob(blob);
          const mode = (data?.runList?.mode || 'prepost') as 'prepost' | 'full';
          const res = await fetch('/api/run-list/ai/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ listPatientId, transcript, mode })
          });
          if (!res.ok) throw new Error('AI generation failed');
          const json = await res.json();
          const updatedText = json?.note?.rawText || '';
          if (updatedText) {
            setNoteValue(listPatientId, updatedText);
            const p = patients.find(x => (x.note?.listPatientId || x.id) === listPatientId);
            const expectedUpdatedAt = p?.note?.updatedAt;
            await saveNote({ listPatientId, rawText: updatedText, ...(expectedUpdatedAt ? { expectedUpdatedAt } as any : {}) });
            toast({ title: 'AI note updated' });
          }
        } catch (e) {
          toast({ title: 'AI generation failed', variant: 'destructive' });
        } finally {
          setAiProcessingFor(null);
          if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
          mediaRecorderRef.current = null;
        }
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setAiRecordingFor(patientId);
    } catch (e) {
      toast({ title: 'Mic access denied', variant: 'destructive' });
    }
  };

  const stopAiRecording = () => {
    try { mediaRecorderRef.current?.stop(); } catch {}
    setAiRecordingFor(null);
  };

  // Alt press-to-talk: start live dictation on keydown, stop on keyup for selected patient
useEffect(() => {
    if (!RUNLIST_DICTATION_V2) return;
    const down = async (e: KeyboardEvent) => {
      if (e.key !== 'Alt') return;
      if (liveDictatingFor || aiRecordingFor || aiProcessingFor) return;
      // Only trigger when a run-list textarea has focus (reduce accidental starts)
      const ae = document.activeElement as HTMLElement | null;
      if (!ae || ae.tagName !== 'TEXTAREA') {
        toast({ title: 'No note selected', description: 'Click into a patient\'s note before dictating.', variant: 'destructive' });
        return;
      }
      const lpId = (ae as any).dataset?.listPatientId || null;
      if (!lpId) {
        toast({ title: 'No note selected', description: 'Click into a patient\'s note before dictating.', variant: 'destructive' });
        return;
      }
      try {
        if (RUNLIST_DEBUG) console.debug('[runlist] dictation start (Alt)', { lpId });
        await startDictation();
        setLiveDictatingFor(lpId);
        lastInterimRef.current = '';
        lastSessionRef.current = '';
      } catch {
        // Mic access denied or other error
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key !== 'Alt') return;
      if (liveDictatingFor && !isBufferingRef.current) {
        // Buffer briefly to allow finalization before stopping
        const prevLpId = liveDictatingFor;
        isBufferingRef.current = true;
        if (bufferTimeoutRef.current) clearTimeout(bufferTimeoutRef.current);
        bufferTimeoutRef.current = setTimeout(async () => {
          try { stopDictation(); } catch {}
          // Immediate save on finalization
          try { await immediateSaveByListPatientId(prevLpId); } catch {}
          if (RUNLIST_DEBUG) console.debug('[runlist] dictation finalize (Alt release)', { prevLpId });
          setLiveDictatingFor(null);
          // Clear interim tracking
          lastInterimRef.current = '';
          lastSessionRef.current = '';
          lastCaretPosRef.current = null;
          isBufferingRef.current = false;
        }, 1000);
      }
    };
    document.addEventListener('keydown', down, true);
    document.addEventListener('keyup', up, true);
    return () => {
      document.removeEventListener('keydown', down, true);
      document.removeEventListener('keyup', up, true);
    };
  }, [liveDictatingFor, aiRecordingFor, aiProcessingFor, selectedPatientId, startDictation, stopDictation, toast]);

  // Enhanced focus handling with text preservation
  useEffect(() => {
    const onFocusIn = async (e: any) => {
      if (!(e?.target instanceof HTMLElement)) return;
      const t = e.target as HTMLElement;
      if (t.tagName !== 'TEXTAREA') return;
      const newLpId = (t as any).dataset?.listPatientId as string | undefined;
      if (!RUNLIST_DICTATION_V2 || !newLpId) {
        // Even without dictation, capture state when switching between textareas
        captureAndSyncTextareaState(t as HTMLTextAreaElement);
        return;
      }
      
      // CRITICAL: Always capture and sync the previous textarea's state before switching
      if (liveDictatingFor && liveDictatingFor !== newLpId) {
        const prevTextarea = document.querySelector(`textarea[data-list-patient-id="${liveDictatingFor}"]`) as HTMLTextAreaElement;
        if (prevTextarea) {
          captureAndSyncTextareaState(prevTextarea);
        }
      }
      
      if (!liveDictatingFor || !isListening) return;
      if (newLpId === liveDictatingFor) return; // same target
      if (isSwitchingRef.current) return;

      isSwitchingRef.current = true;
      // Buffer for finalization, then stop and restart on new target
      isBufferingRef.current = true;
      const prevLpId = liveDictatingFor;
      if (bufferTimeoutRef.current) clearTimeout(bufferTimeoutRef.current);
      bufferTimeoutRef.current = setTimeout(async () => {
        try { stopDictation(); } catch {}
        // Immediate save on switch (previous box)
        if (prevLpId) { try { await immediateSaveByListPatientId(prevLpId); } catch {} }
        if (RUNLIST_DEBUG) console.debug('[runlist] dictation finalize-on-switch', { from: prevLpId, to: newLpId });
        // Clear interim tracking for previous box
        lastInterimRef.current = '';
        lastSessionRef.current = '';
        lastCaretPosRef.current = null;
        isBufferingRef.current = false;
        // Start dictation anew in the focused textarea
        try {
          await startDictation();
          setLiveDictatingFor(newLpId);
        } catch {}
        isSwitchingRef.current = false;
      }, 1000);
    };
    
    const onFocusOut = (e: any) => {
      if (!(e?.target instanceof HTMLElement)) return;
      const t = e.target as HTMLElement;
      if (t.tagName !== 'TEXTAREA') return;
      
      // CRITICAL: Always capture and sync state when leaving a textarea
      captureAndSyncTextareaState(t as HTMLTextAreaElement);
    };
    
    document.addEventListener('focusin', onFocusIn, true);
    document.addEventListener('focusout', onFocusOut, true);
    return () => {
      document.removeEventListener('focusin', onFocusIn, true);
      document.removeEventListener('focusout', onFocusOut, true);
    };
  }, [RUNLIST_DICTATION_V2, liveDictatingFor, isListening, startDictation, stopDictation, captureAndSyncTextareaState]);

  // This useEffect is now integrated into the enhanced focus handling above
  // Keeping this comment as a placeholder to maintain line numbers

  // Finalize when window loses focus or page is hidden
  useEffect(() => {
    const handleBlur = () => {
      if (!RUNLIST_DICTATION_V2) return;
      if (!liveDictatingFor || !isListening || isBufferingRef.current) return;
      isBufferingRef.current = true;
      const prevLpId = liveDictatingFor;
      if (bufferTimeoutRef.current) clearTimeout(bufferTimeoutRef.current);
      bufferTimeoutRef.current = setTimeout(async () => {
        try { stopDictation(); } catch {}
        if (prevLpId) { try { await immediateSaveByListPatientId(prevLpId); } catch {} }
        lastInterimRef.current = '';
        lastSessionRef.current = '';
        lastCaretPosRef.current = null;
        setLiveDictatingFor(null);
        isBufferingRef.current = false;
      }, 1000);
    };
    const handleVisibility = () => { if (document.hidden) handleBlur(); };
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [RUNLIST_DICTATION_V2, liveDictatingFor, isListening, stopDictation, immediateSaveByListPatientId]);

  // Integrate live dictation interim transcript (progressive/smooth)
useEffect(() => {
    if (!RUNLIST_DICTATION_V2) return;
    if (!RUNLIST_DICTATION_V2) return;
    if (!interimTranscript || !liveDictatingFor || !sessionId) return;
    // Ensure we are targeting the correct textarea
    const ae = document.activeElement as any;
    const activeLpId = ae?.dataset?.listPatientId;
    if (!activeLpId || activeLpId !== liveDictatingFor) return;

    const now = Date.now();
    const textChunk = interimTranscript + ' ';
    // Throttle interim insertions to keep UI responsive
    if (now - lastInterimInsertTsRef.current < INTERIM_INSERT_MIN_MS) {
      pendingInterimRef.current = textChunk;
      if (!pendingTimerRef.current) {
        pendingTimerRef.current = setTimeout(() => {
          const chunk = pendingInterimRef.current;
          pendingInterimRef.current = null;
          pendingTimerRef.current = null;
          if (chunk) insertTextAtCaret(chunk, true, sessionId);
          lastInterimInsertTsRef.current = Date.now();
        }, INTERIM_INSERT_MIN_MS - (now - lastInterimInsertTsRef.current));
      }
      return;
    }
    insertTextAtCaret(textChunk, true, sessionId);
    lastInterimInsertTsRef.current = now;
  }, [interimTranscript, liveDictatingFor, sessionId, insertTextAtCaret]);

  // Integrate live dictation final transcript (replace interim)
useEffect(() => {
    if (!RUNLIST_DICTATION_V2) return;
    if (!finalTranscript || !liveDictatingFor || !sessionId) return;
    // Ensure we are targeting the correct textarea
    const ae = document.activeElement as any;
    const activeLpId = ae?.dataset?.listPatientId;
    if (!activeLpId || activeLpId !== liveDictatingFor) return;

    // Flush any pending interim before final
    if (pendingTimerRef.current) { clearTimeout(pendingTimerRef.current); pendingTimerRef.current = null; }
    if (pendingInterimRef.current) {
      insertTextAtCaret(pendingInterimRef.current, true, sessionId);
      pendingInterimRef.current = null;
      lastInterimInsertTsRef.current = Date.now();
    }
    insertTextAtCaret(finalTranscript + ' ', false, sessionId);
    // Saving will be triggered by onChange due to dispatched input event
    lastInterimRef.current = '';
    lastSessionRef.current = '';
  }, [finalTranscript, liveDictatingFor, sessionId, insertTextAtCaret]);

  // Keyboard: add reordering with Cmd/Ctrl+Shift+Up/Down
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!patients.length) return;
      const idx = patients.findIndex(p => p.id === selectedPatientId);
      if (idx < 0) return;
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        const target = e.key === 'ArrowUp' ? Math.max(0, idx - 1) : Math.min(patients.length - 1, idx + 1);
        onReorder(idx, target);
        return;
      }
    };
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
  }, [patients, selectedPatientId]);

  // Dictation overlay positioning (Phase 5)
  const [overlayPos, setOverlayPos] = useState<{ x: number; y: number } | null>(null);
  const INTERIM_INSERT_MIN_MS = 120;
  const lastInterimInsertTsRef = useRef<number>(0);
  const pendingInterimRef = useRef<string | null>(null);
  const pendingTimerRef = useRef<any>(null);
  const getCaretPosition = useCallback(() => {
    const active = document.activeElement as HTMLElement | null;
    if (!active) return null;
    if (active.tagName === 'TEXTAREA') {
      const rect = active.getBoundingClientRect();
      return { x: rect.left, y: rect.top - 80 };
    }
    return null;
  }, []);
  useEffect(() => {
    if (!RUNLIST_DICTATION_V2) return;
    if (!isListening && !isBufferingRef.current) {
      setOverlayPos(null);
      return;
    }
    const update = () => {
      const p = getCaretPosition();
      if (p) setOverlayPos(p);
    };
    update();
    const id = setInterval(update, 120);
    return () => clearInterval(id);
  }, [RUNLIST_DICTATION_V2, isListening, getCaretPosition]);

  return (
    <div className="flex-1 flex overflow-hidden">
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center"><div>Loading run list…</div></div>
      ) : (
        <>
      {/* Left patients sidebar */}
      <div className="w-64 border-r border-slate-200 dark:border-gray-800 p-3 space-y-2 bg-white/70 dark:bg-gray-900/70">
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium">Run the list</div>
          <Button size="sm" onClick={onAddPatient}><Plus className="w-4 h-4" /></Button>
        </div>
        <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={(patients || []).map(p => p.id)} strategy={verticalListSortingStrategy}>
              {(patients || []).map((p, idx) => (
                <SortablePatientItem
                  key={p.id}
                  id={p.id}
                  idx={idx}
                  label={patientLabel(idx, p.alias || null)}
                  status={p.note?.status}
                  selected={selectedPatientId === p.id}
                  onSelect={() => { setSelectedPatientId(p.id); document.getElementById(`patientCard-${p.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {/* Main content: all patient notes expanded */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">Patients ({patients.length})</div>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={async () => {
                const dirtyIds = Object.entries(dirtyMap).filter(([, v]) => v).map(([k]) => k);
                if (RUNLIST_DEBUG) console.debug('[runlist] saveAll clicked', { dirtyIds });
                let ok = 0, fail = 0;
                for (const lid of dirtyIds) {
                  try { await immediateSaveByListPatientId(lid); ok++; } catch { fail++; }
                }
                toast({ title: `Saved ${ok} note${ok!==1?'s':''}${fail?`, ${fail} failed`:''}` });
              }}
              title="Save all notes"
            >Save all</Button>
            <Button variant="outline" size="sm" onClick={() => { setShowSettings(true); fetchCFDefaults(); }} title="Carry-forward settings">
              <SettingsIcon className="w-4 h-4 mr-1" /> Settings
            </Button>
            <Button variant="outline" size="sm" onClick={onCopyAll}><Copy className="w-4 h-4 mr-1" /> Copy all</Button>
          </div>
        </div>

        {patients.map((p, idx) => {
          const listPatientId = p.note?.listPatientId || p.id;
          const text = localNotes[listPatientId] ?? (p.note?.rawText || '');
          const isCollapsed = collapsed[p.id] || false;
          const label = patientLabel(idx, p.alias || null);
          return (
            <div key={p.id} id={`patientCard-${p.id}`} className="bg-white/90 dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 shadow-sm">
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={async () => {
                      const willCollapse = !isCollapsed;
                      if (
                        RUNLIST_DICTATION_V2 &&
                        willCollapse &&
                        isListening &&
                        liveDictatingFor === listPatientId &&
                        !isBufferingRef.current
                      ) {
                        // CRITICAL: Capture text state before finalizing dictation and collapsing
                        const textarea = document.querySelector(`textarea[data-list-patient-id="${listPatientId}"]`) as HTMLTextAreaElement;
                        if (textarea) captureAndSyncTextareaState(textarea);
                        
                        // finalize current dictation before collapsing
                        isBufferingRef.current = true;
                        try {
                          await new Promise<void>((resolve) => {
                            if (bufferTimeoutRef.current) clearTimeout(bufferTimeoutRef.current);
                            bufferTimeoutRef.current = setTimeout(async () => {
                              try { stopDictation(); } catch {}
                              try { await immediateSaveByListPatientId(listPatientId); } catch {}
                              // Clear interim tracking
                              lastInterimRef.current = '';
                              lastSessionRef.current = '';
                              lastCaretPosRef.current = null;
                              isBufferingRef.current = false;
                              resolve();
                            }, 1000);
                          });
                        } catch {
                          isBufferingRef.current = false;
                        }
                      }
                      setCollapsed(prev => ({ ...prev, [p.id]: !isCollapsed }));
                    }}
                    className="text-gray-500 hover:text-gray-700"
                    title={isCollapsed ? 'Expand' : 'Collapse'}
                  >
                    {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                  <span className="font-medium truncate">{label}</span>
                  <span>{statusBadge(p.note?.status)}</span>
                  <select
                    value={(p.note?.status || 'draft')}
                    onChange={async (e) => {
                      const listPatientId = p.note?.listPatientId || p.id;
                      try {
                        await saveNote({ listPatientId, status: e.target.value });
                      } catch {}
                    }}
                    className="ml-2 h-7 text-xs border border-slate-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 px-1"
                    title="Set status"
                  >
                    <option value="draft">Draft</option>
                    <option value="preround">Pre</option>
                    <option value="postround">Post</option>
                    <option value="complete">Done</option>
                  </select>
                  <Input
                    value={editingAlias[p.id] ?? (p.alias || '')}
                    onChange={(e) => setEditingAlias(prev => ({ ...prev, [p.id]: e.target.value }))}
                    onBlur={async (e) => { 
                      const val = e.target.value || '';
                      const warn = phiAliasWarning(val);
                      if (warn) { toast({ title: warn, variant: 'destructive' }); }
                      try { await updatePatient({ patientId: p.id, alias: val || undefined }); } catch {}
                    }}
                    maxLength={16}
                    placeholder="Alias (optional)"
                    className="h-7 w-48 ml-2"
                  />
                </div>
                <div className="flex items-center gap-2">
                  {/* Live dictation: focus textarea and press Alt */}
                  <Button
variant={liveDictatingFor === listPatientId ? 'default' : 'ghost'}
                    size="sm"
                    title="Live dictation (Alt)"
                    onClick={async () => {
                      try {
if (!RUNLIST_DICTATION_V2) {
                          try {
                            if (isListening) {
                              stopDictation();
                            } else {
                              const ta = document.querySelector(`textarea[data-list-patient-id=\"${listPatientId}\"]`) as HTMLTextAreaElement | null;
                              if (ta) ta.focus();
                              await startDictation();
                            }
                          } catch {}
                          return;
                        }
                        if (liveDictatingFor === listPatientId) {
                          stopDictation();
                          // Immediate save when stopping via button
                          try { await immediateSaveByListPatientId(listPatientId); } catch {}
                          setLiveDictatingFor(null);
                          // Clear interim tracking
                          lastInterimRef.current = '';
                          lastSessionRef.current = '';
                          lastCaretPosRef.current = null;
                        } else {
                          // Focus this patient's textarea and start
                          const ta = document.querySelector(`textarea[data-list-patient-id="${listPatientId}"]`) as HTMLTextAreaElement | null;
                          if (ta) {
                            ta.focus();
                            const len = (ta.value || '').length;
                            try { ta.setSelectionRange(len, len); } catch {}
                          }
                          await startDictation();
                          setLiveDictatingFor(listPatientId);
                          lastInterimRef.current = '';
                          lastSessionRef.current = '';
                        }
                      } catch {}
                    }}
                  >
                    <Mic className="w-4 h-4 mr-1" />Live
                  </Button>
                  {/* AI dictation: start/stop recording then AI-merge */}
                  <Button
                    variant={aiRecordingFor === p.id ? 'default' : 'outline'}
                    size="sm"
                    title={aiRecordingFor === p.id ? 'Stop AI recording' : 'AI dictation (record, then generate)'}
                    onClick={async () => {
                      if (aiProcessingFor) return; // busy
                      if (aiRecordingFor === p.id) {
                        stopAiRecording();
                      } else if (!aiRecordingFor) {
                        await startAiRecording(p.id);
                      }
                    }}
                    disabled={!!aiProcessingFor && aiProcessingFor !== p.id}
                  >
                    <Bot className={`w-4 h-4 mr-1 ${aiProcessingFor === p.id ? 'animate-spin' : ''}`} />
                    {aiRecordingFor === p.id ? 'Stop' : aiProcessingFor === p.id ? 'Processing' : 'AI'}
                  </Button>
                  {/* Generate Full SOAP from current content */}
                  <Button
                    variant="outline"
                    size="sm"
                    title="Generate full SOAP"
                    onClick={async () => {
                      const listPatientId = p.note?.listPatientId || p.id;
                      try {
                        setAiProcessingFor(p.id);
                        const transcript = (localNotes[listPatientId] ?? p.note?.rawText ?? '').trim();
                        if (!transcript) { toast({ title: 'Nothing to generate from', variant: 'destructive' }); setAiProcessingFor(null); return; }
                        const res = await fetch('/api/run-list/ai/generate', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ listPatientId, transcript, mode: 'full' })
                        });
                        if (!res.ok) throw new Error('Generation failed');
                        const json = await res.json();
                        const updatedText = json?.note?.rawText || '';
                        if (updatedText) {
                          setNoteValue(listPatientId, updatedText);
                          const p0 = patients.find(x => (x.note?.listPatientId || x.id) === listPatientId);
                          const expectedUpdatedAt0 = p0?.note?.updatedAt;
                          await saveNote({ listPatientId, rawText: updatedText, ...(expectedUpdatedAt0 ? { expectedUpdatedAt: expectedUpdatedAt0 } as any : {}) });
                          toast({ title: 'Full SOAP updated' });
                        }
                      } catch {
                        toast({ title: 'Full SOAP failed', variant: 'destructive' });
                      } finally {
                        setAiProcessingFor(null);
                      }
                    }}
                  >Full</Button>
                  <Button variant="outline" size="sm" onClick={() => onCopyNote(p.id, label)}><Copy className="w-4 h-4" /></Button>
                  <div className="flex items-center gap-1 ml-2">
                    <Button variant="ghost" size="sm" onClick={() => onReorder(idx, Math.max(0, idx - 1))} title="Move up"><ArrowUp className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => onReorder(idx, Math.min(patients.length - 1, idx + 1))} title="Move down"><ArrowDown className="w-4 h-4" /></Button>
                  </div>
                  {/* Per-patient carry-forward overrides */}
                  <div className="relative">
                    <Button variant="ghost" size="sm" title="Carry-forward overrides" onClick={() => setCollapsed(prev => ({ ...prev, [p.id+':cf']: !prev[p.id+':cf'] }))}>CF</Button>
                    {collapsed[p.id+':cf'] && (
                      <div className="absolute right-0 mt-2 z-[10001] bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded p-3 shadow-lg w-72">
                        <div className="text-xs font-medium mb-2">Overrides for this patient</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {['subjective','objective','physical_exam','assessment','plan','labs','medications','allergies','imaging','active_orders'].map((k) => (
                            <label key={k} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={Boolean((p.carryForwardOverrides || {})[k])}
                                onChange={async (e) => { try { await updatePatient({ patientId: p.id, /* alias unchanged */ active: undefined as any, }); await fetch(`/api/run-list/patients/${p.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ carryForwardOverrides: { ...(p.carryForwardOverrides || {}), [k]: e.target.checked } }) }); toast({ title: 'Overrides saved' }); refetch(); } catch { toast({ title: 'Save failed', variant: 'destructive' }); } }}
                              />
                              <span className="capitalize">{k.replace('_',' ')}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Archive patient for today"
                    onClick={async () => {
                      try {
                        // CRITICAL: Capture text state before archiving
                        const textarea = document.querySelector(`textarea[data-list-patient-id="${listPatientId}"]`) as HTMLTextAreaElement;
                        if (textarea) captureAndSyncTextareaState(textarea);
                        
                        // If dictating for this patient, finalize and save before archive
                        if (RUNLIST_DICTATION_V2 && isListening && liveDictatingFor === listPatientId && !isBufferingRef.current) {
                          isBufferingRef.current = true;
                          await new Promise<void>((resolve) => {
                            if (bufferTimeoutRef.current) clearTimeout(bufferTimeoutRef.current);
                            bufferTimeoutRef.current = setTimeout(async () => {
                              try { stopDictation(); } catch {}
                              try { await immediateSaveByListPatientId(listPatientId); } catch {}
                              lastInterimRef.current = '';
                              lastSessionRef.current = '';
                              lastCaretPosRef.current = null;
                              setLiveDictatingFor(null);
                              isBufferingRef.current = false;
                              resolve();
                            }, 1000);
                          });
                        }
                        await archivePatient({ patientId: p.id });
                        toast({ title: 'Archived for today' });
                      } catch {
                        toast({ title: 'Archive failed', variant: 'destructive' });
                      }
                    }}
                  >Archive</Button>
                </div>
              </div>
              {!isCollapsed && (
                <div className="px-4 pb-4">
                  <textarea
                    value={text}
                    onChange={(e) => { 
                      const newValue = e.target.value;
                      setNoteValue(listPatientId, newValue); 
                      // Immediately sync to refs to prevent any loss
                      localNotesRef.current = { ...localNotesRef.current, [listPatientId]: newValue };
                      scheduleSave(listPatientId); 
                    }}
                    onInput={(e) => {
                      const currentValue = e.currentTarget.value ?? '';
                      // Immediately sync DOM value to refs on any input to prevent loss
                      localNotesRef.current = { ...localNotesRef.current, [listPatientId]: currentValue };
                      if (RUNLIST_DEBUG) {
                        console.debug('[runlist] textarea input', { listPatientId, len: currentValue.length, sample: currentValue.slice(0, 40) });
                      }
                    }}
                    onFocus={(e) => { 
                      // Sync current state when focusing
                      captureAndSyncTextareaState(e.currentTarget);
                      if (RUNLIST_DEBUG) console.debug('[runlist] textarea focus', { listPatientId }); 
                    }}
                    onBlur={(e) => { 
                      // CRITICAL: Always sync state when blurring to prevent any loss
                      captureAndSyncTextareaState(e.currentTarget);
                      if (RUNLIST_DEBUG) console.debug('[runlist] textarea blur', { listPatientId }); 
                    }}
                    onCompositionStart={() => { if (RUNLIST_DEBUG) console.debug('[runlist] composition start', { listPatientId }); }}
                    onCompositionUpdate={(e) => { if (RUNLIST_DEBUG) console.debug('[runlist] composition update', { listPatientId, data: (e as any).data }); }}
                    onCompositionEnd={() => { if (RUNLIST_DEBUG) console.debug('[runlist] composition end', { listPatientId }); }}
                    onKeyDown={(e) => {
                      // Prevent accidental form submits elsewhere if any, but keep newline in textarea
                      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                        e.preventDefault();
                        if (RUNLIST_DEBUG) console.debug('[runlist] prevented Cmd/Ctrl+Enter submit');
                      }
                    }}
                    className="w-full min-h-[180px] bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded p-3 text-sm"
                    placeholder="Progress note..."
                    data-testid={`textarea-patient-${p.id}`}
                    data-list-patient-id={listPatientId}
                  />
                </div>
              )}
            </div>
          );
        })}

        {patients.length === 0 && (
          <div className="text-sm text-gray-500">No patients yet. Click "+" to add one.</div>
        )}
      </div>
        </>
      )}
      {/* Start Today Modal */}
      {showStartModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[10000]">
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg shadow-xl w-full max-w-xl p-4">
            <div className="text-lg font-semibold mb-2">Start today&apos;s list</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">Choose how to carry forward from yesterday and set defaults.</div>

            <div className="mb-3">
              <div className="font-medium text-sm mb-1">Carry forward strategy</div>
              <div className="flex gap-2">
                <Button variant={startStrategy==='none'?'default':'outline'} size="sm" onClick={() => setStartStrategy('none')}>None</Button>
                <Button variant={startStrategy==='selected'?'default':'outline'} size="sm" onClick={() => setStartStrategy('selected')}>Selected</Button>
                <Button variant={startStrategy==='all'?'default':'outline'} size="sm" onClick={() => setStartStrategy('all')}>All</Button>
              </div>
            </div>

            <div className="mb-3">
              <div className="font-medium text-sm mb-1">Defaults (applied when using Selected)</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {['subjective','objective','physical_exam','assessment','plan','labs','medications','allergies','imaging','active_orders'].map((k) => (
                  <label key={k} className="flex items-center gap-2">
                    <input type="checkbox" checked={Boolean(cfDefaults[k])} onChange={(e) => setCfDefaults(prev => ({ ...prev, [k]: e.target.checked }))} />
                    <span className="capitalize">{k.replace('_',' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowStartModal(false)} disabled={isCloning}>Cancel</Button>
              <Button size="sm" onClick={handleConfirmStart} disabled={isCloning}>{isCloning ? 'Starting…' : 'Start'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Dictation overlay (visual parity) */}
      {RUNLIST_DICTATION_V2 && overlayPos && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{ left: `${overlayPos.x}px`, top: `${overlayPos.y}px` }}
        >
          <div className="absolute -top-2 -right-2 w-4 h-4">
            <div
              className="w-full h-full rounded-full transition-all duration-150 shadow-lg border-2 border-white/30"
              style={{
                backgroundColor: audioLevel > 30 ? '#10b981' : audioLevel > 10 ? '#f59e0b' : '#6b7280',
                transform: `scale(${Math.max(0.6, Math.min(1.4, (audioLevel || 0) / 60))})`
              }}
            />
          </div>
          <div className="flex items-center space-x-3 bg-gray-900/95 backdrop-blur-sm text-white px-4 py-3 rounded-xl shadow-2xl border border-gray-700/50">
            {isListening ? (
              <Mic className="w-5 h-5 animate-pulse text-green-400" />
            ) : (
              <Mic className="w-5 h-5 animate-spin text-yellow-400" />
            )}
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">
                {isListening ? '🎤 Listening…' : '⏳ Processing…'}
              </span>
              <span className="text-xs text-gray-300 font-medium">run-list</span>
            </div>
          </div>
        </div>
      )}
      {/* Settings Dialog */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[10000]">
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg shadow-xl w-full max-w-lg p-4">
            <div className="text-lg font-semibold mb-2">Carry-forward settings</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">Defaults apply to future cloning (Selected) and can be changed anytime.</div>
            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
              {['subjective','objective','physical_exam','assessment','plan','labs','medications','allergies','imaging','active_orders'].map((k) => (
                <label key={k} className="flex items-center gap-2">
                  <input type="checkbox" checked={Boolean(cfDefaults[k])} onChange={(e) => setCfDefaults(prev => ({ ...prev, [k]: e.target.checked }))} />
                  <span className="capitalize">{k.replace('_',' ')}</span>
                </label>
              ))}
            </div>
            <div className="mb-4">
              <div className="font-medium text-sm mb-1">Workflow mode</div>
              <div className="flex items-center gap-3 text-sm">
                <label className="flex items-center gap-2">
                  <input type="radio" name="mode" checked={settingsMode==='prepost'} onChange={() => setSettingsMode('prepost')} />
                  <span>Pre/Post</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="mode" checked={settingsMode==='full'} onChange={() => setSettingsMode('full')} />
                  <span>Full SOAP</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowSettings(false)}>Close</Button>
              <Button size="sm" onClick={async () => {
                if (!runList) return;
                await fetch(`/api/run-list/${runList.id}/carry-forward`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ carryForwardDefaults: cfDefaults }) });
                try { await updateRunListMode({ runListId: runList.id, mode: settingsMode }); } catch {}
                toast({ title: 'Settings saved' });
                setShowSettings(false);
              }}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

