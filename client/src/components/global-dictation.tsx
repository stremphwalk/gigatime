import { useEffect, useState, useRef, useCallback } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useDictation } from '@/hooks/useDictation';

interface CaretPosition {
  x: number;
  y: number;
  element: HTMLElement | null;
}

export function GlobalDictation() {
  const [isPressed, setIsPressed] = useState(false);
  const [showIcon, setShowIcon] = useState(false);
  const [caretPosition, setCaretPosition] = useState<CaretPosition>({ x: 0, y: 0, element: null });
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastInterimRef = useRef('');
  const lastFinalInsertedRef = useRef('');
  const isInsertingRef = useRef(false);
  const insertionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentSessionRef = useRef('');
  const lastInsertedSessionRef = useRef('');
  
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
        
        // Position indicator at the actual text cursor location
        x = rect.left + paddingLeft + (textRect.width % (rect.width - paddingLeft * 2)) + 5;
        y = rect.top + paddingTop + Math.floor(textRect.width / (rect.width - paddingLeft * 2)) * lineHeight - 40;
      } else if (activeElement.matches('[contenteditable]')) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          x = rect.left + 10;
          y = rect.top - 35;
        } else {
          const rect = activeElement.getBoundingClientRect();
          x = rect.left + 10;
          y = rect.top - 35;
        }
      } else {
        const rect = activeElement.getBoundingClientRect();
        x = rect.left + 10;
        y = rect.top - 35;
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
      return { x: rect.left + 10, y: rect.top - 35, element: activeElement };
    }
  }, []);

  // Insert or update text at current caret position with live streaming
  const insertTextAtCaret = useCallback((text: string, isInterim: boolean = false, session: string = '') => {
    if (isInsertingRef.current) {
      console.log('🎤 Insertion blocked - already inserting');
      return;
    }
    
    // Skip if this is from an old session
    if (session && session !== currentSessionRef.current) {
      console.log('🎤 Skipping insertion from old session:', session);
      return;
    }
    
    isInsertingRef.current = true;
    console.log(`🎤 Inserting text: "${text}", isInterim: ${isInterim}, session: ${session}`);

    const activeElement = document.activeElement as HTMLElement;
    
    try {
      if (activeElement && activeElement.matches('input, textarea')) {
        const input = activeElement as HTMLInputElement | HTMLTextAreaElement;
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const value = input.value;
        
        if (isInterim) {
          // For interim results, replace the last interim text
          const interimLength = lastInterimRef.current.length;
          const beforeInterim = value.substring(0, start - interimLength);
          const afterInterim = value.substring(end);
          const newValue = beforeInterim + text + afterInterim;
          
          input.value = newValue;
          {
            const len = (input.value || '').length;
            const pos = Math.max(0, Math.min(beforeInterim.length + text.length, len));
            input.setSelectionRange(pos, pos);
          }
          lastInterimRef.current = text;
          console.log('🎤 Interim text inserted, length:', text.length);
        } else {
          // For final results, replace any interim text that might be there
          const interimLength = lastInterimRef.current.length;
          const beforeFinal = value.substring(0, start - interimLength);
          const afterFinal = value.substring(end);
          const newValue = beforeFinal + text + afterFinal;
          
          input.value = newValue;
          {
            const len = (input.value || '').length;
            const pos = Math.max(0, Math.min(beforeFinal.length + text.length, len));
            input.setSelectionRange(pos, pos);
          }
          lastInterimRef.current = '';
          lastInsertedSessionRef.current = session;
          console.log('🎤 Final text inserted, length:', text.length);
        }
        
        // Trigger input event for React
        const event = new Event('input', { bubbles: true });
        input.dispatchEvent(event);
        
        // Update indicator position after text insertion
        setTimeout(() => {
          const newPosition = getCaretPosition();
          if (newPosition.element) {
            setCaretPosition(newPosition);
          }
        }, 10);
      } else if (activeElement && activeElement.matches('[contenteditable]')) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          
          if (lastInterimRef.current) {
            // Remove previous interim text (works for both interim and final)
            range.setStart(range.startContainer, Math.max(0, range.startOffset - lastInterimRef.current.length));
          }
          
          range.deleteContents();
          range.insertNode(document.createTextNode(text));
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
          
          lastInterimRef.current = isInterim ? text : '';
          if (!isInterim) {
            lastInsertedSessionRef.current = session;
          }
          
          // Update indicator position after text insertion
          setTimeout(() => {
            const newPosition = getCaretPosition();
            if (newPosition.element) {
              setCaretPosition(newPosition);
            }
          }, 10);
        }
      }
    } catch (error) {
      console.error('Error inserting text:', error);
    } finally {
      isInsertingRef.current = false;
    }
  }, []);

  // Update session tracking
  useEffect(() => {
    if (sessionId) {
      currentSessionRef.current = sessionId;
      console.log('🎤 Session updated:', sessionId);
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

  // Handle interim transcript updates (no timeout, immediate insertion)
  useEffect(() => {
    if (interimTranscript && interimTranscript.trim() && sessionId) {
      console.log('🎤 Processing interim transcript:', interimTranscript);
      insertTextAtCaret(interimTranscript + ' ', true, sessionId);
    }
  }, [interimTranscript, sessionId, insertTextAtCaret]);
  
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
      
      // Insert final text, always replacing any previously inserted interim text
      insertTextAtCaret(finalTranscript + ' ', false, sessionId);
      lastFinalInsertedRef.current = finalKey;
    }
  }, [finalTranscript, sessionId, insertTextAtCaret]);

  // Handle Alt/Option key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Alt/Option key and prevent repeat events
      if (e.altKey && !isPressed && !e.repeat) {
        console.log('🎤 Alt key pressed - starting dictation');
        e.preventDefault();
        setIsPressed(true);
        
        // Clear all previous state
        lastFinalInsertedRef.current = '';
        lastInterimRef.current = '';
        currentSessionRef.current = '';
        lastInsertedSessionRef.current = '';
        
        // Clear any pending insertions
        if (insertionTimeoutRef.current) {
          clearTimeout(insertionTimeoutRef.current);
        }
        
        // Get the current caret position
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
      if (!e.altKey && isPressed) {
        console.log('🎤 Alt key released - stopping dictation');
        e.preventDefault();
        
        setIsPressed(false);
        setShowIcon(false);
        
        // Clear all state references
        lastInterimRef.current = '';
        lastFinalInsertedRef.current = '';
        currentSessionRef.current = '';
        lastInsertedSessionRef.current = '';
        
        // Clear any pending insertions
        if (insertionTimeoutRef.current) {
          clearTimeout(insertionTimeoutRef.current);
        }
        
        // Reset insertion lock
        isInsertingRef.current = false;
        
        stopDictation();
      }
    };

    // Handle window blur to stop dictation if Alt is held when window loses focus
    const handleBlur = () => {
      if (isPressed) {
        console.log('🎤 Window lost focus - stopping dictation');
        setIsPressed(false);
        setShowIcon(false);
        
        // Clear all state references
        lastInterimRef.current = '';
        lastFinalInsertedRef.current = '';
        currentSessionRef.current = '';
        lastInsertedSessionRef.current = '';
        
        // Clear any pending insertions
        if (insertionTimeoutRef.current) {
          clearTimeout(insertionTimeoutRef.current);
        }
        
        // Reset insertion lock
        isInsertingRef.current = false;
        
        stopDictation();
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
      
      // Clean up timeouts
      if (insertionTimeoutRef.current) {
        clearTimeout(insertionTimeoutRef.current);
      }
    };
  }, [isPressed, startDictation, stopDictation, getCaretPosition]);

  if (!showIcon || !caretPosition.element) {
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
      <div className="absolute -top-1 -right-1 w-3 h-3">
        <div 
          className="w-full h-full rounded-full transition-all duration-150"
          style={{
            backgroundColor: audioLevel > 30 ? '#10b981' : audioLevel > 10 ? '#f59e0b' : '#6b7280',
            transform: `scale(${Math.max(0.5, audioLevel / 100)})`
          }}
        />
      </div>
      
      <div className="flex items-center space-x-2 bg-[color:var(--brand-700)] text-white px-3 py-2 rounded-lg shadow-lg border border-[color:var(--brand-600)]">
        {isListening ? (
          <Mic className="w-4 h-4 animate-pulse text-green-300" />
        ) : (
          <MicOff className="w-4 h-4 text-red-300" />
        )}
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {error ? '❌ Error' : isListening ? '🎤 Listening...' : '⏳ Starting...'}
          </span>
          {currentModel && (
            <span className="text-xs text-white/80">
              {currentModel.replace('nova-', '').replace('-', ' ')}
            </span>
          )}
        </div>
      </div>
      
      
      {error && (
        <div className="mt-2 bg-red-900 text-red-100 text-sm px-3 py-2 rounded-lg max-w-xs shadow-lg border border-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
