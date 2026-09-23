import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Trash2, RotateCcw } from 'lucide-react';

export default function AudioRecorder({
  audioUrl,
  onAudioChange
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setRecordTime(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert('Aapke browser me mic audio recording support nahi hai.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = reader.result;
          onAudioChange(base64Data);
        };
        reader.readAsDataURL(audioBlob);

        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert('Microphone access denied ya mic available nahi hai: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Mic className="w-3.5 h-3.5 text-indigo-500" />
          <span>Supervisor Audio Voice Note (Optional)</span>
        </span>
        <span className="text-[11px] text-slate-400">Hindi ya English me bol kar remark dalein</span>
      </div>

      {!audioUrl && !isRecording && (
        <button
          type="button"
          onClick={startRecording}
          className="w-full py-2.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800 transition flex items-center justify-center gap-2"
        >
          <Mic className="w-4 h-4 text-indigo-600 animate-pulse" />
          <span>🎙️ Tap to Record Voice Note (Bol Kar Batayein)</span>
        </button>
      )}

      {isRecording && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
            <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
              Recording in progress... {formatTime(recordTime)}
            </span>
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
          >
            <Square className="w-3.5 h-3.5 fill-white" />
            <span>Stop Recording</span>
          </button>
        </div>
      )}

      {audioUrl && !isRecording && (
        <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <audio controls src={audioUrl} className="h-8 flex-1" />
          <button
            type="button"
            onClick={() => onAudioChange('')}
            title="Delete / Re-record"
            className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
