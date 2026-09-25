import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  X, 
  Users, 
  IndianRupee, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  Calendar, 
  Wallet,
  Clock,
  History,
  Trash2
} from 'lucide-react';
import { db } from '../db/db';

export default function CleanerKhataModal({
  isOpen,
  onClose,
  cleaners = [],
  cleanings = [],
  onOpenCleaners
}) {
  const [selectedCleaner, setSelectedCleaner] = useState(null);
  const [isAdvanceFormOpen, setIsAdvanceFormOpen] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceDate, setAdvanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [remarks, setRemarks] = useState('');

  // Live query for all cleaner advances/payouts
  const advancesData = useLiveQuery(async () => {
    try {
      return await db.cleanerAdvances.toArray();
    } catch {
      return [];
    }
  }, []);
  const advances = Array.isArray(advancesData) ? advancesData : [];

  if (!isOpen) return null;

  // Calculate stats for a cleaner
  const getCleanerStats = (cln) => {
    // Count shifts worked
    let shiftsCount = 0;
    cleanings.forEach(c => {
      if (c.cleanerAttendance && Array.isArray(c.cleanerAttendance)) {
        if (c.cleanerAttendance.some(a => a.id === cln.id || (a.name && a.name.toLowerCase() === cln.name.toLowerCase()))) {
          shiftsCount++;
        }
      } else if (c.teamMembers && c.teamMembers.toLowerCase().includes(cln.name.toLowerCase())) {
        shiftsCount++;
      }
    });

    const wagePerShift = Number(cln.dailyWage || 500);
    const totalEarned = shiftsCount * wagePerShift;

    // Advances paid
    const cleanerAdvances = advances.filter(a => a.cleanerId === cln.id);
    const totalPaid = cleanerAdvances.reduce((sum, a) => sum + Number(a.amount || 0), 0);
    const netPayable = totalEarned - totalPaid;

    return {
      shiftsCount,
      wagePerShift,
      totalEarned,
      totalPaid,
      netPayable,
      history: cleanerAdvances.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    };
  };

  const handleSaveAdvance = async (e) => {
    e.preventDefault();
    if (!selectedCleaner || !advanceAmount || Number(advanceAmount) <= 0) {
      alert('Kripya valid amount enter karein.');
      return;
    }

    try {
      await db.cleanerAdvances.add({
        cleanerId: selectedCleaner.id,
        cleanerName: selectedCleaner.name,
        amount: Number(advanceAmount),
        date: advanceDate,
        paymentMode,
        remarks: remarks.trim(),
        createdAt: new Date()
      });

      setAdvanceAmount('');
      setRemarks('');
      setIsAdvanceFormOpen(false);
      alert(`₹${advanceAmount} payout successfully recorded for ${selectedCleaner.name}!`);
    } catch (err) {
      alert('Error recording payout: ' + err.message);
    }
  };

  const handleDeleteAdvance = async (advanceId) => {
    if (confirm('Are you sure you want to delete this payment record?')) {
      await db.cleanerAdvances.delete(advanceId);
    }
  };

  const activeStats = selectedCleaner ? getCleanerStats(selectedCleaner) : null;

  return (
    <div 
      className="fixed inset-0 z-100 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Cleaner Staff Haziri &amp; Payout Khata
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track cleaner shift wages, advance payments &amp; pending salary ledger
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

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
          
          {cleaners.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Left Column: Cleaners List */}
              <div className="md:col-span-1 space-y-2 border-r border-slate-100 dark:border-slate-800 pr-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Staff Members ({cleaners.length})
                  </span>
                  {onOpenCleaners && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenCleaners();
                      }}
                      className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                      title="Manage Staff Roster / Add Cleaners"
                    >
                      <Users className="w-3 h-3" />
                      <span>+ Manage Staff</span>
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  {cleaners.map(cln => {
                    const stats = getCleanerStats(cln);
                    const isSelected = selectedCleaner?.id === cln.id;
                    return (
                      <button
                        key={cln.id}
                        type="button"
                        onClick={() => {
                          setSelectedCleaner(cln);
                          setIsAdvanceFormOpen(false);
                        }}
                        className={`w-full text-left p-3 rounded-2xl border transition ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-850/60 border-slate-200 dark:border-slate-750 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white truncate">{cln.name}</span>
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {stats.shiftsCount} Shifts
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                          <span>Bal: <strong className={stats.netPayable > 0 ? 'text-amber-600' : 'text-emerald-600'}>₹{stats.netPayable}</strong></span>
                          <span>₹{cln.dailyWage || 500}/night</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Selected Cleaner Details & Khata */}
              <div className="md:col-span-2 space-y-4">
                {selectedCleaner ? (
                  <>
                    {/* Header Details of selected cleaner */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-base">{selectedCleaner.name}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            {selectedCleaner.role || 'Deep Cleaner'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          📞 {selectedCleaner.phone || 'No phone'} &bull; Wage: ₹{selectedCleaner.dailyWage || 500}/night
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsAdvanceFormOpen(!isAdvanceFormOpen)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Pay Advance / Wage</span>
                      </button>
                    </div>

                    {/* Financial Summary KPI Cards */}
                    <div className="grid grid-cols-3 gap-2.5 text-center">
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Total Shifts Worked</div>
                        <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                          {activeStats.shiftsCount} Nights
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                          Earned: ₹{activeStats.totalEarned.toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                        <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Advance / Paid</div>
                        <div className="text-lg font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
                          ₹{activeStats.totalPaid.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                          {activeStats.history.length} Transactions
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                        <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">Pending Balance</div>
                        <div className="text-lg font-black text-amber-700 dark:text-amber-300 mt-0.5">
                          ₹{activeStats.netPayable.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                          Payable to Staff
                        </div>
                      </div>
                    </div>

                    {/* Advance / Payout Form Drawer */}
                    {isAdvanceFormOpen && (
                      <form onSubmit={handleSaveAdvance} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-emerald-300 dark:border-emerald-800 space-y-3 animate-in fade-in zoom-in-95 duration-100">
                        <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
                          <span>Pay Advance or Wage to {selectedCleaner.name}</span>
                          <button
                            type="button"
                            onClick={() => setIsAdvanceFormOpen(false)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            &times;
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              Amount (₹) *
                            </label>
                            <input
                              type="number"
                              min="1"
                              required
                              placeholder="e.g. 1000"
                              value={advanceAmount}
                              onChange={(e) => setAdvanceAmount(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-emerald-600"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              Payment Mode
                            </label>
                            <select
                              value={paymentMode}
                              onChange={(e) => setPaymentMode(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                            >
                              <option value="UPI">UPI / GPay / PhonePe</option>
                              <option value="Cash">Cash (Hath me diya)</option>
                              <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                            Remarks / Purpose
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Advance for festival / Weekly wage payment"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition"
                        >
                          Confirm &amp; Record Payout (₹{advanceAmount || 0})
                        </button>
                      </form>
                    )}

                    {/* Payment History for this cleaner */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        Payouts &amp; Advance History ({activeStats.history.length})
                      </span>

                      {activeStats.history.length > 0 ? (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {activeStats.history.map(item => (
                            <div
                              key={item.id}
                              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                            >
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                  <span className="text-emerald-600 font-black">₹{item.amount}</span>
                                  <span className="text-[10px] px-2 py-0.2 rounded-md bg-slate-200 dark:bg-slate-700 font-semibold">
                                    {item.paymentMode || 'UPI'}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  <span>{item.date}</span>
                                  {item.remarks && <span className="ml-1 italic text-slate-500">"{item.remarks}"</span>}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeleteAdvance(item.id)}
                                className="text-slate-400 hover:text-rose-600 p-1"
                                title="Delete payment entry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-xs text-slate-400 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                          Is cleaner ko abhi koi advance payment nahi diya gaya hai.
                        </div>
                      )}
                    </div>

                  </>
                ) : (
                  <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      Select a cleaner from the left to view their Haziri &amp; Payout Khata
                    </p>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
              <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">
                Abhi tak koi cleaner register nahi kiya gaya hai.
              </p>
              {onOpenCleaners && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCleaners();
                  }}
                  className="mt-2 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition"
                >
                  + Add Cleaners Team
                </button>
              )}
            </div>
          )}

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
