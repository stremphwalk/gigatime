import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';

interface DictationState {
  isListening: boolean;
  isConnected: boolean;
  transcript: string;
  error: string | null;
}

export function useDictation() {
  const [state, setState] = useState<DictationState>({
    isListening: false,
    isConnected: false,
    transcript: '',
    error: null
  });

  const deepgramRef = useRef<any>(null);
  const connectionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isActiveRef = useRef(false);

  const startDictation = useCallback(async () => {
    if (isActiveRef.current) return;
    
    try {
      isActiveRef.current = true;
      setState(prev => ({ ...prev, isListening: true, error: null, transcript: '' }));

      // Initialize Deepgram client
      if (!deepgramRef.current) {
        // Get API key from backend
        const keyResponse = await fetch('/api/deepgram-key');
        const { apiKey } = await keyResponse.json();
        deepgramRef.current = createClient(apiKey);
      }

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      });
      streamRef.current = stream;

      // Create Deepgram connection
      const connection = deepgramRef.current.listen.live({
        model: 'nova-2',
        language: 'en-US',
        smart_format: true,
        interim_results: true,
        endpointing: 300,
        utterance_end_ms: 1000
      });

      connectionRef.current = connection;

      // Set up event listeners
      connection.on(LiveTranscriptionEvents.Open, () => {
        console.log('Deepgram connection opened');
        setState(prev => ({ ...prev, isConnected: true }));
      });

      connection.on(LiveTranscriptionEvents.Transcript, (data: any) => {
        const transcript = data.channel?.alternatives?.[0]?.transcript;
        if (transcript && transcript.trim()) {
          setState(prev => ({ 
            ...prev, 
            transcript: data.is_final ? transcript : transcript
          }));
        }
      });

      connection.on(LiveTranscriptionEvents.Error, (error: any) => {
        console.error('Deepgram error:', error);
        setState(prev => ({ ...prev, error: error.message || 'Connection error' }));
      });

      connection.on(LiveTranscriptionEvents.Close, () => {
        console.log('Deepgram connection closed');
        setState(prev => ({ ...prev, isConnected: false }));
      });

      // Set up MediaRecorder to send audio to Deepgram
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && connection.getReadyState() === 1) {
          connection.send(event.data);
        }
      };

      mediaRecorder.start(100); // Send data every 100ms

    } catch (error) {
      console.error('Failed to start dictation:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to start dictation',
        isListening: false 
      }));
      isActiveRef.current = false;
    }
  }, []);

  const stopDictation = useCallback(() => {
    if (!isActiveRef.current) return;

    isActiveRef.current = false;
    
    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Close microphone stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Close Deepgram connection
    if (connectionRef.current) {
      connectionRef.current.finish();
      connectionRef.current = null;
    }

    setState(prev => ({ 
      ...prev, 
      isListening: false, 
      isConnected: false 
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDictation();
    };
  }, [stopDictation]);

  return {
    ...state,
    startDictation,
    stopDictation
  };
}