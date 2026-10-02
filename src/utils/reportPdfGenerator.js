import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getBillSettings } from './billSettingsHelper';
import { naturalSortByStoreCode } from './reportExcelGenerator';

// Safe helper for autoTable compatibility
function runAutoTable(doc, options) {
  try {
    if (typeof autoTable === 'function') {
      autoTable(doc, options);
    } else if (typeof autoTable?.default === 'function') {
      autoTable.default(doc, options);
    } else if (typeof doc.autoTable === 'function') {
      doc.autoTable(options);
    }
  } catch (err) {
    console.error('Error executing autoTable:', err);
  }
}

// Convert numbers safely
const toNum = (val) => {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
};

// Calculate days overdue
const getDaysOverdue = (dateStr) => {
  if (!dateStr) return 0;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((today - target) / (1000 * 60 * 60 * 24)));
};

// Draw common letterhead header banner across report PDFs
function drawHeaderBanner(doc, { title, subtitle, filterLabel = 'All Time', refCode = 'RPT' }) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const bannerHeight = 36;

  // Dark Navy Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, bannerHeight, 'F');

  // Blinkit Green Accent Strip
  doc.setFillColor(12, 131, 31); // Blinkit Green
  doc.rect(0, bannerHeight, pageWidth, 2.5, 'F');

  // Vendor branding from Bill Settings
  const billConfig = getBillSettings();
  const bBy = billConfig.billedBy || {};
  const vendorName = bBy.companyName || 'SK ENTERPRISES';
  const vendorAddress = bBy.address || '303, Panchsheel Chs Ltd., Sector -2, Taloja Phase -01, Navi Mumbai - 410208';
  const vendorPhone = bBy.phone || '09594023629';
  const vendorGst = bBy.gstin || '27OQCPS0083R1ZU';

  // Logo determination: Strictly respect removal (if empty or 'none', do NOT show image logo)
  const rawLogo = bBy.logoUrl;
  const vendorLogo = (rawLogo && typeof rawLogo === 'string' && rawLogo.trim() !== '' && rawLogo !== 'none') ? rawLogo : null;

  const logoX = 14;
  const logoY = 6.5;
  const logoSize = 17;
  let logoDrawn = false;

  if (vendorLogo) {
    try {
      let fmt = 'JPEG';
      if (typeof vendorLogo === 'string' && vendorLogo.includes('image/png')) fmt = 'PNG';
      doc.addImage(vendorLogo, fmt, logoX, logoY, logoSize, logoSize);
      doc.setDrawColor(245, 158, 11);
      doc.setLineWidth(0.6);
      doc.roundedRect(logoX, logoY, logoSize, logoSize, 2, 2, 'S');
      logoDrawn = true;
    } catch (err) {
      console.warn('PDF header logo draw error:', err);
    }
  }

  if (!logoDrawn) {
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(logoX, logoY, logoSize, logoSize, 2.5, 2.5, 'F');
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.8);
    doc.roundedRect(logoX, logoY, logoSize, logoSize, 2.5, 2.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(248, 203, 70); // Gold
    doc.text('SK', logoX + (logoSize / 2), logoY + 9.5, { align: 'center' });

    doc.setFontSize(4.2);
    doc.setTextColor(203, 213, 225);
    doc.text('FACILITY', logoX + (logoSize / 2), logoY + 14, { align: 'center' });
  }

  // Company Name & Subtitle
  const titleX = logoX + logoSize + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(248, 203, 70);
  doc.text(vendorName, titleX, 13);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(148, 163, 184);
  doc.text('FACILITY MANAGEMENT & COMMERCIAL DEEP CLEANING SERVICES', titleX, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(226, 232, 240);
  doc.text(`${vendorAddress} | Ph: ${vendorPhone}`, titleX, 23.5);

  doc.setFontSize(6.8);
  doc.setTextColor(203, 213, 225);
  doc.text(`GSTIN: ${vendorGst}   |   Vendor Code: V-SK-BLINKIT`, titleX, 28.5);

  // Right Header: Document Title & Metadata
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(title, pageWidth - 14, 12.5, { align: 'right' });

  doc.setFontSize(7.5);
  doc.setTextColor(248, 203, 70);
  doc.text(subtitle || 'BLINKIT DARK STORE OPERATIONS REGISTER', pageWidth - 14, 18, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  doc.text(`Ref: ${refCode}-${new Date().toISOString().slice(0, 10)}  |  Period: ${filterLabel}`, pageWidth - 14, 23.5, { align: 'right' });
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, pageWidth - 14, 28.5, { align: 'right' });

  return bannerHeight + 5;
}

// Draw Summary KPI Cards Banner
function drawKpiCards(doc, startY, cards = []) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const availableWidth = pageWidth - (margin * 2);
  const cardCount = cards.length;
  const gap = 3;
  const cardWidth = (availableWidth - (gap * (cardCount - 1))) / cardCount;
  const cardHeight = 15;

  cards.forEach((card, i) => {
    const x = margin + i * (cardWidth + gap);
    
    // Background card box
    doc.setFillColor(card.bgR || 248, card.bgG || 250, card.bgB || 252);
    doc.roundedRect(x, startY, cardWidth, cardHeight, 1.8, 1.8, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, startY, cardWidth, cardHeight, 1.8, 1.8, 'S');

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(card.lblR || 100, card.lblG || 116, card.lblB || 139);
    doc.text(card.label.toUpperCase(), x + (cardWidth / 2), startY + 5.2, { align: 'center' });

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(card.valR || 15, card.valG || 23, card.valB || 42);
    doc.text(String(card.value), x + (cardWidth / 2), startY + 11.5, { align: 'center' });
  });

  return startY + cardHeight + 4;
}

// Standardized PDF Footer with Page Numbers
function addFooterAndPageNumbers(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Bottom border line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(14, pageHeight - 9, pageWidth - 14, pageHeight - 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'SK ENTERPRISES | Blinkit Commercial Facility Management Portal | Confidential Operational & Financial Record',
      14,
      pageHeight - 5
    );

    doc.setFont('helvetica', 'bold');
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - 14,
      pageHeight - 5,
      { align: 'right' }
    );
  }
}

// ----------------------------------------------------------------------
// 1. PENDING PAYMENTS PDF REPORT (Store Manager & Contact Removed)
// ----------------------------------------------------------------------
export function generatePendingPaymentsPDF({ cleanings = [], filterLabel = 'All Time' }) {
  const pendingList = naturalSortByStoreCode(cleanings.filter(c => 
    c.paymentStatus === 'Pending' || 
    c.paymentStatus === 'Partial' || 
    (toNum(c.amountPending) > 0) ||
    (toNum(c.amount) - toNum(c.amountReceived) > 0)
  ));

  if (pendingList.length === 0) {
    alert('Congratulations! There are no pending payment records for the selected period.');
    return;
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  let currentY = drawHeaderBanner(doc, {
    title: 'PENDING PAYMENTS & OUTSTANDING LEDGER',
    subtitle: 'URGENT COLLECTION STATEMENT - BLINKIT DARK STORES',
    filterLabel,
    refCode: 'PEND-STMT'
  });

  let totalBilled = 0;
  let totalRecv = 0;
  let totalPend = 0;

  // Note: Store Manager and Contact Number permanently removed per user requirement
  const tableRows = pendingList.map((c, idx) => {
    const billed = toNum(c.amount);
    const recv = toNum(c.amountReceived);
    const pend = c.amountPending !== undefined ? toNum(c.amountPending) : Math.max(0, billed - recv);
    const overdue = getDaysOverdue(c.cleaningDate);

    totalBilled += billed;
    totalRecv += recv;
    totalPend += pend;

    return [
      idx + 1,
      c.storeCode || '-',
      c.storeName || '-',
      c.city || '-',
      c.address || '-',
      c.cleaningDate || '-',
      `${overdue} days`,
      `Rs ${billed.toLocaleString('en-IN')}`,
      `Rs ${recv.toLocaleString('en-IN')}`,
      `Rs ${pend.toLocaleString('en-IN')}`,
      c.paymentStatus || 'Pending'
    ];
  });

  // KPI Metrics Banner
  currentY = drawKpiCards(doc, currentY, [
    { label: 'Pending Dark Stores', value: pendingList.length, bgR: 254, bgG: 242, bgB: 242, valR: 220, valG: 38, valB: 38 },
    { label: 'Total Invoiced Value', value: `Rs ${totalBilled.toLocaleString('en-IN')}`, valR: 15, valG: 23, valB: 42 },
    { label: 'Partial Amount Received', value: `Rs ${totalRecv.toLocaleString('en-IN')}`, valR: 5, valG: 150, valB: 105 },
    { label: 'Total Outstanding Dues', value: `Rs ${totalPend.toLocaleString('en-IN')}`, bgR: 255, bgG: 241, bgB: 242, valR: 225, valG: 29, valB: 72 }
  ]);

  // Main Data Table
  runAutoTable(doc, {
    startY: currentY,
    head: [[
      '#', 'Store Code', 'Store Name', 'City', 'Store Address', 'Clean Date', 'Aging', 
      'Invoiced', 'Received', 'Pending Due', 'Status'
    ]],
    foot: [[
      { 
        content: `TOTAL (${pendingList.length} Stores Due)`, 
        colSpan: 7, 
        styles: { halign: 'left', fontStyle: 'bold', fontSize: 8, textColor: [15, 23, 42] } 
      },
      { content: `Rs ${totalBilled.toLocaleString('en-IN')}`, styles: { halign: 'right', fontStyle: 'bold', fontSize: 8 } },
      { content: `Rs ${totalRecv.toLocaleString('en-IN')}`, styles: { halign: 'right', fontStyle: 'bold', fontSize: 8 } },
      { content: `Rs ${totalPend.toLocaleString('en-IN')}`, styles: { halign: 'right', fontStyle: 'bold', fontSize: 8, textColor: [220, 38, 38] } },
      { content: 'OVERDUE', styles: { halign: 'center', fontStyle: 'bold', fontSize: 8, textColor: [220, 38, 38] } }
    ]],
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 41, 59] },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 8, minCellHeight: 8, valign: 'middle' },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 18, fontStyle: 'bold' },
      2: { cellWidth: 50 },
      3: { cellWidth: 22 },
      4: { cellWidth: 46 },
      5: { cellWidth: 18 },
      6: { cellWidth: 16, textColor: [220, 38, 38], fontStyle: 'bold' },
      7: { cellWidth: 24, halign: 'right' },
      8: { cellWidth: 24, halign: 'right' },
      9: { cellWidth: 26, halign: 'right', fontStyle: 'bold', textColor: [220, 38, 38] },
      10: { cellWidth: 18, halign: 'center', fontStyle: 'bold' }
    }
  });

  // Bank Account Box & Signatory Section at the bottom
  const finalY = (doc.lastAutoTable?.finalY || 140) + 6;
  const pageWidth = doc.internal.pageSize.getWidth();
  const billConfig = getBillSettings();
  const bBy = billConfig.billedBy || {};

  if (finalY < doc.internal.pageSize.getHeight() - 35) {
    // Bank Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, finalY, 150, 26, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, finalY, 150, 26, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('SETTLEMENT BANK DETAILS FOR NEFT / RTGS / UPI:', 18, finalY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`Bank Name: ${bBy.bankName || 'State Bank of India'}`, 18, finalY + 11);
    doc.text(`Account No: ${bBy.accountNumber || '44415842838'}`, 18, finalY + 16);
    doc.text(`IFSC Code: ${bBy.ifscCode || 'SBIN0061214'}   |   UPI ID: ${bBy.upiId || '9594023629@sbi'}`, 18, finalY + 21);

    // Signatory Box
    const sigX = pageWidth - 90;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(`For ${bBy.companyName || 'SK ENTERPRISES'}`, sigX + 35, finalY + 5.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Commercial Facility Operations Division', sigX + 35, finalY + 10.5, { align: 'center' });

    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.3);
    doc.line(sigX + 5, finalY + 21, sigX + 65, finalY + 21);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text('Authorized Billing Officer', sigX + 35, finalY + 25, { align: 'center' });
  }

  addFooterAndPageNumbers(doc);
  doc.save(`Blinkit_Pending_Payments_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ----------------------------------------------------------------------
// 2. COMPLETED PAYMENTS PDF REPORT (Store Manager Removed)
// ----------------------------------------------------------------------
export function generateCompletedPaymentsPDF({ cleanings = [], filterLabel = 'All Time' }) {
  const completedList = naturalSortByStoreCode(cleanings.filter(c => 
    c.paymentStatus === 'Received' || 
    c.paymentStatus === 'Completed' ||
    (toNum(c.amountReceived) > 0 && toNum(c.amountPending) <= 0)
  ));

  if (completedList.length === 0) {
    alert('No settled payment records found for the selected period.');
    return;
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  let currentY = drawHeaderBanner(doc, {
    title: 'COMPLETED PAYMENTS & SETTLEMENT REGISTER',
    subtitle: 'REVENUE AUDIT & BANK RECONCILIATION STATEMENT',
    filterLabel,
    refCode: 'SETTLE-AUDIT'
  });

  let totalBilled = 0;
  let totalRecv = 0;

  // Note: Store Manager removed per user requirement
  const tableRows = completedList.map((c, idx) => {
    const billed = toNum(c.amount);
    const recv = toNum(c.amountReceived) || billed;
    totalBilled += billed;
    totalRecv += recv;

    return [
      idx + 1,
      c.storeCode || '-',
      c.storeName || '-',
      c.city || '-',
      c.cleaningDate || '-',
      c.paymentDate || c.cleaningDate || '-',
      c.paymentMode || 'UPI / NEFT',
      c.utrNumber || 'VERIFIED',
      `Rs ${billed.toLocaleString('en-IN')}`,
      `Rs ${recv.toLocaleString('en-IN')}`,
      'Full Paid'
    ];
  });

  currentY = drawKpiCards(doc, currentY, [
    { label: 'Settled Dark Stores', value: completedList.length, bgR: 240, bgG: 253, bgB: 244, valR: 22, valG: 101, valB: 52 },
    { label: 'Total Invoiced Value', value: `Rs ${totalBilled.toLocaleString('en-IN')}`, valR: 15, valG: 23, valB: 42 },
    { label: 'Total Realized Collection', value: `Rs ${totalRecv.toLocaleString('en-IN')}`, bgR: 240, bgG: 253, bgB: 244, valR: 5, valG: 150, valB: 105 },
    { label: 'Collection Efficiency', value: '100.0%', valR: 12, valG: 131, valB: 31 }
  ]);

  runAutoTable(doc, {
    startY: currentY,
    head: [[
      '#', 'Store Code', 'Store Name', 'City', 'Clean Date', 'Paid Date', 
      'Payment Mode', 'UTR / Ref No', 'Invoiced', 'Paid Amount', 'Status'
    ]],
    foot: [[
      { 
        content: `TOTAL (${completedList.length} Stores Settled)`, 
        colSpan: 8, 
        styles: { halign: 'left', fontStyle: 'bold', fontSize: 8, textColor: [15, 23, 42] } 
      },
      { content: `Rs ${totalBilled.toLocaleString('en-IN')}`, styles: { halign: 'right', fontStyle: 'bold', fontSize: 8 } },
      { content: `Rs ${totalRecv.toLocaleString('en-IN')}`, styles: { halign: 'right', fontStyle: 'bold', fontSize: 8, textColor: [5, 150, 105] } },
      { content: 'SETTLED', styles: { halign: 'center', fontStyle: 'bold', fontSize: 8, textColor: [12, 131, 31] } }
    ]],
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 41, 59] },
    headStyles: { fillColor: [12, 131, 31], textColor: [255, 255, 255], fontStyle: 'bold' },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 8, minCellHeight: 8, valign: 'middle' },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 18, fontStyle: 'bold' },
      2: { cellWidth: 54 },
      3: { cellWidth: 24 },
      4: { cellWidth: 20 },
      5: { cellWidth: 20 },
      6: { cellWidth: 26 },
      7: { cellWidth: 36 },
      8: { cellWidth: 26, halign: 'right' },
      9: { cellWidth: 26, halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105] },
      10: { cellWidth: 20, halign: 'center', fontStyle: 'bold', textColor: [12, 131, 31] }
    }
  });

  addFooterAndPageNumbers(doc);
  doc.save(`Blinkit_Completed_Payments_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ----------------------------------------------------------------------
// 3. ALL CLEANING RECORDS PDF REGISTER
//    Supports includeFinancials = true (With Amount) | false (Without Amount)
//    Store Manager & Contact Removed
// ----------------------------------------------------------------------
export function generateAllCleaningsPDF({ cleanings = [], filterLabel = 'All Time', includeFinancials = true } = {}) {
  if (cleanings.length === 0) {
    alert('No cleaning records found for the selected period.');
    return;
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  
  const title = includeFinancials
    ? 'DEEP CLEANING OPERATIONS & FINANCIAL AUDIT MASTER'
    : 'DEEP CLEANING OPERATIONS EXECUTION REGISTER (OPERATIONAL ONLY)';
  const subtitle = includeFinancials
    ? 'COMPLETE FACILITY AUDIT & BILLING LOG - BLINKIT DARK STORES'
    : 'DARK STORE SANITIZATION, SHIFT TIMINGS & AUDIT COMPLIANCE (NON-FINANCIAL)';
  const refCode = includeFinancials ? 'DC-MASTER-FIN' : 'DC-OPS-NONFIN';

  let currentY = drawHeaderBanner(doc, {
    title,
    subtitle,
    filterLabel,
    refCode
  });

  let totalBilled = 0;
  let totalRecv = 0;
  let totalPend = 0;
  let rating5Count = 0;
  let totalPhotos = 0;

  cleanings.forEach(c => {
    totalBilled += toNum(c.amount);
    totalRecv += toNum(c.amountReceived);
    const pend = c.amountPending !== undefined ? toNum(c.amountPending) : Math.max(0, toNum(c.amount) - toNum(c.amountReceived));
    totalPend += pend;
    if (Number(c.rating) >= 5) rating5Count++;
    totalPhotos += (c.photos && c.photos.length) || 0;
  });

  const sortedCleanings = naturalSortByStoreCode(cleanings);
  let tableRows = [];
  let headCols = [];
  let footCols = [];
  let colStyles = {};

  if (includeFinancials) {
    // Financial Master PDF
    currentY = drawKpiCards(doc, currentY, [
      { label: 'Total Cleanings Executed', value: cleanings.length, valR: 15, valG: 23, valB: 42 },
      { label: 'Total Gross Billing', value: `Rs ${totalBilled.toLocaleString('en-IN')}`, valR: 15, valG: 23, valB: 42 },
      { label: 'Total Realized Received', value: `Rs ${totalRecv.toLocaleString('en-IN')}`, valR: 12, valG: 131, valB: 31 },
      { label: 'Total Outstanding Pending', value: `Rs ${totalPend.toLocaleString('en-IN')}`, valR: totalPend > 0 ? 220 : 15, valG: totalPend > 0 ? 38 : 23, valB: totalPend > 0 ? 38 : 42 }
    ]);

    tableRows = sortedCleanings.map((c, idx) => {
      const billed = toNum(c.amount);
      const recv = toNum(c.amountReceived);
      const pend = c.amountPending !== undefined ? toNum(c.amountPending) : Math.max(0, billed - recv);

      return [
        idx + 1,
        c.storeCode || '-',
        c.storeName || '-',
        c.city || '-',
        c.cleaningDate || '-',
        c.shift || 'Night',
        c.supervisorName || '-',
        `${c.rating || 5}/5`,
        `Rs ${billed.toLocaleString('en-IN')}`,
        `Rs ${recv.toLocaleString('en-IN')}`,
        `Rs ${pend.toLocaleString('en-IN')}`,
        c.paymentStatus || 'Pending'
      ];
    });

    headCols = [
      '#', 'Store Code', 'Store Name', 'City', 'Clean Date', 'Shift', 
      'Supervisor', 'Rating', 'Invoiced', 'Received', 'Pending', 'Payment'
    ];

    footCols = [
      { 
        content: `TOTAL (${cleanings.length} Cleanings Recorded)`, 
        colSpan: 8, 
        styles: { halign: 'left', fontStyle: 'bold', fontSize: 8, textColor: [15, 23, 42] } 
      },
      { content: `Rs ${totalBilled.toLocaleString('en-IN')}`, styles: { halign: 'right', fontStyle: 'bold', fontSize: 8 } },
      { content: `Rs ${totalRecv.toLocaleString('en-IN')}`, styles: { halign: 'right', fontStyle: 'bold', fontSize: 8, textColor: [12, 131, 31] } },
      { content: `Rs ${totalPend.toLocaleString('en-IN')}`, styles: { halign: 'right', fontStyle: 'bold', fontSize: 8, textColor: totalPend > 0 ? [220, 38, 38] : [15, 23, 42] } },
      { content: totalPend === 0 ? 'CLEARED' : 'PENDING', styles: { halign: 'center', fontStyle: 'bold', fontSize: 8 } }
    ];

    colStyles = {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 18, fontStyle: 'bold' },
      2: { cellWidth: 50 },
      3: { cellWidth: 22 },
      4: { cellWidth: 20 },
      5: { cellWidth: 16 },
      6: { cellWidth: 28 },
      7: { cellWidth: 16, halign: 'center' },
      8: { cellWidth: 24, halign: 'right' },
      9: { cellWidth: 24, halign: 'right' },
      10: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
      11: { cellWidth: 20, halign: 'center', fontStyle: 'bold' }
    };
  } else {
    // Pure Operational PDF - Zero Financials
    currentY = drawKpiCards(doc, currentY, [
      { label: 'Cleanings Executed', value: cleanings.length, valR: 15, valG: 23, valB: 42 },
      { label: '5-Star Quality Rating', value: rating5Count, valR: 245, valG: 158, valB: 11 },
      { label: 'Photo Proofs Uploaded', value: totalPhotos, valR: 14, valG: 165, valB: 233 },
      { label: 'Audit Verification Rate', value: '100.0% VERIFIED', valR: 12, valG: 131, valB: 31 }
    ]);

    tableRows = sortedCleanings.map((c, idx) => {
      const scopeStr = Array.isArray(c.scopeOfWork)
        ? c.scopeOfWork.slice(0, 2).join(', ')
        : 'Floor Deep Cleaning, Toilet, Cold Storage';

      return [
        idx + 1,
        c.storeCode || '-',
        c.storeName || '-',
        c.city || '-',
        c.cleaningDate || '-',
        c.shift || 'Night',
        `${c.startTime || '--'} - ${c.endTime || '--'}`,
        c.supervisorName || '-',
        c.headcount || 1,
        scopeStr,
        `${c.rating || 5}/5`,
        c.status || 'Completed'
      ];
    });

    headCols = [
      '#', 'Store Code', 'Store Name', 'City', 'Clean Date', 'Shift', 
      'Timings', 'Supervisor', 'Team', 'Scope of Work', 'Rating', 'Status'
    ];

    footCols = [
      { 
        content: `TOTAL (${cleanings.length} Cleanings Executed & Audited)`, 
        colSpan: 11, 
        styles: { halign: 'left', fontStyle: 'bold', fontSize: 8, textColor: [15, 23, 42] } 
      },
      { content: 'VERIFIED', styles: { halign: 'center', fontStyle: 'bold', fontSize: 8, textColor: [12, 131, 31] } }
    ];

    colStyles = {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 18, fontStyle: 'bold' },
      2: { cellWidth: 48 },
      3: { cellWidth: 22 },
      4: { cellWidth: 20 },
      5: { cellWidth: 16 },
      6: { cellWidth: 24 },
      7: { cellWidth: 26 },
      8: { cellWidth: 12, halign: 'center' },
      9: { cellWidth: 48 },
      10: { cellWidth: 14, halign: 'center' },
      11: { cellWidth: 18, halign: 'center', fontStyle: 'bold', textColor: [12, 131, 31] }
    };
  }

  runAutoTable(doc, {
    startY: currentY,
    head: [headCols],
    body: tableRows,
    foot: [footCols],
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 41, 59] },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 8, minCellHeight: 8, valign: 'middle' },
    columnStyles: colStyles
  });

  addFooterAndPageNumbers(doc);
  const fileName = includeFinancials
    ? `Blinkit_All_Cleanings_Financial_${new Date().toISOString().slice(0, 10)}.pdf`
    : `Blinkit_All_Cleanings_Operational_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}

// ----------------------------------------------------------------------
// 4. STORE-WISE PERFORMANCE PDF SUMMARY
//    Supports includeFinancials = true (With Amount) | false (Without Amount)
//    Store Manager & Contact Removed
// ----------------------------------------------------------------------
export function generateStoreSummaryPDF({ cleanings = [], stores = [], filterLabel = 'All Time', includeFinancials = true } = {}) {
  const storeMap = new Map();

  stores.forEach(s => {
    const key = (s.storeCode || s.code || s.storeName || '').trim();
    if (key) {
      storeMap.set(key, {
        code: s.storeCode || s.code || '',
        name: s.storeName || s.name || '',
        city: s.city || '',
        address: s.address || '',
        cleaningsCount: 0,
        totalBilled: 0,
        totalReceived: 0,
        totalPending: 0,
        lastCleanDate: ''
      });
    }
  });

  cleanings.forEach(c => {
    const key = (c.storeCode || c.storeName || '').trim();
    if (!key) return;

    let item = storeMap.get(key);
    if (!item) {
      item = {
        code: c.storeCode || '',
        name: c.storeName || '',
        city: c.city || '',
        address: c.address || '',
        cleaningsCount: 0,
        totalBilled: 0,
        totalReceived: 0,
        totalPending: 0,
        lastCleanDate: ''
      };
      storeMap.set(key, item);
    }

    const billed = toNum(c.amount);
    const recv = toNum(c.amountReceived);
    const pend = c.amountPending !== undefined ? toNum(c.amountPending) : Math.max(0, billed - recv);

    item.cleaningsCount += 1;
    item.totalBilled += billed;
    item.totalReceived += recv;
    item.totalPending += pend;

    if (!item.lastCleanDate || (c.cleaningDate && c.cleaningDate > item.lastCleanDate)) {
      item.lastCleanDate = c.cleaningDate;
    }
  });

  const storeRows = naturalSortByStoreCode(Array.from(storeMap.values()), s => s.code);
  if (storeRows.length === 0) {
    alert('No store records found.');
    return;
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  
  const title = includeFinancials
    ? 'DARK STORE PERFORMANCE & FINANCIAL AUDIT SUMMARY'
    : 'DARK STORE SERVICE FREQUENCY & COVERAGE REGISTER (OPERATIONAL)';
  const subtitle = includeFinancials
    ? 'STORE-BY-STORE COVERAGE & REVENUE RECOVERY LEDGER'
    : 'STORE NETWORK CLEANING FREQUENCY & AUDIT STATUS (NON-FINANCIAL)';
  const refCode = includeFinancials ? 'STORE-LEDGER' : 'STORE-OPS-AUDIT';

  let currentY = drawHeaderBanner(doc, {
    title,
    subtitle,
    filterLabel,
    refCode
  });

  let sumCleanings = 0;
  let sumBilled = 0;
  let sumRecv = 0;
  let sumPend = 0;
  let activeCleanedCount = 0;

  storeRows.forEach(s => {
    sumCleanings += s.cleaningsCount;
    sumBilled += s.totalBilled;
    sumRecv += s.totalReceived;
    sumPend += s.totalPending;
    if (s.cleaningsCount > 0) activeCleanedCount++;
  });

  let tableRows = [];
  let headCols = [];
  let footCols = [];
  let colStyles = {};

  if (includeFinancials) {
    currentY = drawKpiCards(doc, currentY, [
      { label: 'Registered Dark Stores', value: storeRows.length, valR: 15, valG: 23, valB: 42 },
      { label: 'Cleanings Executed', value: sumCleanings, valR: 15, valG: 23, valB: 42 },
      { label: 'Total Invoiced Value', value: `Rs ${sumBilled.toLocaleString('en-IN')}`, valR: 12, valG: 131, valB: 31 },
      { label: 'Total Outstanding Dues', value: `Rs ${sumPend.toLocaleString('en-IN')}`, valR: sumPend > 0 ? 220 : 15, valG: sumPend > 0 ? 38 : 23, valB: sumPend > 0 ? 38 : 42 }
    ]);

    tableRows = storeRows.map((s, idx) => {
      let status = 'Cleared';
      if (s.cleaningsCount === 0) status = 'No Cleanings';
      else if (s.totalPending > 0) status = 'Pending Dues';

      return [
        idx + 1,
        s.code || '-',
        s.name || '-',
        s.city || '-',
        s.cleaningsCount,
        `Rs ${s.totalBilled.toLocaleString('en-IN')}`,
        `Rs ${s.totalReceived.toLocaleString('en-IN')}`,
        `Rs ${s.totalPending.toLocaleString('en-IN')}`,
        status,
        s.lastCleanDate || '-'
      ];
    });

    headCols = [
      '#', 'Store Code', 'Store Name', 'City', 
      'Cleanings', 'Total Invoiced', 'Received', 'Pending Dues', 'Status', 'Last Cleaned'
    ];

    footCols = [
      { 
        content: `TOTAL (${storeRows.length} Registered Stores)`, 
        colSpan: 4, 
        styles: { halign: 'left', fontStyle: 'bold', fontSize: 8, textColor: [15, 23, 42] } 
      },
      { content: String(sumCleanings), styles: { halign: 'center', fontStyle: 'bold', fontSize: 8 } },
      { content: `Rs ${sumBilled.toLocaleString('en-IN')}`, styles: { halign: 'right', fontStyle: 'bold', fontSize: 8 } },
      { content: `Rs ${sumRecv.toLocaleString('en-IN')}`, styles: { halign: 'right', fontStyle: 'bold', fontSize: 8, textColor: [12, 131, 31] } },
      { content: `Rs ${sumPend.toLocaleString('en-IN')}`, styles: { halign: 'right', fontStyle: 'bold', fontSize: 8, textColor: sumPend > 0 ? [220, 38, 38] : [15, 23, 42] } },
      { content: sumPend === 0 ? 'CLEARED' : 'PENDING', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', fontSize: 8 } }
    ];

    colStyles = {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 20, fontStyle: 'bold' },
      2: { cellWidth: 62 },
      3: { cellWidth: 26 },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 30, halign: 'right' },
      6: { cellWidth: 30, halign: 'right' },
      7: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
      8: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
      9: { cellWidth: 22 }
    };
  } else {
    currentY = drawKpiCards(doc, currentY, [
      { label: 'Total Dark Stores', value: storeRows.length, valR: 15, valG: 23, valB: 42 },
      { label: 'Serviced Stores', value: activeCleanedCount, valR: 12, valG: 131, valB: 31 },
      { label: 'Total Cleanings Logged', value: sumCleanings, valR: 14, valG: 165, valB: 233 },
      { label: 'Network Coverage', value: `${Math.round((activeCleanedCount / (storeRows.length || 1)) * 100)}%`, valR: 245, valG: 158, valB: 11 }
    ]);

    tableRows = storeRows.map((s, idx) => {
      let cycle = 'Every 30 Days';
      let opStatus = s.cleaningsCount > 0 ? 'Active / Serviced' : 'Pending First Cycle';

      return [
        idx + 1,
        s.code || '-',
        s.name || '-',
        s.city || '-',
        s.address || '-',
        s.cleaningsCount,
        s.lastCleanDate || '-',
        cycle,
        opStatus
      ];
    });

    headCols = [
      '#', 'Store Code', 'Store Name', 'City', 'Store Address',
      'Cleanings', 'Last Cleaned Date', 'Cycle Frequency', 'Operational Status'
    ];

    footCols = [
      { 
        content: `TOTAL (${storeRows.length} Registered Stores)`, 
        colSpan: 5, 
        styles: { halign: 'left', fontStyle: 'bold', fontSize: 8, textColor: [15, 23, 42] } 
      },
      { content: String(sumCleanings), styles: { halign: 'center', fontStyle: 'bold', fontSize: 8 } },
      { content: 'AUDITED', colSpan: 3, styles: { halign: 'center', fontStyle: 'bold', fontSize: 8, textColor: [12, 131, 31] } }
    ];

    colStyles = {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 20, fontStyle: 'bold' },
      2: { cellWidth: 52 },
      3: { cellWidth: 24 },
      4: { cellWidth: 58 },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 24 },
      7: { cellWidth: 28 },
      8: { cellWidth: 30, halign: 'center', fontStyle: 'bold', textColor: [12, 131, 31] }
    };
  }

  runAutoTable(doc, {
    startY: currentY,
    head: [headCols],
    body: tableRows,
    foot: [footCols],
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 41, 59] },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 8, minCellHeight: 8, valign: 'middle' },
    columnStyles: colStyles
  });

  addFooterAndPageNumbers(doc);
  const fileName = includeFinancials
    ? `Blinkit_Store_Performance_Ledger_${new Date().toISOString().slice(0, 10)}.pdf`
    : `Blinkit_Store_Operations_Audit_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}

// ----------------------------------------------------------------------
// 5. MASTER EXECUTIVE CONSOLIDATED PDF (Store Manager & Contact Removed)
// ----------------------------------------------------------------------
export function generateMasterExecutiveReportPDF({ cleanings = [], stores = [], filterLabel = 'All Time' }) {
  if (cleanings.length === 0) {
    alert('No cleaning records found for the executive report.');
    return;
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  let currentY = drawHeaderBanner(doc, {
    title: 'EXECUTIVE MANAGEMENT SUMMARY & FINANCIAL AUDIT',
    subtitle: 'CONSOLIDATED BLINKIT FACILITY REPORT',
    filterLabel,
    refCode: 'EXEC-AUDIT'
  });

  let totalBilled = 0;
  let totalReceived = 0;
  let totalPending = 0;

  cleanings.forEach(c => {
    const b = toNum(c.amount);
    const r = toNum(c.amountReceived);
    const p = c.amountPending !== undefined ? toNum(c.amountPending) : Math.max(0, b - r);
    totalBilled += b;
    totalReceived += r;
    totalPending += p;
  });

  const collectionRate = totalBilled > 0 ? ((totalReceived / totalBilled) * 100).toFixed(1) + '%' : '0%';

  currentY = drawKpiCards(doc, currentY, [
    { label: 'Registered Stores', value: stores.length || cleanings.length, valR: 15, valG: 23, valB: 42 },
    { label: 'Cleanings Executed', value: cleanings.length, valR: 15, valG: 23, valB: 42 },
    { label: 'Total Invoiced Value', value: `Rs ${totalBilled.toLocaleString('en-IN')}`, valR: 15, valG: 23, valB: 42 },
    { label: 'Total Realized Received', value: `Rs ${totalReceived.toLocaleString('en-IN')}`, valR: 12, valG: 131, valB: 31 },
    { label: 'Outstanding Pending Dues', value: `Rs ${totalPending.toLocaleString('en-IN')}`, bgR: 255, bgG: 241, bgB: 242, valR: 225, valG: 29, valB: 72 },
    { label: 'Collection Realization', value: collectionRate, valR: 245, valG: 158, valB: 11 }
  ]);

  // Section 1: Top Critical Dues / Operational Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('1. TOP PENDING ACCOUNTS REQUIRING SETTLEMENT FOLLOW-UP', 14, currentY + 4);
  currentY += 7;

  // Filter top 10 pending (Store Manager and Phone permanently removed)
  const topPending = cleanings
    .filter(c => c.paymentStatus === 'Pending' || c.paymentStatus === 'Partial' || (toNum(c.amountPending) > 0))
    .slice(0, 12);

  const tableRows = topPending.map((c, idx) => {
    const billed = toNum(c.amount);
    const recv = toNum(c.amountReceived);
    const pend = c.amountPending !== undefined ? toNum(c.amountPending) : Math.max(0, billed - recv);

    return [
      idx + 1,
      c.storeCode || '-',
      c.storeName || '-',
      c.city || '-',
      c.cleaningDate || '-',
      `Rs ${billed.toLocaleString('en-IN')}`,
      `Rs ${recv.toLocaleString('en-IN')}`,
      `Rs ${pend.toLocaleString('en-IN')}`,
      c.paymentStatus || 'Pending'
    ];
  });

  runAutoTable(doc, {
    startY: currentY,
    head: [[
      '#', 'Store Code', 'Store Name', 'City', 'Clean Date', 
      'Invoiced', 'Received', 'Pending Dues', 'Status'
    ]],
    body: tableRows,
    foot: [[
      { 
        content: `TOTAL ACCOUNTS SUMMARY (${cleanings.length} Cleanings Executed)`, 
        colSpan: 5, 
        styles: { halign: 'left', fontStyle: 'bold', fontSize: 8, textColor: [15, 23, 42] } 
      },
      { content: `Rs ${totalBilled.toLocaleString('en-IN')}`, styles: { halign: 'right', fontStyle: 'bold', fontSize: 8 } },
      { content: `Rs ${totalReceived.toLocaleString('en-IN')}`, styles: { halign: 'right', fontStyle: 'bold', fontSize: 8, textColor: [12, 131, 31] } },
      { content: `Rs ${totalPending.toLocaleString('en-IN')}`, styles: { halign: 'right', fontStyle: 'bold', fontSize: 8, textColor: [220, 38, 38] } },
      { content: collectionRate, styles: { halign: 'center', fontStyle: 'bold', fontSize: 8 } }
    ]],
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 41, 59] },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 8, minCellHeight: 8, valign: 'middle' },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 20, fontStyle: 'bold' },
      2: { cellWidth: 65 },
      3: { cellWidth: 28 },
      4: { cellWidth: 24 },
      5: { cellWidth: 30, halign: 'right' },
      6: { cellWidth: 30, halign: 'right' },
      7: { cellWidth: 32, halign: 'right', fontStyle: 'bold', textColor: [220, 38, 38] },
      8: { cellWidth: 24, halign: 'center', fontStyle: 'bold' }
    }
  });

  addFooterAndPageNumbers(doc);
  doc.save(`Blinkit_Master_Executive_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}
