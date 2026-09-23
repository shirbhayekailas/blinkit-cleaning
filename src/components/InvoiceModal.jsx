import React, { useState, useEffect } from 'react';
import { X, Receipt, Download, Building2, CreditCard, Save } from 'lucide-react';
import { generateVendorInvoicePDF } from '../utils/invoiceGenerator';

export default function InvoiceModal({
  isOpen,
  onClose,
  cleaning
}) {
  const [vendorProfile, setVendorProfile] = useState({
    companyName: 'My Deep Cleaning Services',
    phone: '+91 98765 43210',
    email: 'billing@mycleaningservices.com',
    address: 'Industrial Area, Phase 2, New Delhi',
    gstin: '07AAAAA0000A1Z5',
    bankName: 'HDFC Bank',
    accountNumber: '50200012345678',
    ifsc: 'HDFC0001234',
    upiId: 'cleanpro@hdfcbank',
    itemDescription: ''
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('vendor_invoice_profile');
      const defaultDesc = cleaning ? `Deep Cleaning - ${cleaning.storeName} (${cleaning.storeCode})` : 'Deep Cleaning';
      if (saved) {
        const parsed = JSON.parse(saved);
        setVendorProfile({
          ...parsed,
          itemDescription: defaultDesc
        });
      } else {
        setVendorProfile(prev => ({
          ...prev,
          companyName: cleaning?.teamVendor || prev.companyName,
          itemDescription: defaultDesc
        }));
      }
    } catch (e) {
      console.warn('Profile read notice', e);
    }
  }, [cleaning, isOpen]);

  if (!isOpen || !cleaning) return null;

  const handleSaveProfile = () => {
    try {
      localStorage.setItem('vendor_invoice_profile', JSON.stringify(vendorProfile));
      alert('Vendor Invoice profile saved!');
    } catch (e) {
      console.warn('Profile save notice', e);
    }
  };

  const handleDownload = () => {
    handleSaveProfile();
    generateVendorInvoicePDF(cleaning, vendorProfile);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Generate Vendor Tax Invoice / Bill
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {cleaning.storeCode} - {cleaning.storeName} (₹{Number(cleaning.amount || 0).toLocaleString('en-IN')})
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

        {/* Content Form */}
        <div className="p-6 space-y-4 text-xs sm:text-sm max-h-[75vh] overflow-y-auto">
          
          <div className="space-y-3">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
              <Building2 className="w-4 h-4 text-blinkit-green" />
              <span>Aapka Business / Vendor Details</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Aapki Agency / Company Ka Naam *
                </label>
                <input
                  type="text"
                  value={vendorProfile.companyName}
                  onChange={(e) => setVendorProfile({ ...vendorProfile, companyName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={vendorProfile.phone}
                  onChange={(e) => setVendorProfile({ ...vendorProfile, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  GSTIN / PAN No.
                </label>
                <input
                  type="text"
                  value={vendorProfile.gstin}
                  onChange={(e) => setVendorProfile({ ...vendorProfile, gstin: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Office / Business Address
                </label>
                <input
                  type="text"
                  value={vendorProfile.address}
                  onChange={(e) => setVendorProfile({ ...vendorProfile, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Invoice Line Item (Only 1 item line: Deep Cleaning - Store Name) */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-amber-600" />
                <span>Invoice Line Item (Only 1 Single Item Line):</span>
              </span>
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                1 Job &bull; ₹{Number(cleaning.amount || 0).toLocaleString('en-IN')}
              </span>
            </div>

            <div>
              <input
                type="text"
                value={vendorProfile.itemDescription}
                onChange={(e) => setVendorProfile({ ...vendorProfile, itemDescription: e.target.value })}
                placeholder={`Deep Cleaning - ${cleaning.storeName} (${cleaning.storeCode})`}
                className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-blinkit-green"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Invoice par alag-alag breakdown ke badle sirf yahi ek line aayegi (SAC 998533).
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
              <CreditCard className="w-4 h-4 text-indigo-500" />
              <span>Payment &amp; Bank Transfer Details (Invoice par aayenge)</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank"
                  value={vendorProfile.bankName}
                  onChange={(e) => setVendorProfile({ ...vendorProfile, bankName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 50200012345678"
                  value={vendorProfile.accountNumber}
                  onChange={(e) => setVendorProfile({ ...vendorProfile, accountNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  IFSC Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. HDFC0001234"
                  value={vendorProfile.ifsc}
                  onChange={(e) => setVendorProfile({ ...vendorProfile, ifsc: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  UPI ID (GPay / PhonePe / Paytm)
                </label>
                <input
                  type="text"
                  placeholder="e.g. cleanpro@hdfcbank"
                  value={vendorProfile.upiId}
                  onChange={(e) => setVendorProfile({ ...vendorProfile, upiId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
          <button
            type="button"
            onClick={handleSaveProfile}
            className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 flex items-center gap-1"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Profile</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleDownload}
              className="px-5 py-2 rounded-xl bg-blinkit-green hover:bg-blinkit-darkgreen text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Download Tax Invoice (PDF)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
