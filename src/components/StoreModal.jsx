import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
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
import { toast } from './Toast';
import { extractCoordinatesFromGoogleUrl, resolveAndExtractGoogleCoordinates } from '../utils/distance';

export default function StoreModal({
  isOpen,
  onClose,
  onSave,
  initialData = null
}) {
  const { t } = useLanguage();
  const [isResolvingGps, setIsResolvingGps] = useState(false);
  const [formData, setFormData] = useState({
    storeCode: 'BLK-',
    storeName: '',
    address: '',
    city: '',
    zone: '',
    latitude: '',
    longitude: '',
    googleMapsUrl: '',
    managerName: '',
    managerPhone: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        storeCode: initialData.storeCode || 'BLK-',
        storeName: initialData.storeName || '',
        address: initialData.address || '',
        city: initialData.city || '',
        zone: initialData.zone || '',
        latitude: initialData.latitude !== undefined && initialData.latitude !== null ? initialData.latitude : '',
        longitude: initialData.longitude !== undefined && initialData.longitude !== null ? initialData.longitude : '',
        googleMapsUrl: initialData.googleMapsUrl || '',
        managerName: initialData.managerName || '',
        managerPhone: initialData.managerPhone || ''
      });
    } else {
      setFormData({
        storeCode: 'BLK-',
        storeName: '',
        address: '',
        city: '',
        zone: '',
        latitude: '',
        longitude: '',
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
      toast.warning('Please enter Store Code and Store Name!');
      return;
    }
    onSave(formData);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-100 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
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
                City *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Mumbai, Pune, Delhi NCR"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green"
              />
            </div>
          </div>

          {/* Area Cluster / Zone Tagging */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Area Cluster / Zone Tag
            </label>
            <input
              type="text"
              placeholder="e.g. Navi Mumbai - Kamothe, Thane - Naupada, Gurgaon - Phase 2"
              value={formData.zone || ''}
              onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green font-medium"
            />
          </div>

          {/* Google Maps Link with Auto-Extract */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Google Maps Location Link
              </label>
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                {isResolvingGps ? '⏳ Resolving GPS from link...' : 'Pasting link auto-extracts GPS'}
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="https://maps.app.goo.gl/... or https://maps.google.com/?q=..."
                value={formData.googleMapsUrl}
                onChange={async (e) => {
                  const url = e.target.value;
                  setFormData(prev => ({ ...prev, googleMapsUrl: url }));

                  // 1. Instant sync extraction for standard URLs & coordinates
                  const directCoords = extractCoordinatesFromGoogleUrl(url);
                  if (directCoords) {
                    setFormData(prev => ({ ...prev, latitude: directCoords.latitude, longitude: directCoords.longitude }));
                    toast.success(`GPS coordinates extracted: ${directCoords.latitude}, ${directCoords.longitude}`);
                    return;
                  }

                  // 2. Async unshorten if it's a mobile share link (maps.app.goo.gl)
                  if (url.includes('maps.app.goo.gl') || url.includes('goo.gl/maps')) {
                    setIsResolvingGps(true);
                    try {
                      const resolved = await resolveAndExtractGoogleCoordinates(url);
                      if (resolved) {
                        setFormData(prev => ({ ...prev, latitude: resolved.latitude, longitude: resolved.longitude }));
                        toast.success(`GPS locked from Google Maps link: ${resolved.latitude}, ${resolved.longitude}`);
                      }
                    } catch (err) {
                      console.warn(err);
                    } finally {
                      setIsResolvingGps(false);
                    }
                  }
                }}
                className="w-full px-3 py-2 pr-16 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blinkit-green"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {isResolvingGps && (
                  <span className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                )}
                {formData.googleMapsUrl && (
                  <a
                    href={formData.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 p-1"
                    title="Open link in Google Maps"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* GPS Coordinates & Live Auto-Capture */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>Exact GPS Coordinates (Map & Route Planner)</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!navigator.geolocation) {
                    toast.warning('Browser geolocation is not supported on this device.');
                    return;
                  }
                  toast.info('Fetching live GPS coordinates from device...');
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      const lat = Math.round(pos.coords.latitude * 1000000) / 1000000;
                      const lon = Math.round(pos.coords.longitude * 1000000) / 1000000;
                      setFormData(prev => ({ ...prev, latitude: lat, longitude: lon }));
                      toast.success(`Live GPS Locked: ${lat}, ${lon}`);
                    },
                    (err) => {
                      toast.error(`GPS Error: ${err.message}. Please allow location permission.`);
                    },
                    { enableHighAccuracy: true, timeout: 10000 }
                  );
                }}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-extrabold text-[11px] border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 transition"
              >
                <span>📍 Auto-Capture GPS</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 19.0186"
                  value={formData.latitude !== undefined && formData.latitude !== null ? formData.latitude : ''}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value ? parseFloat(e.target.value) : '' })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 73.0934"
                  value={formData.longitude !== undefined && formData.longitude !== null ? formData.longitude : ''}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value ? parseFloat(e.target.value) : '' })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-semibold"
                />
              </div>
            </div>

            {Boolean(formData.latitude && formData.longitude) && (
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <span>✓ GPS Location verified &amp; ready for Proximity Routing</span>
              </div>
            )}
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
