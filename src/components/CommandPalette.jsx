import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Sparkles, 
  Building2, 
  Calendar, 
  Plus, 
  FileSpreadsheet, 
  FlaskConical, 
  Wallet, 
  HardHat, 
  Users, 
  AlertTriangle, 
  Navigation, 
  Sun, 
  Moon, 
  ArrowRight, 
  CornerDownLeft, 
  X,
  FileText
} from 'lucide-react';

export default function CommandPalette({
  isOpen,
  onClose,
  stores = [],
  cleanings = [],
  supervisors = [],
  cleaners = [],
  onOpenNewEntry,
  onOpenNewStore,
  onOpenSchedule,
  onOpenChemicals,
  onOpenKhata,
  onOpenIssues,
  onOpenConsolidatedInvoice,
  onOpenNightRoute,
  onOpenMorningSummary,
  onExportExcel,
  onToggleDarkMode,
  darkMode,
  onViewStoreHistory,
  onLogCleaningForStore
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  // 1. Quick Actions List
  const quickActions = [
    {
      id: 'action-new-cleaning',
      category: 'Operations',
      icon: <Plus className="w-4 h-4 text-emerald-500" />,
      title: '+ Log Deep Cleaning Entry',
      subtitle: 'Add new dark store night cleaning log with photos',
      shortcut: 'N',
      run: onOpenNewEntry
    },
    {
      id: 'action-new-store',
      category: 'Master Data',
      icon: <Building2 className="w-4 h-4 text-indigo-500" />,
      title: '+ Register New Dark Store',
      subtitle: 'Add dark store code, location, and billing rate',
      shortcut: 'S',
      run: onOpenNewStore
    },
    {
      id: 'action-schedule',
      category: 'Operations',
      icon: <Calendar className="w-4 h-4 text-purple-500" />,
      title: "Tonight's Cleaning Schedule & Roster",
      subtitle: 'Plan tonight shifts and assign supervisors',
      shortcut: 'C',
      run: onOpenSchedule
    },
    {
      id: 'action-chemicals',
      category: 'Inventory',
      icon: <FlaskConical className="w-4 h-4 text-amber-500" />,
      title: 'Chemical Stock & Consumption',
      subtitle: 'Industrial degreaser, sanitizer & machine pad inventory',
      shortcut: 'K',
      run: onOpenChemicals
    },
    {
      id: 'action-khata',
      category: 'Accounts',
      icon: <Wallet className="w-4 h-4 text-cyan-500" />,
      title: 'Cleaner Staff Haziri & Advance Khata',
      subtitle: 'Daily shifts, cash advances, and monthly payout balance',
      shortcut: 'H',
      run: onOpenKhata
    },
    {
      id: 'action-issues',
      category: 'Maintenance',
      icon: <AlertTriangle className="w-4 h-4 text-rose-500" />,
      title: 'Dark Store Defect & Maintenance Issues',
      subtitle: 'Chiller leaks, floor damages, drainage blocks',
      shortcut: 'I',
      run: onOpenIssues
    },
    {
      id: 'action-invoice',
      category: 'Accounts',
      icon: <FileText className="w-4 h-4 text-emerald-600" />,
      title: 'Monthly Consolidated GST Invoices',
      subtitle: 'Generate standard tax invoice for Blinkit accounts',
      shortcut: 'G',
      run: onOpenConsolidatedInvoice
    },
    {
      id: 'action-route',
      category: 'Operations',
      icon: <Navigation className="w-4 h-4 text-blue-500" />,
      title: 'Night Multi-Store Route Map',
      subtitle: 'Google Maps navigation route for night shift teams',
      shortcut: 'R',
      run: onOpenNightRoute
    },
    {
      id: 'action-morning',
      category: 'Reporting',
      icon: <Sparkles className="w-4 h-4 text-amber-600" />,
      title: '6:00 AM Morning Flash Summary',
      subtitle: '1-Click WhatsApp report for Blinkit Area Ops Head',
      shortcut: 'W',
      run: onOpenMorningSummary
    },
    {
      id: 'action-excel',
      category: 'Reporting',
      icon: <FileSpreadsheet className="w-4 h-4 text-emerald-600" />,
      title: 'Download Excel Spreadsheet (.xlsx)',
      subtitle: 'Export complete store cleanings and payment ledgers',
      shortcut: 'E',
      run: onExportExcel
    },
    {
      id: 'action-theme',
      category: 'Preferences',
      icon: darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />,
      title: darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      subtitle: 'Toggle dashboard appearance',
      shortcut: 'T',
      run: onToggleDarkMode
    }
  ];

  // Filter actions
  const filteredActions = quickActions.filter(a => 
    !q || a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)
  );

  // Filter Dark Stores (Top 5 matches)
  const filteredStores = stores.filter(s => 
    q && (
      (s.storeCode || '').toLowerCase().includes(q) ||
      (s.storeName || '').toLowerCase().includes(q) ||
      (s.city || '').toLowerCase().includes(q) ||
      (s.address || '').toLowerCase().includes(q)
    )
  ).slice(0, 5);

  // Combine items for keyboard navigation
  const allItems = [
    ...filteredStores.map(s => ({ type: 'store', data: s })),
    ...filteredActions.map(a => ({ type: 'action', data: a }))
  ];

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, allItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + allItems.length) % Math.max(1, allItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = allItems[selectedIndex];
      if (current) {
        executeItem(current);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const executeItem = (item) => {
    onClose();
    if (item.type === 'action') {
      if (typeof item.data.run === 'function') item.data.run();
    } else if (item.type === 'store') {
      if (typeof onViewStoreHistory === 'function') onViewStoreHistory(item.data);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-100 flex items-start justify-center pt-[10vh] sm:pt-[15vh] px-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh] animate-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="relative border-b border-slate-200 dark:border-slate-800 px-4 py-3.5 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, dark store code, supervisor, or action... (e.g. 'DL', 'invoice')"
            className="w-full bg-transparent text-sm sm:text-base font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
          />
          {query ? (
            <button 
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/60">
          
          {/* Matched Dark Stores */}
          {filteredStores.length > 0 && (
            <div className="py-2">
              <div className="px-3 pb-1 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
                <span>Dark Stores ({filteredStores.length})</span>
                <span className="text-[10px] lowercase text-slate-400 font-normal">Press Enter to view history</span>
              </div>
              {filteredStores.map((st, i) => {
                const globalIdx = i;
                const isSelected = selectedIndex === globalIdx;
                return (
                  <div
                    key={st.storeCode}
                    onClick={() => executeItem({ type: 'store', data: st })}
                    onMouseEnter={() => setSelectedIndex(globalIdx)}
                    className={`px-3 py-2.5 rounded-2xl cursor-pointer flex items-center justify-between gap-3 transition ${
                      isSelected 
                        ? 'bg-blinkit-green/10 dark:bg-emerald-950/40 text-blinkit-green dark:text-emerald-300' 
                        : 'hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs">{st.storeName || st.storeCode}</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-[10px] font-mono font-bold">
                            {st.storeCode}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{st.city} • {st.address || 'No address'}</p>
                      </div>
                    </div>
                    <ArrowRight className={`w-4 h-4 shrink-0 transition ${isSelected ? 'opacity-100 translate-x-0.5' : 'opacity-0'}`} />
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Actions */}
          {filteredActions.length > 0 && (
            <div className="py-2">
              <div className="px-3 pb-1 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Quick Actions
              </div>
              {filteredActions.map((act, i) => {
                const globalIdx = filteredStores.length + i;
                const isSelected = selectedIndex === globalIdx;
                return (
                  <div
                    key={act.id}
                    onClick={() => executeItem({ type: 'action', data: act })}
                    onMouseEnter={() => setSelectedIndex(globalIdx)}
                    className={`px-3 py-2.5 rounded-2xl cursor-pointer flex items-center justify-between gap-3 transition ${
                      isSelected 
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-850/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        {act.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold leading-tight">{act.title}</div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate leading-tight mt-0.5">
                          {act.subtitle}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                        {act.category}
                      </span>
                      <CornerDownLeft className={`w-3.5 h-3.5 text-slate-400 transition ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {allItems.length === 0 && (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Search className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-bold">No results found for "{query}"</p>
              <p className="text-[11px] text-slate-500">Try searching for store codes like 'DL', 'shift', or 'invoice'</p>
            </div>
          )}

        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span><kbd className="font-mono bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-sm text-[10px]">↑</kbd> <kbd className="font-mono bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-sm text-[10px]">↓</kbd> to navigate</span>
            <span><kbd className="font-mono bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-sm text-[10px]">↵</kbd> to select</span>
            <span><kbd className="font-mono bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-sm text-[10px]">esc</kbd> to close</span>
          </div>
          <span className="font-bold text-slate-400">SK Enterprises Ops Launcher</span>
        </div>

      </div>
    </div>
  );
}
