import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Download, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  CreditCard, 
  Save, 
  Filter
} from 'lucide-react';
import { generateConsolidatedInvoicePDF } from '../utils/consolidatedInvoiceGenerator';

export default function ConsolidatedInvoiceModal({
  isOpen,
  onClose,
  cleanings = []
}) {
  const currentMonthStr = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [selectedCleaningIds, setSelectedCleaningIds] = useState([]);
  
  const [invoiceMeta, setInvoiceMeta] = useState({
    invoiceNumber: `INV-CONS-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-01`,
    monthLabel: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) + ' Deep Cleaning Cycle'
  });

  const DEFAULT_SK_PROFILE = {
    companyName: 'SK ENTERPRISES',
    phone: '09594023629',
    email: 'skenterprises.clean@gmail.com',
    address: '303, Panchsheel Chs Ltd., Plot No. 07, Sector -2, Taloja Phase -01, Navi Mumbai - 410208',
    gstin: '27OQCPS0083R1ZU',
    bankName: 'HDFC Bank',
    accountNumber: '50200012345678',
    ifsc: 'HDFC0001234',
    upiId: 'cleanpro@hdfcbank'
  };

  const [vendorProfile, setVendorProfile] = useState(DEFAULT_SK_PROFILE);

  // Filter cleanings by selected month
  const monthCleanings = cleanings.filter(c => (c.cleaningDate || '').startsWith(selectedMonth));

  useEffect(() => {
    // By default select all cleanings in this month
    setSelectedCleaningIds(monthCleanings.map(c => c.id));
  }, [selectedMonth, cleanings.length]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('vendor_invoice_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.companyName || parsed.companyName === 'My Deep Cleaning Services' || parsed.companyName === 'CleanPro Facilities Pvt Ltd') {
          setVendorProfile({
            ...DEFAULT_SK_PROFILE,
            ...parsed,
            companyName: 'SK ENTERPRISES',
            phone: parsed.phone || '09594023629',
            address: parsed.address || DEFAULT_SK_PROFILE.address,
            gstin: parsed.gstin || '27OQCPS0083R1ZU'
          });
        } else {
          setVendorProfile({ ...DEFAULT_SK_PROFILE, ...parsed });
        }
      } else {
        setVendorProfile(DEFAULT_SK_PROFILE);
      }
    } catch (e) {
      console.warn('Profile read notice', e);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedList = cleanings.filter(c => selectedCleaningIds.includes(c.id));
  const totalBilled = selectedList.reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const totalReceived = selectedList.reduce((sum, c) => sum + Number(c.amountReceived || 0), 0);
  const totalPending = selectedList.reduce((sum, c) => sum + Number(c.amountPending || (c.amount - (c.amountReceived || 0))), 0);

  const handleToggleCleaning = (id) => {
    if (selectedCleaningIds.includes(id)) {
      setSelectedCleaningIds(selectedCleaningIds.filter(x => x !== id));
    } else {
      setSelectedCleaningIds([...selectedCleaningIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedCleaningIds.length === monthCleanings.length) {
      setSelectedCleaningIds([]);
    } else {
      setSelectedCleaningIds(monthCleanings.map(c => c.id));
    }
  };

  const handleDownload = () => {
    if (selectedList.length === 0) {
      alert('Kripya kam se kam 1 store visit select karein.');
      return;
    }
    try {
      localStorage.setItem('vendor_invoice_profile', JSON.stringify(vendorProfile));
    } catch (e) {
      console.warn('Profile save notice', e);
    }
    generateConsolidatedInvoicePDF(selectedList, vendorProfile, invoiceMeta);
  };

  return (
    <div 
      className="fixed inset-0 z-100 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Monthly Consolidated Master Tax Invoice
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate a single combined bill for all Blinkit Dark Stores in a month
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
          
          {/* Month Selector & Filter */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blinkit-green" />
              <span className="font-bold text-slate-900 dark:text-white">Select Billing Month:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  const [y, m] = e.target.value.split('-');
                  const d = new Date(Number(y), Number(m) - 1, 1);
                  setInvoiceMeta(prev => ({
                    ...prev,
                    monthLabel: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) + ' Deep Cleaning Cycle'
                  }));
                }}
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                {selectedCleaningIds.length === monthCleanings.length ? 'Deselect All' : 'Select All Stores'}
              </button>
            </div>
          </div>

          {/* Selected Stores Summary Cards */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="text-[11px] font-semibold text-slate-500">Stores Billed</div>
              <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                {selectedList.length} Stores
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">Total Bill Amount</div>
              <div className="text-base font-extrabold text-emerald-800 dark:text-emerald-200 mt-0.5">
                ₹{totalBilled.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
              <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">Pending Balance</div>
              <div className="text-base font-extrabold text-amber-800 dark:text-amber-200 mt-0.5">
                ₹{totalPending.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Stores Checklist */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Stores Included in this Consolidated Bill ({monthCleanings.length} Visits in {selectedMonth}):
            </span>

            {monthCleanings.length > 0 ? (
              <div className="max-h-44 overflow-y-auto space-y-1.5 p-2 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750">
                {monthCleanings.map(c => {
                  const isSelected = selectedCleaningIds.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition text-xs ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-slate-900 dark:text-white'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-60 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleCleaning(c.id)}
                          className="rounded text-blinkit-green focus:ring-blinkit-green"
                        />
                        <span className="font-bold">{c.storeCode}</span>
                        <span className="truncate">- {c.storeName} ({c.city})</span>
                      </div>
                      <div className="text-right font-extrabold text-slate-800 dark:text-slate-200 shrink-0 ml-2">
                        ₹{Number(c.amount || 0).toLocaleString('en-IN')}
                      </div>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-400 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                Is month ({selectedMonth}) me koi store cleaning visit record nahi mila.
              </div>
            )}
          </div>

          {/* Invoice Meta Customization */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                value={invoiceMeta.invoiceNumber}
                onChange={(e) => setInvoiceMeta({ ...invoiceMeta, invoiceNumber: e.target.value })}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Billing Cycle Label
              </label>
              <input
                type="text"
                value={invoiceMeta.monthLabel}
                onChange={(e) => setInvoiceMeta({ ...invoiceMeta, monthLabel: e.target.value })}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            SAC: <strong>998533</strong> &bull; {selectedList.length} Stores Billed
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleDownload}
              disabled={selectedList.length === 0}
              className="px-5 py-2 rounded-xl bg-blinkit-green hover:bg-blinkit-darkgreen text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Download Consolidated Bill (PDF)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
