import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getBillSettings } from './billSettingsHelper';

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
    doc.setFillColor(card.bgR || 248, card.bgG || 250, card.bgB || 252); // slate-50
    doc.roundedRect(x, startY, cardWidth, cardHeight, 1.5, 1.5, 'F');
    
    // Border
    doc.setDrawColor(card.borderR || 203, card.borderG || 213, card.borderB || 225);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, startY, cardWidth, cardHeight, 1.5, 1.5, 'S');

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(card.lblR || 100, card.lblG || 116, card.lblB || 139);
    doc.text(card.label.toUpperCase(), x + 3, startY + 4.8);

    // Value
    doc.setFontSize(10.5);
    doc.setTextColor(card.valR || 15, card.valG || 23, card.valB || 42);
    doc.text(String(card.value), x + 3, startY + 11.5);
  });

  return startY + cardHeight + 4;
}

// Add page numbering and footer
function addFooterAndPageNumbers(doc) {
  const totalPages = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 10, pageWidth - 14, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Blinkit Quick Commerce Dark Store Operations Tracker - SK Enterprises Official Report', 14, pageHeight - 6);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 6, { align: 'right' });
  }
}

// ----------------------------------------------------------------------
// 1. PENDING PAYMENTS PDF GENERATOR
// ----------------------------------------------------------------------
export function generatePendingPaymentsPDF({ cleanings = [], filterLabel = 'All Time' }) {
  const pendingList = cleanings.filter(c => 
    c.paymentStatus === 'Pending' || 
    c.paymentStatus === 'Partial' || 
    (toNum(c.amountPending) > 0) ||
    (toNum(c.amount) - toNum(c.amountReceived) > 0)
  );

  if (pendingList.length === 0) {
    alert('No pending payment records found for the selected filter.');
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
      c.cleaningDate || '-',
      `${overdue} days`,
      c.managerName || '-',
      c.managerPhone || '-',
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
      '#', 'Store Code', 'Store Name', 'City', 'Clean Date', 'Aging', 
      'Manager', 'Phone', 'Billed', 'Received', 'Pending Due', 'Status'
    ]],
    body: tableRows,
    foot: [[
      'TOTAL', '', '', '', '', `${pendingList.length} Stores`, '', '',
      `Rs ${totalBilled.toLocaleString('en-IN')}`,
      `Rs ${totalRecv.toLocaleString('en-IN')}`,
      `Rs ${totalPend.toLocaleString('en-IN')}`,
      'OVERDUE'
    ]],
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 41, 59] },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 18, fontStyle: 'bold' },
      2: { cellWidth: 48 },
      3: { cellWidth: 22 },
      4: { cellWidth: 20 },
      5: { cellWidth: 16, textColor: [220, 38, 38], fontStyle: 'bold' },
      6: { cellWidth: 26 },
      7: { cellWidth: 24 },
      8: { cellWidth: 22, halign: 'right' },
      9: { cellWidth: 22, halign: 'right' },
      10: { cellWidth: 24, halign: 'right', fontStyle: 'bold', textColor: [220, 38, 38] },
      11: { cellWidth: 18, halign: 'center', fontStyle: 'bold' }
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
    doc.roundedRect(14, finalY, 130, 24, 1.5, 1.5, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, finalY, 130, 24, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text('BANK DETAILS FOR OUTSTANDING PAYMENT SETTLEMENT:', 17, finalY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`Bank Name: ${bBy.bankName || 'HDFC Bank'}    |    A/C Holder: ${bBy.accountHolder || 'SK ENTERPRISES'}`, 17, finalY + 10.5);
    doc.text(`Account No: ${bBy.accountNumber || '50200012345678'}    |    IFSC: ${bBy.ifsc || 'HDFC0001234'}`, 17, finalY + 15.5);
    doc.text(`UPI ID: ${bBy.upiId || 'cleanpro@hdfcbank'}    |    Email UTR: skenterprises.clean@gmail.com`, 17, finalY + 20.5);

    // Signatory Area
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('FOR SK ENTERPRISES', pageWidth - 55, finalY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Authorized Billing & Accounts Officer', pageWidth - 55, finalY + 18);
  }

  addFooterAndPageNumbers(doc);
  doc.save(`Blinkit_Pending_Payments_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ----------------------------------------------------------------------
// 2. COMPLETED PAYMENTS PDF GENERATOR
// ----------------------------------------------------------------------
export function generateCompletedPaymentsPDF({ cleanings = [], filterLabel = 'All Time' }) {
  const completedList = cleanings.filter(c => 
    c.paymentStatus === 'Received' || 
    c.paymentStatus === 'Completed' ||
    (toNum(c.amountReceived) > 0 && toNum(c.amountPending) <= 0)
  );

  if (completedList.length === 0) {
    alert('No completed payment records found for the selected filter.');
    return;
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  let currentY = drawHeaderBanner(doc, {
    title: 'COMPLETED PAYMENTS & SETTLEMENT AUDIT REGISTER',
    subtitle: 'REALIZED REVENUE & VERIFIED SETTLEMENTS - BLINKIT DARK STORES',
    filterLabel,
    refCode: 'SETTL-AUDIT'
  });

  let totalBilled = 0;
  let totalRecv = 0;

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
      c.managerName || '-',
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
      'Payment Mode', 'UTR / Ref No', 'Store Manager', 'Invoiced', 'Paid Amount', 'Status'
    ]],
    body: tableRows,
    foot: [[
      'TOTAL', '', '', '', '', '', '', `${completedList.length} Entries`, '',
      `Rs ${totalBilled.toLocaleString('en-IN')}`,
      `Rs ${totalRecv.toLocaleString('en-IN')}`,
      'SETTLED'
    ]],
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 41, 59] },
    headStyles: { fillColor: [12, 131, 31], textColor: [255, 255, 255], fontStyle: 'bold' },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 18, fontStyle: 'bold' },
      2: { cellWidth: 50 },
      3: { cellWidth: 22 },
      4: { cellWidth: 20 },
      5: { cellWidth: 20 },
      6: { cellWidth: 22 },
      7: { cellWidth: 28, fontStyle: 'bold' },
      8: { cellWidth: 26 },
      9: { cellWidth: 22, halign: 'right' },
      10: { cellWidth: 24, halign: 'right', fontStyle: 'bold', textColor: [12, 131, 31] },
      11: { cellWidth: 18, halign: 'center', fontStyle: 'bold' }
    }
  });

  addFooterAndPageNumbers(doc);
  doc.save(`Blinkit_Completed_Payments_Register_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ----------------------------------------------------------------------
// 3. ALL CLEANING RECORDS MASTER REGISTER PDF
// ----------------------------------------------------------------------
export function generateAllCleaningsPDF({ cleanings = [], filterLabel = 'All Time' }) {
  if (cleanings.length === 0) {
    alert('No cleaning records found for the selected filter.');
    return;
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  let currentY = drawHeaderBanner(doc, {
    title: 'DEEP CLEANING OPERATIONS MASTER REGISTER',
    subtitle: 'COMPLETE FACILITY AUDIT & BILLING LOG - BLINKIT DARK STORES',
    filterLabel,
    refCode: 'DC-MASTER'
  });

  let totalBilled = 0;
  let totalRecv = 0;
  let totalPend = 0;

  const tableRows = cleanings.map((c, idx) => {
    const billed = toNum(c.amount);
    const recv = toNum(c.amountReceived);
    const pend = c.amountPending !== undefined ? toNum(c.amountPending) : Math.max(0, billed - recv);

    totalBilled += billed;
    totalRecv += recv;
    totalPend += pend;

    return [
      idx + 1,
      c.storeCode || '-',
      c.storeName || '-',
      c.city || '-',
      c.cleaningDate || '-',
      c.shift || 'Night',
      `${c.startTime || '--'} - ${c.endTime || '--'}`,
      c.supervisorName || '-',
      `${c.rating || 5}/5`,
      `Rs ${billed.toLocaleString('en-IN')}`,
      `Rs ${recv.toLocaleString('en-IN')}`,
      `Rs ${pend.toLocaleString('en-IN')}`,
      c.paymentStatus || 'Pending'
    ];
  });

  currentY = drawKpiCards(doc, currentY, [
    { label: 'Total Cleanings Executed', value: cleanings.length, valR: 15, valG: 23, valB: 42 },
    { label: 'Total Gross Billing', value: `Rs ${totalBilled.toLocaleString('en-IN')}`, valR: 15, valG: 23, valB: 42 },
    { label: 'Total Realized Received', value: `Rs ${totalRecv.toLocaleString('en-IN')}`, valR: 12, valG: 131, valB: 31 },
    { label: 'Total Outstanding Pending', value: `Rs ${totalPend.toLocaleString('en-IN')}`, valR: totalPend > 0 ? 220 : 15, valG: totalPend > 0 ? 38 : 23, valB: totalPend > 0 ? 38 : 42 }
  ]);

  runAutoTable(doc, {
    startY: currentY,
    head: [[
      '#', 'Store Code', 'Store Name', 'City', 'Clean Date', 'Shift', 
      'Timings', 'Supervisor', 'Rating', 'Invoiced', 'Received', 'Pending', 'Payment'
    ]],
    body: tableRows,
    foot: [[
      'TOTAL', '', '', '', '', '', `${cleanings.length} Records`, '', '',
      `Rs ${totalBilled.toLocaleString('en-IN')}`,
      `Rs ${totalRecv.toLocaleString('en-IN')}`,
      `Rs ${totalPend.toLocaleString('en-IN')}`,
      ''
    ]],
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 41, 59] },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 18, fontStyle: 'bold' },
      2: { cellWidth: 46 },
      3: { cellWidth: 20 },
      4: { cellWidth: 20 },
      5: { cellWidth: 16 },
      6: { cellWidth: 24 },
      7: { cellWidth: 24 },
      8: { cellWidth: 14, halign: 'center' },
      9: { cellWidth: 22, halign: 'right' },
      10: { cellWidth: 22, halign: 'right' },
      11: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
      12: { cellWidth: 18, halign: 'center', fontStyle: 'bold' }
    }
  });

  addFooterAndPageNumbers(doc);
  doc.save(`Blinkit_All_Cleanings_Register_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ----------------------------------------------------------------------
// 4. STORE-WISE PERFORMANCE & FINANCIAL SUMMARY PDF
// ----------------------------------------------------------------------
export function generateStoreSummaryPDF({ cleanings = [], stores = [], filterLabel = 'All Time' }) {
  const storeMap = new Map();

  stores.forEach(s => {
    const key = (s.storeCode || s.code || s.storeName || '').trim();
    if (key) {
      storeMap.set(key, {
        code: s.storeCode || s.code || '',
        name: s.storeName || s.name || '',
        city: s.city || '',
        manager: s.managerName || '',
        phone: s.managerPhone || '',
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
        manager: c.managerName || '',
        phone: c.managerPhone || '',
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

  const storeRows = Array.from(storeMap.values());
  if (storeRows.length === 0) {
    alert('No store records found.');
    return;
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  let currentY = drawHeaderBanner(doc, {
    title: 'DARK STORE PERFORMANCE & FINANCIAL AUDIT SUMMARY',
    subtitle: 'STORE-BY-STORE COVERAGE & REVENUE RECOVERY LEDGER',
    filterLabel,
    refCode: 'STORE-LEDGER'
  });

  let sumCleanings = 0;
  let sumBilled = 0;
  let sumRecv = 0;
  let sumPend = 0;

  const tableRows = storeRows.map((s, idx) => {
    sumCleanings += s.cleaningsCount;
    sumBilled += s.totalBilled;
    sumRecv += s.totalReceived;
    sumPend += s.totalPending;

    let status = 'Cleared';
    if (s.cleaningsCount === 0) status = 'No Cleanings';
    else if (s.totalPending > 0) status = 'Pending Dues';

    return [
      idx + 1,
      s.code || '-',
      s.name || '-',
      s.city || '-',
      `${s.manager || '-'} (${s.phone || '-'})`,
      s.cleaningsCount,
      `Rs ${s.totalBilled.toLocaleString('en-IN')}`,
      `Rs ${s.totalReceived.toLocaleString('en-IN')}`,
      `Rs ${s.totalPending.toLocaleString('en-IN')}`,
      status,
      s.lastCleanDate || '-'
    ];
  });

  currentY = drawKpiCards(doc, currentY, [
    { label: 'Registered Dark Stores', value: storeRows.length, valR: 15, valG: 23, valB: 42 },
    { label: 'Cleanings Executed', value: sumCleanings, valR: 15, valG: 23, valB: 42 },
    { label: 'Total Invoiced Value', value: `Rs ${sumBilled.toLocaleString('en-IN')}`, valR: 12, valG: 131, valB: 31 },
    { label: 'Total Outstanding Dues', value: `Rs ${sumPend.toLocaleString('en-IN')}`, valR: sumPend > 0 ? 220 : 15, valG: sumPend > 0 ? 38 : 23, valB: sumPend > 0 ? 38 : 42 }
  ]);

  runAutoTable(doc, {
    startY: currentY,
    head: [[
      '#', 'Store Code', 'Store Name', 'City', 'Manager & Contact', 
      'Cleanings', 'Total Invoiced', 'Received', 'Pending Dues', 'Status', 'Last Cleaned'
    ]],
    body: tableRows,
    foot: [[
      'TOTAL', '', '', '', `${storeRows.length} Stores`,
      sumCleanings,
      `Rs ${sumBilled.toLocaleString('en-IN')}`,
      `Rs ${sumRecv.toLocaleString('en-IN')}`,
      `Rs ${sumPend.toLocaleString('en-IN')}`,
      '', ''
    ]],
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 41, 59] },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 18, fontStyle: 'bold' },
      2: { cellWidth: 50 },
      3: { cellWidth: 22 },
      4: { cellWidth: 44 },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 24, halign: 'right' },
      7: { cellWidth: 24, halign: 'right' },
      8: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
      9: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
      10: { cellWidth: 20 }
    }
  });

  addFooterAndPageNumbers(doc);
  doc.save(`Blinkit_Store_Performance_Summary_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ----------------------------------------------------------------------
// 5. MASTER EXECUTIVE CONSOLIDATED REPORT PDF
// ----------------------------------------------------------------------
export function generateMasterExecutiveReportPDF({ cleanings = [], stores = [], filterLabel = 'All Time' }) {
  if (cleanings.length === 0) {
    alert('No cleaning records available for executive report.');
    return;
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  let currentY = drawHeaderBanner(doc, {
    title: 'EXECUTIVE CONSOLIDATED AUDIT & FINANCIAL REPORT',
    subtitle: 'COMPREHENSIVE OPERATIONS & REVENUE LEDGER - BLINKIT COMMERCE',
    filterLabel,
    refCode: 'EXEC-AUDIT'
  });

  const totalBilled = cleanings.reduce((sum, c) => sum + toNum(c.amount), 0);
  const totalReceived = cleanings.reduce((sum, c) => sum + toNum(c.amountReceived), 0);
  const totalPending = cleanings.reduce((sum, c) => {
    const pend = c.amountPending !== undefined ? toNum(c.amountPending) : Math.max(0, toNum(c.amount) - toNum(c.amountReceived));
    return sum + pend;
  }, 0);
  const collectionRate = totalBilled > 0 ? ((totalReceived / totalBilled) * 100).toFixed(1) + '%' : '0%';

  currentY = drawKpiCards(doc, currentY, [
    { label: 'Total Dark Stores', value: stores.length || cleanings.length, valR: 15, valG: 23, valB: 42 },
    { label: 'Cleanings Executed', value: cleanings.length, valR: 15, valG: 23, valB: 42 },
    { label: 'Gross Invoiced (Rs)', value: `Rs ${totalBilled.toLocaleString('en-IN')}`, valR: 15, valG: 23, valB: 42 },
    { label: 'Realized Revenue (Rs)', value: `Rs ${totalReceived.toLocaleString('en-IN')}`, bgR: 240, bgG: 253, bgB: 244, valR: 12, valG: 131, valB: 31 },
    { label: 'Outstanding Balance (Rs)', value: `Rs ${totalPending.toLocaleString('en-IN')}`, bgR: 255, bgG: 241, bgB: 242, valR: 220, valG: 38, valB: 38 },
    { label: 'Collection Rate', value: collectionRate, valR: 245, valG: 158, valB: 11 }
  ]);

  // Section 1: Executive Findings Table
  const tableRows = cleanings.map((c, idx) => {
    const billed = toNum(c.amount);
    const recv = toNum(c.amountReceived);
    const pend = c.amountPending !== undefined ? toNum(c.amountPending) : Math.max(0, billed - recv);

    return [
      idx + 1,
      c.storeCode || '-',
      c.storeName || '-',
      c.city || '-',
      c.cleaningDate || '-',
      c.managerName || '-',
      c.managerPhone || '-',
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
      'Manager', 'Phone', 'Invoiced', 'Received', 'Pending Dues', 'Status'
    ]],
    body: tableRows,
    foot: [[
      'TOTAL', '', '', '', `${cleanings.length} Cleanings`, '', '',
      `Rs ${totalBilled.toLocaleString('en-IN')}`,
      `Rs ${totalReceived.toLocaleString('en-IN')}`,
      `Rs ${totalPending.toLocaleString('en-IN')}`,
      collectionRate
    ]],
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 41, 59] },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 20, fontStyle: 'bold' },
      2: { cellWidth: 52 },
      3: { cellWidth: 24 },
      4: { cellWidth: 22 },
      5: { cellWidth: 26 },
      6: { cellWidth: 24 },
      7: { cellWidth: 24, halign: 'right' },
      8: { cellWidth: 24, halign: 'right' },
      9: { cellWidth: 24, halign: 'right', fontStyle: 'bold', textColor: [220, 38, 38] },
      10: { cellWidth: 22, halign: 'center', fontStyle: 'bold' }
    }
  });

  addFooterAndPageNumbers(doc);
  doc.save(`Blinkit_Master_Executive_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}
