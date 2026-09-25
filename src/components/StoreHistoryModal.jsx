import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  Calendar, 
  Clock, 
  Users, 
  IndianRupee, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Share2, 
  MapPin, 
  Phone, 
  ExternalLink,
  MessageSquare,
  Sparkles,
  ChevronRight,
  ZoomIn,
  Receipt
} from 'lucide-react';
import { generateCleaningPDF } from '../utils/pdfGenerator';
import { formatPaymentReminderWhatsApp, shareStoreLocationWhatsApp } from '../utils/whatsappFormatter';

export default function StoreHistoryModal({
  isOpen,
  onClose,
  store,
  cleanings = [],
  onOpenPhotos,
  onUpdatePayment,
  onShareWhatsApp,
  onGenerateInvoice
}) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  if (!isOpen || !store) return null;


  // Filter cleanings specifically for this store
  const storeCleanings = cleanings
    .filter(c => c.storeCode === store.storeCode || c.storeName === store.storeName)
    .sort((a, b) => new Date(b.cleaningDate) - new Date(a.cleaningDate));

  const totalVisits = storeCleanings.length;
  const totalBilled = storeCleanings.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const totalReceived = storeCleanings.reduce((sum, c) => sum + (Number(c.amountReceived) || 0), 0);
  const totalPending = storeCleanings.reduce((sum, c) => sum + (Number(c.amountPending) || 0), 0);

  return (
    <div 
      className="fixed inset-0 z-100 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-amber-500/10 via-emerald-500/5 to-slate-50 dark:from-slate-850 dark:to-slate-850 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 shadow-xs">
                {store.storeCode}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {store.city || 'Hub'}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Store History & Cleaning Ledger
              </span>
            </div>
            
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1.5">
              {store.storeName}
            </h2>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="line-clamp-1">{store.address || 'Address not specified'}</span>
                {store.googleMapsUrl && (
                  <a
                    href={store.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline font-semibold inline-flex items-center gap-0.5 ml-1"
                  >
                    <span>Maps</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => shareStoreLocationWhatsApp(store)}
                  title="Share Store GMap Location on WhatsApp"
                  className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold inline-flex items-center gap-1 transition ml-1"
                >
                  <Share2 className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                  <span>GMap WA</span>
                </button>
              </div>

              {store.managerPhone && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Manager:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{store.managerName}</span>
                  <a
                    href={`tel:${store.managerPhone}`}
                    className="text-emerald-600 hover:underline inline-flex items-center gap-0.5 font-bold"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Call</span>
                  </a>
                  <a
                    href={`https://wa.me/${store.managerPhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:underline inline-flex items-center gap-0.5 font-bold"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Store Cumulative Financial Summary Bar */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-850/80 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Visits Logged</div>
            <div className="text-base font-black text-slate-900 dark:text-white">
              {totalVisits} Cleanings
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Billed</div>
            <div className="text-base font-black text-slate-900 dark:text-white">
              ₹{totalBilled.toLocaleString('en-IN')}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Total Received</div>
            <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
              ₹{totalReceived.toLocaleString('en-IN')}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">Pending Balance</div>
            <div className="text-base font-black text-rose-600 dark:text-rose-400">
              ₹{totalPending.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* History Timeline Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blinkit-green" />
              <span>Deep Cleaning Timeline & History Logs</span>
            </h3>
            <span className="text-xs text-slate-400 font-semibold">
              {storeCleanings.length} {storeCleanings.length === 1 ? 'record' : 'records'} found
            </span>
          </div>

          {storeCleanings.length > 0 ? (
            <div className="space-y-4">
              {storeCleanings.map((c, idx) => (
                <div
                  key={c.id || idx}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 shadow-xs space-y-3.5 hover:border-blinkit-green/50 transition"
                >
                  
                  {/* Top Row: Date, Timings, Status, Payment Pill */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/50 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-black flex items-center justify-center text-xs">
                        #{storeCleanings.length - idx}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{c.cleaningDate}</span>
                          <span className="text-xs font-normal text-slate-400">({c.shift || 'Night Shift'})</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-indigo-500" />
                          <span>{c.startTime || '--'} to {c.endTime || '--'} ({c.durationHours || 0} Hours)</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Work Status */}
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        c.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                      }`}>
                        {c.status}
                      </span>

                      {/* Payment Status Pill */}
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                        c.paymentStatus === 'Received'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : c.paymentStatus === 'Partial'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}>
                        {c.paymentStatus === 'Received' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        ₹{Number(c.amount || 0).toLocaleString('en-IN')} ({c.paymentStatus})
                      </span>
                    </div>
                  </div>

                  {/* Scope of Work Executed */}
                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase">
                      Scope of Work Executed:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(c.scopeOfWork || [
                        'Floor Deep Cleaning',
                        'Toilet / Washroom Cleaning',
                        'Cold Storage Area Cleaning',
                        'Wall Dry & Rust Removal'
                      ]).map((scope, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
                        >
                          ✔ {scope}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Team & Staff Sent */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850/60 text-xs text-slate-700 dark:text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white">Supervisor:</span> {c.supervisorName || 'N/A'} {c.supervisorPhone ? `(${c.supervisorPhone})` : ''}
                      </div>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 line-clamp-1">
                      <span className="font-semibold">Team Deployed:</span> {c.teamMembers || 'N/A'} ({c.headcount || 1} people)
                    </div>
                  </div>

                  {/* Photos Proofs Row */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <Camera className="w-3.5 h-3.5 text-amber-500" /> Photo Proofs ({c.photos?.length || 0}):
                      </span>
                      <button
                        onClick={() => onOpenPhotos(c)}
                        className="text-xs text-blinkit-green hover:underline font-bold"
                      >
                        {c.photos?.length > 0 ? 'Open Photo Gallery' : '+ Attach Photos'}
                      </button>
                    </div>

                    {c.photos && c.photos.length > 0 ? (
                      <div className="flex items-center gap-2 overflow-x-auto py-1">
                        {c.photos.map((photo, pIdx) => (
                          <div
                            key={pIdx}
                            onClick={() => setSelectedPhoto(photo)}
                            className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 cursor-pointer group"
                          >
                            <img src={photo.url} alt={photo.title} className="w-full h-full object-cover group-hover:scale-110 transition" />
                            <span className={`absolute bottom-0 inset-x-0 text-[7px] font-bold text-center py-0.2 uppercase text-white ${
                              photo.type === 'before' ? 'bg-rose-600/90' : photo.type === 'after' ? 'bg-emerald-600/90' : 'bg-blue-600/90'
                            }`}>
                              {photo.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-slate-400 text-xs italic">
                        No photos attached for this visit.
                      </div>
                    )}
                  </div>

                  {/* Remarks & Quick Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/50 text-xs">
                    <div className="text-slate-500 italic max-w-md line-clamp-1">
                      {c.remarks ? `"${c.remarks}"` : 'No remarks noted.'}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => onUpdatePayment(c)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 transition"
                      >
                        Payment Info
                      </button>
                      {onGenerateInvoice && (
                        <button
                          onClick={() => onGenerateInvoice(c)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-300/50 dark:border-amber-800/60 transition flex items-center gap-1"
                        >
                          <Receipt className="w-3 h-3 text-amber-600" />
                          <span>Invoice</span>
                        </button>
                      )}
                      <button
                        onClick={() => generateCleaningPDF(c)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 transition flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3 text-rose-500" />
                        <span>PDF</span>
                      </button>
                      <button
                        onClick={() => onShareWhatsApp(c)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-green-50 hover:bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-900 transition flex items-center gap-1"
                      >
                        <Share2 className="w-3 h-3 text-green-600" />
                        <span>WhatsApp</span>
                      </button>
                      {c.paymentStatus !== 'Received' && (c.managerPhone || store.managerPhone) && (
                        <button
                          onClick={() => {
                            const phone = c.managerPhone || store.managerPhone;
                            const cleanPhone = phone.replace(/[^0-9]/g, '');
                            const msg = formatPaymentReminderWhatsApp(c);
                            window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300/50 dark:border-rose-800/60 transition flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3 text-rose-500" />
                          <span>Remind Pay</span>
                        </button>
                      )}
                    </div>

                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center bg-slate-50 dark:bg-slate-850 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-6">
              <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
                No cleaning visits logged yet for {store.storeName}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Click "New Deep Cleaning Entry" and select this store to record the first visit.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition"
          >
            Close History
          </button>
        </div>

        {/* Single Photo Zoom Lightbox */}
        {selectedPhoto && (
          <div 
            className="fixed inset-0 z-110 bg-black/90 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedPhoto(null);
            }}
          >
            <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.title}
                className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl"
              />
              <div className="mt-3 text-center text-white text-sm">
                <span className={`px-2 py-0.5 rounded font-bold text-xs uppercase mr-2 ${
                  selectedPhoto.type === 'before' ? 'bg-rose-600' : selectedPhoto.type === 'after' ? 'bg-emerald-600' : 'bg-blue-600'
                }`}>
                  {selectedPhoto.type}
                </span>
                <span className="font-semibold">{selectedPhoto.title}</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
