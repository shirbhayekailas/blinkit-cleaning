import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  X, 
  Database, 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';
import { fetchFullBackup, restoreDatabaseBackup } from '../services/api';
import { toast } from './Toast';

export default function BackupModal({
  isOpen,
  onClose,
  onDataRestored
}) {
  const { t } = useLanguage();
  const [restoring, setRestoring] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleExportBackup = async () => {
    setExporting(true);
    setErrorMsg('');
    try {
      // Always pull the full, fresh database from server (never an empty/stale file)
      const serverState = await fetchFullBackup();
      const backupData = {
        version: 3,
        exportedAt: new Date().toISOString(),
        counts: {
          cleanings: (serverState.cleanings || []).length,
          stores: (serverState.stores || []).length
        },
        serverState
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SK_Enterprises_Cleaning_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      toast.success(`Backup downloaded: ${backupData.counts.cleanings} cleanings, ${backupData.counts.stores} stores.`);
    } catch (err) {
      setErrorMsg('Backup error: ' + err.message);
      toast.error('Error generating backup: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleImportBackup = (e) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onerror = () => {
      setErrorMsg('File read nahi ho payi. Dobara try karein.');
    };
    reader.onload = async (event) => {
      setRestoring(true);
      setMessage('');
      setErrorMsg('');
      try {
        let data;
        try {
          data = JSON.parse(event.target.result);
        } catch {
          throw new Error('Yeh valid JSON backup file nahi hai.');
        }

        // Single request: server safely merges ALL collections (nothing existing is deleted)
        const result = await restoreDatabaseBackup(data);
        const s = result.summary || {};
        const parts = Object.entries(s)
          .filter(([, v]) => v.added + v.updated > 0)
          .map(([k, v]) => `${k}: +${v.added}${v.updated ? ` (${v.updated} updated)` : ''}`);

        const msg = parts.length > 0
          ? `Restore complete! ${parts.join(', ')}. Server par ab ${result.totalCleanings} cleanings aur ${result.totalStores} stores hain.`
          : `Server par saare records pehle se maujood the. Total: ${result.totalCleanings} cleanings, ${result.totalStores} stores.`;
        setMessage(msg);
        toast.success(msg, 'Backup Restored');
        if (onDataRestored) onDataRestored(true);
      } catch (err) {
        setErrorMsg('Restore failed: ' + err.message);
        toast.error('Restore failed: ' + err.message);
      } finally {
        setRestoring(false);
        input.value = ''; // allow choosing the same file again
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

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
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
              disabled={exporting}
              className="w-full py-2 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60"
            >
              {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>{exporting ? 'Server se data aa raha hai...' : 'Download JSON Backup'}</span>
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
