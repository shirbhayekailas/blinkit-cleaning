import React from 'react';
import { X, Printer, QrCode, Building2, MapPin, Sparkles } from 'lucide-react';

export default function StoreQRModal({ isOpen, onClose, store }) {
  if (!isOpen || !store) return null;

  const qrData = `BLINKIT_STORE:${store.storeCode}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}&color=0c831f`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5 print:shadow-none print:border-none">
        
        {/* Modal Controls (hidden on print) */}
        <div className="flex items-center justify-between print:hidden">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <QrCode className="w-4 h-4 text-blinkit-green" />
            <span>Print Dark Store QR Code</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PRINTABLE QR CARD (Designed for pasting on store shutter / notice board) */}
        <div className="p-6 bg-white rounded-3xl border-4 border-blinkit-green text-center space-y-4 shadow-md">
          
          {/* Header */}
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blinkit-yellow text-slate-950 font-black flex items-center justify-center text-lg shadow-xs">
              b
            </div>
            <div className="text-left">
              <span className="font-extrabold text-base tracking-tight text-slate-900">
                blink<span className="text-blinkit-green">it</span>
              </span>
              <span className="text-[10px] block font-bold text-slate-500 uppercase tracking-wider">
                DEEP CLEANING CHECK-IN
              </span>
            </div>
          </div>

          <div className="border-t border-b border-dashed border-slate-200 py-3">
            <h4 className="text-lg font-black text-slate-900">
              {store.storeName}
            </h4>
            <p className="text-xs font-bold text-blinkit-green mt-0.5">
              STORE CODE: {store.storeCode}
            </p>
            {store.city && (
              <p className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>{store.city}</span>
              </p>
            )}
          </div>

          {/* QR Code Image */}
          <div className="flex justify-center p-2 bg-slate-50 rounded-2xl border border-slate-100">
            <img
              src={qrUrl}
              alt={`QR Code for ${store.storeCode}`}
              className="w-48 h-48 object-contain rounded-xl"
            />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-extrabold text-slate-900">
              📷 SCAN VIA SUPERVISOR APP
            </p>
            <p className="text-[10px] text-slate-500">
              Paste this QR code near the main shutter or facility entrance for 1-tap arrival check-in.
            </p>
          </div>

        </div>

        {/* Print / Action Button (hidden on print) */}
        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-xl bg-blinkit-green hover:bg-blinkit-darkgreen text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print QR Card (Ctrl + P)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
