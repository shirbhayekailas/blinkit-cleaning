import * as XLSX from 'xlsx-js-style';
import { toast } from '../components/Toast';
import { doesCleaningMatchStore } from './storeUtils';

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

// ======================================================================
// EXECUTIVE CORPORATE COLOR PALETTE & STYLE DEFINITIONS
// ======================================================================
const STYLES = {
  // Brand Header Banners
  titleBanner: {
    fill: { patternType: 'solid', fgColor: { rgb: '0F172A' } }, // Dark Slate Navy
    font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: 'F8CB46' } }, // Gold Accent Text
    alignment: { vertical: 'center', horizontal: 'center' }
  },
  subtitleBanner: {
    fill: { patternType: 'solid', fgColor: { rgb: '1E293B' } }, // Deep Navy
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'E2E8F0' } },
    alignment: { vertical: 'center', horizontal: 'center' }
  },
  metaBanner: {
    fill: { patternType: 'solid', fgColor: { rgb: '0C831F' } }, // Blinkit Emerald Green
    font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: 'FFFFFF' } },
    alignment: { vertical: 'center', horizontal: 'center' }
  },

  // KPI Scorecard Highlight Block
  kpiTitle: {
    fill: { patternType: 'solid', fgColor: { rgb: 'F1F5F9' } },
    font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '334155' } },
    alignment: { vertical: 'center', horizontal: 'left' },
    border: {
      top: { style: 'thin', color: { rgb: 'CBD5E1' } },
      bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
      left: { style: 'thin', color: { rgb: 'CBD5E1' } },
      right: { style: 'thin', color: { rgb: 'CBD5E1' } }
    }
  },
  kpiLabel: {
    fill: { patternType: 'solid', fgColor: { rgb: 'F8FAFC' } },
    font: { name: 'Calibri', sz: 8.5, bold: true, color: { rgb: '64748B' } },
    alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { rgb: 'CBD5E1' } },
      bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
      left: { style: 'thin', color: { rgb: 'CBD5E1' } },
      right: { style: 'thin', color: { rgb: 'CBD5E1' } }
    }
  },
  kpiValueNeutral: {
    fill: { patternType: 'solid', fgColor: { rgb: 'EEF2F6' } },
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '0F172A' } },
    alignment: { vertical: 'center', horizontal: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'CBD5E1' } },
      bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
      left: { style: 'thin', color: { rgb: 'CBD5E1' } },
      right: { style: 'thin', color: { rgb: 'CBD5E1' } }
    }
  },
  kpiValueSuccess: {
    fill: { patternType: 'solid', fgColor: { rgb: 'DCFCE7' } }, // Mint Green
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '166534' } }, // Deep Green
    alignment: { vertical: 'center', horizontal: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: '86EFAC' } },
      bottom: { style: 'thin', color: { rgb: '86EFAC' } },
      left: { style: 'thin', color: { rgb: '86EFAC' } },
      right: { style: 'thin', color: { rgb: '86EFAC' } }
    }
  },
  kpiValueDanger: {
    fill: { patternType: 'solid', fgColor: { rgb: 'FFE4E6' } }, // Light Rose Pink
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'BE123C' } }, // Crimson
    alignment: { vertical: 'center', horizontal: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'FDA4AF' } },
      bottom: { style: 'thin', color: { rgb: 'FDA4AF' } },
      left: { style: 'thin', color: { rgb: 'FDA4AF' } },
      right: { style: 'thin', color: { rgb: 'FDA4AF' } }
    }
  },

  // Table Column Headers
  tableHeader: {
    fill: { patternType: 'solid', fgColor: { rgb: '0F172A' } }, // Premium Dark Navy
    font: { name: 'Calibri', sz: 9.5, bold: true, color: { rgb: 'FFFFFF' } },
    alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
    border: {
      top: { style: 'medium', color: { rgb: '0F172A' } },
      bottom: { style: 'medium', color: { rgb: 'F59E0B' } }, // Amber underline
      left: { style: 'thin', color: { rgb: '334155' } },
      right: { style: 'thin', color: { rgb: '334155' } }
    }
  },

  // Data Rows & Zebra Striping
  dataRowEven: {
    fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } },
    font: { name: 'Calibri', sz: 9, color: { rgb: '1E293B' } },
    alignment: { vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'E2E8F0' } },
      bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
      left: { style: 'thin', color: { rgb: 'E2E8F0' } },
      right: { style: 'thin', color: { rgb: 'E2E8F0' } }
    }
  },
  dataRowOdd: {
    fill: { patternType: 'solid', fgColor: { rgb: 'F8FAFC' } }, // Light Slate Zebra
    font: { name: 'Calibri', sz: 9, color: { rgb: '1E293B' } },
    alignment: { vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'E2E8F0' } },
      bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
      left: { style: 'thin', color: { rgb: 'E2E8F0' } },
      right: { style: 'thin', color: { rgb: 'E2E8F0' } }
    }
  },

  // Status Badges
  badgePending: {
    fill: { patternType: 'solid', fgColor: { rgb: 'FEE2E2' } },
    font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: 'DC2626' } },
    alignment: { vertical: 'center', horizontal: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'FCA5A5' } },
      bottom: { style: 'thin', color: { rgb: 'FCA5A5' } },
      left: { style: 'thin', color: { rgb: 'FCA5A5' } },
      right: { style: 'thin', color: { rgb: 'FCA5A5' } }
    }
  },
  badgeSuccess: {
    fill: { patternType: 'solid', fgColor: { rgb: 'DCFCE7' } },
    font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '16A34A' } },
    alignment: { vertical: 'center', horizontal: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: '86EFAC' } },
      bottom: { style: 'thin', color: { rgb: '86EFAC' } },
      left: { style: 'thin', color: { rgb: '86EFAC' } },
      right: { style: 'thin', color: { rgb: '86EFAC' } }
    }
  },
  badgePartial: {
    fill: { patternType: 'solid', fgColor: { rgb: 'FEF3C7' } },
    font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: 'D97706' } },
    alignment: { vertical: 'center', horizontal: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'FCD34D' } },
      bottom: { style: 'thin', color: { rgb: 'FCD34D' } },
      left: { style: 'thin', color: { rgb: 'FCD34D' } },
      right: { style: 'thin', color: { rgb: 'FCD34D' } }
    }
  },

  // Grand Total Summary Row
  totalSummaryRow: {
    fill: { patternType: 'solid', fgColor: { rgb: '0F172A' } }, // Dark Navy
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'F8CB46' } }, // Accounting Gold
    alignment: { vertical: 'center' },
    border: {
      top: { style: 'medium', color: { rgb: 'F59E0B' } },
      bottom: { style: 'double', color: { rgb: 'F59E0B' } }, // Professional Double Accounting Underline
      left: { style: 'thin', color: { rgb: '334155' } },
      right: { style: 'thin', color: { rgb: '334155' } }
    }
  }
};

/**
 * Enriches worksheet with Full Premium Corporate Styling:
 * - Color Fill on Brand Header Rows
 * - Interactive AutoFilter
 * - Freeze Panes at header row
 * - Executive KPI Scorecard Box
 * - Alternating Zebra striped rows with soft borders
 * - Status Badges (Red for Pending, Green for Settled)
 * - Accounting double-underlined Grand Total Row
 */
function applyCorporateTheme(ws, {
  headerRowIndex,          // 0-indexed row of table headers (e.g. 7)
  totalColumns,            // Total column count
  totalRows,               // Total rows in sheet
  currencyColIndices = [], // 0-indexed column indices with money
  numberColIndices = [],   // 0-indexed column indices with integer numbers
  centerColIndices = [],   // 0-indexed column indices to center
  statusColIndex = -1,     // 0-indexed column index of payment/audit status
  hasScorecard = true
}) {
  if (!ws) return;

  const lastColLetter = getColLetter(totalColumns - 1);
  const headerExcelRow = headerRowIndex + 1; // 1-indexed

  // 1. Enable native Excel AutoFilter dropdowns
  ws['!autofilter'] = { ref: `A${headerExcelRow}:${lastColLetter}${totalRows - 1}` };

  // 2. Freeze panes at header row
  ws['!views'] = [{ state: 'frozen', ySplit: headerExcelRow }];

  // 3. Row 1: Brand Title Banner
  for (let c = 0; c < totalColumns; c++) {
    const ref = `${getColLetter(c)}1`;
    if (!ws[ref]) ws[ref] = { t: 's', v: '' };
    ws[ref].s = STYLES.titleBanner;
  }

  // 4. Row 2: Subtitle
  for (let c = 0; c < totalColumns; c++) {
    const ref = `${getColLetter(c)}2`;
    if (!ws[ref]) ws[ref] = { t: 's', v: '' };
    ws[ref].s = STYLES.subtitleBanner;
  }

  // 5. Row 3: Metadata & Period
  for (let c = 0; c < totalColumns; c++) {
    const ref = `${getColLetter(c)}3`;
    if (!ws[ref]) ws[ref] = { t: 's', v: '' };
    ws[ref].s = STYLES.metaBanner;
  }

  // 6. Rows 5 & 6: KPI Scorecard Block
  if (hasScorecard) {
    for (let c = 0; c < Math.min(8, totalColumns); c++) {
      const ref = `${getColLetter(c)}5`;
      if (ws[ref]) {
        ws[ref].s = STYLES.kpiTitle;
      }
    }
    for (let c = 0; c < Math.min(8, totalColumns); c++) {
      const ref = `${getColLetter(c)}6`;
      if (ws[ref]) {
        const isLabel = (c % 2 === 0);
        if (isLabel) {
          ws[ref].s = STYLES.kpiLabel;
        } else {
          if (c === 3) {
            ws[ref].s = STYLES.kpiValueNeutral;
          } else if (c === 5) {
            ws[ref].s = STYLES.kpiValueSuccess;
          } else if (c === 7) {
            ws[ref].s = STYLES.kpiValueDanger;
          } else {
            ws[ref].s = STYLES.kpiValueNeutral;
          }

          // Check previous label to determine if this cell is currency or integer count!
          const labelRef = `${getColLetter(c - 1)}6`;
          const labelText = ws[labelRef] && typeof ws[labelRef].v === 'string' ? ws[labelRef].v.toLowerCase() : '';
          
          const isExplicitCount = labelText.includes('store') || 
                                  labelText.includes('stores') || 
                                  labelText.includes('cleaning') || 
                                  labelText.includes('cleanings') || 
                                  labelText.includes('count') || 
                                  labelText.includes('record') || 
                                  labelText.includes('records') || 
                                  labelText.includes('frequency') || 
                                  labelText.includes('rate') || 
                                  labelText.includes('coverage') || 
                                  labelText.includes('days') || 
                                  labelText.includes('headcount');

          const isCurrency = !isExplicitCount && (
            labelText.includes('billed') || 
            labelText.includes('invoiced') || 
            labelText.includes('received') || 
            labelText.includes('amount') || 
            labelText.includes('dues') || 
            labelText.includes('balance') || 
            labelText.includes('collection') || 
            labelText.includes('revenue') || 
            labelText.includes('price')
          );

          if (typeof ws[ref].v === 'number') {
            ws[ref].t = 'n';
            if (isCurrency) {
              ws[ref].z = '"₹"#,##0';
            } else {
              ws[ref].z = '#,##0'; // Clean integer count without any ₹ currency sign!
            }
          }
        }
      }
    }
  }

  // 7. Table Column Headers
  for (let c = 0; c < totalColumns; c++) {
    const ref = `${getColLetter(c)}${headerExcelRow}`;
    if (ws[ref]) {
      ws[ref].s = STYLES.tableHeader;
    }
  }

  // 8. Data Rows (headerExcelRow + 1 to totalRows - 1)
  for (let r = headerExcelRow + 1; r < totalRows; r++) {
    const isEven = (r % 2 === 0);
    const baseRowStyle = isEven ? STYLES.dataRowEven : STYLES.dataRowOdd;

    for (let c = 0; c < totalColumns; c++) {
      const cellRef = `${getColLetter(c)}${r}`;
      if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };

      const cell = ws[cellRef];
      let align = 'left';
      if (centerColIndices.includes(c)) align = 'center';
      if (currencyColIndices.includes(c)) align = 'right';

      let cellStyle = {
        ...baseRowStyle,
        alignment: { ...baseRowStyle.alignment, horizontal: align }
      };

      // Currency number format
      if (currencyColIndices.includes(c)) {
        if (typeof cell.v === 'number') {
          cell.t = 'n';
          cell.z = '"₹"#,##0';
        }
      }

      // Integer count format
      if (numberColIndices.includes(c)) {
        if (typeof cell.v === 'number') {
          cell.t = 'n';
          cell.z = '#,##0';
        }
      }

      // Highlight Status Badges
      if (c === statusColIndex && typeof cell.v === 'string') {
        const txt = cell.v.toLowerCase();
        if (txt.includes('pending') || txt.includes('overdue')) {
          cellStyle = STYLES.badgePending;
        } else if (txt.includes('received') || txt.includes('full') || txt.includes('completed') || txt.includes('cleared') || txt.includes('active') || txt.includes('settled')) {
          cellStyle = STYLES.badgeSuccess;
        } else if (txt.includes('partial')) {
          cellStyle = STYLES.badgePartial;
        }
      }

      cell.s = cellStyle;
    }
  }

  // 9. Grand Total Summary Row
  for (let c = 0; c < totalColumns; c++) {
    const ref = `${getColLetter(c)}${totalRows}`;
    if (ws[ref]) {
      let align = 'left';
      if (currencyColIndices.includes(c)) {
        align = 'right';
        if (typeof ws[ref].v === 'number') {
          ws[ref].t = 'n';
          ws[ref].z = '"₹"#,##0';
        }
      } else if (numberColIndices.includes(c)) {
        align = 'center';
        if (typeof ws[ref].v === 'number') {
          ws[ref].t = 'n';
          ws[ref].z = '#,##0';
        }
      } else if (centerColIndices.includes(c)) {
        align = 'center';
      }

      ws[ref].s = {
        ...STYLES.totalSummaryRow,
        alignment: { ...STYLES.totalSummaryRow.alignment, horizontal: align }
      };
    }
  }
}

/**
 * Parse store code into prefix and numerical part (e.g., "ES27" -> prefix "ES", num 27)
 */
export function parseStoreCode(codeStr) {
  if (!codeStr) return { prefix: '', num: 0, suffix: '', raw: '' };
  const s = String(codeStr).trim();
  const match = s.match(/^(\D*?)(\d+)(.*)$/);
  if (match) {
    return {
      prefix: match[1].toUpperCase().trim(),
      num: parseInt(match[2], 10),
      suffix: match[3].toUpperCase().trim(),
      raw: s
    };
  }
  return { prefix: s.toUpperCase(), num: 0, suffix: '', raw: s };
}

/**
 * Compare two store codes strictly by store number
 */
export function compareStoreCodes(codeA, codeB) {
  const pA = parseStoreCode(codeA);
  const pB = parseStoreCode(codeB);

  // When both have numbers, compare numeric values
  if (pA.num > 0 && pB.num > 0) {
    const prefComp = pA.prefix.localeCompare(pB.prefix);
    if (prefComp !== 0) return prefComp;
    if (pA.num !== pB.num) return pA.num - pB.num;
    return pA.suffix.localeCompare(pB.suffix);
  }

  // If one has number and other doesn't, number comes first
  if (pA.num > 0 && pB.num === 0) return -1;
  if (pA.num === 0 && pB.num > 0) return 1;

  // Fallback to standard natural sort
  return String(codeA || '').localeCompare(String(codeB || ''), undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Natural Alphanumeric Sort strictly by Store Number (e.g. ES27 -> ES30 -> ES55 -> ES87 -> ES149 -> ES154 -> ES300)
 */
export function naturalSortByStoreCode(list = [], getCode = item => item.storeCode || item.code || '') {
  return [...list].sort((a, b) => compareStoreCodes(getCode(a), getCode(b)));
}

/**
 * Universal dynamic sorter for cleaning operations lists
 */
export function sortCleaningsList(list = [], sortBy = 'storeCodeAsc') {
  if (!Array.isArray(list)) return [];
  const copy = [...list];
  switch (sortBy) {
    case 'dateDesc':
      return copy.sort((a, b) => (b.cleaningDate || '').localeCompare(a.cleaningDate || ''));
    case 'dateAsc':
      return copy.sort((a, b) => (a.cleaningDate || '').localeCompare(b.cleaningDate || ''));
    case 'storeCodeAsc':
      return naturalSortByStoreCode(copy, c => c.storeCode);
    case 'storeCodeDesc':
      return naturalSortByStoreCode(copy, c => c.storeCode).reverse();
    case 'amountDesc':
      return copy.sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0));
    case 'amountPendingDesc':
      return copy.sort((a, b) => (Number(b.amountPending) || 0) - (Number(a.amountPending) || 0));
    case 'preserve':
      return copy;
    default:
      return naturalSortByStoreCode(copy, c => c.storeCode);
  }
}

/**
 * Universal dynamic sorter for stores directory / ledger
 */
export function sortStoresList(list = [], sortBy = 'storeCodeAsc', cleanings = []) {
  if (!Array.isArray(list)) return [];
  const copy = [...list];
  switch (sortBy) {
    case 'storeCodeAsc':
      return naturalSortByStoreCode(copy, s => s.storeCode || s.code || '');
    case 'storeCodeDesc':
      return naturalSortByStoreCode(copy, s => s.storeCode || s.code || '').reverse();
    case 'nameAsc':
      return copy.sort((a, b) => (a.storeName || a.name || '').localeCompare(b.storeName || b.name || ''));
    case 'cityAsc':
      return copy.sort((a, b) => (a.city || '').localeCompare(b.city || ''));
    case 'dateDesc':
    case 'recentCleaned': {
      const lastCleanDateMap = new Map();
      cleanings.forEach(c => {
        const code = (c.storeCode || '').trim().toUpperCase();
        if (code && c.cleaningDate) {
          const prev = lastCleanDateMap.get(code) || '';
          if (c.cleaningDate > prev) lastCleanDateMap.set(code, c.cleaningDate);
        }
      });
      return copy.sort((a, b) => {
        const codeA = (a.storeCode || a.code || '').trim().toUpperCase();
        const codeB = (b.storeCode || b.code || '').trim().toUpperCase();
        return (lastCleanDateMap.get(codeB) || '').localeCompare(lastCleanDateMap.get(codeA) || '');
      });
    }
    case 'amountPendingDesc':
    case 'pendingDesc': {
      const pendingMap = new Map();
      cleanings.forEach(c => {
        const code = (c.storeCode || '').trim().toUpperCase();
        if (code) {
          pendingMap.set(code, (pendingMap.get(code) || 0) + (Number(c.amountPending) || 0));
        }
      });
      return copy.sort((a, b) => {
        const codeA = (a.storeCode || a.code || '').trim().toUpperCase();
        const codeB = (b.storeCode || b.code || '').trim().toUpperCase();
        return (pendingMap.get(codeB) || 0) - (pendingMap.get(codeA) || 0);
      });
    }
    case 'preserve':
      return copy;
    default:
      return naturalSortByStoreCode(copy, s => s.storeCode || s.code || '');
  }
}

// ----------------------------------------------------------------------
// 1. PENDING PAYMENTS SHEET BUILDER (Store Manager / Contact Removed)
// ----------------------------------------------------------------------
export function buildPendingPaymentsSheet(cleanings = [], filterLabel = 'All Time', { sortBy = 'storeCodeAsc' } = {}) {
  const filtered = cleanings.filter(c => 
    c.paymentStatus === 'Pending' || 
    c.paymentStatus === 'Partial' || 
    (toNum(c.amountPending) > 0) ||
    (toNum(c.amount) - toNum(c.amountReceived) > 0)
  );
  const pendingList = sortCleaningsList(filtered, sortBy);

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
    ['EXECUTIVE PENDING DUES SCORECARD', '', '', '', '', '', '', ''],
    ['Total Pending Stores', pendingList.length, 'Total Gross Invoiced', totalBilled, 'Total Amount Received', totalRecv, 'Total Outstanding Pending Dues', totalPend],
    []
  ];

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
    { s: { r: 0, c: 0 }, e: { r: 0, c: 14 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 14 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } },
    { s: { r: 2, c: 7 }, e: { r: 2, c: 14 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 7 } }
  ];

  applyCorporateTheme(ws, {
    headerRowIndex: 7,
    totalColumns: columns.length,
    totalRows: allRows.length,
    currencyColIndices: [7, 8, 9],
    numberColIndices: [0, 6],
    centerColIndices: [0, 1, 5, 6, 10, 13],
    statusColIndex: 10,
    hasScorecard: true
  });

  return ws;
}

// ----------------------------------------------------------------------
// 2. COMPLETED PAYMENTS SHEET BUILDER (Store Manager Removed)
// ----------------------------------------------------------------------
export function buildCompletedPaymentsSheet(cleanings = [], filterLabel = 'All Time', { sortBy = 'storeCodeAsc' } = {}) {
  const filtered = cleanings.filter(c => 
    c.paymentStatus === 'Received' || 
    c.paymentStatus === 'Completed' ||
    (toNum(c.amountReceived) > 0 && toNum(c.amountPending) <= 0)
  );
  const completedList = sortCleaningsList(filtered, sortBy);

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
    ['EXECUTIVE SETTLEMENT SUMMARY SCORECARD', '', '', '', '', '', '', ''],
    ['Total Cleared Entries', completedList.length, 'Total Invoiced Value', totalBilled, 'Total Realized Collection', totalRecv, 'Settlement Realization', '100% Cleared'],
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
    { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 12 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } },
    { s: { r: 2, c: 6 }, e: { r: 2, c: 12 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 7 } }
  ];

  applyCorporateTheme(ws, {
    headerRowIndex: 7,
    totalColumns: columns.length,
    totalRows: allRows.length,
    currencyColIndices: [8, 9],
    numberColIndices: [0],
    centerColIndices: [0, 1, 4, 5, 6, 7, 10],
    statusColIndex: 10,
    hasScorecard: true
  });

  return ws;
}

// ----------------------------------------------------------------------
// 3. ALL CLEANING RECORDS SHEET BUILDER
//    Options: includeFinancials = true (With Amount) | false (Without Amount)
//    Store Manager & Contact Number Removed
// ----------------------------------------------------------------------
export function buildAllCleaningsSheet(cleanings = [], filterLabel = 'All Time', { includeFinancials = true, sortBy = 'storeCodeAsc' } = {}) {
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
      ['EXECUTIVE OPERATIONS & FINANCIAL SCORECARD', '', '', '', '', '', '', ''],
      ['Total Cleanings', cleanings.length, 'Total Gross Invoiced', totalBilled, 'Total Amount Received', totalRecv, 'Total Dues Pending', totalPend],
      []
    );
  } else {
    headerRows.push(
      ['EXECUTIVE OPERATIONS SCORECARD (NON-FINANCIAL)', '', '', '', '', '', '', ''],
      ['Total Cleanings Executed', cleanings.length, 'Verified Coverage', '100% Monitored', 'Shift Coverage', 'Night & Day Active', 'Audit Standard', 'Certified A+'],
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

  const sortedCleanings = sortCleaningsList(cleanings, sortBy);
  const dataRows = sortedCleanings.map((c, index) => {
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
    { s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: columns.length - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: Math.floor(columns.length / 2) } },
    { s: { r: 2, c: Math.floor(columns.length / 2) + 1 }, e: { r: 2, c: columns.length - 1 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 7 } }
  ];

  applyCorporateTheme(ws, {
    headerRowIndex: 7,
    totalColumns: columns.length,
    totalRows: allRows.length,
    currencyColIndices: includeFinancials ? [19, 20, 21] : [],
    numberColIndices: includeFinancials ? [0, 15, 18, 26] : [0, 15, 18, 19],
    centerColIndices: includeFinancials ? [0, 1, 6, 7, 8, 9, 10, 15, 17, 18, 22, 23, 24, 26, 27] : [0, 1, 6, 7, 8, 9, 10, 15, 17, 18, 19, 20],
    statusColIndex: includeFinancials ? 22 : 17,
    hasScorecard: true
  });

  return ws;
}

// ----------------------------------------------------------------------
// 4. STORE-WISE PERFORMANCE SHEET BUILDER
//    Options: includeFinancials = true (With Amount) | false (Without Amount)
//    Store Manager & Contact Number Removed
// ----------------------------------------------------------------------
export function buildStorePerformanceSheet(cleanings = [], stores = [], filterLabel = 'All Time', { includeFinancials = true, sortBy = 'storeCodeAsc' } = {}) {
  // 1. Build metadata lookup maps from stores
  const storeMetaByCode = new Map();
  const storeMetaByName = new Map();
  (stores || []).forEach(s => {
    const code = (s.storeCode || s.code || '').trim().toUpperCase();
    const name = (s.storeName || s.name || '').trim().toLowerCase();
    if (code) storeMetaByCode.set(code, s);
    if (name) storeMetaByName.set(name, s);
  });

  const storeMap = new Map();

  // 2. Aggregate directly from cleanings matching the filter
  cleanings.forEach(c => {
    const cCode = (c.storeCode || '').trim().toUpperCase();
    const cCity = (c.city || '').trim().toUpperCase();
    const cName = (c.storeName || '').trim().toLowerCase();
    const meta = (stores || []).find(s => doesCleaningMatchStore(c, s));

    const finalCode = (meta?.storeCode || meta?.code || cCode).trim().toUpperCase();
    const finalCity = (meta?.city || cCity).trim().toUpperCase();
    const storeKey = finalCity ? `${finalCode}__${finalCity}` : (finalCode || meta?.id || cName);
    if (!storeKey) return;

    let item = storeMap.get(storeKey);
    if (!item) {
      item = {
        code: finalCode,
        name: meta?.storeName || meta?.name || c.storeName || '',
        city: meta?.city || c.city || '',
        address: meta?.address || c.address || '',
        cleaningsCount: 0,
        totalBilled: 0,
        totalReceived: 0,
        totalPending: 0,
        lastCleanDate: '',
        status: 'Active'
      };
      storeMap.set(storeKey, item);
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

  // 3. Determine if filters are applied
  const hasFilter = filterLabel && filterLabel !== 'All Time' && filterLabel !== 'All Time Records' && (
    filterLabel.includes('City:') ||
    filterLabel.includes('Store:') ||
    filterLabel.includes('Payment:') ||
    filterLabel.includes('Month') ||
    filterLabel.includes('Range') ||
    filterLabel.includes('Search:')
  );

  // If unfiltered "All Time", include registered dark stores with 0 cleanings as "Not Started"
  if (!hasFilter && stores && stores.length > 0) {
    stores.forEach(s => {
      const code = (s.storeCode || s.code || '').trim().toUpperCase();
      const city = (s.city || '').trim().toUpperCase();
      const storeKey = city ? `${code}__${city}` : (code || (s.storeName || s.name || '').trim().toLowerCase());
      if (storeKey && !storeMap.has(storeKey)) {
        storeMap.set(storeKey, {
          code: s.storeCode || s.code || '',
          name: s.storeName || s.name || '',
          city: s.city || '',
          address: s.address || '',
          cleaningsCount: 0,
          totalBilled: 0,
          totalReceived: 0,
          totalPending: 0,
          lastCleanDate: '',
          status: 'Not Started'
        });
      }
    });
  } else if (cleanings.length === 0 && stores && stores.length > 0) {
    // If no cleanings matched the active filter, but specific target stores were provided (e.g. single store selected)
    stores.forEach(s => {
      const code = (s.storeCode || s.code || '').trim().toUpperCase();
      const city = (s.city || '').trim().toUpperCase();
      const storeKey = city ? `${code}__${city}` : (code || (s.storeName || s.name || '').trim().toLowerCase());
      if (storeKey && !storeMap.has(storeKey)) {
        storeMap.set(storeKey, {
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
  }

  const storeRows = sortStoresList(Array.from(storeMap.values()).map(item => {
    let financialStatus = 'All Cleared';
    if (item.cleaningsCount === 0) financialStatus = 'Not Started';
    else if (item.totalPending > 0) financialStatus = `Pending Dues (Rs ${item.totalPending})`;

    return {
      ...item,
      financialStatus
    };
  }), sortBy, cleanings);

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
      ['EXECUTIVE STORE PERFORMANCE SCORECARD', '', '', '', '', '', '', ''],
      ['Total Stores in Report', storeRows.length, 'Total Cleanings Executed', sumCleanings, 'Total Invoiced Billing', sumBilled, 'Total Outstanding Balance', sumPend],
      []
    );
  } else {
    headerRows.push(
      ['EXECUTIVE STORE AUDIT SCORECARD (NON-FINANCIAL)', '', '', '', '', '', '', ''],
      ['Total Stores in Report', storeRows.length, 'Cleanings Completed', sumCleanings, 'Coverage Rate', '100% Monitored', 'Audit Status', 'Operational'],
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
      'GRAND TOTAL',
      '',
      '',
      '',
      `Total Registered Stores: ${storeRows.length}`,
      sumCleanings,
      sumBilled,
      sumRecv,
      sumPend,
      sumPend === 0 ? 'All Settled' : 'Pending Dues Exist',
      ''
    ];
  } else {
    summaryRow = [
      'GRAND TOTAL',
      '',
      '',
      '',
      `Total Registered Stores: ${storeRows.length}`,
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
    { s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: columns.length - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
    { s: { r: 2, c: 5 }, e: { r: 2, c: columns.length - 1 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 7 } }
  ];

  applyCorporateTheme(ws, {
    headerRowIndex: 7,
    totalColumns: columns.length,
    totalRows: allRows.length,
    currencyColIndices: includeFinancials ? [6, 7, 8] : [],
    numberColIndices: [0, 5],
    centerColIndices: includeFinancials ? [0, 1, 5, 9, 10] : [0, 1, 5, 6, 7, 8],
    statusColIndex: includeFinancials ? 9 : 8,
    hasScorecard: true
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
    ['Total Dark Stores in Report', stores.length || cleanings.length, 'Active Stores in Filtered Scope'],
    ['Total Deep Cleanings Executed', totalCleanings, 'Verified Work Completion Records'],
    ['Total Gross Invoiced Billing (Rs)', totalBilled, 'Total Amount Billed to Blinkit Stores'],
    ['Total Realized Payments Received (Rs)', totalReceived, 'Payments Successfully Verified & Settled'],
    ['Total Outstanding Pending Amount (Rs)', totalPending, 'Unpaid / Overdue Balance Pending Collection'],
    ['Payment Collection Efficiency Rate', collectionRate, 'Percentage of Invoiced Value Realized'],
    ['Fully Settled Cleanings', paidCleaningsCount, 'Cleanings with Full Cleared Payments'],
    ['Pending / Partial Cleanings', pendingCleaningsCount, 'Cleanings Requiring Payment Follow-up'],
    [],
    ['MONTH-WISE FINANCIAL BREAKDOWN', '', '', '', '', ''],
    ['Billing Month (YYYY-MM)', 'Cleanings Count', 'Invoiced Amount (Rs)', 'Amount Received (Rs)', 'Amount Pending (Rs)', 'Collection Rate (%)'],
    ...monthRows,
    [],
    ['AUTHORIZED SIGNATORY & AUDIT NOTICE', '', '', '', '', ''],
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
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } },
    { s: { r: 2, c: 3 }, e: { r: 2, c: 5 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 2 } },
    { s: { r: 14, c: 0 }, e: { r: 14, c: 5 } },
    { s: { r: rows.length - 3, c: 0 }, e: { r: rows.length - 3, c: 5 } },
    { s: { r: rows.length - 2, c: 0 }, e: { r: rows.length - 2, c: 5 } },
    { s: { r: rows.length - 1, c: 0 }, e: { r: rows.length - 1, c: 5 } }
  ];

  // Header banner styling
  for (let c = 0; c < 6; c++) {
    const r1 = `${getColLetter(c)}1`;
    const r2 = `${getColLetter(c)}2`;
    const r3 = `${getColLetter(c)}3`;
    if (!ws[r1]) ws[r1] = { t: 's', v: '' };
    if (!ws[r2]) ws[r2] = { t: 's', v: '' };
    if (!ws[r3]) ws[r3] = { t: 's', v: '' };
    ws[r1].s = STYLES.titleBanner;
    ws[r2].s = STYLES.subtitleBanner;
    ws[r3].s = STYLES.metaBanner;
  }

  // KPI Table (Rows 5 to 13)
  for (let r = 5; r <= 13; r++) {
    const isHeader = (r === 5);
    for (let c = 0; c < 3; c++) {
      const ref = `${getColLetter(c)}${r}`;
      if (ws[ref]) {
        if (isHeader) {
          ws[ref].s = STYLES.tableHeader;
        } else {
          ws[ref].s = (r % 2 === 0) ? STYLES.dataRowEven : STYLES.dataRowOdd;
          if (c === 1 && typeof ws[ref].v === 'number' && (r >= 8 && r <= 10)) {
            ws[ref].t = 'n';
            ws[ref].z = '"₹"#,##0';
          }
        }
      }
    }
  }

  // Monthly Table header (Row 16)
  for (let c = 0; c < 6; c++) {
    const ref = `${getColLetter(c)}16`;
    if (ws[ref]) {
      ws[ref].s = STYLES.tableHeader;
    }
  }

  // Monthly Data rows (Row 17 onwards)
  for (let r = 17; r < 17 + monthRows.length; r++) {
    for (let c = 0; c < 6; c++) {
      const ref = `${getColLetter(c)}${r}`;
      if (ws[ref]) {
        ws[ref].s = (r % 2 === 0) ? STYLES.dataRowEven : STYLES.dataRowOdd;
        if (c >= 2 && c <= 4 && typeof ws[ref].v === 'number') {
          ws[ref].t = 'n';
          ws[ref].z = '"₹"#,##0';
        }
      }
    }
  }

  return ws;
}

// ----------------------------------------------------------------------
// EXPORT FUNCTIONS: MASTER WORKBOOK & INDIVIDUAL SHEETS
// ----------------------------------------------------------------------

/**
 * Downloads a comprehensive multi-sheet Excel workbook containing all 5 reports.
 * Store Manager and Contact details are permanently omitted.
 */
export function exportMasterExcel(cleanings = [], stores = [], filterLabel = 'All Time', filenameOrOptions = '', options = {}) {
  if (!cleanings || cleanings.length === 0) {
    toast.warning('No cleaning records available for export!', 'No Records');
    return;
  }

  let filename = typeof filenameOrOptions === 'string' ? filenameOrOptions : '';
  let opts = typeof filenameOrOptions === 'object' && filenameOrOptions !== null ? filenameOrOptions : options;
  const sortBy = opts?.sortBy || 'storeCodeAsc';

  const defaultFilename = `Blinkit_DeepCleaning_Master_Package_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const wb = XLSX.utils.book_new();

  // 1. Executive Summary
  const wsSummary = buildExecutiveSummarySheet(cleanings, stores, filterLabel);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');

  // 2. Pending Payments (Supports sortBy)
  const wsPending = buildPendingPaymentsSheet(cleanings, filterLabel, { sortBy });
  XLSX.utils.book_append_sheet(wb, wsPending, 'Pending Payments');

  // 3. Completed Payments (Supports sortBy)
  const wsCompleted = buildCompletedPaymentsSheet(cleanings, filterLabel, { sortBy });
  XLSX.utils.book_append_sheet(wb, wsCompleted, 'Completed Payments');

  // 4. All Cleaning Records (Supports sortBy)
  const wsAll = buildAllCleaningsSheet(cleanings, filterLabel, { includeFinancials: true, sortBy });
  XLSX.utils.book_append_sheet(wb, wsAll, 'All Cleaning Records');

  // 5. Store-Wise Performance (Supports sortBy)
  const wsStore = buildStorePerformanceSheet(cleanings, stores, filterLabel, { includeFinancials: true, sortBy });
  XLSX.utils.book_append_sheet(wb, wsStore, 'Store-Wise Summary');

  XLSX.writeFile(wb, filename || defaultFilename);
}

/**
 * Downloads dedicated Pending Payments Excel report.
 */
export function exportPendingPaymentsExcel(cleanings = [], filterLabel = 'All Time', filenameOrOptions = '', options = {}) {
  let filename = typeof filenameOrOptions === 'string' ? filenameOrOptions : '';
  let opts = typeof filenameOrOptions === 'object' && filenameOrOptions !== null ? filenameOrOptions : options;
  const sortBy = opts?.sortBy || 'storeCodeAsc';

  const wb = XLSX.utils.book_new();
  const ws = buildPendingPaymentsSheet(cleanings, filterLabel, { sortBy });
  XLSX.utils.book_append_sheet(wb, ws, 'Pending Payments');
  XLSX.writeFile(wb, filename || `Blinkit_Pending_Payments_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Downloads dedicated Completed Payments Excel report.
 */
export function exportCompletedPaymentsExcel(cleanings = [], filterLabel = 'All Time', filenameOrOptions = '', options = {}) {
  let filename = typeof filenameOrOptions === 'string' ? filenameOrOptions : '';
  let opts = typeof filenameOrOptions === 'object' && filenameOrOptions !== null ? filenameOrOptions : options;
  const sortBy = opts?.sortBy || 'storeCodeAsc';

  const wb = XLSX.utils.book_new();
  const ws = buildCompletedPaymentsSheet(cleanings, filterLabel, { sortBy });
  XLSX.utils.book_append_sheet(wb, ws, 'Completed Payments');
  XLSX.writeFile(wb, filename || `Blinkit_Completed_Payments_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Downloads dedicated All Cleaning Records Excel register.
 * Supports options: { includeFinancials: true | false, sortBy: '...' } or direct filename string
 */
export function exportAllCleaningsExcel(cleanings = [], filterLabel = 'All Time', options = { includeFinancials: true, sortBy: 'storeCodeAsc' }, filename = '') {
  let opts = options;
  let targetFile = filename;
  if (typeof options === 'string') {
    targetFile = options;
    opts = { includeFinancials: true, sortBy: 'storeCodeAsc' };
  } else if (!opts || typeof opts !== 'object') {
    opts = { includeFinancials: true, sortBy: 'storeCodeAsc' };
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
 * Supports options: { includeFinancials: true | false, sortBy: '...' } or direct filename string
 */
export function exportStorePerformanceExcel(cleanings = [], stores = [], filterLabel = 'All Time', options = { includeFinancials: true, sortBy: 'storeCodeAsc' }, filename = '') {
  let opts = options;
  let targetFile = filename;
  if (typeof options === 'string') {
    targetFile = options;
    opts = { includeFinancials: true, sortBy: 'storeCodeAsc' };
  } else if (!opts || typeof opts !== 'object') {
    opts = { includeFinancials: true, sortBy: 'storeCodeAsc' };
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

/**
 * ----------------------------------------------------------------------
 * STORE MASTER DIRECTORY & REGISTER EXCEL BUILDER
 * ----------------------------------------------------------------------
 */
export function buildStoreListSheet(stores = [], cleanings = [], filterLabel = 'All Time', { sortBy = 'storeCodeAsc' } = {}) {
  const sortedStores = sortStoresList(stores, sortBy, cleanings);
  const totalStores = sortedStores.length;
  const uniqueCities = new Set(sortedStores.map(s => s.city).filter(Boolean)).size;
  const totalVisits = cleanings.length;

  const headerRows = [
    ['SK ENTERPRISES - FACILITY MANAGEMENT & COMMERCIAL CLEANING SERVICES'],
    ['BLINKIT DARK STORE MASTER DIRECTORY & REGISTER'],
    [`Report Filter Period: ${filterLabel}`, `Generated On: ${new Date().toLocaleString('en-IN')}`, `Total Stores Registered: ${totalStores}`],
    [],
    ['EXECUTIVE STORE DIRECTORY SCORECARD', '', '', '', '', '', '', ''],
    ['Total Registered Stores', totalStores, 'Operational Cities / Hubs', uniqueCities, 'Lifetime Cleanings Logged', totalVisits, 'Master Register Status', 'Active & Verified'],
    []
  ];

  const columns = [
    'S.No',
    'Store Code',
    'Store Name',
    'City / Hub',
    'Full Store Address',
    'Store Manager',
    'Manager Contact',
    'Cleanings Completed',
    'Last Cleaning Date',
    'Status',
    'Google Maps Location'
  ];

  const dataRows = sortedStores.map((s, idx) => {
    const storeVisits = cleanings.filter(c => doesCleaningMatchStore(c, s));
    const visitCount = storeVisits.length;
    const lastDate = storeVisits.length > 0 
      ? storeVisits.map(c => c.cleaningDate).filter(Boolean).sort().reverse()[0] || '--'
      : 'None';

    return [
      idx + 1,
      s.storeCode || s.code || 'N/A',
      s.storeName || s.name || 'N/A',
      s.city || 'N/A',
      s.address || 'Address not registered',
      s.managerName || 'Not Assigned',
      s.managerPhone || 'N/A',
      visitCount,
      lastDate,
      s.status || 'Active',
      s.googleMapsUrl || 'N/A'
    ];
  });

  const fullSheetData = [...headerRows, columns, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(fullSheetData);
  applyCorporateTheme(ws);
  return ws;
}

export function exportStoreListExcel(stores = [], cleanings = [], filterLabel = 'All Time', filenameOrOptions = '', options = {}) {
  let filename = typeof filenameOrOptions === 'string' ? filenameOrOptions : '';
  let opts = typeof filenameOrOptions === 'object' && filenameOrOptions !== null ? filenameOrOptions : options;
  const sortBy = opts?.sortBy || 'storeCodeAsc';

  const wb = XLSX.utils.book_new();
  const ws = buildStoreListSheet(stores, cleanings, filterLabel, { sortBy });
  XLSX.utils.book_append_sheet(wb, ws, 'Store Master Directory');
  const defaultName = `Blinkit_Store_Master_Directory_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename || defaultName);
}

/**
 * Export a single store's complete cleaning history and financial statement to Excel (.xlsx)
 */
export function exportSingleStoreExcel(store, cleanings = [], filterLabel = 'All Time', filename = '') {
  if (!store) {
    toast.warning('No store selected for export.', 'Export Failed');
    return;
  }

  // Ensure we only include cleanings that actually belong to this store
  const storeCleanings = cleanings
    .filter(c => doesCleaningMatchStore(c, store))
    .sort((a, b) => new Date(b.cleaningDate) - new Date(a.cleaningDate));

  const totalVisits = storeCleanings.length;
  const totalBilled = storeCleanings.reduce((sum, c) => sum + toNum(c.amount), 0);
  const totalReceived = storeCleanings.reduce((sum, c) => sum + toNum(c.amountReceived), 0);
  const totalPending = storeCleanings.reduce((sum, c) => {
    const pend = c.amountPending !== undefined ? toNum(c.amountPending) : Math.max(0, toNum(c.amount) - toNum(c.amountReceived));
    return sum + pend;
  }, 0);

  const sCode = store.storeCode || store.code || 'STORE';
  const sName = store.storeName || store.name || sCode;
  const sCity = store.city || 'Hub';
  const sAddress = store.address || 'Address not registered';
  const sManager = store.managerName || 'Not Assigned';
  const sPhone = store.managerPhone || 'N/A';

  const wb = XLSX.utils.book_new();

  // Title & Metadata rows
  const headerRows = [
    ['SK ENTERPRISES | FACILITY & DEEP CLEANING SERVICES'],
    [`STORE CLEANING LEDGER & AUDIT STATEMENT: ${sName} (${sCode})`],
    [`City / Hub: ${sCity} | Address: ${sAddress} | Manager: ${sManager} (Ph: ${sPhone})`],
    [`Audit Period: ${filterLabel} | Report Generated: ${new Date().toLocaleString('en-IN')}`],
    [],
    // KPI Cards row
    [
      'Total Cleanings Done', totalVisits,
      'Total Invoiced (₹)', totalBilled,
      'Total Received (₹)', totalReceived,
      'Pending Balance (₹)', totalPending,
      'Clearance Status', totalPending === 0 ? 'ALL CLEARED' : 'PENDING'
    ],
    []
  ];

  const columns = [
    '#',
    'Cleaning Date',
    'Shift',
    'Timings',
    'Duration (Hrs)',
    'Supervisor',
    'Headcount',
    'Scope of Work Executed',
    'Chemicals / Consumables Used',
    'Work Status',
    'Invoiced Amount (₹)',
    'Amount Received (₹)',
    'Pending Balance (₹)',
    'Payment Status',
    'Payment Date',
    'Payment Mode / UTR',
    'Remarks / Notes'
  ];

  const dataRows = storeCleanings.map((c, idx) => {
    const billed = toNum(c.amount);
    const recv = toNum(c.amountReceived);
    const pend = c.amountPending !== undefined ? toNum(c.amountPending) : Math.max(0, billed - recv);
    const scopeStr = Array.isArray(c.scopeOfWork) ? c.scopeOfWork.join(', ') : (c.scopeOfWork || 'General Deep Cleaning');
    const chemsStr = Array.isArray(c.chemicalsUsed) ? c.chemicalsUsed.join(', ') : (c.chemicalsUsed || 'Standard Kit');
    const timingsStr = (c.startTime && c.endTime) ? `${c.startTime} - ${c.endTime}` : (c.startTime || c.shift || 'Night');

    return [
      idx + 1,
      c.cleaningDate || '--',
      c.shift || 'Night Shift',
      timingsStr,
      c.durationHours || 0,
      c.supervisor || 'On-Duty Lead',
      c.cleanersCount || c.headcount || 4,
      scopeStr,
      chemsStr,
      c.status || 'Completed',
      billed,
      recv,
      pend,
      c.paymentStatus || 'Pending',
      c.paymentDate || '--',
      c.paymentMode || c.utrNumber || '--',
      c.remarks || c.notes || '--'
    ];
  });

  const totalsRow = [
    'TOTALS',
    `Total Visits: ${totalVisits}`,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    totalBilled,
    totalReceived,
    totalPending,
    totalPending === 0 ? 'All Cleared' : 'Pending',
    '',
    '',
    ''
  ];

  const fullData = [...headerRows, columns, ...dataRows, [], totalsRow];
  const ws = XLSX.utils.aoa_to_sheet(fullData);

  // Apply corporate styling
  applyCorporateTheme(ws);

  // Set column widths
  ws['!cols'] = [
    { wch: 6 },  // #
    { wch: 14 }, // Date
    { wch: 14 }, // Shift
    { wch: 18 }, // Timings
    { wch: 14 }, // Duration
    { wch: 20 }, // Supervisor
    { wch: 12 }, // Headcount
    { wch: 35 }, // Scope
    { wch: 30 }, // Chemicals
    { wch: 16 }, // Status
    { wch: 18 }, // Invoiced
    { wch: 18 }, // Received
    { wch: 18 }, // Pending
    { wch: 16 }, // Payment Status
    { wch: 14 }, // Payment Date
    { wch: 20 }, // UTR
    { wch: 30 }  // Remarks
  ];

  XLSX.utils.book_append_sheet(wb, ws, `${sCode}_Cleaning_Ledger`.slice(0, 31));

  const cleanStoreName = sName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const defaultFilename = `Blinkit_${sCode}_${cleanStoreName}_Cleaning_History_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename || defaultFilename);
  toast.success(`Excel report downloaded for ${sName} (${sCode})!`, 'Excel Export Ready');
}

