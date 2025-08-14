import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient, LiveTranscriptionEvents, type LiveSchema } from '@deepgram/sdk';

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

  const connectionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isActiveRef = useRef(false);

  const startDictation = useCallback(async () => {
    if (isActiveRef.current) return;
    
    try {
      isActiveRef.current = true;
      setState(prev => ({ ...prev, isListening: true, error: null, transcript: '' }));

      // Get API key from backend
      const keyResponse = await fetch('/api/deepgram-key');
      const { apiKey } = await keyResponse.json();
      
      // Create Deepgram client
      const deepgram = createClient(apiKey);

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      streamRef.current = stream;

      // Create live transcription connection
      const connection = deepgram.listen.live({
        model: 'nova-2',
        language: 'en-US',
        smart_format: true,
        interim_results: true,
        filler_words: true,
        utterance_end_ms: 1000
      } as LiveSchema);

      connectionRef.current = connection;

      // Set up event listeners
      connection.addListener(LiveTranscriptionEvents.Open, () => {
        console.log('Deepgram connection opened');
        setState(prev => ({ ...prev, isConnected: true }));
      });

      connection.addListener(LiveTranscriptionEvents.Transcript, (data: any) => {
        const transcript = data.channel?.alternatives?.[0]?.transcript;
        if (transcript && transcript.trim()) {
          setState(prev => ({ 
            ...prev, 
            transcript: data.is_final ? transcript : transcript
          }));
        }
      });

      connection.addListener(LiveTranscriptionEvents.Error, (error: any) => {
        console.error('Deepgram error:', error);
        setState(prev => ({ ...prev, error: error.message || 'Connection error' }));
      });

      connection.addListener(LiveTranscriptionEvents.Close, () => {
        console.log('Deepgram connection closed');
        setState(prev => ({ ...prev, isConnected: false }));
      });

      // Set up MediaRecorder to send audio to Deepgram
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.addEventListener('dataavailable', (event) => {
        // iOS SAFARI FIX: Prevent packetZero from being sent
        if (event.data.size > 0) {
          connection.send(event.data);
        }
      });

      mediaRecorder.start(250); // Send data every 250ms

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