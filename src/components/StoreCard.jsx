import React from 'react';
import { 
  MapPin, 
  Phone, 
  ExternalLink, 
  Calendar, 
  Clock, 
  Users, 
  IndianRupee, 
  CheckCircle2, 
  AlertCircle, 
  Camera, 
  FileText, 
  Share2, 
  Edit3, 
  Trash2,
  CheckSquare,
  Star,
  MessageSquare,
  Receipt,
  Bell,
  Columns,
  Award,
  QrCode
} from 'lucide-react';
import { 
  formatPaymentReminderWhatsApp, 
  shareStoreLocationWhatsApp,
  sendStoreManagerRatingWhatsApp 
} from '../utils/whatsappFormatter';
import { generateHygieneCertificate } from '../utils/certificateGenerator';

export default function StoreCard({
  cleaning,
  onUpdatePayment,
  onOpenPhotos,
  onGeneratePDF,
  onShareWhatsApp,
  onGenerateInvoice,
  onOpenStoreQR,
  onEdit,
  onDelete
}) {
  const checklist = cleaning.checklist || {};
  const checklistTotal = 8;
  const checklistPassed = Object.values(checklist).filter(Boolean).length;

  const isPending = cleaning.paymentStatus === 'Pending';
  const isReceived = cleaning.paymentStatus === 'Received';
  const isPartial = cleaning.paymentStatus === 'Partial';

  // Calculate Next Cleaning Due Date
  const cycleDays = cleaning.nextCleaningCycleDays || 30;
  const cleaningDateObj = new Date(cleaning.cleaningDate || new Date());
  const dueDateObj = new Date(cleaningDateObj);
  dueDateObj.setDate(dueDateObj.getDate() + cycleDays);
  const dueDateStr = dueDateObj.toISOString().split('T')[0];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = dueDateObj - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isOverdue = diffDays < 0;
  const isDueSoon = diffDays >= 0 && diffDays <= 7;

  const handleRemindPayment = () => {
    if (!cleaning.managerPhone) {
      alert('Store Manager phone number not available to send WhatsApp reminder.');
      return;
    }
    const cleanPhone = cleaning.managerPhone.replace(/[^0-9]/g, '');
    const msg = formatPaymentReminderWhatsApp(cleaning);
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };


  return (
    <div className="bg-white dark:bg-slate-800/95 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between">
      
      {/* Top Banner / Store Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/60 bg-gradient-to-r from-slate-50/70 via-white to-amber-50/20 dark:from-slate-800 dark:via-slate-800/80 dark:to-amber-950/10">
        <div className="flex items-start justify-between gap-2">
          
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-extrabold px-2.5 py-0.5 rounded-lg bg-amber-400/20 text-amber-900 dark:text-amber-300 border border-amber-300/40">
                {cleaning.storeCode}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {cleaning.city || 'Hub'}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${
                cleaning.status === 'Completed'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : cleaning.status === 'In-Progress'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 animate-pulse'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  cleaning.status === 'Completed' ? 'bg-emerald-500' : cleaning.status === 'In-Progress' ? 'bg-blue-500' : 'bg-slate-400'
                }`} />
                {cleaning.status}
              </span>

              {/* Next Due Date & Overdue Badge */}
              {isOverdue ? (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300/60 inline-flex items-center gap-1 animate-pulse">
                  <AlertCircle className="w-3 h-3" />
                  <span>OVERDUE by {Math.abs(diffDays)}d</span>
                </span>
              ) : isDueSoon ? (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/60 inline-flex items-center gap-1">
                  <Bell className="w-3 h-3" />
                  <span>Due in {diffDays}d</span>
                </span>
              ) : (
                <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 inline-flex items-center gap-1">
                  <Calendar className="w-2.5 h-2.5" />
                  <span>Due: {dueDateStr}</span>
                </span>
              )}

              {/* GPS Verification Badge */}
              {cleaning.gpsCoords?.verified && (
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 inline-flex items-center gap-0.5"
                  title={`GPS Lat: ${cleaning.gpsCoords.latitude}, Lng: ${cleaning.gpsCoords.longitude}`}
                >
                  <span>📍 GPS Verified</span>
                </span>
              )}
            </div>
            <h3 className="mt-1.5 text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {cleaning.storeName}
            </h3>


          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onEdit(cleaning)}
              title="Edit Entry"
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(cleaning.id)}
              title="Delete Entry"
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Address & Google Maps */}
        <div className="mt-2.5 flex items-center justify-between gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span className="truncate">{cleaning.address || 'Address not specified'}</span>
            {cleaning.googleMapsUrl && (
              <a
                href={cleaning.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-blue-600 dark:text-blue-400 hover:underline font-semibold inline-flex items-center gap-0.5 ml-1"
              >
                <span>Maps</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
          <button
            onClick={() => shareStoreLocationWhatsApp(cleaning)}
            title="Share Store GMap Location on WhatsApp"
            className="shrink-0 text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold inline-flex items-center gap-1 transition shadow-2xs"
          >
            <Share2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>GMap WA</span>
          </button>
        </div>

        {/* Store Manager Contact */}
        <div className="mt-2 flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
            <span className="text-slate-400 text-[11px]">Manager:</span>
            <span className="font-semibold">{cleaning.managerName || 'Not assigned'}</span>
          </div>
          {cleaning.managerPhone && (
            <div className="flex items-center gap-2">
              <a
                href={`tel:${cleaning.managerPhone}`}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300 px-2 py-0.5 rounded-md hover:bg-emerald-100 transition"
              >
                <Phone className="w-3 h-3" />
                <span>Call</span>
              </a>
              <a
                href={`https://wa.me/${cleaning.managerPhone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 dark:bg-green-950/50 dark:text-green-300 px-2 py-0.5 rounded-md hover:bg-green-100 transition"
              >
                <MessageSquare className="w-3 h-3" />
                <span>WhatsApp</span>
              </a>
            </div>
          )}
        </div>

      </div>

      {/* Middle Body: Date, Timings, Team, Checklist */}
      <div className="p-4 sm:p-5 space-y-3.5 text-xs">
        
        {/* Date & Timings Bar */}
        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-amber-500" />
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Clean Date</div>
              <div className="font-bold text-slate-800 dark:text-slate-200">{cleaning.cleaningDate}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Timings & Duration</div>
              <div className="font-bold text-slate-800 dark:text-slate-200">
                {cleaning.startTime || '--'} to {cleaning.endTime || '--'}
                <span className="ml-1 text-[10px] font-normal text-slate-400">({cleaning.durationHours || 0}h)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Team Members Section */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span className="flex items-center gap-1 font-semibold">
              <Users className="w-3.5 h-3.5 text-slate-500" /> Team Deployed ({cleaning.headcount || 0} Pax)
            </span>
            <span className="font-medium text-slate-500">{cleaning.teamVendor || 'Agency'}</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-slate-100 dark:border-slate-700/40 text-slate-700 dark:text-slate-300 text-xs">
            <div className="font-semibold text-slate-900 dark:text-slate-200">
              Supervisor: {cleaning.supervisorName || 'N/A'} {cleaning.supervisorPhone ? `(${cleaning.supervisorPhone})` : ''}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
              Staff: {cleaning.teamMembers || 'Names not recorded'}
            </div>
          </div>
        </div>

        {/* Photos Thumbnail Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Camera className="w-3.5 h-3.5 text-amber-500" /> Cleaning Photos Proofs ({cleaning.photos?.length || 0})
            </span>
            <button
              onClick={() => onOpenPhotos(cleaning)}
              className="text-xs text-blinkit-green hover:underline font-bold"
            >
              {cleaning.photos?.length > 0 ? 'View All Photos' : '+ Add Photos'}
            </button>
          </div>

          {cleaning.photos && cleaning.photos.length > 0 ? (
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {cleaning.photos.slice(0, 4).map((photo, idx) => (
                <div
                  key={idx}
                  onClick={() => onOpenPhotos(cleaning)}
                  className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 cursor-pointer group"
                >
                  <img
                    src={photo.url}
                    alt={photo.title || 'Store photo'}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                  <span className={`absolute bottom-0 inset-x-0 text-[8px] font-bold text-center py-0.5 uppercase text-white ${
                    photo.type === 'before' ? 'bg-rose-600/80' : photo.type === 'after' ? 'bg-emerald-600/80' : 'bg-blue-600/80'
                  }`}>
                    {photo.type}
                  </span>
                </div>
              ))}
              {cleaning.photos.length > 4 && (
                <div
                  onClick={() => onOpenPhotos(cleaning)}
                  className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer shrink-0 hover:bg-slate-200"
                >
                  +{cleaning.photos.length - 4}
                </div>
              )}
            </div>
          ) : (
            <div 
              onClick={() => onOpenPhotos(cleaning)}
              className="py-2.5 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
            >
              <span className="text-slate-400 text-xs">No photos attached yet. Click to upload before/after photos.</span>
            </div>
          )}
        </div>

        {/* Vendor Scope of Work Badges */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-semibold flex items-center gap-1">
              <CheckSquare className="w-3.5 h-3.5 text-blinkit-green" /> Vendor Scope of Work ({cleaning.scopeOfWork?.length || 4})
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {(cleaning.scopeOfWork || [
              'Floor Deep Cleaning',
              'Toilet / Washroom Cleaning',
              'Cold Storage Area Cleaning',
              'Wall Dry & Rust Removal'
            ]).map((scope, i) => {
              let icon = '✨';
              if (scope.includes('Floor')) icon = '🧼';
              else if (scope.includes('Toilet')) icon = '🚽';
              else if (scope.includes('Cold') || scope.includes('Chiller')) icon = '❄️';
              else if (scope.includes('Wall') || scope.includes('Rust')) icon = '🧱';

              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
                >
                  <span>{icon}</span>
                  <span>{scope}</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Quality Rating */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-slate-100 dark:border-slate-700/40 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Store Cleaning Rating:</span>
            <span className="font-bold text-slate-900 dark:text-white">{cleaning.rating || 5}/5</span>
          </div>
          <div className="flex items-center gap-0.5 text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${i < (cleaning.rating || 5) ? 'fill-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
              />
            ))}
          </div>
        </div>

      </div>

      {/* Footer: Amount & Payment Status + Action Buttons */}
      <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/50 space-y-3">
        
        {/* Payment Summary Row */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Deep Cleaning Amount</div>
            <div className="text-lg font-black text-slate-900 dark:text-white">
              ₹{Number(cleaning.amount || 0).toLocaleString('en-IN')}
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isReceived
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                  : isPartial
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300'
              }`}>
                {isReceived ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                Payment: {cleaning.paymentStatus}
              </span>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {isPending && (
                <span className="text-rose-600 dark:text-rose-400 font-semibold">
                  Pending: ₹{Number(cleaning.amountPending || cleaning.amount || 0).toLocaleString('en-IN')}
                </span>
              )}
              {isPartial && (
                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                  Bal: ₹{Number(cleaning.amountPending || 0).toLocaleString('en-IN')} | Rec: ₹{Number(cleaning.amountReceived || 0).toLocaleString('en-IN')}
                </span>
              )}
              {isReceived && (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  UTR: {cleaning.utrNumber || 'Received in Full'}
                </span>
              )}
            </div>

            {cleaning.laborCost > 0 && (
              <div className="text-[11px] text-slate-400 mt-1">
                Labor: ₹{cleaning.laborCost} &bull; <span className="font-bold text-emerald-600 dark:text-emerald-400">Net Profit: ₹{cleaning.netProfit ?? (cleaning.amount - cleaning.laborCost - 300)}</span>
              </div>
            )}
          </div>
        </div>


        {/* Supervisor Voice Note Playback */}
        {cleaning.audioRemarks && (
          <div className="p-2.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 flex items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold text-indigo-700 dark:text-indigo-300 shrink-0">
              🎙️ Voice Note:
            </span>
            <audio controls src={cleaning.audioRemarks} className="h-7 flex-1 max-w-[220px]" />
          </div>
        )}

        {/* Photo Proofs & Interactive Split Comparison */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onOpenPhotos && onOpenPhotos(cleaning, 'grid')}
            className="flex-1 py-1.5 px-3 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 transition flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-650 shadow-xs"
          >
            <Camera className="w-3.5 h-3.5 text-amber-500" />
            <span>Photos ({cleaning.photos?.length || 0})</span>
          </button>

          {(cleaning.photos || []).some(p => p.type === 'before') && (cleaning.photos || []).some(p => p.type === 'after') && (
            <button
              onClick={() => onOpenPhotos && onOpenPhotos(cleaning, 'slider')}
              className="flex-1 py-1.5 px-3 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800 transition flex items-center justify-center gap-1.5 shadow-xs"
              title="Open Interactive Before vs After Split Slider"
            >
              <Columns className="w-3.5 h-3.5 text-blinkit-green" />
              <span>⚡ Compare B/A</span>
            </button>
          )}
        </div>

        {/* Buttons Row 1: Primary Actions */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-1 min-w-0">
          {/* Update Payment Button */}
          <button
            onClick={() => onUpdatePayment(cleaning)}
            className={`px-1.5 sm:px-2.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1 min-w-0 ${
              isReceived
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
            }`}
          >
            <IndianRupee className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span className="truncate">{isReceived ? 'Pay Info' : 'Update Pay'}</span>
          </button>

          {/* PDF Report Button */}
          <button
            onClick={() => onGeneratePDF(cleaning)}
            className="px-1.5 sm:px-2.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 transition flex items-center justify-center gap-1 min-w-0"
          >
            <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500 shrink-0" />
            <span className="truncate">PDF Report</span>
          </button>

          {/* WhatsApp Share Button */}
          <button
            onClick={() => onShareWhatsApp(cleaning)}
            className="px-1.5 sm:px-2.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold bg-green-50 hover:bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-900 transition flex items-center justify-center gap-1 min-w-0"
          >
            <Share2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-600 shrink-0" />
            <span className="truncate">Share WA</span>
          </button>
        </div>

        {/* Buttons Row 2: Tax Invoice & Payment Follow-up Reminder */}
        <div className={`grid ${!isReceived ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
          <button
            onClick={() => onGenerateInvoice(cleaning)}
            className="w-full py-1.5 px-3 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-300/50 dark:border-amber-800/60 transition flex items-center justify-center gap-1.5"
          >
            <Receipt className="w-3.5 h-3.5 text-amber-600" />
            <span>Tax Invoice / Bill</span>
          </button>

          {!isReceived && (
            <button
              onClick={handleRemindPayment}
              className="w-full py-1.5 px-3 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300/50 dark:border-rose-800/60 transition flex items-center justify-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5 text-rose-500" />
              <span>Remind Pay (WA)</span>
            </button>
          )}
        </div>

        {/* Buttons Row 3: Request 5-Star Rating from Store Manager */}
        <button
          onClick={() => sendStoreManagerRatingWhatsApp(cleaning)}
          title="Send 1-Click WhatsApp Rating Request to Store Manager"
          className="w-full py-1.5 px-3 rounded-xl text-xs font-bold bg-amber-50/80 hover:bg-amber-100 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 border border-amber-300/40 dark:border-amber-800/50 transition flex items-center justify-center gap-1.5"
        >
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>Request Manager Rating (WA)</span>
        </button>

        {/* Buttons Row 4: Hygiene Certificate & Store QR Code */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => generateHygieneCertificate(cleaning)}
            title="Download Official FSSAI & QA Deep Cleaning Certificate (PDF)"
            className="w-full py-1.5 px-3 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 transition flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Award className="w-3.5 h-3.5 text-indigo-500" />
            <span>Hygiene Cert</span>
          </button>

          <button
            onClick={() => onOpenStoreQR && onOpenStoreQR(cleaning)}
            title="Print Store Gate QR Code for 1-Tap Check-In"
            className="w-full py-1.5 px-3 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition flex items-center justify-center gap-1.5 shadow-xs"
          >
            <QrCode className="w-3.5 h-3.5 text-blinkit-green" />
            <span>Store QR</span>
          </button>
        </div>


      </div>

    </div>
  );
}
