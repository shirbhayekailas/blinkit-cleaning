import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  X, 
  Building2, 
  Receipt, 
  Save, 
  RotateCcw, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  Landmark, 
  ShieldCheck, 
  FileText,
  User,
  CheckCircle2,
  Sparkles,
  Sliders,
  Upload,
  Download,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';
import { getBillSettings, saveBillSettings, DEFAULT_BILL_SETTINGS } from '../utils/billSettingsHelper';
import { DEFAULT_SK_LOGO } from '../utils/defaultLogo';
import { toast } from './Toast';

export default function BillSettingsModal({ isOpen, onClose }) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('billedBy'); // 'billedBy' | 'billedTo' | 'preview'
  const [settings, setSettings] = useState(DEFAULT_BILL_SETTINGS);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(getBillSettings());
      setSaveSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBilledByChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      billedBy: {
        ...prev.billedBy,
        [field]: value
      }
    }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.warning('Kripya valid image file (PNG, JPG, SVG, WebP) select karein.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 400;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.88);
        handleBilledByChange('logoUrl', compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadLogo = () => {
    const link = document.createElement('a');
    link.href = settings.billedBy.logoUrl || '/sk_enterprises_logo.jpg';
    link.download = 'SK_Enterprises_Official_Logo.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBilledToChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      billedTo: {
        ...prev.billedTo,
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    const success = saveBillSettings(settings);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 900);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Kya aap sachme bill settings ko default standard par reset karna chahte hain?')) {
      setSettings(JSON.parse(JSON.stringify(DEFAULT_BILL_SETTINGS)));
    }
  };

  return (
    <div 
      className="fixed inset-0 z-100 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400 flex items-center justify-center font-black">
              <Sliders className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>{t('bill_settings_title', 'Bill & Tax Invoice Settings')}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  GST Ready
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('bill_settings_desc', 'Edit details for both "Billed By" (Your Company) and "Bill To" (Client Company)')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Segmented Control */}
        <div className="p-3 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="grid grid-cols-3 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('billedBy')}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'billedBy'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-amber-500" />
              <span className="truncate">{t('tab_billed_by', '1. Billed By (Vendor)')}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('billedTo')}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'billedTo'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-blinkit-green" />
              <span className="truncate">{t('tab_billed_to', '2. Bill To (Client)')}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              <span className="truncate">{t('tab_bill_preview', '3. Live Preview')}</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">

          {/* ============================================================== */}
          {/* TAB 1: BILLED BY (VENDOR COMPANY) */}
          {/* ============================================================== */}
          {activeTab === 'billedBy' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800 rounded-2xl flex items-start gap-2.5">
                <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                  <strong>Aapki Company Details:</strong> Ye details har Tax Invoice ke letterhead header, GST section aur payment bank details me print hongi.
                </p>
              </div>

              {/* Official Company Logo Upload / Customization Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Company Brand Logo (Print on Invoices &amp; Certificates)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadLogo}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl transition cursor-pointer"
                    title="Download Official Logo File"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Logo File</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Logo Preview */}
                  <div className="relative w-20 h-20 rounded-2xl bg-slate-900 border-2 border-amber-500/40 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                    {settings.billedBy.logoUrl ? (
                      <img 
                        src={settings.billedBy.logoUrl} 
                        alt="Company Logo" 
                        className="w-full h-full object-contain rounded-xl"
                      />
                    ) : (
                      <div className="text-amber-400 font-black text-lg">SK</div>
                    )}
                  </div>

                  {/* Actions & Description */}
                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Ye logo aapke har Single Store Tax Invoice, Monthly Consolidated Invoice aur Hygiene Certificates ke letterhead par print hoga.
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition active:scale-95">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Custom Logo</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleLogoUpload} 
                          className="hidden" 
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => handleBilledByChange('logoUrl', DEFAULT_SK_LOGO)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Use SK Enterprises Logo</span>
                      </button>

                      {settings.billedBy.logoUrl && (
                        <button
                          type="button"
                          onClick={() => handleBilledByChange('logoUrl', '')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Company Name */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <span>Company / Business Name *</span>
                  </label>
                  <input
                    type="text"
                    value={settings.billedBy.companyName || ''}
                    onChange={(e) => handleBilledByChange('companyName', e.target.value)}
                    placeholder="e.g. SK ENTERPRISES"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                {/* Tagline / Subtitle */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Business Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={settings.billedBy.tagline || ''}
                    onChange={(e) => handleBilledByChange('tagline', e.target.value)}
                    placeholder="e.g. FACILITY MANAGEMENT & INDUSTRIAL DEEP CLEANING SOLUTIONS"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                {/* GSTIN */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Vendor GSTIN Number</span>
                  </label>
                  <input
                    type="text"
                    value={settings.billedBy.gstin || ''}
                    onChange={(e) => handleBilledByChange('gstin', e.target.value.toUpperCase())}
                    placeholder="e.g. 27OQCPS0083R1ZU"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono"
                  />
                </div>

                {/* PAN Number */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Vendor PAN Number
                  </label>
                  <input
                    type="text"
                    value={settings.billedBy.pan || ''}
                    onChange={(e) => handleBilledByChange('pan', e.target.value.toUpperCase())}
                    placeholder="e.g. OQCPS0083R"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono"
                  />
                </div>

                {/* State & State Code */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    State & Code
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={settings.billedBy.state || ''}
                      onChange={(e) => handleBilledByChange('state', e.target.value)}
                      placeholder="e.g. Maharashtra"
                      className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                    <input
                      type="text"
                      value={settings.billedBy.stateCode || ''}
                      onChange={(e) => handleBilledByChange('stateCode', e.target.value)}
                      placeholder="27"
                      className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-center text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-blue-500" />
                    <span>Contact Phone Number</span>
                  </label>
                  <input
                    type="text"
                    value={settings.billedBy.phone || ''}
                    onChange={(e) => handleBilledByChange('phone', e.target.value)}
                    placeholder="e.g. 09594023629"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-purple-500" />
                    <span>Billing Contact Email</span>
                  </label>
                  <input
                    type="email"
                    value={settings.billedBy.email || ''}
                    onChange={(e) => handleBilledByChange('email', e.target.value)}
                    placeholder="e.g. skenterprises.clean@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                {/* Registered Address */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>Registered Office / Business Address</span>
                  </label>
                  <textarea
                    rows={2}
                    value={settings.billedBy.address || ''}
                    onChange={(e) => handleBilledByChange('address', e.target.value)}
                    placeholder="e.g. 303, Panchsheel Chs Ltd., Plot No. 07, Sector -2, Taloja Phase -01, Navi Mumbai - 410208"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-hidden resize-none"
                  />
                </div>
              </div>

              {/* Bank Details Sub-Card */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Payment Bank & NEFT / RTGS Details
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Bank Name</label>
                    <input
                      type="text"
                      value={settings.billedBy.bankName || ''}
                      onChange={(e) => handleBilledByChange('bankName', e.target.value)}
                      placeholder="e.g. HDFC Bank"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Account Number</label>
                    <input
                      type="text"
                      value={settings.billedBy.accountNumber || ''}
                      onChange={(e) => handleBilledByChange('accountNumber', e.target.value)}
                      placeholder="e.g. 50200012345678"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold font-mono text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">IFSC Code</label>
                    <input
                      type="text"
                      value={settings.billedBy.ifsc || ''}
                      onChange={(e) => handleBilledByChange('ifsc', e.target.value.toUpperCase())}
                      placeholder="e.g. HDFC0001234"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold font-mono uppercase text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Account Beneficiary Name</label>
                    <input
                      type="text"
                      value={settings.billedBy.accountHolder || ''}
                      onChange={(e) => handleBilledByChange('accountHolder', e.target.value)}
                      placeholder="e.g. SK ENTERPRISES"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">UPI ID / QR VPA</label>
                    <input
                      type="text"
                      value={settings.billedBy.upiId || ''}
                      onChange={(e) => handleBilledByChange('upiId', e.target.value)}
                      placeholder="e.g. cleanpro@hdfcbank"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Signatory Title</label>
                    <input
                      type="text"
                      value={settings.billedBy.signatory || ''}
                      onChange={(e) => handleBilledByChange('signatory', e.target.value)}
                      placeholder="e.g. Authorized Signatory / Proprietor"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: BILLED TO (CLIENT COMPANY) */}
          {/* ============================================================== */}
          {activeTab === 'billedTo' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800 rounded-2xl flex items-start gap-2.5">
                <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                  <strong>Client Company Details:</strong> Ye details invoice ke "BILLED TO (CLIENT)" box me aayegi. Yahan aap Blinkit ya kisi bhi client company ka naam, GSTIN aur corporate address change kar sakte hain.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Client Company Name */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Client Company Name *
                  </label>
                  <input
                    type="text"
                    value={settings.billedTo.companyName || ''}
                    onChange={(e) => handleBilledToChange('companyName', e.target.value)}
                    placeholder="e.g. Blinkit Commerce Private Limited"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green focus:outline-hidden"
                  />
                </div>

                {/* Division / Department */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Division / Operations Header
                  </label>
                  <input
                    type="text"
                    value={settings.billedTo.division || ''}
                    onChange={(e) => handleBilledToChange('division', e.target.value)}
                    placeholder="e.g. Corporate Office & Dark Store Operations Division"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blinkit-green focus:outline-hidden"
                  />
                </div>

                {/* Client GSTIN */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Client GSTIN Number</span>
                  </label>
                  <input
                    type="text"
                    value={settings.billedTo.gstin || ''}
                    onChange={(e) => handleBilledToChange('gstin', e.target.value.toUpperCase())}
                    placeholder="e.g. 07AAGCB2224A1ZL"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green focus:outline-hidden font-mono"
                  />
                </div>

                {/* Client PAN */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Client PAN Number
                  </label>
                  <input
                    type="text"
                    value={settings.billedTo.pan || ''}
                    onChange={(e) => handleBilledToChange('pan', e.target.value.toUpperCase())}
                    placeholder="e.g. AAGCB2224A"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green focus:outline-hidden font-mono"
                  />
                </div>

                {/* Client State & State Code */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Client State & Code
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={settings.billedTo.state || ''}
                      onChange={(e) => handleBilledToChange('state', e.target.value)}
                      placeholder="e.g. Haryana"
                      className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green focus:outline-hidden"
                    />
                    <input
                      type="text"
                      value={settings.billedTo.stateCode || ''}
                      onChange={(e) => handleBilledToChange('stateCode', e.target.value)}
                      placeholder="06"
                      className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-center text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Client Contact Person */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Contact Person / Ops Lead</span>
                  </label>
                  <input
                    type="text"
                    value={settings.billedTo.contactPerson || ''}
                    onChange={(e) => handleBilledToChange('contactPerson', e.target.value)}
                    placeholder="e.g. City Operations & Quality Head"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green focus:outline-hidden"
                  />
                </div>

                {/* Client Email */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-purple-500" />
                    <span>Client Invoice Email</span>
                  </label>
                  <input
                    type="email"
                    value={settings.billedTo.email || ''}
                    onChange={(e) => handleBilledToChange('email', e.target.value)}
                    placeholder="e.g. billing.darkstore@blinkit.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green focus:outline-hidden"
                  />
                </div>

                {/* Client Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-blue-500" />
                    <span>Client Phone / Hotline</span>
                  </label>
                  <input
                    type="text"
                    value={settings.billedTo.phone || ''}
                    onChange={(e) => handleBilledToChange('phone', e.target.value)}
                    placeholder="e.g. 1800-208-8888"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green focus:outline-hidden"
                  />
                </div>

                {/* Registered Corporate Address */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>Client Corporate Address</span>
                  </label>
                  <textarea
                    rows={2}
                    value={settings.billedTo.address || ''}
                    onChange={(e) => handleBilledToChange('address', e.target.value)}
                    placeholder="e.g. Ground Floor, Pioneer Square, Sector 62, Golf Course Ext Road, Gurugram, Haryana - 122098"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blinkit-green focus:outline-hidden resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: LIVE PREVIEW OF BILL */}
          {/* ============================================================== */}
          {activeTab === 'preview' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 bg-slate-900 text-white rounded-3xl shadow-lg border border-slate-800 space-y-3">
                {/* Header Banner Preview */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-slate-800 border-2 border-amber-400 flex items-center justify-center font-black text-amber-400 text-sm overflow-hidden shrink-0">
                      {settings.billedBy.logoUrl ? (
                        <img src={settings.billedBy.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        'SK'
                      )}
                    </div>
                    <div>
                      <div className="text-base font-extrabold text-amber-400 leading-tight">
                        {settings.billedBy.companyName || 'SK ENTERPRISES'}
                      </div>
                      <div className="text-[10px] text-slate-300 font-semibold">
                        {settings.billedBy.tagline || 'FACILITY MANAGEMENT SOLUTIONS'}
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      TAX INVOICE / BILL
                    </span>
                    <div className="text-[10px] text-slate-400">
                      GSTIN: {settings.billedBy.gstin || '27OQCPS0083R1ZU'}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-300">
                  <span className="text-slate-400">Address:</span> {settings.billedBy.address || '--'}
                </div>
                <div className="text-[11px] text-slate-300 flex flex-wrap gap-x-4 gap-y-1">
                  <span>📞 {settings.billedBy.phone || '--'}</span>
                  <span>✉️ {settings.billedBy.email || '--'}</span>
                  <span>State: {settings.billedBy.state || '--'} ({settings.billedBy.stateCode || '--'})</span>
                </div>

                {/* Split Two-Column Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
                  {/* Billed To Box */}
                  <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-amber-400">BILLED TO (CLIENT):</div>
                    <div className="font-extrabold text-white">{settings.billedTo.companyName}</div>
                    <div className="text-[11px] text-slate-300">{settings.billedTo.division}</div>
                    <div className="text-[11px] text-slate-400">{settings.billedTo.address}</div>
                    <div className="text-[10px] text-emerald-400 pt-1">
                      GSTIN: {settings.billedTo.gstin || 'N/A'} | State: {settings.billedTo.state || 'N/A'} ({settings.billedTo.stateCode || ''})
                    </div>
                  </div>

                  {/* Payment Info Box */}
                  <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-emerald-400">BANK / PAYMENT DETAILS:</div>
                    <div className="text-[11px] text-slate-200">
                      Bank: <strong>{settings.billedBy.bankName}</strong> | A/C: <strong>{settings.billedBy.accountNumber}</strong>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      IFSC: <span className="font-mono">{settings.billedBy.ifsc}</span> | Name: {settings.billedBy.accountHolder}
                    </div>
                    <div className="text-[11px] text-slate-300">
                      UPI ID: <span className="font-mono text-amber-300">{settings.billedBy.upiId}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 pt-1">
                      Signatory: {settings.billedBy.signatory}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Standard</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white transition shadow-md ${
                saveSuccess
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-blinkit-green hover:bg-blinkit-darkgreen active:scale-95'
              }`}
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Saved Successfully!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Bill Settings</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
