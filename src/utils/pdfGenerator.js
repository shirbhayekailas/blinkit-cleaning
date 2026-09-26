import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Safe helper for autoTable compatibility across ES modules and bundles
function runAutoTable(doc, options) {
  try {
    if (typeof autoTable === 'function') {
      autoTable(doc, options);
    } else if (typeof autoTable?.default === 'function') {
      autoTable.default(doc, options);
    } else if (typeof doc.autoTable === 'function') {
      doc.autoTable(options);
    } else {
      console.warn('autoTable is not available as a function');
    }
  } catch (err) {
    console.error('Error running autoTable:', err);
  }
}

export function generateCleaningPDF(cleaning) {
  if (!cleaning) {
    alert('No cleaning record provided to generate PDF.');
    return;
  }

  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // =============================================================
    // OFFICIAL SK ENTERPRISES LETTERHEAD HEADER
    // =============================================================
    const bannerHeight = 36;
    doc.setFillColor(15, 23, 42); // Dark Navy
    doc.rect(0, 0, pageWidth, bannerHeight, 'F');
    
    // Accent line at bottom of header banner
    doc.setFillColor(12, 131, 31); // Blinkit Green Accent
    doc.rect(0, bannerHeight, pageWidth, 2.5, 'F');

    // SK ENTERPRISES Logo Crest / Emblem
    const logoX = 14;
    const logoY = 6.5;
    const logoSize = 17;
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.roundedRect(logoX, logoY, logoSize, logoSize, 3, 3, 'F');
    doc.setDrawColor(245, 158, 11); // Amber-500 gold border
    doc.setLineWidth(0.8);
    doc.roundedRect(logoX, logoY, logoSize, logoSize, 3, 3, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(248, 203, 70); // Gold
    doc.text('SK', logoX + (logoSize / 2), logoY + 10.5, { align: 'center' });

    doc.setFontSize(4.5);
    doc.setTextColor(203, 213, 225);
    doc.text('FACILITY', logoX + (logoSize / 2), logoY + 14.8, { align: 'center' });

    // Company Name & Subtitle
    const titleX = logoX + logoSize + 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(248, 203, 70); // Gold
    doc.text('SK ENTERPRISES', titleX, 13.5);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text('FACILITY MANAGEMENT & COMMERCIAL DEEP CLEANING SERVICES', titleX, 18.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(226, 232, 240);
    doc.text('303, Panchsheel Chs Ltd., Sector -2, Taloja Phase -01, Navi Mumbai - 410208 | Ph: 09594023629', titleX, 24);
    doc.setFontSize(6.5);
    doc.setTextColor(203, 213, 225);
    doc.text('GSTIN: 27OQCPS0083R1ZU   |   State: Maharashtra (27)', titleX, 29);

    // Header Right: Document Title & Blinkit Dark Store Callout
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('STORE DEEP CLEANING COMPLETION REPORT', pageWidth - 14, 12.5, { align: 'right' });

    doc.setFontSize(7.5);
    doc.setTextColor(248, 203, 70); // Yellow
    doc.text('AUTHORIZED BLINKIT QUICK COMMERCE VENDOR', pageWidth - 14, 18, { align: 'right' });

    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`Doc Ref: DC-${cleaning.storeCode || 'BLK'}-${cleaning.cleaningDate || 'DATE'}`, pageWidth - 14, 24, { align: 'right' });
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, pageWidth - 14, 29, { align: 'right' });

    // Store & Audit Details Table
    runAutoTable(doc, {
      startY: bannerHeight + 5,
      head: [['Field / Parameter', 'Store & Cleaning Details']],
      body: [
        ['Store Code & Name', `${cleaning.storeCode || ''} - ${cleaning.storeName || ''}`],
        ['Store Address', cleaning.address || 'N/A'],
        ['Store Manager', `${cleaning.managerName || 'N/A'} (${cleaning.managerPhone || 'N/A'})`],
        ['Google Maps Location', cleaning.googleMapsUrl || 'Available in System Tracker'],
        ['Cleaning Date & Shift', `${cleaning.cleaningDate || ''}  |  ${cleaning.shift || 'Regular'}`],
        ['Cleaning Timings', `Start: ${cleaning.startTime || '--'}  |  End: ${cleaning.endTime || '--'}  (Duration: ${cleaning.durationHours || '0'} hrs)`],
        ['Service Agency / Vendor', 'SK ENTERPRISES (Authorized Deep Cleaning Vendor)'],
        ['Supervisor on Site', `${cleaning.supervisorName || 'N/A'} (${cleaning.supervisorPhone || 'N/A'})`],
        ['Cleaning Team Members', `${cleaning.teamMembers || 'N/A'} (Headcount: ${cleaning.headcount || 1})`],
        ['Cleaning Status', `${(cleaning.status || 'COMPLETED').toUpperCase()}  (Rating: ${cleaning.rating || 5}/5 Stars)`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [12, 131, 31], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8.5, cellPadding: 2.2 },
      columnStyles: {
        0: { cellWidth: 55, fontStyle: 'bold', textColor: [51, 65, 85] },
        1: { cellWidth: 'auto' }
      }
    });

    // Vendor Scope of Work Section
    const scopeY = (doc.lastAutoTable?.finalY || 42) + 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('Vendor Scope of Work & Execution Summary', 14, scopeY);

    const scopeList = cleaning.scopeOfWork || [
      'Floor Deep Cleaning',
      'Toilet / Washroom Cleaning',
      'Cold Storage Area Cleaning',
      'Wall Dry & Rust Removal'
    ];

    const scopeRows = [
      [
        'Floor Deep Cleaning (Machine Scrubbing & Degreasing)', 
        scopeList.includes('Floor Deep Cleaning') ? '[x] COMPLETED & VERIFIED' : '[-] NOT IN SCOPE', 
        'Cold Storage Area (Chiller & Freezer Sanitized)', 
        scopeList.includes('Cold Storage Area Cleaning') ? '[x] COMPLETED & VERIFIED' : '[-] NOT IN SCOPE'
      ],
      [
        'Toilet / Washroom Deep Cleaning & Sanitization', 
        scopeList.includes('Toilet / Washroom Cleaning') ? '[x] COMPLETED & VERIFIED' : '[-] NOT IN SCOPE', 
        'Wall Dry & Rust Removal (Dusting & Rust Treated)', 
        scopeList.includes('Wall Dry & Rust Removal') ? '[x] COMPLETED & VERIFIED' : '[-] NOT IN SCOPE'
      ]
    ];

    // If there are custom scope items, add them
    const extraScopes = scopeList.filter(s => ![
      'Floor Deep Cleaning',
      'Toilet / Washroom Cleaning',
      'Cold Storage Area Cleaning',
      'Wall Dry & Rust Removal'
    ].includes(s));

    if (extraScopes.length > 0) {
      extraScopes.forEach(extra => {
        scopeRows.push([extra, '[x] COMPLETED & VERIFIED', '', '']);
      });
    }

    runAutoTable(doc, {
      startY: scopeY + 2,
      head: [['Scope Item', 'Status', 'Scope Item', 'Status']],
      body: scopeRows,
      theme: 'grid',
      headStyles: { fillColor: [12, 131, 31], textColor: [255, 255, 255] },
      styles: { fontSize: 8.5, cellPadding: 2.2 },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { textColor: [12, 131, 31], fontStyle: 'bold' },
        2: { fontStyle: 'bold' },
        3: { textColor: [12, 131, 31], fontStyle: 'bold' }
      }
    });

    // Chemicals & Consumables Deployed Table
    if (cleaning.chemicalsUsed && cleaning.chemicalsUsed.length > 0) {
      const chemY = (doc.lastAutoTable?.finalY || scopeY + 25) + 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      doc.text('CHEMICALS & CONSUMABLES DEPLOYED', 14, chemY);

      const chemRows = cleaning.chemicalsUsed.map(c => [
        c.itemName || c.name || 'Chemical Product',
        `${c.quantity} ${c.unit || 'Liters'}`,
        'Diversey / Industrial Grade',
        '[x] VERIFIED & DEPLOYED'
      ]);

      runAutoTable(doc, {
        startY: chemY + 2,
        head: [['Chemical Product', 'Quantity Used', 'Specification / Grade', 'Audit Verification']],
        body: chemRows,
        theme: 'grid',
        headStyles: { fillColor: [109, 40, 217], textColor: [255, 255, 255] },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: 'bold' },
          1: { fontStyle: 'bold', textColor: [109, 40, 217] },
          3: { textColor: [12, 131, 31], fontStyle: 'bold' }
        }
      });
    }

    // Remarks & Signatures
    let signY = (doc.lastAutoTable?.finalY || scopeY + 25) + 8;
    
    if (cleaning.remarks) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Supervisor Remarks: "${cleaning.remarks}"`, 14, signY);
      signY += 8;
    }

    // Check if signatures fit on page 1
    if (signY + 25 > pageHeight - 15) {
      doc.addPage();
      signY = 30;
    }

    const sigBoxY = signY + 5;
    
    // Supervisor Sign Box
    doc.setDrawColor(203, 213, 225);
    doc.line(14, sigBoxY + 12, 75, sigBoxY + 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Supervisor: ${cleaning.supervisorName || 'Site Supervisor'}`, 14, sigBoxY + 16);
    doc.text('For SK ENTERPRISES (Field Operations)', 14, sigBoxY + 20);

    // Store Manager Sign Box with Digital Signature Image
    if (cleaning.managerSignature) {
      try {
        doc.addImage(cleaning.managerSignature, 'PNG', pageWidth - 75, sigBoxY - 5, 55, 16);
      } catch (sigErr) {
        console.warn('Could not add digital signature image', sigErr);
      }
    }
    doc.line(pageWidth - 75, sigBoxY + 12, pageWidth - 14, sigBoxY + 12);
    doc.text(`Store Manager: ${cleaning.managerName || 'Store Manager'}`, pageWidth - 75, sigBoxY + 16);
    doc.text(cleaning.managerSignature ? '[DIGITALLY SIGNED ON SITE]' : 'Blinkit Dark Store Authorization', pageWidth - 75, sigBoxY + 20);

    // Photo Section on Page 2 if photos exist
    if (cleaning.photos && cleaning.photos.length > 0) {
      doc.addPage();
      
      // Page 2 Header
      doc.setFillColor(248, 203, 70);
      doc.rect(0, 0, pageWidth, 20, 'F');
      doc.setTextColor(17, 24, 39);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(`Photo Audit Evidence: ${cleaning.storeCode || ''} - ${cleaning.storeName || ''}`, 14, 13);

      let photoX = 14;
      let photoY = 30;
      const imgWidth = 85;
      const imgHeight = 60;

      cleaning.photos.forEach((photo, idx) => {
        try {
          if (photo.url && typeof photo.url === 'string' && photo.url.startsWith('data:image')) {
            let format = 'JPEG';
            if (photo.url.startsWith('data:image/png')) format = 'PNG';
            else if (photo.url.startsWith('data:image/webp')) format = 'WEBP';
            doc.addImage(photo.url, format, photoX, photoY, imgWidth, imgHeight);
          } else {
            // Placeholder box
            doc.setFillColor(241, 245, 249);
            doc.rect(photoX, photoY, imgWidth, imgHeight, 'F');
            doc.setDrawColor(203, 213, 225);
            doc.rect(photoX, photoY, imgWidth, imgHeight, 'S');
            doc.setFontSize(9);
            doc.setTextColor(100, 116, 139);
            doc.text(`[${(photo.type || 'PHOTO').toUpperCase()}]`, photoX + 10, photoY + 25);
            doc.text(photo.title || 'Audit Photo', photoX + 10, photoY + 35);
          }

          // Label under photo
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(15, 23, 42);
          doc.text(`${photo.type ? photo.type.toUpperCase() : 'PHOTO'}: ${photo.title || 'Site Photo'}`, photoX, photoY + imgHeight + 4);
          if (photo.timestamp) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(100, 116, 139);
            doc.text(`Timestamp: ${photo.timestamp}`, photoX, photoY + imgHeight + 8);
          }

          // Layout grid (2 columns)
          if (idx % 2 === 0) {
            photoX = 14 + imgWidth + 12;
          } else {
            photoX = 14;
            photoY += imgHeight + 16;
            if (photoY > pageHeight - 75 && idx < cleaning.photos.length - 1) {
              doc.addPage();
              photoY = 30;
            }
          }
        } catch (imgErr) {
          console.error('Error rendering image in PDF:', imgErr);
        }
      });
    }

    // Save PDF
    const filename = `Blinkit_DeepCleaning_${cleaning.storeCode || 'Store'}_${cleaning.cleaningDate || 'Date'}.pdf`;
    doc.save(filename);
  } catch (err) {
    console.error('Fatal PDF Generation Error:', err);
    alert('PDF download failed: ' + err.message);
  }
}
