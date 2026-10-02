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

// Helper: Convert 0-indexed column number to Excel column letters (A, B, ..., Z, AA, AB...)
const getColLetter = (c) => {
  let s = '';
  let temp = c;
  while (temp >= 0) {
    s = String.fromCharCode((temp % 26) + 65) + s;
    temp = Math.floor(temp / 26) - 1;
  }
  return s;
};

/**
 * Enriches a SheetJS worksheet with interactive formatting:
 * - Excel AutoFilter dropdowns on the column header row
 * - Frozen panes so column headers stay pinned during vertical scrolling
 * - Currency number formats ('₹'#,##0)
 * - Standard integer number formats (#,##0)
 */
function enrichInteractiveSheet(ws, {
  headerRowIndex,       // 0-indexed row of table column headers
  totalColumns,         // Total count of columns
  totalRows,            // Total count of rows in worksheet
  currencyColIndices = [], // 0-indexed column indices with money amounts
  numberColIndices = []    // 0-indexed column indices with integer counts
}) {
  if (!ws) return;

  const lastColLetter = getColLetter(totalColumns - 1);
  const headerExcelRow = headerRowIndex + 1; // 1-indexed

  // 1. Enable interactive AutoFilter dropdowns on column headers
  ws['!autofilter'] = { ref: `A${headerExcelRow}:${lastColLetter}${totalRows}` };

  // 2. Freeze panes at header row for high-productivity desktop & mobile scrolling
  ws['!views'] = [{ state: 'frozen', ySplit: headerExcelRow }];

  // 3. Apply professional number formatting to all data cells
  for (let r = headerExcelRow + 1; r <= totalRows; r++) {
    currencyColIndices.forEach(colIdx => {
      const cellRef = `${getColLetter(colIdx)}${r}`;
      if (ws[cellRef] && typeof ws[cellRef].v === 'number') {
        ws[cellRef].t = 'n';
        ws[cellRef].z = '"₹"#,##0';
      }
    });

    numberColIndices.forEach(colIdx => {
      const cellRef = `${getColLetter(colIdx)}${r}`;
      if (ws[cellRef] && typeof ws[cellRef].v === 'number') {
        ws[cellRef].t = 'n';
        ws[cellRef].z = '#,##0';
      }
    });
  }
}

// ----------------------------------------------------------------------
// 1. PENDING PAYMENTS SHEET BUILDER (Store Manager / Contact Removed)
// ----------------------------------------------------------------------
export function buildPendingPaymentsSheet(cleanings = [], filterLabel = 'All Time') {
  const pendingList = cleanings.filter(c => 
    c.paymentStatus === 'Pending' || 
    c.paymentStatus === 'Partial' || 
    (toNum(c.amountPending) > 0) ||
    (toNum(c.amount) - toNum(c.amountReceived) > 0)
  );

  let totalBilled = 0;
  let totalRecv = 0;
  let totalPend = 0;

  pendingList.forEach(c => {
    const billed = toNum(c.amount);
    const recv = toNum(c.amountReceived);
    const pend = c.amountPending !== undefined ? toNum(c.amountPending) : Math.max(0, billed - recv);
    totalBilled += billed;
    totalRecv += recv;
    totalPend += pend;
  });

  const headerRows = [
    ['SK ENTERPRISES - FACILITY MANAGEMENT & COMMERCIAL CLEANING SERVICES'],
    ['BLINKIT QUICK COMMERCE DARK STORE OPERATIONS - PENDING PAYMENTS & OUTSTANDING LEDGER'],
    [`Report Filter Period: ${filterLabel}`, `Generated On: ${new Date().toLocaleString('en-IN')}`, `Total Pending Stores: ${pendingList.length}`],
    [],
    // Interactive Summary KPI Scorecard Block
    ['EXECUTIVE PENDING DUES SCORECARD', '', '', '', ''],
    ['Total Pending Stores', pendingList.length, 'Total Gross Invoiced', totalBilled, 'Total Amount Received', totalRecv, 'Total Outstanding Pending Dues', totalPend],
    [] // Blank line before table
  ];

  // Note: Store Manager Name & Contact Number permanently removed per requirement
  const columns = [
    'S.No',
    'Store Code',
    'Store Name',
    'City / Cluster',
    'Store Address',
    'Cleaning Date',
    'Aging / Days Overdue',
    'Invoiced Amount (Rs)',
    'Amount Received (Rs)',
    'Amount Pending (Rs)',
    'Payment Status',
    'Service Vendor',
    'Supervisor Name',
    'Supervisor Phone',
    'Payment Notes & Remarks'
  ];

  const dataRows = pendingList.map((c, index) => {
    const billed = toNum(c.amount);
    const recv = toNum(c.amountReceived);
    const pend = c.amountPending !== undefined ? toNum(c.amountPending) : Math.max(0, billed - recv);

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
      c.teamVendor || 'SK ENTERPRISES',
      c.supervisorName || '',
      c.supervisorPhone || '',
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
    `Total Records: ${pendingList.length}`,
    totalBilled,
    totalRecv,
    totalPend,
    'OVERDUE',
    '',
    '',
    '',
    ''
  ];

  const allRows = [...headerRows, columns, ...dataRows, summaryRow];
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  ws['!cols'] = [
    { wch: 6 },  // S.No
    { wch: 15 }, // Store Code
    { wch: 32 }, // Store Name
    { wch: 18 }, // City
    { wch: 42 }, // Address
    { wch: 15 }, // Date
    { wch: 18 }, // Aging
    { wch: 22 }, // Billed
    { wch: 22 }, // Recv
    { wch: 24 }, // Pending
    { wch: 16 }, // Status
    { wch: 22 }, // Vendor
    { wch: 20 }, // Supervisor
    { wch: 18 }, // Sup Phone
    { wch: 35 }  // Remarks
  ];

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
    { s: { r: 2, c: 5 }, e: { r: 2, c: 9 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 7 } }
  ];

  // Enrich with AutoFilter & Number Formatting
  enrichInteractiveSheet(ws, {
    headerRowIndex: 7, // 0-indexed row of 'columns'
    totalColumns: columns.length,
    totalRows: allRows.length,
    currencyColIndices: [7, 8, 9],
    numberColIndices: [0, 6]
  });

  return ws;
}

// ----------------------------------------------------------------------
// 2. COMPLETED PAYMENTS SHEET BUILDER (Store Manager Removed)
// ----------------------------------------------------------------------
export function buildCompletedPaymentsSheet(cleanings = [], filterLabel = 'All Time') {
  const completedList = cleanings.filter(c => 
    c.paymentStatus === 'Received' || 
    c.paymentStatus === 'Completed' ||
    (toNum(c.amountReceived) > 0 && toNum(c.amountPending) <= 0)
  );

  let totalBilled = 0;
  let totalRecv = 0;

  completedList.forEach(c => {
    const billed = toNum(c.amount);
    const recv = toNum(c.amountReceived) || billed;
    totalBilled += billed;
    totalRecv += recv;
  });

  const headerRows = [
    ['SK ENTERPRISES - FACILITY MANAGEMENT & COMMERCIAL CLEANING SERVICES'],
    ['BLINKIT QUICK COMMERCE DARK STORE OPERATIONS - COMPLETED PAYMENTS & SETTLEMENT REGISTER'],
    [`Report Filter Period: ${filterLabel}`, `Generated On: ${new Date().toLocaleString('en-IN')}`, `Total Cleared Entries: ${completedList.length}`],
    [],
    ['EXECUTIVE SETTLEMENT SUMMARY SCORECARD', '', '', '', ''],
    ['Total Cleared Entries', completedList.length, 'Total Invoiced Value', totalBilled, 'Total Realized Collection', totalRecv, 'Collection Realization', '100% Cleared'],
    []
  ];

  // Note: Store Manager removed per requirement
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
    'Supervisor Name',
    'Payment Notes & Remarks'
  ];

  const dataRows = completedList.map((c, index) => {
    const billed = toNum(c.amount);
    const recv = toNum(c.amountReceived) || billed;

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
    'SETTLED',
    '',
    ''
  ];

  const allRows = [...headerRows, columns, ...dataRows, summaryRow];
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  ws['!cols'] = [
    { wch: 6 },  // S.No
    { wch: 15 }, // Store Code
    { wch: 32 }, // Store Name
    { wch: 18 }, // City
    { wch: 15 }, // Clean Date
    { wch: 18 }, // Payment Date
    { wch: 18 }, // Mode
    { wch: 28 }, // UTR
    { wch: 22 }, // Billed
    { wch: 22 }, // Recv
    { wch: 16 }, // Status
    { wch: 20 }, // Supervisor
    { wch: 35 }  // Remarks
  ];

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
    { s: { r: 2, c: 4 }, e: { r: 2, c: 8 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 7 } }
  ];

  enrichInteractiveSheet(ws, {
    headerRowIndex: 7,
    totalColumns: columns.length,
    totalRows: allRows.length,
    currencyColIndices: [8, 9],
    numberColIndices: [0]
  });

  return ws;
}

// ----------------------------------------------------------------------
// 3. ALL CLEANING RECORDS SHEET BUILDER
//    Options: includeFinancials = true (With Amount) | false (Without Amount)
//    Store Manager & Contact Number Removed
// ----------------------------------------------------------------------
export function buildAllCleaningsSheet(cleanings = [], filterLabel = 'All Time', { includeFinancials = true } = {}) {
  let totalBilled = 0;
  let totalRecv = 0;
  let totalPend = 0;

  cleanings.forEach(c => {
    const billed = toNum(c.amount);
    const recv = toNum(c.amountReceived);
    const pend = c.amountPending !== undefined ? toNum(c.amountPending) : Math.max(0, billed - recv);
    totalBilled += billed;
    totalRecv += recv;
    totalPend += pend;
  });

  const subtitle = includeFinancials
    ? 'BLINKIT QUICK COMMERCE DARK STORE OPERATIONS - ALL CLEANING RECORDS & FINANCIAL AUDIT MASTER'
    : 'BLINKIT QUICK COMMERCE DARK STORE OPERATIONS - ALL CLEANING OPERATIONS REGISTER (OPERATIONAL ONLY)';

  const headerRows = [
    ['SK ENTERPRISES - FACILITY MANAGEMENT & COMMERCIAL CLEANING SERVICES'],
    [subtitle],
    [`Report Filter Period: ${filterLabel}`, `Generated On: ${new Date().toLocaleString('en-IN')}`, `Total Cleaning Records: ${cleanings.length}`],
    []
  ];

  if (includeFinancials) {
    headerRows.push(
      ['EXECUTIVE OPERATIONS & FINANCIAL SCORECARD', '', '', '', ''],
      ['Total Cleanings', cleanings.length, 'Total Gross Invoiced', totalBilled, 'Total Amount Received', totalRecv, 'Total Dues Pending', totalPend],
      []
    );
  } else {
    headerRows.push(
      ['EXECUTIVE OPERATIONS SCORECARD (NON-FINANCIAL)', '', '', '', ''],
      ['Total Cleanings Executed', cleanings.length, 'Verified 100%', 'Facility Audit Status', 'Fully Logged', 'Shift Coverage', 'Day & Night Active'],
      []
    );
  }

  // Define columns based on financial mode (Store Manager & Phone removed in both)
  let columns = [];
  if (includeFinancials) {
    columns = [
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
      'Manager Signature Verified',
      'Supervisor Remarks'
    ];
  } else {
    // Pure Operational Mode - Zero Financial Data
    columns = [
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
      'Photos Attached',
      'Manager Signature Verified',
      'Supervisor Remarks'
    ];
  }

  const dataRows = cleanings.map((c, index) => {
    const billed = toNum(c.amount);
    const recv = toNum(c.amountReceived);
    const pend = c.amountPending !== undefined ? toNum(c.amountPending) : Math.max(0, billed - recv);

    const scopeStr = Array.isArray(c.scopeOfWork) 
      ? c.scopeOfWork.join(', ') 
      : 'Floor Deep Cleaning, Toilet, Cold Storage, Wall Dry Rust Removal';

    const baseRow = [
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
      c.rating || 5
    ];

    if (includeFinancials) {
      return [
        ...baseRow,
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
    } else {
      return [
        ...baseRow,
        (c.photos && c.photos.length) || 0,
        c.managerSignature ? 'YES' : 'NO',
        c.remarks || c.paymentNotes || ''
      ];
    }
  });

  let summaryRow = [];
  if (includeFinancials) {
    summaryRow = [
      'TOTAL / SUMMARY',
      '',
      '',
      '',
      '',
      '',
      `Total: ${cleanings.length}`,
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
  } else {
    summaryRow = [
      'TOTAL / SUMMARY',
      '',
      '',
      '',
      '',
      '',
      `Total Records: ${cleanings.length}`,
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
      'ALL COMPLETED',
      '',
      '',
      '',
      ''
    ];
  }

  const allRows = [...headerRows, columns, ...dataRows, summaryRow];
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  if (includeFinancials) {
    ws['!cols'] = [
      { wch: 6 },  // S.No
      { wch: 15 }, // Code
      { wch: 32 }, // Name
      { wch: 18 }, // City
      { wch: 40 }, // Address
      { wch: 32 }, // Maps
      { wch: 15 }, // Date
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
      { wch: 22 }, // Billed
      { wch: 22 }, // Recv
      { wch: 22 }, // Pend
      { wch: 16 }, // Pay Status
      { wch: 14 }, // Mode
      { wch: 14 }, // Pay Date
      { wch: 24 }, // UTR
      { wch: 15 }, // Photos
      { wch: 18 }, // Signature
      { wch: 35 }  // Remarks
    ];
  } else {
    ws['!cols'] = [
      { wch: 6 },  // S.No
      { wch: 15 }, // Code
      { wch: 32 }, // Name
      { wch: 18 }, // City
      { wch: 40 }, // Address
      { wch: 32 }, // Maps
      { wch: 15 }, // Date
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
      { wch: 15 }, // Photos
      { wch: 18 }, // Signature
      { wch: 35 }  // Remarks
    ];
  }

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
    { s: { r: 2, c: 5 }, e: { r: 2, c: 8 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 7 } }
  ];

  enrichInteractiveSheet(ws, {
    headerRowIndex: 7,
    totalColumns: columns.length,
    totalRows: allRows.length,
    currencyColIndices: includeFinancials ? [19, 20, 21] : [],
    numberColIndices: includeFinancials ? [0, 15, 18, 26] : [0, 15, 18, 19]
  });

  return ws;
}

// ----------------------------------------------------------------------
// 4. STORE-WISE PERFORMANCE SHEET BUILDER
//    Options: includeFinancials = true (With Amount) | false (Without Amount)
//    Store Manager & Contact Number Removed
// ----------------------------------------------------------------------
export function buildStorePerformanceSheet(cleanings = [], stores = [], filterLabel = 'All Time', { includeFinancials = true } = {}) {
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
        lastCleanDate: '',
        status: 'No Cleanings'
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

  let sumCleanings = 0;
  let sumBilled = 0;
  let sumRecv = 0;
  let sumPend = 0;

  storeRows.forEach(s => {
    sumCleanings += s.cleaningsCount;
    sumBilled += s.totalBilled;
    sumRecv += s.totalReceived;
    sumPend += s.totalPending;
  });

  const subtitle = includeFinancials
    ? 'BLINKIT QUICK COMMERCE DARK STORE OPERATIONS - STORE PERFORMANCE & FINANCIAL LEDGER'
    : 'BLINKIT QUICK COMMERCE DARK STORE OPERATIONS - STORE SERVICE AUDIT & FREQUENCY REGISTER (OPERATIONAL ONLY)';

  const headerRows = [
    ['SK ENTERPRISES - FACILITY MANAGEMENT & COMMERCIAL CLEANING SERVICES'],
    [subtitle],
    [`Report Filter Period: ${filterLabel}`, `Generated On: ${new Date().toLocaleString('en-IN')}`, `Total Stores: ${storeRows.length}`],
    []
  ];

  if (includeFinancials) {
    headerRows.push(
      ['EXECUTIVE STORE PERFORMANCE SCORECARD', '', '', '', ''],
      ['Total Registered Stores', storeRows.length, 'Total Cleanings Executed', sumCleanings, 'Total Invoiced Billing', sumBilled, 'Total Outstanding Balance', sumPend],
      []
    );
  } else {
    headerRows.push(
      ['EXECUTIVE STORE AUDIT SCORECARD (NON-FINANCIAL)', '', '', '', ''],
      ['Total Registered Stores', storeRows.length, 'Cleanings Completed', sumCleanings, 'Coverage Rate', '100% Monitored', 'Audit Status', 'Operational'],
      []
    );
  }

  let columns = [];
  if (includeFinancials) {
    columns = [
      'S.No',
      'Store Code',
      'Store Name',
      'City / Cluster',
      'Store Address',
      'Cleanings Executed',
      'Total Invoiced (Rs)',
      'Total Received (Rs)',
      'Outstanding Balance (Rs)',
      'Financial Settlement Status',
      'Last Cleaning Date'
    ];
  } else {
    columns = [
      'S.No',
      'Store Code',
      'Store Name',
      'City / Cluster',
      'Store Address',
      'Cleanings Executed',
      'Last Cleaning Date',
      'Cleaning Cycle Frequency',
      'Operational Status'
    ];
  }

  const dataRows = storeRows.map((s, index) => {
    if (includeFinancials) {
      return [
        index + 1,
        s.code,
        s.name,
        s.city,
        s.address || '-',
        s.cleaningsCount,
        s.totalBilled,
        s.totalReceived,
        s.totalPending,
        s.financialStatus,
        s.lastCleanDate || '-'
      ];
    } else {
      let cycle = 'Every 30 Days';
      let opStatus = s.cleaningsCount > 0 ? 'Active / Serviced' : 'Pending First Cycle';
      return [
        index + 1,
        s.code,
        s.name,
        s.city,
        s.address || '-',
        s.cleaningsCount,
        s.lastCleanDate || '-',
        cycle,
        opStatus
      ];
    }
  });

  let summaryRow = [];
  if (includeFinancials) {
    summaryRow = [
      'TOTAL / SUMMARY',
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
  } else {
    summaryRow = [
      'TOTAL / SUMMARY',
      '',
      '',
      '',
      `Total Stores: ${storeRows.length}`,
      sumCleanings,
      '',
      '',
      'ALL STORES AUDITED'
    ];
  }

  const allRows = [...headerRows, columns, ...dataRows, summaryRow];
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  if (includeFinancials) {
    ws['!cols'] = [
      { wch: 6 },  // S.No
      { wch: 15 }, // Code
      { wch: 32 }, // Name
      { wch: 18 }, // City
      { wch: 38 }, // Address
      { wch: 18 }, // Cleanings
      { wch: 22 }, // Billed
      { wch: 22 }, // Recv
      { wch: 24 }, // Pending
      { wch: 28 }, // Status
      { wch: 18 }  // Last Clean Date
    ];
  } else {
    ws['!cols'] = [
      { wch: 6 },  // S.No
      { wch: 15 }, // Code
      { wch: 32 }, // Name
      { wch: 18 }, // City
      { wch: 38 }, // Address
      { wch: 18 }, // Cleanings
      { wch: 18 }, // Last Clean Date
      { wch: 24 }, // Cycle
      { wch: 24 }  // Op Status
    ];
  }

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
    { s: { r: 2, c: 4 }, e: { r: 2, c: 7 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 7 } }
  ];

  enrichInteractiveSheet(ws, {
    headerRowIndex: 7,
    totalColumns: columns.length,
    totalRows: allRows.length,
    currencyColIndices: includeFinancials ? [6, 7, 8] : [],
    numberColIndices: [0, 5]
  });

  return ws;
}

// ----------------------------------------------------------------------
// 5. EXECUTIVE SUMMARY SHEET BUILDER (No Store Manager / Contact)
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
 * Store Manager and Contact details are permanently omitted.
 */
export function exportMasterExcel(cleanings = [], stores = [], filterLabel = 'All Time', filename = '') {
  if (!cleanings || cleanings.length === 0) {
    alert('No cleaning records available for export!');
    return;
  }

  const defaultFilename = `Blinkit_DeepCleaning_Master_Package_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const wb = XLSX.utils.book_new();

  // 1. Executive Summary
  const wsSummary = buildExecutiveSummarySheet(cleanings, stores, filterLabel);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');

  // 2. Pending Payments (No Store Manager / Contact)
  const wsPending = buildPendingPaymentsSheet(cleanings, filterLabel);
  XLSX.utils.book_append_sheet(wb, wsPending, 'Pending Payments');

  // 3. Completed Payments (No Store Manager)
  const wsCompleted = buildCompletedPaymentsSheet(cleanings, filterLabel);
  XLSX.utils.book_append_sheet(wb, wsCompleted, 'Completed Payments');

  // 4. All Cleaning Records (With Financials)
  const wsAll = buildAllCleaningsSheet(cleanings, filterLabel, { includeFinancials: true });
  XLSX.utils.book_append_sheet(wb, wsAll, 'All Cleaning Records');

  // 5. Store-Wise Performance (With Financials)
  const wsStore = buildStorePerformanceSheet(cleanings, stores, filterLabel, { includeFinancials: true });
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
 * Supports options: { includeFinancials: true | false } or direct filename string
 */
export function exportAllCleaningsExcel(cleanings = [], filterLabel = 'All Time', options = { includeFinancials: true }, filename = '') {
  let opts = options;
  let targetFile = filename;
  if (typeof options === 'string') {
    targetFile = options;
    opts = { includeFinancials: true };
  } else if (!opts || typeof opts !== 'object') {
    opts = { includeFinancials: true };
  }

  const wb = XLSX.utils.book_new();
  const ws = buildAllCleaningsSheet(cleanings, filterLabel, opts);
  const sheetName = opts.includeFinancials ? 'All Cleanings & Financials' : 'All Cleanings (Operations)';
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const defaultName = opts.includeFinancials
    ? `Blinkit_All_Cleanings_Financial_${new Date().toISOString().slice(0, 10)}.xlsx`
    : `Blinkit_All_Cleanings_Operational_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, targetFile || defaultName);
}

/**
 * Downloads dedicated Store Performance Excel ledger.
 * Supports options: { includeFinancials: true | false } or direct filename string
 */
export function exportStorePerformanceExcel(cleanings = [], stores = [], filterLabel = 'All Time', options = { includeFinancials: true }, filename = '') {
  let opts = options;
  let targetFile = filename;
  if (typeof options === 'string') {
    targetFile = options;
    opts = { includeFinancials: true };
  } else if (!opts || typeof opts !== 'object') {
    opts = { includeFinancials: true };
  }

  const wb = XLSX.utils.book_new();
  const ws = buildStorePerformanceSheet(cleanings, stores, filterLabel, opts);
  const sheetName = opts.includeFinancials ? 'Store Performance Ledger' : 'Store Operations Audit';
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const defaultName = opts.includeFinancials
    ? `Blinkit_Store_Performance_Ledger_${new Date().toISOString().slice(0, 10)}.xlsx`
    : `Blinkit_Store_Operations_Audit_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, targetFile || defaultName);
}
