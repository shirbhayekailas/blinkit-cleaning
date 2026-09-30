import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { getBillSettings } from './billSettingsHelper';
import { DEFAULT_SK_LOGO } from './defaultLogo';

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

    // Read configured bill settings (Billed By & Billed To)
    const billConfig = getBillSettings();
    const bBySettings = billConfig.billedBy || {};
    const bToSettings = billConfig.billedTo || {};

    const bBy = { ...(vendorProfile || {}), ...bBySettings };
    const bTo = { ...(vendorProfile.clientProfile || {}), ...bToSettings };

    const vendorName = bBySettings.companyName || vendorProfile.companyName || cleaning.teamVendor || 'SK ENTERPRISES';
    const vendorTagline = bBySettings.tagline || vendorProfile.tagline || 'FACILITY MANAGEMENT & INDUSTRIAL DEEP CLEANING SOLUTIONS';
    const vendorPhone = bBySettings.phone || vendorProfile.phone || '09594023629';
    const vendorEmail = bBySettings.email || vendorProfile.email || 'skenterprises.clean@gmail.com';
    const vendorAddress = bBySettings.address || vendorProfile.address || '303, Panchsheel Chs Ltd., Sector -2, Taloja Phase -01, Navi Mumbai';
    const vendorGst = bBySettings.gstin || bBySettings.pan || vendorProfile.gstin || '27OQCPS0083R1ZU';
    const vendorState = bBySettings.state || vendorProfile.state || 'Maharashtra';
    const vendorStateCode = bBySettings.stateCode || vendorProfile.stateCode || '27';
    
    // Logo determination: Respect user removal (if empty or 'none', do NOT show logo)
    const rawLogo = (vendorProfile.logoUrl !== undefined) ? vendorProfile.logoUrl : bBySettings.logoUrl;
    const vendorLogo = (rawLogo && typeof rawLogo === 'string' && rawLogo.trim() !== '' && rawLogo !== 'none') ? rawLogo : null;

    // Bank Details: Priority: Direct Modal Edit -> Saved Bill Settings -> Fallback
    const bankName = vendorProfile.bankName || bBySettings.bankName || 'HDFC Bank';
    const bankAcc = vendorProfile.accountNumber || bBySettings.accountNumber || '50200012345678';
    const ifsc = vendorProfile.ifsc || bBySettings.ifsc || 'HDFC0001234';
    const accountHolder = vendorProfile.accountHolder || bBySettings.accountHolder || vendorName;
    const upiId = vendorProfile.upiId || bBySettings.upiId || 'cleanpro@hdfcbank';
    const signatoryTitle = vendorProfile.signatory || bBySettings.signatory || 'Authorized Signatory';

    // Billed To (Client Company)
    const clientName = bTo.companyName || 'Blinkit Commerce Private Limited';
    const clientDivision = bTo.division || 'Corporate Office & Dark Store Operations Division';
    const clientAddress = bTo.address || 'Ground Floor, Pioneer Square, Sector 62, Golf Course Ext Rd, Gurugram';
    const clientGstin = bTo.gstin || '';
    const clientState = bTo.state || '';
    const clientStateCode = bTo.stateCode || '';

    const cleanDateStr = cleaning.cleaningDate ? String(cleaning.cleaningDate).replace(/-/g, '') : new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const invoiceNo = `INV-${cleaning.storeCode || 'BLK'}-${cleanDateStr}`;

    // =============================================================
    // OFFICIAL LETTERHEAD HEADER
    // =============================================================
    const bannerHeight = 39;
    doc.setFillColor(15, 23, 42); // Dark Slate / Navy
    doc.rect(0, 0, pageWidth, bannerHeight, 'F');

    // Accent line at bottom of header banner
    doc.setFillColor(12, 131, 31); // Blinkit Green Accent
    doc.rect(0, bannerHeight, pageWidth, 2.5, 'F');

    // Company Logo Crest / Emblem
    const logoX = margin;
    const logoY = 7;
    const logoSize = 18;
    let logoDrawn = false;

    if (vendorLogo) {
      try {
        let fmt = 'JPEG';
        if (typeof vendorLogo === 'string' && vendorLogo.includes('image/png')) fmt = 'PNG';
        doc.addImage(vendorLogo, fmt, logoX, logoY, logoSize, logoSize);
        doc.setDrawColor(245, 158, 11); // Gold border
        doc.setLineWidth(0.6);
        doc.roundedRect(logoX, logoY, logoSize, logoSize, 2, 2, 'S');
        logoDrawn = true;
      } catch (err) {
        console.warn('Could not add image logo, using emblem fallback:', err);
      }
    }

    if (!logoDrawn) {
      doc.setFillColor(30, 41, 59); // Slate-800
      doc.roundedRect(logoX, logoY, logoSize, logoSize, 3, 3, 'F');
      doc.setDrawColor(245, 158, 11); // Amber-500 gold border
      doc.setLineWidth(0.8);
      doc.roundedRect(logoX, logoY, logoSize, logoSize, 3, 3, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(248, 203, 70); // Gold
      const logoLetters = (vendorName || 'SK').slice(0, 2).toUpperCase();
      doc.text(logoLetters, logoX + (logoSize / 2), logoY + 11, { align: 'center' });

      doc.setFontSize(5);
      doc.setTextColor(203, 213, 225);
      doc.text('FACILITY', logoX + (logoSize / 2), logoY + 15.5, { align: 'center' });
    }

    // Company Name & Tagline
    const titleX = logoX + logoSize + 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(248, 203, 70); // Gold
    doc.text(vendorName, titleX, 14);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text(vendorTagline, titleX, 19, { maxWidth: 110 });

    // Header Right: Document Title & Tax Tag
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('TAX INVOICE / BILL', pageWidth - margin, 13, { align: 'right' });

    doc.setFontSize(7.5);
    doc.setTextColor(52, 211, 153); // Emerald-400
    doc.text(`GST REG: ${vendorGst}`, pageWidth - margin, 18, { align: 'right' });

    // Letterhead Address & Contact Bar (Cleanly wrapped inside banner)
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);
    doc.text(
      vendorAddress,
      margin,
      28,
      { maxWidth: contentWidth }
    );

    doc.setFontSize(7);
    doc.setTextColor(203, 213, 225);
    doc.text(
      `Ph: ${vendorPhone}   |   GSTIN: ${vendorGst}   |   State: ${vendorState} (${vendorStateCode})${vendorEmail ? `   |   Email: ${vendorEmail}` : ''}`,
      margin,
      34,
      { maxWidth: contentWidth }
    );

    // -------------------------------------------------------------
    // Invoice Meta & Client Info (Two Clean, Non-Overlapping Columns)
    // -------------------------------------------------------------
    const startY = bannerHeight + 8;
    const maxLeftWidth = 98; // max width for Billed-To column
    const rightColX = 120;   // starting X for Invoice Details column
    const rightColWidth = pageWidth - margin - rightColX;

    let currentLeftY = startY;

    // Left Column: Billed To (Client Details)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('BILLED TO (CLIENT):', margin, currentLeftY);
    currentLeftY += 4.8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(clientName, margin, currentLeftY);
    currentLeftY += 4.2;

    if (clientDivision) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(clientDivision, margin, currentLeftY);
      currentLeftY += 4.0;
    }

    if (clientGstin) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(12, 131, 31);
      doc.text(`GSTIN: ${clientGstin}${clientState ? `  |  State: ${clientState}` : ''}`, margin, currentLeftY);
      currentLeftY += 4.0;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);

    const storeLines = doc.splitTextToSize(`Store Hub: ${cleaning.storeCode || ''} - ${cleaning.storeName || 'Dark Store'}`, maxLeftWidth);
    doc.text(storeLines, margin, currentLeftY);
    currentLeftY += storeLines.length * 4.0;

    const addressLines = doc.splitTextToSize(`Location: ${cleaning.address || clientAddress}`, maxLeftWidth);
    doc.text(addressLines, margin, currentLeftY);
    currentLeftY += addressLines.length * 4.0;

    if (cleaning.managerName) {
      const managerLines = doc.splitTextToSize(
        `Hub Manager: ${cleaning.managerName} (${cleaning.managerPhone || 'N/A'})`,
        maxLeftWidth
      );
      doc.text(managerLines, margin, currentLeftY);
      currentLeftY += managerLines.length * 4.0;
    }

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
    doc.text(`Bank Name: ${bankName}   |   A/c Holder: ${accountHolder}`, margin + 4, bankY + 14, { maxWidth: contentWidth - 8 });
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
    doc.text(signatoryTitle, pageWidth - 75, signY + 22);

    doc.save(`Invoice_${cleaning.storeCode || 'Store'}_${cleaning.cleaningDate || 'Date'}.pdf`);
  } catch (err) {
    console.error('Invoice Generation Error:', err);
    alert('Invoice download failed: ' + err.message);
  }
}
