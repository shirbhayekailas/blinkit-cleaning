import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  User, 
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { db } from '../db/db';

export default function LoginModal({
  isOpen,
  onClose,
  currentRole,
  onLoginSuccess
}) {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleUniversalLogin = async (e) => {
    e.preventDefault();
    setError('');

    const inputId = loginId.trim();
    const inputPass = password.trim();

    if (!inputId || !inputPass) {
      setError('Please enter both Login ID and Password.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Check Admin Account
      const adminId = (localStorage.getItem('vendor_admin_id') || 'admin').toLowerCase();
      const adminPin = localStorage.getItem('vendor_admin_pin') || '1234';

      if (inputId.toLowerCase() === adminId && inputPass === adminPin) {
        onLoginSuccess({
          role: 'admin',
          user: { name: 'Vendor Admin / Owner', loginId: adminId }
        });
        onClose();
        return;
      }

      // 2. Check Blinkit Client Ops Head Account
      const clientId = (localStorage.getItem('blinkit_client_id') || 'client').toLowerCase();
      const clientPin = localStorage.getItem('blinkit_client_pin') || '5678';
      const clientName = localStorage.getItem('blinkit_client_name') || 'Blinkit City Operations Head';

      if (inputId.toLowerCase() === clientId && inputPass === clientPin) {
        onLoginSuccess({
          role: 'client',
          user: { name: clientName, loginId: clientId }
        });
        onClose();
        return;
      }

      // 3. Check Site Supervisors (by Mobile Number)
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
          setIsSubmitting(false);
          return;
        }

        onLoginSuccess({
          role: 'supervisor',
          user: supervisor
        });
        onClose();
        return;
      }

      // 4. Invalid credentials
      setError('Invalid Login ID or Password. Please check credentials or contact Admin.');
    } catch (err) {
      setError('Login error: ' + err.message);
    } finally {
      setIsSubmitting(false);
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
                Switch Role / Sign In
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter your Login ID and Password
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

        {/* Universal Form */}
        <div className="p-6">
          <form onSubmit={handleUniversalLogin} className="space-y-4">
            
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
                  placeholder="Enter your Login ID or Mobile Number"
                  value={loginId}
                  onChange={(e) => {
                    setLoginId(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green font-medium"
                />
              </div>
            </div>

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

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-2xl bg-slate-950 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-black text-sm shadow-lg shadow-slate-950/20 hover:shadow-xl transition transform active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>{isSubmitting ? 'Verifying...' : 'Sign In →'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </form>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Role-based routing: Admin, Supervisor or Client View</span>
        </div>

      </div>
    </div>
  );
}
