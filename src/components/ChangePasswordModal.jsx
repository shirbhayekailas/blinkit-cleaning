import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { changePin } from '../services/api';

export default function ChangePasswordModal({
  isOpen,
  onClose,
  role = 'admin', // 'admin' | 'supervisor' | 'client'
  user = null,    // supervisor object or null
  isFirstLogin = false,
  onSuccess
}) {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  // Expected current PIN
  let expectedCurrentPin = '1234';
  if (role === 'admin') {
    expectedCurrentPin = localStorage.getItem('vendor_admin_pin') || '1234';
  } else if (role === 'client') {
    expectedCurrentPin = localStorage.getItem('blinkit_client_pin') || '5678';
  } else if (role === 'supervisor') {
    expectedCurrentPin = user?.pin || '1234';
  }

  const roleTitle = role === 'admin' 
    ? 'Admin Master PIN' 
    : role === 'client' 
      ? 'Client Portal PIN' 
      : `${user?.name || 'Supervisor'} Access PIN`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Verification
    if (currentPin.trim() !== expectedCurrentPin) {
      setError('Purana (Current) PIN galat hai. Kripya sahi PIN dalein.');
      return;
    }

    if (newPin.trim().length < 4) {
      setError('Naya PIN kam se kam 4 digits ya characters ka hona chahiye.');
      return;
    }

    if (newPin.trim() === expectedCurrentPin) {
      setError('Naya PIN purane PIN se alag hona chahiye.');
      return;
    }

    if (newPin.trim() !== confirmPin.trim()) {
      setError('New PIN aur Confirm PIN match nahi ho rahe.');
      return;
    }

    setIsSaving(true);
    try {
      const cleanNewPin = newPin.trim();

      if (role === 'admin') {
        localStorage.setItem('vendor_admin_pin', cleanNewPin);
        localStorage.setItem('admin_pin_changed', 'true');
        localStorage.setItem('admin_pin_updated_at', new Date().toISOString());
      } else if (role === 'client') {
        localStorage.setItem('blinkit_client_pin', cleanNewPin);
        localStorage.setItem('client_pin_changed', 'true');
      } else if (role === 'supervisor' && user?.id) {
        // Also update local storage session if currently logged in
        const currentSaved = localStorage.getItem('blinkit_supervisor');
        if (currentSaved) {
          try {
            const parsed = JSON.parse(currentSaved);
            if (parsed.id === user.id) {
              parsed.pin = cleanNewPin;
              parsed.hasChangedPin = true;
              localStorage.setItem('blinkit_supervisor', JSON.stringify(parsed));
            }
          } catch (e) {
            console.warn(e);
          }
        }
      }

      // Sync updated PIN directly to server database
      try {
        await changePin(role, cleanNewPin, user?.id || user?.phone);
      } catch (err) {
        console.warn('Could not update PIN on server directly:', err);
      }

      // Celebrate
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch (err) {}

      if (onSuccess) {
        onSuccess(cleanNewPin);
      }
      onClose();
    } catch (err) {
      setError('Error saving new password: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-110 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto">
        
        {/* Banner */}
        <div className={`p-6 text-white ${
          isFirstLogin 
            ? 'bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-600' 
            : 'bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700'
        }`}>
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isFirstLogin ? 'FIRST LOGIN SECURITY' : 'SECURITY SETTINGS'}</span>
            </div>
            
            {!isFirstLogin && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <h2 className="text-xl font-black mt-3">
            {isFirstLogin ? 'Setup Your Secret Password' : 'Change Password / PIN'}
          </h2>
          <p className="text-xs text-white/90 mt-1">
            {isFirstLogin 
              ? 'Suraksha ke liye pehli baar login par default PIN (1234) badalna anivarya hai.' 
              : `Update password for ${roleTitle}`}
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {isFirstLogin && (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Welcome {user?.name || role.toUpperCase()}!</span>
                <p className="text-[11px] opacity-90 mt-0.5">
                  Apna personal 4-digit PIN banayein jo sirf aapko pata ho. Default PIN tha: <strong className="font-mono">{expectedCurrentPin}</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Current PIN */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Purana (Current) PIN
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showCurrent ? "text" : "password"}
                required
                maxLength={8}
                value={currentPin}
                placeholder={isFirstLogin ? `Current PIN: ${expectedCurrentPin}` : 'Enter current PIN'}
                onChange={(e) => setCurrentPin(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono tracking-widest focus:ring-2 focus:ring-blinkit-green"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New PIN */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Naya Secret PIN (Min 4 Digits)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showNew ? "text" : "password"}
                required
                maxLength={8}
                value={newPin}
                placeholder="e.g. 5892"
                onChange={(e) => setNewPin(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono tracking-widest focus:ring-2 focus:ring-blinkit-green"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New PIN */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Naya PIN Confirm Karein
            </label>
            <div className="relative">
              <CheckCircle2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showConfirm ? "text" : "password"}
                required
                maxLength={8}
                value={confirmPin}
                placeholder="Re-enter new PIN"
                onChange={(e) => setConfirmPin(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono tracking-widest focus:ring-2 focus:ring-blinkit-green"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 rounded-2xl bg-blinkit-green hover:bg-blinkit-darkgreen text-white font-black text-sm shadow-lg shadow-emerald-700/20 hover:shadow-xl transition transform active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>{isSaving ? 'Saving PIN...' : isFirstLogin ? 'Save New PIN & Continue →' : 'Update Password'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
