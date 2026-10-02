import * as XLSX from 'xlsx';

// Helper to format currency values safely for Excel
const toNum = (val) => {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
};

// Calculate overdue days from cleaning date to today
const getDaysOverdue = (dateStr) => {
  if (!dateStr) return 0;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today - target) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

// ----------------------------------------------------------------------
// 1. PENDING PAYMENTS SHEET BUILDER
// ----------------------------------------------------------------------
export function buildPendingPaymentsSheet(cleanings = [], filterLabel = 'All Time') {
  const pendingList = cleanings.filter(c => 
    c.paymentStatus === 'Pending' || 
    c.paymentStatus === 'Partial' || 
    (toNum(c.amountPending) > 0) ||
    (toNum(c.amount) - toNum(c.amountReceived) > 0)
  );

  const headerRows = [
    ['SK ENTERPRISES - FACILITY MANAGEMENT & COMMERCIAL CLEANING SERVICES'],
    ['BLINKIT QUICK COMMERCE DARK STORE OPERATIONS - PENDING PAYMENTS & OUTSTANDING LEDGER'],
    [`Report Filter Period: ${filterLabel}`, `Generated On: ${new Date().toLocaleString('en-IN')}`, `Total Pending Stores: ${pendingList.length}`],
    [] // Blank line
  ];

  const columns = [
    'S.No',
    'Store Code',
    'Store Name',
    'City / Cluster',
    'Store Address',
    'Cleaning Date',
    'Days Overdue',
    'Invoiced Amount (Rs)',
    'Amount Received (Rs)',
    'Amount Pending (Rs)',
    'Payment Status',
    'Store Manager',
    'Manager Phone',
    'Service Vendor',
    'Supervisor Name',
    'Supervisor Phone',
    'Payment Notes & Remarks'
  ];

  let totalBilled = 0;
  let totalRecv = 0;
  let totalPend = 0;

  const dataRows = pendingList.map((c, index) => {
    const billed = toNum(c.amount);
    const recv = toNum(c.amountReceived);
    const pend = c.amountPending !== undefined ? toNum(c.amountPending) : Math.max(0, billed - recv);
    
    totalBilled += billed;
    totalRecv += recv;
    totalPend += pend;

    return [
      index + 1,
      c.storeCode || '',
      c.storeName || '',
      c.city || '',
      c.address || '',
      c.cleaningDate || '',
      getDaysOverdue(c.cleaningDate),
      billed,
      recv,
      pend,
      c.paymentStatus || 'Pending',
      c.managerName || '',
      c.managerPhone || '',
      c.teamVendor || 'SK ENTERPRISES',
      c.supervisorName || '',
      c.supervisorPhone || '',
      c.paymentNotes || c.remarks || ''
    ];
  });

  // Summary row at bottom
  const summaryRow = [
    'TOTAL / SUMMARY',
    '',
    '',
    '',
    '',
    '',
    `Total Records: ${pendingList.length}`,
    totalBilled,
    totalRecv,
    totalPend,
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  ];

  const allRows = [...headerRows, columns, ...dataRows, summaryRow];
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  // Styling & Column Widths
  ws['!cols'] = [
    { wch: 6 },  // S.No
    { wch: 14 }, // Store Code
    { wch: 30 }, // Store Name
    { wch: 18 }, // City
    { wch: 42 }, // Address
    { wch: 14 }, // Date
    { wch: 14 }, // Days Overdue
    { wch: 20 }, // Billed
    { wch: 20 }, // Recv
    { wch: 22 }, // Pending
    { wch: 16 }, // Status
    { wch: 20 }, // Manager
    { wch: 16 }, // Manager Phone
    { wch: 22 }, // Vendor
    { wch: 20 }, // Supervisor
    { wch: 16 }, // Sup Phone
    { wch: 35 }  // Remarks
  ];

  // Header merge for clean title
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
    { s: { r: 2, c: 4 }, e: { r: 2, c: 8 } }
  ];

  return ws;
}

// ----------------------------------------------------------------------
// 2. COMPLETED PAYMENTS SHEET BUILDER
// ----------------------------------------------------------------------
export function buildCompletedPaymentsSheet(cleanings = [], filterLabel = 'All Time') {
  const completedList = cleanings.filter(c => 
    c.paymentStatus === 'Received' || 
    c.paymentStatus === 'Completed' ||
    (toNum(c.amountReceived) > 0 && toNum(c.amountPending) <= 0)
  );

  const headerRows = [
    ['SK ENTERPRISES - FACILITY MANAGEMENT & COMMERCIAL CLEANING SERVICES'],
    ['BLINKIT QUICK COMMERCE DARK STORE OPERATIONS - COMPLETED PAYMENTS & SETTLEMENT REGISTER'],
    [`Report Filter Period: ${filterLabel}`, `Generated On: ${new Date().toLocaleString('en-IN')}`, `Total Cleared Entries: ${completedList.length}`],
    []
  ];

  const columns = [
    'S.No',
    'Store Code',
    'Store Name',
    'City / Cluster',
    'Cleaning Date',
    'Payment Settlement Date',
    'Payment Mode',
    'UTR / Transaction Ref No',
    'Invoiced Amount (Rs)',
    'Amount Received (Rs)',
    'Settlement Status',
    'Store Manager',
    'Supervisor Name',
    'Payment Notes & Remarks'
  ];

  let totalBilled = 0;
  let totalRecv = 0;

  const dataRows = completedList.map((c, index) => {
    const billed = toNum(c.amount);
    const recv = toNum(c.amountReceived) || billed;
    totalBilled += billed;
    totalRecv += recv;

    return [
      index + 1,
      c.storeCode || '',
      c.storeName || '',
      c.city || '',
      c.cleaningDate || '',
      c.paymentDate || c.cleaningDate || '',
      c.paymentMode || 'UPI / Bank Transfer',
      c.utrNumber || 'N/A',
      billed,
      recv,
      'Full Paid',
      c.managerName || '',
      c.supervisorName || '',
      c.paymentNotes || c.remarks || ''
    ];
  });

  const summaryRow = [
    'TOTAL / SUMMARY',
    '',
    '',
    '',
    '',
    '',
    '',
    `Total Entries: ${completedList.length}`,
    totalBilled,
    totalRecv,
    '',
    '',
    '',
    ''
  ];

  const allRows = [...headerRows, columns, ...dataRows, summaryRow];
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  ws['!cols'] = [
    { wch: 6 },  // S.No
    { wch: 14 }, // Store Code
    { wch: 30 }, // Store Name
    { wch: 18 }, // City
    { wch: 14 }, // Clean Date
    { wch: 18 }, // Payment Date
    { wch: 16 }, // Mode
    { wch: 25 }, // UTR
    { wch: 20 }, // Billed
    { wch: 20 }, // Recv
    { wch: 16 }, // Status
    { wch: 20 }, // Manager
    { wch: 20 }, // Supervisor
    { wch: 35 }  // Remarks
  ];

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
    { s: { r: 2, c: 4 }, e: { r: 2, c: 7 } }
  ];

  return ws;
}

// ----------------------------------------------------------------------
// 3. ALL CLEANING RECORDS SHEET BUILDER
// ----------------------------------------------------------------------
export function buildAllCleaningsSheet(cleanings = [], filterLabel = 'All Time') {
  const headerRows = [
    ['SK ENTERPRISES - FACILITY MANAGEMENT & COMMERCIAL CLEANING SERVICES'],
    ['BLINKIT QUICK COMMERCE DARK STORE OPERATIONS - ALL CLEANING RECORDS MASTER REGISTER'],
    [`Report Filter Period: ${filterLabel}`, `Generated On: ${new Date().toLocaleString('en-IN')}`, `Total Cleaning Executions: ${cleanings.length}`],
    []
  ];

  const columns = [
    'S.No',
    'Store Code',
    'Store Name',
    'City / Cluster',
    'Store Address',
    'Google Maps Link',
    'Cleaning Date',
    'Shift',
    'Start Time',
    'End Time',
    'Duration (Hours)',
    'Service Vendor',
    'Supervisor Name',
    'Supervisor Phone',
    'Team Members Deployed',
    'Headcount',
    'Scope of Work Executed',
    'Cleaning Status',
    'Audit Rating (1-5)',
    'Invoice Total (Rs)',
    'Amount Received (Rs)',
    'Amount Pending (Rs)',
    'Payment Status',
    'Payment Mode',
    'Payment Date',
    'UTR / Transaction Ref',
    'Photos Attached',
    'Manager Signature Exists',
    'Supervisor Remarks'
  ];

  let totalBilled = 0;
  let totalRecv = 0;
  let totalPend = 0;

  const dataRows = cleanings.map((c, index) => {
    const billed = toNum(c.amount);
    const recv = toNum(c.amountReceived);
    const pend = c.amountPending !== undefined ? toNum(c.amountPending) : Math.max(0, billed - recv);
    
    totalBilled += billed;
    totalRecv += recv;
    totalPend += pend;

    const scopeStr = Array.isArray(c.scopeOfWork) 
      ? c.scopeOfWork.join(', ') 
      : 'Floor Deep Cleaning, Toilet, Cold Storage, Wall Dry Rust Removal';

    return [
      index + 1,
      c.storeCode || '',
      c.storeName || '',
      c.city || '',
      c.address || '',
      c.googleMapsUrl || '',
      c.cleaningDate || '',
      c.shift || 'Night Shift',
      c.startTime || '',
      c.endTime || '',
      c.durationHours || '',
      c.teamVendor || 'SK ENTERPRISES',
      c.supervisorName || '',
      c.supervisorPhone || '',
      c.teamMembers || '',
      c.headcount || 1,
      scopeStr,
      c.status || 'Completed',
      c.rating || 5,
      billed,
      recv,
      pend,
      c.paymentStatus || 'Pending',
      c.paymentMode || '',
      c.paymentDate || '',
      c.utrNumber || '',
      (c.photos && c.photos.length) || 0,
      c.managerSignature ? 'YES' : 'NO',
      c.remarks || c.paymentNotes || ''
    ];
  });

  const summaryRow = [
    'TOTAL / SUMMARY',
    '',
    '',
    '',
    '',
    '',
    `Total Cleanings: ${cleanings.length}`,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    totalBilled,
    totalRecv,
    totalPend,
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  ];

  const allRows = [...headerRows, columns, ...dataRows, summaryRow];
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  ws['!cols'] = [
    { wch: 6 },  // S.No
    { wch: 14 }, // Code
    { wch: 30 }, // Name
    { wch: 18 }, // City
    { wch: 40 }, // Address
    { wch: 32 }, // Maps
    { wch: 14 }, // Date
    { wch: 20 }, // Shift
    { wch: 12 }, // Start
    { wch: 12 }, // End
    { wch: 15 }, // Duration
    { wch: 22 }, // Vendor
    { wch: 20 }, // Supervisor
    { wch: 16 }, // Sup Phone
    { wch: 32 }, // Team
    { wch: 10 }, // Headcount
    { wch: 45 }, // Scope
    { wch: 16 }, // Status
    { wch: 16 }, // Rating
    { wch: 20 }, // Billed
    { wch: 20 }, // Recv
    { wch: 20 }, // Pend
    { wch: 16 }, // Pay Status
    { wch: 14 }, // Mode
    { wch: 14 }, // Pay Date
    { wch: 24 }, // UTR
    { wch: 15 }, // Photos
    { wch: 18 }, // Signature
    { wch: 35 }  // Remarks
  ];

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
    { s: { r: 2, c: 5 }, e: { r: 2, c: 10 } }
  ];

  return ws;
}

// ----------------------------------------------------------------------
// 4. STORE-WISE PERFORMANCE & FINANCIAL LEDGER SHEET BUILDER
// ----------------------------------------------------------------------
export function buildStorePerformanceSheet(cleanings = [], stores = [], filterLabel = 'All Time') {
  // Aggregate cleanings by store
  const storeMap = new Map();

  // First populate registered stores
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
        lastCleanDate: '',
        status: 'No Cleanings'
      });
    }
  });

  // Then add/update from cleanings
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
        lastCleanDate: '',
        status: 'Pending'
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

  const storeRows = Array.from(storeMap.values()).map(item => {
    let financialStatus = 'All Cleared';
    if (item.cleaningsCount === 0) financialStatus = 'Not Started';
    else if (item.totalPending > 0) financialStatus = `Pending Dues (Rs ${item.totalPending})`;

    return {
      ...item,
      financialStatus
    };
  });

  const headerRows = [
    ['SK ENTERPRISES - FACILITY MANAGEMENT & COMMERCIAL CLEANING SERVICES'],
    ['BLINKIT QUICK COMMERCE DARK STORE OPERATIONS - STORE-WISE PERFORMANCE & LEDGER'],
    [`Report Filter Period: ${filterLabel}`, `Generated On: ${new Date().toLocaleString('en-IN')}`, `Total Stores: ${storeRows.length}`],
    []
  ];

  const columns = [
    'S.No',
    'Store Code',
    'Store Name',
    'City / Cluster',
    'Store Manager',
    'Manager Phone',
    'Cleanings Executed',
    'Total Invoiced (Rs)',
    'Total Received (Rs)',
    'Outstanding Balance (Rs)',
    'Financial Settlement Status',
    'Last Cleaning Date'
  ];

  let sumCleanings = 0;
  let sumBilled = 0;
  let sumRecv = 0;
  let sumPend = 0;

  const dataRows = storeRows.map((s, index) => {
    sumCleanings += s.cleaningsCount;
    sumBilled += s.totalBilled;
    sumRecv += s.totalReceived;
    sumPend += s.totalPending;

    return [
      index + 1,
      s.code,
      s.name,
      s.city,
      s.manager,
      s.phone,
      s.cleaningsCount,
      s.totalBilled,
      s.totalReceived,
      s.totalPending,
      s.financialStatus,
      s.lastCleanDate || '-'
    ];
  });

  const summaryRow = [
    'TOTAL / SUMMARY',
    '',
    '',
    '',
    '',
    `Total Stores: ${storeRows.length}`,
    sumCleanings,
    sumBilled,
    sumRecv,
    sumPend,
    '',
    ''
  ];

  const allRows = [...headerRows, columns, ...dataRows, summaryRow];
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  ws['!cols'] = [
    { wch: 6 },  // S.No
    { wch: 14 }, // Code
    { wch: 30 }, // Name
    { wch: 18 }, // City
    { wch: 20 }, // Manager
    { wch: 16 }, // Phone
    { wch: 18 }, // Cleanings
    { wch: 20 }, // Billed
    { wch: 20 }, // Recv
    { wch: 24 }, // Pending
    { wch: 28 }, // Status
    { wch: 18 }  // Last Clean Date
  ];

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
    { s: { r: 2, c: 4 }, e: { r: 2, c: 6 } }
  ];

  return ws;
}

// ----------------------------------------------------------------------
// 5. EXECUTIVE SUMMARY SHEET BUILDER
// ----------------------------------------------------------------------
export function buildExecutiveSummarySheet(cleanings = [], stores = [], filterLabel = 'All Time') {
  const totalCleanings = cleanings.length;
  const totalBilled = cleanings.reduce((sum, c) => sum + toNum(c.amount), 0);
  const totalReceived = cleanings.reduce((sum, c) => sum + toNum(c.amountReceived), 0);
  const totalPending = cleanings.reduce((sum, c) => {
    const pend = c.amountPending !== undefined ? toNum(c.amountPending) : Math.max(0, toNum(c.amount) - toNum(c.amountReceived));
    return sum + pend;
  }, 0);

  const collectionRate = totalBilled > 0 ? ((totalReceived / totalBilled) * 100).toFixed(1) + '%' : '0%';
  const paidCleaningsCount = cleanings.filter(c => c.paymentStatus === 'Received' || c.paymentStatus === 'Completed' || (toNum(c.amountReceived) > 0 && toNum(c.amountPending) <= 0)).length;
  const pendingCleaningsCount = cleanings.filter(c => c.paymentStatus === 'Pending' || c.paymentStatus === 'Partial' || (toNum(c.amountPending) > 0)).length;

  // Monthly breakdown
  const monthMap = new Map();
  cleanings.forEach(c => {
    const dStr = c.cleaningDate || '';
    const mKey = dStr ? dStr.substring(0, 7) : 'Unknown';
    let mObj = monthMap.get(mKey);
    if (!mObj) {
      mObj = { month: mKey, count: 0, billed: 0, recv: 0, pend: 0 };
      monthMap.set(mKey, mObj);
    }
    const billed = toNum(c.amount);
    const recv = toNum(c.amountReceived);
    const pend = c.amountPending !== undefined ? toNum(c.amountPending) : Math.max(0, billed - recv);
    mObj.count += 1;
    mObj.billed += billed;
    mObj.recv += recv;
    mObj.pend += pend;
  });

  const monthRows = Array.from(monthMap.entries()).sort((a, b) => b[0].localeCompare(a[0])).map(([mKey, data]) => {
    const rate = data.billed > 0 ? ((data.recv / data.billed) * 100).toFixed(1) + '%' : '0%';
    return [
      data.month,
      data.count,
      data.billed,
      data.recv,
      data.pend,
      rate
    ];
  });

  const rows = [
    ['SK ENTERPRISES - FACILITY MANAGEMENT & COMMERCIAL CLEANING SERVICES'],
    ['BLINKIT QUICK COMMERCE DARK STORE OPERATIONS - EXECUTIVE AUDIT & FINANCIAL SUMMARY'],
    [`Report Filter Period: ${filterLabel}`, `Generated On: ${new Date().toLocaleString('en-IN')}`],
    [],
    ['KEY PERFORMANCE INDICATORS (KPIs)', 'VALUE / AMOUNT', 'REMARKS & AUDIT NOTES'],
    ['Total Registered Dark Stores', stores.length || cleanings.length, 'Active Stores in Operations System'],
    ['Total Deep Cleanings Executed', totalCleanings, 'Verified Work Completion Records'],
    ['Total Gross Invoiced Billing (Rs)', totalBilled, 'Total Amount Billed to Blinkit Stores'],
    ['Total Realized Payments Received (Rs)', totalReceived, 'Payments Successfully Verified & Settled'],
    ['Total Outstanding Pending Amount (Rs)', totalPending, 'Unpaid / Overdue Balance Pending Collection'],
    ['Payment Collection Efficiency Rate', collectionRate, 'Percentage of Invoiced Value Realized'],
    ['Fully Settled Cleanings', paidCleaningsCount, 'Cleanings with Full Cleared Payments'],
    ['Pending / Partial Cleanings', pendingCleaningsCount, 'Cleanings Requiring Payment Follow-up'],
    [],
    ['MONTH-WISE FINANCIAL BREAKDOWN'],
    ['Billing Month (YYYY-MM)', 'Cleanings Count', 'Invoiced Amount (Rs)', 'Amount Received (Rs)', 'Amount Pending (Rs)', 'Collection Rate (%)'],
    ...monthRows,
    [],
    ['AUTHORIZED SIGNATORY & AUDIT NOTICE'],
    ['This report is an official financial ledger extract from the Blinkit Deep Cleaning Operations Portal.'],
    ['For any billing discrepancies, contact SK Enterprises Accounts at skenterprises.clean@gmail.com / 09594023629.']
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);

  ws['!cols'] = [
    { wch: 38 },
    { wch: 25 },
    { wch: 45 },
    { wch: 22 },
    { wch: 22 },
    { wch: 20 }
  ];

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } },
    { s: { r: 2, c: 3 }, e: { r: 2, c: 4 } }
  ];

  return ws;
}

// ----------------------------------------------------------------------
// EXPORT FUNCTIONS: MASTER WORKBOOK & INDIVIDUAL SHEETS
// ----------------------------------------------------------------------

/**
 * Downloads a comprehensive multi-sheet Excel workbook containing all 5 reports.
 */
export function exportMasterExcel(cleanings = [], stores = [], filterLabel = 'All Time', filename = '') {
  if (!cleanings || cleanings.length === 0) {
    alert('No cleaning records available for export!');
    return;
  }

  const defaultFilename = `Blinkit_DeepCleaning_Master_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const wb = XLSX.utils.book_new();

  // 1. Executive Summary
  const wsSummary = buildExecutiveSummarySheet(cleanings, stores, filterLabel);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');

  // 2. Pending Payments
  const wsPending = buildPendingPaymentsSheet(cleanings, filterLabel);
  XLSX.utils.book_append_sheet(wb, wsPending, 'Pending Payments');

  // 3. Completed Payments
  const wsCompleted = buildCompletedPaymentsSheet(cleanings, filterLabel);
  XLSX.utils.book_append_sheet(wb, wsCompleted, 'Completed Payments');

  // 4. All Cleaning Records
  const wsAll = buildAllCleaningsSheet(cleanings, filterLabel);
  XLSX.utils.book_append_sheet(wb, wsAll, 'All Cleaning Records');

  // 5. Store-Wise Performance
  const wsStore = buildStorePerformanceSheet(cleanings, stores, filterLabel);
  XLSX.utils.book_append_sheet(wb, wsStore, 'Store-Wise Summary');

  XLSX.writeFile(wb, filename || defaultFilename);
}

/**
 * Downloads dedicated Pending Payments Excel report.
 */
export function exportPendingPaymentsExcel(cleanings = [], filterLabel = 'All Time', filename = '') {
  const wb = XLSX.utils.book_new();
  const ws = buildPendingPaymentsSheet(cleanings, filterLabel);
  XLSX.utils.book_append_sheet(wb, ws, 'Pending Payments');
  XLSX.writeFile(wb, filename || `Blinkit_Pending_Payments_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Downloads dedicated Completed Payments Excel report.
 */
export function exportCompletedPaymentsExcel(cleanings = [], filterLabel = 'All Time', filename = '') {
  const wb = XLSX.utils.book_new();
  const ws = buildCompletedPaymentsSheet(cleanings, filterLabel);
  XLSX.utils.book_append_sheet(wb, ws, 'Completed Payments');
  XLSX.writeFile(wb, filename || `Blinkit_Completed_Payments_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Downloads dedicated All Cleaning Records Excel register.
 */
export function exportAllCleaningsExcel(cleanings = [], filterLabel = 'All Time', filename = '') {
  const wb = XLSX.utils.book_new();
  const ws = buildAllCleaningsSheet(cleanings, filterLabel);
  XLSX.utils.book_append_sheet(wb, ws, 'All Cleanings');
  XLSX.writeFile(wb, filename || `Blinkit_All_Cleanings_Register_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Downloads dedicated Store Performance Excel ledger.
 */
export function exportStorePerformanceExcel(cleanings = [], stores = [], filterLabel = 'All Time', filename = '') {
  const wb = XLSX.utils.book_new();
  const ws = buildStorePerformanceSheet(cleanings, stores, filterLabel);
  XLSX.utils.book_append_sheet(wb, ws, 'Store Performance');
  XLSX.writeFile(wb, filename || `Blinkit_Store_Performance_Ledger_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
