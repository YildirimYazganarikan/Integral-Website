import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { AgentMode, AgentState, AudioLevels } from '../types';
import { createPcmBlob, base64ToArrayBuffer, decodeAudioData } from '../utils/audioUtils';

const DEFAULT_API_KEY = process.env.API_KEY || '';

export const useLiveAgent = (apiKey?: string) => {
  const effectiveApiKey = apiKey || DEFAULT_API_KEY;
  const [state, setState] = useState<AgentState>({
    mode: AgentMode.IDLE,
    isConnected: false,
    error: null,
  });

  // Audio Contexts
  const audioContextsRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Audio Nodes for Visualization
  const analysersRef = useRef<{ input: AnalyserNode; output: AnalyserNode } | null>(null);

  // State Refs for Logic
  const modeRef = useRef<AgentMode>(AgentMode.IDLE);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  // Helper to update state safely
  const setMode = useCallback((newMode: AgentMode) => {
    if (modeRef.current !== newMode) {
      modeRef.current = newMode;
      setState(prev => ({ ...prev, mode: newMode }));
    }
  }, []);

  const getVolumeLevels = useCallback((): AudioLevels => {
    if (!analysersRef.current) return { input: 0, output: 0 };

    const inputAnalyser = analysersRef.current.input;
    const outputAnalyser = analysersRef.current.output;

    const inputData = new Uint8Array(inputAnalyser.frequencyBinCount);
    inputAnalyser.getByteFrequencyData(inputData);

    const outputData = new Uint8Array(outputAnalyser.frequencyBinCount);
    outputAnalyser.getByteFrequencyData(outputData);

    let inputSum = 0;
    for (let i = 0; i < inputData.length; i++) inputSum += inputData[i];
    const input = inputSum / inputData.length / 255;

    let outputSum = 0;
    for (let i = 0; i < outputData.length; i++) outputSum += outputData[i];
    const output = outputSum / outputData.length / 255;

    return {
      input,
      output,
      inputFrequencies: inputData,
      outputFrequencies: outputData
    };
  }, []);

  const connect = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));

      if (!effectiveApiKey) throw new Error("API Key is missing. Please set it in Settings.");

      // 1. Setup Audio
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      // Critical: Ensure contexts are running (browsers often suspend them)
      await inputCtx.resume();
      await outputCtx.resume();

      const inputAnalyser = inputCtx.createAnalyser();
      const outputAnalyser = outputCtx.createAnalyser();
      inputAnalyser.fftSize = 256;
      outputAnalyser.fftSize = 256;

      audioContextsRef.current = { input: inputCtx, output: outputCtx };
      analysersRef.current = { input: inputAnalyser, output: outputAnalyser };

      // 2. Setup Microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const source = inputCtx.createMediaStreamSource(stream);
      const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);

      source.connect(inputAnalyser);
      inputAnalyser.connect(scriptProcessor);
      scriptProcessor.connect(inputCtx.destination);

      // 3. Initialize Gemini
      const ai = new GoogleGenAI({ apiKey: effectiveApiKey });

      // 4. Create Session
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `You are Nora, a helpful, witty, and concise voice assistant. You have access to Google Search to find current information when needed.`,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          tools: [{ googleSearch: {} }]
        },
        callbacks: {
          onopen: () => {
            console.log('Session Connected');
            setState(prev => ({ ...prev, isConnected: true }));
            setMode(AgentMode.LISTENING);

            // Start processing audio
            scriptProcessor.onaudioprocess = (e) => {
              if (!audioContextsRef.current) return; // Stop processing if disconnected

              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);

              if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then(session => {
                  try {
                    session.sendRealtimeInput({ media: pcmBlob });
                  } catch (e) {
                    // Ignore send errors if session is closing
                  }
                }).catch(err => {
                  // Catch promise rejections if connection dropped during streaming
                });
              }
            };
          },
          onmessage: async (msg: LiveServerMessage) => {
            const { serverContent } = msg;

            // Handle Audio Output
            if (serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
              const base64 = serverContent.modelTurn.parts[0].inlineData.data;
              const buffer = base64ToArrayBuffer(base64);
              if (audioContextsRef.current) {
                const audioBuffer = await decodeAudioData(buffer, outputCtx);

                const source = outputCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAnalyser);
                outputAnalyser.connect(outputCtx.destination);

                const startTime = Math.max(outputCtx.currentTime, nextStartTimeRef.current);
                source.start(startTime);
                nextStartTimeRef.current = startTime + audioBuffer.duration;

                audioSourcesRef.current.add(source);
                setMode(AgentMode.SPEAKING);

                source.onended = () => {
                  audioSourcesRef.current.delete(source);
                  if (audioSourcesRef.current.size === 0 && modeRef.current === AgentMode.SPEAKING) {
                    setMode(AgentMode.LISTENING);
                  }
                };
              }
            }

            // Handle Interruption
            if (serverContent?.interrupted) {
              console.log('Interrupted');
              audioSourcesRef.current.forEach(s => {
                try { s.stop(); } catch (e) { }
              });
              audioSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setMode(AgentMode.LISTENING);
            }
          },
          onclose: () => {
            console.log('Session Closed');
            setState(prev => ({ ...prev, isConnected: false }));
            setMode(AgentMode.IDLE);
          },
          onerror: (err) => {
            console.error(err);
            setState(prev => ({ ...prev, error: "Connection Error", isConnected: false }));
            setMode(AgentMode.IDLE);
          }
        }
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (e: any) {
      setState(prev => ({ ...prev, error: e.message }));
      setMode(AgentMode.IDLE);
    }
  }, [setMode]);

  const disconnect = useCallback(async () => {
    // 1. Reset State immediately to update UI
    setMode(AgentMode.IDLE);
    setState(prev => ({ ...prev, isConnected: false, error: null }));

    // 2. Stop Microphone Stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // 3. Close Audio Contexts
    if (audioContextsRef.current) {
      const { input, output } = audioContextsRef.current;
      try {
        if (input.state !== 'closed') await input.close();
        if (output.state !== 'closed') await output.close();
      } catch (e) {
        console.error("Error closing audio contexts", e);
      }
      audioContextsRef.current = null;
    }

    // 4. Clear Analysers and Sources
    analysersRef.current = null;
    audioSourcesRef.current.forEach(s => {
      try { s.stop(); } catch (e) { }
    });
    audioSourcesRef.current.clear();

    // 5. Abandon Session Promise (The library doesn't expose a clean close for the client promise wrapper)
    sessionPromiseRef.current = null;

  }, [setMode]);

  return {
    state,
    connect,
    disconnect,
    getVolumeLevels,
  };
};
