import * as XLSX from 'xlsx';

export function exportCleaningsToExcel(cleanings, filename = 'Blinkit_DeepCleaning_Tracker.xlsx') {
  if (!cleanings || cleanings.length === 0) {
    alert('No records available to export!');
    return;
  }

  const exportData = cleanings.map((c, index) => ({
    'S.No': index + 1,
    'Store Code': c.storeCode || '',
    'Store Name': c.storeName || '',
    'City/Zone': c.city || '',
    'Store Address': c.address || '',
    'Google Maps Link': c.googleMapsUrl || '',
    'Store Manager': c.managerName || '',
    'Manager Phone': c.managerPhone || '',
    'Cleaning Date': c.cleaningDate || '',
    'Shift': c.shift || '',
    'Start Time': c.startTime || '',
    'End Time': c.endTime || '',
    'Duration (Hours)': c.durationHours || '',
    'Cleaning Status': c.status || '',
    'Service Vendor': c.teamVendor || '',
    'Vendor Scope of Work': Array.isArray(c.scopeOfWork) ? c.scopeOfWork.join(', ') : 'Floor Deep Cleaning, Toilet, Cold Storage, Wall Dry Rust Removal',
    'Supervisor Name': c.supervisorName || '',
    'Supervisor Phone': c.supervisorPhone || '',
    'Team Members Deployed': c.teamMembers || '',
    'Headcount': c.headcount || '',
    'Total Amount (Rs)': Number(c.amount || 0),
    'Amount Received (Rs)': Number(c.amountReceived || 0),
    'Amount Pending (Rs)': Number(c.amountPending || 0),
    'Payment Status': c.paymentStatus || 'Pending',
    'Payment Mode': c.paymentMode || '',
    'Payment Date': c.paymentDate || '',
    'UTR / Transaction Ref': c.utrNumber || '',
    'Payment Notes': c.paymentNotes || '',
    'Audit Rating (1-5)': c.rating || 5,
    'Supervisor Remarks': c.remarks || '',
    'Photos Attached': (c.photos && c.photos.length) || 0
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Set column widths for readability
  const colWidths = [
    { wch: 6 },  // S.No
    { wch: 14 }, // Store Code
    { wch: 30 }, // Store Name
    { wch: 15 }, // City
    { wch: 40 }, // Address
    { wch: 35 }, // Maps
    { wch: 18 }, // Manager
    { wch: 15 }, // Phone
    { wch: 14 }, // Date
    { wch: 22 }, // Shift
    { wch: 12 }, // Start
    { wch: 12 }, // End
    { wch: 15 }, // Duration
    { wch: 14 }, // Status
    { wch: 25 }, // Vendor
    { wch: 18 }, // Supervisor
    { wch: 15 }, // Sup Phone
    { wch: 35 }, // Team
    { wch: 10 }, // Headcount
    { wch: 16 }, // Amount
    { wch: 18 }, // Received
    { wch: 18 }, // Pending
    { wch: 15 }, // Payment Status
    { wch: 14 }, // Mode
    { wch: 14 }, // Payment Date
    { wch: 25 }, // UTR
    { wch: 30 }, // Notes
    { wch: 16 }, // Rating
    { wch: 35 }, // Remarks
    { wch: 16 }  // Photos
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Deep Cleaning Master');
  
  XLSX.writeFile(workbook, filename);
}
