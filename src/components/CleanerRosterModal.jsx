import React, { useState } from 'react';
import { 
  X, 
  Users, 
  Plus, 
  IndianRupee, 
  Phone, 
  Edit3, 
  Trash2,
  HardHat
} from 'lucide-react';
import { db } from '../db/db';
import { performCloudSync, deleteCleanerOnServer } from '../utils/cloudSync';

export default function CleanerRosterModal({
  isOpen,
  onClose,
  cleaners = []
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentCleaner, setCurrentCleaner] = useState({
    name: '',
    phone: '',
    dailyWage: 500,
    role: 'Deep Cleaner / Machine Operator'
  });

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setCurrentCleaner({
      name: '',
      phone: '',
      dailyWage: 500,
      role: 'Deep Cleaner'
    });
    setIsEditing(true);
  };

  const handleStartEdit = (cln) => {
    setCurrentCleaner(cln);
    setIsEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentCleaner.name) {
      alert('Please enter Cleaner Name.');
      return;
    }

    try {
      if (currentCleaner.id) {
        await db.cleaners.update(currentCleaner.id, {
          name: currentCleaner.name.trim(),
          phone: (currentCleaner.phone || '').trim(),
          dailyWage: Number(currentCleaner.dailyWage) || 500,
          role: currentCleaner.role || 'Deep Cleaner',
          updatedAt: new Date()
        });
      } else {
        await db.cleaners.add({
          name: currentCleaner.name.trim(),
          phone: (currentCleaner.phone || '').trim(),
          dailyWage: Number(currentCleaner.dailyWage) || 500,
          role: currentCleaner.role || 'Deep Cleaner',
          active: true,
          createdAt: new Date()
        });
      }
      setIsEditing(false);
      performCloudSync().catch(() => {});
    } catch (err) {
      alert('Error saving cleaner: ' + err.message);
    }
  };

  const handleDelete = async (cln) => {
    if (confirm(`Are you sure you want to remove cleaner "${cln?.name || 'this cleaner'}" from the roster?`)) {
      await deleteCleanerOnServer(cln);
      if (cln?.id) {
        await db.cleaners.delete(cln.id);
      }
      performCloudSync().catch(() => {});
    }
  };

  return (
    <div 
      className="fixed inset-0 z-100 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-black flex items-center justify-center">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Cleaning Staff &amp; Cleaner Roster
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage your cleaners, machine operators &amp; night shift wage rates
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
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {!isEditing ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Total Registered Cleaners ({cleaners.length})
                </span>
                <button
                  type="button"
                  onClick={handleStartAdd}
                  className="px-3 py-1.5 rounded-xl bg-blinkit-green hover:bg-blinkit-darkgreen text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Cleaner</span>
                </button>
              </div>

              {cleaners.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {cleaners.map((cln) => (
                    <div
                      key={cln.id}
                      className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/50 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{cln.name}</span>
                          <span className="text-[10px] px-2 py-0.2 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {cln.role || 'Cleaner'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                          {cln.phone && <span>📞 {cln.phone}</span>}
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            Wage: ₹{cln.dailyWage || 500} / shift
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(cln)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(cln)}
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
                  <HardHat className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    No cleaners added to the roster yet
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Add your team members (e.g. Ramesh, Rahul, Sonu) with their night shift wage to auto-calculate labor costs and attendance.
                  </p>
                  <button
                    type="button"
                    onClick={handleStartAdd}
                    className="mt-3 px-3.5 py-1.5 rounded-xl bg-blinkit-green text-white font-bold text-xs"
                  >
                    + Add First Cleaner
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cleaner Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={currentCleaner.name}
                  onChange={(e) => setCurrentCleaner({ ...currentCleaner, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Role / Specialty
                  </label>
                  <select
                    value={currentCleaner.role}
                    onChange={(e) => setCurrentCleaner({ ...currentCleaner, role: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green"
                  >
                    <option value="Deep Cleaner">Deep Cleaner</option>
                    <option value="Machine Operator">Machine Operator (Single Disc)</option>
                    <option value="Chiller / Cold Storage Specialist">Chiller Specialist</option>
                    <option value="Helper / Assistant">Helper / Assistant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Shift Wage (₹ / Night) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 500"
                    value={currentCleaner.dailyWage}
                    onChange={(e) => setCurrentCleaner({ ...currentCleaner, dailyWage: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-emerald-600 focus:ring-2 focus:ring-blinkit-green"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9812345678"
                  value={currentCleaner.phone}
                  onChange={(e) => setCurrentCleaner({ ...currentCleaner, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green"
                />
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
                  Save Cleaner
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
