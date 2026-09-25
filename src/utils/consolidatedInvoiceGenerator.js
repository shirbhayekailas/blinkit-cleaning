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
    console.error('Error running autoTable in consolidated invoice:', err);
  }
}

export function generateConsolidatedInvoicePDF(cleanings = [], vendorProfile = {}, invoiceMeta = {}) {
  try {
    if (!cleanings || cleanings.length === 0) {
      alert('No cleanings selected for consolidated invoice.');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2); // 182 mm

    const vendorName = vendorProfile.companyName || 'SK ENTERPRISES';
    const vendorPhone = vendorProfile.phone || '09594023629';
    const vendorAddress = vendorProfile.address || '303, Panchsheel Chs Ltd., Plot No. 07, Sector -2, Taloja Phase -01, Navi Mumbai - 410208';
    const vendorGst = vendorProfile.gstin || vendorProfile.pan || '27OQCPS0083R1ZU';
    const bankName = vendorProfile.bankName || 'HDFC Bank';
    const bankAcc = vendorProfile.accountNumber || '50200012345678';
    const ifsc = vendorProfile.ifsc || 'HDFC0001234';
    const upiId = vendorProfile.upiId || 'cleanpro@hdfcbank';

    const monthLabel = invoiceMeta.monthLabel || 'Monthly Consolidated Billing';
    const invoiceNo = invoiceMeta.invoiceNumber || `INV-CONS-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;

    // =============================================================
    // OFFICIAL SK ENTERPRISES LETTERHEAD HEADER
    // =============================================================
    const bannerHeight = 39;
    doc.setFillColor(15, 23, 42); // Dark Navy
    doc.rect(0, 0, pageWidth, bannerHeight, 'F');

    // Accent line at bottom of header banner
    doc.setFillColor(12, 131, 31); // Blinkit Green Accent
    doc.rect(0, bannerHeight, pageWidth, 2.5, 'F');

    // SK ENTERPRISES Company Logo Crest / Emblem
    const logoX = margin;
    const logoY = 7;
    const logoSize = 18;
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.roundedRect(logoX, logoY, logoSize, logoSize, 3, 3, 'F');
    doc.setDrawColor(245, 158, 11); // Amber-500 gold border
    doc.setLineWidth(0.8);
    doc.roundedRect(logoX, logoY, logoSize, logoSize, 3, 3, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(248, 203, 70); // Gold
    doc.text('SK', logoX + (logoSize / 2), logoY + 11, { align: 'center' });

    doc.setFontSize(5);
    doc.setTextColor(203, 213, 225);
    doc.text('FACILITY', logoX + (logoSize / 2), logoY + 15.5, { align: 'center' });

    // Company Name & Tagline
    const titleX = logoX + logoSize + 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(248, 203, 70); // Gold
    doc.text('SK ENTERPRISES', titleX, 14);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text('FACILITY MANAGEMENT & INDUSTRIAL DEEP CLEANING SOLUTIONS', titleX, 19);

    // Header Right: Document Title & Month Cycle
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(255, 255, 255);
    doc.text('CONSOLIDATED TAX INVOICE', pageWidth - margin, 13, { align: 'right' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(248, 203, 70);
    doc.text(monthLabel.toUpperCase(), pageWidth - margin, 19, { align: 'right' });

    // Letterhead Address & Contact Bar
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);
    doc.text(
      '303, Panchsheel Chs Ltd., Plot No. 07, Sector -2, Taloja Phase -01, Navi Mumbai - 410208',
      margin,
      28,
      { maxWidth: contentWidth }
    );

    doc.setFontSize(7);
    doc.setTextColor(203, 213, 225);
    doc.text(
      `Ph: ${vendorPhone}   |   GSTIN / PAN: ${vendorGst}   |   State: Maharashtra (Code: 27)`,
      margin,
      34,
      { maxWidth: contentWidth }
    );

    // Client & Invoice Metadata
    const startY = bannerHeight + 8;
    const maxLeftWidth = 98;
    const rightColX = 120;
    const rightColWidth = pageWidth - margin - rightColX;

    let currentLeftY = startY;

    // Left: Billed To
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
    doc.text('Corporate Office & Dark Store Operations Division', margin, currentLeftY);
    currentLeftY += 4.2;
    doc.text(`Total Dark Stores Billed: ${cleanings.length} Stores`, margin, currentLeftY);
    currentLeftY += 4.2;

    // Right: Invoice Meta
    let currentRightY = startY;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('INVOICE METADATA:', rightColX, currentRightY);
    currentRightY += 4.8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`Invoice No: ${invoiceNo}`, rightColX, currentRightY, { maxWidth: rightColWidth });
    currentRightY += 4.2;
    doc.text(`Invoice Date: ${new Date().toLocaleDateString('en-IN')}`, rightColX, currentRightY);
    currentRightY += 4.2;
    doc.text(`Billing Cycle: ${monthLabel}`, rightColX, currentRightY, { maxWidth: rightColWidth });
    currentRightY += 4.5;

    const tableStartY = Math.max(currentLeftY, currentRightY) + 4;

    // Table of All Store Visits
    const bodyRows = cleanings.map((c, idx) => [
      idx + 1,
      c.storeCode || `BLK-${idx + 1}`,
      `${c.storeName || 'Blinkit Dark Store'} (${c.city || 'Delhi NCR'})`,
      c.cleaningDate || '--',
      'SAC 998533',
      `Rs. ${Number(c.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    ]);

    runAutoTable(doc, {
      startY: tableStartY,
      head: [['#', 'Store Code', 'Store Name & Cluster', 'Service Date', 'HSN/SAC', 'Amount']],
      body: bodyRows,
      theme: 'grid',
      headStyles: { fillColor: [12, 131, 31], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 25, fontStyle: 'bold' },
        2: { cellWidth: 70 },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' }
      }
    });

    // Total Calculation Section
    const subtotal = cleanings.reduce((sum, c) => sum + Number(c.amount || 0), 0);
    const totalReceived = cleanings.reduce((sum, c) => sum + Number(c.amountReceived || 0), 0);
    const totalPending = cleanings.reduce((sum, c) => sum + Number(c.amountPending || (c.amount - (c.amountReceived || 0))), 0);

    const tableEndY = doc.lastAutoTable?.finalY || 140;

    runAutoTable(doc, {
      startY: tableEndY + 2,
      body: [
        ['Subtotal Amount for All Stores:', `Rs. ${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
        ['GST (18% / Reverse Charge as applicable):', 'Rs. 0.00'],
        ['Grand Total Bill Amount:', `Rs. ${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
        ['Total Amount Received Till Date:', `Rs. ${totalReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
        ['Net Pending Balance Due:', `Rs. ${totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`]
      ],
      theme: 'plain',
      styles: { fontSize: 8.5, cellPadding: 1.5, halign: 'right' },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 140 },
        1: { fontStyle: 'bold', cellWidth: 42, textColor: [12, 131, 31] }
      }
    });

    // Bank & Payment Instructions Box
    const bankY = (doc.lastAutoTable?.finalY || 180) + 5;

    doc.setFillColor(248, 250, 252);
    doc.rect(14, bankY, pageWidth - 28, 36, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(14, bankY, pageWidth - 28, 36, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('VENDOR PAYMENT & BANK TRANSFER DETAILS:', 18, bankY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Bank Name: ${bankName}  |  A/c Holder: ${vendorName}`, 18, bankY + 14);
    doc.text(`Account Number: ${bankAcc}  |  IFSC Code: ${ifsc}`, 18, bankY + 21);
    doc.text(`UPI ID for Direct Settlement: ${upiId}`, 18, bankY + 28);

    // Signatures
    const signY = bankY + 44;
    doc.setDrawColor(203, 213, 225);
    doc.line(pageWidth - 75, signY + 10, pageWidth - 14, signY + 10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`For ${vendorName}`, pageWidth - 75, signY + 14);
    doc.setFont('helvetica', 'normal');
    doc.text('Authorized Signatory', pageWidth - 75, signY + 18);

    doc.save(`Consolidated_Invoice_${monthLabel.replace(/\s+/g, '_')}.pdf`);
  } catch (err) {
    console.error('Consolidated Invoice Generation Error:', err);
    alert('Consolidated invoice download failed: ' + err.message);
  }
}
