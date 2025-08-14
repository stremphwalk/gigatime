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
  const [pressStartTime, setPressStartTime] = useState<number | null>(null);
  
  const { isListening, transcript, error, startDictation, stopDictation } = useDictation();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTranscriptRef = useRef('');
  const isInsertingRef = useRef(false);

  // Get caret position in any text input
  const getCaretPosition = useCallback((): CaretPosition => {
    const activeElement = document.activeElement as HTMLElement;
    
    if (!activeElement || (!activeElement.matches('input, textarea, [contenteditable]'))) {
      return { x: 0, y: 0, element: null };
    }

    try {
      let x = 0, y = 0;

      if (activeElement.matches('input, textarea')) {
        const input = activeElement as HTMLInputElement | HTMLTextAreaElement;
        const selectionStart = input.selectionStart || 0;
        
        // Create a temporary element to measure text
        const temp = document.createElement('span');
        temp.style.font = window.getComputedStyle(input).font;
        temp.style.whiteSpace = 'pre';
        temp.style.position = 'absolute';
        temp.style.visibility = 'hidden';
        temp.textContent = input.value.substring(0, selectionStart) || '.';
        document.body.appendChild(temp);
        
        const rect = input.getBoundingClientRect();
        const tempRect = temp.getBoundingClientRect();
        
        x = rect.left + (tempRect.width % rect.width);
        y = rect.top + Math.floor(tempRect.width / rect.width) * tempRect.height;
        
        document.body.removeChild(temp);
      } else if (activeElement.matches('[contenteditable]')) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          x = rect.left;
          y = rect.top;
        }
      }

      return { x, y, element: activeElement };
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
    
    if (!activeElement) {
      isInsertingRef.current = false;
      return;
    }

    try {
      if (activeElement.matches('input, textarea')) {
        const input = activeElement as HTMLInputElement | HTMLTextAreaElement;
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const value = input.value;
        
        // Replace selected text or insert at cursor
        const newValue = value.substring(0, start) + text + value.substring(end);
        input.value = newValue;
        
        // Move cursor to end of inserted text
        const newCursorPos = start + text.length;
        input.setSelectionRange(newCursorPos, newCursorPos);
        
        // Trigger input event
        input.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (activeElement.matches('[contenteditable]')) {
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
      // For final transcripts, insert the full text and add a space
      if (!transcript.includes('...') && transcript.length > lastTranscriptRef.current.length) {
        const newText = transcript.slice(lastTranscriptRef.current.length);
        if (newText.trim()) {
          insertTextAtCaret(newText + ' ');
          lastTranscriptRef.current = transcript;
        }
      }
    }
  }, [transcript, insertTextAtCaret]);

  // Handle Alt/Option key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && !isPressed) {
        e.preventDefault();
        setIsPressed(true);
        setPressStartTime(Date.now());
        
        // Update caret position when Alt is first pressed
        const position = getCaretPosition();
        setCaretPosition(position);
        
        // Show icon after brief delay
        timeoutRef.current = setTimeout(() => {
          if (Date.now() - (pressStartTime || 0) >= 200) {
            setShowIcon(true);
            startDictation();
          }
        }, 200);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.altKey && isPressed) {
        setIsPressed(false);
        setShowIcon(false);
        setPressStartTime(null);
        lastTranscriptRef.current = '';
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        stopDictation();
      }
    };

    // Handle window blur to stop dictation if Alt is held when window loses focus
    const handleBlur = () => {
      if (isPressed) {
        setIsPressed(false);
        setShowIcon(false);
        setPressStartTime(null);
        lastTranscriptRef.current = '';
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        stopDictation();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isPressed, pressStartTime, startDictation, stopDictation, getCaretPosition]);

  if (!showIcon || !caretPosition.element) {
    return null;
  }

  return (
    <div
      className="fixed z-[9999] pointer-events-none"
      style={{
        left: `${caretPosition.x}px`,
        top: `${caretPosition.y - 30}px`,
      }}
    >
      <div className="flex items-center space-x-2 bg-blue-500 text-white px-2 py-1 rounded-md shadow-lg">
        {isListening ? (
          <Mic className="w-4 h-4 animate-pulse" />
        ) : (
          <MicOff className="w-4 h-4" />
        )}
        <span className="text-xs">
          {error ? 'Error' : isListening ? 'Listening...' : 'Starting...'}
        </span>
      </div>
      
      {/* Live transcript preview */}
      {transcript && !transcript.includes('...') && (
        <div className="mt-1 bg-gray-800 text-white text-xs px-2 py-1 rounded max-w-xs">
          {transcript}
        </div>
      )}
      
      {/* Error display */}
      {error && (
        <div className="mt-1 bg-red-500 text-white text-xs px-2 py-1 rounded max-w-xs">
          {error}
        </div>
      )}
    </div>
  );
}