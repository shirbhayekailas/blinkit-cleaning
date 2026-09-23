import React, { useState, useEffect } from 'react';
import { 
  X, 
  IndianRupee, 
  CheckCircle2, 
  AlertCircle, 
  CreditCard, 
  Calendar, 
  Hash, 
  FileText,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PaymentUpdateModal({
  isOpen,
  onClose,
  cleaning,
  onSave
}) {
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    amountReceived: 0,
    amountPending: 0,
    paymentStatus: 'Pending',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMode: 'UPI',
    utrNumber: '',
    paymentNotes: ''
  });

  useEffect(() => {
    if (cleaning) {
      setPaymentData({
        amount: cleaning.amount || 0,
        amountReceived: cleaning.amountReceived || 0,
        amountPending: cleaning.amountPending !== undefined ? cleaning.amountPending : (cleaning.amount || 0),
        paymentStatus: cleaning.paymentStatus || 'Pending',
        paymentDate: cleaning.paymentDate || new Date().toISOString().split('T')[0],
        paymentMode: cleaning.paymentMode || 'UPI',
        utrNumber: cleaning.utrNumber || '',
        paymentNotes: cleaning.paymentNotes || ''
      });
    }
  }, [cleaning, isOpen]);

  if (!isOpen || !cleaning) return null;

  const handleMarkFullReceived = () => {
    setPaymentData(prev => ({
      ...prev,
      amountReceived: prev.amount,
      amountPending: 0,
      paymentStatus: 'Received'
    }));
  };

  const handleReceivedChange = (received) => {
    const r = Number(received) || 0;
    const total = Number(paymentData.amount) || 0;
    const pending = Math.max(0, total - r);
    let status = 'Pending';
    if (r >= total && total > 0) {
      status = 'Received';
    } else if (r > 0 && r < total) {
      status = 'Partial';
    }
    setPaymentData(prev => ({
      ...prev,
      amountReceived: r,
      amountPending: pending,
      paymentStatus: status
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...cleaning,
      ...paymentData
    });
    if (paymentData.paymentStatus === 'Received') {
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Update Payment Status
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {cleaning.storeCode} - {cleaning.storeName}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          
          {/* Quick Snapshot Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/60 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Billed</div>
              <div className="text-base font-black text-slate-900 dark:text-white">
                ₹{Number(paymentData.amount).toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Received</div>
              <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                ₹{Number(paymentData.amountReceived).toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">Pending</div>
              <div className="text-base font-black text-rose-600 dark:text-rose-400">
                ₹{Number(paymentData.amountPending).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Quick Action: Mark Full Payment */}
          {paymentData.paymentStatus !== 'Received' && (
            <button
              type="button"
              onClick={handleMarkFullReceived}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800 flex items-center justify-center gap-2 transition"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Mark Full Payment Received (₹{Number(paymentData.amount).toLocaleString('en-IN')})</span>
            </button>
          )}

          {/* Payment Status Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Payment Status *
            </label>
            <select
              value={paymentData.paymentStatus}
              onChange={(e) => {
                const st = e.target.value;
                if (st === 'Received') {
                  handleMarkFullReceived();
                } else if (st === 'Pending') {
                  setPaymentData(prev => ({
                    ...prev,
                    paymentStatus: 'Pending',
                    amountReceived: 0,
                    amountPending: prev.amount
                  }));
                } else {
                  setPaymentData(prev => ({ ...prev, paymentStatus: 'Partial' }));
                }
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-blinkit-green"
            >
              <option value="Pending">Pending (Payment Not Yet Received)</option>
              <option value="Received">Received (Full Payment Received)</option>
              <option value="Partial">Partial (Advance / Partial Paid)</option>
            </select>
          </div>

          {/* Amount Received Input */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Amount Received (₹)
              </label>
              <input
                type="number"
                min="0"
                max={paymentData.amount}
                value={paymentData.amountReceived}
                onChange={(e) => handleReceivedChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-bold focus:ring-2 focus:ring-blinkit-green"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Amount Pending (₹)
              </label>
              <input
                type="number"
                disabled
                value={paymentData.amountPending}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-rose-600 dark:text-rose-400 font-bold"
              />
            </div>
          </div>

          {/* Payment Date & Mode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Payment Date
              </label>
              <input
                type="date"
                value={paymentData.paymentDate}
                onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Payment Mode
              </label>
              <select
                value={paymentData.paymentMode}
                onChange={(e) => setPaymentData({ ...paymentData, paymentMode: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green"
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Bank Transfer">Bank Transfer (NEFT / IMPS)</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>

          {/* UTR / Transaction No */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              UTR / Transaction Reference Number
            </label>
            <input
              type="text"
              placeholder="e.g. UPI/626491823901/HDFC or NEFT Ref"
              value={paymentData.utrNumber}
              onChange={(e) => setPaymentData({ ...paymentData, utrNumber: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blinkit-green"
            />
          </div>

          {/* Payment Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Payment Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Approved by Hub Manager. Bill cleared."
              value={paymentData.paymentNotes}
              onChange={(e) => setPaymentData({ ...paymentData, paymentNotes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blinkit-green hover:bg-blinkit-darkgreen text-white font-bold shadow-md shadow-emerald-700/20 transition flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Save Payment</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
