import React, { useState } from 'react';
import { 
  X, 
  Users, 
  Plus, 
  Building2, 
  Phone, 
  KeyRound, 
  Check, 
  Edit3, 
  Trash2, 
  ShieldCheck,
  CheckSquare,
  Eye,
  EyeOff
} from 'lucide-react';
import { db } from '../db/db';

export default function SupervisorManagementModal({
  isOpen,
  onClose,
  supervisors = [],
  stores = []
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [visiblePins, setVisiblePins] = useState({});
  const [currentSupervisor, setCurrentSupervisor] = useState({
    name: '',
    phone: '',
    pin: '1234',
    assignedStoreCodes: []
  });

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setCurrentSupervisor({
      name: '',
      phone: '',
      pin: '1234',
      assignedStoreCodes: []
    });
    setIsEditing(true);
  };

  const handleStartEdit = (sup) => {
    setCurrentSupervisor({
      ...sup,
      assignedStoreCodes: sup.assignedStoreCodes || []
    });
    setIsEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentSupervisor.name || !currentSupervisor.phone || !currentSupervisor.pin) {
      alert('Please fill Name, Phone, and 4-Digit PIN.');
      return;
    }

    try {
      if (currentSupervisor.id) {
        await db.supervisors.update(currentSupervisor.id, {
          name: currentSupervisor.name.trim(),
          phone: currentSupervisor.phone.trim().replace(/[^0-9]/g, ''),
          pin: currentSupervisor.pin.trim(),
          assignedStoreCodes: currentSupervisor.assignedStoreCodes || [],
          updatedAt: new Date()
        });
      } else {
        await db.supervisors.add({
          name: currentSupervisor.name.trim(),
          phone: currentSupervisor.phone.trim().replace(/[^0-9]/g, ''),
          pin: currentSupervisor.pin.trim(),
          assignedStoreCodes: currentSupervisor.assignedStoreCodes || [],
          active: true,
          createdAt: new Date()
        });
      }
      setIsEditing(false);
    } catch (err) {
      alert('Error saving supervisor: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this supervisor?')) {
      await db.supervisors.delete(id);
    }
  };

  const toggleStoreAssignment = (code) => {
    const current = currentSupervisor.assignedStoreCodes || [];
    if (current.includes(code)) {
      setCurrentSupervisor({
        ...currentSupervisor,
        assignedStoreCodes: current.filter(c => c !== code)
      });
    } else {
      setCurrentSupervisor({
        ...currentSupervisor,
        assignedStoreCodes: [...current, code]
      });
    }
  };

  const toggleSelectAllStores = () => {
    const allCodes = stores.map(s => s.storeCode);
    if ((currentSupervisor.assignedStoreCodes || []).length === allCodes.length) {
      setCurrentSupervisor({ ...currentSupervisor, assignedStoreCodes: [] });
    } else {
      setCurrentSupervisor({ ...currentSupervisor, assignedStoreCodes: allCodes });
    }
  };

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-black flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Site Supervisors &amp; Store Assignments
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create field supervisors, set 4-digit PINs, and assign dark stores
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

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {!isEditing ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Registered Supervisors ({supervisors.length})
                </span>
                <button
                  type="button"
                  onClick={handleStartAdd}
                  className="px-3 py-1.5 rounded-xl bg-blinkit-green hover:bg-blinkit-darkgreen text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Supervisor</span>
                </button>
              </div>

              {supervisors.length > 0 ? (
                <div className="space-y-2.5">
                  {supervisors.map((sup) => (
                    <div
                      key={sup.id}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {sup.name}
                          </span>
                          <div className="flex items-center gap-1.5 font-mono text-[11px] px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold">
                            <span>PIN: {visiblePins[sup.id] ? sup.pin : '••••'}</span>
                            <button
                              type="button"
                              onClick={() => setVisiblePins(p => ({ ...p, [sup.id]: !p[sup.id] }))}
                              title={visiblePins[sup.id] ? "Hide PIN" : "Show PIN"}
                              className="p-0.5 hover:text-amber-950 dark:hover:text-white"
                            >
                              {visiblePins[sup.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {sup.phone}
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                            <Building2 className="w-3 h-3" />
                            {sup.assignedStoreCodes?.length || 0} Stores Assigned
                          </span>
                        </div>
                        {sup.assignedStoreCodes && sup.assignedStoreCodes.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {sup.assignedStoreCodes.map(code => (
                              <span key={code} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                                {code}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(sup)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(sup.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                  <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    No site supervisors added yet
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Add your supervisors so they can login on mobile and log cleaning visits for their assigned stores.
                  </p>
                  <button
                    type="button"
                    onClick={handleStartAdd}
                    className="mt-3 px-3.5 py-1.5 rounded-xl bg-blinkit-green text-white font-bold text-xs"
                  >
                    + Add First Supervisor
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Supervisor Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Manoj Sharma"
                    value={currentSupervisor.name}
                    onChange={(e) => setCurrentSupervisor({ ...currentSupervisor, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9871234567"
                    value={currentSupervisor.phone}
                    onChange={(e) => setCurrentSupervisor({ ...currentSupervisor, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    4-Digit Login PIN *
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    placeholder="e.g. 1234"
                    value={currentSupervisor.pin}
                    onChange={(e) => setCurrentSupervisor({ ...currentSupervisor, pin: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold tracking-widest focus:ring-2 focus:ring-blinkit-green"
                  />
                </div>
              </div>

              {/* Store Assignment Section */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Assign Blinkit Dark Stores to this Supervisor:
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Supervisor will only see and log entries for these selected stores.
                    </p>
                  </div>
                  {stores.length > 0 && (
                    <button
                      type="button"
                      onClick={toggleSelectAllStores}
                      className="text-xs text-blinkit-green font-bold hover:underline"
                    >
                      {(currentSupervisor.assignedStoreCodes || []).length === stores.length
                        ? 'Deselect All'
                        : 'Select All Stores'}
                    </button>
                  )}
                </div>

                {stores.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                    {stores.map(store => {
                      const isAssigned = (currentSupervisor.assignedStoreCodes || []).includes(store.storeCode);
                      return (
                        <label
                          key={store.storeCode}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition text-xs ${
                            isAssigned
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
                              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 opacity-70'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isAssigned}
                            onChange={() => toggleStoreAssignment(store.storeCode)}
                            className="rounded text-blinkit-green focus:ring-blinkit-green"
                          />
                          <span className="font-mono font-bold text-[11px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 rounded">
                            {store.storeCode}
                          </span>
                          <span className="font-semibold truncate">{store.storeName}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                    No stores in ledger yet. Please add dark stores to the ledger first.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blinkit-green hover:bg-blinkit-darkgreen text-white font-bold text-xs shadow-xs"
                >
                  Save Supervisor
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
