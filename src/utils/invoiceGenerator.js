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
    const pageWidth = doc.internal.pageSize.getWidth();

    const vendorName = vendorProfile.companyName || cleaning.teamVendor || 'CleanPro Facilities Pvt Ltd';
    const vendorPhone = vendorProfile.phone || cleaning.supervisorPhone || '+91 98765 43210';
    const vendorEmail = vendorProfile.email || 'billing@cleanproservices.com';
    const vendorAddress = vendorProfile.address || 'Industrial Area, Phase 2, New Delhi';
    const vendorGst = vendorProfile.gstin || vendorProfile.pan || '07AAAAA0000A1Z5';
    const bankName = vendorProfile.bankName || 'HDFC Bank';
    const bankAcc = vendorProfile.accountNumber || '50200012345678';
    const ifsc = vendorProfile.ifsc || 'HDFC0001234';
    const upiId = vendorProfile.upiId || 'cleanpro@hdfcbank';

    const invoiceNo = `INV-${cleaning.storeCode}-${cleaning.cleaningDate.replace(/-/g, '')}`;

    // Top Header Banner
    doc.setFillColor(15, 23, 42); // Dark Navy
    doc.rect(0, 0, pageWidth, 32, 'F');

    doc.setTextColor(248, 203, 70); // Blinkit Yellow
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(vendorName.toUpperCase(), 14, 18);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);
    doc.text(`${vendorAddress}  |  Ph: ${vendorPhone}  |  GSTIN/PAN: ${vendorGst}`, 14, 26);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('TAX INVOICE / BILL', pageWidth - 14, 20, { align: 'right' });

    // Invoice Meta & Client Info
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);

    const infoY = 40;
    
    // Left: Billed To
    doc.setFont('helvetica', 'bold');
    doc.text('BILLED TO (CLIENT):', 14, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text('Blinkit Commerce Private Limited', 14, infoY + 5);
    doc.text(`Store: ${cleaning.storeCode} - ${cleaning.storeName}`, 14, infoY + 10);
    doc.text(`Address: ${cleaning.address || 'Dark Store Hub'}`, 14, infoY + 15);
    doc.text(`Store Manager: ${cleaning.managerName || 'Hub Manager'} (${cleaning.managerPhone || 'N/A'})`, 14, infoY + 20);

    // Right: Invoice Details
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE DETAILS:', pageWidth - 80, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice No: ${invoiceNo}`, pageWidth - 80, infoY + 5);
    doc.text(`Invoice Date: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - 80, infoY + 10);
    doc.text(`Service Date: ${cleaning.cleaningDate}`, pageWidth - 80, infoY + 15);
    doc.text(`Payment Status: ${cleaning.paymentStatus.toUpperCase()}`, pageWidth - 80, infoY + 20);

    // Single Line Item: "Deep Cleaning - [Store Name]"
    const itemDescription = vendorProfile.itemDescription || `Deep Cleaning - ${cleaning.storeName} (${cleaning.storeCode})`;
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
      startY: infoY + 28,
      head: [['#', 'Service Description / Scope of Work', 'HSN / SAC Code', 'Qty', 'Amount']],
      body: bodyRows,
      theme: 'grid',
      headStyles: { fillColor: [12, 131, 31], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 90 },
        2: { cellWidth: 50 },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }
      }
    });

    // Total Calculation Table
    const tableEndY = doc.lastAutoTable?.finalY || 130;
    const totalAmount = Number(cleaning.amount || 0);

    runAutoTable(doc, {
      startY: tableEndY + 3,
      body: [
        ['Subtotal Amount:', `Rs. ${totalAmount.toLocaleString('en-IN')}`],
        ['GST (18% / Reverse Charge as applicable):', 'Rs. 0.00'],
        ['Grand Total Bill Amount:', `Rs. ${totalAmount.toLocaleString('en-IN')}`],
        ['Amount Received:', `Rs. ${Number(cleaning.amountReceived || 0).toLocaleString('en-IN')}`],
        ['Net Amount Pending / Balance Due:', `Rs. ${Number(cleaning.amountPending || 0).toLocaleString('en-IN')}`]
      ],
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 1.5, halign: 'right' },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 140 },
        1: { fontStyle: 'bold', cellWidth: 50, textColor: [12, 131, 31] }
      }
    });

    // Bank Account & Payment Instructions
    const bankY = (doc.lastAutoTable?.finalY || 170) + 8;

    doc.setFillColor(248, 250, 252);
    doc.rect(14, bankY, pageWidth - 28, 42, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(14, bankY, pageWidth - 28, 42, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('PAYMENT DETAILS & BANK TRANSFER INFO:', 18, bankY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Bank Name: ${bankName}  |  A/c Holder: ${vendorName}`, 18, bankY + 16);
    doc.text(`Account Number: ${bankAcc}  |  IFSC Code: ${ifsc}`, 18, bankY + 23);
    doc.text(`UPI ID for Instant Transfer: ${upiId}`, 18, bankY + 30);
    doc.text('Please share UTR / Transaction reference number post transfer.', 18, bankY + 37);

    // Signatures
    const signY = bankY + 54;
    doc.setDrawColor(203, 213, 225);
    doc.line(pageWidth - 75, signY + 12, pageWidth - 14, signY + 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`For ${vendorName}`, pageWidth - 75, signY + 16);
    doc.setFont('helvetica', 'normal');
    doc.text('Authorized Signatory', pageWidth - 75, signY + 20);

    doc.save(`Invoice_${cleaning.storeCode}_${cleaning.cleaningDate}.pdf`);
  } catch (err) {
    console.error('Invoice Generation Error:', err);
    alert('Invoice download failed: ' + err.message);
  }
}
