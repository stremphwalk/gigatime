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
  const lastTranscriptRef = useRef('');
  const isInsertingRef = useRef(false);
  
  const { isListening, transcript, error, startDictation, stopDictation } = useDictation();

  // Get caret position in any text input
  const getCaretPosition = useCallback((): CaretPosition => {
    const activeElement = document.activeElement as HTMLElement;
    
    if (!activeElement || (!activeElement.matches('input, textarea, [contenteditable]'))) {
      return { x: 0, y: 0, element: null };
    }

    try {
      const rect = activeElement.getBoundingClientRect();
      // Position the icon slightly above and to the right of the input
      return { 
        x: rect.left + 10, 
        y: rect.top - 5, 
        element: activeElement 
      };
    } catch (error) {
      console.error('Error getting caret position:', error);
      return { x: 0, y: 0, element: activeElement };
    }
  }, []);

  // Insert text at current caret position
  const insertTextAtCaret = useCallback((text: string) => {
    if (isInsertingRef.current) return;
    isInsertingRef.current = true;

    const activeElement = document.activeElement as HTMLElement;
    
    try {
      if (activeElement && activeElement.matches('input, textarea')) {
        const input = activeElement as HTMLInputElement | HTMLTextAreaElement;
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const value = input.value;
        
        input.value = value.slice(0, start) + text + value.slice(end);
        input.setSelectionRange(start + text.length, start + text.length);
        
        // Trigger input event for React
        const event = new Event('input', { bubbles: true });
        input.dispatchEvent(event);
      } else if (activeElement && activeElement.matches('[contenteditable]')) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(text));
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    } catch (error) {
      console.error('Error inserting text:', error);
    } finally {
      isInsertingRef.current = false;
    }
  }, []);

  // Handle transcript updates
  useEffect(() => {
    if (transcript && transcript !== lastTranscriptRef.current && transcript.trim()) {
      const newText = transcript.slice(lastTranscriptRef.current.length);
      if (newText.trim()) {
        insertTextAtCaret(newText + ' ');
        lastTranscriptRef.current = transcript;
      }
    }
  }, [transcript, insertTextAtCaret]);

  // Handle Alt/Option key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Alt/Option key and prevent repeat events
      if (e.altKey && !isPressed && !e.repeat) {
        console.log('🎤 Alt key pressed - starting dictation');
        e.preventDefault();
        setIsPressed(true);
        
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
        lastTranscriptRef.current = '';
        stopDictation();
      }
    };

    // Handle window blur to stop dictation if Alt is held when window loses focus
    const handleBlur = () => {
      if (isPressed) {
        console.log('🎤 Window lost focus - stopping dictation');
        setIsPressed(false);
        setShowIcon(false);
        lastTranscriptRef.current = '';
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
      <div className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg border border-blue-400">
        {isListening ? (
          <Mic className="w-4 h-4 animate-pulse text-green-300" />
        ) : (
          <MicOff className="w-4 h-4 text-red-300" />
        )}
        <span className="text-sm font-medium">
          {error ? '❌ Error' : isListening ? '🎤 Listening...' : '⏳ Starting...'}
        </span>
      </div>
      
      {/* Live transcript preview */}
      {transcript && (
        <div className="mt-2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg max-w-xs shadow-lg border border-gray-700">
          <div className="font-mono">{transcript}</div>
        </div>
      )}
      
      {error && (
        <div className="mt-2 bg-red-900 text-red-100 text-sm px-3 py-2 rounded-lg max-w-xs shadow-lg border border-red-700">
          {error}
        </div>
      )}
    </div>
  );
}