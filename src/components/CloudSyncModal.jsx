import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  RefreshCw, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Shield,
  Key,
  Globe
} from 'lucide-react';
import { getCloudConfig, saveCloudConfig, performCloudSync } from '../utils/cloudSync';

export default function CloudSyncModal({ isOpen, onClose }) {
  const [config, setConfig] = useState(getCloudConfig());
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [autoSync, setAutoSync] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const current = getCloudConfig();
      setConfig(current);
      setSupabaseUrl(current.supabaseUrl || '');
      setSupabaseKey(current.supabaseKey || '');
      setAutoSync(current.autoSync !== false);
      setSyncResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveConfig = (e) => {
    e.preventDefault();
    const updated = saveCloudConfig({
      supabaseUrl: supabaseUrl.trim(),
      supabaseKey: supabaseKey.trim(),
      autoSync
    });
    setConfig(updated);
    alert('Cloud Sync settings saved successfully!');
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await performCloudSync();
      setSyncResult(res);
      setConfig(getCloudConfig());
    } catch (err) {
      setSyncResult({ success: false, message: err.message });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Global Cloud Sync &amp; Database
              </h3>
              <p className="text-xs text-slate-500">
                View dark store deep cleaning data from anywhere in the world
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Sync Status Banner */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${navigator.onLine ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Network: {navigator.onLine ? 'Online (Connected)' : 'Offline (Local Only)'}
              </p>
              <p className="text-[11px] text-slate-500">
                Last Synced: {config.lastSyncTime ? new Date(config.lastSyncTime).toLocaleString('en-IN') : 'Not synced yet'}
              </p>
            </div>
          </div>

          <button
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blinkit-green hover:bg-blinkit-darkgreen text-white font-bold text-xs shadow-md transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>

        {syncResult && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            syncResult.success 
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200' 
              : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200'
          }`}>
            {syncResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{syncResult.message}</span>
          </div>
        )}

        {/* Supabase Cloud Setup Form */}
        <form onSubmit={handleSaveConfig} className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-blue-500" />
              <span>Supabase Cloud Connection (Free Postgres)</span>
            </h4>
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>Create Free Account</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Supabase Project URL
            </label>
            <input
              type="url"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Supabase Anon / Public Key
            </label>
            <input
              type="password"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              className="rounded text-blinkit-green focus:ring-blinkit-green"
            />
            <span>Automatically sync whenever phone connects to 4G / WiFi</span>
          </label>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-md hover:bg-slate-800 transition"
          >
            Save Cloud Settings
          </button>
        </form>

        {/* Informational Guidance */}
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-amber-600 shrink-0" />
            <span>How Offline-First Cloud Sync Works:</span>
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            1. Site supervisors make entries inside basement dark stores even with <strong>0% mobile network</strong>. All data is saved safely inside the phone.
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            2. As soon as they step outside or reach home, the app detects internet and pushes all entries to your Cloud database automatically.
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            3. You can open your admin dashboard on your mobile/laptop from any city and see live updates!
          </p>
        </div>

      </div>
    </div>
  );
}
