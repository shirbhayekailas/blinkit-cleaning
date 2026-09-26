import React, { useState, useEffect, useRef } from 'react';
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
import { exportCleaningsToExcel } from './utils/excelExport';
import { generateCleaningPDF } from './utils/pdfGenerator';
import ToastContainer, { toast } from './components/Toast';
import ConfirmModal from './components/ConfirmModal';
import CommandPalette from './components/CommandPalette';
import OperationsPulseBar from './components/OperationsPulseBar';
import { syncSmartCredentials } from './utils/cloudSync';
import * as api from './services/api';
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
  Clock
} from 'lucide-react';

export default function App() {
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
  // 100% PURE SERVER-SIDE DATABASE STATE (No local storage ghosting)
  // -------------------------------------------------------------
  const [serverData, setServerData] = useState({
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
    appSettings: null
  });
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const lastUpdatedRef = useRef(null);

  // Fast function to fetch full state directly from server (Zero-overhead conditional sync)
  const loadServerData = async (force = false) => {
    try {
      const data = await api.fetchServerState(force ? null : lastUpdatedRef.current);
      if (data && data.unchanged) {
        // Zero change on server: Skip re-rendering, keep UI locked at 60 FPS!
        return;
      }
      if (data && !data.unchanged) {
        lastUpdatedRef.current = data.lastUpdated || null;
        setServerData(prev => ({ ...prev, ...data }));
        if (data.appSettings) {
          syncSmartCredentials(data.appSettings);
        }
        setIsDataLoaded(true);
      }
    } catch (err) {
      console.warn('loadServerData notice:', err);
    }
  };

  useEffect(() => {
    // Purge legacy IndexedDB on startup so local browser storage never retains old ghost records
    if (typeof window !== 'undefined' && window.indexedDB) {
      try {
        window.indexedDB.deleteDatabase('BlinkitDeepCleaningDB');
      } catch (e) {}
    }

    // Initial load from server
    loadServerData();

    // Fast polling every 5 seconds so Desktop & Mobile stay in live sync
    const syncInterval = setInterval(loadServerData, 5000);

    let lastFetchTime = 0;
    const triggerInstantSync = () => {
      const now = Date.now();
      if (now - lastFetchTime > 600) {
        lastFetchTime = now;
        loadServerData();
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        triggerInstantSync();
      }
    };

    const handleOnline = () => {
      triggerInstantSync();
    };

    // Mobile & Desktop window lifecycle hooks
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', triggerInstantSync);
    window.addEventListener('pageshow', triggerInstantSync); // Critical for Mobile Safari/Chrome app-switching
    window.addEventListener('online', handleOnline); // When 4G/WiFi reconnects

    return () => {
      clearInterval(syncInterval);
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

  // Derived state directly from serverData (sorted properly)
  const cleanings = (serverData.cleanings || []).slice().sort((a, b) => (b.cleaningDate || '').localeCompare(a.cleaningDate || ''));
  const stores = (serverData.stores || []).slice().sort((a, b) => (a.storeCode || '').localeCompare(b.storeCode || ''));
  const supervisors = serverData.supervisors || [];
  const cleaners = serverData.cleaners || [];
  const issues = serverData.storeIssues || [];
  const schedules = (serverData.cleaningSchedules || []).slice().sort((a, b) => (a.scheduledDate || '').localeCompare(b.scheduledDate || ''));
  const chemicalStock = serverData.chemicalStock || [];
  const chemicalLogs = serverData.chemicalLogs || [];
  const cleanerAdvances = serverData.cleanerAdvances || [];
  const loginLogs = serverData.loginLogs || [];


  // Filtered cleanings based on search, payment, status, cluster, and due cycle
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

    return matchesSearch && matchesPayment && matchesStatus && matchesCluster && matchesCycle;
  });

  // Smooth DOM Virtualization / Progressive Batch Loading (Keeps mobile frame rates locked at 60 FPS)
  const [visibleCleaningsCount, setVisibleCleaningsCount] = useState(15);

  useEffect(() => {
    setVisibleCleaningsCount(15);
  }, [searchTerm, paymentFilter, statusFilter, clusterFilter, cycleFilter]);

  const visibleCleanings = filteredCleanings.slice(0, visibleCleaningsCount);

  // Handlers for Cleanings
  const handleSaveCleaning = async (cleaningData) => {
    try {
      const result = await api.saveCleaning(cleaningData);
      if (result && result.data) {
        setServerData(prev => ({ ...prev, ...result.data }));
      } else {
        await loadServerData();
      }
      toast.success(
        `Cleaning entry for ${cleaningData.storeName || cleaningData.storeCode} saved successfully!`,
        'Record Saved'
      );
    } catch (err) {
      toast.error('Error saving record: ' + err.message, 'Save Failed');
    }
  };

  const handleUpdatePayment = async (updatedCleaning) => {
    try {
      const result = await api.saveCleaning(updatedCleaning);
      if (result && result.data) {
        setServerData(prev => ({ ...prev, ...result.data }));
      } else {
        await loadServerData();
      }
      toast.success(
        `Payment for ${updatedCleaning.storeName || updatedCleaning.storeCode} updated to ${updatedCleaning.paymentStatus}!`,
        'Payment Updated'
      );
    } catch (err) {
      toast.error('Error updating payment: ' + err.message, 'Update Failed');
    }
  };

  const handleUpdatePhotos = async (cleaningId, photos) => {
    try {
      const c = cleanings.find(item => item.id === cleaningId);
      if (c) {
        const result = await api.saveCleaning({ ...c, photos });
        if (result && result.data) {
          setServerData(prev => ({ ...prev, ...result.data }));
        } else {
          await loadServerData();
        }
      }
      if (photoCleaning && photoCleaning.id === cleaningId) {
        setPhotoCleaning(prev => ({ ...prev, photos }));
      }
      toast.success('Before/After photos saved successfully!', 'Photos Saved');
    } catch (err) {
      toast.error('Error saving photos: ' + err.message, 'Photo Save Error');
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
        try {
          const result = await api.deleteCleaning(cleaning);
          if (result && result.data) {
            setServerData(prev => ({ ...prev, ...result.data }));
          } else {
            await loadServerData();
          }
          toast.success(
            `Cleaning entry (${cleaning.storeName || cleaning.storeCode} - ${cleaning.cleaningDate}) permanently delete ho gayi hai.`,
            'Record Deleted'
          );
        } catch (err) {
          toast.error('Cleaning delete karne me error: ' + err.message, 'Delete Failed');
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
    try {
      const result = await api.saveStore(storeData);
      if (result && result.data) {
        setServerData(prev => ({ ...prev, ...result.data }));
      } else {
        await loadServerData();
      }
      toast.success(`Store "${storeData.storeName || storeData.storeCode}" master ledger me update ho gaya.`, 'Store Saved');
    } catch (err) {
      toast.error('Error saving store to ledger: ' + err.message, 'Save Failed');
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
        try {
          const result = await api.deleteStore(store.storeCode, hasCleanings, true);
          if (result && result.data) {
            setServerData(prev => ({ ...prev, ...result.data }));
          } else {
            await loadServerData();
          }
          toast.success(`Store "${store.storeName}" Master Ledger se permanently delete ho gaya.`, 'Store Deleted');
        } catch (err) {
          toast.error('Store delete karne me error: ' + err.message, 'Delete Failed');
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
      teamVendor: localStorage.getItem('vendor_company_name') || 'My Deep Cleaning Services',
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
                      ? 'Blinkit City Operations & QA Inspection Portal'
                      : currentUserRole === 'manager'
                        ? 'Blinkit Operations Management Control Center'
                        : 'Blinkit Dark Store Deep Cleaning Control Center'}
                  </span>
                  <span className={`text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full font-extrabold shrink-0 ${
                    currentUserRole === 'client' 
                      ? 'bg-white text-blue-900' 
                      : currentUserRole === 'manager'
                        ? 'bg-white text-indigo-900'
                        : 'bg-slate-950 text-white'
                  }`}>
                    {currentUserRole === 'client' 
                      ? 'CLIENT / CITY OPS' 
                      : currentUserRole === 'manager'
                        ? 'OPERATIONS MANAGER'
                        : 'VENDOR ADMIN'}
                  </span>
                </div>
                <p className={`text-xs sm:text-sm font-semibold ${
                  currentUserRole === 'client' || currentUserRole === 'manager' ? 'text-indigo-100' : 'text-slate-900/80'
                }`}>
                  {currentUserRole === 'client'
                    ? 'Official inspection portal: View completed store cleanings, interactive Before/After photo comparisons, and download FSSAI Hygiene Certificates.'
                    : currentUserRole === 'manager'
                      ? 'Operations Manager Portal: Manage deep cleaning store visits, schedules, night routes, chemical stocks, and cleaner staff attendance.'
                      : 'Track store visits, manage your Store Ledger, auto-fill store info, track pending payments, view P&L profits, and manage site supervisors.'}
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
                    <span>+ Add Store</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingCleaning(null);
                      setIsEntryModalOpen(true);
                    }}
                    className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-1.5 sm:gap-2 transform active:scale-95"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>New Cleaning</span>
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
            />

            {/* Store Cards Grid / Records View */}
            <div className="space-y-3 sm:space-y-4 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blinkit-green shrink-0" />
                    <span>Store Deep Cleaning Records</span>
                  </h2>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {filteredCleanings.length} {filteredCleanings.length === 1 ? 'store' : 'stores'}
                  </span>
                </div>

                {filteredCleanings.length > 0 && (
                  <button
                    onClick={() => exportCleaningsToExcel(filteredCleanings, 'Blinkit_Filtered_Cleanings.xlsx')}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold self-start sm:self-auto"
                  >
                    Export filtered ({filteredCleanings.length})
                  </button>
                )}
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
                            alert('Payment details enter ya update karne ka access sirf Admin ke paas hai.');
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
                        <span>Load More Stores (Showing {visibleCleanings.length} of {filteredCleanings.length})</span>
                      </button>
                      <button
                        onClick={() => setVisibleCleaningsCount(filteredCleanings.length)}
                        className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold underline cursor-pointer"
                      >
                        Show All ({filteredCleanings.length})
                      </button>
                    </div>
                  )}
                </>

              ) : (
                <div className="py-16 text-center bg-white dark:bg-slate-800/60 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 p-8">
                  <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    No matching store cleaning records found
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    {searchTerm || paymentFilter !== 'all' || statusFilter !== 'all'
                      ? 'Try clearing your search query or reset the payment/status filters.'
                      : 'Start by recording your first Blinkit dark store deep cleaning entry.'}
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
                    <span>Add Store Cleaning Entry</span>
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
      />

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
        onOpenNightRoute={() => setIsNightRouteOpen(true)}
        onOpenMorningSummary={() => setIsMorningSummaryOpen(true)}
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
                Screen Inactivity Alert
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Security ke liye aapka session <strong className="text-rose-600 font-extrabold text-sm">{countdownSeconds}s</strong> mein auto-logout ho jayega.
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
                Main Active Hoon (Continue Session)
              </button>

              <button
                type="button"
                onClick={() => handleLogout('manual')}
                className="w-full py-2 text-xs font-bold text-slate-400 hover:text-rose-600 transition"
              >
                Abhi Logout Karein
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-bold text-slate-700 dark:text-slate-300">
            SK ENTERPRISES &bull; Facility Management &amp; Deep Cleaning Operations
          </span>
          <span>100% Server Cloud Database &bull; Real-Time Multi-Device Sync</span>
        </div>
      </footer>

    </div>
  );
}
