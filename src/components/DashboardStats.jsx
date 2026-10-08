import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  Building2, 
  IndianRupee, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Activity,
  Filter,
  MapPin,
  Bell,
  Calendar,
  ArrowUpDown,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  PieChart,
  ShieldAlert
} from 'lucide-react';

function DashboardStats({
  cleanings = [],
  paymentFilter,
  setPaymentFilter,
  statusFilter,
  setStatusFilter,
  clusterFilter = 'all',
  setClusterFilter,
  cycleFilter = 'all',
  setCycleFilter,
  storeCodeFilter = 'all',
  setStoreCodeFilter,
  uniqueStoreCodes = [],
  cleaningSortBy = 'dateDesc',
  setCleaningSortBy,
  onOpenReportsCenter
}) {
  const { t } = useLanguage();
  const totalEntries = cleanings.length;
  const totalBilled = cleanings.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const totalReceived = cleanings.reduce((sum, c) => sum + (Number(c.amountReceived) || 0), 0);
  const totalPending = cleanings.reduce((sum, c) => sum + (Number(c.amountPending) || 0), 0);

  const completedCount = cleanings.filter(c => c.status === 'Completed').length;
  const inProgressCount = cleanings.filter(c => c.status === 'In-Progress').length;
  const pendingPaymentCount = cleanings.filter(c => c.paymentStatus === 'Pending' || c.paymentStatus === 'Partial').length;

  // Calculate Overdue and Due Soon counts
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueCount = cleanings.filter(c => {
    const cycle = c.nextCleaningCycleDays || 30;
    const d = new Date(c.cleaningDate || new Date());
    d.setDate(d.getDate() + cycle);
    return d < today;
  }).length;

  const dueSoonCount = cleanings.filter(c => {
    const cycle = c.nextCleaningCycleDays || 30;
    const d = new Date(c.cleaningDate || new Date());
    d.setDate(d.getDate() + cycle);
    const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 7;
  }).length;

  // Extract unique clusters/cities
  const clusters = Array.from(new Set(cleanings.map(c => c.city).filter(Boolean)));

  // Calculate P&L (Profit & Loss / Munafa)
  const totalLaborCost = cleanings.reduce((sum, c) => sum + (Number(c.laborCost) || 0), 0);
  const totalChemicalCost = cleanings.reduce((sum, c) => sum + (Number(c.chemicalCost) || 0), 0);
  const totalExpenses = totalLaborCost + totalChemicalCost;
  const netProfit = totalBilled - totalExpenses;
  const marginPct = totalBilled > 0 ? Math.round((netProfit / totalBilled) * 100) : 0;

  const [showInsights, setShowInsights] = useState(false);
  const realizationPct = totalBilled > 0 ? Math.round((totalReceived / totalBilled) * 100) : 0;
  const pendingPct = totalBilled > 0 ? Math.round((totalPending / totalBilled) * 100) : 0;

  // Aging brackets for pending dues
  const agingBuckets = useMemo(() => {
    const buckets = {
      b0_7: { label: '0-7 Days', count: 0, amount: 0, badge: 'Current', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
      b8_15: { label: '8-15 Days', count: 0, amount: 0, badge: 'Due Soon', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
      b16_30: { label: '16-30 Days', count: 0, amount: 0, badge: 'Overdue', color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800' },
      b30plus: { label: '30+ Days', count: 0, amount: 0, badge: 'Critical', color: 'text-rose-700 dark:text-rose-300', bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800' }
    };

    cleanings.forEach(c => {
      const b = Number(c.amount || 0);
      const r = Number(c.amountReceived || 0);
      const p = c.amountPending !== undefined ? Number(c.amountPending) : Math.max(0, b - r);
      if (p > 0) {
        const cDate = new Date(c.cleaningDate || today);
        const days = Math.max(0, Math.floor((today - cDate) / (1000 * 60 * 60 * 24)));
        if (days <= 7) {
          buckets.b0_7.count++;
          buckets.b0_7.amount += p;
        } else if (days <= 15) {
          buckets.b8_15.count++;
          buckets.b8_15.amount += p;
        } else if (days <= 30) {
          buckets.b16_30.count++;
          buckets.b16_30.amount += p;
        } else {
          buckets.b30plus.count++;
          buckets.b30plus.amount += p;
        }
      }
    });

    return buckets;
  }, [cleanings, today]);

  // Regional breakdown by City
  const citySummary = useMemo(() => {
    const map = {};
    cleanings.forEach(c => {
      const city = c.city || 'Other';
      if (!map[city]) map[city] = { visits: 0, billed: 0, pending: 0 };
      map[city].visits++;
      map[city].billed += Number(c.amount || 0);
      const p = c.amountPending !== undefined ? Number(c.amountPending) : Math.max(0, Number(c.amount || 0) - Number(c.amountReceived || 0));
      map[city].pending += p;
    });
    return Object.entries(map).sort((a, b) => b[1].visits - a[1].visits);
  }, [cleanings]);

  return (
    <div className="space-y-4">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Total Cleanings Done */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700/60 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Deep Cleanings
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {totalEntries}
            </span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {completedCount} {t('filter_completed', 'Completed')}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            {inProgressCount > 0 ? (
              <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                <Activity className="w-3 h-3 animate-pulse" /> {inProgressCount} {t('dash_in_progress', 'currently in-progress')}
              </span>
            ) : (
              t('dash_all_recorded', 'All scheduled visits recorded')
            )}
          </div>
        </div>

        {/* Card 2: Total Amount Billed */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700/60 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('dash_total_billed', 'Total Billed Amount')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              ₹{totalBilled.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            {t('dash_across', 'Across')} {totalEntries} {t('dash_store_ops', 'store operations')}
          </div>
        </div>

        {/* Card 3: Payment Received */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 sm:p-5 border border-emerald-100 dark:border-emerald-900/30 shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/30 dark:from-slate-800 dark:to-emerald-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              {t('dash_payment_received', 'Payment Received')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              ₹{totalReceived.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
            {totalBilled > 0 ? `${Math.round((totalReceived / totalBilled) * 100)}% ${t('dash_collected', 'payment collected')}` : '0%'}
          </div>
        </div>

        {/* Card 4: Payment Pending */}
        <div 
          onClick={onOpenReportsCenter}
          className={`bg-white dark:bg-slate-800/90 rounded-2xl p-4 sm:p-5 border border-rose-100 dark:border-rose-900/30 shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-rose-50/30 dark:from-slate-800 dark:to-rose-950/10 ${
            onOpenReportsCenter ? 'cursor-pointer hover:shadow-md transition hover:border-rose-300 dark:hover:border-rose-700' : ''
          }`}
          title={onOpenReportsCenter ? "Click to view and export Pending Payments Report" : ""}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
              <span>{t('dash_payment_pending', 'Payment Pending')}</span>
              {onOpenReportsCenter && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-rose-200/60 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 rounded">
                  Report ↗
                </span>
              )}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
              ₹{totalPending.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-rose-700/80 dark:text-rose-400/80">
            {pendingPaymentCount} {t('dash_payments_pending', 'store payments pending/partial')}
          </div>
        </div>

      </div>

      {/* VENDOR P&L (Profit & Loss / Munafa Bar) */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-300/50 dark:border-emerald-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-base">💰</span>
          <div>
            <span className="font-extrabold text-slate-900 dark:text-white">
              {t('dash_pnl_title', 'Vendor P&L (Real Profit / Munafa Tracker)')}:
            </span>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {t('dash_pnl_desc', 'Billed Revenue minus Cleaner Labor & Chemical Expenses')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <span className="text-slate-400">{t('dash_billed', 'Billed')}:</span>{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">₹{totalBilled.toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span className="text-slate-400">{t('dash_labor', 'Labor')}:</span>{' '}
            <span className="font-bold text-rose-600 dark:text-rose-400">-₹{totalLaborCost.toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span className="text-slate-400">{t('dash_chemicals', 'Chemicals')}:</span>{' '}
            <span className="font-bold text-rose-600 dark:text-rose-400">-₹{totalChemicalCost.toLocaleString('en-IN')}</span>
          </div>
          <div className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 font-extrabold text-emerald-800 dark:text-emerald-300">
            {t('dash_net_profit', 'Net Profit')}: ₹{netProfit.toLocaleString('en-IN')} ({marginPct}%)
          </div>
        </div>
      </div>

      {/* Realization & Aging Progress Strip */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700/60 shadow-xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-extrabold text-slate-800 dark:text-slate-100">
              Payment Realization:
            </span>
            <span className="font-black text-emerald-600 dark:text-emerald-400">
              {realizationPct}% Realized
            </span>
            <span className="text-slate-400">·</span>
            <span className="font-bold text-rose-600 dark:text-rose-400">
              {pendingPct}% Pending (₹{totalPending.toLocaleString('en-IN')})
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowInsights(!showInsights)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition self-start sm:self-auto cursor-pointer"
          >
            <span>{showInsights ? 'Hide Aging & Regional Breakdown' : 'View Aging & Regional Breakdown'}</span>
            {showInsights ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Realization Progress Bar */}
        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex shadow-inner">
          <div 
            style={{ width: `${Math.min(100, Math.max(0, realizationPct))}%` }} 
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500" 
            title={`Realized: ${realizationPct}%`}
          />
          <div 
            style={{ width: `${Math.min(100, Math.max(0, pendingPct))}%` }} 
            className="h-full bg-gradient-to-r from-rose-400 to-rose-600 transition-all duration-500" 
            title={`Pending: ${pendingPct}%`}
          />
        </div>

        {/* Expandable Aging & City Section */}
        {showInsights && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 space-y-3 animate-in fade-in duration-200">
            {/* Aging Buckets Grid */}
            <div>
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Outstanding Aging Analysis (Uncollected Days)</span>
                {onOpenReportsCenter && (
                  <button
                    type="button"
                    onClick={onOpenReportsCenter}
                    className="text-[11px] font-extrabold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                  >
                    Open Outstanding Register ↗
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(agingBuckets).map(([key, bucket]) => (
                  <div key={key} className={`p-2.5 rounded-xl border ${bucket.bg} flex flex-col justify-between`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{bucket.label}</span>
                      <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${bucket.color}`}>
                        {bucket.badge}
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <div className={`text-base font-black ${bucket.color}`}>
                        ₹{bucket.amount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {bucket.count} {bucket.count === 1 ? 'store visit' : 'store visits'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* City Regional Distribution */}
            {citySummary.length > 0 && (
              <div>
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Regional Operations Breakdown
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {citySummary.map(([city, data]) => (
                    <div 
                      key={city}
                      className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-200"
                    >
                      <span>📍 <strong className="font-bold">{city}:</strong> {data.visits} visits (₹{data.billed.toLocaleString('en-IN')})</span>
                      {data.pending > 0 && (
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.2 rounded border border-rose-200 dark:border-rose-800">
                          Due ₹{data.pending.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs">
        
        {/* Left Side: Cycle Alerts & Cluster Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> {t('dash_filter', 'Filter')}:
          </span>

          {/* Overdue Alert Chip */}
          <button
            onClick={() => setCycleFilter(cycleFilter === 'overdue' ? 'all' : 'overdue')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
              cycleFilter === 'overdue'
                ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-400/50'
                : overdueCount > 0
                ? 'bg-rose-50 text-rose-700 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
            }`}
          >
            <AlertCircle className="w-3 h-3" />
            <span>{t('dash_overdue', 'Overdue')} ({overdueCount})</span>
          </button>

          {/* Due Soon (7 Days) Alert Chip */}
          <button
            onClick={() => setCycleFilter(cycleFilter === 'dueSoon' ? 'all' : 'dueSoon')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
              cycleFilter === 'dueSoon'
                ? 'bg-amber-500 text-slate-950 shadow-sm ring-2 ring-amber-300/50'
                : dueSoonCount > 0
                ? 'bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
            }`}
          >
            <Bell className="w-3 h-3" />
            <span>{t('dash_due_soon', 'Due Soon')} ({dueSoonCount})</span>
          </button>

          {/* Cluster / Zone Dropdown */}
          {clusters.length > 0 && (
            <div className="flex items-center gap-1 ml-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={clusterFilter}
                onChange={(e) => setClusterFilter(e.target.value)}
                className="px-2.5 py-1 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blinkit-green"
              >
                <option value="all">{t('dash_all_clusters', 'All Clusters / Cities')}</option>
                {clusters.map((c) => (
                  <option key={c} value={c}>
                    📍 {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Store Code Filter Dropdown */}
          {uniqueStoreCodes && uniqueStoreCodes.length > 0 && (
            <div className="flex items-center gap-1 ml-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={storeCodeFilter}
                onChange={(e) => setStoreCodeFilter && setStoreCodeFilter(e.target.value)}
                className="px-2.5 py-1 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blinkit-green"
              >
                <option value="all">🏬 All Stores ({uniqueStoreCodes.length})</option>
                {uniqueStoreCodes.map((code) => (
                  <option key={code} value={code}>
                    🏬 {code}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right Side: Payment & Work Status & Sort */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Payment Filter */}
          <div className="flex items-center gap-1 flex-wrap">
            {['all', 'Pending', 'Received', 'Partial'].map((status) => (
              <button
                key={status}
                onClick={() => setPaymentFilter(status)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition ${
                  paymentFilter === status
                    ? status === 'Pending'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : status === 'Received'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : status === 'Partial'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                {status === 'all' ? t('dash_all_pay', 'All Pay') : t(`filter_${status.toLowerCase()}`, status)}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

          {/* Work Status Filter */}
          <div className="flex items-center gap-1 flex-wrap">
            {['all', 'Completed', 'In-Progress'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition ${
                  statusFilter === status
                    ? 'bg-blinkit-green text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                {status === 'all' ? t('dash_all_work', 'All Work') : t(`filter_${status.toLowerCase()}`, status)}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          {setCleaningSortBy && (
            <>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />
              <div className="flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={cleaningSortBy || 'dateDesc'}
                  onChange={(e) => setCleaningSortBy(e.target.value)}
                  className="px-2.5 py-1 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blinkit-green"
                >
                  <option value="dateDesc">📅 Date (Newest First)</option>
                  <option value="dateAsc">📅 Date (Oldest First)</option>
                  <option value="storeCodeAsc">🏬 Store Code (ES2 → ES308)</option>
                  <option value="storeCodeDesc">🏬 Store Code (ES308 → ES2)</option>
                  <option value="amountDesc">💰 Amount (High to Low)</option>
                  <option value="amountPendingDesc">⏳ Pending Dues (Highest)</option>
                </select>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

export default React.memo(DashboardStats);

