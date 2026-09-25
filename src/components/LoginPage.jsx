import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Sparkles, 
  Sun, 
  Moon, 
  Smartphone, 
  Eye, 
  EyeOff, 
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  RotateCcw,
  CheckCircle2,
  X,
  HelpCircle,
  RefreshCw,
  Building2,
  Briefcase
} from 'lucide-react';
import { db } from '../db/db';
import { logUserLogin } from '../utils/auditLogger';

export default function LoginPage({
  onLoginSuccess,
  darkMode,
  setDarkMode
}) {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot Password / Reset Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleUniversalLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');

    const inputId = loginId.trim();
    const inputPass = password.trim();

    if (!inputId || !inputPass) {
      setError('Please enter both Login ID and Password.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Check Admin Account (Configured by Owner)
      const adminId = (localStorage.getItem('vendor_admin_id') || 'admin').toLowerCase();
      const adminPin = localStorage.getItem('vendor_admin_pin') || '1234';

      if (inputId.toLowerCase() === adminId && inputPass === adminPin) {
        await logUserLogin({
          role: 'admin',
          userName: 'Vendor Admin / Owner',
          loginId: adminId,
          status: 'Success'
        });
        onLoginSuccess({
          role: 'admin',
          user: { name: 'Vendor Admin / Owner', loginId: adminId }
        });
        return;
      }

      // 2. Check Operations Manager Account
      const managerId = (localStorage.getItem('vendor_manager_id') || 'manager').toLowerCase();
      const managerPin = localStorage.getItem('vendor_manager_pin') || '1234';
      const managerName = localStorage.getItem('vendor_manager_name') || 'Operations Manager';

      if (inputId.toLowerCase() === managerId && inputPass === managerPin) {
        await logUserLogin({
          role: 'manager',
          userName: managerName,
          loginId: managerId,
          status: 'Success'
        });
        onLoginSuccess({
          role: 'manager',
          user: { name: managerName, loginId: managerId }
        });
        return;
      }

      // 3. Check Blinkit Client Ops Head Account
      const clientId = (localStorage.getItem('blinkit_client_id') || 'client').toLowerCase();
      const clientPin = localStorage.getItem('blinkit_client_pin') || '5678';
      const clientName = localStorage.getItem('blinkit_client_name') || 'Blinkit City Operations Head';

      if (inputId.toLowerCase() === clientId && inputPass === clientPin) {
        await logUserLogin({
          role: 'client',
          userName: clientName,
          loginId: clientId,
          status: 'Success'
        });
        onLoginSuccess({
          role: 'client',
          user: { name: clientName, loginId: clientId }
        });
        return;
      }

      // 4. Check Site Supervisors (by Mobile Number)
      const cleanPhone = inputId.replace(/[^0-9]/g, '');
      const supervisor = await db.supervisors
        .where('phone')
        .equals(cleanPhone)
        .or('phone')
        .equals(inputId)
        .first();

      if (supervisor && supervisor.pin === inputPass) {
        if (supervisor.active === false) {
          setError('This supervisor account has been deactivated. Please contact Admin.');
          await logUserLogin({
            role: 'supervisor',
            userName: supervisor.name,
            loginId: supervisor.phone,
            status: 'Failed',
            notes: 'Deactivated account attempt'
          });
          setIsSubmitting(false);
          return;
        }

        await logUserLogin({
          role: 'supervisor',
          userName: supervisor.name,
          loginId: supervisor.phone,
          status: 'Success'
        });
        onLoginSuccess({
          role: 'supervisor',
          user: supervisor
        });
        return;
      }

      // 5. Invalid credentials
      await logUserLogin({
        role: 'unknown',
        userName: 'Unrecognized User',
        loginId: inputId,
        status: 'Failed',
        notes: 'Invalid ID or Password'
      });
      setError('Invalid Login ID or Password. Agar password bhool gaye hain to neeche "Reset to Default" use karein.');
    } catch (err) {
      setError('Login error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset Admin PIN to factory default (ID: admin, PIN: 1234)
  const handleResetAdminToDefault = async () => {
    setIsResetting(true);
    try {
      localStorage.setItem('vendor_admin_id', 'admin');
      localStorage.setItem('vendor_admin_pin', '1234');
      localStorage.removeItem('admin_pin_changed');

      await logUserLogin({
        role: 'admin',
        userName: 'Vendor Admin / Owner',
        loginId: 'admin',
        status: 'Reset',
        notes: 'Admin Password Reset to Factory Default (1234)'
      });

      setLoginId('admin');
      setPassword('1234');
      setError('');
      setResetSuccess('Admin Master PIN successfully default "1234" par reset ho gaya hai! Fields auto-fill kar di gayi hain.');
    } catch (err) {
      setError('Reset failed: ' + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  // Reset All User Passwords to Factory Defaults
  const handleResetAllToDefault = async () => {
    if (!confirm('Kya aap sach me sabhi roles (Admin, Manager, Client, Supervisors) ke passwords default par reset karna chahte hain?')) {
      return;
    }

    setIsResetting(true);
    try {
      // 1. Admin
      localStorage.setItem('vendor_admin_id', 'admin');
      localStorage.setItem('vendor_admin_pin', '1234');
      localStorage.removeItem('admin_pin_changed');

      // 2. Manager
      localStorage.setItem('vendor_manager_id', 'manager');
      localStorage.setItem('vendor_manager_pin', '1234');

      // 3. Client
      localStorage.setItem('blinkit_client_id', 'client');
      localStorage.setItem('blinkit_client_pin', '5678');

      // 4. Supervisors in Dexie DB
      const allSups = await db.supervisors.toArray();
      for (const sup of allSups) {
        await db.supervisors.update(sup.id, {
          pin: '1234',
          hasChangedPin: false
        });
      }

      await logUserLogin({
        role: 'admin',
        userName: 'Vendor Admin / Owner',
        loginId: 'admin',
        status: 'Reset',
        notes: 'All roles reset to factory default credentials'
      });

      setLoginId('admin');
      setPassword('1234');
      setError('');
      setResetSuccess('Sabhi roles (Admin: 1234, Manager: 1234, Client: 5678, Supervisors: 1234) successfully default par reset ho gaye!');
    } catch (err) {
      setError('Reset failed: ' + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-between transition-colors">
      
      {/* Top Bar with Theme Toggle */}
      <header className="px-4 sm:px-6 py-4 flex items-center justify-between max-w-5xl mx-auto w-full">
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
            <span className="hidden sm:inline">Install App</span>
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

      {/* Main Single Login Card */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Card Banner */}
          <div className="p-6 bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 text-slate-950">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 text-white text-xs font-bold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>OPERATIONS ACCESS</span>
              </div>
              <span className="text-xs font-black tracking-wider text-slate-900/80">
                SYSTEM v2.0
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-3 text-slate-950">
              Operations Sign In
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-900/85 mt-0.5">
              Enter your assigned Login ID &amp; Password to access your portal
            </p>
          </div>

          {/* Form Area */}
          <div className="p-6">
            <form onSubmit={handleUniversalLogin} className="space-y-4">
              
              {/* Login ID Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Login ID / Mobile Number
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. admin, manager, client, or mobile"
                    value={loginId}
                    onChange={(e) => {
                      setLoginId(e.target.value);
                      setError('');
                    }}
                    className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green font-medium"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password / PIN
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter your PIN"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono tracking-widest focus:ring-2 focus:ring-blinkit-green"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Forgot Password / Reset PIN Link */}
                <div className="flex items-center justify-between text-xs pt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setResetSuccess('');
                      setIsForgotModalOpen(true);
                    }}
                    className="font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 transition"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Forgot Password? Reset to Default</span>
                  </button>

                  <span className="text-[11px] text-slate-400 font-medium">
                    Default: <code className="font-mono font-bold text-slate-600 dark:text-slate-300">1234</code>
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-2 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Reset Success Message */}
              {resetSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-2 animate-in fade-in duration-150">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{resetSuccess}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-slate-950 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-black text-sm shadow-lg shadow-slate-950/20 hover:shadow-xl transition transform active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>{isSubmitting ? 'Verifying Credentials...' : 'Sign In to Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </form>
          </div>

          {/* Footer note */}
          <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Admin Managed Access &bull; Role-Based Secure Portals</span>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400">
        Blinkit Dark Store Deep Cleaning Management System &bull; Vendor Operations Portal
      </footer>


      {/* FORGOT PASSWORD & RESET TO DEFAULT MODAL */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-amber-50/60 dark:bg-amber-950/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-400 text-slate-950 font-black flex items-center justify-center shadow-xs">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Password Reset &amp; Recovery
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Restore default access credentials
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsForgotModalOpen(false)}
                className="p-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              
              {/* Info Box */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-amber-500" />
                  <span>Password Bhool Gaye Hain?</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  Agar aap Admin password bhool gaye hain, to aap Master PIN ko default <strong className="font-bold text-amber-600">"1234"</strong> aur ID <strong className="font-bold text-amber-600">"admin"</strong> par reset kar sakte hain. Login karne ke baad aap dobara naya password set kar sakenge.
                </p>
              </div>

              {/* Default Credential Reference */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                  <div className="font-bold text-amber-900 dark:text-amber-200">👑 Admin Default:</div>
                  <div className="text-slate-600 dark:text-slate-300 mt-0.5">ID: <code className="font-bold">admin</code></div>
                  <div className="text-slate-600 dark:text-slate-300">PIN: <code className="font-bold">1234</code></div>
                </div>

                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                  <div className="font-bold text-indigo-900 dark:text-indigo-200">👔 Manager Default:</div>
                  <div className="text-slate-600 dark:text-slate-300 mt-0.5">ID: <code className="font-bold">manager</code></div>
                  <div className="text-slate-600 dark:text-slate-300">PIN: <code className="font-bold">1234</code></div>
                </div>
              </div>

              {/* Success Alert inside modal if clicked */}
              {resetSuccess && (
                <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-xs text-emerald-800 dark:text-emerald-200 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{resetSuccess}</span>
                </div>
              )}

              {/* Action 1: Reset Admin to Default PIN */}
              <button
                type="button"
                onClick={handleResetAdminToDefault}
                disabled={isResetting}
                className="w-full py-3 px-4 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-md transition flex items-center justify-center gap-2 transform active:scale-98"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Admin Master PIN to Default (1234)</span>
              </button>

              {/* Action 2: Reset All Roles */}
              <button
                type="button"
                onClick={handleResetAllToDefault}
                disabled={isResetting}
                className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700 transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset All Roles (Admin, Manager, Supervisors) to Default</span>
              </button>

              {/* Close & Auto Login */}
              {resetSuccess && (
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotModalOpen(false);
                    handleUniversalLogin();
                  }}
                  className="w-full py-3 rounded-2xl bg-blinkit-green hover:bg-blinkit-darkgreen text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2"
                >
                  <span>Sign In Now as Admin (1234)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Supervisor apna password Admin se reset karwayen
              </span>
              <button
                onClick={() => setIsForgotModalOpen(false)}
                className="font-bold text-slate-600 dark:text-slate-300 hover:underline"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
