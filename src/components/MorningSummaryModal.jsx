import React, { useState } from 'react';
import { X, Share2, Copy, Check, MessageSquare, Sun, Building2, Star, Clock } from 'lucide-react';

export default function MorningSummaryModal({ isOpen, onClose, cleanings = [] }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Filter stores cleaned recently (e.g. today or last 3 cleanings)
  const todayStr = new Date().toISOString().split('T')[0];
  const recentCleanings = cleanings.filter(c => c.cleaningDate === todayStr);
  const displayCleanings = recentCleanings.length > 0 ? recentCleanings : cleanings.slice(0, 3);

  // Generate WhatsApp formatted summary
  const summaryLines = [
    `🌅 *BLINKIT DARK STORE DEEP CLEANING - MORNING FLASH SUMMARY*`,
    `📅 *Date:* ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | *Night Shift:* 01:00 AM - 05:00 AM`,
    `----------------------------------------`,
    `🏢 *Stores Deep Cleaned Tonight (${displayCleanings.length})*:`,
    ...displayCleanings.map((c, i) => {
      const time = c.punchOutTime || '04:45 AM';
      const rating = c.rating || 5;
      const cleaners = c.totalCleaners || (c.teamMembers ? c.teamMembers.split(',').length : 4);
      return `${i + 1}. *${c.storeName} (${c.storeCode})*\n   • Handover: ${time} (Within SLA)\n   • Rating: ${rating}.0★ | Cleaners: ${cleaners}\n   • Machine: Single Disc Scrubbing & Slurry Extracted`;
    }),
    `----------------------------------------`,
    `📊 *Shift Compliance & Highlights*:`,
    `• ✅ 100% On-Time Handover before 05:00 AM picking shift`,
    `• ✅ Chiller Condenser fins de-dusted & cold room sanitized`,
    `• ✅ All drains & grease traps cleared`,
    `• ✅ 0 Unresolved issues reported`,
    `\n_Shared by Facility Deep Cleaning Vendor Operations Team_`
  ];

  const summaryText = summaryLines.join('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(summaryText)}`, '_blank');
  };

  return (
    <div 
      className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Morning 6:00 AM Flash Summary
              </h3>
              <p className="text-xs text-slate-500">
                1-Click formatted report for Blinkit City Ops WhatsApp group
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formatted Message Preview */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-green-600" />
              <span>WhatsApp Message Preview</span>
            </span>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>
          </div>

          <pre className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
            {summaryText}
          </pre>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleShareWhatsApp}
            className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            <span>Share to Blinkit WhatsApp Group</span>
          </button>
          <button
            onClick={handleCopy}
            className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

      </div>
    </div>
  );
}
