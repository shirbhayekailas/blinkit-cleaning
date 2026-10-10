import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  Search, 
  MapPin, 
  ExternalLink, 
  FileText, 
  FileSpreadsheet, 
  Sparkles,
  Eye,
  Info,
  CheckCheck
} from 'lucide-react';
import { toast } from './Toast';
import { useLanguage } from '../context/LanguageContext';
import { 
  formatSelectedStoresWhatsApp, 
  shareSelectedStoresWhatsApp 
} from '../utils/whatsappFormatter';
import { generateStoreListPDF } from '../utils/reportPdfGenerator';
import { exportStoreListExcel } from '../utils/reportExcelGenerator';
import { getStoreKey, doesCleaningMatchStore } from '../utils/storeUtils';

export default function StoreShareModal({
  isOpen,
  onClose,
  stores = [],
  cleanings = [],
  initialSelectedIds = [],
  onSelectionChange
}) {
  const { t } = useLanguage();

  const getStoreId = (s) => (s.id ? String(s.id) : getStoreKey(s));

  // Selection state (local to modal while active)
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [viewFilter, setViewFilter] = useState('all'); // 'all' | 'selected' | 'unselected'
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Formatting options
  const [includeManager, setIncludeManager] = useState(true);
  const [includeAddress, setIncludeAddress] = useState(true);
  const [includeMaps, setIncludeMaps] = useState(true);
  const [includeCleanings, setIncludeCleanings] = useState(true);
  const [customNote, setCustomNote] = useState('');
  const [targetPhone, setTargetPhone] = useState('');

  // Ref to guarantee initialization happens strictly ONCE when the modal opens
  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      // Modal is opening fresh
      if (initialSelectedIds && initialSelectedIds.length > 0) {
        setSelectedIds(new Set(initialSelectedIds.map(String)));
      } else {
        // If nothing was selected before opening, select all by default so user can immediately share or deselect
        setSelectedIds(new Set(stores.map(getStoreId)));
      }
      setSearchTerm('');
      setSelectedCity('all');
      setViewFilter('all');
      setCopied(false);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  // Extract unique cities
  const uniqueCities = useMemo(() => {
    return Array.from(new Set(stores.map(s => s.city).filter(Boolean))).sort();
  }, [stores]);

  // Filtered stores based on search and filters
  const modalFilteredStores = useMemo(() => {
    return stores.filter(s => {
      const sId = getStoreId(s);
      if (viewFilter === 'selected' && !selectedIds.has(sId)) return false;
      if (viewFilter === 'unselected' && selectedIds.has(sId)) return false;

      const matchesCity = selectedCity === 'all' || s.city === selectedCity;
      if (!matchesCity) return false;

      const q = searchTerm.trim().toLowerCase();
      if (!q) return true;

      return (
        (s.storeName || '').toLowerCase().includes(q) ||
        (s.storeCode || '').toLowerCase().includes(q) ||
        (s.city || '').toLowerCase().includes(q) ||
        (s.managerName || '').toLowerCase().includes(q) ||
        (s.managerPhone || '').toLowerCase().includes(q) ||
        (s.address || '').toLowerCase().includes(q)
      );
    });
  }, [stores, viewFilter, selectedCity, searchTerm, selectedIds]);

  // Currently selected store objects
  const selectedStores = useMemo(() => {
    return stores.filter(s => selectedIds.has(getStoreId(s)));
  }, [stores, selectedIds]);

  // Formatted message preview
  const formattedMessage = useMemo(() => {
    return formatSelectedStoresWhatsApp(selectedStores, cleanings, {
      includeManager,
      includeAddress,
      includeMaps,
      includeCleanings,
      customNote,
      title: `BLINKIT DARK STORE SELECTION (${selectedStores.length})`
    });
  }, [selectedStores, cleanings, includeManager, includeAddress, includeMaps, includeCleanings, customNote]);

  if (!isOpen) return null;

  // Toggle single store
  const toggleStore = (s) => {
    const id = getStoreId(s);
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Select all currently filtered stores
  const handleSelectAllFiltered = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      modalFilteredStores.forEach(s => next.add(getStoreId(s)));
      return next;
    });
  };

  // Deselect all currently filtered stores
  const handleDeselectFiltered = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      modalFilteredStores.forEach(s => next.delete(getStoreId(s)));
      return next;
    });
  };

  // Select entire catalog
  const handleSelectAll = () => {
    setSelectedIds(new Set(stores.map(getStoreId)));
  };

  // Clear all selections
  const handleClearAll = () => {
    setSelectedIds(new Set());
  };

  // Close and synchronize state back to parent
  const handleClose = () => {
    if (onSelectionChange) {
      onSelectionChange(Array.from(selectedIds));
    }
    onClose();
  };

  // Handle WhatsApp Share
  const handleShareWhatsApp = () => {
    if (selectedStores.length === 0) {
      toast.warning('Please select at least 1 store to share.', 'No Store Selected');
      return;
    }
    if (onSelectionChange) {
      onSelectionChange(Array.from(selectedIds));
    }
    shareSelectedStoresWhatsApp(selectedStores, cleanings, {
      includeManager,
      includeAddress,
      includeMaps,
      includeCleanings,
      customNote,
      title: `BLINKIT DARK STORE SELECTION (${selectedStores.length})`
    }, targetPhone);
    toast.success(`Opening WhatsApp for ${selectedStores.length} stores!`, 'WhatsApp Ready');
  };

  // Handle Copy Message
  const handleCopyMessage = () => {
    if (selectedStores.length === 0) {
      toast.warning('Please select at least 1 store to copy.', 'No Store Selected');
      return;
    }
    navigator.clipboard.writeText(formattedMessage);
    setCopied(true);
    toast.success(`WhatsApp message for ${selectedStores.length} stores copied to clipboard!`, 'Copied!');
    setTimeout(() => setCopied(false), 2500);
  };

  // Handle PDF Export
  const handleExportPDF = () => {
    if (selectedStores.length === 0) {
      toast.warning('Please select at least 1 store to export PDF.', 'No Store Selected');
      return;
    }
    if (onSelectionChange) {
      onSelectionChange(Array.from(selectedIds));
    }
    generateStoreListPDF({
      stores: selectedStores,
      cleanings,
      filterLabel: `Selected Stores (${selectedStores.length})`,
      sortBy: 'storeCodeAsc'
    });
  };

  // Handle Excel Export
  const handleExportExcel = () => {
    if (selectedStores.length === 0) {
      toast.warning('Please select at least 1 store to export Excel.', 'No Store Selected');
      return;
    }
    if (onSelectionChange) {
      onSelectionChange(Array.from(selectedIds));
    }
    exportStoreListExcel(
      selectedStores,
      cleanings,
      `Selected Stores (${selectedStores.length})`,
      { sortBy: 'storeCodeAsc' }
    );
  };

  return (
    <div 
      className="fixed inset-0 z-100 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 md:p-6 animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-50/70 via-white to-slate-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-900 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Share2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 truncate">
                <span>Share Stores on WhatsApp</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {selectedIds.size} of {stores.length} Selected
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Select specific stores to generate a clean, formatted WhatsApp broadcast message
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0 active:scale-95"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 min-h-0 bg-slate-50/50 dark:bg-slate-950/40">
          
          {/* Top Controls: Search, City Filter, and Selection Counts */}
          <div className="bg-white dark:bg-slate-800/90 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              
              {/* Search Bar */}
              <div className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search store code, name, city, manager, address..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* City Filter & View Filter Tabs */}
              <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto pb-1 sm:pb-0">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="px-2.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">📍 All Cities ({stores.length})</option>
                  {uniqueCities.map(city => (
                    <option key={city} value={city}>
                      📍 {city} ({stores.filter(s => s.city === city).length})
                    </option>
                  ))}
                </select>

                {/* View Tabs: All vs Selected Only vs Unselected */}
                <div className="inline-flex rounded-xl p-0.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setViewFilter('all')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                      viewFilter === 'all'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    All ({stores.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewFilter('selected')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                      viewFilter === 'selected'
                        ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Selected ({selectedIds.size})
                  </button>
                </div>
              </div>
            </div>

            {/* Bulk Selection Actions Bar */}
            <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-700/50 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Showing {modalFilteredStores.length} stores:
                </span>
                
                {/* Select All Filtered Button */}
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold hover:bg-emerald-100 transition active:scale-95 border border-emerald-200 dark:border-emerald-800"
                >
                  ✓ Select All ({modalFilteredStores.length})
                </button>

                {/* Deselect Filtered Button */}
                <button
                  type="button"
                  onClick={handleDeselectFiltered}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold hover:bg-slate-200 transition active:scale-95 border border-slate-200 dark:border-slate-700"
                >
                  ✕ Deselect Filtered
                </button>

                {/* Clear All Selection Button */}
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold hover:bg-rose-100 transition active:scale-95 border border-rose-200 dark:border-rose-800"
                >
                  Clear All ({selectedIds.size})
                </button>
              </div>

              <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  {selectedIds.size} of {stores.length} Selected
                </span>
              </div>
            </div>
          </div>

          {/* Store Selection Grid / List */}
          <div className="space-y-2 max-h-[42vh] overflow-y-auto pr-1">
            {modalFilteredStores.length > 0 ? (
              modalFilteredStores.map((store) => {
                const sId = getStoreId(store);
                const isSelected = selectedIds.has(sId);

                // Quick visit metrics
                const storeVisits = cleanings.filter(c => doesCleaningMatchStore(c, store));
                const lastClean = storeVisits
                  .map(c => c.cleaningDate)
                  .filter(Boolean)
                  .sort()
                  .reverse()[0];

                return (
                  <div
                    key={sId}
                    onClick={() => toggleStore(store)}
                    className={`p-3 rounded-2xl border transition cursor-pointer select-none flex items-start gap-3 ${
                      isSelected
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-600 shadow-2xs'
                        : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {/* Native Checkbox with stopPropagation */}
                    <div className="pt-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        id={`modal_chk_${sId}`}
                        checked={isSelected}
                        onChange={() => toggleStore(store)}
                        className="w-5 h-5 rounded-md text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                      />
                    </div>

                    {/* Store Information */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950 shrink-0">
                          {store.storeCode || store.code || 'N/A'}
                        </span>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {store.storeName || store.name || 'Dark Store'}
                        </h4>
                        {store.city && (
                          <span className="text-[11px] px-1.5 py-0.5 rounded-md font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                            {store.city}
                          </span>
                        )}
                      </div>

                      {/* Address & Maps */}
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                        <span className="truncate">{store.address || 'Address not listed'}</span>
                        {store.googleMapsUrl && (
                          <a
                            href={store.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5 shrink-0 font-semibold ml-1"
                          >
                            <span>Maps</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>

                      {/* Manager & Activity Meta */}
                      <div className="mt-1.5 flex items-center justify-between gap-2 flex-wrap text-[11px] text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <span>
                            👤 <strong className="text-slate-700 dark:text-slate-200">{store.managerName || 'No Manager'}</strong>
                            {store.managerPhone && ` (${store.managerPhone})`}
                          </span>
                        </div>

                        {storeVisits.length > 0 && (
                          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                            🧹 {storeVisits.length} Visits Logged {lastClean ? `(Last: ${lastClean})` : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 text-xs space-y-2">
                <p>
                  {viewFilter === 'selected' 
                    ? 'No dark stores selected. Click "All" tab or "Select All" to pick stores.' 
                    : 'No dark stores match your search filter.'}
                </p>
                {viewFilter === 'selected' && (
                  <button
                    type="button"
                    onClick={() => setViewFilter('all')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition"
                  >
                    Show All Stores
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Broadcast Customization Options Accordion */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 p-3.5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Customize WhatsApp Message Content
              </span>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-bold"
              >
                <Eye className="w-3.5 h-3.5" />
                {showPreview ? 'Hide Message Preview' : 'Live WhatsApp Preview'}
              </button>
            </div>

            {/* Checkbox toggles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeManager}
                  onChange={(e) => setIncludeManager(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Manager & Phone</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeAddress}
                  onChange={(e) => setIncludeAddress(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Full Address</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeMaps}
                  onChange={(e) => setIncludeMaps(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Maps Navigation</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeCleanings}
                  onChange={(e) => setIncludeCleanings(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Visit Stats</span>
              </label>
            </div>

            {/* Optional Custom Note & Direct Phone Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div>
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="Optional note: e.g. Night shift deep cleaning roster for tonight..."
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={targetPhone}
                  onChange={(e) => setTargetPhone(e.target.value)}
                  placeholder="Optional phone: e.g. 9876543210 (or leave blank to pick in WhatsApp)"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Collapsible WhatsApp Preview Box */}
            {showPreview && (
              <div className="pt-2 animate-in fade-in duration-200">
                <div className="p-3 bg-emerald-950/10 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60 text-xs font-mono text-slate-800 dark:text-emerald-200 whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {formattedMessage}
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Character count: {formattedMessage.length}</span>
                  {formattedMessage.length > 2500 && (
                    <span className="text-amber-600 font-semibold flex items-center gap-1">
                      <Info className="w-3 h-3" /> Tip: For 20+ stores, use "Copy Message" for best reliability
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer / Action Buttons */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          
          {/* Quick PDF & Excel Downloads for Selected Stores */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={selectedStores.length === 0}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 disabled:opacity-40 transition active:scale-95 cursor-pointer"
              title="Download PDF List of Selected Stores"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF ({selectedStores.length})</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={selectedStores.length === 0}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 disabled:opacity-40 transition active:scale-95 cursor-pointer"
              title="Download Excel List of Selected Stores"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel ({selectedStores.length})</span>
            </button>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyMessage}
              disabled={selectedStores.length === 0}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 disabled:opacity-40 transition active:scale-95 cursor-pointer"
              title="Copy formatted message to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy Message'}</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              disabled={selectedStores.length === 0}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-700/20 disabled:opacity-40 transition active:scale-95 cursor-pointer"
            >
              <Share2 className="w-4 h-4 stroke-[2.5]" />
              <span>Send on WhatsApp ({selectedStores.length})</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
