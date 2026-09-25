import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
    console.error('Error running autoTable in invoice:', err);
  }
}

export function generateVendorInvoicePDF(cleaning, vendorProfile = {}) {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2); // 182 mm

    const vendorName = vendorProfile.companyName || cleaning.teamVendor || 'CleanPro Facilities Pvt Ltd';
    const vendorPhone = vendorProfile.phone || cleaning.supervisorPhone || '+91 98765 43210';
    const vendorEmail = vendorProfile.email || '';
    const vendorAddress = vendorProfile.address || 'Industrial Area, Phase 2, New Delhi';
    const vendorGst = vendorProfile.gstin || vendorProfile.pan || '07AAAAA0000A1Z5';
    const bankName = vendorProfile.bankName || 'HDFC Bank';
    const bankAcc = vendorProfile.accountNumber || '50200012345678';
    const ifsc = vendorProfile.ifsc || 'HDFC0001234';
    const upiId = vendorProfile.upiId || 'cleanpro@hdfcbank';

    const cleanDateStr = cleaning.cleaningDate ? String(cleaning.cleaningDate).replace(/-/g, '') : new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const invoiceNo = `INV-${cleaning.storeCode || 'BLK'}-${cleanDateStr}`;

    // Top Header Banner
    const bannerHeight = 35;
    doc.setFillColor(15, 23, 42); // Dark Navy
    doc.rect(0, 0, pageWidth, bannerHeight, 'F');

    // Accent line at bottom of header banner
    doc.setFillColor(12, 131, 31); // Blinkit Green Accent
    doc.rect(0, bannerHeight, pageWidth, 2, 'F');

    // Vendor Name
    doc.setTextColor(248, 203, 70); // Blinkit Yellow
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(vendorName.toUpperCase(), margin, 14, { maxWidth: 120 });

    // Header Right: Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('TAX INVOICE / BILL', pageWidth - margin, 14, { align: 'right' });

    // Vendor Address with wrapping so it never cuts off
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);

    const vendorAddressLines = doc.splitTextToSize(vendorAddress, contentWidth);
    doc.text(vendorAddressLines, margin, 21);

    const addressOffset = vendorAddressLines.length * 3.8;
    const detailsY = Math.min(21 + addressOffset, bannerHeight - 4);
    
    let contactLine = `Ph: ${vendorPhone}   |   GSTIN / PAN: ${vendorGst}`;
    if (vendorEmail) contactLine += `   |   Email: ${vendorEmail}`;
    doc.text(contactLine, margin, detailsY, { maxWidth: contentWidth });

    // -------------------------------------------------------------
    // Invoice Meta & Client Info (Two Clean, Non-Overlapping Columns)
    // -------------------------------------------------------------
    const startY = bannerHeight + 8;
    const maxLeftWidth = 98; // max width for Billed-To column
    const rightColX = 120;   // starting X for Invoice Details column
    const rightColWidth = pageWidth - margin - rightColX;

    let currentLeftY = startY;

    // Left Column: Billed To
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('BILLED TO (CLIENT):', margin, currentLeftY);
    currentLeftY += 4.8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text('Blinkit Commerce Private Limited', margin, currentLeftY);
    currentLeftY += 4.2;

    const storeLines = doc.splitTextToSize(`Store: ${cleaning.storeCode || ''} - ${cleaning.storeName || 'Dark Store'}`, maxLeftWidth);
    doc.text(storeLines, margin, currentLeftY);
    currentLeftY += storeLines.length * 4.2;

    const addressLines = doc.splitTextToSize(`Address: ${cleaning.address || 'Dark Store Hub'}`, maxLeftWidth);
    doc.text(addressLines, margin, currentLeftY);
    currentLeftY += addressLines.length * 4.2;

    const managerLines = doc.splitTextToSize(
      `Store Manager: ${cleaning.managerName || 'Hub Manager'} (${cleaning.managerPhone || 'N/A'})`,
      maxLeftWidth
    );
    doc.text(managerLines, margin, currentLeftY);
    currentLeftY += managerLines.length * 4.2;

    // Right Column: Invoice Details
    let currentRightY = startY;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('INVOICE DETAILS:', rightColX, currentRightY);
    currentRightY += 4.8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);

    const invNoLines = doc.splitTextToSize(`Invoice No: ${invoiceNo}`, rightColWidth);
    doc.text(invNoLines, rightColX, currentRightY);
    currentRightY += invNoLines.length * 4.2;

    doc.text(`Invoice Date: ${new Date().toLocaleDateString('en-IN')}`, rightColX, currentRightY);
    currentRightY += 4.2;

    doc.text(`Service Date: ${cleaning.cleaningDate || '--'}`, rightColX, currentRightY);
    currentRightY += 4.5;

    const isPaid = (cleaning.paymentStatus || '').toLowerCase() === 'received';
    const isPartial = (cleaning.paymentStatus || '').toLowerCase() === 'partial';
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(isPaid ? 12 : (isPartial ? 217 : 220), isPaid ? 131 : (isPartial ? 119 : 38), isPaid ? 31 : (isPartial ? 6 : 38));
    doc.text(`Payment Status: ${(cleaning.paymentStatus || 'PENDING').toUpperCase()}`, rightColX, currentRightY);
    currentRightY += 5;

    // Calculate dynamic start point for the table so neither column ever collides!
    const tableStartY = Math.max(currentLeftY, currentRightY) + 4;

    // -------------------------------------------------------------
    // Single Line Item Table: "Deep Cleaning - [Store Name]"
    // -------------------------------------------------------------
    const itemDescription = vendorProfile.itemDescription || `Deep Cleaning - ${cleaning.storeName || ''} (${cleaning.storeCode || ''})`;
    const totalAmountNum = Number(cleaning.amount || 0);

    const bodyRows = [
      [
        1,
        itemDescription,
        'SAC 998533 (Disinfecting & Cleaning Services)',
        '1 Job',
        `Rs. ${totalAmountNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
      ]
    ];

    runAutoTable(doc, {
      startY: tableStartY,
      head: [['#', 'Service Description / Scope of Work', 'HSN / SAC Code', 'Qty', 'Amount']],
      body: bodyRows,
      theme: 'grid',
      headStyles: { fillColor: [12, 131, 31], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8.5, cellPadding: 3, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 87 },
        2: { cellWidth: 45 },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: margin, right: margin }
    });

    // Total Calculation Table
    const tableEndY = doc.lastAutoTable?.finalY || 135;

    runAutoTable(doc, {
      startY: tableEndY + 3,
      body: [
        ['Subtotal Amount:', `Rs. ${totalAmountNum.toLocaleString('en-IN')}`],
        ['GST (18% / Reverse Charge as applicable):', 'Rs. 0.00'],
        ['Grand Total Bill Amount:', `Rs. ${totalAmountNum.toLocaleString('en-IN')}`],
        ['Amount Received:', `Rs. ${Number(cleaning.amountReceived || 0).toLocaleString('en-IN')}`],
        ['Net Amount Pending / Balance Due:', `Rs. ${Number(cleaning.amountPending || 0).toLocaleString('en-IN')}`]
      ],
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 1.6, halign: 'right' },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 135 },
        1: { fontStyle: 'bold', cellWidth: 47, textColor: [12, 131, 31] }
      },
      margin: { left: margin, right: margin }
    });

    // Bank Account & Payment Instructions
    const bankY = (doc.lastAutoTable?.finalY || 170) + 6;

    doc.setFillColor(248, 250, 252);
    doc.rect(margin, bankY, contentWidth, 38, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, bankY, contentWidth, 38, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('PAYMENT DETAILS & BANK TRANSFER INFO:', margin + 4, bankY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Bank Name: ${bankName}   |   A/c Holder: ${vendorName}`, margin + 4, bankY + 14, { maxWidth: contentWidth - 8 });
    doc.text(`Account Number: ${bankAcc}   |   IFSC Code: ${ifsc}`, margin + 4, bankY + 21, { maxWidth: contentWidth - 8 });
    doc.text(`UPI ID for Instant Transfer: ${upiId}`, margin + 4, bankY + 28, { maxWidth: contentWidth - 8 });
    doc.setFontSize(8);
    doc.text('Please share UTR / Transaction reference number post transfer.', margin + 4, bankY + 34, { maxWidth: contentWidth - 8 });

    // Signatures
    const signY = bankY + 44;
    doc.setDrawColor(203, 213, 225);
    doc.line(pageWidth - 75, signY + 12, pageWidth - margin, signY + 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`For ${vendorName}`, pageWidth - 75, signY + 17, { maxWidth: 61 });
    doc.setFont('helvetica', 'normal');
    doc.text('Authorized Signatory', pageWidth - 75, signY + 22);

    doc.save(`Invoice_${cleaning.storeCode || 'Store'}_${cleaning.cleaningDate || 'Date'}.pdf`);
  } catch (err) {
    console.error('Invoice Generation Error:', err);
    alert('Invoice download failed: ' + err.message);
  }
}
