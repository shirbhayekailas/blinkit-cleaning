import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  MapPin, 
  Phone, 
  ExternalLink, 
  Save, 
  Sparkles 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function StoreModal({
  isOpen,
  onClose,
  onSave,
  initialData = null
}) {
  const [formData, setFormData] = useState({
    storeCode: 'BLK-',
    storeName: '',
    address: '',
    city: 'Delhi NCR',
    googleMapsUrl: '',
    managerName: '',
    managerPhone: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        storeCode: 'BLK-',
        storeName: '',
        address: '',
        city: 'Delhi NCR',
        googleMapsUrl: '',
        managerName: '',
        managerPhone: ''
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.storeCode || !formData.storeName) {
      alert('Please enter Store Code and Store Name!');
      return;
    }
    onSave(formData);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blinkit-yellow text-slate-950 font-black flex items-center justify-center text-base">
              b
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {initialData ? 'Edit Store Details' : 'Add New Store to Master Ledger'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Register store once; all info will auto-fill during cleaning entry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Store Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. BLK-DEL-042"
                value={formData.storeCode}
                onChange={(e) => setFormData({ ...formData, storeCode: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-blinkit-green"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Store Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Blinkit Saket Indiranagar Hub"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-blinkit-green"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Store Address
              </label>
              <input
                type="text"
                placeholder="e.g. Basement 1, Select Citywalk Backlane, Saket"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                City / Zone
              </label>
              <input
                type="text"
                placeholder="e.g. South Delhi"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Google Maps Location Link
            </label>
            <div className="relative">
              <input
                type="url"
                placeholder="https://maps.google.com/?q=..."
                value={formData.googleMapsUrl}
                onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })}
                className="w-full px-3 py-2 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blinkit-green"
              />
              {formData.googleMapsUrl && (
                <a
                  href={formData.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-700"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Store Manager Name
              </label>
              <input
                type="text"
                placeholder="e.g. Pooja Verma"
                value={formData.managerName}
                onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Store Manager Phone Number
              </label>
              <input
                type="tel"
                placeholder="e.g. +91 98998 87766"
                value={formData.managerPhone}
                onChange={(e) => setFormData({ ...formData, managerPhone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blinkit-green hover:bg-blinkit-darkgreen text-white font-bold shadow-md shadow-emerald-700/20 transition flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{initialData ? 'Update Store' : 'Save to Ledger'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
