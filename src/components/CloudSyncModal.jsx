import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  RefreshCw, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Shield,
  Server,
  Database,
  Smartphone,
  Laptop,
  Check
} from 'lucide-react';
import { getCloudConfig, saveCloudConfig, performCloudSync, getApiUrl } from '../utils/cloudSync';
import { db } from '../db/db';

export default function CloudSyncModal({ isOpen, onClose }) {
  const [config, setConfig] = useState(getCloudConfig());
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [autoSync, setAutoSync] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [serverHealth, setServerHealth] = useState(null);
  const [showAdvancedSupabase, setShowAdvancedSupabase] = useState(false);

  const checkServer = async () => {
    try {
      const res = await fetch(getApiUrl('/api/health'));
      if (res.ok) {
        const data = await res.json();
        setServerHealth(data);
      } else {
        setServerHealth({ status: 'static_mode', message: 'Running in static client mode' });
      }
    } catch {
      setServerHealth({ status: 'offline', message: 'Server not reachable directly' });
    }
  };

  useEffect(() => {
    if (isOpen) {
      const current = getCloudConfig();
      setConfig(current);
      setSupabaseUrl(current.supabaseUrl || '');
      setSupabaseKey(current.supabaseKey || '');
      setAutoSync(current.autoSync !== false);
      setSyncResult(null);
      checkServer();
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
      checkServer();
    } catch (err) {
      setSyncResult({ success: false, message: err.message });
    } finally {
      setIsSyncing(false);
    }
  };

  const isServerConnected = serverHealth && serverHealth.status === 'ok';

  return (
    <div 
      className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blinkit-green/10 text-blinkit-green dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center border border-blinkit-green/20">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Global Database &amp; Device Sync
              </h3>
              <p className="text-xs text-slate-500">
                Desktop aur Mobile ke beech live data synchronization
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

        {/* Live Server Database Status Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-850 dark:to-slate-800 border border-slate-200 dark:border-slate-750 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-3 h-3 rounded-full ${isServerConnected ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                  <span>
                    {isServerConnected ? 'Render Server Database: Connected & Live' : 'Global 2-Way Sync Engine: Ready'}
                  </span>
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Last Synced: {config.lastSyncTime ? new Date(config.lastSyncTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Ready to sync'}
                </p>
              </div>
            </div>

            <button
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blinkit-green hover:bg-blinkit-darkgreen text-white font-bold text-xs shadow-md transition disabled:opacity-50 active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>

          {/* Sync status feedback */}
          {syncResult && (
            <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
              syncResult.success 
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}>
              {syncResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
              <span>{syncResult.message}</span>
            </div>
          )}

          {/* Device Sync Visualizer */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-around text-center text-[11px] text-slate-600 dark:text-slate-300">
            <div className="flex flex-col items-center gap-1">
              <Laptop className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span className="font-semibold">Desktop / Laptop</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black">
                ⇄ 2-WAY SYNC ⇄
              </div>
              <span className="text-[10px] text-slate-400">Automatic every 15s</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Smartphone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold">Mobile App</span>
            </div>
          </div>
        </div>

        {/* Hindi Instructions: How data syncs */}
        <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
          <p className="font-bold flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Desktop &amp; Mobile Sync Kaise Kaam Karta Hai:</span>
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300 pl-1 text-[11px] leading-relaxed">
            <li>Aap jab bhi <strong>Desktop</strong> par koi store ya cleaning record save karenge, wo automatically Render server database par save ho jata hai.</li>
            <li>Jab aap <strong>Mobile</strong> par wahi link open karenge, to mobile app server se sara data automatically download karke screen par dikha dega.</li>
            <li>Supervisor agar mobile se punch-in/punch-out ya photo upload karega, to wo bhi desktop par real-time dikhega!</li>
          </ul>
        </div>

        {/* Advanced External Supabase Cloud Options (Optional Collapsible) */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setShowAdvancedSupabase(!showAdvancedSupabase)}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-between w-full py-1"
          >
            <span>Optional: External Supabase PostgreSQL Database</span>
            <span>{showAdvancedSupabase ? '▲ Hide' : '▼ Setup (Optional)'}</span>
          </button>

          {showAdvancedSupabase && (
            <form onSubmit={handleSaveConfig} className="mt-3 space-y-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://yourproject.supabase.co"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Supabase Anon / Public Key
                </label>
                <input
                  type="password"
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-sm hover:bg-slate-800 transition"
              >
                Save Supabase Credentials
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs transition active:scale-95"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
