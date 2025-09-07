import { useState, useEffect, useRef, useCallback } from 'react';
import { SonioxClient } from '@soniox/speech-to-text-web';
import { formatMedicalText, MEDICAL_CONTEXT_HINTS } from '@/utils/medicalFormatting';

interface DictationState {
  isListening: boolean;
  isConnected: boolean;
  transcript: string;
  interimTranscript: string;
  finalTranscript: string;
  error: string | null;
  confidence: number;
  audioLevel: number;
  sessionId: string;
}

export function useDictation() {
  const [state, setState] = useState<DictationState>({
    isListening: false,
    isConnected: false,
    transcript: '',
    interimTranscript: '',
    finalTranscript: '',
    error: null,
    confidence: 0,
    audioLevel: 0,
    sessionId: ''
  });

  const sonioxClientRef = useRef<SonioxClient | null>(null);
  const isActiveRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const finalBufferRef = useRef<string[]>([]);
  const currentSessionRef = useRef<string>('');
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processedFinalTranscriptsRef = useRef<Set<string>>(new Set());
  const lastInterimTranscriptRef = useRef<string>('');

  const startDictation = useCallback(async () => {
    if (isActiveRef.current) return;
    
    try {
      isActiveRef.current = true;
      const newSessionId = Date.now().toString();
      setState(prev => ({ 
        ...prev, 
        isListening: true, 
        error: null, 
        transcript: '', 
        interimTranscript: '',
        finalTranscript: '',
        confidence: 0,
        audioLevel: 0,
        sessionId: newSessionId
      }));
      
      // Clear any existing reconnection attempts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      reconnectAttemptsRef.current = 0;
      finalBufferRef.current = [];
      currentSessionRef.current = newSessionId;
      processedFinalTranscriptsRef.current.clear();
      lastInterimTranscriptRef.current = '';

      console.log('🎤 Starting Soniox dictation...');

      // Create Soniox client with API key fetching
      const sonioxClient = new SonioxClient({
        // Fetch API key from backend when needed
        apiKey: async () => {
          const keyResponse = await fetch('/api/soniox-key');
          const { apiKey } = await keyResponse.json();
          return apiKey;
        },
        
        // Global callbacks
        onStarted: () => {
          console.log('🎤 Soniox transcription started');
          setState(prev => ({ ...prev, isConnected: true }));
        },
        
        onFinished: () => {
          console.log('🎤 Soniox transcription finished');
          setState(prev => ({ ...prev, isConnected: false }));
        },
        
        onError: (status, message, errorCode) => {
          console.error('🎤 Soniox error:', { status, message, errorCode });
          handleConnectionError(new Error(`${status}: ${message}`));
        },

        onStateChange: ({ newState, oldState }) => {
          console.log('🎤 Soniox state changed:', { oldState, newState });
        }
      });

      sonioxClientRef.current = sonioxClient;

      // Get microphone access and set up audio monitoring
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // Soniox prefers 16kHz
          channelCount: 1
        } 
      });
      streamRef.current = stream;
      
      // Set up audio level monitoring
      setupAudioAnalysis(stream);

      // Start transcription with medical-specific configuration
      await sonioxClient.start({
        // Use real-time medical model when available, fallback to preview
        model: 'stt-rt-preview',
        
        // Set medical context for better accuracy with medical terminology
        context: MEDICAL_CONTEXT_HINTS.join(', '),
        
        // Language settings for medical dictation
        languageHints: ['en'],
        
        // Enable features for better medical transcription
        enableEndpointDetection: true,
        enableLanguageIdentification: false, // Keep it simple for medical use
        enableSpeakerDiarization: false, // Not needed for individual dictation
        
        // Audio configuration
        audioFormat: 'auto', // Let Soniox handle format detection
        
        // Use the microphone stream
        stream: stream,
        
        // Audio constraints for high-quality medical dictation
        audioConstraints: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 16000
        },
        
        // Result callback
        onPartialResult: (result) => {
          console.log('🎤 Soniox partial result:', result);
          
          if (result.tokens && result.tokens.length > 0) {
            // Extract transcript from tokens
            let rawTranscript = result.tokens.map(token => token.text).join('');
            const isFinal = result.tokens.some(token => token.is_final);
            
            if (rawTranscript && rawTranscript.trim()) {
              // Clean up unwanted artifacts
              rawTranscript = rawTranscript
                .replace(/\.<end>/gi, '')  // Remove .<end> artifacts
                .replace(/<end>/gi, '')    // Remove <end> artifacts
                .replace(/\.\s*end\b/gi, '') // Remove . end patterns
                .replace(/\bend\b/gi, '')   // Remove standalone "end" words
                .trim();
              
              // Skip if transcript is empty after cleanup
              if (!rawTranscript) return;
              
              // Apply medical formatting
              const formattedTranscript = formatMedicalText(rawTranscript);
              console.log('🎤 Cleaned & formatted transcript:', formattedTranscript, 'isFinal:', isFinal);
              
              setState(prev => {
                const newState = { 
                  ...prev, 
                  transcript: formattedTranscript,
                  confidence: result.tokens[0]?.confidence || 0
                };
                
                if (isFinal) {
                  // Only add to final buffer if it's genuinely new content
                  const transcriptHash = `${currentSessionRef.current}-${formattedTranscript}`;
                  if (!processedFinalTranscriptsRef.current.has(transcriptHash)) {
                    processedFinalTranscriptsRef.current.add(transcriptHash);
                    finalBufferRef.current.push(formattedTranscript);
                    
                    // Join with space and clean up any duplicate spacing
                    const aggregated = finalBufferRef.current.join(' ').replace(/\s+/g, ' ').trim();
                    newState.finalTranscript = aggregated;
                  }
                  newState.interimTranscript = '';
                  lastInterimTranscriptRef.current = '';
                } else {
                  // Only update interim if it's different and not empty
                  if (formattedTranscript !== lastInterimTranscriptRef.current && formattedTranscript.length > 0) {
                    newState.interimTranscript = formattedTranscript;
                    lastInterimTranscriptRef.current = formattedTranscript;
                  }
                }
                
                return newState;
              });
            }
          }
        }
      });

      console.log('🎤 Soniox dictation started successfully');

    } catch (error) {
      console.error('Failed to start Soniox dictation:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to start dictation',
        isListening: false 
      }));
      isActiveRef.current = false;
    }
  }, []);

  // Set up audio analysis for real-time level monitoring
  const setupAudioAnalysis = useCallback((stream: MediaStream) => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser();
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;
      sourceNodeRef.current = source;
      
      // Start monitoring audio levels
      monitorAudioLevel();
    } catch (error) {
      console.warn('Audio analysis setup failed:', error);
    }
  }, []);

  // Monitor audio levels for visual feedback
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current || !isActiveRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calculate RMS (root mean square) for audio level
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / dataArray.length);
    const audioLevel = Math.min(100, (rms / 128) * 100);
    
    setState(prev => ({ ...prev, audioLevel }));
    
    // Continue monitoring
    if (isActiveRef.current) {
      requestAnimationFrame(monitorAudioLevel);
    }
  }, []);

  // Handle connection errors with automatic reconnection
  const handleConnectionError = useCallback((error: any) => {
    console.error('🎤 Soniox connection error:', error);
    
    setState(prev => ({ ...prev, error: error.message || 'Connection error' }));
    
    // Attempt reconnection for certain types of errors
    if (reconnectAttemptsRef.current < 2) {
      attemptReconnection();
    } else {
      console.log('🎤 Max reconnection attempts reached');
      setState(prev => ({ ...prev, error: 'Connection failed after multiple attempts' }));
    }
  }, []);

  // Attempt automatic reconnection
  const attemptReconnection = useCallback(() => {
    if (!isActiveRef.current || reconnectAttemptsRef.current >= 3) return;
    
    reconnectAttemptsRef.current++;
    console.log(`🎤 Attempting Soniox reconnection ${reconnectAttemptsRef.current}/3`);
    
    setState(prev => ({ ...prev, error: `Reconnecting... (${reconnectAttemptsRef.current}/3)` }));
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (isActiveRef.current) {
        // Stop and restart
        stopDictation();
        setTimeout(() => {
          if (!isActiveRef.current) { // Only restart if not manually stopped
            startDictation();
          }
        }, 1000);
      }
    }, 2000);
  }, []);

  const stopDictation = useCallback(() => {
    if (!isActiveRef.current) return;

    console.log('🎤 Stopping Soniox dictation...');
    isActiveRef.current = false;
    
    // Clear reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Stop Soniox client
    if (sonioxClientRef.current) {
      try {
        sonioxClientRef.current.stop(); // Gracefully stop with final results
      } catch (error) {
        console.error('Error stopping Soniox client:', error);
      }
      sonioxClientRef.current = null;
    }

    // Clean up audio monitoring
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.disconnect(); } catch {}
      sourceNodeRef.current = null;
    }

    // Close microphone stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;

    // Reset attempts
    reconnectAttemptsRef.current = 0;

    setState(prev => ({ 
      ...prev, 
      isListening: false, 
      isConnected: false,
      audioLevel: 0
    }));

    console.log('🎤 Soniox dictation stopped');
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
    stopDictation,
    // Additional utilities for compatibility
    currentModel: 'stt-rt-preview', // Soniox model
    reconnectAttempts: reconnectAttemptsRef.current
  };
}
