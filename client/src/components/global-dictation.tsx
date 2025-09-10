import { useEffect, useState, useRef, useCallback } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useDictation } from '@/hooks/useDictation';

interface CaretPosition {
  x: number;
  y: number;
  element: HTMLElement | null;
}

// Per-session anchor to support late finals
interface SessionAnchor {
  element: HTMLInputElement | HTMLTextAreaElement | HTMLElement | null;
  type: 'input' | 'textarea' | 'contenteditable' | 'other';
  // caret position after last insertion for this session (for input/textarea)
  caretPos: number;
  lastInterim: string;
}

export function GlobalDictation() {
  const [isPressed, setIsPressed] = useState(false);
  const [showIcon, setShowIcon] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [caretPosition, setCaretPosition] = useState<CaretPosition>({ x: 0, y: 0, element: null });
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastInterimRef = useRef('');
  const lastFinalInsertedRef = useRef('');
  const isInsertingRef = useRef(false);
  const insertionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentSessionRef = useRef('');
  const lastInsertedSessionRef = useRef('');
  const bufferTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isBufferingRef = useRef(false);
  const keyPressStartTimeRef = useRef<number>(0);
  const hasReceivedAudioRef = useRef(false);

  // Map of sessionId -> anchor
  const sessionAnchorsRef = useRef<Map<string, SessionAnchor>>(new Map());
  // Cleanup timers per session (to handle upgraded finals)
  const sessionCleanupTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  // Anchor captured at start, to be bound when sessionId is known
  const pendingAnchorRef = useRef<SessionAnchor | null>(null);
  
  const { 
    isListening, 
    transcript, 
    interimTranscript, 
    finalTranscript, 
    error, 
    confidence, 
    audioLevel, 
    currentModel,
    sessionId,
    startDictation, 
    stopDictation 
  } = useDictation();

  // Get precise caret position in any text input
  const getCaretPosition = useCallback((): CaretPosition => {
    const activeElement = document.activeElement as HTMLElement;
    
    if (!activeElement || (!activeElement.matches('input, textarea, [contenteditable]'))) {
      return { x: 0, y: 0, element: null };
    }

    try {
      let x: number, y: number;
      
      if (activeElement.matches('input, textarea')) {
        const input = activeElement as HTMLInputElement | HTMLTextAreaElement;
        const rect = activeElement.getBoundingClientRect();
        
        // For input/textarea, create a temporary element to measure text position
        const style = window.getComputedStyle(input);
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.visibility = 'hidden';
        div.style.height = 'auto';
        div.style.width = style.width;
        div.style.font = style.font;
        div.style.fontSize = style.fontSize;
        div.style.fontFamily = style.fontFamily;
        div.style.fontWeight = style.fontWeight;
        div.style.letterSpacing = style.letterSpacing;
        div.style.whiteSpace = 'pre-wrap';
        div.style.wordWrap = 'break-word';
        div.style.padding = style.padding;
        div.style.border = style.border;
        div.style.boxSizing = style.boxSizing;
        
        const selectionStart = input.selectionStart || 0;
        const textBeforeCaret = input.value.substring(0, selectionStart);
        div.textContent = textBeforeCaret;
        
        document.body.appendChild(div);
        const textRect = div.getBoundingClientRect();
        document.body.removeChild(div);
        
        // Calculate position based on text metrics
        const lineHeight = parseInt(style.lineHeight) || parseInt(style.fontSize) * 1.2;
        const paddingLeft = parseInt(style.paddingLeft) || 0;
        const paddingTop = parseInt(style.paddingTop) || 0;
        
        // Position indicator above the actual text cursor location
        x = rect.left + paddingLeft + (textRect.width % (rect.width - paddingLeft * 2));
        y = rect.top + paddingTop + Math.floor(textRect.width / (rect.width - paddingLeft * 2)) * lineHeight - 70;
      } else if (activeElement.matches('[contenteditable]')) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          x = rect.left;
          y = rect.top - 80; // Position well above the cursor
        } else {
          const rect = activeElement.getBoundingClientRect();
          x = rect.left;
          y = rect.top - 80; // Position well above the cursor
        }
      } else {
        const rect = activeElement.getBoundingClientRect();
        x = rect.left;
        y = rect.top - 80;
      }
      
      // Ensure indicator stays within viewport bounds
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const indicatorWidth = 200; // Approximate width of indicator
      const indicatorHeight = 80; // Approximate height of indicator
      
      // Adjust x position if it would go off-screen
      if (x + indicatorWidth > viewportWidth) {
        x = viewportWidth - indicatorWidth - 10;
      }
      if (x < 10) {
        x = 10;
      }
      
      // Adjust y position if it would go off-screen
      if (y < 10) {
        y = 10;
      }
      if (y + indicatorHeight > viewportHeight) {
        y = viewportHeight - indicatorHeight - 10;
      }
      
      return { x, y, element: activeElement };
    } catch (error) {
      console.error('Error getting caret position:', error);
      const rect = activeElement.getBoundingClientRect();
      return { x: rect.left, y: rect.top - 80, element: activeElement };
    }
  }, []);

// Insert or update text for a specific session using its anchor
  const insertTextForSession = useCallback((text: string, isInterim: boolean = false, session: string = '') => {
    if (!session) return;

    // For partials, ignore if this session is not the current active session
    if (isInterim && session !== currentSessionRef.current) {
      console.log('🎤 Skipping interim from old session:', session);
      return;
    }

    const anchor = sessionAnchorsRef.current.get(session);
    if (!anchor || !anchor.element) {
      console.log('🎤 No anchor for session, attempting activeElement fallback:', session);
      // As a last resort, attempt to capture an anchor now for current session
      if (session === currentSessionRef.current) {
        const ae = document.activeElement as HTMLElement | null;
        if (ae && (ae.matches('input, textarea') || ae.matches('[contenteditable]'))) {
          const a: SessionAnchor = {
            element: ae as any,
            type: ae.matches('textarea') ? 'textarea' : ae.matches('input') ? 'input' : ae.matches('[contenteditable]') ? 'contenteditable' : 'other',
            caretPos: (ae as any).selectionStart ?? 0,
            lastInterim: ''
          };
          sessionAnchorsRef.current.set(session, a);
          console.log('🎤 Fallback anchor captured for session:', session);
        } else {
          return;
        }
      } else {
        return;
      }
    }

    const a = sessionAnchorsRef.current.get(session)!;

    if (isInsertingRef.current) {
      console.log('🎤 Insertion blocked - already inserting');
      return;
    }
    isInsertingRef.current = true;
    console.log(`🎤 Inserting text: "${text}", isInterim: ${isInterim}, session: ${session}`);

    try {
      const el = a.element as any;
      if (a.type === 'input' || a.type === 'textarea') {
        const input = el as HTMLInputElement | HTMLTextAreaElement;
        const value = input.value || '';
        const startForReplace = Math.max(0, (a.caretPos || 0) - (a.lastInterim?.length || 0));
        const before = value.substring(0, startForReplace);
        const after = value.substring(a.caretPos || 0);
        const newValue = before + text + after;

        // Use the native setter so React tracks the change
        try {
          const proto = a.type === 'textarea' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
          const valueSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
          if (valueSetter) {
            valueSetter.call(input, newValue);
          } else {
            (input as any).value = newValue;
          }
        } catch {
          (input as any).value = newValue;
        }
        const newCaret = Math.min((before + text).length, newValue.length);
        try { input.setSelectionRange(newCaret, newCaret); } catch {}
        // Update anchor tracking for this session
        a.caretPos = newCaret;
        a.lastInterim = isInterim ? text : '';
        sessionAnchorsRef.current.set(session, a);
        // Trigger React change with a proper InputEvent
        try {
          const evt = new InputEvent('input', { bubbles: true, cancelable: true, data: text as any, inputType: isInterim ? 'insertCompositionText' : 'insertText' } as any);
          input.dispatchEvent(evt);
        } catch {
          const fallbackEvt = new Event('input', { bubbles: true });
          input.dispatchEvent(fallbackEvt);
        }
        // Update indicator after insertion
        setTimeout(() => {
          const newPosition = getCaretPosition();
          if (newPosition.element) setCaretPosition(newPosition);
        }, 10);
        console.log(isInterim ? '🎤 Interim text inserted, length:' : '🎤 Final text inserted, length:', text.length);
      } else if (a.type === 'contenteditable') {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          if (a.lastInterim) {
            range.setStart(range.startContainer, Math.max(0, range.startOffset - a.lastInterim.length));
          }
          range.deleteContents();
          range.insertNode(document.createTextNode(text));
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
          a.lastInterim = isInterim ? text : '';
          sessionAnchorsRef.current.set(session, a);
          // Trigger React change
          try {
            const evt = new InputEvent('input', { bubbles: true, cancelable: true, data: text as any, inputType: isInterim ? 'insertCompositionText' : 'insertText' } as any);
            (a.element as any)?.dispatchEvent(evt);
          } catch {
            const fallbackEvt = new Event('input', { bubbles: true });
            (a.element as any)?.dispatchEvent(fallbackEvt);
          }
          setTimeout(() => {
            const newPosition = getCaretPosition();
            if (newPosition.element) setCaretPosition(newPosition);
          }, 10);
          console.log(isInterim ? '🎤 Interim text inserted (CE), length:' : '🎤 Final text inserted (CE), length:', text.length);
        }
      }
    } catch (error) {
      console.error('Error inserting text:', error);
    } finally {
      isInsertingRef.current = false;
    }
  }, [getCaretPosition]);
  
// Helper function to fully stop dictation and clean up
  const stopDictationCompletely = useCallback(() => {
    console.log('🎤 Stopping dictation completely');
    
    // Clear all timeouts
    if (bufferTimeoutRef.current) {
      clearTimeout(bufferTimeoutRef.current);
      bufferTimeoutRef.current = null;
    }
    if (insertionTimeoutRef.current) {
      clearTimeout(insertionTimeoutRef.current);
      insertionTimeoutRef.current = null;
    }
    
    // Reset pressed/buffer states (do NOT clear session anchors here to allow late finals)
    setIsPressed(false);
    setShowIcon(false);
    setIsBuffering(false);
    isBufferingRef.current = false;
    
    // Clear non-anchor state references
    lastInterimRef.current = '';
    lastFinalInsertedRef.current = '';
    currentSessionRef.current = '';
    lastInsertedSessionRef.current = '';
    
    // Reset insertion lock
    isInsertingRef.current = false;
    
    // Stop the actual dictation
    stopDictation();
  }, [stopDictation]);
  
// Update session tracking and bind pending anchor
  useEffect(() => {
    if (sessionId) {
      currentSessionRef.current = sessionId;
      // Bind pending anchor to this session if available
      if (pendingAnchorRef.current) {
        sessionAnchorsRef.current.set(sessionId, { ...pendingAnchorRef.current });
        console.log('🎤 Session updated and anchor bound:', sessionId);
        pendingAnchorRef.current = null;
      } else {
        console.log('🎤 Session updated:', sessionId);
      }
    }
  }, [sessionId]);

  // Continuously update indicator position during dictation
  useEffect(() => {
    if (!isListening || !showIcon) return;
    
    const updatePosition = () => {
      const newPosition = getCaretPosition();
      if (newPosition.element) {
        setCaretPosition(newPosition);
      }
    };
    
    // Update position immediately
    updatePosition();
    
    // Set up interval to track position changes during dictation
    const positionInterval = setInterval(updatePosition, 100);
    
    return () => {
      clearInterval(positionInterval);
    };
  }, [isListening, showIcon, getCaretPosition]);

  // Track audio activity to detect speech
  useEffect(() => {
    if (audioLevel > 10) {
      hasReceivedAudioRef.current = true;
    }
  }, [audioLevel]);
  
// Handle interim transcript updates (no timeout, immediate insertion)
  useEffect(() => {
    if (interimTranscript && interimTranscript.trim() && sessionId) {
      hasReceivedAudioRef.current = true; // Mark that we've received speech
      console.log('🎤 Processing interim transcript:', interimTranscript);
      insertTextForSession(interimTranscript + ' ', true, sessionId);
    }
  }, [interimTranscript, sessionId, insertTextForSession]);
  
// Handle final transcript
  useEffect(() => {
    if (finalTranscript && finalTranscript.trim() && sessionId) {
      // Create a unique key for this final transcript
      const finalKey = `${sessionId}-${finalTranscript}`;
      
      if (finalKey === lastFinalInsertedRef.current) {
        console.log('🎤 Duplicate final transcript detected, skipping:', finalKey);
        return;
      }
      
      console.log('🎤 Processing final transcript:', finalTranscript);
      
      // Insert final text for the originating session (even if it's no longer current)
      insertTextForSession(finalTranscript + ' ', false, sessionId);
      lastFinalInsertedRef.current = finalKey;

      // Schedule cleanup for this session's anchor after a grace period.
      // If more finals arrive for the same session, refresh the timer.
      const prevTimer = sessionCleanupTimersRef.current.get(sessionId);
      if (prevTimer) clearTimeout(prevTimer);
      const timer = setTimeout(() => {
        if (sessionAnchorsRef.current.has(sessionId)) {
          sessionAnchorsRef.current.delete(sessionId);
          console.log('🎤 Finalized and cleaned anchor for session (grace elapsed):', sessionId);
        }
        sessionCleanupTimersRef.current.delete(sessionId);
      }, 5000);
      sessionCleanupTimersRef.current.set(sessionId, timer);
      
      // If we're in buffer mode and got a final transcript, stop immediately
      if (isBufferingRef.current) {
        console.log('🎤 Final transcript received during buffer - stopping dictation');
        // Small delay to ensure text insertion completes
        setTimeout(() => {
          stopDictationCompletely();
        }, 100);
      }
    }
  }, [finalTranscript, sessionId, insertTextForSession, stopDictationCompletely]);

// Handle Alt/Option key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Alt/Option key and prevent repeat events
      if (e.altKey && !isPressed && !e.repeat) {
        console.log('🎤 Alt key pressed - starting dictation');
        e.preventDefault();
        setIsPressed(true);
        
        // Track key press start time
        keyPressStartTimeRef.current = Date.now();
        hasReceivedAudioRef.current = false;
        
        // Clear previous non-anchor state
        lastFinalInsertedRef.current = '';
        lastInterimRef.current = '';
        currentSessionRef.current = '';
        lastInsertedSessionRef.current = '';
        
        // Clear any pending insertions
        if (insertionTimeoutRef.current) {
          clearTimeout(insertionTimeoutRef.current);
        }
        
        // Capture anchor for where this session starts
        const activeElement = document.activeElement as HTMLElement | null;
        if (activeElement && (activeElement.matches('input, textarea') || activeElement.matches('[contenteditable]'))) {
          const anchor: SessionAnchor = {
            element: activeElement as any,
            type: activeElement.matches('textarea') ? 'textarea' : activeElement.matches('input') ? 'input' : 'contenteditable',
            caretPos: (activeElement as any).selectionStart ?? 0,
            lastInterim: ''
          };
          pendingAnchorRef.current = anchor;
          console.log('🎤 Pending anchor captured for next session');
        } else {
          pendingAnchorRef.current = null;
        }

        // Get the current caret position for overlay
        const position = getCaretPosition();
        if (position.element) {
          setCaretPosition(position);
          setShowIcon(true);
          console.log('🎤 Starting dictation at position:', position);
          startDictation();
        } else {
          console.log('🎤 No text field focused');
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Check for Alt key release
      if (!e.altKey && isPressed && !isBufferingRef.current) {
        const pressDuration = Date.now() - keyPressStartTimeRef.current;
        const hasAudio = audioLevel > 5 || hasReceivedAudioRef.current;
        
        console.log('🎤 Alt key released - press duration:', pressDuration + 'ms', 'hasAudio:', hasAudio);
        e.preventDefault();
        
        // Quick dismissal for very short presses (< 200ms) with no audio activity
        if (pressDuration < 200 && !hasAudio) {
          console.log('🎤 Quick dismissal - accidental trigger detected');
          stopDictationCompletely();
          return;
        }
        
        setIsPressed(false);
        setIsBuffering(true);
        isBufferingRef.current = true;
        
// Start buffer timeout (1000ms to process remaining audio/text)
        bufferTimeoutRef.current = setTimeout(() => {
          console.log('🎤 Buffer period expired - stopping dictation');
          stopDictationCompletely();
        }, 1000); // increased buffer
        
        console.log('🎤 Buffer period started - will stop in 1000ms unless final transcript received');
      }
    };

    // Handle window blur to stop dictation if Alt is held when window loses focus
    const handleBlur = () => {
      if (isPressed || isBufferingRef.current) {
        console.log('🎤 Window lost focus - stopping dictation');
        stopDictationCompletely();
      }
    };

    // Use capture phase to catch events early
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('blur', handleBlur);
      
      // Clean up all timeouts
      if (insertionTimeoutRef.current) {
        clearTimeout(insertionTimeoutRef.current);
      }
      if (bufferTimeoutRef.current) {
        clearTimeout(bufferTimeoutRef.current);
      }
    };
  }, [isPressed, startDictation, stopDictationCompletely, getCaretPosition]);

  if ((!showIcon && !isBuffering) || !caretPosition.element) {
    return null;
  }

  return (
    <div
      className="fixed z-[9999] pointer-events-none"
      style={{
        left: `${caretPosition.x}px`,
        top: `${caretPosition.y}px`,
      }}
    >
      {/* Audio level visualization */}
      <div className="absolute -top-2 -right-2 w-4 h-4">
        <div 
          className="w-full h-full rounded-full transition-all duration-150 shadow-lg border-2 border-white/30"
          style={{
            backgroundColor: audioLevel > 30 ? '#10b981' : audioLevel > 10 ? '#f59e0b' : '#6b7280',
            transform: `scale(${Math.max(0.6, Math.min(1.4, audioLevel / 60))})`
          }}
        />
      </div>
      
      <div className="flex items-center space-x-3 bg-gray-900/95 backdrop-blur-sm text-white px-4 py-3 rounded-xl shadow-2xl border border-gray-700/50">
        {isListening ? (
          <Mic className="w-5 h-5 animate-pulse text-green-400" />
        ) : isBuffering ? (
          <Mic className="w-5 h-5 animate-spin text-yellow-400" />
        ) : (
          <MicOff className="w-5 h-5 text-red-400" />
        )}
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white">
            {error ? '❌ Error' : 
             isBuffering ? '⏳ Processing...' :
             isListening ? '🎤 Listening...' : 
             '⏳ Starting...'}
          </span>
          {isBuffering ? (
            <span className="text-xs text-yellow-300 font-medium">
              Finishing transcription
            </span>
          ) : currentModel && (
            <span className="text-xs text-gray-300 font-medium">
              {currentModel.replace('stt-rt-', '').replace('-', ' ')}
            </span>
          )}
        </div>
      </div>
      
      
      {error && (
        <div className="mt-3 bg-red-900/95 backdrop-blur-sm text-red-100 text-sm px-4 py-3 rounded-xl max-w-xs shadow-2xl border border-red-600/50">
          <span className="font-medium">{error}</span>
        </div>
      )}
    </div>
  );
}
