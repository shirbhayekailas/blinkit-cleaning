import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  KeyRound, 
  Eye, 
  EyeOff, 
  UserCheck, 
  Building2, 
  Edit3, 
  RotateCcw, 
  Share2, 
  Search, 
  Plus, 
  Check, 
  Lock,
  Phone,
  AlertTriangle,
  Sparkles,
  History
} from 'lucide-react';
import { db } from '../db/db';
import { performCloudSync } from '../utils/cloudSync';

export default function UserAccessModal({
  isOpen,
  onClose,
  supervisors = [],
  onOpenAddSupervisor,
  onChangeAdminPin,
  onOpenLoginLogs
}) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Show / Hide states for PINs
  const [showAdminPin, setShowAdminPin] = useState(false);
  const [showManagerPin, setShowManagerPin] = useState(false);
  const [showClientPin, setShowClientPin] = useState(false);
  const [visiblePins, setVisiblePins] = useState({}); // { [supId]: boolean }

  // Inline editing state: { [supId]: newPinString }
  const [editingSupId, setEditingSupId] = useState(null);
  const [tempPin, setTempPin] = useState('');

  // Manager PIN state
  const [isEditingManagerPin, setIsEditingManagerPin] = useState(false);
  const [managerPinVal, setManagerPinVal] = useState(() => localStorage.getItem('vendor_manager_pin') || '1234');

  // Client PIN state
  const [isEditingClientPin, setIsEditingClientPin] = useState(false);
  const [clientPinVal, setClientPinVal] = useState(() => localStorage.getItem('blinkit_client_pin') || '5678');

  if (!isOpen) return null;

  const adminId = localStorage.getItem('vendor_admin_id') || 'admin';
  const adminPin = localStorage.getItem('vendor_admin_pin') || '1234';
  const isAdminDefault = adminPin === '1234';

  const managerId = localStorage.getItem('vendor_manager_id') || 'manager';
  const managerPin = localStorage.getItem('vendor_manager_pin') || '1234';
  const isManagerDefault = managerPin === '1234';

  const clientId = localStorage.getItem('blinkit_client_id') || 'client';
  const clientPin = localStorage.getItem('blinkit_client_pin') || '5678';

  const toggleSupPinVisibility = (id) => {
    setVisiblePins(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleStartEditSupPin = (sup) => {
    setEditingSupId(sup.id);
    setTempPin(sup.pin || '1234');
  };

  const handleSaveSupPin = async (supId) => {
    if (!tempPin || tempPin.trim().length < 4) {
      alert('PIN kam se kam 4 digits ka hona chahiye.');
      return;
    }

    try {
      await db.supervisors.update(supId, {
        pin: tempPin.trim(),
        hasChangedPin: true,
        updatedAt: new Date()
      });
      setEditingSupId(null);
      performCloudSync().catch(() => {});
    } catch (err) {
      alert('PIN save karne me error: ' + err.message);
    }
  };

  const handleResetSupPin = async (sup) => {
    if (confirm(`${sup.name} ka PIN reset karke default '1234' karna chahte hain?`)) {
      try {
        await db.supervisors.update(sup.id, {
          pin: '1234',
          hasChangedPin: false,
          updatedAt: new Date()
        });
        performCloudSync().catch(() => {});
      } catch (err) {
        alert('Error: ' + err.message);
      }
    }
  };

  const handleSaveClientPin = () => {
    if (!clientPinVal || clientPinVal.trim().length < 4) {
      alert('Client PIN kam se kam 4 digits ka hona chahiye.');
      return;
    }
    localStorage.setItem('blinkit_client_pin', clientPinVal.trim());
    localStorage.setItem('client_pin_changed', 'true');
    setIsEditingClientPin(false);
    performCloudSync().catch(() => {});
  };

  const handleSaveManagerPin = () => {
    if (!managerPinVal || managerPinVal.trim().length < 4) {
      alert('Manager PIN kam se kam 4 digits ka hona chahiye.');
      return;
    }
    localStorage.setItem('vendor_manager_pin', managerPinVal.trim());
    setIsEditingManagerPin(false);
    performCloudSync().catch(() => {});
  };

  const handleShareManagerWhatsApp = () => {
    const appUrl = window.location.origin;
    const msg = `*Blinkit Deep Cleaning Operations - Operations Manager Login*\n\n` +
      `Namaste,\n` +
      `Aapka Operations Manager portal account access credentials:\n\n` +
      `📱 *Login ID*: ${managerId}\n` +
      `🔑 *Password (PIN)*: ${managerPin}\n` +
      `🌐 *Portal Link*: ${appUrl}\n\n` +
      `Aap is login se store cleanings, ledger, schedules, chemical inventory aur attendance manage kar sakte hain.`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleShareSupervisorWhatsApp = (sup) => {
    const appUrl = window.location.origin;
    const msg = `*Blinkit Deep Cleaning Operations - Supervisor Login*\n\n` +
      `Namaste *${sup.name}* ji,\n` +
      `Aapka cleaning portal account ready hai:\n\n` +
      `📱 *Login ID (Mobile)*: ${sup.phone}\n` +
      `🔑 *Password (PIN)*: ${sup.pin}\n` +
      `🌐 *App Link*: ${appUrl}\n\n` +
      `Kripya is Login ID aur Password se portal me login karein aur cleaning inspection shuru karein.`;
    
    window.open(`https://wa.me/91${sup.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleShareClientWhatsApp = () => {
    const appUrl = window.location.origin;
    const msg = `*Blinkit Dark Store Deep Cleaning - Client View Portal*\n\n` +
      `Namaste,\n` +
      `Blinkit Dark Store Deep Cleaning QA & Monitoring Portal login credentials:\n\n` +
      `📱 *Login ID*: ${clientId}\n` +
      `🔑 *Password*: ${clientPin}\n` +
      `🌐 *Portal Link*: ${appUrl}\n\n` +
      `Is link se aap real-time store deep cleaning progress, before/after photos aur ratings check kar sakte hain.`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const filteredSupervisors = supervisors.filter(s => 
    (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.phone || '').includes(searchTerm)
  );

  return (
    <div 
      className="fixed inset-0 z-100 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-black flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Security Center &bull; Passwords &amp; Logins</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 font-extrabold">
                  Admin Master Control
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sare supervisors aur accounts ke passwords yahan dekhein, change karein aur reset karein
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

        {/* Top Audit Log Banner */}
        <div className="px-6 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 border-b border-blue-100 dark:border-blue-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-blue-900 dark:text-blue-300">
            <History className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="font-semibold">Login Activity Tracker: Kisne kab aur kis device se login kiya audit karein</span>
          </div>
          {onOpenLoginLogs && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLoginLogs();
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto shrink-0"
            >
              <History className="w-3.5 h-3.5" />
              <span>View Login Logs</span>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* ADMIN, MANAGER & CLIENT SYSTEM ACCOUNTS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Admin Master PIN Card */}
            <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10 space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    👑
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white">Admin Master Account</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Full Owner System Access</p>
                  </div>
                </div>

                {isAdminDefault ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200">
                    Default PIN
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200">
                    Secured
                  </span>
                )}
              </div>

              {/* Credential & Action Box */}
              <div className="bg-white dark:bg-slate-800/90 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Login ID</span>
                    <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {adminId}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Password (PIN)</span>
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="font-mono text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-widest">
                        {showAdminPin ? adminPin : '••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAdminPin(!showAdminPin)}
                        title={showAdminPin ? 'Hide PIN' : 'View PIN'}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                      >
                        {showAdminPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => onChangeAdminPin && onChangeAdminPin()}
                    className="w-full py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-2xs transition flex items-center justify-center gap-1.5 active:scale-98"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Change PIN</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Operations Manager PIN Card */}
            <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/10 space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    👔
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white">Operations Manager</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">All Ops Access (No Passwords)</p>
                  </div>
                </div>

                {isManagerDefault ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200">
                    Default PIN (1234)
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200">
                    Secured
                  </span>
                )}
              </div>

              {/* Credential & Action Box */}
              <div className="bg-white dark:bg-slate-800/90 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5 shadow-2xs">
                {isEditingManagerPin ? (
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400 uppercase font-semibold block">Set New PIN (4-6 digits)</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        maxLength={6}
                        value={managerPinVal}
                        onChange={(e) => setManagerPinVal(e.target.value)}
                        className="flex-1 px-2.5 py-1 text-sm font-mono border rounded-lg bg-slate-50 dark:bg-slate-900 font-bold text-slate-900 dark:text-white"
                        placeholder="New PIN"
                      />
                      <button
                        type="button"
                        onClick={handleSaveManagerPin}
                        className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                        title="Save PIN"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingManagerPin(false)}
                        className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 transition"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Login ID</span>
                        <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {managerId}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Password (PIN)</span>
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="font-mono text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-widest">
                            {showManagerPin ? managerPin : '••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowManagerPin(!showManagerPin)}
                            title={showManagerPin ? 'Hide PIN' : 'View PIN'}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                          >
                            {showManagerPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setManagerPinVal(managerPin);
                          setIsEditingManagerPin(true);
                        }}
                        className="flex-1 py-1.5 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs transition flex items-center justify-center gap-1 active:scale-98"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Change PIN</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleShareManagerWhatsApp}
                        title="Send Manager Login on WhatsApp"
                        className="p-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition flex items-center gap-1 shrink-0 active:scale-98"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Share</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Blinkit Client View PIN Card */}
            <div className="p-4 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    🏢
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white">Blinkit Client View Portal</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">City Ops Head &amp; QA Read-only</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
                  Client Mode
                </span>
              </div>

              {/* Credential & Action Box */}
              <div className="bg-white dark:bg-slate-800/90 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5 shadow-2xs">
                {isEditingClientPin ? (
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400 uppercase font-semibold block">Set New PIN (4-6 digits)</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        maxLength={6}
                        value={clientPinVal}
                        onChange={(e) => setClientPinVal(e.target.value)}
                        className="flex-1 px-2.5 py-1 text-sm font-mono border rounded-lg bg-slate-50 dark:bg-slate-900 font-bold text-slate-900 dark:text-white"
                        placeholder="New PIN"
                      />
                      <button
                        type="button"
                        onClick={handleSaveClientPin}
                        className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                        title="Save PIN"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingClientPin(false)}
                        className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 transition"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Login ID</span>
                        <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {clientId}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Password (PIN)</span>
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="font-mono text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-widest">
                            {showClientPin ? clientPin : '••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowClientPin(!showClientPin)}
                            title={showClientPin ? 'Hide PIN' : 'View PIN'}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                          >
                            {showClientPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setClientPinVal(clientPin);
                          setIsEditingClientPin(true);
                        }}
                        className="flex-1 py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition flex items-center justify-center gap-1 active:scale-98"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Change PIN</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleShareClientWhatsApp}
                        title="Send Client Portal Login on WhatsApp"
                        className="p-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition flex items-center gap-1 shrink-0 active:scale-98"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Share</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>

          {/* SUPERVISORS PASSWORDS LIST */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>Site Supervisors Logins &amp; Passwords ({supervisors.length})</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Supervisor ka exact password dekhein ya naya set karein
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search name/phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => onOpenAddSupervisor && onOpenAddSupervisor()}
                  className="px-3 py-1.5 rounded-xl bg-blinkit-green hover:bg-blinkit-darkgreen text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add Supervisor</span>
                </button>
              </div>
            </div>

            {filteredSupervisors.length > 0 ? (
              <div className="space-y-2.5">
                {filteredSupervisors.map((sup) => {
                  const isVisible = visiblePins[sup.id];
                  const isInlineEditing = editingSupId === sup.id;
                  const isDefaultPin = sup.pin === '1234' || !sup.hasChangedPin;

                  return (
                    <div
                      key={sup.id}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition"
                    >
                      {/* Left: Supervisor Info */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {sup.name}
                          </span>
                          
                          {isDefaultPin ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                              Default PIN (1234)
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              ✓ PIN Set by Admin
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-mono">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Login ID:</span>
                            <Phone className="w-3 h-3 text-slate-400" />
                            {sup.phone}
                          </span>
                          <span className="text-slate-400">&bull;</span>
                          <span>
                            {sup.assignedStoreCodes?.length || 0} Stores Assigned
                          </span>
                        </div>
                      </div>

                      {/* Right: Password View & Controls */}
                      <div className="flex items-center gap-2 self-end md:self-auto bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                        
                        {isInlineEditing ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              maxLength={6}
                              value={tempPin}
                              onChange={(e) => setTempPin(e.target.value)}
                              placeholder="New PIN"
                              className="w-20 px-2 py-1 text-xs font-mono border rounded-lg bg-slate-50 dark:bg-slate-900 text-center font-bold"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveSupPin(sup.id)}
                              className="p-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                              title="Save PIN"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingSupId(null)}
                              className="p-1 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5 mr-2">
                              <span className="text-[11px] font-semibold text-slate-400">PIN:</span>
                              <span className="font-mono text-sm font-black text-slate-900 dark:text-white tracking-widest min-w-[40px]">
                                {isVisible ? sup.pin : '••••'}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleSupPinVisibility(sup.id)}
                              title={isVisible ? "Hide Password" : "View Password"}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                            >
                              {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStartEditSupPin(sup)}
                              title="Change / Edit PIN"
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleResetSupPin(sup)}
                              title="Reset PIN to 1234"
                              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleShareSupervisorWhatsApp(sup)}
                              title="Send Login & PIN on WhatsApp"
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <UserCheck className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Koi supervisor nahi mila
                </p>
                <button
                  type="button"
                  onClick={() => onOpenAddSupervisor && onOpenAddSupervisor()}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-blinkit-green text-white font-bold text-xs"
                >
                  + Pehla Supervisor Banayein
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-xs text-slate-400">
          <span>🔒 All PINs encrypted &amp; synced across devices</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
