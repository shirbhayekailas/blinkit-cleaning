import React from 'react';
import { 
  Building2, 
  Calendar, 
  IndianRupee, 
  AlertTriangle, 
  FlaskConical, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  ArrowUpRight,
  ShieldCheck,
  Clock
} from 'lucide-react';

export default function OperationsPulseBar({
  stores = [],
  cleanings = [],
  schedules = [],
  issues = [],
  chemicals = [],
  onOpenSchedule,
  onOpenIssues,
  onOpenChemicals,
  onOpenMorningSummary,
  onOpenConsolidatedInvoice
}) {
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Tonight's shifts
  const tonightSchedules = schedules.filter(s => s.scheduledDate === todayStr);

  // 2. Open defect issues
  const openIssues = issues.filter(i => i.status === 'Open');

  // 3. Low stock chemicals
  const lowStockChemicals = chemicals.filter(c => c.totalStock <= (c.alertThreshold || 10));

  // 4. Financial pulse (current month)
  const currentYearMonth = todayStr.substring(0, 7); // 'YYYY-MM'
  const monthCleanings = cleanings.filter(c => (c.cleaningDate || '').startsWith(currentYearMonth));
  
  let totalBilled = 0;
  let totalReceived = 0;
  monthCleanings.forEach(c => {
    const amt = Number(c.billingAmount || c.amount || 0);
    totalBilled += amt;
    if (c.paymentStatus === 'Received') {
      totalReceived += amt;
    }
  });
  const totalPending = Math.max(0, totalBilled - totalReceived);
  const collectionPercent = totalBilled > 0 ? Math.round((totalReceived / totalBilled) * 100) : 100;

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-y sm:border border-slate-800/80 sm:rounded-3xl shadow-xl p-3 sm:p-4 text-white">
      
      {/* Top micro status header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800/60 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-extrabold uppercase tracking-wider text-emerald-400">
            Operations Pulse
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-300 font-medium hidden sm:inline">
            SK Enterprises Dark Store Fleet
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenMorningSummary}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold transition text-[11px]"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>6:00 AM WhatsApp Flash</span>
          </button>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3.5 pt-3">
        
        {/* KPI 1: Active Fleet */}
        <div className="bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/50 rounded-2xl p-2.5 sm:p-3 transition">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Dark Stores</span>
            <Building2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-white">{stores.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">Across Delhi NCR</div>
        </div>

        {/* KPI 2: Tonight's Shifts */}
        <div 
          onClick={onOpenSchedule}
          className="bg-purple-950/30 hover:bg-purple-900/40 border border-purple-800/50 rounded-2xl p-2.5 sm:p-3 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-purple-300 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Tonight's Shift</span>
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-purple-200">
            {tonightSchedules.length} <span className="text-xs font-normal text-purple-300">stores</span>
          </div>
          <div className="text-[10px] text-purple-300/80 mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3 text-purple-400" />
            <span>01:00 AM - 06:00 AM</span>
          </div>
        </div>

        {/* KPI 3: Billed & Realization (Month) */}
        <div 
          onClick={onOpenConsolidatedInvoice}
          className="bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-800/50 rounded-2xl p-2.5 sm:p-3 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-emerald-300 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Billed (This Month)</span>
            <IndianRupee className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-200">
            ₹{totalBilled.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-emerald-300/80 mt-0.5 flex items-center justify-between">
            <span>{collectionPercent}% Collected</span>
            {totalPending > 0 && <span className="text-rose-400 font-bold">₹{totalPending.toLocaleString('en-IN')} pend</span>}
          </div>
        </div>

        {/* KPI 4: Open Maintenance Defects */}
        <div 
          onClick={onOpenIssues}
          className={`border rounded-2xl p-2.5 sm:p-3 transition cursor-pointer ${
            openIssues.length > 0 
              ? 'bg-rose-950/40 hover:bg-rose-900/50 border-rose-800/60 text-rose-200' 
              : 'bg-slate-800/50 hover:bg-slate-800/80 border-slate-700/50 text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Store Defects</span>
            <AlertTriangle className={`w-4 h-4 ${openIssues.length > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
          </div>
          <div className="text-lg sm:text-xl font-black">
            {openIssues.length} <span className="text-xs font-normal opacity-80">open</span>
          </div>
          <div className="text-[10px] opacity-75 mt-0.5 truncate">
            {openIssues.length > 0 ? 'Needs Blinkit QA fix' : 'All stores healthy'}
          </div>
        </div>

        {/* KPI 5: Chemical Stock Alert */}
        <div 
          onClick={onOpenChemicals}
          className={`border rounded-2xl p-2.5 sm:p-3 transition cursor-pointer col-span-2 sm:col-span-4 lg:col-span-1 ${
            lowStockChemicals.length > 0 
              ? 'bg-amber-950/40 hover:bg-amber-900/50 border-amber-800/60 text-amber-200' 
              : 'bg-slate-800/50 hover:bg-slate-800/80 border-slate-700/50 text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Chemicals</span>
            <FlaskConical className={`w-4 h-4 ${lowStockChemicals.length > 0 ? 'text-amber-400' : 'text-slate-400'}`} />
          </div>
          <div className="text-lg sm:text-xl font-black">
            {chemicals.length} <span className="text-xs font-normal opacity-80">items</span>
          </div>
          <div className="text-[10px] opacity-75 mt-0.5 truncate">
            {lowStockChemicals.length > 0 
              ? `⚠️ ${lowStockChemicals.length} item(s) low stock` 
              : 'All stocks sufficient'}
          </div>
        </div>

      </div>

    </div>
  );
}
