import React, { useState } from 'react';
import { X, Printer, QrCode, Building2, MapPin, Download, Share2, Image as ImageIcon, Check } from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function StoreQRModal({ isOpen, onClose, store }) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !store) return null;

  const qrData = `BLINKIT_STORE:${store.storeCode}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrData)}&color=0c831f`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
      const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm

      // Card dimensions (A5-sized sticker centered on A4)
      const cardW = 150;
      const cardH = 215;
      const cardX = (pageWidth - cardW) / 2; // 30 mm
      const cardY = (pageHeight - cardH) / 2; // 41 mm

      // Card Background & Border
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(cardX, cardY, cardW, cardH, 8, 8, 'F');
      doc.setDrawColor(12, 131, 31); // Blinkit Green
      doc.setLineWidth(2.5);
      doc.roundedRect(cardX, cardY, cardW, cardH, 8, 8, 'S');

      // Top Brand Header: Yellow 'b' Logo Badge
      doc.setFillColor(248, 203, 70); // Blinkit Yellow
      doc.roundedRect(cardX + 18, cardY + 14, 15, 15, 3.5, 3.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text('b', cardX + 25.5, cardY + 25, { align: 'center' });

      // Brand Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42);
      doc.text('blink', cardX + 38, cardY + 23);
      const blinkW = doc.getTextWidth('blink');
      doc.setTextColor(12, 131, 31);
      doc.text('it', cardX + 38 + blinkW, cardY + 23);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('DEEP CLEANING CHECK-IN', cardX + 38, cardY + 28);

      // Dividing dashed line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.6);
      doc.line(cardX + 14, cardY + 36, cardX + cardW - 14, cardY + 36);

      // Store Name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text(store.storeName, cardX + (cardW / 2), cardY + 47, { align: 'center', maxWidth: cardW - 20 });

      // Store Code Badge
      doc.setFillColor(240, 253, 244);
      doc.roundedRect(cardX + (cardW / 2) - 38, cardY + 52, 76, 9, 2.5, 2.5, 'F');
      doc.setDrawColor(12, 131, 31);
      doc.setLineWidth(0.5);
      doc.roundedRect(cardX + (cardW / 2) - 38, cardY + 52, 76, 9, 2.5, 2.5, 'S');

      doc.setFontSize(10.5);
      doc.setTextColor(12, 131, 31);
      doc.text(`STORE CODE: ${store.storeCode}`, cardX + (cardW / 2), cardY + 58.2, { align: 'center' });

      if (store.city || store.address) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        const locText = `${store.address ? store.address + ', ' : ''}${store.city || ''}`;
        doc.text(locText, cardX + (cardW / 2), cardY + 68, { align: 'center', maxWidth: cardW - 24 });
      }

      // QR Code Container Box
      const qrBoxSize = 90;
      const qrBoxX = cardX + (cardW - qrBoxSize) / 2;
      const qrBoxY = cardY + 75;

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 4, 4, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.roundedRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 4, 4, 'S');

      // Fetch QR Image & Add to PDF
      const qrImg = new Image();
      qrImg.crossOrigin = 'Anonymous';
      qrImg.src = qrUrl;

      await new Promise((resolve) => {
        qrImg.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = qrImg.width;
            canvas.height = qrImg.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(qrImg, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            doc.addImage(dataUrl, 'PNG', qrBoxX + 6, qrBoxY + 6, qrBoxSize - 12, qrBoxSize - 12);
          } catch (e) {
            console.warn('QR addImage notice:', e);
          }
          resolve();
        };
        qrImg.onerror = () => resolve();
        setTimeout(resolve, 2500);
      });

      // Bottom Instructions
      const footerY = cardY + 178;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('SCAN VIA SUPERVISOR APP', cardX + (cardW / 2), footerY, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        'Paste this official QR card near the main shutter or facility entrance for 1-tap arrival check-in.',
        cardX + (cardW / 2),
        footerY + 6,
        { align: 'center', maxWidth: cardW - 20 }
      );

      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Blinkit Quick Commerce Dark Store Deep Cleaning Tracker', cardX + (cardW / 2), footerY + 17, { align: 'center' });

      doc.save(`Blinkit_${store.storeCode}_QR_CheckIn_Card.pdf`);
    } catch (err) {
      alert('Error creating QR PDF: ' + err.message);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadImage = async () => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Blinkit_QR_${store.storeCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(qrUrl, '_blank');
    }
  };

  const handleShareWhatsApp = () => {
    const text = `*📍 BLINKIT DARK STORE DEEP CLEANING CHECK-IN QR*
---------------------------------------
🏬 *Store Code:* ${store.storeCode}
🏪 *Store Name:* ${store.storeName}
📍 *City / Area:* ${store.city || 'Dark Store Facility'}
🗺️ *Address:* ${store.address || 'N/A'}

📲 *QR Check-in Link:*
${qrUrl}

_Paste this QR near the dark store entrance shutter. Site supervisors can scan it from their mobile app to auto-fill store details and log cleaning attendance instantly._`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div 
      className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 print:shadow-none print:border-none print:p-0">
        
        {/* Modal Header Controls (hidden on print) */}
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Dark Store Check-In QR
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {store.storeCode} - {store.storeName}
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

        {/* PRINTABLE QR CARD (Only this element prints on window.print()) */}
        <div 
          id="printable-qr-card"
          className="p-6 bg-white rounded-3xl border-4 border-blinkit-green text-center space-y-4 shadow-md mx-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blinkit-yellow text-slate-950 font-black flex items-center justify-center text-lg shadow-xs">
              b
            </div>
            <div className="text-left">
              <span className="font-extrabold text-base tracking-tight text-slate-900">
                blink<span className="text-blinkit-green">it</span>
              </span>
              <span className="text-[10px] block font-bold text-slate-500 uppercase tracking-wider">
                DEEP CLEANING CHECK-IN
              </span>
            </div>
          </div>

          <div className="border-t border-b border-dashed border-slate-200 py-3">
            <h4 className="text-lg font-black text-slate-900">
              {store.storeName}
            </h4>
            <div className="inline-block mt-1 px-3 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-xs font-black">
              STORE CODE: {store.storeCode}
            </div>
            {store.city && (
              <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{store.city}</span>
              </p>
            )}
          </div>

          {/* QR Code Image */}
          <div className="flex justify-center p-3 bg-slate-50 rounded-2xl border border-slate-100 max-w-[220px] mx-auto">
            <img
              src={qrUrl}
              alt={`QR Code for ${store.storeCode}`}
              className="w-44 h-44 object-contain rounded-xl"
            />
          </div>

          <div className="space-y-1 pt-1">
            <p className="text-xs font-black text-slate-900">
              📷 SCAN VIA SUPERVISOR APP
            </p>
            <p className="text-[10px] text-slate-500 max-w-xs mx-auto leading-relaxed">
              Paste this QR code near the main shutter or facility entrance for 1-tap arrival check-in.
            </p>
          </div>
        </div>

        {/* Action Buttons (hidden on print) */}
        <div className="space-y-2 pt-1 print:hidden">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="w-full py-2.5 px-3 rounded-xl bg-blinkit-green hover:bg-blinkit-darkgreen text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPDF ? 'Generating...' : 'Download PDF Card'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Card (Ctrl + P)</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownloadImage}
              className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-1.5"
            >
              <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
              <span>Save PNG Image</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="w-full py-2 px-3 rounded-xl bg-green-50 hover:bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300 font-semibold text-xs border border-green-200 dark:border-green-900 transition flex items-center justify-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5 text-green-600" />
              <span>Share WA Link</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
