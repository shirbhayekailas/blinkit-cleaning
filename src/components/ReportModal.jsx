import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Download, 
  Share2, 
  Copy, 
  Check, 
  Printer, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { generateCleaningPDF } from '../utils/pdfGenerator';
import { formatWhatsAppMessage } from '../utils/whatsappFormatter';

export default function ReportModal({
  isOpen,
  onClose,
  cleaning
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !cleaning) return null;

  const whatsappMessage = formatWhatsAppMessage(cleaning);

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(whatsappMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsAppWeb = () => {
    const encoded = encodeURIComponent(whatsappMessage);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div 
      className="fixed inset-0 z-100 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Generate Store Deep Cleaning Report
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {cleaning.storeCode} - {cleaning.storeName} ({cleaning.cleaningDate})
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
        <div className="p-6 space-y-5 text-xs sm:text-sm">
          
          {/* Action 1: Download PDF Report */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-850/60 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-500" />
                <span>PDF Work Completion & Audit Certificate</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official PDF with Blinkit branding, timings, team deployed, checklist, payment details, and embedded photo proofs.
              </p>
            </div>
            <button
              onClick={() => generateCleaningPDF(cleaning)}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 shrink-0 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          </div>

          {/* Action 2: WhatsApp Formatted Summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-green-600" />
                <span>Blinkit Operations WhatsApp Summary</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyWhatsApp}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                </button>
                <button
                  onClick={handleOpenWhatsAppWeb}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-green-600 hover:bg-green-700 text-white transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Send on WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Preview Box */}
            <div className="p-3.5 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-xs whitespace-pre-wrap max-h-56 overflow-y-auto border border-slate-800 shadow-inner">
              {whatsappMessage}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
