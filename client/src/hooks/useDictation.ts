import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient, LiveTranscriptionEvents, type LiveSchema } from '@deepgram/sdk';
import { formatMedicalText, addMedicalPunctuation, MEDICAL_CONTEXT_HINTS, isMedicalContext } from '@/utils/medicalFormatting';

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

  const connectionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isActiveRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const lastFinalTranscriptRef = useRef('');
  const finalBufferRef = useRef<string[]>([]);
  const currentModelRef = useRef<string>('nova-3-medical'); // Use latest medical model for best medical terminology accuracy
  const currentSessionRef = useRef<string>('');
  const processedTranscriptsRef = useRef<Set<string>>(new Set());

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
      lastFinalTranscriptRef.current = '';
      finalBufferRef.current = [];
      currentSessionRef.current = newSessionId;
      processedTranscriptsRef.current.clear();

      // Get API key from backend
      const keyResponse = await fetch('/api/deepgram-key');
      const { apiKey } = await keyResponse.json();
      
      // Create Deepgram client
      const deepgram = createClient(apiKey);

      // Get microphone access with optimized settings for medical dictation
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000, // Higher quality for better medical term recognition
          channelCount: 1 // Mono for better speech recognition
        } 
      });
      streamRef.current = stream;
      
      // Set up audio analysis for level monitoring
      setupAudioAnalysis(stream);

      // Set up raw PCM capture via Web Audio API to avoid container/codec mismatches
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      const sourceNode = audioContext.createMediaStreamSource(stream);
      sourceNodeRef.current = sourceNode;
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      sourceNode.connect(processor);
      processor.connect(audioContext.destination);

      // Buffer to group a bit of audio before sending
      let pcmBuffer: Int16Array[] = [];
      const sendBufferedPcm = () => {
        if (!connectionRef.current || pcmBuffer.length === 0) return;
        const totalLength = pcmBuffer.reduce((sum, arr) => sum + arr.length, 0);
        const merged = new Int16Array(totalLength);
        let offset = 0;
        for (const chunk of pcmBuffer) {
          merged.set(chunk, offset);
          offset += chunk.length;
        }
        pcmBuffer = [];
        try {
          connectionRef.current.send(merged.buffer);
          console.log('🎤 PCM audio sent to Deepgram successfully, bytes:', merged.byteLength);
        } catch (error) {
          console.error('🎤 Error sending PCM audio:', error);
        }
      };

      processor.onaudioprocess = (e) => {
        if (!isActiveRef.current) return;
        const input = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
          const s = Math.max(-1, Math.min(1, input[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        pcmBuffer.push(pcm16);
      };

      // Configure Deepgram for raw PCM: 16 kHz mono linear16
      const liveOptions: any = {
        model: 'nova-3-medical',
        language: 'en-US',
        smart_format: true,
        interim_results: true,
        punctuate: true,
        endpointing: 1000,
        utterance_end_ms: 1500,
        encoding: 'linear16',
        sample_rate: 16000,
        channels: 1
      };
      console.log('🎤 Using Deepgram encoding:', liveOptions.encoding);

      // Create live transcription connection with container-aware encoding
      console.log(`🎤 Using minimal configuration for reliable connection`);
      const connection = deepgram.listen.live(liveOptions);

      connectionRef.current = connection;

      // Set up event listeners - try the simplest possible approach
      connection.on(LiveTranscriptionEvents.Open, () => {
        console.log('🎤 Deepgram connection opened');
        setState(prev => ({ ...prev, isConnected: true }));
        
        // Start PCM flushing at a steady interval
        const flushInterval = setInterval(() => {
          if (!isActiveRef.current || !connectionRef.current) return;
          try {
            // send whatever is buffered
            // the sendBufferedPcm function is closed over from above
            (sendBufferedPcm as any)();
          } catch {}
        }, 200);
        // Store interval id on the connection for cleanup
        if (connectionRef.current) {
          (connectionRef.current as any)._pcmFlush = flushInterval;
        }
      });

      // Avoid handling raw WebSocket messages to prevent duplicate processing

      connection.on(LiveTranscriptionEvents.Transcript, (data: any) => {
        console.log('🎤 Transcript received:', data);
        console.log('🎤 Full data structure:', JSON.stringify(data, null, 2));
        
        // Extract transcript data
        const transcript = data.channel?.alternatives?.[0]?.transcript;
        const isFinal = data.is_final || false;
        const confidence = data.channel?.alternatives?.[0]?.confidence || 0;
        
        if (transcript && transcript.trim()) {
          console.log('🎤 Raw transcript:', transcript);
          console.log('🎤 Is final:', isFinal);
          
          // Create unique identifier for this transcript event
          const transcriptId = `${currentSessionRef.current}-${transcript}-${isFinal}`;
          
          // Check for duplicates
          if (processedTranscriptsRef.current.has(transcriptId)) {
            console.log('🎤 Duplicate transcript detected, skipping:', transcriptId);
            return;
          }
          
          processedTranscriptsRef.current.add(transcriptId);
          
          // Apply medical formatting
          const formattedTranscript = formatMedicalText(transcript);
          console.log('🎤 Formatted transcript:', formattedTranscript);
          console.log('🎤 Transcript ID:', transcriptId);
          
          setState(prev => {
            // If this is a final transcript, clear any previous final transcript
            const newState = { 
              ...prev, 
              transcript: formattedTranscript,
              confidence: confidence
            };
            
            if (isFinal) {
              // Accumulate all final chunks during this session
              try {
                finalBufferRef.current.push(formattedTranscript);
              } catch {}
              const aggregated = finalBufferRef.current.join('\n').trim();
              newState.finalTranscript = aggregated || formattedTranscript;
              newState.interimTranscript = '';
            } else {
              newState.interimTranscript = formattedTranscript;
              // Don't clear finalTranscript for interim results
            }
            
            return newState;
          });
        }
      });

      // Remove alternate 'Results' handler to avoid duplicate updates

      // Removed generic message handler to prevent duplicate processing

      connection.on(LiveTranscriptionEvents.Error, (error: any) => {
        console.error('🎤 Deepgram error:', error);
        handleConnectionError(error);
      });

      connection.on(LiveTranscriptionEvents.Close, (event: any) => {
        console.log('🎤 Deepgram connection closed');
        console.log('🎤 Close event details:', event);
        setState(prev => ({ ...prev, isConnected: false }));
        // Clear PCM flush interval if present
        try {
          const intervalId = (connectionRef.current as any)?._pcmFlush;
          if (intervalId) clearInterval(intervalId);
        } catch {}
      });
      
      // Debug metadata
      connection.on('Metadata', (data: any) => {
        console.log('🎤 Metadata event:', data);
        console.log('🎤 Metadata details:', JSON.stringify(data, null, 2));
      });

      // Recording is started in the connection Open handler

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

  // Handle connection errors with automatic fallback and reconnection
  const handleConnectionError = useCallback((error: any) => {
    console.error('🎤 Connection error:', error);
    
    setState(prev => ({ ...prev, error: error.message || 'Connection error' }));
    
    // If it's a WebSocket connection error, try simpler config
    if (error.message && error.message.toLowerCase().includes('websocket')) {
      console.log('🎤 WebSocket error detected - will try simplified configuration');
    }
    
    // For any connection error, try simpler configuration
    if (reconnectAttemptsRef.current < 2) {
      // Attempt reconnection with simpler config
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
    console.log(`🎤 Attempting reconnection ${reconnectAttemptsRef.current}/3 with model: ${currentModelRef.current}`);
    
    setState(prev => ({ ...prev, error: `Reconnecting... (${reconnectAttemptsRef.current}/3)` }));
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (isActiveRef.current) {
        // Stop first
        isActiveRef.current = false;
        
        // Clear reconnection timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        
        // Disconnect audio processor chain
        if (processorRef.current) {
          try { processorRef.current.disconnect(); } catch {}
          processorRef.current = null;
        }
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

        // Close Deepgram connection
        if (connectionRef.current) {
          connectionRef.current.finish();
          connectionRef.current = null;
        }

        setState(prev => ({ 
          ...prev, 
          isListening: false, 
          isConnected: false,
          audioLevel: 0
        }));
        
        // Restart after cleanup
        setTimeout(() => {
          if (!isActiveRef.current) { // Only restart if not manually stopped
            startDictation();
          }
        }, 1000);
      }
    }, 2000);
  }, [startDictation]);

  const stopDictation = useCallback(() => {
    if (!isActiveRef.current) return;

    isActiveRef.current = false;
    
    // Clear reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Disconnect audio processor chain
    if (processorRef.current) {
      try { processorRef.current.disconnect(); } catch {}
      processorRef.current = null;
    }
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

    // Close Deepgram connection
    if (connectionRef.current) {
      try {
        const conn: any = connectionRef.current;
        if (conn._pcmFlush) clearInterval(conn._pcmFlush);
        if (typeof conn.finish === 'function') conn.finish();
      } catch (e) {
        // ignore cleanup errors
      } finally {
        connectionRef.current = null;
      }
    }

    // Reset model to latest medical model
    currentModelRef.current = 'nova-3-medical';
    reconnectAttemptsRef.current = 0;
    lastFinalTranscriptRef.current = '';

    setState(prev => ({ 
      ...prev, 
      isListening: false, 
      isConnected: false,
      audioLevel: 0
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
    stopDictation,
    // Additional utilities for advanced features
    currentModel: currentModelRef.current,
    reconnectAttempts: reconnectAttemptsRef.current
  };
}
