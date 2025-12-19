
import React, { useState, useRef, useCallback } from 'react';
import { getAI, decodeBase64Audio, decodeAudioBuffer, encodeAudioPCM } from '../services/gemini';
import { Modality, LiveServerMessage } from '@google/genai';

const LiveBrainstorm: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopSession = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close?.();
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();
    setIsActive(false);
    setIsConnecting(false);
  }, []);

  const startSession = async () => {
    setIsConnecting(true);
    try {
      const ai = getAI();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = inputCtx;
      outputContextRef.current = outputCtx;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmData = encodeAudioPCM(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: { data: pcmData, mimeType: 'audio/pcm;rate=16000' } });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Audio output
            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              const audioBytes = decodeBase64Audio(base64Audio);
              const buffer = await decodeAudioBuffer(audioBytes, outputCtx);
              
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            // Interrupt handling
            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }

            // Transcripts
            if (msg.serverContent?.inputTranscription) {
              setTranscripts(prev => [...prev, `User: ${msg.serverContent!.inputTranscription!.text}`]);
            }
            if (msg.serverContent?.outputTranscription) {
              setTranscripts(prev => [...prev, `Gemini: ${msg.serverContent!.outputTranscription!.text}`]);
            }
          },
          onerror: (err) => {
            console.error('Session error:', err);
            stopSession();
          },
          onclose: () => {
            stopSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          systemInstruction: 'You are a supportive creative brainstormer named "The Muse". Keep responses concise, inspiring, and conversational. React to the user\'s creative ideas with enthusiasm.'
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error('Failed to start session:', err);
      setIsConnecting(false);
      alert('Could not access microphone or connect to AI.');
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto space-y-8">
      <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 shadow-xl text-center">
        <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
          The Muse
        </h2>
        <p className="text-slate-400 mb-8 max-w-lg mx-auto">
          Speak your ideas aloud. The Muse listens and responds in real-time to help you brainstorm your next masterpiece.
        </p>

        <div className="flex justify-center mb-8">
          <button
            onClick={isActive ? stopSession : startSession}
            disabled={isConnecting}
            className={`
              w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl relative
              ${isActive 
                ? 'bg-red-500 hover:bg-red-400 scale-110 shadow-red-500/20' 
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'}
              disabled:opacity-50 disabled:scale-100
            `}
          >
            {isActive && (
              <span className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-25" />
            )}
            {isConnecting ? (
               <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isActive ? (
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>

        <div className="text-sm font-medium tracking-wider uppercase">
          {isActive ? (
            <span className="text-red-400 animate-pulse">Session Live - Speak Now</span>
          ) : isConnecting ? (
            <span className="text-slate-500">Connecting to the Muse...</span>
          ) : (
            <span className="text-slate-500">Ready to listen</span>
          )}
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-2xl border border-slate-800 h-[400px] flex flex-col">
        <div className="p-4 border-b border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-widest">
          Session Transcript
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {transcripts.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-600 text-sm italic">
              Transcription will appear here...
            </div>
          ) : (
            transcripts.map((t, i) => {
              const isUser = t.startsWith('User:');
              return (
                <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    isUser ? 'bg-emerald-600/20 text-emerald-100 border border-emerald-500/30' : 'bg-slate-800 text-slate-200 border border-slate-700'
                  }`}>
                    {t.replace(/^(User|Gemini): /, '')}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveBrainstorm;
