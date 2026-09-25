import React from 'react';
import { 
  Building2, 
  Plus, 
  MapPin, 
  Phone, 
  ExternalLink, 
  Calendar, 
  Clock, 
  IndianRupee, 
  History, 
  Edit3, 
  Trash2, 
  MessageSquare,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  Share2
} from 'lucide-react';
import { shareStoreLocationWhatsApp } from '../utils/whatsappFormatter';

export default function StoreLedgerView({
  stores = [],
  cleanings = [],
  searchTerm,
  setSearchTerm,
  onAddNewStore,
  onEditStore,
  onDeleteStore,
  onViewStoreHistory,
  onLogCleaningForStore
}) {
  // Filter stores by search
  const filteredStores = stores.filter(s => 
    (s.storeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.storeCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.managerName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-5 min-w-0">
      
      {/* Ledger Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs min-w-0">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
            <Building2 className="w-5 h-5 text-blinkit-green shrink-0" />
            <span>Store Master Ledger &amp; Directory</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words">
            Manage registered dark stores, store-wise cleaning records &amp; pending payments
          </p>
        </div>

        <button
          onClick={onAddNewStore}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-blinkit-green hover:bg-blinkit-darkgreen text-white shadow-md shadow-emerald-700/20 transition self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add New Store to Ledger</span>
        </button>
      </div>

      {/* Stores Ledger Grid */}
      {filteredStores.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStores.map((store) => {
            // Calculate store-wise metrics
            const storeCleanings = cleanings
              .filter(c => c.storeCode === store.storeCode || c.storeName === store.storeName)
              .sort((a, b) => new Date(b.cleaningDate) - new Date(a.cleaningDate));

            const visitCount = storeCleanings.length;
            const lastClean = storeCleanings[0];
            const totalBilled = storeCleanings.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
            const totalReceived = storeCleanings.reduce((sum, c) => sum + (Number(c.amountReceived) || 0), 0);
            const totalPending = storeCleanings.reduce((sum, c) => sum + (Number(c.amountPending) || 0), 0);

            return (
              <div
                key={store.id || store.storeCode}
                className="bg-white dark:bg-slate-800/95 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden"
              >
                
                {/* Store Card Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 bg-gradient-to-r from-amber-50/40 via-white to-slate-50 dark:from-slate-800 dark:to-slate-800/60">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950">
                          {store.storeCode}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-md font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {store.city || 'Hub'}
                        </span>
                      </div>
                      <h3 className="mt-1 font-bold text-base text-slate-900 dark:text-white line-clamp-1">
                        {store.storeName}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onEditStore(store)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                        title="Edit Store"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteStore(store.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                        title="Delete Store"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Address & Maps */}
                  <div className="mt-2 flex items-center justify-between gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1 truncate flex-1 min-w-0">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
                      <span className="truncate">{store.address || 'Address not specified'}</span>
                      {store.googleMapsUrl && (
                        <a
                          href={store.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-blue-600 dark:text-blue-400 hover:underline font-semibold inline-flex items-center gap-0.5 ml-1"
                        >
                          <span>Maps</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => shareStoreLocationWhatsApp(store)}
                      title="Share Store GMap Location on WhatsApp"
                      className="shrink-0 text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold inline-flex items-center gap-1 transition shadow-2xs"
                    >
                      <Share2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>GMap WA</span>
                    </button>
                  </div>

                  {/* Store Manager Contact */}
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-xs">
                    <div className="text-slate-600 dark:text-slate-300 font-medium truncate">
                      <span className="text-slate-400 text-[11px]">Manager:</span> {store.managerName || 'N/A'}
                    </div>
                    {store.managerPhone && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={`tel:${store.managerPhone}`}
                          className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300 px-2 py-0.5 rounded hover:bg-emerald-100 transition"
                        >
                          Call
                        </a>
                        <a
                          href={`https://wa.me/${store.managerPhone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-semibold text-green-700 bg-green-50 dark:bg-green-950/50 dark:text-green-300 px-2 py-0.5 rounded hover:bg-green-100 transition"
                        >
                          WhatsApp
                        </a>
                      </div>
                    )}
                  </div>

                </div>

                {/* Ledger Financial & Cleaning Summary */}
                <div className="p-4 space-y-3 text-xs">
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 text-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-700/50">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Total Visits</div>
                      <div className="text-sm font-black text-slate-900 dark:text-white">{visitCount}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Received</div>
                      <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        ₹{totalReceived.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">Pending</div>
                      <div className="text-sm font-black text-rose-600 dark:text-rose-400">
                        ₹{totalPending.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Last Cleaned Info */}
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      <span>Last Cleaned:</span>
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {lastClean ? lastClean.cleaningDate : 'No visits recorded yet'}
                    </span>
                  </div>

                </div>

                {/* Card Action Buttons */}
                <div className="p-3 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/50 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onViewStoreHistory(store)}
                    className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>View History</span>
                  </button>

                  <button
                    onClick={() => onLogCleaningForStore(store)}
                    className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-blinkit-green hover:bg-blinkit-darkgreen text-white transition flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Cleaning</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center bg-white dark:bg-slate-800/60 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 p-8">
          <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No stores found in Ledger
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Add your Blinkit dark stores to the ledger once. Afterward, you can log visits with 1-click auto-fill!
          </p>
          <button
            onClick={onAddNewStore}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blinkit-green text-white font-bold text-xs hover:bg-blinkit-darkgreen shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Store to Ledger</span>
          </button>
        </div>
      )}

    </div>
  );
}
