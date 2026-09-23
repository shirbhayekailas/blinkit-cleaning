import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, CheckCircle, Share, PlusSquare } from 'lucide-react';

export default function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // 1. Check if app is already installed / running in standalone mode
    const checkStandalone = () => {
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://')
      );
    };

    if (checkStandalone()) {
      setIsStandalone(true);
      return;
    }

    // 2. Check if user dismissed the banner recently
    try {
      const dismissedUntil = localStorage.getItem('blinkit_pwa_dismissed_until');
      if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
        setIsDismissed(true);
      }
    } catch {
      // ignore
    }

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
    setIsIOS(isAppleDevice);

    // 4. Capture native beforeinstallprompt (Chrome / Android / Edge)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      window.deferredPWAInstallPrompt = e;
      window.dispatchEvent(new Event('pwa-installable'));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Global trigger for manual install buttons (Navbar / Login)
    const handleManualInstallTrigger = () => {
      if (window.deferredPWAInstallPrompt) {
        window.deferredPWAInstallPrompt.prompt();
        window.deferredPWAInstallPrompt.userChoice.then((choice) => {
          if (choice.outcome === 'accepted') {
            setDeferredPrompt(null);
            window.deferredPWAInstallPrompt = null;
          }
        });
      } else if (isAppleDevice) {
        setShowIOSModal(true);
      } else {
        alert('App can be installed from your browser menu: Tap (⋮) or (Share) -> "Install App" or "Add to Home Screen".');
      }
    };

    window.addEventListener('trigger-pwa-install', handleManualInstallTrigger);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('trigger-pwa-install', handleManualInstallTrigger);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
        window.deferredPWAInstallPrompt = null;
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      // Dismiss for 5 days
      const expireTime = Date.now() + 5 * 24 * 60 * 60 * 1000;
      localStorage.setItem('blinkit_pwa_dismissed_until', expireTime.toString());
    } catch {
      // ignore
    }
  };

  // If already installed or dismissed (and no explicit prompt), don't show the floating banner
  if (isStandalone || isDismissed) {
    return (
      <>
        {/* iOS Instruction Modal if triggered manually */}
        {showIOSModal && (
          <IOSInstructionsModal onClose={() => setShowIOSModal(false)} />
        )}
      </>
    );
  }

  // Only show banner if we have a prompt or it's iOS
  if (!deferredPrompt && !isIOS) {
    return null;
  }

  return (
    <>
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-b border-blinkit-green/40 px-4 py-2.5 shadow-lg relative z-40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-left w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-blinkit-green flex items-center justify-center text-white shadow-md flex-shrink-0">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blinkit-yellow uppercase tracking-wider">
                  Mobile App Available
                </span>
                <span className="text-[10px] bg-blinkit-green/20 text-blinkit-green px-1.5 py-0.5 rounded font-bold border border-blinkit-green/30">
                  100% Offline Ready
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-100">
                Install Blinkit Cleaning App on your phone for 1-tap night access
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleInstallClick}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-xl bg-blinkit-green hover:bg-blinkit-darkgreen text-white font-bold text-xs shadow-md transition transform active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>{isIOS ? 'How to Install on iPhone' : 'Install App'}</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showIOSModal && (
        <IOSInstructionsModal onClose={() => setShowIOSModal(false)} />
      )}
    </>
  );
}

function IOSInstructionsModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blinkit-green flex items-center justify-center text-white font-black text-xl">
              b
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Install on iPhone / iPad
              </h3>
              <p className="text-xs text-slate-500">Safari Home Screen Installation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blinkit-green/20 text-blinkit-green font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              1
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">
                Open Safari Browser
              </p>
              <p className="text-slate-500 mt-0.5">
                Make sure you are viewing this page inside Apple Safari.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blinkit-green/20 text-blinkit-green font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              2
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Tap the Share Button</span>
                <Share className="w-3.5 h-3.5 text-blue-500" />
              </p>
              <p className="text-slate-500 mt-0.5">
                At the bottom of the Safari screen, tap the square icon with an upward arrow.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blinkit-green/20 text-blinkit-green font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              3
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Select "Add to Home Screen"</span>
                <PlusSquare className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
              </p>
              <p className="text-slate-500 mt-0.5">
                Scroll down in the share sheet and tap <strong>"Add to Home Screen"</strong>, then tap <strong>Add</strong>.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-blinkit-green hover:bg-blinkit-darkgreen text-white font-bold text-xs transition shadow-md"
        >
          Got it, Close
        </button>
      </div>
    </div>
  );
}
