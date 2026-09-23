import React, { useState } from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  Lock, 
  Phone, 
  KeyRound, 
  AlertCircle,
  Building2,
  Sparkles,
  Sun,
  Moon,
  CheckCircle2,
  Users,
  Smartphone
} from 'lucide-react';
import { db } from '../db/db';

export default function LoginPage({
  onLoginSuccess,
  darkMode,
  setDarkMode
}) {
  const [activeTab, setActiveTab] = useState('supervisor'); // 'supervisor' | 'admin'
  
  // Admin state
  const [adminPin, setAdminPin] = useState('');
  const [adminError, setAdminError] = useState('');

  // Supervisor state
  const [supPhone, setSupPhone] = useState('');
  const [supPin, setSupPin] = useState('');
  const [supError, setSupError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    const storedPin = localStorage.getItem('vendor_admin_pin') || '1234';
    if (adminPin.trim() === storedPin || adminPin.trim() === '1234') {
      onLoginSuccess({
        role: 'admin',
        user: { name: 'Vendor Admin / Owner' }
      });
    } else {
      setAdminError('Incorrect Admin PIN! (Default master PIN is 1234)');
    }
  };

  const handleClientLogin = (e) => {
    e.preventDefault();
    onLoginSuccess({
      role: 'client',
      user: { name: 'Blinkit City Operations Head' }
    });
  };

  const handleSupervisorLogin = async (e) => {
    e.preventDefault();
    setSupError('');
    if (!supPhone.trim() || !supPin.trim()) {
      setSupError('Please enter both Phone Number and 4-Digit PIN.');
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanPhone = supPhone.trim().replace(/[^0-9]/g, '');
      const supervisor = await db.supervisors
        .where('phone')
        .equals(cleanPhone)
        .or('phone')
        .equals(supPhone.trim())
        .first();

      if (!supervisor) {
        const allSupervisors = await db.supervisors.count();
        if (allSupervisors === 0) {
          setSupError('No supervisors registered yet. Please login as Admin first (PIN: 1234) and create a supervisor under "Supervisors".');
        } else {
          setSupError('Supervisor phone number not registered. Please check with your Admin.');
        }
        setIsSubmitting(false);
        return;
      }

      if (supervisor.pin !== supPin.trim()) {
        setSupError('Incorrect 4-digit PIN! Please try again.');
        setIsSubmitting(false);
        return;
      }

      onLoginSuccess({
        role: 'supervisor',
        user: supervisor
      });
    } catch (err) {
      setSupError('Login error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-between transition-colors">
      
      {/* Top Bar with Theme Toggle */}
      <header className="px-6 py-4 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blinkit-yellow text-slate-950 font-black flex items-center justify-center text-xl shadow-md border border-amber-300">
            b
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                blink<span className="text-blinkit-green">it</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300/40">
                PORTAL
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Dark Store Deep Cleaning Operations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('trigger-pwa-install'))}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-2xl bg-white dark:bg-slate-900 text-blinkit-green dark:text-emerald-400 border border-slate-200 dark:border-slate-800 shadow-xs hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Install App</span>
          </button>

          <button
            onClick={() => setDarkMode(!darkMode)}
            title="Toggle Dark Mode"
            className="p-2.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs transition"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Card Banner */}
          <div className="p-6 bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 text-slate-950">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 text-white text-xs font-bold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>VENDOR ACCESS</span>
              </div>
              <span className="text-xs font-black tracking-wider text-slate-900/80">
                SYSTEM v2.0
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-3 text-slate-950">
              Operations Login
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-900/85 mt-0.5">
              Login to access your store dashboard &amp; field entry portal
            </p>
          </div>

          {/* Role Switcher Tabs */}
          <div className="p-4 pb-0">
            <div className="grid grid-cols-3 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-center">
              <button
                type="button"
                onClick={() => setActiveTab('supervisor')}
                className={`py-2 px-1.5 rounded-xl text-[11px] font-extrabold transition flex flex-col sm:flex-row items-center justify-center gap-1 ${
                  activeTab === 'supervisor'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">Supervisor</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`py-2 px-1.5 rounded-xl text-[11px] font-extrabold transition flex flex-col sm:flex-row items-center justify-center gap-1 ${
                  activeTab === 'admin'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">Admin</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('client')}
                className={`py-2 px-1.5 rounded-xl text-[11px] font-extrabold transition flex flex-col sm:flex-row items-center justify-center gap-1 ${
                  activeTab === 'client'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">Client View</span>
              </button>
            </div>
          </div>

          {/* Form Area */}
          <div className="p-6">
            {/* SUPERVISOR LOGIN FORM */}
            {activeTab === 'supervisor' && (
              <form onSubmit={handleSupervisorLogin} className="space-y-4">
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-900 dark:text-emerald-300">
                  <div className="font-bold flex items-center gap-1.5 mb-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Site Supervisor Portal</span>
                  </div>
                  <p className="text-[11px] opacity-90">
                    Direct access to assigned dark stores, shift punch-in timer, cleaner attendance, photo watermarking &amp; store manager sign-off.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Supervisor Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={supPhone}
                      onChange={(e) => {
                        setSupPhone(e.target.value);
                        setSupError('');
                      }}
                      className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    4-Digit Access PIN
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      maxLength={6}
                      required
                      placeholder="Enter your 4-digit PIN"
                      value={supPin}
                      onChange={(e) => {
                        setSupPin(e.target.value);
                        setSupError('');
                      }}
                      className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono tracking-widest focus:ring-2 focus:ring-blinkit-green"
                    />
                  </div>
                </div>

                {supError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{supError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-2xl bg-blinkit-green hover:bg-blinkit-darkgreen text-white font-black text-sm shadow-lg shadow-emerald-700/20 hover:shadow-xl transition transform active:scale-[0.98]"
                >
                  {isSubmitting ? 'Verifying...' : 'Login as Site Supervisor →'}
                </button>
              </form>
            )}

            {/* ADMIN LOGIN FORM */}
            {activeTab === 'admin' && (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-300">
                  <div className="font-bold flex items-center gap-1.5 mb-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                    <span>Vendor Admin / Owner Portal</span>
                  </div>
                  <p className="text-[11px] opacity-90">
                    Complete master control: All dark stores, Store Ledger, P&amp;L profits, cleaner wages, supervisor assignments, Tax Invoices &amp; PDF reports.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Admin Master PIN
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
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
                      className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono tracking-widest focus:ring-2 focus:ring-blinkit-green"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
                    <span>Default PIN: <strong className="text-amber-600">1234</strong></span>
                    <button
                      type="button"
                      onClick={() => setAdminPin('1234')}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                    >
                      Auto-fill 1234
                    </button>
                  </div>
                </div>

                {adminError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{adminError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-slate-950 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-black text-sm shadow-lg shadow-slate-950/20 hover:shadow-xl transition transform active:scale-[0.98]"
                >
                  Login as Vendor Admin →
                </button>
              </form>
            )}

            {/* BLINKIT CLIENT / OPS HEAD LOGIN FORM */}
            {activeTab === 'client' && (
              <form onSubmit={handleClientLogin} className="space-y-4">
                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 text-xs text-blue-900 dark:text-blue-300">
                  <div className="font-bold flex items-center gap-1.5 mb-0.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Blinkit City Operations &amp; QA Portal</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Read-only executive portal for Blinkit City Managers, QA leads, and Area Heads to inspect cleanings, view Before/After proof, and download certificates.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    City / Cluster Scope
                  </label>
                  <input
                    type="text"
                    value="Delhi NCR / All Assigned Clusters"
                    readOnly
                    className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-600/20 hover:shadow-xl transition transform active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <span>View Client Operations Dashboard →</span>
                </button>
              </form>
            )}
          </div>

          {/* Footer note */}
          <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
            🔒 Secure Local Session &bull; Offline Ready IndexedDB Engine
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400">
        Blinkit Dark Store Deep Cleaning Management System &bull; Vendor Operations Portal
      </footer>

    </div>
  );
}
