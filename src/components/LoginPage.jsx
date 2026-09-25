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
  Clock,
  CheckCircle2
} from 'lucide-react';
import { db } from '../db/db';
import { logUserLogin } from '../utils/auditLogger';

export default function LoginPage({
  onLoginSuccess,
  darkMode,
  setDarkMode,
  logoutNotice = null,
  onClearLogoutNotice
}) {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUniversalLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');

    const inputId = loginId.trim();
    const inputPass = password.trim();

    if (!inputId || !inputPass) {
      setError('Kripya apna Login ID aur Password dono darj karein.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Check Admin Account (Vendor Owner)
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
          setError('Ye supervisor account deactivate kiya gaya hai. Admin se sampark karein.');
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
        notes: 'Invalid credentials entered'
      });
      setError('Galat Login ID ya Password darj kiya gaya hai. Kripya check karke dobara dalein.');
    } catch (err) {
      setError('Login error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-between transition-colors">
      
      {/* Top Header Bar */}
      <header className="px-4 sm:px-6 py-3.5 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-blinkit-yellow text-slate-950 font-black flex items-center justify-center text-lg sm:text-xl shadow-md border border-amber-300">
            b
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                blink<span className="text-blinkit-green">it</span>
              </span>
              <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300/40">
                PORTAL
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
              Dark Store Deep Cleaning Operations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('trigger-pwa-install'))}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-2xl bg-white dark:bg-slate-900 text-blinkit-green dark:text-emerald-400 border border-slate-200 dark:border-slate-800 shadow-2xs hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Install App</span>
          </button>

          <button
            onClick={() => setDarkMode(!darkMode)}
            title="Toggle Dark Mode"
            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs transition"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Card Top Banner */}
          <div className="p-6 bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 text-slate-950">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 text-white text-xs font-bold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>OPERATIONS ACCESS</span>
              </div>
              <span className="text-[11px] font-black tracking-wider text-slate-900/80">
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
            
            {/* Auto-logout / Manual Logout Status Notice */}
            {logoutNotice === 'inactivity' && (
              <div className="p-3.5 mb-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-950 dark:text-amber-300 font-semibold flex items-start gap-2.5 animate-in fade-in duration-150">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs">Session Auto-Logged Out (Screen Idle)</div>
                  <div className="text-[11px] text-amber-800 dark:text-amber-300/80 mt-0.5">
                    Suraksha ke liye 10 minute screen inactive hone par session auto-close kar diya gaya hai. Kripya naye sire se login karein.
                  </div>
                </div>
              </div>
            )}

            {logoutNotice === 'manual' && (
              <div className="p-3 mb-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2 animate-in fade-in duration-150">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Aap successfully logout ho chuke hain. Naye user login ke liye credentials dalein.</span>
              </div>
            )}

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
                    placeholder="Enter your password"
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
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-2 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
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

      {/* Page Footer */}
      <footer className="py-4 text-center text-xs text-slate-400">
        Blinkit Dark Store Deep Cleaning Management System &bull; Vendor Operations Portal
      </footer>

    </div>
  );
}
