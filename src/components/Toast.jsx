import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  AlertCircle, 
  X 
} from 'lucide-react';

let toastListeners = [];

export function showToast(type, message, title = '') {
  const newToast = {
    id: Date.now() + Math.random().toString(36).substring(2, 6),
    type, // 'success' | 'error' | 'warning' | 'info'
    message,
    title,
    createdAt: Date.now()
  };
  toastListeners.forEach(fn => fn(newToast));
}

export const toast = {
  success: (msg, title = 'Success') => showToast('success', msg, title),
  error: (msg, title = 'Error') => showToast('error', msg, title),
  warning: (msg, title = 'Warning') => showToast('warning', msg, title),
  info: (msg, title = 'Notice') => showToast('info', msg, title)
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleNewToast = (toastItem) => {
      setToasts(prev => [toastItem, ...prev].slice(0, 5));
    };
    toastListeners.push(handleNewToast);
    return () => {
      toastListeners = toastListeners.filter(fn => fn !== handleNewToast);
    };
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div 
      aria-live="polite"
      className="fixed bottom-4 right-4 z-100 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-[calc(100%-2rem)] pointer-events-none"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    success: {
      border: 'border-emerald-500/40 dark:border-emerald-500/30',
      bg: 'bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white',
      accent: 'bg-emerald-500 text-white',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
      bar: 'bg-emerald-500'
    },
    error: {
      border: 'border-rose-500/40 dark:border-rose-500/30',
      bg: 'bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white',
      accent: 'bg-rose-500 text-white',
      icon: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
      bar: 'bg-rose-500'
    },
    warning: {
      border: 'border-amber-500/40 dark:border-amber-500/30',
      bg: 'bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white',
      accent: 'bg-amber-500 text-white',
      icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
      bar: 'bg-amber-500'
    },
    info: {
      border: 'border-blue-500/40 dark:border-blue-500/30',
      bg: 'bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white',
      accent: 'bg-blue-500 text-white',
      icon: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
      bar: 'bg-blue-500'
    }
  }[toast.type] || {
    border: 'border-slate-300 dark:border-slate-700',
    bg: 'bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white',
    icon: <Info className="w-5 h-5 text-slate-500 shrink-0" />,
    bar: 'bg-slate-500'
  };

  return (
    <div 
      className={`pointer-events-auto relative overflow-hidden rounded-2xl border ${config.border} ${config.bg} p-3.5 shadow-2xl backdrop-blur-md flex items-start gap-3 transition-all transform animate-in slide-in-from-bottom-3 duration-200`}
    >
      <div className="mt-0.5">{config.icon}</div>
      <div className="flex-1 min-w-0 pr-2">
        {toast.title && (
          <h4 className="text-xs font-black tracking-tight text-slate-900 dark:text-white leading-tight">
            {toast.title}
          </h4>
        )}
        <p className="text-[12px] text-slate-600 dark:text-slate-300 mt-0.5 break-words leading-snug">
          {toast.message}
        </p>
      </div>
      <button
        onClick={onClose}
        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Auto-dismiss progress bar */}
      <div 
        className={`absolute bottom-0 left-0 right-0 h-0.5 ${config.bar} animate-toastProgress`} 
      />
    </div>
  );
}
