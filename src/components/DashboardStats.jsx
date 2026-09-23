import React from 'react';
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
  Calendar
} from 'lucide-react';

export default function DashboardStats({
  cleanings = [],
  paymentFilter,
  setPaymentFilter,
  statusFilter,
  setStatusFilter,
  clusterFilter = 'all',
  setClusterFilter,
  cycleFilter = 'all',
  setCycleFilter
}) {
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
              {completedCount} Completed
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            {inProgressCount > 0 ? (
              <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                <Activity className="w-3 h-3 animate-pulse" /> {inProgressCount} currently in-progress
              </span>
            ) : (
              'All scheduled visits recorded'
            )}
          </div>
        </div>

        {/* Card 2: Total Amount Billed */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700/60 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Billed Amount
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
            Across {totalEntries} store operations
          </div>
        </div>

        {/* Card 3: Payment Received */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 sm:p-5 border border-emerald-100 dark:border-emerald-900/30 shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/30 dark:from-slate-800 dark:to-emerald-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Payment Received
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
            {totalBilled > 0 ? `${Math.round((totalReceived / totalBilled) * 100)}% payment collected` : '0%'}
          </div>
        </div>

        {/* Card 4: Payment Pending */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 sm:p-5 border border-rose-100 dark:border-rose-900/30 shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-rose-50/30 dark:from-slate-800 dark:to-rose-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Payment Pending
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
            {pendingPaymentCount} store payments pending/partial
          </div>
        </div>

      </div>

      {/* VENDOR P&L (Profit & Loss / Munafa Bar) */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-300/50 dark:border-emerald-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-base">💰</span>
          <div>
            <span className="font-extrabold text-slate-900 dark:text-white">
              Vendor P&amp;L (Real Profit / Munafa Tracker):
            </span>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Billed Revenue minus Cleaner Labor &amp; Chemical Expenses
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <span className="text-slate-400">Billed:</span>{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">₹{totalBilled.toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span className="text-slate-400">Labor:</span>{' '}
            <span className="font-bold text-rose-600 dark:text-rose-400">-₹{totalLaborCost.toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span className="text-slate-400">Chemicals:</span>{' '}
            <span className="font-bold text-rose-600 dark:text-rose-400">-₹{totalChemicalCost.toLocaleString('en-IN')}</span>
          </div>
          <div className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 font-extrabold text-emerald-800 dark:text-emerald-300">
            Net Profit: ₹{netProfit.toLocaleString('en-IN')} ({marginPct}%)
          </div>
        </div>
      </div>


      {/* Filter Chips Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs">
        
        {/* Left Side: Cycle Alerts & Cluster Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
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
            <span>Overdue ({overdueCount})</span>
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
            <span>Due Soon ({dueSoonCount})</span>
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
                <option value="all">All Clusters / Cities</option>
                {clusters.map((c) => (
                  <option key={c} value={c}>
                    📍 {c}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right Side: Payment & Work Status */}
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
                {status === 'all' ? 'All Pay' : status}
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
                {status === 'all' ? 'All Work' : status}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

