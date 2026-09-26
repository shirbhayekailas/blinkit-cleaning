import React, { useState } from 'react';
import { 
  X, 
  Database, 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';
import { fetchServerState, saveCleaning, saveStore } from '../services/api';

export default function BackupModal({
  isOpen,
  onClose,
  onDataRestored
}) {
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleExportBackup = async () => {
    try {
      const serverState = await fetchServerState();
      const backupData = {
        version: 2,
        exportedAt: new Date().toISOString(),
        serverState
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SK_Enterprises_Cleaning_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error generating backup: ' + err.message);
    }
  };

  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setRestoring(true);
        const data = JSON.parse(event.target.result);
        const state = data.serverState || data;
        const cleanings = state.cleanings || [];
        const stores = state.stores || [];

        if (!Array.isArray(cleanings) && !Array.isArray(stores)) {
          throw new Error('Invalid backup file format.');
        }

        // Restore stores first
        for (const st of stores) {
          await saveStore(st);
        }

        // Restore cleanings
        for (const cln of cleanings) {
          await saveCleaning(cln);
        }

        setMessage(`Successfully restored ${stores.length} stores & ${cleanings.length} cleaning records directly to server!`);
        if (onDataRestored) onDataRestored();
      } catch (err) {
        alert('Restore failed: ' + err.message);
      } finally {
        setRestoring(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div 
      className="fixed inset-0 z-100 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Data Backup & Restore
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Safely store or transfer all store logs & photos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs sm:text-sm">
          
          {message && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {/* Export */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="font-bold text-slate-900 dark:text-white">Export Full Database</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Download a JSON backup of all store records, payment logs, and before/after photos.
            </p>
            <button
              onClick={handleExportBackup}
              className="w-full py-2 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition"
            >
              <Download className="w-4 h-4" />
              <span>Download JSON Backup</span>
            </button>
          </div>

          {/* Import */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="font-bold text-slate-900 dark:text-white">Restore from Backup</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select a previously exported JSON backup file to restore records.
            </p>
            <label className="w-full py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition">
              <Upload className="w-4 h-4" />
              <span>{restoring ? 'Restoring Data...' : 'Choose Backup File (.json)'}</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                disabled={restoring}
                className="hidden"
              />
            </label>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
