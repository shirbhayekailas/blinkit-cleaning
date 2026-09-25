import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Download, 
  Database, 
  Sparkles, 
  Sun, 
  Moon, 
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
  KeyRound, 
  Briefcase, 
  History,
  Menu,
  X,
  Layers,
  ChevronRight,
  MapPin
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
  onChangeAdminPassword,
  onOpenLoginLogs
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = currentUserRole === 'admin';
  const isManager = currentUserRole === 'manager';
  const isOpsStaff = isAdmin || isManager;

  // Helper to trigger mobile menu actions and auto-close drawer
  const triggerMobileAction = (actionFn) => {
    setIsMobileMenuOpen(false);
    if (typeof actionFn === 'function') {
      actionFn();
    }
  };

  return (
    <>
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
            
            {/* Logo & Brand: SK ENTERPRISES + Blinkit Partner */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 text-amber-400 font-black text-base sm:text-lg shadow-md border-2 border-amber-400/80 shrink-0">
                SK
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-black text-sm sm:text-base tracking-tight text-slate-900 dark:text-white">
                    SK ENTERPRISES
                  </span>
                  <span className="hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/60 items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Blinkit Facility Partner</span>
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 -mt-0.5 truncate flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-500 shrink-0 hidden sm:inline" />
                  <span>303, Sector-2, Taloja Phase-1, Navi Mumbai | 📞 09594023629</span>
                </p>
              </div>
            </div>

            {/* Desktop Search Bar */}
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

            {/* Desktop & Mobile Actions Row */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              
              {/* Role Switcher Pill */}
              <button
                onClick={onOpenLogin}
                title="Click to Switch Role or Re-Login"
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center gap-1 sm:gap-1.5 border shadow-2xs ${
                  isAdmin
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                    : isManager
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800'
                      : currentUserRole === 'client'
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                }`}
              >
                {isAdmin ? (
                  <>
                    <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600" />
                    <span>Admin</span>
                  </>
                ) : isManager ? (
                  <>
                    <Briefcase className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-600" />
                    <span>Manager</span>
                  </>
                ) : currentUserRole === 'client' ? (
                  <>
                    <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600" />
                    <span>Client</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" />
                    <span className="truncate max-w-[80px] sm:max-w-[120px]">{currentSupervisor?.name || 'Supervisor'}</span>
                  </>
                )}
              </button>

              {/* Desktop Quick Master PIN (Admin only) */}
              {isAdmin && onChangeAdminPassword && (
                <button
                  type="button"
                  onClick={onChangeAdminPassword}
                  title="Change Admin Master PIN"
                  className="hidden sm:inline-flex p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 transition"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                title="Toggle Dark Mode"
                className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Logout Button (ALWAYS VISIBLE & PROMINENT ON DESKTOP & MOBILE) */}
              {onLogout && (
                <button
                  onClick={onLogout}
                  title="Logout to Login Screen"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 hover:dark:bg-rose-900/60 border border-rose-200 dark:border-rose-900 shadow-2xs transition active:scale-95 shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              )}

              {/* Desktop Add New Cleaning Button */}
              <button
                onClick={onOpenNewEntry}
                className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-xl bg-blinkit-green hover:bg-blinkit-darkgreen text-white shadow-md shadow-emerald-700/20 hover:shadow-lg transition transform active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>{isOpsStaff ? 'New Cleaning' : 'Log Shift'}</span>
              </button>

            </div>

          </div>

          {/* Segmented Tab Navigation & Operations Command Row */}
          <div className="py-2 border-t border-slate-100 dark:border-slate-800/60">
            {/* Desktop View: Tabs on Left, Operations Management Tools on Right */}
            <div className="hidden sm:flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('cleanings')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    activeTab === 'cleanings'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>🧹 Cleaning Visits &amp; Logs</span>
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
                  <span>🏬 Store Master Ledger</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    activeTab === 'ledger' ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {storeCount}
                  </span>
                </button>
              </div>

              {/* Desktop Operations Management Tools Ribbon */}
              {isOpsStaff && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={onOpenSchedule}
                    title="Tonight's Shift & Cleaning Schedule Planner"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition shadow-2xs"
                  >
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Schedule</span>
                  </button>

                  <button
                    onClick={onOpenChemicals}
                    title="Chemical Stock & Consumption Inventory"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition shadow-2xs"
                  >
                    <FlaskConical className="w-3.5 h-3.5 text-purple-500" />
                    <span>Chemicals</span>
                  </button>

                  <button
                    onClick={onOpenCleaners}
                    title="Cleaners Team Roster & Staff Management"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 transition shadow-2xs"
                  >
                    <Users className="w-3.5 h-3.5 text-teal-600" />
                    <span>Cleaners</span>
                  </button>

                  <button
                    onClick={onOpenKhata}
                    title="Cleaner Staff Haziri & Advance Payout Khata"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition shadow-2xs"
                  >
                    <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Staff Khata</span>
                  </button>

                  <button
                    onClick={onOpenConsolidatedInvoice}
                    title="Monthly Consolidated Multi-Store Tax Invoice Generator"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-200 border border-amber-300/60 dark:border-amber-800 transition shadow-2xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
                    <span>Monthly Bill</span>
                  </button>

                  {/* Passwords Button: Strictly ONLY for Admin */}
                  {isAdmin && (
                    <button
                      onClick={onOpenUserAccess}
                      title="Security Center: View & Edit Passwords for All Users (Admin Only)"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/70 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700 transition shadow-2xs"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      <span>Passwords</span>
                    </button>
                  )}

                  {/* Login Audit Logs: Visible to both Admin & Manager */}
                  {onOpenLoginLogs && (
                    <button
                      onClick={onOpenLoginLogs}
                      title="Login Activity & Audit Logs"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition shadow-2xs"
                    >
                      <History className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Login Logs</span>
                    </button>
                  )}

                  {/* Issues Alert Chip on Desktop */}
                  <button
                    onClick={onOpenIssues}
                    title="Dark Store Maintenance Defects & Alerts"
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl transition shadow-2xs ${
                      issuesCount > 0
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300/60 animate-pulse'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Issues {issuesCount > 0 && `(${issuesCount})`}</span>
                  </button>

                  <button
                    onClick={onExportExcel}
                    title="Export all data to Excel"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Excel</span>
                  </button>

                  <button
                    onClick={onOpenCloudSync}
                    title="Global Cloud Sync"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition shadow-2xs"
                  >
                    <Cloud className="w-3.5 h-3.5 text-blue-500" />
                    <span>Sync</span>
                  </button>

                  <button
                    onClick={onOpenBackup}
                    title="Backup or Restore Data"
                    className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition shadow-2xs"
                  >
                    <Database className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={onOpenNewStore}
                    className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition flex items-center gap-1 shadow-2xs"
                  >
                    <Building2 className="w-3.5 h-3.5 text-amber-500" />
                    <span>+ Add Store</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Native Segmented Control (100% width, 50%/50% split) */}
            <div className="sm:hidden grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-2xl gap-1">
              <button
                onClick={() => setActiveTab('cleanings')}
                className={`py-2 px-2 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'cleanings'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <span>🧹 Cleanings</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                  activeTab === 'cleanings' ? 'bg-blinkit-green text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {cleaningCount}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('ledger')}
                className={`py-2 px-2 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'ledger'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <span>🏬 Store Ledger</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                  activeTab === 'ledger' ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {storeCount}
                </span>
              </button>
            </div>

          </div>

          {/* Mobile Search Bar */}
          <div className="pb-2.5 pt-0.5 md:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search store name, BLK code, city..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-blinkit-green"
              />
            </div>
          </div>

        </div>
      </header>


      {/* FIXED MOBILE NATIVE BOTTOM NAVIGATION BAR (Visible strictly on mobile < md) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 shadow-xl px-2 py-1.5 pb-safe flex items-center justify-around">
        
        {/* Tab 1: Cleanings */}
        <button
          onClick={() => setActiveTab('cleanings')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
            activeTab === 'cleanings' ? 'text-blinkit-green font-bold' : 'text-slate-500 dark:text-slate-400 font-medium'
          }`}
        >
          <Sparkles className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Cleanings</span>
        </button>

        {/* Tab 2: Store Ledger */}
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
            activeTab === 'ledger' ? 'text-amber-500 font-bold' : 'text-slate-500 dark:text-slate-400 font-medium'
          }`}
        >
          <Building2 className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Stores</span>
        </button>

        {/* Center Floating + New Action Button */}
        <div className="flex-1 flex justify-center -mt-5">
          <button
            onClick={onOpenNewEntry}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-blinkit-darkgreen via-blinkit-green to-emerald-400 text-white flex items-center justify-center shadow-lg shadow-emerald-600/40 border-2 border-white dark:border-slate-900 active:scale-95 transition transform"
            title="Create New Cleaning Entry"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* Tab 4: Schedule / Night Route */}
        {isOpsStaff ? (
          <button
            onClick={onOpenSchedule}
            className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 dark:text-slate-400 font-medium hover:text-indigo-600 transition"
          >
            <Calendar className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Schedule</span>
          </button>
        ) : (
          <button
            onClick={() => setActiveTab('cleanings')}
            className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 dark:text-slate-400 font-medium"
          >
            <Layers className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Inspect</span>
          </button>
        )}

        {/* Tab 5: More Features / Drawer Toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-white transition relative"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">More Hub</span>
          {issuesCount > 0 && (
            <span className="absolute top-0.5 right-4 w-2 h-2 bg-rose-500 rounded-full" />
          )}
        </button>

      </nav>


      {/* MOBILE OPERATIONS ACTION SHEET DRAWER MODAL */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex flex-col justify-end md:hidden animate-fade-in">
          
          {/* Backdrop close */}
          <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />

          {/* Drawer Sheet Body */}
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 max-h-[85vh] overflow-y-auto p-5 pb-safe shadow-2xl space-y-5 animate-slide-up">
            
            {/* Header & Close */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blinkit-yellow text-slate-950 font-black flex items-center justify-center text-lg shadow-xs">
                  b
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Operations Hub
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Logged in as: <span className="font-bold capitalize text-blinkit-green">{currentUserRole}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onLogout && (
                  <button
                    onClick={() => triggerMobileAction(onLogout)}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 text-xs font-black flex items-center gap-1 shadow-2xs transition active:scale-95"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                )}
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Add Actions */}
            {isOpsStaff && (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => triggerMobileAction(onOpenNewEntry)}
                  className="p-3 rounded-2xl bg-blinkit-green text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-98 transition"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>+ New Cleaning</span>
                </button>

                <button
                  onClick={() => triggerMobileAction(onOpenNewStore)}
                  className="p-3 rounded-2xl bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-98 transition"
                >
                  <Building2 className="w-4 h-4" />
                  <span>+ Add Store</span>
                </button>
              </div>
            )}

            {/* SECTION 1: Shift & Field Operations */}
            {isOpsStaff && (
              <div className="space-y-2">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Daily Shift &amp; Field Ops
                </div>
                <div className="grid grid-cols-2 gap-2 text-left">
                  <button
                    onClick={() => triggerMobileAction(onOpenSchedule)}
                    className="p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800 text-left transition"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Calendar className="w-5 h-5 text-indigo-600" />
                      <ChevronRight className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="text-xs font-bold text-indigo-950 dark:text-indigo-200">Shift Schedule</div>
                    <div className="text-[10px] text-indigo-600 dark:text-indigo-400">Tonight's plan</div>
                  </button>

                  <button
                    onClick={() => triggerMobileAction(onOpenMorningSummary)}
                    className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800 text-left transition"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Sun className="w-5 h-5 text-amber-500" />
                      <ChevronRight className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-xs font-bold text-amber-950 dark:text-amber-200">Morning Summary</div>
                    <div className="text-[10px] text-amber-600 dark:text-amber-400">6 AM Flash WA</div>
                  </button>

                  <button
                    onClick={() => triggerMobileAction(onOpenNightRoute)}
                    className="p-3 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800 text-left transition"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Navigation className="w-5 h-5 text-blue-600" />
                      <ChevronRight className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-xs font-bold text-blue-950 dark:text-blue-200">Night Route</div>
                    <div className="text-[10px] text-blue-600 dark:text-blue-400">Google Maps order</div>
                  </button>

                  <button
                    onClick={() => triggerMobileAction(onOpenIssues)}
                    className="p-3 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800 text-left transition relative"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                      {issuesCount > 0 ? (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full font-black bg-rose-600 text-white">
                          {issuesCount}
                        </span>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-rose-400" />
                      )}
                    </div>
                    <div className="text-xs font-bold text-rose-950 dark:text-rose-200">Store Issues</div>
                    <div className="text-[10px] text-rose-600 dark:text-rose-400">Defects &amp; alerts</div>
                  </button>
                </div>
              </div>
            )}

            {/* SECTION 2: Staff & Inventory */}
            {isOpsStaff && (
              <div className="space-y-2">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Staff &amp; Chemical Inventory
                </div>
                <div className="grid grid-cols-2 gap-2 text-left">
                  <button
                    onClick={() => triggerMobileAction(onOpenChemicals)}
                    className="p-3 rounded-2xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800 text-left transition"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <FlaskConical className="w-5 h-5 text-purple-600" />
                      <ChevronRight className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-xs font-bold text-purple-950 dark:text-purple-200">Chemical Stock</div>
                    <div className="text-[10px] text-purple-600 dark:text-purple-400">Taski R-Series Ltr</div>
                  </button>

                  <button
                    onClick={() => triggerMobileAction(onOpenKhata)}
                    className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-left transition"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Wallet className="w-5 h-5 text-emerald-600" />
                      <ChevronRight className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-xs font-bold text-emerald-950 dark:text-emerald-200">Staff Khata</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400">Haziri &amp; advances</div>
                  </button>

                  <button
                    onClick={() => triggerMobileAction(onOpenSupervisors)}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left transition"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Users className="w-5 h-5 text-emerald-600" />
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Supervisors</div>
                    <div className="text-[10px] text-slate-500">Site leads</div>
                  </button>

                  <button
                    onClick={() => triggerMobileAction(onOpenCleaners)}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left transition"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <HardHat className="w-5 h-5 text-amber-500" />
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Cleaners Team</div>
                    <div className="text-[10px] text-slate-500">Roster &amp; daily wages</div>
                  </button>
                </div>
              </div>
            )}

            {/* SECTION 3: Finance, Backup & Reports */}
            {isOpsStaff && (
              <div className="space-y-2">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Billing &amp; Cloud Database
                </div>
                <div className="grid grid-cols-2 gap-2 text-left">
                  <button
                    onClick={() => triggerMobileAction(onOpenConsolidatedInvoice)}
                    className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800 text-left transition"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <FileSpreadsheet className="w-5 h-5 text-amber-600" />
                      <ChevronRight className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-xs font-bold text-amber-950 dark:text-amber-200">Monthly Bill</div>
                    <div className="text-[10px] text-amber-600 dark:text-amber-400">Consolidated GST</div>
                  </button>

                  <button
                    onClick={() => triggerMobileAction(onExportExcel)}
                    className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800 text-left transition"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Download className="w-5 h-5 text-emerald-600" />
                      <ChevronRight className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-xs font-bold text-emerald-950 dark:text-emerald-200">Export Excel</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400">Full workbook</div>
                  </button>

                  <button
                    onClick={() => triggerMobileAction(onOpenBackup)}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left transition"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Database className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Backup / Restore</div>
                    <div className="text-[10px] text-slate-500">Offline JSON save</div>
                  </button>

                  <button
                    onClick={() => triggerMobileAction(onOpenCloudSync)}
                    className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800 text-left transition"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Cloud className="w-5 h-5 text-blue-600" />
                      <ChevronRight className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-xs font-bold text-blue-950 dark:text-blue-200">Cloud Sync</div>
                    <div className="text-[10px] text-blue-600 dark:text-blue-400">Remote database</div>
                  </button>
                </div>
              </div>
            )}

            {/* SECTION 4: Security & Passwords */}
            <div className="space-y-2">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Security &amp; Audit Logs
              </div>
              <div className="grid grid-cols-2 gap-2 text-left">
                {/* Admin-only Password Management */}
                {isAdmin ? (
                  <>
                    <button
                      onClick={() => triggerMobileAction(onOpenUserAccess)}
                      className="p-3 rounded-2xl bg-amber-500 text-slate-950 font-bold text-left shadow-xs transition"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <KeyRound className="w-5 h-5" />
                        <ChevronRight className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-black">Passwords Center</div>
                      <div className="text-[10px] text-slate-900/80">Manage all user PINs</div>
                    </button>

                    <button
                      onClick={() => triggerMobileAction(onChangeAdminPassword)}
                      className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left transition"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <KeyRound className="w-5 h-5 text-amber-500" />
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Change Master PIN</div>
                      <div className="text-[10px] text-slate-500">Update Admin PIN</div>
                    </button>
                  </>
                ) : null}

                {/* Login Audit Logs: Visible to both Admin & Manager */}
                {onOpenLoginLogs && (
                  <button
                    onClick={() => triggerMobileAction(onOpenLoginLogs)}
                    className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-left transition col-span-2"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <History className="w-5 h-5 text-blue-600" />
                        <span className="text-xs font-bold text-blue-950 dark:text-blue-200">
                          Login Activity &amp; Audit Logs
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-[10px] text-blue-600 dark:text-blue-400">
                      Live record of who logged in and when (timestamp &amp; role)
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* SECTION 5: App Utilities & Logout */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <button
                onClick={() => {
                  window.dispatchEvent(new Event('trigger-pwa-install'));
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <Smartphone className="w-4 h-4 text-blinkit-green" />
                <span>Install Mobile App (PWA)</span>
              </button>

              {onLogout && (
                <button
                  onClick={() => triggerMobileAction(onLogout)}
                  className="w-full py-2.5 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 font-bold text-xs flex items-center justify-center gap-2 transition border border-rose-200 dark:border-rose-900/40"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout from Session</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
