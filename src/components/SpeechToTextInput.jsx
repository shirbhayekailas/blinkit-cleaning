import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Globe, Sparkles } from 'lucide-react';

export default function SpeechToTextInput({
  value = '',
  onChange,
  placeholder = 'Type or speak in Hindi / English...',
  rows = 3,
  className = ''
}) {
  const [isListening, setIsListening] = useState(false);
  const [lang, setLang] = useState('hi-IN'); // 'hi-IN' | 'en-IN'
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      if (currentTranscript) {
        const newValue = value ? `${value} ${currentTranscript.trim()}` : currentTranscript.trim();
        onChange(newValue);
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition event:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
    };
  }, [lang, value, onChange]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome on Android/Desktop.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = lang;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Speech start error:', err);
      }
    }
  };

  return (
    <div className="space-y-1.5 w-full">
      <div className="relative">
        <textarea
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full p-3 pr-24 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blinkit-green ${className}`}
        />

        {/* Voice Typing Floating Controls */}
        <div className="absolute right-2 top-2 flex items-center gap-1">
          {/* Language Selector */}
          <button
            type="button"
            onClick={() => setLang(lang === 'hi-IN' ? 'en-IN' : 'hi-IN')}
            className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
            title="Toggle Language"
          >
            {lang === 'hi-IN' ? '🇮🇳 हिन्दी' : '🇬🇧 ENG'}
          </button>

          {/* Mic Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-1.5 rounded-lg font-bold text-xs transition flex items-center justify-center shadow-xs ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
            }`}
            title={isListening ? 'Click to Stop Voice Typing' : 'Click to Speak (Voice Typing)'}
          >
            {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isListening && (
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-600 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-rose-600" />
          <span>Listening... Hindi me boliye, automatically type ho jayega.</span>
        </div>
      )}
    </div>
  );
}
