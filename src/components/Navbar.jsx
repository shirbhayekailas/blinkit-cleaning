import React from 'react';
import { 
  Plus, 
  Search, 
  Download, 
  Database, 
  Sparkles, 
  Sun, 
  Moon,
  Filter,
  Building2,
  Users,
  HardHat,
  AlertTriangle,
  UserCheck,
  ShieldCheck,
  LogOut,
  FlaskConical,
  FileSpreadsheet,
  Wallet,
  Calendar,
  Smartphone,
  Cloud,
  Navigation,
  KeyRound
} from 'lucide-react';

export default function Navbar({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  paymentFilter,
  setPaymentFilter,
  onOpenNewEntry,
  onOpenNewStore,
  onExportExcel,
  onOpenBackup,
  darkMode,
  setDarkMode,
  activeTab,
  setActiveTab,
  cleaningCount = 0,
  storeCount = 0,
  currentUserRole = 'admin',
  currentSupervisor = null,
  onOpenLogin,
  onOpenSupervisors,
  onOpenCleaners,
  onOpenIssues,
  issuesCount = 0,
  onLogout,
  onOpenConsolidatedInvoice,
  onOpenChemicals,
  onOpenKhata,
  onOpenSchedule,
  onOpenCloudSync,
  onOpenMorningSummary,
  onOpenNightRoute,
  onOpenUserAccess,
  onChangeAdminPassword
}) {

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blinkit-yellow text-slate-950 font-black text-xl shadow-md border border-amber-300">
              b
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                  blink<span className="text-blinkit-green">it</span>
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300/40">
                  DEEP CLEANING OPS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-0.5 hidden sm:block">
                Dark Store Hygiene, Timings & Payment Tracker
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search store name, code (BLK-...), city, manager..."
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blinkit-green text-slate-800 dark:text-slate-100 placeholder-slate-400 transition"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Role Switcher Pill */}
            <button
              onClick={onOpenLogin}
              title="Click to Switch Role or Re-Login"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-xs ${
                currentUserRole === 'admin'
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
              }`}
            >
              {currentUserRole === 'admin' ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>👑 Admin (Owner)</span>
                </>
              ) : currentUserRole === 'client' ? (
                <>
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>🏢 Blinkit City Ops</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="truncate max-w-[100px] sm:max-w-[130px]">👷 {currentSupervisor?.name || 'Supervisor'}</span>
                </>
              )}
            </button>

            {/* Quick Admin Change PIN Button */}
            {currentUserRole === 'admin' && onChangeAdminPassword && (
              <button
                type="button"
                onClick={onChangeAdminPassword}
                title="Change Admin Master PIN / Password"
                className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 transition shadow-xs"
              >
                <KeyRound className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                title="Logout to Login Screen"
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition flex items-center gap-1 border border-slate-200 dark:border-slate-800 shadow-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}

            {/* Admin Management Shortcuts (Only visible to Admin) */}
            {currentUserRole === 'admin' && (
              <>
                <button
                  onClick={onOpenSchedule}
                  title="Tonight's Shift & Cleaning Schedule Planner"
                  className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition"
                >
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Schedule</span>
                </button>

                <button
                  onClick={onOpenChemicals}
                  title="Chemical Stock & Consumption Inventory"
                  className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition"
                >
                  <FlaskConical className="w-3.5 h-3.5 text-purple-500" />
                  <span>Chemicals</span>
                </button>

                <button
                  onClick={onOpenKhata}
                  title="Cleaner Staff Haziri & Advance Payout Khata"
                  className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition"
                >
                  <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Staff Khata</span>
                </button>

                <button
                  onClick={onOpenConsolidatedInvoice}
                  title="Monthly Consolidated Multi-Store Tax Invoice Generator"
                  className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-200 border border-amber-300/60 dark:border-amber-800 transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
                  <span>Monthly Bill</span>
                </button>

                <button
                  onClick={onOpenUserAccess}
                  title="Security Center: View & Edit Passwords for All Users (Supervisors & Master)"
                  className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 transition"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                  <span>Passwords</span>
                </button>

                <button
                  onClick={onOpenSupervisors}
                  title="Manage Site Supervisors & Store Assignments"
                  className="hidden xl:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                >
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Supervisors</span>
                </button>

                <button
                  onClick={onOpenCleaners}
                  title="Manage Cleaner Team & Wages"
                  className="hidden xl:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                >
                  <HardHat className="w-3.5 h-3.5 text-amber-500" />
                  <span>Cleaners</span>
                </button>

                <button
                  onClick={onOpenIssues}
                  title="Dark Store Maintenance Defects & Alerts"
                  className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl transition ${
                    issuesCount > 0
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300/60 animate-pulse'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  <span>Issues ({issuesCount})</span>
                </button>
                <button
                  onClick={onOpenMorningSummary}
                  title="Generate 6:00 AM Morning Flash Summary for WhatsApp"
                  className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800 transition shadow-xs"
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Morning Summary</span>
                </button>

                <button
                  onClick={onOpenNightRoute}
                  title="Multi-Store Night Route & Google Maps Navigation"
                  className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition shadow-xs"
                >
                  <Navigation className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Night Route</span>
                </button>

                <button
                  onClick={onOpenCloudSync}
                  title="Global Cloud Sync & Remote Database"
                  className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition shadow-xs"
                >
                  <Cloud className="w-3.5 h-3.5 text-blue-500" />
                  <span>Cloud Sync</span>
                </button>
              </>
            )}

            {/* Excel Export */}
            {currentUserRole === 'admin' && (
              <button
                onClick={onExportExcel}
                title="Export all data to Excel"
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
            )}

            {/* Backup / Restore */}
            {currentUserRole === 'admin' && (
              <button
                onClick={onOpenBackup}
                title="Backup or Restore Data"
                className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <Database className="w-4 h-4" />
              </button>
            )}

            {/* Install App Button */}
            <button
              onClick={() => window.dispatchEvent(new Event('trigger-pwa-install'))}
              title="Install App on Phone / Desktop"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-blinkit-green/10 hover:bg-blinkit-green/20 text-blinkit-green dark:text-emerald-400 border border-blinkit-green/30 transition shadow-xs"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Install App</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              title="Toggle Dark Mode"
              className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Add New Store Button (Admin only) */}
            {currentUserRole === 'admin' && (
              <button
                onClick={onOpenNewStore}
                className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
              >
                <Building2 className="w-3.5 h-3.5 text-amber-500" />
                <span>+ Add Store</span>
              </button>
            )}

            {/* Add New Cleaning Entry */}
            <button
              onClick={onOpenNewEntry}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-xl bg-blinkit-green hover:bg-blinkit-darkgreen text-white shadow-md shadow-emerald-700/20 hover:shadow-lg transition transform active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{currentUserRole === 'admin' ? 'New Cleaning' : 'Log Shift'}</span>
            </button>
          </div>


        </div>

        {/* Tab Navigation Row */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800/60 py-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('cleanings')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'cleanings'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>🧹 Cleaning Visits & Logs</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                activeTab === 'cleanings' ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {cleaningCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'ledger'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>🏬 Store Master Ledger & History</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                activeTab === 'ledger' ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {storeCount}
              </span>
            </button>
          </div>

          <div className="lg:hidden flex items-center gap-1">
            <button
              onClick={onOpenNewStore}
              className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              + Store
            </button>
          </div>
        </div>

        {/* Mobile Search & Filter Bar */}
        <div className="pb-3 pt-1 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search store name, code, city..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

      </div>
    </header>
  );
}
