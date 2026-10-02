import React, { useState, useMemo, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  X, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Filter, 
  Calendar, 
  Building2, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  IndianRupee, 
  Layers, 
  TrendingUp, 
  Sparkles,
  ArrowDownToLine,
  Phone,
  FileCheck
} from 'lucide-react';
import {
  exportMasterExcel,
  exportPendingPaymentsExcel,
  exportCompletedPaymentsExcel,
  exportAllCleaningsExcel,
  exportStorePerformanceExcel,
  naturalSortByStoreCode
} from '../utils/reportExcelGenerator';
import {
  generateMasterExecutiveReportPDF,
  generatePendingPaymentsPDF,
  generateCompletedPaymentsPDF,
  generateAllCleaningsPDF,
  generateStoreSummaryPDF
} from '../utils/reportPdfGenerator';

export default function ReportsCenterModal({
  isOpen,
  onClose,
  cleanings = [],
  stores = []
}) {
  const { t } = useLanguage();

  // Scroll navigation refs
  const previewRef = useRef(null);
  const reportsRef = useRef(null);

  const scrollToPreview = () => {
    previewRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToReports = () => {
    reportsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Filter states
  const [periodFilter, setPeriodFilter] = useState('all'); // 'all' | 'this_month' | 'last_month' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedStore, setSelectedStore] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewTab, setPreviewTab] = useState('pending'); // 'pending' | 'completed' | 'all' | 'stores'
  const [card4Mode, setCard4Mode] = useState('with_amount'); // 'with_amount' | 'without_amount'
  const [card5Mode, setCard5Mode] = useState('with_amount'); // 'with_amount' | 'without_amount'
  const [previewMode, setPreviewMode] = useState('with_amount'); // 'with_amount' | 'without_amount'

  // Compute date bounds for filters
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Format month bounds
  const thisMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const lastMonthPrefix = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

  // Filter label for reports
  let filterLabel = 'All Time Records';
  if (periodFilter === 'this_month') {
    filterLabel = `This Month (${now.toLocaleString('default', { month: 'long', year: 'numeric' })})`;
  } else if (periodFilter === 'last_month') {
    filterLabel = `Last Month (${lastMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' })})`;
  } else if (periodFilter === 'custom' && (customStartDate || customEndDate)) {
    filterLabel = `Custom Range (${customStartDate || 'Start'} to ${customEndDate || 'End'})`;
  }

  // Filtered cleanings based on user inputs
  const filteredCleanings = useMemo(() => {
    return cleanings.filter(c => {
      // 1. Period filter
      if (periodFilter === 'this_month') {
        if (!c.cleaningDate || !c.cleaningDate.startsWith(thisMonthPrefix)) return false;
      } else if (periodFilter === 'last_month') {
        if (!c.cleaningDate || !c.cleaningDate.startsWith(lastMonthPrefix)) return false;
      } else if (periodFilter === 'custom') {
        if (customStartDate && (!c.cleaningDate || c.cleaningDate < customStartDate)) return false;
        if (customEndDate && (!c.cleaningDate || c.cleaningDate > customEndDate)) return false;
      }

      // 2. Store filter
      if (selectedStore !== 'all') {
        if ((c.storeCode || '') !== selectedStore && (c.storeName || '') !== selectedStore) {
          return false;
        }
      }

      // 3. Search query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const match = 
          (c.storeCode || '').toLowerCase().includes(q) ||
          (c.storeName || '').toLowerCase().includes(q) ||
          (c.city || '').toLowerCase().includes(q) ||
          (c.managerName || '').toLowerCase().includes(q) ||
          (c.utrNumber || '').toLowerCase().includes(q) ||
          (c.supervisorName || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
    return naturalSortByStoreCode(list);
  }, [cleanings, periodFilter, thisMonthPrefix, lastMonthPrefix, customStartDate, customEndDate, selectedStore, searchTerm]);

  // Derived datasets
  const pendingCleanings = useMemo(() => {
    const list = filteredCleanings.filter(c => 
      c.paymentStatus === 'Pending' || 
      c.paymentStatus === 'Partial' || 
      Number(c.amountPending) > 0 ||
      (Number(c.amount) - Number(c.amountReceived) > 0)
    );
    return naturalSortByStoreCode(list);
  }, [filteredCleanings]);

  const completedCleanings = useMemo(() => {
    const list = filteredCleanings.filter(c => 
      c.paymentStatus === 'Received' || 
      c.paymentStatus === 'Completed' ||
      (Number(c.amountReceived) > 0 && Number(c.amountPending) <= 0)
    );
    return naturalSortByStoreCode(list);
  }, [filteredCleanings]);

  // Store performance summary
  const storeSummaryList = useMemo(() => {
    const map = new Map();

    stores.forEach(s => {
      const key = (s.storeCode || s.code || s.storeName || '').trim();
      if (key) {
        map.set(key, {
          code: s.storeCode || s.code || '',
          name: s.storeName || s.name || '',
          city: s.city || '',
          manager: s.managerName || '',
          phone: s.managerPhone || '',
          cleaningsCount: 0,
          totalBilled: 0,
          totalReceived: 0,
          totalPending: 0,
          lastCleanDate: ''
        });
      }
    });

    filteredCleanings.forEach(c => {
      const key = (c.storeCode || c.storeName || '').trim();
      if (!key) return;

      let item = map.get(key);
      if (!item) {
        item = {
          code: c.storeCode || '',
          name: c.storeName || '',
          city: c.city || '',
          manager: c.managerName || '',
          phone: c.managerPhone || '',
          cleaningsCount: 0,
          totalBilled: 0,
          totalReceived: 0,
          totalPending: 0,
          lastCleanDate: ''
        };
        map.set(key, item);
      }

      const billed = Number(c.amount) || 0;
      const recv = Number(c.amountReceived) || 0;
      const pend = c.amountPending !== undefined ? Number(c.amountPending) : Math.max(0, billed - recv);

      item.cleaningsCount += 1;
      item.totalBilled += billed;
      item.totalReceived += recv;
      item.totalPending += pend;

      if (!item.lastCleanDate || (c.cleaningDate && c.cleaningDate > item.lastCleanDate)) {
        item.lastCleanDate = c.cleaningDate;
      }
    });

    return naturalSortByStoreCode(Array.from(map.values()), s => s.code);
  }, [filteredCleanings, stores]);

  // Summary totals
  const totalBilled = filteredCleanings.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const totalReceived = filteredCleanings.reduce((sum, c) => sum + (Number(c.amountReceived) || 0), 0);
  const totalPending = filteredCleanings.reduce((sum, c) => {
    const pend = c.amountPending !== undefined ? Number(c.amountPending) : Math.max(0, (Number(c.amount) || 0) - (Number(c.amountReceived) || 0));
    return sum + pend;
  }, 0);
  const collectionRate = totalBilled > 0 ? Math.round((totalReceived / totalBilled) * 100) : 0;

  // Unique stores for dropdown
  const storeOptions = useMemo(() => {
    const seen = new Set();
    const list = [];
    stores.forEach(s => {
      const code = s.storeCode || s.code;
      if (code && !seen.has(code)) {
        seen.add(code);
        list.push({ code, name: s.storeName || s.name || code });
      }
    });
    cleanings.forEach(c => {
      const code = c.storeCode;
      if (code && !seen.has(code)) {
        seen.add(code);
        list.push({ code, name: c.storeName || code });
      }
    });
    return naturalSortByStoreCode(list, item => item.code);
  }, [stores, cleanings]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[94dvh] sm:h-[90vh] max-h-[94dvh] sm:max-h-[90vh] my-auto">
        
        {/* ========================================================= */}
        {/* MODAL HEADER */}
        {/* ========================================================= */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                  {t('reports_center_title', 'Comprehensive Reports & Financial Center')}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/50">
                  Excel & PDF
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {t('reports_center_subtitle', 'Generate well-formatted Excel (.xlsx) workbooks & Executive PDF (.pdf) statements')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <button
              onClick={scrollToPreview}
              type="button"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 text-xs font-bold transition shadow-2xs"
              title="Jump down to Live Preview"
            >
              <span>👁️ Live Preview</span>
              <span className="text-[10px]">↓</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition shrink-0"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SCROLLABLE MODAL BODY (DESKTOP & MOBILE TOUCH OPTIMIZED) */}
        {/* ========================================================= */}
        <div className="flex-1 overflow-y-auto min-h-0 overscroll-contain divide-y divide-slate-200 dark:divide-slate-800 touch-pan-y">

          {/* ========================================================= */}
          {/* FILTERS & SEARCH TOOLBAR */}
          {/* ========================================================= */}
          <div ref={reportsRef} className="p-3.5 sm:p-5 bg-slate-100/60 dark:bg-slate-850/40 space-y-3">
          
          {/* Row 1: Period Presets & Store Dropdown */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Period Filter Buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <button
                onClick={() => setPeriodFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  periodFilter === 'all'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => setPeriodFilter('this_month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  periodFilter === 'this_month'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setPeriodFilter('last_month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  periodFilter === 'last_month'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                Last Month
              </button>
              <button
                onClick={() => setPeriodFilter('custom')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  periodFilter === 'custom'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                Custom
              </button>
            </div>

            {/* Store Dropdown & Search */}
            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
              >
                <option value="all">All Dark Stores ({storeOptions.length})</option>
                {storeOptions.map(s => (
                  <option key={s.code} value={s.code}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>

              <div className="relative flex-1 sm:w-52">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter table..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Custom Date Inputs (if custom selected) */}
          {periodFilter === 'custom' && (
            <div className="flex items-center gap-3 pt-1 animate-in fade-in duration-100">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Date Range:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>
          )}

          {/* Row 3: Live KPI Numbers Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cleanings</div>
              <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">{filteredCleanings.length}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Billed</div>
              <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">₹{totalBilled.toLocaleString('en-IN')}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 shadow-2xs">
              <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Collected</div>
              <div className="text-base font-black text-emerald-800 dark:text-emerald-300 mt-0.5">₹{totalReceived.toLocaleString('en-IN')}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/80 shadow-2xs">
              <div className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Pending Dues</div>
              <div className="text-base font-black text-rose-800 dark:text-rose-300 mt-0.5">₹{totalPending.toLocaleString('en-IN')}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-2xs col-span-2 sm:col-span-1">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Collection Rate</div>
              <div className="text-base font-black text-amber-600 dark:text-amber-400 mt-0.5">{collectionRate}%</div>
            </div>
          </div>

        </div>

        {/* ========================================================= */}
        {/* DOWNLOAD ACTION CARDS SECTION */}
        {/* ========================================================= */}
        <div className="p-3.5 sm:p-5 bg-white dark:bg-slate-900">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Download Audit Reports ({filterLabel})
            </span>
            <span className="text-[11px] text-slate-400 font-normal">Instant 1-Click Generation</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            
            {/* Card 1: ALL-IN-ONE MASTER PACKAGE */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border-2 border-emerald-500/30 dark:border-emerald-500/20 shadow-xs relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-2xs">
                      ★
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white">Master Package (All-in-One)</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-600 text-white uppercase">5 Sheets</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Full consolidated package: Executive Summary, Pending Payments, Completed Settlements, Cleaning Log & Store Ledger.
                </p>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-emerald-500/20">
                <button
                  onClick={() => exportMasterExcel(filteredCleanings, stores, filterLabel)}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
                  title="Download complete 5-sheet formatted Excel workbook"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Master Excel</span>
                </button>
                <button
                  onClick={() => generateMasterExecutiveReportPDF({ cleanings: filteredCleanings, stores, filterLabel })}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
                  title="Download Executive Consolidated PDF statement"
                >
                  <FileText className="w-3.5 h-3.5 text-rose-400" />
                  <span>Master PDF</span>
                </button>
              </div>
            </div>

            {/* Card 2: PENDING PAYMENTS REPORT */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 flex items-center justify-center">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white">Pending Payments Report</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                    {pendingCleanings.length} Stores Due
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Outstanding dues follow-up list with overdue days, dark store details, pending amounts & bank transfer info.
                </p>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-200 dark:border-slate-750">
                <button
                  onClick={() => exportPendingPaymentsExcel(filteredCleanings, filterLabel)}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => generatePendingPaymentsPDF({ cleanings: filteredCleanings, filterLabel })}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF (.pdf)</span>
                </button>
              </div>
            </div>

            {/* Card 3: COMPLETED PAYMENTS REGISTER */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white">Completed Payments Log</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300">
                    {completedCleanings.length} Cleared
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Realized revenue & settled accounts with settlement dates, payment modes (UPI/NEFT) and UTR verification numbers.
                </p>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-200 dark:border-slate-750">
                <button
                  onClick={() => exportCompletedPaymentsExcel(filteredCleanings, filterLabel)}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => generateCompletedPaymentsPDF({ cleanings: filteredCleanings, filterLabel })}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF (.pdf)</span>
                </button>
              </div>
            </div>

            {/* Card 4: ALL CLEANING RECORDS MASTER */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 flex items-center justify-center">
                      <Layers className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white">All Cleaning Operations Master</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                    {filteredCleanings.length} Records
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Full deep cleaning register with shift timings, supervisors deployed, audit ratings, photo proofs & verified execution.
                </p>

                {/* Dual Option Toggle: With Amount vs Without Amount */}
                <div className="mt-2.5 p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCard4Mode('with_amount')}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition ${
                      card4Mode === 'with_amount'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    💰 With Amount
                  </button>
                  <button
                    type="button"
                    onClick={() => setCard4Mode('without_amount')}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition ${
                      card4Mode === 'without_amount'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    📋 Without Amount (Ops)
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-200 dark:border-slate-750">
                <button
                  onClick={() => exportAllCleaningsExcel(filteredCleanings, filterLabel, { includeFinancials: card4Mode === 'with_amount' })}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
                  title={card4Mode === 'with_amount' ? "Excel with full billing & rates" : "Excel without money/financials"}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel ({card4Mode === 'with_amount' ? 'With Amt' : 'No Amt'})</span>
                </button>
                <button
                  onClick={() => generateAllCleaningsPDF({ cleanings: filteredCleanings, filterLabel, includeFinancials: card4Mode === 'with_amount' })}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
                  title={card4Mode === 'with_amount' ? "PDF with full billing & rates" : "PDF without money/financials"}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF ({card4Mode === 'with_amount' ? 'With Amt' : 'No Amt'})</span>
                </button>
              </div>
            </div>

            {/* Card 5: STORE-WISE PERFORMANCE & LEDGER */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 flex items-center justify-center">
                      <Building2 className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white">Store Performance & Ledger</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    {storeSummaryList.length} Stores
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Store-by-store breakdown of cleaning counts, dark store addresses, coverage frequency and audit status.
                </p>

                {/* Dual Option Toggle: With Amount vs Without Amount */}
                <div className="mt-2.5 p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCard5Mode('with_amount')}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition ${
                      card5Mode === 'with_amount'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    💰 With Amount
                  </button>
                  <button
                    type="button"
                    onClick={() => setCard5Mode('without_amount')}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition ${
                      card5Mode === 'without_amount'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    📋 Without Amount (Audit)
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-200 dark:border-slate-750">
                <button
                  onClick={() => exportStorePerformanceExcel(filteredCleanings, stores, filterLabel, { includeFinancials: card5Mode === 'with_amount' })}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
                  title={card5Mode === 'with_amount' ? "Excel ledger with dues & settlements" : "Excel audit without money"}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel ({card5Mode === 'with_amount' ? 'With Amt' : 'No Amt'})</span>
                </button>
                <button
                  onClick={() => generateStoreSummaryPDF({ cleanings: filteredCleanings, stores, filterLabel, includeFinancials: card5Mode === 'with_amount' })}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
                  title={card5Mode === 'with_amount' ? "PDF ledger with dues & settlements" : "PDF audit without money"}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF ({card5Mode === 'with_amount' ? 'With Amt' : 'No Amt'})</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================= */}
        {/* INTERACTIVE LIVE PREVIEW SECTION */}
        {/* ========================================================= */}
        <div ref={previewRef} className="p-3.5 sm:p-5 bg-slate-50 dark:bg-slate-900/50 space-y-3">
          
          {/* Preview Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-2.5">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              <button
                onClick={() => setPreviewTab('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  previewTab === 'pending'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>⏳ Pending Payments</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-black">
                  {pendingCleanings.length}
                </span>
              </button>

              <button
                onClick={() => setPreviewTab('completed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  previewTab === 'completed'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>✅ Completed Payments</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-black">
                  {completedCleanings.length}
                </span>
              </button>

              <button
                onClick={() => setPreviewTab('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  previewTab === 'all'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>🧹 All Cleanings</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-black">
                  {filteredCleanings.length}
                </span>
              </button>

              <button
                onClick={() => setPreviewTab('stores')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  previewTab === 'stores'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>🏬 Store Performance</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-black">
                  {storeSummaryList.length}
                </span>
              </button>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2">
              {(previewTab === 'all' || previewTab === 'stores') && (
                <div className="flex items-center p-0.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <button
                    onClick={() => setPreviewMode('with_amount')}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition ${
                      previewMode === 'with_amount'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    💰 With Amount
                  </button>
                  <button
                    onClick={() => setPreviewMode('without_amount')}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition ${
                      previewMode === 'without_amount'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    📋 Without Amount (Ops)
                  </button>
                </div>
              )}
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                Live Preview
              </span>
              <button
                onClick={scrollToReports}
                type="button"
                className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition ml-2"
                title="Scroll back up to report download cards"
              >
                <span>↑ Top</span>
              </button>
            </div>
          </div>

          {/* Table Container with Horizontal Scroll */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-inner">
            
            {/* 1. Pending Payments Table */}
            {previewTab === 'pending' && (
              <table className="w-full text-left text-xs min-w-[720px]">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold sticky top-0 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Store</th>
                    <th className="py-2.5 px-3">Cleaning Date</th>
                    <th className="py-2.5 px-3">Store Address</th>
                    <th className="py-2.5 px-3 text-right">Billed</th>
                    <th className="py-2.5 px-3 text-right">Received</th>
                    <th className="py-2.5 px-3 text-right">Pending Dues</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pendingCleanings.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-8 text-slate-400">
                        🎉 Great news! No pending payments found for this filter.
                      </td>
                    </tr>
                  ) : (
                    pendingCleanings.map((c, i) => {
                      const billed = Number(c.amount) || 0;
                      const recv = Number(c.amountReceived) || 0;
                      const pend = c.amountPending !== undefined ? Number(c.amountPending) : Math.max(0, billed - recv);

                      return (
                        <tr key={c.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          <td className="py-2.5 px-3 font-semibold text-slate-400">{i + 1}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                            <div>{c.storeName || '-'}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{c.storeCode} ({c.city})</div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{c.cleaningDate}</td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 max-w-[180px] truncate" title={c.address}>
                            {c.address || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium">₹{billed.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-right font-medium text-emerald-600">₹{recv.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-rose-600">₹{pend.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                              {c.paymentStatus || 'Pending'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}

            {/* 2. Completed Payments Table */}
            {previewTab === 'completed' && (
              <table className="w-full text-left text-xs min-w-[720px]">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold sticky top-0 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Store</th>
                    <th className="py-2.5 px-3">Clean Date</th>
                    <th className="py-2.5 px-3">Payment Date</th>
                    <th className="py-2.5 px-3">Payment Mode</th>
                    <th className="py-2.5 px-3">UTR / Ref No</th>
                    <th className="py-2.5 px-3 text-right">Amount Paid</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {completedCleanings.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-8 text-slate-400">
                        No completed payment records found for this filter.
                      </td>
                    </tr>
                  ) : (
                    completedCleanings.map((c, i) => {
                      const billed = Number(c.amount) || 0;
                      const recv = Number(c.amountReceived) || billed;

                      return (
                        <tr key={c.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          <td className="py-2.5 px-3 font-semibold text-slate-400">{i + 1}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                            <div>{c.storeName || '-'}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{c.storeCode}</div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{c.cleaningDate}</td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{c.paymentDate || c.cleaningDate}</td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{c.paymentMode || 'UPI / Transfer'}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700 dark:text-slate-300">{c.utrNumber || 'VERIFIED'}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-600">₹{recv.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              Full Paid
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}

            {/* 3. All Cleanings Table */}
            {previewTab === 'all' && (
              <table className="w-full text-left text-xs min-w-[780px]">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold sticky top-0 border-b border-slate-200 dark:border-slate-700">
                  {previewMode === 'without_amount' ? (
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Store</th>
                      <th className="py-2.5 px-3">Date & Shift</th>
                      <th className="py-2.5 px-3">Supervisor</th>
                      <th className="py-2.5 px-3">Team Deployed</th>
                      <th className="py-2.5 px-3">Scope of Work</th>
                      <th className="py-2.5 px-3 text-center">Rating</th>
                      <th className="py-2.5 px-3 text-center">Photos</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Store</th>
                      <th className="py-2.5 px-3">Date & Shift</th>
                      <th className="py-2.5 px-3">Supervisor</th>
                      <th className="py-2.5 px-3 text-center">Rating</th>
                      <th className="py-2.5 px-3 text-right">Invoiced</th>
                      <th className="py-2.5 px-3 text-right">Received</th>
                      <th className="py-2.5 px-3 text-right">Pending</th>
                      <th className="py-2.5 px-3 text-center">Payment</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCleanings.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center py-8 text-slate-400">
                        No cleaning records matched your search/filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredCleanings.map((c, i) => {
                      const billed = Number(c.amount) || 0;
                      const recv = Number(c.amountReceived) || 0;
                      const pend = c.amountPending !== undefined ? Number(c.amountPending) : Math.max(0, billed - recv);
                      const scopeStr = Array.isArray(c.scopeOfWork)
                        ? c.scopeOfWork.slice(0, 2).join(', ')
                        : 'Floor, Washroom, Cold Room';

                      if (previewMode === 'without_amount') {
                        return (
                          <tr key={c.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                            <td className="py-2.5 px-3 font-semibold text-slate-400">{i + 1}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                              <div>{c.storeName || '-'}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{c.storeCode} ({c.city})</div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                              <div>{c.cleaningDate}</div>
                              <div className="text-[10px] text-slate-400">{c.shift || 'Night Shift'}</div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{c.supervisorName || '-'}</td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                              <div>{c.teamMembers || 'Trained Staff'}</div>
                              <div className="text-[10px] text-slate-400">{c.headcount || 1} cleaners</div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 max-w-[160px] truncate" title={Array.isArray(c.scopeOfWork) ? c.scopeOfWork.join(', ') : scopeStr}>
                              {scopeStr}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-amber-500">⭐ {c.rating || 5}</td>
                            <td className="py-2.5 px-3 text-center font-medium text-slate-600 dark:text-slate-300">
                              {(c.photos && c.photos.length) || 0} pics
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                {c.status || 'Completed'}
                              </span>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={c.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          <td className="py-2.5 px-3 font-semibold text-slate-400">{i + 1}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                            <div>{c.storeName || '-'}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{c.storeCode} ({c.city})</div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                            <div>{c.cleaningDate}</div>
                            <div className="text-[10px] text-slate-400">{c.shift || 'Night Shift'}</div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{c.supervisorName || '-'}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-amber-500">⭐ {c.rating || 5}</td>
                          <td className="py-2.5 px-3 text-right font-medium">₹{billed.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-right font-medium text-emerald-600">₹{recv.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-rose-600">₹{pend.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.paymentStatus === 'Received'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            }`}>
                              {c.paymentStatus || 'Pending'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}

            {/* 4. Store Performance Table */}
            {previewTab === 'stores' && (
              <table className="w-full text-left text-xs min-w-[720px]">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold sticky top-0 border-b border-slate-200 dark:border-slate-700">
                  {previewMode === 'without_amount' ? (
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Store Name & Code</th>
                      <th className="py-2.5 px-3">City</th>
                      <th className="py-2.5 px-3">Store Address</th>
                      <th className="py-2.5 px-3 text-center">Cleanings Done</th>
                      <th className="py-2.5 px-3">Last Cleaned Date</th>
                      <th className="py-2.5 px-3 text-center">Operational Status</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Store Name & Code</th>
                      <th className="py-2.5 px-3">City</th>
                      <th className="py-2.5 px-3 text-center">Cleanings Done</th>
                      <th className="py-2.5 px-3 text-right">Invoiced</th>
                      <th className="py-2.5 px-3 text-right">Received</th>
                      <th className="py-2.5 px-3 text-right">Pending Dues</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {storeSummaryList.map((s, i) => {
                    if (previewMode === 'without_amount') {
                      return (
                        <tr key={s.code || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          <td className="py-2.5 px-3 font-semibold text-slate-400">{i + 1}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                            <div>{s.name || '-'}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{s.code}</div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{s.city || '-'}</td>
                          <td className="py-2.5 px-3 text-slate-500 max-w-[200px] truncate" title={s.address || '-'}>
                            {s.address || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-blue-600">{s.cleaningsCount}</td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{s.lastCleanDate || '-'}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              s.cleaningsCount > 0
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            }`}>
                              {s.cleaningsCount > 0 ? 'Active / Serviced' : 'Pending First Cycle'}
                            </span>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={s.code || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="py-2.5 px-3 font-semibold text-slate-400">{i + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                          <div>{s.name || '-'}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{s.code}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{s.city || '-'}</td>
                        <td className="py-2.5 px-3 text-center font-bold">{s.cleaningsCount}</td>
                        <td className="py-2.5 px-3 text-right font-medium">₹{s.totalBilled.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-right font-medium text-emerald-600">₹{s.totalReceived.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-600">₹{s.totalPending.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.totalPending === 0
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}>
                            {s.totalPending === 0 ? 'All Cleared' : 'Pending Dues'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

          </div>
        </div>

        </div> {/* End of scrollable modal body */}

        {/* ========================================================= */}
        {/* MODAL FOOTER */}
        {/* ========================================================= */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between shrink-0 z-10">
          <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            Reports formatted according to standard Blinkit vendor audit & financial requirements.
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={scrollToReports}
              type="button"
              className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 sm:hidden flex items-center gap-1"
            >
              ↑ Back to top
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
