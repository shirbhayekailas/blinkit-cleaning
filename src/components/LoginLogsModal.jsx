import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  X, 
  History, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  ShieldCheck, 
  Clock, 
  Smartphone, 
  Monitor, 
  UserCheck, 
  Building2, 
  AlertCircle,
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { db } from '../db/db';
import { exportLoginLogsToCSV } from '../utils/auditLogger';

export default function LoginLogsModal({
  isOpen,
  onClose,
  currentUserRole = 'admin'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'admin' | 'manager' | 'supervisor' | 'client' | 'failed'
  const [timeFilter, setTimeFilter] = useState('all'); // 'all' | 'today' | 'week'

  // Reactive query of login logs from Dexie
  const logsData = useLiveQuery(async () => {
    try {
      if (!db.loginLogs) return [];
      const list = await db.loginLogs.toArray();
      return list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    } catch (e) {
      console.error('Dexie loginLogs query error:', e);
      return [];
    }
  }, []);

  const logs = Array.isArray(logsData) ? logsData : [];

  // Close on Escape key press
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  // Filter logs
  const filteredLogs = logs.filter(log => {
    // Role filter
    if (roleFilter === 'failed') {
      if (log.status !== 'Failed') return false;
    } else if (roleFilter !== 'all') {
      if (log.role !== roleFilter) return false;
    }

    // Time filter
    if (timeFilter !== 'all' && log.timestamp) {
      const logDate = new Date(log.timestamp);
      const now = new Date();
      if (timeFilter === 'today') {
        if (logDate.toDateString() !== now.toDateString()) return false;
      } else if (timeFilter === 'week') {
        const diffDays = (now - logDate) / (1000 * 60 * 60 * 24);
        if (diffDays > 7) return false;
      }
    }

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = (log.userName || '').toLowerCase().includes(q);
      const matchId = (log.loginId || '').toLowerCase().includes(q);
      const matchDevice = (log.device || '').toLowerCase().includes(q);
      const matchRole = (log.role || '').toLowerCase().includes(q);
      if (!matchName && !matchId && !matchDevice && !matchRole) return false;
    }

    return true;
  });

  // Analytics summary
  const todayStr = new Date().toDateString();
  const todayLogins = logs.filter(l => l.timestamp && new Date(l.timestamp).toDateString() === todayStr);
  const totalFailed = logs.filter(l => l.status === 'Failed').length;

  const handleClearLogs = async () => {
    if (currentUserRole !== 'admin') {
      alert('Sirf Admin login logs history clear kar sakta hai.');
      return;
    }

    if (confirm('Kya aap sach me sare Login Audit Logs delete karna chahte hain?')) {
      try {
        if (db.loginLogs) {
          await db.loginLogs.clear();
        }
      } catch (err) {
        alert('Error clearing logs: ' + err.message);
      }
    }
  };

  const formatTimestamp = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return isoString;
    }
  };

  const getRelativeTime = (isoString) => {
    if (!isoString) return '';
    try {
      const diffSec = Math.floor((new Date() - new Date(isoString)) / 1000);
      if (diffSec < 60) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDay = Math.floor(diffHr / 24);
      return `${diffDay}d ago`;
    } catch {
      return '';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-100 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-black flex items-center justify-center shadow-xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Login Activity &amp; Audit Logs
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  REAL-TIME
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track kisne, kab aur kis device se login kiya (Admin, Manager, Supervisors &amp; Client)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => exportLoginLogsToCSV(filteredLogs)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-xs transition"
              title="Download CSV Audit Report"
            >
              <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Export CSV</span>
            </button>

            {currentUserRole === 'admin' && (
              <button
                type="button"
                onClick={handleClearLogs}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold text-xs transition"
                title="Clear All Login History"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Logs</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Analytics Top Cards */}
        <div className="px-6 py-3.5 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-850 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">Total Logins</span>
            <span className="text-base font-black text-slate-900 dark:text-white">{logs.length}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">Today's Logins</span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{todayLogins.length}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">Failed Attempts</span>
            <span className={`text-base font-black ${totalFailed > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
              {totalFailed}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">Latest Activity</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate block">
              {logs.length > 0 ? getRelativeTime(logs[0].timestamp) : 'None'}
            </span>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user name, phone, login ID or device..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {/* Role Pills */}
            {[
              { id: 'all', label: 'All Roles' },
              { id: 'admin', label: '👑 Admin' },
              { id: 'manager', label: '👔 Manager' },
              { id: 'supervisor', label: '👷 Supervisor' },
              { id: 'client', label: '🏢 Client' },
              { id: 'failed', label: '⚠️ Failed' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRoleFilter(tab.id)}
                className={`px-2.5 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition ${
                  roleFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}

            {/* Time Filter Dropdown */}
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Dates</option>
              <option value="today">Today Only</option>
              <option value="week">Past 7 Days</option>
            </select>
          </div>
        </div>

        {/* Logs List Table */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => {
              const isSuccess = log.status === 'Success';
              const roleColor = 
                log.role === 'admin' 
                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300' 
                  : log.role === 'manager'
                    ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300'
                    : log.role === 'client'
                      ? 'bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300'
                      : log.role === 'supervisor'
                        ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300'
                        : 'bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300';

              const roleEmoji = 
                log.role === 'admin' ? '👑' :
                log.role === 'manager' ? '👔' :
                log.role === 'client' ? '🏢' :
                log.role === 'supervisor' ? '👷' : '⚠️';

              return (
                <div
                  key={log.id}
                  className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSuccess
                      ? 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                  }`}
                >
                  {/* Left: User & Role Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-slate-100 dark:bg-slate-800 shadow-xs border border-slate-200 dark:border-slate-700">
                      {roleEmoji}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {log.userName}
                        </span>
                        
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${roleColor}`}>
                          {(log.role || 'USER').toUpperCase()}
                        </span>

                        {isSuccess ? (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Success</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                            <AlertCircle className="w-3 h-3" />
                            <span>Failed Login</span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          ID: {log.loginId}
                        </span>
                        <span>&bull;</span>
                        <span className="text-[11px]">
                          {log.device || 'Browser'}
                        </span>
                        {log.notes && (
                          <>
                            <span>&bull;</span>
                            <span className="text-rose-500 text-[11px] font-medium">{log.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Date & Time */}
                  <div className="text-left sm:text-right text-xs shrink-0 self-start sm:self-center">
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center sm:justify-end gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatTimestamp(log.timestamp)}</span>
                    </div>
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold block sm:text-right">
                      {getRelativeTime(log.timestamp)}
                    </span>
                  </div>

                </div>
              );
            })
          ) : (
            <div className="p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
              <History className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                Koi login record nahi mila
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Jaise hi koi user ya supervisor login karega, unki entry yahan real-time record ho jayegi.
              </p>
            </div>
          )}
        </div>

        {/* Universal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => exportLoginLogsToCSV(filteredLogs)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Export CSV</span>
            </button>
            {currentUserRole === 'admin' && (
              <button
                type="button"
                onClick={handleClearLogs}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold text-xs transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear History</span>
                <span className="sm:hidden">Clear</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs transition active:scale-95 shadow-sm"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
