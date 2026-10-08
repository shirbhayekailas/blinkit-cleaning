import React, { useState, useEffect, useRef, useMemo } from 'react';
import Navbar from './components/Navbar';
import DashboardStats from './components/DashboardStats';
import StoreCard from './components/StoreCard';
import CleaningEntryModal from './components/CleaningEntryModal';
import PaymentUpdateModal from './components/PaymentUpdateModal';
import PhotoGalleryModal from './components/PhotoGalleryModal';
import ReportModal from './components/ReportModal';
import BackupModal from './components/BackupModal';
import StoreModal from './components/StoreModal';
import StoreHistoryModal from './components/StoreHistoryModal';
import StoreLedgerView from './components/StoreLedgerView';
import InvoiceModal from './components/InvoiceModal';
import LoginModal from './components/LoginModal';
import LoginPage from './components/LoginPage';
import SupervisorManagementModal from './components/SupervisorManagementModal';
import CleanerRosterModal from './components/CleanerRosterModal';
import IssueReportModal from './components/IssueReportModal';
import SupervisorPortal from './components/SupervisorPortal';
import ConsolidatedInvoiceModal from './components/ConsolidatedInvoiceModal';
import BillSettingsModal from './components/BillSettingsModal';
import ChemicalTrackerModal from './components/ChemicalTrackerModal';
import CleanerKhataModal from './components/CleanerKhataModal';
import ScheduleCalendarModal from './components/ScheduleCalendarModal';
import InstallAppBanner from './components/InstallAppBanner';
import CloudSyncModal from './components/CloudSyncModal';
import MorningSummaryModal from './components/MorningSummaryModal';
import NightRouteModal from './components/NightRouteModal';
import StoreQRModal from './components/StoreQRModal';
import ChangePasswordModal from './components/ChangePasswordModal';
import UserAccessModal from './components/UserAccessModal';
import LoginLogsModal from './components/LoginLogsModal';
import ReportsCenterModal from './components/ReportsCenterModal';
import { exportCleaningsToExcel } from './utils/excelExport';
import { generateCleaningPDF } from './utils/pdfGenerator';
import { naturalSortByStoreCode } from './utils/reportExcelGenerator';
import ToastContainer, { toast } from './components/Toast';
import ConfirmModal from './components/ConfirmModal';
import CommandPalette from './components/CommandPalette';
import OperationsPulseBar from './components/OperationsPulseBar';
import { syncSmartCredentials } from './utils/cloudSync';
import { lockRecordInVault, purgeFromVault, reconcileVaultWithServer } from './utils/vaultManager';
import * as api from './services/api';
import { useLanguage } from './context/LanguageContext';
import { 
  Building2, 
  Plus, 
  Sparkles, 
  Filter, 
  Layers, 
  Calendar, 
  CheckCircle2,
  AlertCircle,
  LogOut,
  Clock,
  ArrowUpDown,
  RotateCcw
} from 'lucide-react';

export default function App() {
  const { t } = useLanguage();
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem('blinkit_theme') === 'dark';
    } catch {
      return false;
    }
  });

  // Session Security & Auto-Logout Configuration
  const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 Minutes Inactivity Auto-Logout
  const WARNING_TIMEOUT_MS = 9 * 60 * 1000; // 9 Minutes (shows 60s countdown warning)

  // User Role & Supervisor Authentication (sessionStorage ensures tab-closure requires re-login)
  const [currentUserRole, setCurrentUserRole] = useState(() => {
    try {
      const sessionRole = sessionStorage.getItem('blinkit_user_role');
      const lastActive = Number(sessionStorage.getItem('blinkit_last_active') || 0);

      // If active session exists and last active was within 10 minutes
      if (sessionRole && lastActive && Date.now() - lastActive < IDLE_TIMEOUT_MS) {
        return sessionRole;
      }

      // Purge any stale session
      sessionStorage.removeItem('blinkit_user_role');
      sessionStorage.removeItem('blinkit_supervisor');
      sessionStorage.removeItem('blinkit_last_active');
      localStorage.removeItem('blinkit_user_role');
      localStorage.removeItem('blinkit_supervisor');
      return null;
    } catch {
      return null;
    }
  });

  const [currentSupervisor, setCurrentSupervisor] = useState(() => {
    try {
      const saved = sessionStorage.getItem('blinkit_supervisor');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Idle and Logout State
  const [logoutNotice, setLogoutNotice] = useState(null); // 'inactivity' | 'manual' | null
  const [isIdleWarningOpen, setIsIdleWarningOpen] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(60);
  const lastActiveRef = useRef(Date.now());

  const [activeTab, setActiveTab] = useState('cleanings'); // 'cleanings' | 'ledger'
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clusterFilter, setClusterFilter] = useState('all');
  const [cycleFilter, setCycleFilter] = useState('all'); // 'all' | 'overdue' | 'dueSoon'
  const [storeCodeFilter, setStoreCodeFilter] = useState('all');
  const [cleaningSortBy, setCleaningSortBy] = useState(() => {
    try {
      return localStorage.getItem('blinkit_cleaning_sort') || 'dateDesc';
    } catch {
      return 'dateDesc';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('blinkit_cleaning_sort', cleaningSortBy);
    } catch (e) {
      // ignore
    }
  }, [cleaningSortBy]);

  // Modal States
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingCleaning, setEditingCleaning] = useState(null);
  const [paymentCleaning, setPaymentCleaning] = useState(null);
  const [photoCleaning, setPhotoCleaning] = useState(null);
  const [photoInitialView, setPhotoInitialView] = useState('grid');
  const [reportCleaning, setReportCleaning] = useState(null);
  const [invoiceCleaning, setInvoiceCleaning] = useState(null);
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  // New Management Modals
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSupervisorModalOpen, setIsSupervisorModalOpen] = useState(false);
  const [isCleanerModalOpen, setIsCleanerModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isConsolidatedInvoiceOpen, setIsConsolidatedInvoiceOpen] = useState(false);
  const [isBillSettingsOpen, setIsBillSettingsOpen] = useState(false);
  const [isReportsCenterOpen, setIsReportsCenterOpen] = useState(false);
  const [isChemicalModalOpen, setIsChemicalModalOpen] = useState(false);
  const [isCleanerKhataOpen, setIsCleanerKhataOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);
  const [isMorningSummaryOpen, setIsMorningSummaryOpen] = useState(false);
  const [isNightRouteOpen, setIsNightRouteOpen] = useState(false);
  const [qrStore, setQrStore] = useState(null);

  // Security & Password Management States
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [changePasswordConfig, setChangePasswordConfig] = useState({
    role: 'admin',
    user: null,
    isFirstLogin: false
  });
  const [isUserAccessOpen, setIsUserAccessOpen] = useState(false);
  const [isLoginLogsOpen, setIsLoginLogsOpen] = useState(false);

  // Store Master Ledger States
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [historyStore, setHistoryStore] = useState(null);

  // Command Palette & Confirmation Dialog
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isDanger: false,
    onConfirm: () => {}
  });

  const openConfirm = ({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', isDanger = false, onConfirm }) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      isDanger,
      onConfirm
    });
  };

  // Global Ctrl+K / Cmd+K keyboard shortcut listener
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);


  // Mark this browser as initialized (no longer delete data - server sync handles it)
  useEffect(() => {
    try {
      localStorage.setItem('blinkit_fresh_clean_v2', 'true');
    } catch (e) {
      console.warn('Storage notice:', e);
    }
  }, []);

  // -------------------------------------------------------------
  // HIGH-PERFORMANCE CACHED STATE (0ms Instant Load + Background Sync)
  // -------------------------------------------------------------
  const getInitialServerData = () => {
    try {
      const cached = localStorage.getItem('blinkit_cached_state_v2');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') {
          return {
            cleanings: Array.isArray(parsed.cleanings) ? parsed.cleanings : [],
            stores: Array.isArray(parsed.stores) ? parsed.stores : [],
            supervisors: Array.isArray(parsed.supervisors) ? parsed.supervisors : [],
            cleaners: Array.isArray(parsed.cleaners) ? parsed.cleaners : [],
            cleaningSchedules: Array.isArray(parsed.cleaningSchedules) ? parsed.cleaningSchedules : [],
            chemicalStock: Array.isArray(parsed.chemicalStock) ? parsed.chemicalStock : [],
            chemicalLogs: Array.isArray(parsed.chemicalLogs) ? parsed.chemicalLogs : [],
            cleanerAdvances: Array.isArray(parsed.cleanerAdvances) ? parsed.cleanerAdvances : [],
            storeIssues: Array.isArray(parsed.storeIssues) ? parsed.storeIssues : [],
            loginLogs: Array.isArray(parsed.loginLogs) ? parsed.loginLogs : [],
            appSettings: parsed.appSettings || null,
            lastUpdated: parsed.lastUpdated || null
          };
        }
      }
    } catch (e) {
      console.warn('Initial cache notice:', e);
    }
    return {
      cleanings: [],
      stores: [],
      supervisors: [],
      cleaners: [],
      cleaningSchedules: [],
      chemicalStock: [],
      chemicalLogs: [],
      cleanerAdvances: [],
      storeIssues: [],
      loginLogs: [],
      appSettings: null,
      lastUpdated: null
    };
  };

  const initialCachedData = getInitialServerData();
  const [serverData, setServerData] = useState(initialCachedData);
  const [isDataLoaded, setIsDataLoaded] = useState(() => {
    return (initialCachedData.cleanings.length > 0 || initialCachedData.stores.length > 0);
  });

  const lastUpdatedRef = useRef(initialCachedData.lastUpdated || null);
  const isSyncingRef = useRef(false);

  // Helper to safely persist state to fast local cache
  const saveStateToCache = (data) => {
    try {
      localStorage.setItem('blinkit_cached_state_v2', JSON.stringify(data));
    } catch (quotaErr) {
      // If photo base64 strings exceed quota, preserve all records with lightweight photo stubs
      try {
        const lightweight = {
          ...data,
          cleanings: (data.cleanings || []).map(c => ({
            ...c,
            photos: (c.photos || []).map(p => ({
              id: p.id,
              type: p.type,
              name: p.name,
              title: p.title,
              timestamp: p.timestamp,
              url: (p.url && p.url.length > 3000) ? '' : p.url
            }))
          }))
        };
        localStorage.setItem('blinkit_cached_state_v2', JSON.stringify(lightweight));
      } catch (e) {
        console.warn('Cache fallback notice:', e);
      }
    }
  };

  // Fast function to fetch full state directly from server (Zero-overhead conditional sync)
  const loadServerData = async (force = false) => {
    if (isSyncingRef.current && !force) return;
    isSyncingRef.current = true;
    try {
      const data = await api.fetchServerState(force ? null : lastUpdatedRef.current);
      if (data && data.unchanged) {
        // Zero change on server: Skip re-rendering, keep UI locked at 60 FPS!
        setIsDataLoaded(true);
        return;
      }
      if (data && !data.unchanged) {
        lastUpdatedRef.current = data.lastUpdated || null;

        // Reconcile incoming server data with local permanent vault
        // If server was redeployed and missing recent entries, auto-heals them instantly!
        const { mergedData, healed } = await reconcileVaultWithServer(data);
        if (healed) {
          toast.success('Self-Healing Engine: Missing entries restored to server database!', 'Data Auto-Healed');
        }

        setServerData(prev => {
          const next = { ...prev, ...mergedData };
          saveStateToCache(next);
          return next;
        });
        if (data.appSettings) {
          syncSmartCredentials(data.appSettings);
          if (data.appSettings.billSettings) {
            try {
              const serverBill = data.appSettings.billSettings;
              const currentSaved = localStorage.getItem('blinkit_bill_settings_v1');
              const localParsed = currentSaved ? JSON.parse(currentSaved) : {};
              const merged = {
                billedBy: { ...(localParsed.billedBy || {}), ...(serverBill.billedBy || {}) },
                billedTo: { ...(localParsed.billedTo || {}), ...(serverBill.billedTo || {}) }
              };
              localStorage.setItem('blinkit_bill_settings_v1', JSON.stringify(merged));
              window.dispatchEvent(new CustomEvent('bill-settings-updated', { detail: merged }));
            } catch (e) {}
          }
        }
        setIsDataLoaded(true);
      }
    } catch (err) {
      console.warn('loadServerData notice:', err);
    } finally {
      isSyncingRef.current = false;
    }
  };

  useEffect(() => {
    // Initial sync from server
    loadServerData();

    // Adaptive background polling:
    // Only poll when the user is actively viewing the tab (15s interval)
    // Pauses completely when tab is minimized or phone screen is locked to save battery and bandwidth
    let pollTimer = null;
    const startPolling = () => {
      if (pollTimer) clearInterval(pollTimer);
      pollTimer = setInterval(() => {
        if (document.visibilityState === 'visible') {
          loadServerData();
        }
      }, 15000);
    };

    const stopPolling = () => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    };

    startPolling();

    let lastFetchTime = 0;
    const triggerInstantSync = () => {
      const now = Date.now();
      if (now - lastFetchTime > 3000) {
        lastFetchTime = now;
        loadServerData();
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        startPolling();
        triggerInstantSync();
      } else {
        stopPolling();
      }
    };

    const handleOnline = () => {
      triggerInstantSync();
    };

    // Mobile & Desktop window lifecycle hooks
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', triggerInstantSync);
    window.addEventListener('pageshow', triggerInstantSync);
    window.addEventListener('online', handleOnline);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', triggerInstantSync);
      window.removeEventListener('pageshow', triggerInstantSync);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Update dark mode class on <html>
  useEffect(() => {
    try {
      if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('blinkit_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('blinkit_theme', 'light');
      }
    } catch (e) {
      console.warn('Theme storage notice:', e);
    }
  }, [darkMode]);

  // Derived state directly from serverData (sorted strictly by store number)
  const cleanings = naturalSortByStoreCode(serverData.cleanings || [], c => c.storeCode);
  const stores = naturalSortByStoreCode(serverData.stores || [], s => s.storeCode);
  const supervisors = serverData.supervisors || [];
  const cleaners = serverData.cleaners || [];
  const issues = serverData.storeIssues || [];
  const schedules = (serverData.cleaningSchedules || []).slice().sort((a, b) => (a.scheduledDate || '').localeCompare(b.scheduledDate || ''));
  const chemicalStock = serverData.chemicalStock || [];
  const chemicalLogs = serverData.chemicalLogs || [];
  const cleanerAdvances = serverData.cleanerAdvances || [];
  const loginLogs = serverData.loginLogs || [];

  // Unique registered store codes for quick dropdown filter
  const uniqueStoreCodes = useMemo(() => {
    const set = new Set();
    (serverData.stores || []).forEach(s => {
      const code = (s.storeCode || s.code || '').trim().toUpperCase();
      if (code) set.add(code);
    });
    (serverData.cleanings || []).forEach(c => {
      const code = (c.storeCode || '').trim().toUpperCase();
      if (code) set.add(code);
    });
    return naturalSortByStoreCode(Array.from(set).map(c => ({ storeCode: c })), i => i.storeCode).map(i => i.storeCode);
  }, [serverData.stores, serverData.cleanings]);

  // Filtered cleanings based on search, payment, status, cluster, store code, and due cycle
  const filteredCleanings = cleanings.filter((c) => {
    const matchesSearch = 
      (c.storeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.storeCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.managerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.teamMembers || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPayment = 
      paymentFilter === 'all' || c.paymentStatus === paymentFilter;

    const matchesStatus = 
      statusFilter === 'all' || c.status === statusFilter;

    const matchesCluster = 
      clusterFilter === 'all' || c.city === clusterFilter;

    const matchesStoreCode = 
      storeCodeFilter === 'all' || 
      (c.storeCode && String(c.storeCode).trim().toUpperCase() === storeCodeFilter.trim().toUpperCase());

    let matchesCycle = true;
    if (cycleFilter === 'overdue' || cycleFilter === 'dueSoon') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const cycle = c.nextCleaningCycleDays || 30;
      const d = new Date(c.cleaningDate || new Date());
      d.setDate(d.getDate() + cycle);

      if (cycleFilter === 'overdue') {
        matchesCycle = d < today;
      } else if (cycleFilter === 'dueSoon') {
        const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
        matchesCycle = diff >= 0 && diff <= 7;
      }
    }

    return matchesSearch && matchesPayment && matchesStatus && matchesCluster && matchesCycle && matchesStoreCode;
  });

  // Dynamic user-selected sorting (Date, Store Code, Amount)
  const sortedCleanings = useMemo(() => {
    let list = [...filteredCleanings];
    if (cleaningSortBy === 'dateDesc') {
      return list.sort((a, b) => (b.cleaningDate || '').localeCompare(a.cleaningDate || ''));
    } else if (cleaningSortBy === 'dateAsc') {
      return list.sort((a, b) => (a.cleaningDate || '').localeCompare(b.cleaningDate || ''));
    } else if (cleaningSortBy === 'storeCodeAsc') {
      return naturalSortByStoreCode(list, c => c.storeCode);
    } else if (cleaningSortBy === 'storeCodeDesc') {
      return naturalSortByStoreCode(list, c => c.storeCode).reverse();
    } else if (cleaningSortBy === 'amountDesc') {
      return list.sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0));
    } else if (cleaningSortBy === 'amountPendingDesc') {
      return list.sort((a, b) => (Number(b.amountPending) || 0) - (Number(a.amountPending) || 0));
    }
    return list;
  }, [filteredCleanings, cleaningSortBy]);

  // Smooth DOM Virtualization / Progressive Batch Loading (Keeps mobile frame rates locked at 60 FPS)
  const [visibleCleaningsCount, setVisibleCleaningsCount] = useState(15);

  useEffect(() => {
    setVisibleCleaningsCount(15);
  }, [searchTerm, paymentFilter, statusFilter, clusterFilter, cycleFilter, storeCodeFilter, cleaningSortBy]);

  const visibleCleanings = sortedCleanings.slice(0, visibleCleaningsCount);

  // Handlers for Cleanings with Instant 0ms Optimistic UI
  const handleSaveCleaning = async (cleaningData) => {
    // Instant Optimistic Update
    const syncId = cleaningData.syncId || (cleaningData.id ? String(cleaningData.id) : `sync_${Date.now()}`);
    const optimisticRecord = { ...cleaningData, syncId, updatedAt: new Date().toISOString() };
    
    // Lock into permanent client vault (Guarantees zero data loss on server redeploys)
    lockRecordInVault('cleaning', optimisticRecord);

    setServerData(prev => {
      const existing = prev.cleanings || [];
      const idx = existing.findIndex(c => (c.id && c.id === cleaningData.id) || (c.syncId && c.syncId === syncId));
      let updated;
      if (idx >= 0) {
        updated = [...existing];
        updated[idx] = { ...updated[idx], ...optimisticRecord };
      } else {
        updated = [optimisticRecord, ...existing];
      }
      const next = { ...prev, cleanings: updated };
      saveStateToCache(next);
      return next;
    });

    toast.success(
      `Cleaning entry for ${cleaningData.storeName || cleaningData.storeCode} saved!`,
      'Record Saved'
    );

    try {
      const result = await api.saveCleaning(cleaningData);
      if (result && result.data) {
        if (result.savedRecord) lockRecordInVault('cleaning', result.savedRecord);
        setServerData(prev => {
          const next = { ...prev, ...result.data };
          saveStateToCache(next);
          return next;
        });
      }
    } catch (err) {
      console.warn('Background sync failed:', err);
      loadServerData(true);
    }
  };

  const handleUpdatePayment = async (updatedCleaning) => {
    // Instant Optimistic Update
    lockRecordInVault('cleaning', updatedCleaning);

    setServerData(prev => {
      const existing = prev.cleanings || [];
      const updated = existing.map(c => 
        (c.id === updatedCleaning.id || (c.syncId && c.syncId === updatedCleaning.syncId))
          ? { ...c, ...updatedCleaning, updatedAt: new Date().toISOString() }
          : c
      );
      const next = { ...prev, cleanings: updated };
      saveStateToCache(next);
      return next;
    });

    toast.success(
      `Payment for ${updatedCleaning.storeName || updatedCleaning.storeCode} updated to ${updatedCleaning.paymentStatus}!`,
      'Payment Updated'
    );

    try {
      const result = await api.saveCleaning(updatedCleaning);
      if (result && result.data) {
        setServerData(prev => {
          const next = { ...prev, ...result.data };
          saveStateToCache(next);
          return next;
        });
      }
    } catch (err) {
      console.warn('Payment sync failed:', err);
      loadServerData(true);
    }
  };

  const handleUpdatePhotos = async (cleaningId, photos) => {
    setServerData(prev => {
      const existing = prev.cleanings || [];
      const updated = existing.map(c => c.id === cleaningId ? { ...c, photos, updatedAt: new Date().toISOString() } : c);
      const next = { ...prev, cleanings: updated };
      saveStateToCache(next);
      return next;
    });

    if (photoCleaning && photoCleaning.id === cleaningId) {
      setPhotoCleaning(prev => ({ ...prev, photos }));
    }
    toast.success('Before/After photos saved successfully!', 'Photos Saved');

    try {
      const c = cleanings.find(item => item.id === cleaningId);
      if (c) {
        const result = await api.saveCleaning({ ...c, photos });
        if (result && result.data) {
          setServerData(prev => {
            const next = { ...prev, ...result.data };
            saveStateToCache(next);
            return next;
          });
        }
      }
    } catch (err) {
      console.warn('Photos sync failed:', err);
    }
  };

  const handleDeleteCleaning = async (cleaningOrId) => {
    let cleaning = null;
    if (typeof cleaningOrId === 'object' && cleaningOrId !== null) {
      cleaning = cleaningOrId;
    } else {
      cleaning = cleanings.find(c => c.id === cleaningOrId);
    }
    if (!cleaning) {
      toast.warning('Cleaning record nahi mila.');
      return;
    }

    openConfirm({
      title: 'Permanently Delete Cleaning Record',
      message: `Kya aap sachme is deep cleaning record ko PERMANENTLY delete karna chahte hain?\n\nStore: ${cleaning.storeName || cleaning.storeCode}\nDate: ${cleaning.cleaningDate || '--'}\nShift: ${cleaning.shift || 'N/A'}`,
      confirmText: 'Permanently Delete',
      isDanger: true,
      onConfirm: async () => {
        // Instant Optimistic Delete
        purgeFromVault('cleaning', cleaning.id);
        if (cleaning.syncId) purgeFromVault('cleaning', cleaning.syncId);
        if (cleaning.storeCode && cleaning.cleaningDate) {
          purgeFromVault('cleaning', `${cleaning.storeCode}_${cleaning.cleaningDate}`);
        }

        setServerData(prev => {
          const existing = prev.cleanings || [];
          const updated = existing.filter(c => c.id !== cleaning.id && (!cleaning.syncId || c.syncId !== cleaning.syncId));
          const next = { ...prev, cleanings: updated };
          saveStateToCache(next);
          return next;
        });

        toast.success(
          `Cleaning entry (${cleaning.storeName || cleaning.storeCode} - ${cleaning.cleaningDate}) permanently delete ho gayi.`,
          'Record Deleted'
        );

        try {
          const result = await api.deleteCleaning(cleaning);
          if (result && result.data) {
            setServerData(prev => {
              const next = { ...prev, ...result.data };
              saveStateToCache(next);
              return next;
            });
          }
        } catch (err) {
          console.warn('Delete sync failed:', err);
          loadServerData(true);
        }
      }
    });
  };

  const handleClearAllData = async () => {
    openConfirm({
      title: 'Wipe All Demo / Test Records',
      message: 'Kya aap sachme sara Demo / Test Data delete karna chahte hain?\n\nIsse sare sample store records aur cleaning entries delete ho jayenge taaki aap fresh real entry kar sakein.',
      confirmText: 'Wipe Demo Data',
      isDanger: true,
      onConfirm: async () => {
        try {
          const result = await api.clearAllData();
          if (result && result.data) {
            setServerData(prev => ({ ...prev, ...result.data }));
          } else {
            await loadServerData();
          }
          toast.success('Sara demo data permanently delete ho gaya hai! Database ab 100% clean hai.', 'Database Reset');
        } catch (err) {
          toast.error('Error clearing data: ' + err.message, 'Reset Error');
        }
      }
    });
  };

  // Handlers for Store Master Ledger
  const handleSaveStore = async (storeData) => {
    // Instant Optimistic Update
    const code = (storeData.storeCode || '').trim().toUpperCase();
    lockRecordInVault('store', storeData);

    setServerData(prev => {
      const existing = prev.stores || [];
      const idx = existing.findIndex(s => (s.storeCode || '').trim().toUpperCase() === code);
      let updated;
      if (idx >= 0) {
        updated = [...existing];
        updated[idx] = { ...updated[idx], ...storeData };
      } else {
        updated = [storeData, ...existing];
      }
      const next = { ...prev, stores: updated };
      saveStateToCache(next);
      return next;
    });

    toast.success(`Store "${storeData.storeName || storeData.storeCode}" master ledger me update ho gaya.`, 'Store Saved');

    try {
      const result = await api.saveStore(storeData);
      if (result && result.data) {
        setServerData(prev => {
          const next = { ...prev, ...result.data };
          saveStateToCache(next);
          return next;
        });
      }
    } catch (err) {
      console.warn('Store sync failed:', err);
      loadServerData(true);
    }
  };

  const handleDeleteStore = async (storeOrId) => {
    let store = null;
    if (typeof storeOrId === 'object' && storeOrId !== null) {
      store = storeOrId;
    } else {
      store = stores.find(s => s.id === storeOrId || s.storeCode === storeOrId);
    }
    if (!store) {
      toast.warning('Store record nahi mila.');
      return;
    }

    const relatedCleanings = cleanings.filter(
      c => c && String(c.storeCode).trim().toUpperCase() === String(store.storeCode).trim().toUpperCase()
    );

    const hasCleanings = relatedCleanings.length > 0;

    openConfirm({
      title: hasCleanings ? 'Delete Store & Linked Cleanings' : 'Permanently Delete Store',
      message: hasCleanings
        ? `⚠️ Store me Cleaning Entries Maujood Hain!\n\nStore: ${store.storeName} (${store.storeCode})\nIs store ke database me ${relatedCleanings.length} cleaning record(s) maujood hain.\n\nKya aap sachme is Store aur iski sari (${relatedCleanings.length}) cleaning entries ko PERMANENTLY delete karna chahte hain?`
        : `Kya aap sachme store "${store.storeName} (${store.storeCode})" ko Master Ledger se PERMANENTLY delete karna chahte hain?`,
      confirmText: 'Permanently Delete',
      isDanger: true,
      onConfirm: async () => {
        // Instant Optimistic Delete
        purgeFromVault('store', store.storeCode || store.code);
        if (hasCleanings) {
          relatedCleanings.forEach(c => {
            purgeFromVault('cleaning', c.id || c.syncId || `${c.storeCode}_${c.cleaningDate}`);
          });
        }

        setServerData(prev => {
          const updatedStores = (prev.stores || []).filter(s => (s.storeCode || '').trim().toUpperCase() !== (store.storeCode || '').trim().toUpperCase());
          let updatedCleanings = prev.cleanings || [];
          if (hasCleanings) {
            updatedCleanings = updatedCleanings.filter(c => (c.storeCode || '').trim().toUpperCase() !== (store.storeCode || '').trim().toUpperCase());
          }
          const next = { ...prev, stores: updatedStores, cleanings: updatedCleanings };
          saveStateToCache(next);
          return next;
        });

        toast.success(`Store "${store.storeName}" Master Ledger se permanently delete ho gaya.`, 'Store Deleted');

        try {
          const result = await api.deleteStore(store.storeCode, hasCleanings, true);
          if (result && result.data) {
            setServerData(prev => {
              const next = { ...prev, ...result.data };
              saveStateToCache(next);
              return next;
            });
          }
        } catch (err) {
          console.warn('Store delete sync failed:', err);
          loadServerData(true);
        }
      }
    });
  };

  const handleLogCleaningForStore = (store) => {
    setEditingCleaning({
      storeCode: store.storeCode,
      storeName: store.storeName,
      address: store.address || '',
      city: store.city || '',
      googleMapsUrl: store.googleMapsUrl || '',
      managerName: store.managerName || '',
      managerPhone: store.managerPhone || '',
      cleaningDate: new Date().toISOString().split('T')[0],
      shift: 'Night Shift (01:00 AM - 06:00 AM)',
      startTime: '01:00',
      endTime: '05:30',
      durationHours: '4.5',
      teamVendor: localStorage.getItem('vendor_company_name') || 'SK ENTERPRISES',
      supervisorName: '',
      supervisorPhone: '',
      teamMembers: '',
      headcount: 4,
      amount: 4500,
      amountReceived: 0,
      amountPending: 4500,
      paymentStatus: 'Pending',
      paymentDate: '',
      paymentMode: 'UPI',
      utrNumber: '',
      paymentNotes: '',
      status: 'Completed',
      rating: 5,
      scopeOfWork: [
        'Floor Deep Cleaning',
        'Toilet / Washroom Cleaning',
        'Cold Storage Area Cleaning',
        'Wall Dry & Rust Removal'
      ],
      checklist: {
        floorDeepCleaning: true,
        toiletCleaning: true,
        coldStorageCleaning: true,
        wallRustRemoval: true,
        racks: true,
        highDusting: true
      },
      remarks: '',
      photos: []
    });
    setIsEntryModalOpen(true);
  };

  const handleLoginSuccess = ({ role, user, isFirstLogin }) => {
    setCurrentUserRole(role);
    setLogoutNotice(null);
    setIsIdleWarningOpen(false);
    lastActiveRef.current = Date.now();

    try {
      sessionStorage.setItem('blinkit_user_role', role);
      sessionStorage.setItem('blinkit_last_active', String(Date.now()));
      if (role === 'supervisor') {
        setCurrentSupervisor(user);
        sessionStorage.setItem('blinkit_supervisor', JSON.stringify(user));
      } else {
        setCurrentSupervisor(null);
        sessionStorage.removeItem('blinkit_supervisor');
      }

      // Clear any legacy localStorage to ensure clean isolated sessions
      localStorage.removeItem('blinkit_user_role');
      localStorage.removeItem('blinkit_supervisor');

      if (isFirstLogin && role === 'admin') {
        setChangePasswordConfig({
          role: 'admin',
          user: null,
          isFirstLogin: true
        });
        setIsChangePasswordOpen(true);
      }
    } catch (e) {
      console.warn('Storage notice:', e);
    }
  };

  const handleLogout = async (reason = 'manual') => {
    try {
      const role = currentUserRole;
      const userName = role === 'supervisor' ? (currentSupervisor?.name || 'Supervisor') : (role || 'User');
      const loginId = role === 'supervisor' ? (currentSupervisor?.phone || '') : (role || '');
      
      await logUserLogout({
        role,
        userName,
        loginId,
        reason: reason === 'inactivity' ? 'Auto-Logout (10 Min Screen Inactivity)' : 'Manual Logout by User'
      });
    } catch (e) {
      console.warn('Logout audit notice:', e);
    }

    setCurrentUserRole(null);
    setCurrentSupervisor(null);
    setIsIdleWarningOpen(false);
    setLogoutNotice(reason);

    try {
      sessionStorage.removeItem('blinkit_user_role');
      sessionStorage.removeItem('blinkit_supervisor');
      sessionStorage.removeItem('blinkit_last_active');
      localStorage.removeItem('blinkit_user_role');
      localStorage.removeItem('blinkit_supervisor');
    } catch (e) {
      console.warn('Storage notice:', e);
    }
  };

  // Inactivity Auto-Logout Watcher (Auto-Logout after 10m idle screen)
  useEffect(() => {
    if (!currentUserRole) return;

    lastActiveRef.current = Date.now();
    sessionStorage.setItem('blinkit_last_active', String(Date.now()));

    const resetActivity = () => {
      lastActiveRef.current = Date.now();
      sessionStorage.setItem('blinkit_last_active', String(Date.now()));
      setIsIdleWarningOpen(false);
    };

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(evt => {
      window.addEventListener(evt, resetActivity, { passive: true });
    });

    const intervalId = setInterval(() => {
      const elapsed = Date.now() - lastActiveRef.current;

      if (elapsed >= IDLE_TIMEOUT_MS) {
        handleLogout('inactivity');
      } else if (elapsed >= WARNING_TIMEOUT_MS) {
        setIsIdleWarningOpen(true);
        const remaining = Math.max(1, Math.ceil((IDLE_TIMEOUT_MS - elapsed) / 1000));
        setCountdownSeconds(remaining);
      } else {
        setIsIdleWarningOpen(false);
      }
    }, 1000);

    return () => {
      activityEvents.forEach(evt => {
        window.removeEventListener(evt, resetActivity);
      });
      clearInterval(intervalId);
    };
  }, [currentUserRole]);

  // Check if admin is on default PIN and prompt for change
  useEffect(() => {
    if (currentUserRole === 'admin') {
      const currentPin = localStorage.getItem('vendor_admin_pin') || '1234';
      if (currentPin === '1234') {
        setChangePasswordConfig({
          role: 'admin',
          user: null,
          isFirstLogin: true
        });
        setIsChangePasswordOpen(true);
      }
    }
  }, [currentUserRole]);

  // If user is not logged in, show the dedicated full-screen Login Page
  if (!currentUserRole) {
    return (
      <>
        <InstallAppBanner />
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          logoutNotice={logoutNotice}
          onClearLogoutNotice={() => setLogoutNotice(null)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors flex flex-col">
      <InstallAppBanner />
      
      {/* Top Navigation */}
      <Navbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        paymentFilter={paymentFilter}
        setPaymentFilter={setPaymentFilter}
        onOpenNewEntry={() => {
          setEditingCleaning(null);
          setIsEntryModalOpen(true);
        }}
        onOpenNewStore={() => {
          setEditingStore(null);
          setIsStoreModalOpen(true);
        }}
        onExportExcel={() => exportCleaningsToExcel(cleanings)}
        onOpenReportsCenter={() => setIsReportsCenterOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cleaningCount={cleanings.length}
        storeCount={stores.length}
        currentUserRole={currentUserRole}
        currentSupervisor={currentSupervisor}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenSupervisors={() => setIsSupervisorModalOpen(true)}
        onOpenCleaners={() => setIsCleanerModalOpen(true)}
        onOpenIssues={() => setIsIssueModalOpen(true)}
        issuesCount={issues.filter(i => i.status === 'Open').length}
        onLogout={handleLogout}
        onOpenConsolidatedInvoice={() => setIsConsolidatedInvoiceOpen(true)}
        onOpenBillSettings={() => setIsBillSettingsOpen(true)}
        onOpenChemicals={() => setIsChemicalModalOpen(true)}
        onOpenKhata={() => setIsCleanerKhataOpen(true)}
        onOpenSchedule={() => setIsScheduleModalOpen(true)}
        onOpenCloudSync={() => setIsCloudSyncOpen(true)}
        onOpenMorningSummary={() => setIsMorningSummaryOpen(true)}
        onOpenNightRoute={() => setIsNightRouteOpen(true)}
        onOpenUserAccess={() => setIsUserAccessOpen(true)}
        onOpenLoginLogs={() => setIsLoginLogsOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onChangeAdminPassword={() => {
          setChangePasswordConfig({
            role: 'admin',
            user: null,
            isFirstLogin: false
          });
          setIsChangePasswordOpen(true);
        }}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 sm:space-y-6 flex-1 w-full max-w-full overflow-x-hidden min-w-0 pb-28 md:pb-8">
        
        {/* If Supervisor is logged in, show dedicated field portal */}
        {currentUserRole === 'supervisor' ? (
          <SupervisorPortal
            supervisor={currentSupervisor || { name: 'Site Supervisor', phone: 'Field Team' }}
            stores={stores}
            cleaners={cleaners}
            onLogout={handleLogout}
            onRecordSaved={() => {}}
          />
        ) : (
          <>
            {/* DAILY OPERATIONS PULSE BAR */}
            {currentUserRole !== 'client' && (
              <OperationsPulseBar
                stores={stores}
                cleanings={cleanings}
                schedules={schedules}
                issues={issues}
                chemicals={chemicalStock}
                onOpenSchedule={() => setIsScheduleModalOpen(true)}
                onOpenIssues={() => setIsIssueModalOpen(true)}
                onOpenChemicals={() => setIsChemicalModalOpen(true)}
                onOpenMorningSummary={() => setIsMorningSummaryOpen(true)}
                onOpenConsolidatedInvoice={() => setIsConsolidatedInvoiceOpen(true)}
              />
            )}

            {/* Welcome & Quick Overview Banner (Admin View) */}
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm min-w-0 ${
              currentUserRole === 'client'
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white'
                : currentUserRole === 'manager'
                  ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white'
                  : 'bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 text-slate-950'
            }`}>
                <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base sm:text-xl font-extrabold tracking-tight break-words">
                    {currentUserRole === 'client'
                      ? t('banner_client_title', 'Blinkit City Operations & QA Inspection Portal')
                      : currentUserRole === 'manager'
                        ? t('banner_manager_title', 'Blinkit Operations Management Control Center')
                        : t('banner_admin_title', 'Blinkit Dark Store Deep Cleaning Control Center')}
                  </span>
                  <span className={`text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full font-extrabold shrink-0 ${
                    currentUserRole === 'client' 
                      ? 'bg-white text-blue-900' 
                      : currentUserRole === 'manager'
                        ? 'bg-white text-indigo-900'
                        : 'bg-slate-950 text-white'
                  }`}>
                    {currentUserRole === 'client' 
                      ? t('badge_client', 'CLIENT / CITY OPS')
                      : currentUserRole === 'manager'
                        ? t('badge_manager', 'OPERATIONS MANAGER')
                        : t('badge_admin', 'VENDOR ADMIN')}
                  </span>
                </div>
                <p className={`text-xs sm:text-sm font-semibold ${
                  currentUserRole === 'client' || currentUserRole === 'manager' ? 'text-indigo-100' : 'text-slate-900/80'
                }`}>
                  {currentUserRole === 'client'
                    ? t('banner_client_desc', 'Official inspection portal: View completed store cleanings, interactive Before/After photo comparisons, and download FSSAI Hygiene Certificates.')
                    : currentUserRole === 'manager'
                      ? t('banner_manager_desc', 'Operations Manager Portal: Manage deep cleaning store visits, schedules, night routes, chemical stocks, and cleaner staff attendance.')
                      : t('banner_admin_desc', 'Track store visits, manage your Store Ledger, auto-fill store info, track pending payments, view P&L profits, and manage site supervisors.')}
                </p>
              </div>

              {currentUserRole !== 'client' && (
                <div className="flex items-center gap-2 self-start sm:self-center shrink-0 flex-wrap">
                  <button
                    onClick={() => {
                      setEditingStore(null);
                      setIsStoreModalOpen(true);
                    }}
                    className="px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-white/90 hover:bg-white text-slate-950 font-bold text-xs sm:text-sm shadow-xs transition flex items-center gap-1.5"
                  >
                    <Building2 className="w-4 h-4 text-blinkit-green" />
                    <span>{t('btn_new_store', '+ Add Store')}</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingCleaning(null);
                      setIsEntryModalOpen(true);
                    }}
                    className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-1.5 sm:gap-2 transform active:scale-95"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>{t('btn_new_cleaning', '+ New Cleaning')}</span>
                  </button>
                </div>
              )}
            </div>

        {/* VIEW 1: Cleaning Visits & Logs */}
        {activeTab === 'cleanings' && (
          <div className="space-y-5 sm:space-y-6 min-w-0">
            {/* Operational & Financial Dashboard Stats */}
            <DashboardStats
              cleanings={cleanings}
              paymentFilter={paymentFilter}
              setPaymentFilter={setPaymentFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              clusterFilter={clusterFilter}
              setClusterFilter={setClusterFilter}
              cycleFilter={cycleFilter}
              setCycleFilter={setCycleFilter}
              storeCodeFilter={storeCodeFilter}
              setStoreCodeFilter={setStoreCodeFilter}
              uniqueStoreCodes={uniqueStoreCodes}
              cleaningSortBy={cleaningSortBy}
              setCleaningSortBy={setCleaningSortBy}
              onOpenReportsCenter={() => setIsReportsCenterOpen(true)}
            />

            {/* Store Cards Grid / Records View */}
            <div className="space-y-3 sm:space-y-4 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blinkit-green shrink-0" />
                    <span>{t('records_heading', 'Store Deep Cleaning Records')}</span>
                  </h2>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {filteredCleanings.length} {filteredCleanings.length === 1 ? t('store_singular', 'entry') : t('store_plural', 'entries')}
                  </span>

                  {(searchTerm || paymentFilter !== 'all' || statusFilter !== 'all' || clusterFilter !== 'all' || cycleFilter !== 'all' || storeCodeFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setPaymentFilter('all');
                        setStatusFilter('all');
                        setClusterFilter('all');
                        setCycleFilter('all');
                        setStoreCodeFilter('all');
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 transition"
                      title="Clear all active filters"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Filters</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                  {/* Quick Store Code Filter */}
                  {uniqueStoreCodes.length > 0 && (
                    <div className="flex items-center gap-1">
                      <select
                        value={storeCodeFilter}
                        onChange={(e) => setStoreCodeFilter(e.target.value)}
                        className="px-2 py-1 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-2xs focus:ring-2 focus:ring-blinkit-green"
                        title="Filter by Store Code"
                      >
                        <option value="all">🏬 All Stores ({uniqueStoreCodes.length})</option>
                        {uniqueStoreCodes.map(code => (
                          <option key={code} value={code}>🏬 {code}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Quick Sort Control */}
                  <div className="flex items-center gap-1">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={cleaningSortBy}
                      onChange={(e) => setCleaningSortBy(e.target.value)}
                      className="px-2 py-1 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs focus:ring-2 focus:ring-blinkit-green"
                      title="Sort Cleaning Records"
                    >
                      <option value="dateDesc">📅 Date (Newest First)</option>
                      <option value="dateAsc">📅 Date (Oldest First)</option>
                      <option value="storeCodeAsc">🏬 Store Code (ES2 → ES308)</option>
                      <option value="storeCodeDesc">🏬 Store Code (ES308 → ES2)</option>
                      <option value="amountDesc">💰 Amount (High to Low)</option>
                      <option value="amountPendingDesc">⏳ Pending Dues (Highest)</option>
                    </select>
                  </div>

                  {filteredCleanings.length > 0 && (
                    <div className="flex items-center gap-2 ml-1">
                      <button
                        onClick={() => setIsReportsCenterOpen(true)}
                        className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1"
                      >
                        <span>📊 Reports</span>
                      </button>
                      <button
                        onClick={() => exportCleaningsToExcel(filteredCleanings, 'Blinkit_Filtered_Cleanings.xlsx')}
                        className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold"
                      >
                        Excel ({filteredCleanings.length})
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {filteredCleanings.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {visibleCleanings.map((cleaning) => (
                      <StoreCard
                        key={cleaning.id}
                        cleaning={cleaning}
                        isAdmin={currentUserRole === 'admin'}
                        onUpdatePayment={(c) => {
                          if (currentUserRole !== 'admin') {
                            toast.warning(t('alert_payment_admin_only', 'Payment details enter ya update karne ka access sirf Admin ke paas hai.'), 'Admin Only');
                            return;
                          }
                          setPaymentCleaning(c);
                        }}
                        onOpenPhotos={(c, view = 'grid') => {
                          setPhotoCleaning(c);
                          setPhotoInitialView(view);
                        }}
                        onGeneratePDF={(c) => generateCleaningPDF(c)}
                        onShareWhatsApp={(c) => setReportCleaning(c)}
                        onGenerateInvoice={(c) => setInvoiceCleaning(c)}
                        onOpenStoreQR={(c) => setQrStore(c)}
                        onEdit={(c) => {
                          setEditingCleaning(c);
                          setIsEntryModalOpen(true);
                        }}
                        onDelete={handleDeleteCleaning}
                      />
                    ))}
                  </div>

                  {filteredCleanings.length > visibleCleaningsCount && (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6 pb-2">
                      <button
                        onClick={() => setVisibleCleaningsCount(prev => prev + 15)}
                        className="px-6 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blinkit-green text-slate-800 dark:text-slate-100 font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center gap-2 transform active:scale-95 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-blinkit-green" />
                        <span>{t('btn_load_more', 'Load More Stores')} ({t('showing', 'Showing')} {visibleCleanings.length} / {filteredCleanings.length})</span>
                      </button>
                      <button
                        onClick={() => setVisibleCleaningsCount(filteredCleanings.length)}
                        className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold underline cursor-pointer"
                      >
                        {t('btn_show_all', 'Show All')} ({filteredCleanings.length})
                      </button>
                    </div>
                  )}
                </>

              ) : (
                <div className="py-16 text-center bg-white dark:bg-slate-800/60 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 p-8">
                  <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    {t('empty_no_records', 'No matching store cleaning records found')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    {searchTerm || paymentFilter !== 'all' || statusFilter !== 'all'
                      ? t('empty_clear_filters', 'Try clearing your search query or reset the payment/status filters.')
                      : t('empty_start_first', 'Start by recording your first Blinkit dark store deep cleaning entry.')}
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setPaymentFilter('all');
                      setStatusFilter('all');
                      setEditingCleaning(null);
                      setIsEntryModalOpen(true);
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blinkit-green text-white font-bold text-xs hover:bg-blinkit-darkgreen shadow-sm transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('btn_add_cleaning', 'Add Store Cleaning Entry')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: Store Master Ledger & History */}
        {activeTab === 'ledger' && (
          <StoreLedgerView
            stores={stores}
            cleanings={cleanings}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onAddNewStore={() => {
              setEditingStore(null);
              setIsStoreModalOpen(true);
            }}
            onEditStore={(s) => {
              setEditingStore(s);
              setIsStoreModalOpen(true);
            }}
            onDeleteStore={handleDeleteStore}
            onViewStoreHistory={(s) => setHistoryStore(s)}
            onLogCleaningForStore={handleLogCleaningForStore}
            onOpenReportsCenter={() => setIsReportsCenterOpen(true)}
          />
        )}
          </>
        )}

      </main>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentRole={currentUserRole}
        onLoginSuccess={({ role, user }) => {
          handleLoginSuccess({ role, user, isFirstLogin: false });
        }}
      />

      <SupervisorManagementModal
        isOpen={isSupervisorModalOpen}
        onClose={() => setIsSupervisorModalOpen(false)}
        supervisors={supervisors}
        stores={stores}
        onSupervisorUpdated={loadServerData}
      />

      <CleanerRosterModal
        isOpen={isCleanerModalOpen}
        onClose={() => setIsCleanerModalOpen(false)}
        cleaners={cleaners}
        onCleanerUpdated={loadServerData}
      />

      <IssueReportModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        issues={issues}
        stores={stores}
        onIssueUpdated={loadServerData}
      />

      <CleaningEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => {
          setIsEntryModalOpen(false);
          setEditingCleaning(null);
        }}
        onSave={handleSaveCleaning}
        initialData={editingCleaning}
        stores={stores}
        supervisors={supervisors}
        cleaners={cleaners}
        chemicals={chemicalStock}
        currentUserRole={currentUserRole}
        onAddNewStore={() => {
          setEditingStore(null);
          setIsStoreModalOpen(true);
        }}
      />

      <StoreModal
        isOpen={isStoreModalOpen}
        onClose={() => {
          setIsStoreModalOpen(false);
          setEditingStore(null);
        }}
        onSave={handleSaveStore}
        initialData={editingStore}
      />

      <StoreHistoryModal
        isOpen={!!historyStore}
        onClose={() => setHistoryStore(null)}
        store={historyStore}
        cleanings={cleanings}
        onOpenPhotos={(c) => setPhotoCleaning(c)}
        onUpdatePayment={(c) => setPaymentCleaning(c)}
        onShareWhatsApp={(c) => setReportCleaning(c)}
        onGenerateInvoice={(c) => setInvoiceCleaning(c)}
      />

      <InvoiceModal
        isOpen={!!invoiceCleaning}
        onClose={() => setInvoiceCleaning(null)}
        cleaning={invoiceCleaning}
        onOpenBillSettings={() => setIsBillSettingsOpen(true)}
      />

      <PaymentUpdateModal
        isOpen={!!paymentCleaning}
        onClose={() => setPaymentCleaning(null)}
        cleaning={paymentCleaning}
        onSave={handleUpdatePayment}
      />


      <PhotoGalleryModal
        isOpen={!!photoCleaning}
        onClose={() => setPhotoCleaning(null)}
        cleaning={cleanings.find(c => c.id === photoCleaning?.id) || photoCleaning}
        onUpdatePhotos={handleUpdatePhotos}
        initialView={photoInitialView}
      />

      <ReportModal
        isOpen={!!reportCleaning}
        onClose={() => setReportCleaning(null)}
        cleaning={reportCleaning}
      />

      <ConsolidatedInvoiceModal
        isOpen={isConsolidatedInvoiceOpen}
        onClose={() => setIsConsolidatedInvoiceOpen(false)}
        cleanings={cleanings}
        onOpenBillSettings={() => setIsBillSettingsOpen(true)}
      />

      <BillSettingsModal
        isOpen={isBillSettingsOpen}
        onClose={() => setIsBillSettingsOpen(false)}
      />

      {isReportsCenterOpen && (
        <ReportsCenterModal
          isOpen={isReportsCenterOpen}
          onClose={() => setIsReportsCenterOpen(false)}
          cleanings={cleanings}
          stores={stores}
        />
      )}

      <ChemicalTrackerModal
        isOpen={isChemicalModalOpen}
        onClose={() => setIsChemicalModalOpen(false)}
        stores={stores}
        supervisors={supervisors}
        chemicals={chemicalStock}
        logs={chemicalLogs}
        onChemicalUpdated={loadServerData}
      />

      <CleanerKhataModal
        isOpen={isCleanerKhataOpen}
        onClose={() => setIsCleanerKhataOpen(false)}
        cleaners={cleaners}
        cleanings={cleanings}
        advances={cleanerAdvances}
        onOpenCleaners={() => {
          setIsCleanerKhataOpen(false);
          setIsCleanerModalOpen(true);
        }}
        onAdvanceUpdated={loadServerData}
      />

      <ScheduleCalendarModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        stores={stores}
        supervisors={supervisors}
        schedules={schedules}
        onScheduleUpdated={loadServerData}
      />

      <CloudSyncModal
        isOpen={isCloudSyncOpen}
        onClose={() => setIsCloudSyncOpen(false)}
      />

      <MorningSummaryModal
        isOpen={isMorningSummaryOpen}
        onClose={() => setIsMorningSummaryOpen(false)}
        cleanings={cleanings}
      />

      <NightRouteModal
        isOpen={isNightRouteOpen}
        onClose={() => setIsNightRouteOpen(false)}
        schedules={schedules}
        stores={stores}
      />

      <StoreQRModal
        isOpen={!!qrStore}
        onClose={() => setQrStore(null)}
        store={qrStore}
      />

      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        onDataRestored={loadServerData}
      />

      <UserAccessModal
        isOpen={isUserAccessOpen}
        onClose={() => setIsUserAccessOpen(false)}
        supervisors={supervisors}
        onSupervisorUpdated={loadServerData}
        onOpenAddSupervisor={() => {
          setIsUserAccessOpen(false);
          setIsSupervisorModalOpen(true);
        }}
        onChangeAdminPin={() => {
          setChangePasswordConfig({
            role: 'admin',
            user: null,
            isFirstLogin: false
          });
          setIsChangePasswordOpen(true);
        }}
        onOpenLoginLogs={() => {
          setIsUserAccessOpen(false);
          setIsLoginLogsOpen(true);
        }}
      />

      <LoginLogsModal
        isOpen={isLoginLogsOpen}
        onClose={() => setIsLoginLogsOpen(false)}
        currentUserRole={currentUserRole}
        logs={loginLogs}
        onLogsCleared={loadServerData}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        role={changePasswordConfig.role}
        user={changePasswordConfig.user}
        isFirstLogin={changePasswordConfig.isFirstLogin}
        onSuccess={() => {
          loadServerData();
        }}
      />

      {/* Universal Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        stores={stores}
        cleanings={cleanings}
        supervisors={supervisors}
        cleaners={cleaners}
        onOpenNewEntry={() => {
          setEditingCleaning(null);
          setIsEntryModalOpen(true);
        }}
        onOpenNewStore={() => {
          setEditingStore(null);
          setIsStoreModalOpen(true);
        }}
        onOpenSchedule={() => setIsScheduleModalOpen(true)}
        onOpenChemicals={() => setIsChemicalModalOpen(true)}
        onOpenKhata={() => setIsCleanerKhataOpen(true)}
        onOpenIssues={() => setIsIssueModalOpen(true)}
        onOpenConsolidatedInvoice={() => setIsConsolidatedInvoiceOpen(true)}
        onOpenBillSettings={() => setIsBillSettingsOpen(true)}
        onOpenNightRoute={() => setIsNightRouteOpen(true)}
        onOpenMorningSummary={() => setIsMorningSummaryOpen(true)}
        onOpenReportsCenter={() => setIsReportsCenterOpen(true)}
        onExportExcel={() => exportCleaningsToExcel(cleanings)}
        onToggleDarkMode={() => setDarkMode(prev => !prev)}
        darkMode={darkMode}
        onViewStoreHistory={(s) => setHistoryStore(s)}
        onLogCleaningForStore={handleLogCleaningForStore}
      />

      {/* Modern Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        isDanger={confirmConfig.isDanger}
      />

      {/* Global Floating Toast Notifications */}
      <ToastContainer />

      {/* SCREEN INACTIVITY WARNING MODAL */}
      {isIdleWarningOpen && currentUserRole && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-amber-300 dark:border-amber-700/80 p-6 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto text-2xl shadow-xs animate-pulse">
              ⏰
            </div>
            
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {t('idle_alert_title', 'Screen Inactivity Alert')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('idle_alert_desc', 'Security ke liye aapka session')} <strong className="text-rose-600 font-extrabold text-sm">{countdownSeconds}s</strong> {t('idle_alert_auto_logout', 'mein auto-logout ho jayega.')}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  lastActiveRef.current = Date.now();
                  sessionStorage.setItem('blinkit_last_active', String(Date.now()));
                  setIsIdleWarningOpen(false);
                }}
                className="w-full py-3 rounded-2xl bg-blinkit-green hover:bg-blinkit-darkgreen text-white font-black text-xs shadow-md transition transform active:scale-98"
              >
                {t('idle_continue', 'Main Active Hoon (Continue Session)')}
              </button>

              <button
                type="button"
                onClick={() => handleLogout('manual')}
                className="w-full py-2 text-xs font-bold text-slate-400 hover:text-rose-600 transition"
              >
                {t('idle_logout_now', 'Abhi Logout Karein')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-bold text-slate-700 dark:text-slate-300">
            SK ENTERPRISES &bull; {t('footer_desc', 'Facility Management & Deep Cleaning Operations')}
          </span>
          <span>{t('footer_cloud', '100% Server Cloud Database • Real-Time Multi-Device Sync')}</span>
        </div>
      </footer>

    </div>
  );
}
