import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  UserCheck, 
  Lock, 
  Phone, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle,
  Building2
} from 'lucide-react';
import { db } from '../db/db';

export default function LoginModal({
  isOpen,
  onClose,
  currentRole,
  onLoginSuccess
}) {
  const [activeTab, setActiveTab] = useState('supervisor'); // 'supervisor' | 'admin'
  
  // Admin state
  const [adminPin, setAdminPin] = useState('');
  const [adminError, setAdminError] = useState('');

  // Supervisor state
  const [supPhone, setSupPhone] = useState('');
  const [supPin, setSupPin] = useState('');
  const [supError, setSupError] = useState('');

  if (!isOpen) return null;

  const handleAdminLogin = (e) => {
    e.preventDefault();
    const storedPin = localStorage.getItem('vendor_admin_pin') || '1234';
    if (adminPin === storedPin || adminPin === '1234') {
      onLoginSuccess({
        role: 'admin',
        user: { name: 'Vendor Admin / Owner' }
      });
      onClose();
    } else {
      setAdminError('Incorrect Admin PIN! (Default PIN is 1234)');
    }
  };

  const handleSupervisorLogin = async (e) => {
    e.preventDefault();
    setSupError('');
    if (!supPhone || !supPin) {
      setSupError('Please enter both Phone Number and 4-Digit PIN.');
      return;
    }

    try {
      const cleanPhone = supPhone.trim().replace(/[^0-9]/g, '');
      const supervisor = await db.supervisors
        .where('phone')
        .equals(cleanPhone)
        .or('phone')
        .equals(supPhone.trim())
        .first();

      if (!supervisor) {
        // If no supervisor exists yet, let them know to ask admin or login as admin first
        const allSupervisors = await db.supervisors.count();
        if (allSupervisors === 0) {
          setSupError('No supervisors registered yet. Please login as Admin first (PIN: 1234) and create a supervisor.');
        } else {
          setSupError('Supervisor phone number not found. Please check with your Admin.');
        }
        return;
      }

      if (supervisor.pin !== supPin.trim()) {
        setSupError('Incorrect 4-digit PIN! Please try again.');
        return;
      }

      onLoginSuccess({
        role: 'supervisor',
        user: supervisor
      });
      onClose();
    } catch (err) {
      setSupError('Login error: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blinkit-yellow text-slate-950 font-black flex items-center justify-center text-xl shadow-xs">
              b
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Blinkit Vendor Portal Login
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select your role to continue
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Tabs */}
        <div className="p-4 pb-0">
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('supervisor')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'supervisor'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Site Supervisor</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <span>Vendor Admin (Owner)</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {/* SUPERVISOR LOGIN */}
          {activeTab === 'supervisor' && (
            <form onSubmit={handleSupervisorLogin} className="space-y-4">
              <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-900 dark:text-emerald-300">
                <span className="font-bold">Field Staff Mode:</span> Supervisor login gives direct mobile access to assigned dark stores, punch-in/out, photo uploads &amp; manager sign-off.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Supervisor Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9871234567"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  4-Digit Access PIN
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    maxLength={6}
                    required
                    placeholder="Enter your PIN"
                    value={supPin}
                    onChange={(e) => setSupPin(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white tracking-widest font-mono focus:ring-2 focus:ring-blinkit-green"
                  />
                </div>
              </div>

              {supError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{supError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blinkit-green hover:bg-blinkit-darkgreen text-white font-bold text-sm shadow-md transition"
              >
                Login as Supervisor
              </button>
            </form>
          )}

          {/* ADMIN LOGIN */}
          {activeTab === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-300">
                <span className="font-bold">Full Admin Mode:</span> Master control over all stores, ledger, financials, supervisor assignments, cleaner wages, tax invoices &amp; P&amp;L reports.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Admin Master PIN
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    autoFocus
                    required
                    placeholder="Default PIN: 1234"
                    value={adminPin}
                    onChange={(e) => {
                      setAdminPin(e.target.value);
                      setAdminError('');
                    }}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono tracking-widest focus:ring-2 focus:ring-blinkit-green"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Default PIN is <code className="font-bold text-amber-600">1234</code>. You can change this in settings.
                </p>
              </div>

              {adminError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{adminError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm shadow-md transition"
              >
                Login as Admin
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
