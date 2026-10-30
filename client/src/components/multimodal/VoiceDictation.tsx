import React, { useState, useEffect, useRef } from 'react';
import { LanguageCode } from '../../i18n/translations';

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
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Map language code to standard speech recognition tags
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
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const startListening = () => {
    setErrorMessage(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setErrorMessage('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechLangCode;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const newSpeech = (finalTranscript || interimTranscript).trim();
        if (newSpeech) {
          // Append if current text already exists, avoiding duplicate words
          const separator = currentText.length > 0 && !currentText.endsWith(' ') ? ' ' : '';
          const updated = currentText ? `${currentText}${separator}${newSpeech}` : newSpeech;
          onTranscriptChange(updated);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access denied. Please click the camera/mic icon in your browser address bar to allow microphone permissions.');
        } else if (event.error === 'no-speech') {
          // Normal timeout if user was silent
        } else {
          setErrorMessage(`Speech recognition error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to initialize speech recognition:', err);
      setIsListening(false);
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
    }
    setIsListening(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {!isListening ? (
            <button
              type="button"
              onClick={startListening}
              className="px-3.5 py-1.5 bg-[#1C1C1C] hover:bg-[#2A2A2A] text-brandCream border border-[#2A2A2A] hover:border-brandLime rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 shadow-[2px_2px_0px_#0A0A0A]"
            >
              <span className="material-symbols-outlined text-base text-brandLime">mic</span>
              Voice Dictation ({langNames[language]})
            </button>
          ) : (
            <button
              type="button"
              onClick={stopListening}
              className="px-3.5 py-1.5 bg-red-600 text-white font-mono font-bold text-xs uppercase rounded-lg transition-all flex items-center gap-2 animate-pulse shadow-[2px_2px_0px_#0A0A0A]"
            >
              <span className="material-symbols-outlined text-base">stop_circle</span>
              Listening ({speechLangCode}) — Click to Stop
            </button>
          )}

          {isListening && (
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-brandLime">
              <span className="w-2 h-2 rounded-full bg-brandLime animate-ping" />
              <span>Speak clearly into your microphone...</span>
            </div>
          )}
        </div>

        <span className="text-[10px] font-mono text-neutral-400">
          Recognizes native {language === 'ta' ? 'Tamil' : language === 'hi' ? 'Hindi' : 'English'} speech
        </span>
      </div>

      {!isSupported && (
        <div className="p-2.5 bg-yellow-950/30 border border-yellow-700/50 rounded-lg text-xs font-mono text-yellow-300 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">info</span>
          <span>Web Speech API is not enabled in this browser. Please use Chrome/Edge or type your complaint manually.</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-2.5 bg-red-950/40 border border-red-700/50 rounded-lg text-xs font-mono text-red-300 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
