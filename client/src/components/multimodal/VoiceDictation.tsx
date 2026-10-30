import React, { useState, useEffect, useRef } from 'react';
import { LanguageCode } from '../../i18n/translations';
import { useTranslation } from '../../i18n/LanguageContext';

interface VoiceDictationProps {
  language: LanguageCode;
  onTranscriptChange: (text: string) => void;
  currentText: string;
}

export const VoiceDictation: React.FC<VoiceDictationProps> = ({
  language,
  onTranscriptChange,
  currentText,
}) => {
  const { t } = useTranslation();
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [liveInterim, setLiveInterim] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef<string>(currentText);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Sync latest text when NOT listening so edits before dictation are preserved
  useEffect(() => {
    if (!isListening) {
      baseTextRef.current = currentText;
    }
  }, [currentText, isListening]);

  // Map language code to standard regional speech recognition tags
  const speechLangCode =
    language === 'ta' ? 'ta-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';

  const langNames = {
    en: 'English (India)',
    ta: 'Tamil (தமிழ்)',
    hi: 'Hindi (हिन्दी)',
  };

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
    }

    return () => {
      stopListening();
    };
  }, []);

  // Setup live audio visualizer meter using Web Audio API
  const startAudioMeter = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateMeter = () => {
        if (!analyser) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        // Normalize to 0 - 100%
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (e) {
      console.warn('Audio meter initialization skipped:', e);
    }
  };

  const stopAudioMeter = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  };

  const startListening = async () => {
    setErrorMessage(null);
    setLiveInterim('');

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setErrorMessage(
        'Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.'
      );
      return;
    }

    // Freeze base text at the moment user starts speaking
    baseTextRef.current = currentText;

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }

      // Start audio meter for visual volume verification
      await startAudioMeter();

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechLangCode;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let sessionFinal = '';
        let sessionInterim = '';

        // Accumulate all results in current session
        for (let i = 0; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            sessionFinal += res[0].transcript + ' ';
          } else {
            sessionInterim += res[0].transcript;
          }
        }

        const combinedSession = (sessionFinal + sessionInterim).trim();
        setLiveInterim(sessionInterim || sessionFinal);

        if (combinedSession) {
          const base = baseTextRef.current ? baseTextRef.current.trim() : '';
          const fullText = base ? `${base} ${combinedSession}` : combinedSession;
          onTranscriptChange(fullText);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setErrorMessage(
            'Microphone access was denied. Please allow microphone permissions in your browser address bar.'
          );
          stopListening();
        } else if (event.error === 'no-speech') {
          // Normal timeout if user paused, keep listening
        } else if (event.error === 'network') {
          setErrorMessage(
            'Speech recognition network timeout. Ensure your device has an active internet connection.'
          );
          stopListening();
        } else {
          setErrorMessage(`Speech recognition error: ${event.error}`);
          stopListening();
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        stopAudioMeter();
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to initialize speech recognition:', err);
      setIsListening(false);
      stopAudioMeter();
      setErrorMessage(err.message || 'Could not access microphone.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    stopAudioMeter();
    setIsListening(false);
    setLiveInterim('');
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {!isListening ? (
            <button
              type="button"
              onClick={startListening}
              className="px-3.5 py-1.5 bg-[#1C1C1C] hover:bg-[#2A2A2A] text-brandCream border border-[#2A2A2A] hover:border-brandLime rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 shadow-[2px_2px_0px_#0A0A0A] cursor-pointer"
            >
              <span className="material-symbols-outlined text-base text-brandLime">mic</span>
              {t.complaintForm?.startDictation || 'Voice Dictation'} ({langNames[language]})
            </button>
          ) : (
            <button
              type="button"
              onClick={stopListening}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-mono font-bold text-xs uppercase rounded-lg transition-all flex items-center gap-2 shadow-[2px_2px_0px_#0A0A0A] cursor-pointer"
            >
              <span className="material-symbols-outlined text-base animate-pulse">stop_circle</span>
              {t.complaintForm?.stopDictation || 'Stop Listening'} ({speechLangCode})
            </button>
          )}

          {/* Live Volume Meter Bar */}
          {isListening && (
            <div className="flex items-center gap-2 bg-[#1C1C1C] border border-brandLime/40 rounded-lg px-2.5 py-1">
              <span className="w-2 h-2 rounded-full bg-brandLime animate-ping shrink-0" />
              <div className="flex items-center gap-0.5 h-3">
                {[15, 30, 45, 60, 75].map((threshold) => (
                  <span
                    key={threshold}
                    className={`w-1 rounded-full transition-all duration-75 ${
                      audioLevel >= threshold
                        ? 'bg-brandLime h-3'
                        : 'bg-neutral-700 h-1'
                    }`}
                  />
                ))}
              </div>
              <span className="font-mono text-[10px] text-brandLime font-bold uppercase">
                {audioLevel > 10 ? 'Detecting Speech' : 'Listening...'}
              </span>
            </div>
          )}
        </div>

        <span className="text-[10px] font-mono text-neutral-400">
          Native {language === 'ta' ? 'Tamil' : language === 'hi' ? 'Hindi' : 'English'} Recognition
        </span>
      </div>

      {/* Live Interim Transcript Strip */}
      {isListening && liveInterim && (
        <div className="p-2.5 bg-[#1F2314] border border-brandLime/60 rounded-xl text-xs font-mono text-brandLime animate-fadeIn flex items-center gap-2">
          <span className="material-symbols-outlined text-sm shrink-0">record_voice_over</span>
          <span className="italic truncate">&ldquo;{liveInterim}&rdquo;</span>
        </div>
      )}

      {/* Unsupported Browser Alert */}
      {!isSupported && (
        <div className="p-2.5 bg-yellow-950/30 border border-yellow-700/50 rounded-lg text-xs font-mono text-yellow-300 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">info</span>
          <span>{t.complaintForm?.speechNotSupported || 'Web Speech API is not supported in this browser. Please use Chrome/Edge or type manually.'}</span>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-2.5 bg-red-950/40 border border-red-700/50 rounded-lg text-xs font-mono text-red-300 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
