import React from 'react';
import { AlertTriangle, Trash2, X, Check } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false
}) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
        
        {/* Icon & Title */}
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
            isDanger 
              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900' 
              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900'
          }`}>
            {isDanger ? <Trash2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug">
              {title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-line leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition active:scale-95 flex items-center gap-1.5 ${
              isDanger 
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' 
                : 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900'
            }`}
          >
            {isDanger ? <Trash2 className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            <span>{confirmText}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
