import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
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
  Share2,
  FileSpreadsheet,
  FileText,
  Download,
  ArrowUpDown,
  Filter
} from 'lucide-react';
import { shareStoreLocationWhatsApp, shareStoreDirectoryWhatsApp } from '../utils/whatsappFormatter';
import { naturalSortByStoreCode, exportStoreListExcel, exportSingleStoreExcel } from '../utils/reportExcelGenerator';
import { generateStoreListPDF, generateSingleStoreStatementPDF } from '../utils/reportPdfGenerator';
import { doesCleaningMatchStore, getStoreKey } from '../utils/storeUtils';

export default function StoreLedgerView({
  stores = [],
  cleanings = [],
  searchTerm,
  setSearchTerm,
  onAddNewStore,
  onEditStore,
  onDeleteStore,
  onViewStoreHistory,
  onLogCleaningForStore,
  onOpenReportsCenter
}) {
  const { t } = useLanguage();
  const [storeSortBy, setStoreSortBy] = useState('storeCodeAsc');
  const [cityFilter, setCityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Extract unique cities
  const uniqueCities = useMemo(() => {
    return Array.from(new Set(stores.map(s => s.city).filter(Boolean))).sort();
  }, [stores]);

  // Compute store metrics map for sorting by activity or balance
  const storeMetricsMap = useMemo(() => {
    const map = new Map();
    stores.forEach(s => {
      const key = s.id ? `id_${s.id}` : getStoreKey(s);
      const sCleanings = cleanings.filter(c => doesCleaningMatchStore(c, s));
      const totalPending = sCleanings.reduce((sum, c) => sum + (Number(c.amountPending) || 0), 0);
      const dates = sCleanings.map(c => c.cleaningDate).filter(Boolean).sort().reverse();
      const lastDate = dates[0] || '';
      map.set(key, { visitCount: sCleanings.length, totalPending, lastDate });
    });
    return map;
  }, [stores, cleanings]);

  // Filter and sort stores
  const filteredStores = useMemo(() => {
    let list = stores.filter(s => {
      const matchesSearch = 
        (s.storeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.storeCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.managerName || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCity = cityFilter === 'all' || s.city === cityFilter;

      let matchesStatus = true;
      if (statusFilter === 'active') {
        matchesStatus = s.status !== 'Inactive';
      } else if (statusFilter === 'pendingDues') {
        const key = s.id ? `id_${s.id}` : getStoreKey(s);
        const metrics = storeMetricsMap.get(key);
        matchesStatus = metrics && metrics.totalPending > 0;
      }

      return matchesSearch && matchesCity && matchesStatus;
    });

    // Apply sorting
    if (storeSortBy === 'storeCodeAsc') {
      return naturalSortByStoreCode(list, s => s.storeCode);
    } else if (storeSortBy === 'storeCodeDesc') {
      return naturalSortByStoreCode(list, s => s.storeCode).reverse();
    } else if (storeSortBy === 'nameAsc') {
      return [...list].sort((a, b) => (a.storeName || '').localeCompare(b.storeName || ''));
    } else if (storeSortBy === 'cityAsc') {
      return [...list].sort((a, b) => (a.city || '').localeCompare(b.city || ''));
    } else if (storeSortBy === 'recentCleaned') {
      return [...list].sort((a, b) => {
        const kA = a.id ? `id_${a.id}` : getStoreKey(a);
        const kB = b.id ? `id_${b.id}` : getStoreKey(b);
        const mA = storeMetricsMap.get(kA)?.lastDate || '';
        const mB = storeMetricsMap.get(kB)?.lastDate || '';
        return mB.localeCompare(mA);
      });
    } else if (storeSortBy === 'pendingDesc') {
      return [...list].sort((a, b) => {
        const kA = a.id ? `id_${a.id}` : getStoreKey(a);
        const kB = b.id ? `id_${b.id}` : getStoreKey(b);
        const pA = storeMetricsMap.get(kA)?.totalPending || 0;
        const pB = storeMetricsMap.get(kB)?.totalPending || 0;
        return pB - pA;
      });
    }

    return list;
  }, [stores, searchTerm, cityFilter, statusFilter, storeSortBy, storeMetricsMap]);

  return (
    <div className="space-y-4 sm:space-y-5 min-w-0">
      
      {/* Ledger Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 p-3.5 sm:p-4 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blinkit-green shrink-0" />
              <span>{t('ledger_title', 'Store Master Ledger & Directory')}</span>
            </h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {filteredStores.length} {filteredStores.length === 1 ? 'store' : 'stores'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words">
            {t('ledger_desc', 'Manage registered dark stores, store-wise cleaning records & pending payments')}
          </p>
        </div>

        {/* Action Buttons: Export PDF, Excel, WhatsApp, Reports, Add Store */}
        <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
          {/* Share Store List on WhatsApp */}
          <button
            onClick={() => shareStoreDirectoryWhatsApp(filteredStores)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 shadow-2xs transition shrink-0 active:scale-95"
            title="Share Store Master Directory on WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Share List</span>
          </button>

          {/* Download Store List PDF */}
          <button
            onClick={() => generateStoreListPDF({ stores: filteredStores, cleanings, filterLabel: 'Store Master Directory', sortBy: storeSortBy })}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 shadow-2xs transition shrink-0 active:scale-95"
            title="Download Store Master Directory PDF"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>PDF List</span>
          </button>

          {/* Download Store List Excel */}
          <button
            onClick={() => exportStoreListExcel(filteredStores, cleanings, 'Store Master Directory', { sortBy: storeSortBy })}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 shadow-2xs transition shrink-0 active:scale-95"
            title="Download Store Master Directory Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Excel List</span>
          </button>

          {onOpenReportsCenter && (
            <button
              onClick={onOpenReportsCenter}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 shadow-2xs transition shrink-0"
              title="Open Reports Center for Ledger & Audits"
            >
              <span>📊 Reports</span>
            </button>
          )}

          <button
            onClick={onAddNewStore}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blinkit-green hover:bg-blinkit-darkgreen text-white shadow-md shadow-emerald-700/20 transition shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{t('ledger_add_store', 'Add Store')}</span>
          </button>
        </div>
      </div>

      {/* Sorting & Filter Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs">
        {/* City & Status Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>

          {/* City / Cluster Filter */}
          {uniqueCities.length > 0 && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="px-2.5 py-1 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blinkit-green"
              >
                <option value="all">All Cities ({stores.length})</option>
                {uniqueCities.map(c => (
                  <option key={c} value={c}>📍 {c}</option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setStatusFilter(statusFilter === 'all' ? 'pendingDues' : 'all')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                statusFilter === 'pendingDues'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
              }`}
            >
              <span>⏳ Has Pending Dues</span>
            </button>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
          </span>
          <select
            value={storeSortBy}
            onChange={(e) => setStoreSortBy(e.target.value)}
            className="px-2.5 py-1 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blinkit-green"
          >
            <option value="storeCodeAsc">🏬 Store Code: ES2 → ES308</option>
            <option value="storeCodeDesc">🏬 Store Code: ES308 → ES2</option>
            <option value="nameAsc">🏪 Store Name: A → Z</option>
            <option value="cityAsc">📍 City: A → Z</option>
            <option value="recentCleaned">📅 Last Cleaned (Recent First)</option>
            <option value="pendingDesc">💰 Pending Dues (Highest First)</option>
          </select>
        </div>
      </div>

      {/* Stores Ledger Grid */}
      {filteredStores.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStores.map((store) => {
            // Calculate store-wise metrics (strictly isolated per store and city)
            const storeCleanings = cleanings
              .filter(c => doesCleaningMatchStore(c, store))
              .sort((a, b) => new Date(b.cleaningDate) - new Date(a.cleaningDate));

            const visitCount = storeCleanings.length;
            const lastClean = storeCleanings[0];
            const totalBilled = storeCleanings.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
            const totalReceived = storeCleanings.reduce((sum, c) => sum + (Number(c.amountReceived) || 0), 0);
            const totalPending = storeCleanings.reduce((sum, c) => sum + (Number(c.amountPending) || 0), 0);

            return (
              <div
                key={store.id ? `st_${store.id}` : getStoreKey(store)}
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
                        title={t('btn_edit', 'Edit Store')}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteStore(store)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                        title={t('btn_delete', 'Delete Store')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Address & Maps */}
                  <div className="mt-2 flex items-center justify-between gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1 truncate flex-1 min-w-0">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
                      <span className="truncate">{store.address || t('ledger_no_address', 'Address not specified')}</span>
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
                      title={t('ledger_share_gmap', 'Share Store GMap Location on WhatsApp')}
                      className="shrink-0 text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold inline-flex items-center gap-1 transition shadow-2xs"
                    >
                      <Share2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>GMap WA</span>
                    </button>
                  </div>

                  {/* Store Manager Contact */}
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-xs">
                    <div className="text-slate-600 dark:text-slate-300 font-medium truncate">
                      <span className="text-slate-400 text-[11px]">{t('entry_manager_name', 'Manager')}:</span> {store.managerName || 'N/A'}
                    </div>
                    {store.managerPhone && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={`tel:${store.managerPhone}`}
                          className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300 px-2 py-0.5 rounded hover:bg-emerald-100 transition"
                        >
                          {t('card_call', 'Call')}
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
                      <div className="text-[10px] uppercase font-bold text-slate-400">{t('ledger_total_visits', 'Total Visits')}</div>
                      <div className="text-sm font-black text-slate-900 dark:text-white">{visitCount}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">{t('filter_received', 'Received')}</div>
                      <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        ₹{totalReceived.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">{t('filter_pending', 'Pending')}</div>
                      <div className="text-sm font-black text-rose-600 dark:text-rose-400">
                        ₹{totalPending.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Last Cleaned Info */}
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      <span>{t('ledger_last_cleaned', 'Last Cleaned')}:</span>
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {lastClean ? lastClean.cleaningDate : t('ledger_no_visits', 'No visits recorded yet')}
                    </span>
                  </div>

                </div>

                {/* Card Action Buttons */}
                <div className="p-3 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/50 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onViewStoreHistory(store)}
                      className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>{t('ledger_view_history', 'View History')}</span>
                    </button>

                    <button
                      onClick={() => onLogCleaningForStore(store)}
                      className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-blinkit-green hover:bg-blinkit-darkgreen text-white transition flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t('ledger_log_cleaning', 'Log Cleaning')}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => exportSingleStoreExcel(store, cleanings)}
                      className="flex-1 py-1 px-2 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 text-[11px] font-bold transition flex items-center justify-center gap-1"
                      title="Download Store Cleaning History in Excel format"
                    >
                      <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                      <span>Excel (.xlsx)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => generateSingleStoreStatementPDF(store, cleanings)}
                      className="flex-1 py-1 px-2 rounded-lg bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 text-[11px] font-bold transition flex items-center justify-center gap-1"
                      title="Download Store Cleaning Statement in PDF format"
                    >
                      <FileText className="w-3 h-3 text-rose-600" />
                      <span>PDF (.pdf)</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center bg-white dark:bg-slate-800/60 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 p-8">
          <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {t('ledger_no_stores', 'No stores found in Ledger')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {t('ledger_empty_desc', 'Add your Blinkit dark stores to the ledger once. Afterward, you can log visits with 1-click auto-fill!')}
          </p>
          <button
            onClick={onAddNewStore}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blinkit-green text-white font-bold text-xs hover:bg-blinkit-darkgreen shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t('ledger_add_first', 'Add First Store to Ledger')}</span>
          </button>
        </div>
      )}

    </div>
  );
}
