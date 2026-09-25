import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  MapPin, 
  Phone, 
  Clock, 
  Users, 
  IndianRupee, 
  Camera, 
  CheckSquare, 
  Star,
  Trash2,
  Upload,
  Calendar,
  Sparkles,
  ExternalLink,
  Wrench,
  ShieldCheck,
  PenTool,
  Plus,
  Check,
  UserCheck,
  HardHat
} from 'lucide-react';
import confetti from 'canvas-confetti';
import SignaturePad from './SignaturePad';
import { addWatermarkToPhoto } from '../utils/photoWatermark';
import { db } from '../db/db';
import { performCloudSync } from '../utils/cloudSync';

export default function CleaningEntryModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  stores = [],
  supervisors = [],
  cleaners = [],
  onAddNewStore,
  currentUserRole = 'admin'
}) {
  const isAdmin = currentUserRole === 'admin';
  const [formData, setFormData] = useState({
    storeCode: '',
    storeName: '',
    address: '',
    city: '',
    googleMapsUrl: '',
    managerName: '',
    managerPhone: '',
    cleaningDate: new Date().toISOString().split('T')[0],
    nextCleaningCycleDays: 30,
    shift: 'Night Shift (01:00 AM - 06:00 AM)',
    startTime: '01:00',
    endTime: '05:30',
    durationHours: '4.5',
    teamVendor: 'SK ENTERPRISES',
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
    equipment: {
      singleDisc: true,
      vacuum: true,
      degreaser: true,
      toiletDescaler: true,
      coldStorageSanitizer: true,
      rustRemover: true,
      scrubbingPads: true,
      ppeKit: true
    },
    managerSignature: '',
    remarks: '',
    photos: []
  });

  const [customScopeInput, setCustomScopeInput] = useState('');
  const [activePhotoTab, setActivePhotoTab] = useState('before'); // 'before' | 'during' | 'after'
  const [isWatermarking, setIsWatermarking] = useState(false);

  // Quick-Add Supervisor state
  const [showAddSupervisor, setShowAddSupervisor] = useState(false);
  const [newSupName, setNewSupName] = useState('');
  const [newSupPhone, setNewSupPhone] = useState('');
  const [isSavingSupervisor, setIsSavingSupervisor] = useState(false);

  // Quick-Add Cleaner state
  const [showAddCleaner, setShowAddCleaner] = useState(false);
  const [newCleanerName, setNewCleanerName] = useState('');
  const [newCleanerPhone, setNewCleanerPhone] = useState('');
  const [newCleanerWage, setNewCleanerWage] = useState(500);
  const [isSavingCleaner, setIsSavingCleaner] = useState(false);

  const handleQuickAddSupervisor = async (e) => {
    e?.preventDefault();
    if (!newSupName.trim()) {
      alert('Supervisor ka naam likhein');
      return;
    }
    setIsSavingSupervisor(true);
    try {
      const cleanPhone = newSupPhone.trim().replace(/\D/g, '').slice(-10);
      const newSup = {
        name: newSupName.trim(),
        phone: cleanPhone || '',
        pin: '1234',
        active: true,
        createdAt: new Date().toISOString()
      };
      await db.supervisors.add(newSup);
      performCloudSync().catch(console.warn);

      // Auto-fill supervisor in entry form
      setFormData(prev => ({
        ...prev,
        supervisorName: newSup.name,
        supervisorPhone: newSup.phone ? `+91 ${newSup.phone}` : prev.supervisorPhone
      }));

      setNewSupName('');
      setNewSupPhone('');
      setShowAddSupervisor(false);
    } catch (err) {
      alert('Supervisor save karne me error: ' + err.message);
    } finally {
      setIsSavingSupervisor(false);
    }
  };

  const handleQuickAddCleaner = async (e) => {
    e?.preventDefault();
    if (!newCleanerName.trim()) {
      alert('Cleaner ka naam likhein');
      return;
    }
    setIsSavingCleaner(true);
    try {
      const cleanPhone = newCleanerPhone.trim().replace(/\D/g, '').slice(-10);
      const newCleaner = {
        name: newCleanerName.trim(),
        phone: cleanPhone || '',
        dailyWage: Number(newCleanerWage) || 500,
        active: true,
        createdAt: new Date().toISOString()
      };
      await db.cleaners.add(newCleaner);
      performCloudSync().catch(console.warn);

      // Auto-add cleaner to team members
      const existingMembers = (formData.teamMembers || '')
        .split(',')
        .map(n => n.trim())
        .filter(Boolean);
      if (!existingMembers.some(m => m.toLowerCase() === newCleaner.name.toLowerCase())) {
        existingMembers.push(newCleaner.name);
      }
      const updatedStr = existingMembers.join(', ');
      setFormData(prev => ({
        ...prev,
        teamMembers: updatedStr,
        headcount: existingMembers.length
      }));

      setNewCleanerName('');
      setNewCleanerPhone('');
      setNewCleanerWage(500);
      setShowAddCleaner(false);
    } catch (err) {
      alert('Cleaner save karne me error: ' + err.message);
    } finally {
      setIsSavingCleaner(false);
    }
  };

  const handleToggleCleaner = (cleanerName) => {
    const existing = (formData.teamMembers || '')
      .split(',')
      .map(n => n.trim())
      .filter(Boolean);
    const index = existing.findIndex(m => m.toLowerCase() === cleanerName.toLowerCase());
    let nextList;
    if (index >= 0) {
      nextList = existing.filter((_, i) => i !== index);
    } else {
      nextList = [...existing, cleanerName];
    }
    const val = nextList.join(', ');
    setFormData(prev => ({
      ...prev,
      teamMembers: val,
      headcount: nextList.length || 1
    }));
  };


  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        nextCleaningCycleDays: initialData.nextCleaningCycleDays || 30,
        scopeOfWork: initialData.scopeOfWork || [
          'Floor Deep Cleaning',
          'Toilet / Washroom Cleaning',
          'Cold Storage Area Cleaning',
          'Wall Dry & Rust Removal'
        ],
        checklist: initialData.checklist || {
          floorDeepCleaning: true,
          toiletCleaning: true,
          coldStorageCleaning: true,
          wallRustRemoval: true,
          racks: true,
          highDusting: true
        },
        equipment: initialData.equipment || {
          singleDisc: true,
          vacuum: true,
          degreaser: true,
          toiletDescaler: true,
          coldStorageSanitizer: true,
          rustRemover: true,
          scrubbingPads: true,
          ppeKit: true
        },
        managerSignature: initialData.managerSignature || '',
        photos: initialData.photos || []
      });
    } else {
      // Reset form
      const savedVendor = localStorage.getItem('vendor_company_name') || 'SK ENTERPRISES';
      setFormData({
        storeCode: 'BLK-',
        storeName: '',
        address: '',
        city: 'Delhi NCR',
        googleMapsUrl: '',
        managerName: '',
        managerPhone: '',
        cleaningDate: new Date().toISOString().split('T')[0],
        nextCleaningCycleDays: 30,
        shift: 'Night Shift (01:00 AM - 06:00 AM)',
        startTime: '01:00',
        endTime: '05:30',
        durationHours: '4.5',
        teamVendor: savedVendor,
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
        equipment: {
          singleDisc: true,
          vacuum: true,
          degreaser: true,
          toiletDescaler: true,
          coldStorageSanitizer: true,
          rustRemover: true,
          scrubbingPads: true,
          ppeKit: true
        },
        managerSignature: '',
        remarks: '',
        photos: []
      });
    }
  }, [initialData, isOpen]);

  // Auto-calculate duration when start and end times change
  const calculateDuration = (start, end) => {
    if (!start || !end) return '';
    try {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      let diffMinutes = (eh * 60 + em) - (sh * 60 + sm);
      if (diffMinutes < 0) diffMinutes += 24 * 60; // Overnight shift
      const hours = (diffMinutes / 60).toFixed(1);
      return hours;
    } catch {
      return '';
    }
  };

  const handleTimeChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    const dur = calculateDuration(
      field === 'startTime' ? value : formData.startTime,
      field === 'endTime' ? value : formData.endTime
    );
    if (dur) updated.durationHours = dur;
    setFormData(updated);
  };

  // Auto-calculate pending amount
  const handleAmountChange = (total, received) => {
    const t = Number(total) || 0;
    const r = Number(received) || 0;
    const pending = Math.max(0, t - r);
    let status = formData.paymentStatus;
    if (r >= t && t > 0) {
      status = 'Received';
    } else if (r > 0 && r < t) {
      status = 'Partial';
    } else if (r === 0) {
      status = 'Pending';
    }
    setFormData(prev => ({
      ...prev,
      amount: t,
      amountReceived: r,
      amountPending: pending,
      paymentStatus: status
    }));
  };

  // Photo upload handler with automatic Store Code & Time watermarking
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setIsWatermarking(true);
    const newPhotos = [];

    for (const file of files) {
      try {
        const watermarkedUrl = await addWatermarkToPhoto(file, {
          storeCode: formData.storeCode || 'BLINKIT',
          type: activePhotoTab,
          date: formData.cleaningDate || new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });

        newPhotos.push({
          id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          type: activePhotoTab,
          title: `${activePhotoTab.toUpperCase()} - ${file.name.replace(/\.[^/.]+$/, "")}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          url: watermarkedUrl
        });
      } catch (err) {
        console.warn('Watermark fallback:', err);
        // Fallback to regular file reader
        const fallbackUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (uploadEvent) => resolve(uploadEvent.target.result);
          reader.readAsDataURL(file);
        });
        newPhotos.push({
          id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          type: activePhotoTab,
          title: `${activePhotoTab.toUpperCase()} - ${file.name.replace(/\.[^/.]+$/, "")}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          url: fallbackUrl
        });
      }
    }

    setFormData(prev => ({
      ...prev,
      photos: [...(prev.photos || []), newPhotos].flat()
    }));
    setIsWatermarking(false);
  };


  const removePhoto = (photoId) => {
    setFormData(prev => ({
      ...prev,
      photos: (prev.photos || []).filter(p => p.id !== photoId)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.storeCode || !formData.storeName) {
      alert('Please enter Store Code and Store Name!');
      return;
    }

    const submissionData = { ...formData };
    // If not admin, strictly protect payment fields from modification
    if (!isAdmin) {
      if (initialData) {
        submissionData.amount = initialData.amount || 0;
        submissionData.amountReceived = initialData.amountReceived || 0;
        submissionData.amountPending = initialData.amountPending !== undefined ? initialData.amountPending : (initialData.amount || 0);
        submissionData.paymentStatus = initialData.paymentStatus || 'Pending';
        submissionData.paymentMode = initialData.paymentMode || 'UPI';
        submissionData.utrNumber = initialData.utrNumber || '';
        submissionData.paymentNotes = initialData.paymentNotes || '';
      } else {
        const selectedStore = stores.find(s => s.storeCode === formData.storeCode);
        const defaultRate = Number(selectedStore?.ratePerCleaning) || 4500;
        submissionData.amount = defaultRate;
        submissionData.amountReceived = 0;
        submissionData.amountPending = defaultRate;
        submissionData.paymentStatus = 'Pending';
        submissionData.paymentMode = 'UPI';
        submissionData.utrNumber = '';
        submissionData.paymentNotes = '';
      }
    }

    onSave(submissionData);
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-100 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blinkit-yellow text-slate-950 font-black flex items-center justify-center text-lg shadow-sm">
              b
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {initialData ? 'Edit Deep Cleaning Entry' : 'New Blinkit Store Deep Cleaning Entry'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Log store details, timings, team names, payment status & photo proofs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
          
          {/* SECTION 1: Store Master Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
                <Building2 className="w-4 h-4 text-blinkit-green" />
                <span>1. Blinkit Dark Store Details</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                Ledger se select karein ya new details dalein
              </span>
            </div>

            {/* Quick Store Selector from Ledger */}
            <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <label className="block text-xs font-bold text-amber-900 dark:text-amber-300 mb-1">
                  ⚡ Store Ledger Se Select Karein (Sari Info Auto-Fill Ho Jayegi):
                </label>
                <select
                  onChange={(e) => {
                    const selectedCode = e.target.value;
                    if (!selectedCode) return;
                    const s = stores.find(st => st.storeCode === selectedCode);
                    if (s) {
                      setFormData(prev => ({
                        ...prev,
                        storeCode: s.storeCode,
                        storeName: s.storeName,
                        address: s.address || '',
                        city: s.city || '',
                        googleMapsUrl: s.googleMapsUrl || '',
                        managerName: s.managerName || '',
                        managerPhone: s.managerPhone || ''
                      }));
                    }
                  }}
                  defaultValue=""
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green"
                >
                  <option value="">-- Select Blinkit Store from Ledger --</option>
                  {stores.map(s => (
                    <option key={s.storeCode} value={s.storeCode}>
                      {s.storeCode} - {s.storeName} ({s.city || 'Hub'})
                    </option>
                  ))}
                </select>
              </div>

              {onAddNewStore && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onAddNewStore();
                  }}
                  className="text-xs font-bold px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 shrink-0 transition"
                >
                  + Add New Store in Ledger
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Store Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BLK-DEL-042"
                  value={formData.storeCode}
                  onChange={(e) => setFormData({ ...formData, storeCode: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-blinkit-green"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Store Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Blinkit Indiranagar Saket Hub"
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-blinkit-green"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Store Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Basement 1, DLF Phase 2, Cyber City"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  City / Hub Zone
                </label>
                <input
                  type="text"
                  placeholder="e.g. South Delhi / Gurugram"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Google Maps Location Link
                </label>
                <div className="relative">
                  <input
                    type="url"
                    placeholder="https://maps.google.com/..."
                    value={formData.googleMapsUrl}
                    onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })}
                    className="w-full px-3 py-2 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blinkit-green"
                  />
                  {formData.googleMapsUrl && (
                    <a
                      href={formData.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-700"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Store Manager Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vikram Singh"
                  value={formData.managerName}
                  onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Store Manager Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98101 23456"
                  value={formData.managerPhone}
                  onChange={(e) => setFormData({ ...formData, managerPhone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Date & Cleaning Timings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white font-bold">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>2. Cleaning Date, Shift & Timings (Start - End)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Cleaning Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.cleaningDate}
                  onChange={(e) => setFormData({ ...formData, cleaningDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Next Cleaning Cycle
                </label>
                <select
                  value={formData.nextCleaningCycleDays || 30}
                  onChange={(e) => setFormData({ ...formData, nextCleaningCycleDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-blinkit-green"
                >
                  <option value={15}>15 Days Cycle</option>
                  <option value={30}>30 Days (Standard)</option>
                  <option value={45}>45 Days Cycle</option>
                  <option value={60}>60 Days (Bi-Monthly)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Shift
                </label>
                <select
                  value={formData.shift}
                  onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green"
                >
                  <option value="Night Shift (01:00 AM - 06:00 AM)">Night Shift (01:00 AM - 06:00 AM)</option>
                  <option value="Day Shift (11:00 AM - 04:00 PM)">Day Shift (11:00 AM - 04:00 PM)</option>
                  <option value="Emergency Deep Clean">Emergency Deep Clean</option>
                  <option value="Pre-Audit Deep Clean">Pre-Audit Deep Clean</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleTimeChange('startTime', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blinkit-green"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleTimeChange('endTime', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blinkit-green"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs gap-2">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Calculated Cleaning Duration:
                </span>
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                  {formData.durationHours || 0} Hours
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <span>🗓️ Next Cleaning Due Date:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {(() => {
                    try {
                      const d = new Date(formData.cleaningDate || new Date());
                      d.setDate(d.getDate() + (formData.nextCleaningCycleDays || 30));
                      return d.toISOString().split('T')[0];
                    } catch {
                      return '--';
                    }
                  })()}
                </span>
              </div>
            </div>
          </div>


          {/* SECTION 3: Team Deployed */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white font-bold">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>3. Team Deployed (Supervisor, Cleaners Roster & Sabke Naam)</span>
            </div>

            {/* Quick Supervisor Selector from Registered List */}
            <div className="p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <label className="block text-xs font-bold text-indigo-950 dark:text-indigo-300 mb-1">
                  👷 Supervisor Select Karein (Registered List se Auto-Fill):
                </label>
                <select
                  value={
                    supervisors.find(s => s.name?.toLowerCase() === formData.supervisorName?.toLowerCase())?.name || ''
                  }
                  onChange={(e) => {
                    const selName = e.target.value;
                    if (!selName) return;
                    const sup = supervisors.find(s => s.name === selName);
                    if (sup) {
                      setFormData(prev => ({
                        ...prev,
                        supervisorName: sup.name,
                        supervisorPhone: sup.phone ? (sup.phone.startsWith('+91') ? sup.phone : `+91 ${sup.phone}`) : prev.supervisorPhone
                      }));
                    }
                  }}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Select Registered Supervisor --</option>
                  {supervisors.map(sup => (
                    <option key={sup.id || sup.name} value={sup.name}>
                      {sup.name} {sup.phone ? `(${sup.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setShowAddSupervisor(prev => !prev)}
                className="text-xs font-bold px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 transition flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                {showAddSupervisor ? 'Cancel' : '+ Naya Supervisor Add Karein'}
              </button>
            </div>

            {/* Inline Add Supervisor Form */}
            {showAddSupervisor && (
              <div className="p-3.5 rounded-2xl bg-indigo-100/60 dark:bg-indigo-900/40 border border-indigo-300 dark:border-indigo-700 space-y-3 animate-in fade-in duration-200">
                <div className="font-bold text-xs text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Naya Supervisor Register Karein (Direct Database &amp; Cloud Sync)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Supervisor Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={newSupName}
                      onChange={(e) => setNewSupName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Mobile Number (10 Digits)
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      maxLength={10}
                      value={newSupPhone}
                      onChange={(e) => setNewSupPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddSupervisor(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickAddSupervisor}
                    disabled={isSavingSupervisor}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSavingSupervisor ? 'Saving...' : 'Save & Select Supervisor'}
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Service Vendor / Agency
                </label>
                <input
                  type="text"
                  placeholder="e.g. CleanPro Facilities"
                  value={formData.teamVendor}
                  onChange={(e) => setFormData({ ...formData, teamVendor: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Supervisor Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Manoj Sharma"
                  value={formData.supervisorName}
                  onChange={(e) => setFormData({ ...formData, supervisorName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Supervisor Phone
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98712 34567"
                  value={formData.supervisorPhone}
                  onChange={(e) => setFormData({ ...formData, supervisorPhone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green"
                />
              </div>
            </div>

            {/* Cleaners Roster Quick-Select & Quick-Add */}
            <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="block text-xs font-bold text-emerald-950 dark:text-emerald-300">
                    🧹 Cleaners Roster (Registered Cleaners par click karke select/deselect karein):
                  </label>
                  <span className="text-[11px] text-emerald-800 dark:text-emerald-400">
                    Click karne par team list me naam jud jayega aur headcount auto-calculate hoga
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddCleaner(prev => !prev)}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 transition flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {showAddCleaner ? 'Cancel' : '+ Naya Cleaner Add Karein'}
                </button>
              </div>

              {/* Inline Add Cleaner Form */}
              {showAddCleaner && (
                <div className="p-3 rounded-xl bg-emerald-100/60 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700 space-y-2.5 animate-in fade-in duration-200">
                  <div className="font-bold text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                    <HardHat className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Naya Cleaner Roster me Add Karein (Direct Database &amp; Cloud Sync)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Cleaner Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Ramesh Kumar"
                        value={newCleanerName}
                        onChange={(e) => setNewCleanerName(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Mobile Number
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. 9812345678"
                        maxLength={10}
                        value={newCleanerPhone}
                        onChange={(e) => setNewCleanerPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Daily Wage (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 500"
                        min="0"
                        value={newCleanerWage}
                        onChange={(e) => setNewCleanerWage(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddCleaner(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickAddCleaner}
                      disabled={isSavingCleaner}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isSavingCleaner ? 'Saving...' : 'Save & Select Cleaner'}
                    </button>
                  </div>
                </div>
              )}

              {/* Registered Cleaners Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {cleaners && cleaners.length > 0 ? (
                  cleaners.map((c) => {
                    const currentTeam = (formData.teamMembers || '')
                      .split(',')
                      .map(x => x.trim().toLowerCase());
                    const isSelected = currentTeam.includes(c.name.trim().toLowerCase());
                    return (
                      <button
                        type="button"
                        key={c.id || c.name}
                        onClick={() => handleToggleCleaner(c.name)}
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-emerald-400'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        <span>{c.name}</span>
                        {c.phone && <span className="opacity-70 text-[10px]">({c.phone.slice(-4)})</span>}
                      </button>
                    );
                  })
                ) : (
                  <div className="text-xs text-slate-400 italic py-1">
                    Abhi koi cleaner registered nahi hai. "+ Naya Cleaner Add Karein" par click karke naya cleaner add karein.
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Sabke Naam (Team Members / Cleaners Names - Comma separated) *
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Ramesh Kumar, Rahul Verma, Sonu, Amit, Dinesh (Machine Operator)"
                value={formData.teamMembers}
                onChange={(e) => {
                  const val = e.target.value;
                  const count = val ? val.split(',').filter(x => x.trim().length > 0).length : 0;
                  setFormData({ ...formData, teamMembers: val, headcount: count || 1 });
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green"
              />
              <div className="text-[11px] text-slate-400 mt-0.5">
                Total Headcount: <span className="font-bold text-slate-700 dark:text-slate-300">{formData.headcount || 1} people</span>
              </div>
            </div>
          </div>

          {/* SECTION 4: Payment & Amount Tracking (Strictly Admin Only) */}
          {isAdmin && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white font-bold">
                <IndianRupee className="w-4 h-4 text-amber-500" />
                <span>4. Deep Cleaning Amount &amp; Payment Tracking (Pending / Received)</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                  Admin Only
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Total Cleaning Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.amount}
                    onChange={(e) => handleAmountChange(e.target.value, formData.amountReceived)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-blinkit-green"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Amount Received (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.amountReceived}
                    onChange={(e) => handleAmountChange(formData.amount, e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-bold text-sm focus:ring-2 focus:ring-blinkit-green"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Amount Pending (₹)
                  </label>
                  <input
                    type="number"
                    disabled
                    value={formData.amountPending}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-rose-600 dark:text-rose-400 font-black text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => {
                      const st = e.target.value;
                      let rec = formData.amountReceived;
                      let pend = formData.amountPending;
                      if (st === 'Received') {
                        rec = formData.amount;
                        pend = 0;
                      } else if (st === 'Pending') {
                        rec = 0;
                        pend = formData.amount;
                      }
                      setFormData({
                        ...formData,
                        paymentStatus: st,
                        amountReceived: rec,
                        amountPending: pend
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-blinkit-green"
                  >
                    <option value="Pending">Pending (Not Paid)</option>
                    <option value="Received">Received (Full Paid)</option>
                    <option value="Partial">Partial (Advance / Part Paid)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={formData.paymentMode}
                    onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green"
                  >
                    <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT / IMPS)</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    UTR / Reference / Trans No.
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UPI/626491823901/HDFC"
                    value={formData.utrNumber}
                    onChange={(e) => setFormData({ ...formData, utrNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blinkit-green"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: Photos Proofs (Before / In-Progress / After) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
                <Camera className="w-4 h-4 text-amber-500" />
                <span>{isAdmin ? '5.' : '4.'} Deep Cleaning Photos Proofs ({formData.photos?.length || 0})</span>
              </div>
              
              {/* Category tabs */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {['before', 'during', 'after'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActivePhotoTab(tab)}
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase transition ${
                      activePhotoTab === tab
                        ? tab === 'before'
                          ? 'bg-rose-500 text-white'
                          : tab === 'after'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-blue-600 text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Box */}
            <div className="flex flex-col sm:flex-row items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-center">
              <div className="flex-1">
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Upload <span className="uppercase font-bold text-blinkit-green">{activePhotoTab}</span> Cleaning Photos
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1 mt-0.5">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Auto Watermarked with Store Code, Date, Time &amp; Category!</span>
                </div>
              </div>
              <label className={`cursor-pointer px-4 py-2 rounded-xl text-slate-950 font-bold text-xs shadow-xs transition shrink-0 ${
                isWatermarking
                  ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-slate-500'
                  : 'bg-blinkit-yellow hover:bg-amber-400'
              }`}>
                <span>{isWatermarking ? '⏳ Watermarking Photos...' : 'Select / Snap Photos'}</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  disabled={isWatermarking}
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>


            {/* Photos Preview Grid */}
            {formData.photos && formData.photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {formData.photos.map((p) => (
                  <div key={p.id} className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group bg-slate-100 dark:bg-slate-800">
                    <img src={p.url} alt={p.title} className="w-full h-24 object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => removePhoto(p.id)}
                        className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                        title="Delete photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="p-1 text-[10px] truncate bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 font-medium">
                      <span className={`inline-block px-1 rounded uppercase font-bold text-[8px] text-white mr-1 ${
                        p.type === 'before' ? 'bg-rose-600' : p.type === 'after' ? 'bg-emerald-600' : 'bg-blue-600'
                      }`}>
                        {p.type}
                      </span>
                      {p.title}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 6: Vendor Scope of Work (Aapka Deep Cleaning Scope) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
                <CheckSquare className="w-4 h-4 text-blinkit-green" />
                <span>{isAdmin ? '6.' : '5.'} Vendor Scope of Work (Aapka Deep Cleaning Scope)</span>
              </div>
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-300/40">
                {formData.scopeOfWork?.length || 0} Scope Items Selected
              </span>
            </div>

            {/* Core 4 Scope Checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { 
                  name: 'Floor Deep Cleaning', 
                  desc: 'Industrial single disc machine scrubbing, chemical degreasing & slurry vacuuming',
                  icon: '🧼',
                  checkKey: 'floorDeepCleaning'
                },
                { 
                  name: 'Toilet / Washroom Cleaning', 
                  desc: 'Toilet pot descaling, floor tile scrubbing, mirror/fitting sanitization & odor clearance',
                  icon: '🚽',
                  checkKey: 'toiletCleaning'
                },
                { 
                  name: 'Cold Storage Area Cleaning', 
                  desc: 'Chiller & freezer deep cleaning, fungal spot removal, floor & wall sanitization',
                  icon: '❄️',
                  checkKey: 'coldStorageCleaning'
                },
                { 
                  name: 'Wall Dry & Rust Removal', 
                  desc: 'Wall dry wiping, rust stain treatment, metal rack bracket rust removal & cobweb clearance',
                  icon: '🧱',
                  checkKey: 'wallRustRemoval'
                }
              ].map((scope) => {
                const isSelected = formData.scopeOfWork?.includes(scope.name);
                return (
                  <label
                    key={scope.name}
                    className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition ${
                      isSelected
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const current = formData.scopeOfWork || [];
                        const updatedScope = e.target.checked
                          ? [...current, scope.name]
                          : current.filter(s => s !== scope.name);
                        
                        setFormData({
                          ...formData,
                          scopeOfWork: updatedScope,
                          checklist: {
                            ...formData.checklist,
                            [scope.checkKey]: e.target.checked
                          }
                        });
                      }}
                      className="mt-1 rounded text-blinkit-green focus:ring-blinkit-green"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{scope.icon}</span>
                        <span>{scope.name}</span>
                        {isSelected && (
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.2 rounded font-semibold ml-auto">
                            Included
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                        {scope.desc}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Custom Scope Item Adder */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                + Add Additional Scope Item (Agar koi extra kaam add karna ho):
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. FMCG Racks Dusting, Pest Control Baiting, Facade Glass Cleaning..."
                  value={customScopeInput}
                  onChange={(e) => setCustomScopeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (customScopeInput.trim()) {
                        const newScope = customScopeInput.trim();
                        if (!formData.scopeOfWork.includes(newScope)) {
                          setFormData({
                            ...formData,
                            scopeOfWork: [...(formData.scopeOfWork || []), newScope]
                          });
                        }
                        setCustomScopeInput('');
                      }
                    }
                  }}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customScopeInput.trim()) {
                      const newScope = customScopeInput.trim();
                      if (!formData.scopeOfWork.includes(newScope)) {
                        setFormData({
                          ...formData,
                          scopeOfWork: [...(formData.scopeOfWork || []), newScope]
                        });
                      }
                      setCustomScopeInput('');
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs"
                >
                  Add Scope
                </button>
              </div>

              {/* Display additional/custom scope badges */}
              {formData.scopeOfWork && formData.scopeOfWork.some(s => ![
                'Floor Deep Cleaning', 
                'Toilet / Washroom Cleaning', 
                'Cold Storage Area Cleaning', 
                'Wall Dry & Rust Removal'
              ].includes(s)) && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {formData.scopeOfWork
                    .filter(s => ![
                      'Floor Deep Cleaning', 
                      'Toilet / Washroom Cleaning', 
                      'Cold Storage Area Cleaning', 
                      'Wall Dry & Rust Removal'
                    ].includes(s))
                    .map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 font-semibold border border-emerald-300 dark:border-emerald-700"
                      >
                        <span>{item}</span>
                        <button
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            scopeOfWork: formData.scopeOfWork.filter(s => s !== item)
                          })}
                          className="hover:text-rose-600 ml-1 font-bold"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                </div>
              )}
            </div>

            {/* Rating & Remarks */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Overall Audit Score (1 - 5 Stars)
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className="p-1 hover:scale-110 transition"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= formData.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-2">
                    {formData.rating}/5 Stars
                  </span>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Supervisor / Manager Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Complete floor degreased, chiller fungal cleaning done."
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green"
                />
              </div>
            </div>
          </div>

          {/* SECTION 7: Equipment & Chemical Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
                <Wrench className="w-4 h-4 text-amber-500" />
                <span>{isAdmin ? '7.' : '6.'} Machinery &amp; Chemical Checklist (Jo Equipment &amp; Chemicals Use Kiye)</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                Audit Compliance &amp; Verification
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { key: 'singleDisc', name: 'Single Disc Industrial Scrubbing Machine', desc: '17" floor scrubbing machine with nylon pads for degreasing', icon: '⚙️' },
                { key: 'vacuum', name: 'Industrial Wet & Dry Vacuum Cleaner', desc: 'Heavy-duty water pickup for slurry & dirty water extraction', icon: '🌪️' },
                { key: 'degreaser', name: 'Industrial Alkaline Degreaser (Floor Deep Clean)', desc: 'Specialized chemical for dark store oil & grease spots', icon: '🧪' },
                { key: 'toiletDescaler', name: 'Acidic Toilet Descaler & Stain Remover', desc: 'Hard scale, rust & uric stain remover for washroom deep clean', icon: '🧴' },
                { key: 'coldStorageSanitizer', name: 'Cold Storage Food-Safe Sanitizer', desc: 'Anti-bacterial & anti-fungal chemical for chillers & freezers', icon: '❄️' },
                { key: 'rustRemover', name: 'Metal Rust Remover & Wire Brushes', desc: 'Rust treatment for racks, wall brackets & shutter frames', icon: '🧱' },
                { key: 'scrubbingPads', name: 'Color-Coded Scrubbing Pads & Microfibers', desc: 'Green/Black abrasive pads & lint-free wiping cloths', icon: '🧽' },
                { key: 'ppeKit', name: 'Safety PPE Kit Deployed', desc: 'Heavy rubber gloves, anti-skid gumboots, masks & eye protection', icon: '🦺' }
              ].map(item => (
                <label
                  key={item.key}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                    formData.equipment?.[item.key]
                      ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/60'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 opacity-60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(formData.equipment?.[item.key])}
                    onChange={(e) => setFormData({
                      ...formData,
                      equipment: {
                        ...formData.equipment,
                        [item.key]: e.target.checked
                      }
                    })}
                    className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
                  />
                  <div className="flex-1 text-xs">
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <span>{item.icon}</span>
                      <span>{item.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                      {item.desc}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* SECTION 8: Store Manager Digital Signature */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
                <PenTool className="w-4 h-4 text-indigo-500" />
                <span>{isAdmin ? '8.' : '7.'} Store Manager Digital Signature &amp; Sign-Off</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-300/40">
                PDF Certificate me embed hoga
              </span>
            </div>

            <SignaturePad
              value={formData.managerSignature}
              onChange={(dataUrl) => setFormData(prev => ({ ...prev, managerSignature: dataUrl }))}
              managerName={formData.managerName || 'Store Manager'}
            />
          </div>


          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blinkit-green hover:bg-blinkit-darkgreen text-white font-bold shadow-md shadow-emerald-700/20 hover:shadow-lg transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{initialData ? 'Update Cleaning Record' : 'Save Cleaning Entry'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
