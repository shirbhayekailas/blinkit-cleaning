import React from 'react';
import { X, MapPin, Navigation, ExternalLink, Clock, Building2, Phone, Sparkles } from 'lucide-react';

export default function NightRouteModal({ isOpen, onClose, schedules = [], stores = [] }) {
  if (!isOpen) return null;

  // Filter tonight's scheduled stores
  const todayStr = new Date().toISOString().split('T')[0];
  const tonightSchedules = schedules.filter(s => s.scheduledDate === todayStr && s.status !== 'Cancelled');

  // Match with store details
  const routeStores = tonightSchedules.length > 0 
    ? tonightSchedules.map(s => {
        const store = stores.find(st => st.storeCode === s.storeCode) || {};
        return {
          ...s,
          ...store,
          time: s.shiftTime || '01:00 AM'
        };
      })
    : stores.slice(0, 3).map((st, i) => ({
        ...st,
        time: i === 0 ? '01:00 AM' : i === 1 ? '03:00 AM' : '04:30 AM'
      }));

  // Build Google Maps Multi-Stop Navigation URL
  const destinations = routeStores
    .map(s => encodeURIComponent(s.address || (s.storeName + (s.city ? ', ' + s.city : ''))))
    .filter(Boolean);

  const googleMapsUrl = destinations.length > 1
    ? `https://www.google.com/maps/dir/${destinations.join('/')}`
    : destinations.length === 1
    ? `https://www.google.com/maps/search/?api=1&query=${destinations[0]}`
    : 'https://maps.google.com';

  return (
    <div 
      className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Tonight's Multi-Store Route
              </h3>
              <p className="text-xs text-slate-500">
                Optimal sequence for cleaning team van &amp; machinery transport
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

        {/* Big Navigation Trigger Button */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noreferrer"
          className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2"
        >
          <Navigation className="w-4 h-4" />
          <span>Launch Google Maps Route ({routeStores.length} Stops)</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        {/* Route Stops Sequence */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Shift Stops Sequence
          </h4>

          {routeStores.map((store, index) => (
            <div
              key={store.storeCode || index}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-start gap-3 relative"
            >
              <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                {index + 1}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h5 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {store.storeName}
                  </h5>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                    {store.time}
                  </span>
                </div>

                <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{store.address || 'Address not listed'}</span>
                </p>

                {store.managerPhone && (
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>SM: {store.managerName || 'Manager'} ({store.managerPhone})</span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Route Tips */}
        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-[11px] text-slate-600 dark:text-slate-400">
          💡 <strong>Tip for Driver / Supervisor:</strong> Heavy Single Disc scrubbing machines should be placed near the vehicle rear door for quick unloading at each dark store.
        </div>

      </div>
    </div>
  );
}
