import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, QrCode, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

export default function QRScannerModal({ isOpen, onClose, stores = [], onStoreScanned }) {
  const [cameraError, setCameraError] = useState(null);
  const [selectedCode, setSelectedCode] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      return;
    }

    // Attempt to access rear camera
    let active = true;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }
      })
      .then((stream) => {
        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.warn('Camera access issue:', err);
        setCameraError('Camera access unavailable or permission denied. You can select the store below.');
      });
    } else {
      setCameraError('Camera API not supported on this browser. You can select the store below.');
    }

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualSelect = (code) => {
    if (!code) return;
    onStoreScanned(code);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blinkit-green text-white flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Scan Dark Store QR Code
              </h3>
              <p className="text-[11px] text-slate-500">
                Point camera at the store gate QR code
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

        {/* Video Camera Viewport */}
        <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center border-2 border-blinkit-green shadow-inner">
          {cameraError ? (
            <div className="p-4 text-center space-y-2 text-slate-300">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="text-xs">{cameraError}</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Target Scan Overlay */}
              <div className="absolute inset-8 border-2 border-blinkit-yellow/80 rounded-2xl pointer-events-none animate-pulse flex items-center justify-center">
                <div className="w-full h-0.5 bg-rose-500/80 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-bounce" />
              </div>
            </>
          )}
        </div>

        {/* 1-Tap Quick Select / Fallback */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Or select store to check in:
          </label>
          <div className="flex gap-2">
            <select
              value={selectedCode}
              onChange={(e) => setSelectedCode(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            >
              <option value="">Choose Assigned Store...</option>
              {stores.map((s) => (
                <option key={s.storeCode} value={s.storeCode}>
                  {s.storeCode} - {s.storeName}
                </option>
              ))}
            </select>
            <button
              onClick={() => handleManualSelect(selectedCode)}
              disabled={!selectedCode}
              className="px-3.5 py-2 rounded-xl bg-blinkit-green hover:bg-blinkit-darkgreen text-white font-bold text-xs shadow-sm disabled:opacity-50 transition"
            >
              Check-In
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
