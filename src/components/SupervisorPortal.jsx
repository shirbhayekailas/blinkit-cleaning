import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Clock, 
  Play, 
  Square, 
  CheckCircle2, 
  Camera, 
  AlertTriangle, 
  Users, 
  Wrench, 
  CheckSquare, 
  ExternalLink, 
  LogOut, 
  Sparkles, 
  ShieldCheck,
  Navigation,
  PenTool,
  Upload,
  Trash2,
  Plus,
  Share2,
  Smartphone,
  QrCode
} from 'lucide-react';
import confetti from 'canvas-confetti';
import SignaturePad from './SignaturePad';
import { addWatermarkToPhoto } from '../utils/photoWatermark';
import { getGPSCoordinates } from '../utils/geolocation';
import { shareStoreLocationWhatsApp } from '../utils/whatsappFormatter';
import AudioRecorder from './AudioRecorder';
import SpeechToTextInput from './SpeechToTextInput';
import QRScannerModal from './QRScannerModal';
import { saveCleaning, saveIssue } from '../services/api';

export default function SupervisorPortal({
  supervisor,
  stores = [],
  cleaners = [],
  onLogout,
  onRecordSaved
}) {
  // Filter stores assigned to this supervisor
  const assignedStores = stores.filter(s => 
    !supervisor.assignedStoreCodes || 
    supervisor.assignedStoreCodes.length === 0 || 
    supervisor.assignedStoreCodes.includes(s.storeCode)
  );

  const [selectedStoreCode, setSelectedStoreCode] = useState('');
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const selectedStore = stores.find(s => s.storeCode === selectedStoreCode);

  // Timer & Shift states
  const [shiftState, setShiftState] = useState('idle'); // 'idle' | 'running' | 'completed'
  const [punchInTime, setPunchInTime] = useState(null);
  const [punchOutTime, setPunchOutTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);

  // GPS state
  const [gpsData, setGpsData] = useState(null);
  const [isGettingGps, setIsGettingGps] = useState(false);

  // Cleaner Attendance state
  const [selectedCleanerIds, setSelectedCleanerIds] = useState([]);
  const [customCleaners, setCustomCleaners] = useState([]); // Array of { id, name, wage }
  const [newCleanerName, setNewCleanerName] = useState('');
  const [newCleanerWage, setNewCleanerWage] = useState(500);

  // Photos state
  const [photos, setPhotos] = useState([]);
  const [activePhotoTab, setActivePhotoTab] = useState('before');
  const [isWatermarking, setIsWatermarking] = useState(false);

  // Checklist & Scope
  const [scopeOfWork, setScopeOfWork] = useState([
    'Floor Deep Cleaning',
    'Toilet / Washroom Cleaning',
    'Cold Storage Area Cleaning',
    'Wall Dry & Rust Removal'
  ]);
  const [equipmentCheck, setEquipmentCheck] = useState({
    singleDisc: true,
    vacuum: true,
    degreaser: true,
    toiletDescaler: true,
    coldStorageSanitizer: true,
    rustRemover: true,
    scrubbingPads: true,
    ppeKit: true
  });

  // Store Manager Signature & Remarks
  const [managerSignature, setManagerSignature] = useState('');
  const [rating, setRating] = useState(5);
  const [remarks, setRemarks] = useState('');
  const [audioRemarks, setAudioRemarks] = useState('');

  // Store Issue / Defect Flagging
  const [hasIssue, setHasIssue] = useState(false);
  const [issueType, setIssueType] = useState('Cold Storage Drainage Blocked');
  const [issueDesc, setIssueDesc] = useState('');
  const [issuePhoto, setIssuePhoto] = useState('');

  // Running Timer Effect
  useEffect(() => {
    if (shiftState === 'running') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [shiftState]);

  // Format Elapsed Time
  const formatTimer = (totalSecs) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${String(h).padStart(2, '0')}h : ${String(m).padStart(2, '0')}m : ${String(s).padStart(2, '0')}s`;
  };

  // Start Punch In
  const handlePunchIn = async () => {
    if (!selectedStoreCode) {
      alert('Pehle Blinkit Dark Store select karein!');
      return;
    }
    const now = new Date();
    setPunchInTime(now);
    setShiftState('running');
    setElapsedSeconds(0);

    // Auto-capture GPS at punch-in
    setIsGettingGps(true);
    const coords = await getGPSCoordinates();
    setGpsData(coords);
    setIsGettingGps(false);
  };

  // Finish Punch Out
  const handlePunchOut = () => {
    setPunchOutTime(new Date());
    setShiftState('completed');
  };

  // Photo Upload with automatic watermarking
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setIsWatermarking(true);
    const newPhotos = [];

    for (const file of files) {
      try {
        const watermarkedUrl = await addWatermarkToPhoto(file, {
          storeCode: selectedStoreCode || 'BLINKIT',
          type: activePhotoTab,
          date: new Date().toISOString().split('T')[0],
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
        console.warn('Fallback photo upload:', err);
      }
    }

    setPhotos(prev => [...prev, ...newPhotos]);
    setIsWatermarking(false);
  };

  // Issue Photo Upload
  const handleIssuePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setIssuePhoto(ev.target.result);
    reader.readAsDataURL(file);
  };

  // Calculate Labor Cost (Roster + On-the-spot Cleaners)
  const rosterLaborCost = selectedCleanerIds.reduce((sum, id) => {
    const cln = cleaners.find(c => c.id === id);
    return sum + (cln ? Number(cln.dailyWage || 500) : 500);
  }, 0);

  const customLaborCost = customCleaners.reduce((sum, c) => {
    return sum + (Number(c.wage) || 500);
  }, 0);

  const calculatedLaborCost = rosterLaborCost + customLaborCost;
  const totalCleanersPresent = selectedCleanerIds.length + customCleaners.length;

  const handleAddCustomCleaner = (e) => {
    if (e) e.preventDefault();
    if (!newCleanerName.trim()) {
      alert('Kripya cleaner ka naam enter karein.');
      return;
    }
    setCustomCleaners(prev => [
      ...prev,
      {
        id: 'cust_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        name: newCleanerName.trim(),
        wage: Number(newCleanerWage) || 500
      }
    ]);
    setNewCleanerName('');
    setNewCleanerWage(500);
  };

  const handleRemoveCustomCleaner = (id) => {
    setCustomCleaners(prev => prev.filter(c => c.id !== id));
  };

  // Submit Cleaning Record
  const handleSubmitShift = async (e) => {
    e.preventDefault();
    if (!selectedStoreCode) {
      alert('Please select a dark store.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const stTime = punchInTime ? punchInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '01:00';
    const enTime = punchOutTime ? punchOutTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '05:30';
    const durHours = elapsedSeconds > 0 ? (elapsedSeconds / 3600).toFixed(1) : '4.5';

    // Compile cleaner attendance objects
    const rosterAttendance = cleaners
      .filter(c => selectedCleanerIds.includes(c.id))
      .map(c => ({ id: c.id, name: c.name, wage: Number(c.dailyWage || 500), source: 'roster', present: true }));

    const onSpotAttendance = customCleaners.map(c => ({
      id: c.id,
      name: c.name,
      wage: Number(c.wage || 500),
      source: 'on_spot',
      present: true
    }));

    const allCleanersAttendance = [...rosterAttendance, ...onSpotAttendance];
    const cleanerNames = allCleanersAttendance.map(c => c.name);

    const cleaningRecord = {
      storeCode: selectedStore.storeCode,
      storeName: selectedStore.storeName,
      address: selectedStore.address || '',
      city: selectedStore.city || '',
      googleMapsUrl: selectedStore.googleMapsUrl || '',
      managerName: selectedStore.managerName || '',
      managerPhone: selectedStore.managerPhone || '',
      cleaningDate: todayStr,
      nextCleaningCycleDays: 30,
      shift: 'Night Shift (01:00 AM - 06:00 AM)',
      startTime: stTime,
      endTime: enTime,
      durationHours: durHours,
      teamVendor: localStorage.getItem('vendor_company_name') || 'SK ENTERPRISES',
      supervisorId: supervisor.id,
      supervisorName: supervisor.name,
      supervisorPhone: supervisor.phone,
      teamMembers: cleanerNames.join(', ') || 'Field Team',
      headcount: allCleanersAttendance.length > 0 ? allCleanersAttendance.length : 4,
      amount: 4500, // Standard contracted rate per store
      amountReceived: 0,
      amountPending: 4500,
      paymentStatus: 'Pending',
      status: 'Completed',
      rating,
      scopeOfWork,
      checklist: {
        floorDeepCleaning: scopeOfWork.includes('Floor Deep Cleaning'),
        toiletCleaning: scopeOfWork.includes('Toilet / Washroom Cleaning'),
        coldStorageCleaning: scopeOfWork.includes('Cold Storage Area Cleaning'),
        wallRustRemoval: scopeOfWork.includes('Wall Dry & Rust Removal')
      },
      equipment: equipmentCheck,
      managerSignature,
      remarks,
      audioRemarks,
      photos,
      gpsCoords: gpsData || null,
      punchInTime: punchInTime ? punchInTime.toISOString() : null,
      punchOutTime: punchOutTime ? punchOutTime.toISOString() : null,
      laborCost: calculatedLaborCost,
      chemicalCost: 300,
      netProfit: 4500 - calculatedLaborCost - 300,
      cleanerAttendance: allCleanersAttendance,
      createdAt: new Date()
    };

    try {
      const saveRes = await saveCleaning(cleaningRecord);
      const cleaningId = saveRes?.cleaning?.id || Date.now();

      // If defect/issue was flagged, save to server storeIssues
      if (hasIssue && issueDesc.trim()) {
        await saveIssue({
          cleaningId,
          storeCode: selectedStore.storeCode,
          storeName: selectedStore.storeName,
          issueType,
          description: issueDesc.trim(),
          photoUrl: issuePhoto || '',
          status: 'Open',
          reportedAt: new Date().toISOString(),
          supervisorName: supervisor.name
        });
      }

      confetti({ particleCount: 70, spread: 70, origin: { y: 0.7 } });
      alert(`✅ Cleaning shift submitted successfully for ${selectedStore.storeName}!`);
      
      // Reset form
      setSelectedStoreCode('');
      setShiftState('idle');
      setElapsedSeconds(0);
      setPhotos([]);
      setManagerSignature('');
      setRemarks('');
      setAudioRemarks('');
      setHasIssue(false);
      setIssueDesc('');
      setIssuePhoto('');

      if (onRecordSaved) onRecordSaved();
    } catch (err) {
      alert('Error submitting shift: ' + err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      
      {/* Supervisor Top Identity Bar */}
      <div className="p-4 rounded-3xl bg-slate-900 text-white shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-lg">
            👷
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-sm sm:text-base">
                {supervisor.name}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                SITE SUPERVISOR
              </span>
            </div>
            <p className="text-xs text-slate-400">
              📞 {supervisor.phone} &bull; Blinkit Field Operations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('trigger-pwa-install'))}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            title="Install Mobile App"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Install App</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition flex items-center gap-1.5 shadow-sm active:scale-95"
            title="Logout from Supervisor Session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Shift Form */}
      <form onSubmit={handleSubmitShift} className="space-y-5">

        {/* STEP 1: Dark Store Selector */}
        <div className="p-5 bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blinkit-green" />
              <span>1. Select Blinkit Dark Store (Aapka Assigned Store)</span>
            </h3>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              {assignedStores.length} Stores Available
            </span>
          </div>

          <div className="flex gap-2">
            <select
              required
              value={selectedStoreCode}
              onChange={(e) => setSelectedStoreCode(e.target.value)}
              className="flex-1 px-3.5 py-2.5 text-sm font-bold rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green"
            >
              <option value="">-- Choose Blinkit Store from Your Assigned List --</option>
              {assignedStores.map(s => (
                <option key={s.storeCode} value={s.storeCode}>
                  {s.storeCode} - {s.storeName} ({s.city || 'Hub'})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setIsQRScannerOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-blinkit-green hover:bg-blinkit-darkgreen text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 shrink-0"
              title="Scan Store QR Code to Check In"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">Scan QR</span>
            </button>
          </div>

          {selectedStore && (
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 text-xs space-y-1 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{selectedStore.address || 'Address not listed'}</span>
                {selectedStore.googleMapsUrl && (
                  <a
                    href={selectedStore.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 font-bold ml-1 hover:underline inline-flex items-center gap-0.5"
                  >
                    <span>Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-400">Manager:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedStore.managerName || 'N/A'}</span>
                  {selectedStore.managerPhone && (
                    <a href={`tel:${selectedStore.managerPhone}`} className="text-emerald-600 font-bold ml-1">
                      📞 {selectedStore.managerPhone}
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => shareStoreLocationWhatsApp(selectedStore)}
                  title="Share Store GMap Location on WhatsApp to Team"
                  className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition inline-flex items-center gap-1 shrink-0"
                >
                  <Share2 className="w-3 h-3" />
                  <span>Share GMap (WA)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* STEP 2: Live Punch-In / Punch-Out Timer & GPS */}
        <div className="p-5 bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>2. Live Shift Punch-In / Punch-Out &amp; GPS On-Site Verification</span>
            </h3>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              Night Shift
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* Timer Display */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white text-center space-y-1.5 shadow-inner">
              <div className="text-[10px] uppercase font-extrabold tracking-widest text-indigo-300">
                Shift Running Timer
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-black tracking-wider text-amber-400">
                {formatTimer(elapsedSeconds)}
              </div>
              <div className="text-[11px] text-slate-400">
                {shiftState === 'running' ? '🟢 Deep Cleaning in progress...' : shiftState === 'completed' ? '✅ Shift Finished' : 'Not started yet'}
              </div>
            </div>

            {/* Punch In / Out Actions */}
            <div className="space-y-2.5">
              {shiftState === 'idle' && (
                <button
                  type="button"
                  onClick={handlePunchIn}
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Punch In / Start Cleaning (Raat 1 AM)</span>
                </button>
              )}

              {shiftState === 'running' && (
                <button
                  type="button"
                  onClick={handlePunchOut}
                  className="w-full py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2 animate-pulse"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>Punch Out / Finish Cleaning (Subah 5:30 AM)</span>
                </button>
              )}

              {shiftState === 'completed' && (
                <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-xs text-emerald-800 dark:text-emerald-300 font-bold text-center">
                  ✅ Cleaning completed! Duration: {(elapsedSeconds / 3600).toFixed(1)} Hours recorded.
                </div>
              )}

              {/* GPS On-Site Badge */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 text-xs border border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5 text-blue-500" />
                  <span>On-Site GPS Status:</span>
                </span>
                {gpsData?.verified ? (
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>📍 Verified ({gpsData.latitude}, {gpsData.longitude})</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      setIsGettingGps(true);
                      const res = await getGPSCoordinates();
                      setGpsData(res);
                      setIsGettingGps(false);
                    }}
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                  >
                    {isGettingGps ? 'Getting GPS...' : '+ Capture Live GPS'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* STEP 3: Cleaner Attendance & On-Site Team Entry */}
        <div className="p-5 bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>3. Cleaner Attendance (Kitne Cleaners Site Par Aaye)</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Roster se select karein ya site par naye daily wage helper ko turant add karein
              </p>
            </div>

            {/* Attendance & Wage Counter Pill */}
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs flex items-center gap-1.5 border border-emerald-300/60">
                <span>👥 {totalCleanersPresent} Cleaners Present</span>
              </span>
              <span className="px-3 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 font-extrabold text-xs flex items-center gap-1 border border-amber-300/60">
                <span>₹{calculatedLaborCost} Shift Wage</span>
              </span>
            </div>
          </div>

          {/* Sub-section A: Registered Cleaners from Roster */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                A. Roster Cleaners ({cleaners.length} Registered)
              </span>
              {cleaners.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (selectedCleanerIds.length === cleaners.length) {
                      setSelectedCleanerIds([]);
                    } else {
                      setSelectedCleanerIds(cleaners.map(c => c.id));
                    }
                  }}
                  className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                >
                  {selectedCleanerIds.length === cleaners.length ? 'Deselect All' : 'Select All Present'}
                </button>
              )}
            </div>

            {cleaners.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {cleaners.map(cln => {
                  const isSelected = selectedCleanerIds.includes(cln.id);
                  return (
                    <label
                      key={cln.id}
                      className={`flex items-center gap-2 p-2.5 rounded-2xl border cursor-pointer transition text-xs ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 opacity-60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCleanerIds([...selectedCleanerIds, cln.id]);
                          } else {
                            setSelectedCleanerIds(selectedCleanerIds.filter(id => id !== cln.id));
                          }
                        }}
                        className="rounded text-blinkit-green focus:ring-blinkit-green w-4 h-4"
                      />
                      <div className="truncate">
                        <div className="font-bold truncate">{cln.name}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">₹{cln.dailyWage || 500} / shift</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                Admin ne abhi koi roster cleaner add nahi kiya hai. Aap niche direct naye cleaner add kar sakte hain.
              </div>
            )}
          </div>

          {/* Sub-section B: On-the-spot Cleaner Entry (Naya / Daily Helper) */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              B. Site Par Naye Cleaners / Helpers Add Karein (On-Site Entry)
            </span>
            
            <div className="flex flex-col sm:flex-row items-center gap-2 bg-slate-50 dark:bg-slate-850 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <input
                type="text"
                placeholder="Cleaner / Helper Ka Naam (e.g. Raju, Dinesh)"
                value={newCleanerName}
                onChange={(e) => setNewCleanerName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomCleaner();
                  }
                }}
                className="w-full sm:flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green font-medium"
              />

              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Wage"
                    value={newCleanerWage}
                    onChange={(e) => setNewCleanerWage(e.target.value)}
                    className="w-20 py-1 text-xs bg-transparent text-slate-900 dark:text-white font-bold focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddCustomCleaner}
                  className="px-3 py-2 rounded-xl bg-blinkit-green hover:bg-blinkit-darkgreen text-white font-bold text-xs shadow-xs transition shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add to Shift</span>
                </button>
              </div>
            </div>

            {/* Added on-the-spot cleaners chip list */}
            {customCleaners.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {customCleaners.map((c) => (
                  <div
                    key={c.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-xs font-bold text-emerald-900 dark:text-emerald-200 shadow-2xs"
                  >
                    <span>👷 {c.name} (₹{c.wage})</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomCleaner(c.id)}
                      className="text-emerald-700 hover:text-rose-600 dark:text-emerald-300 dark:hover:text-rose-400 font-bold ml-1 text-sm leading-none"
                      title="Remove cleaner"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* STEP 4: Scope of Work & Equipment Checklist */}
        <div className="p-5 bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-blinkit-green" />
            <span>4. Scope of Work &amp; Equipment Checklist</span>
          </h3>

          {/* Scope 4 items */}
          <div className="grid grid-cols-2 gap-2">
            {[
              'Floor Deep Cleaning',
              'Toilet / Washroom Cleaning',
              'Cold Storage Area Cleaning',
              'Wall Dry & Rust Removal'
            ].map((scope) => (
              <label
                key={scope}
                className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <input
                  type="checkbox"
                  checked={scopeOfWork.includes(scope)}
                  onChange={(e) => {
                    if (e.target.checked) setScopeOfWork([...scopeOfWork, scope]);
                    else setScopeOfWork(scopeOfWork.filter(s => s !== scope));
                  }}
                  className="rounded text-blinkit-green focus:ring-blinkit-green"
                />
                <span>{scope}</span>
              </label>
            ))}
          </div>

          {/* Equipment Check */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {[
              { key: 'singleDisc', label: 'Single Disc Machine ⚙️' },
              { key: 'vacuum', label: 'Vacuum Slurry 🌪️' },
              { key: 'degreaser', label: 'Degreaser Chemical 🧪' },
              { key: 'toiletDescaler', label: 'Toilet Descaler 🧴' },
              { key: 'coldStorageSanitizer', label: 'Chiller Sanitizer ❄️' },
              { key: 'rustRemover', label: 'Rust Treatment 🧱' },
              { key: 'scrubbingPads', label: 'Scrubbing Pads 🧽' },
              { key: 'ppeKit', label: 'Safety PPE Kit 🦺' }
            ].map(item => (
              <label key={item.key} className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={Boolean(equipmentCheck[item.key])}
                  onChange={(e) => setEquipmentCheck({ ...equipmentCheck, [item.key]: e.target.checked })}
                  className="rounded text-amber-500 focus:ring-amber-400"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* STEP 5: Tamper-Proof Watermarked Photos */}
        <div className="p-5 bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-amber-500" />
              <span>5. Site Photos ({photos.length} Uploaded)</span>
            </h3>
            
            {/* Category tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {['before', 'during', 'after'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActivePhotoTab(tab)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold uppercase transition ${
                    activePhotoTab === tab
                      ? tab === 'before'
                        ? 'bg-rose-500 text-white'
                        : tab === 'after'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 text-white'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-850/50 text-center">
            <div className="flex-1">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Snap / Select <span className="uppercase text-blinkit-green">{activePhotoTab}</span> Photos
              </div>
              <div className="text-[11px] text-slate-400">
                Auto-stamped with {selectedStoreCode || 'Store Code'}, Date &amp; Time
              </div>
            </div>
            <label className={`cursor-pointer px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition shrink-0 ${
              isWatermarking
                ? 'bg-slate-300 dark:bg-slate-700 text-slate-500'
                : 'bg-blinkit-yellow hover:bg-amber-400 text-slate-950'
            }`}>
              <span>{isWatermarking ? '⏳ Stamping Photos...' : '📷 Take / Upload Photos'}</span>
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

          {photos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {photos.map(p => (
                <div key={p.id} className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                  <img src={p.url} alt={p.title} className="w-full h-20 object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos(photos.filter(x => x.id !== p.id))}
                    className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <span className="absolute bottom-0 inset-x-0 text-[8px] font-bold text-center py-0.2 uppercase text-white bg-black/70">
                    {p.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* STEP 6: Flag Store Maintenance Defect / Issue */}
        <div className="p-5 bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>6. Dark Store Defect / Maintenance Issue (Optional)</span>
            </h3>
            <label className="flex items-center gap-1.5 text-xs font-bold text-rose-600 cursor-pointer">
              <input
                type="checkbox"
                checked={hasIssue}
                onChange={(e) => setHasIssue(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span>Report Issue</span>
            </label>
          </div>

          {hasIssue && (
            <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Issue Category
                  </label>
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Cold Storage Drainage Blocked">Cold Storage Drainage Blocked</option>
                    <option value="Chiller / Deep Freezer Gasket Torn">Chiller Door Gasket Torn</option>
                    <option value="Washroom Flush / Tap Leakage">Washroom Flush / Tap Leakage</option>
                    <option value="Floor Tile Broken / Cracked">Floor Tile Broken / Cracked</option>
                    <option value="Wall Dampness / Major Leakage">Wall Dampness / Major Leakage</option>
                    <option value="Pest / Rodent Activity Sighted">Pest / Rodent Activity Sighted</option>
                    <option value="Other Maintenance Defect">Other Maintenance Defect</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Attach Issue Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIssuePhotoUpload}
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-rose-100 file:text-rose-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Issue Description (Boliye ya Likhiye):
                </label>
                <SpeechToTextInput
                  placeholder="e.g. Freezer 2 drain pipe overflow ho raha hai, pani floor par aa raha hai."
                  value={issueDesc}
                  onChange={setIssueDesc}
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>

        {/* STEP 7: Store Manager Digital Signature */}
        <div className="p-5 bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <PenTool className="w-4 h-4 text-indigo-500" />
              <span>7. Store Manager Sign-Off (Screen Par Sign)</span>
            </h3>
            <span className="text-xs text-slate-400">
              Manager: {selectedStore?.managerName || 'Store Manager'}
            </span>
          </div>

          <SignaturePad
            value={managerSignature}
            onChange={(dataUrl) => setManagerSignature(dataUrl)}
            managerName={selectedStore?.managerName || 'Store Manager'}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Text Remarks (Boliye ya Likhiye):
            </label>
            <SpeechToTextInput
              placeholder="e.g. Chiller and floor machine scrubbing fully completed."
              value={remarks}
              onChange={setRemarks}
              rows={2}
            />
          </div>

          {/* Supervisor Voice Note Recorder */}
          <AudioRecorder
            audioUrl={audioRemarks}
            onAudioChange={setAudioRemarks}
          />
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-4 px-6 rounded-2xl bg-blinkit-green hover:bg-blinkit-darkgreen text-white font-black text-base shadow-lg shadow-emerald-700/20 hover:shadow-xl transition transform active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            <span>SUBMIT COMPLETED CLEANING SHIFT</span>
          </button>
        </div>

      </form>

      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        stores={assignedStores}
        onStoreScanned={(code) => setSelectedStoreCode(code)}
      />

    </div>
  );
}
