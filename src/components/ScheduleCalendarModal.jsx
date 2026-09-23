import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  X, 
  Calendar, 
  Clock, 
  Building2, 
  Plus, 
  CheckCircle2, 
  UserCheck, 
  Users, 
  Trash2, 
  AlertCircle,
  Play
} from 'lucide-react';
import { db } from '../db/db';

export default function ScheduleCalendarModal({
  isOpen,
  onClose,
  stores = [],
  supervisors = [],
  onStartShiftForStore
}) {
  const [isScheduling, setIsScheduling] = useState(false);
  const todayStr = new Date().toISOString().split('T')[0];
  const [filterDate, setFilterDate] = useState(todayStr);

  const [newSchedule, setNewSchedule] = useState({
    storeCode: '',
    scheduledDate: todayStr,
    shift: 'Night Shift (01:00 AM - 06:00 AM)',
    supervisorId: '',
    expectedCleaners: 4,
    notes: ''
  });

  // Query schedules from Dexie
  const schedulesData = useLiveQuery(async () => {
    try {
      const list = await db.cleaningSchedules.toArray();
      return list.sort((a, b) => (a.scheduledDate || '').localeCompare(b.scheduledDate || ''));
    } catch {
      return [];
    }
  }, []);
  const schedules = Array.isArray(schedulesData) ? schedulesData : [];

  if (!isOpen) return null;

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!newSchedule.storeCode || !newSchedule.scheduledDate) {
      alert('Kripya store aur scheduled date select karein.');
      return;
    }

    const st = stores.find(s => s.storeCode === newSchedule.storeCode);
    const sup = supervisors.find(s => s.id === Number(newSchedule.supervisorId));

    try {
      await db.cleaningSchedules.add({
        storeCode: newSchedule.storeCode,
        storeName: st?.storeName || 'Dark Store',
        city: st?.city || 'Delhi NCR',
        address: st?.address || '',
        scheduledDate: newSchedule.scheduledDate,
        shift: newSchedule.shift,
        supervisorId: sup ? sup.id : null,
        supervisorName: sup ? sup.name : 'Not assigned',
        expectedCleaners: Number(newSchedule.expectedCleaners) || 4,
        notes: newSchedule.notes.trim(),
        status: 'Scheduled', // 'Scheduled' | 'Completed' | 'Cancelled'
        createdAt: new Date()
      });

      setIsScheduling(false);
      setNewSchedule({
        storeCode: '',
        scheduledDate: todayStr,
        shift: 'Night Shift (01:00 AM - 06:00 AM)',
        supervisorId: '',
        expectedCleaners: 4,
        notes: ''
      });
      alert('Shift successfully scheduled!');
    } catch (err) {
      alert('Error scheduling shift: ' + err.message);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    await db.cleaningSchedules.update(id, { status });
  };

  const handleDeleteSchedule = async (id) => {
    if (confirm('Delete this schedule entry?')) {
      await db.cleaningSchedules.delete(id);
    }
  };

  // Tonight's schedules
  const tonightSchedules = schedules.filter(s => s.scheduledDate === todayStr);
  // Filtered by date view or all
  const displayedSchedules = filterDate ? schedules.filter(s => s.scheduledDate === filterDate) : schedules;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Tonight's Shift &amp; Cleaning Schedule Planner
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Plan dark store night shifts, assign supervisors &amp; track upcoming 15-day / 30-day cycles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
          
          {/* Tonight's Urgent Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-extrabold text-sm uppercase tracking-wider text-emerald-300">
                  Tonight's Night Shift (01:00 AM)
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {tonightSchedules.length} Dark Stores scheduled for deep cleaning tonight ({todayStr})
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsScheduling(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-sm transition flex items-center gap-1.5 self-start sm:self-center"
            >
              <Plus className="w-4 h-4" />
              <span>+ Schedule Store Shift</span>
            </button>
          </div>

          {/* New Schedule Form */}
          {isScheduling && (
            <form onSubmit={handleSaveSchedule} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-indigo-200 dark:border-indigo-800 space-y-3 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between font-bold text-xs text-slate-900 dark:text-white">
                <span>Schedule New Dark Store Cleaning Shift</span>
                <button
                  type="button"
                  onClick={() => setIsScheduling(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  &times;
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Select Blinkit Store *
                  </label>
                  <select
                    required
                    value={newSchedule.storeCode}
                    onChange={(e) => setNewSchedule({ ...newSchedule, storeCode: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                  >
                    <option value="">-- Choose Store --</option>
                    {stores.map(s => (
                      <option key={s.storeCode} value={s.storeCode}>
                        {s.storeCode} - {s.storeName} ({s.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Scheduled Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newSchedule.scheduledDate}
                    onChange={(e) => setNewSchedule({ ...newSchedule, scheduledDate: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Assign Supervisor
                  </label>
                  <select
                    value={newSchedule.supervisorId}
                    onChange={(e) => setNewSchedule({ ...newSchedule, supervisorId: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="">-- Select Supervisor --</option>
                    {supervisors.map(sup => (
                      <option key={sup.id} value={sup.id}>
                        {sup.name} ({sup.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Expected Cleaners Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newSchedule.expectedCleaners}
                    onChange={(e) => setNewSchedule({ ...newSchedule, expectedCleaners: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Shift Notes / Focus Areas
                </label>
                <input
                  type="text"
                  placeholder="e.g. Special deep scrubbing required in Cold Room 2 & Washroom"
                  value={newSchedule.notes}
                  onChange={(e) => setNewSchedule({ ...newSchedule, notes: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsScheduling(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
                >
                  Save Shift Schedule
                </button>
              </div>
            </form>
          )}

          {/* Filter Bar */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">View Date:</span>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
              {filterDate && (
                <button
                  type="button"
                  onClick={() => setFilterDate('')}
                  className="text-[11px] text-blue-600 hover:underline"
                >
                  Show All ({schedules.length})
                </button>
              )}
            </div>

            <span className="text-xs text-slate-400 font-semibold">
              Showing {displayedSchedules.length} Shifts
            </span>
          </div>

          {/* Schedules List */}
          <div className="space-y-2">
            {displayedSchedules.length > 0 ? (
              <div className="grid grid-cols-1 gap-2.5">
                {displayedSchedules.map(item => {
                  const isDone = item.status === 'Completed';
                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isDone
                          ? 'bg-slate-50 dark:bg-slate-850/40 border-slate-200 dark:border-slate-800 opacity-70'
                          : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 shadow-xs'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {item.storeCode} - {item.storeName}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                            isDone
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                          }`}>
                            {item.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span>📅 {item.scheduledDate}</span>
                          <span>⏰ {item.shift}</span>
                          <span>👷 Sup: <strong>{item.supervisorName}</strong></span>
                          <span>👥 {item.expectedCleaners} Cleaners</span>
                        </div>

                        {item.notes && (
                          <p className="text-[11px] text-slate-400 italic">
                            "{item.notes}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {!isDone && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(item.id, 'Completed')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 transition flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Mark Done</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteSchedule(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                          title="Delete schedule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                Is date par koi cleaning shift scheduled nahi hai. Upar "+ Schedule Store Shift" par click karein.
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
