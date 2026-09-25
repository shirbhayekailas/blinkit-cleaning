import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Camera, 
  Share2, 
  Building2, 
  Calendar,
  MessageSquare,
  Clock
} from 'lucide-react';
import { db } from '../db/db';

export default function IssueReportModal({
  isOpen,
  onClose,
  issues = [],
  stores = []
}) {
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'Open' | 'Resolved'
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  if (!isOpen) return null;

  const filteredIssues = issues.filter(iss => 
    statusFilter === 'all' || iss.status === statusFilter
  );

  const handleToggleStatus = async (issue) => {
    try {
      const newStatus = issue.status === 'Resolved' ? 'Open' : 'Resolved';
      await db.storeIssues.update(issue.id, {
        status: newStatus,
        resolvedAt: newStatus === 'Resolved' ? new Date() : null
      });
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const handleShareWhatsApp = (iss) => {
    const store = stores.find(s => s.storeCode === iss.storeCode) || {};
    const text = `*🚨 BLINKIT DARK STORE MAINTENANCE ISSUE REPORT 🚨*
---------------------------------------
🏬 *Store Code:* ${iss.storeCode}
🏪 *Store Name:* ${iss.storeName || store.storeName || 'Blinkit Dark Store'}
📍 *Address:* ${store.address || 'N/A'}
👤 *Store Manager:* ${store.managerName || 'N/A'} (${store.managerPhone || 'N/A'})

⚠️ *Issue Category:* ${iss.issueType}
📝 *Description:* ${iss.description || 'Observed during deep cleaning shift.'}
📅 *Reported On:* ${iss.reportedAt ? new Date(iss.reportedAt).toLocaleString('en-IN') : new Date().toLocaleDateString('en-IN')}
📌 *Current Status:* ${iss.status.toUpperCase()}

_Reported by Deep Cleaning Vendor Team for Immediate Maintenance Action._`;

    const phone = store.managerPhone ? store.managerPhone.replace(/[^0-9]/g, '') : '';
    const url = phone 
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div 
      className="fixed inset-0 z-100 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 font-black flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Store Maintenance &amp; Defect Reports
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Drain blockages, freezer gaskets, and infrastructural defects found during cleaning
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

        {/* Filter Bar */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-2">
            {['all', 'Open', 'Resolved'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                  statusFilter === st
                    ? st === 'Open'
                      ? 'bg-rose-600 text-white'
                      : st === 'Resolved'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {st === 'all' ? 'All Issues' : st}
              </button>
            ))}
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {filteredIssues.length} issues recorded
          </span>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {filteredIssues.length > 0 ? (
            filteredIssues.map((iss) => (
              <div
                key={iss.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 flex flex-col sm:flex-row gap-4 justify-between"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950">
                      {iss.storeCode}
                    </span>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {iss.storeName}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      iss.status === 'Resolved'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                    }`}>
                      {iss.status}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{iss.issueType}</span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {iss.description}
                  </p>

                  <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-1">
                    <Clock className="w-3 h-3" />
                    <span>Reported: {iss.reportedAt ? new Date(iss.reportedAt).toLocaleString('en-IN') : 'Recently'}</span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                  {iss.photoUrl ? (
                    <div
                      onClick={() => setSelectedPhoto(iss.photoUrl)}
                      className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer hover:scale-105 transition shrink-0"
                    >
                      <img src={iss.photoUrl} alt="Defect" className="w-full h-full object-cover" />
                    </div>
                  ) : null}

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(iss)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                        iss.status === 'Resolved'
                          ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{iss.status === 'Resolved' ? 'Re-open' : 'Mark Fixed'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShareWhatsApp(iss)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-900 transition flex items-center gap-1"
                      title="Alert Blinkit Maintenance via WhatsApp"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Alert WA</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No store maintenance defects recorded!
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                When supervisors flag issues (drainage, chiller gasket, broken tiles), they will appear here.
              </p>
            </div>
          )}
        </div>

        {/* Photo Lightbox */}
        {selectedPhoto && (
          <div 
            className="fixed inset-0 z-110 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedPhoto(null);
            }}
          >
            <div className="relative max-w-2xl max-h-[85vh]">
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
              <img src={selectedPhoto} alt="Issue full size" className="max-w-full max-h-[80vh] rounded-2xl object-contain" />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
