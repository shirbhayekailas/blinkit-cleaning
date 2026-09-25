import { jsPDF } from 'jspdf';

export function generateHygieneCertificate(cleaning) {
  if (!cleaning) return;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const width = doc.internal.pageSize.getWidth(); // ~297 mm
  const height = doc.internal.pageSize.getHeight(); // ~210 mm

  // Outer Ornamental Border (Gold / Amber)
  doc.setDrawColor(217, 119, 6); // Amber-600
  doc.setLineWidth(2.5);
  doc.rect(8, 8, width - 16, height - 16);

  // Inner Thin Border
  doc.setDrawColor(12, 131, 31); // Blinkit Green
  doc.setLineWidth(0.8);
  doc.rect(12, 12, width - 24, height - 24);

  // Corner Accents
  doc.setFillColor(248, 203, 70); // Blinkit Yellow
  doc.circle(12, 12, 3, 'F');
  doc.circle(width - 12, 12, 3, 'F');
  doc.circle(12, height - 12, 3, 'F');
  doc.circle(width - 12, height - 12, 3, 'F');

  // Top Brand Header Banner
  doc.setFillColor(12, 131, 31); // Blinkit Green
  doc.rect(20, 18, width - 40, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('CERTIFICATE OF DEEP CLEANING & HYGIENE COMPLIANCE', width / 2, 28, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(248, 203, 70);
  doc.text('BLINKIT DARK STORE FACILITY OPERATIONS - FOOD SAFETY AUDIT VERIFICATION', width / 2, 35, { align: 'center' });

  // Main Certificate Body
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('This is to officially certify that the following Blinkit Quick Commerce Dark Store:', width / 2, 53, { align: 'center' });

  // Store Name & Code Callout
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(12, 131, 31);
  doc.text(`${cleaning.storeName || 'Blinkit Dark Store'} (${cleaning.storeCode || 'BLK'})`, width / 2, 65, { align: 'center', maxWidth: width - 50 });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  const fullAddress = `${cleaning.address || 'Standard Dark Store Facility'}${cleaning.city ? `, ${cleaning.city}` : ''}`;
  doc.text(fullAddress, width / 2, 72, { align: 'center', maxWidth: width - 60 });

  // Statement
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.text(
    'Has successfully undergone comprehensive mechanical floor scrubbing, chemical degreasing, cold chain sanitization,',
    width / 2,
    82,
    { align: 'center' }
  );
  doc.text(
    'and comprehensive deep cleaning in accordance with strict Blinkit QA standards and Food Safety guidelines.',
    width / 2,
    88,
    { align: 'center' }
  );

  // 5 Audit Compliance Checkpoints (Clean 2-Part Line Display with Badge)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.roundedRect(30, 94, width - 60, 52, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(12, 131, 31);
  doc.text('AUDIT CHECKLIST & VERIFIED SCOPE OF WORK:', 36, 102);

  const checks = [
    { title: 'Chiller & Cold Room:', desc: 'Condenser fins de-dusted & food-grade sanitization applied' },
    { title: 'Racking & Aisles:', desc: '100% floor scrubbed with Single Disc machine & slurry extracted' },
    { title: 'Drains & Sump:', desc: 'Heavy grease traps cleared, de-sludged, and treated with enzyme cleaner' },
    { title: 'Washroom & Staff Area:', desc: 'Descaled, acid-treated, and sanitized with bio-cleaner' },
    { title: 'On-Time Handover:', desc: 'Store delivered clean & dry before 05:00 AM picker shift' }
  ];

  checks.forEach((item, i) => {
    const itemY = 110 + (i * 7);
    
    // Green check badge
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(12, 131, 31);
    doc.text('[VERIFIED]', 36, itemY);

    // Title
    doc.setTextColor(15, 23, 42);
    doc.text(item.title, 56, itemY);

    // Description
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const titleWidth = doc.getTextWidth(item.title);
    doc.text(item.desc, 58 + titleWidth, itemY);
  });

  // Validity Dates Box
  const cleanDate = cleaning.cleaningDate || new Date().toISOString().split('T')[0];
  const validUntilObj = new Date(cleanDate);
  validUntilObj.setDate(validUntilObj.getDate() + 30);
  const validUntil = validUntilObj.toISOString().split('T')[0];

  doc.setFillColor(254, 243, 199); // Amber-100
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.4);
  doc.roundedRect(30, 150, width - 60, 11, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(146, 64, 14); // Amber-900
  doc.text(
    `CLEANING DATE: ${cleanDate}   |   VALID UNTIL: ${validUntil}   |   SHIFT HANDOVER: ${cleaning.punchOutTime || '04:45 AM'}   |   AUDIT RATING: 5.0 / 5.0 (EXCELLENT)`,
    width / 2,
    157.5,
    { align: 'center' }
  );

  // Signatures Row
  const sigY = 178;
  
  // Left: Site Supervisor
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.line(36, sigY, 96, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(cleaning.supervisorName || 'Site Supervisor', 66, sigY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Certified Site Supervisor', 66, sigY + 9, { align: 'center' });

  // Center: Official Stamp Box
  const stampW = 60;
  const stampH = 22;
  const stampX = width / 2 - (stampW / 2);
  const stampY = sigY - 11;

  doc.setFillColor(240, 253, 244); // Emerald-50
  doc.setDrawColor(12, 131, 31);
  doc.setLineWidth(0.8);
  doc.roundedRect(stampX, stampY, stampW, stampH, 2, 2, 'FD');

  doc.setDrawColor(187, 247, 208);
  doc.setLineWidth(0.3);
  doc.roundedRect(stampX + 1.2, stampY + 1.2, stampW - 2.4, stampH - 2.4, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(12, 131, 31);
  doc.text('BLINKIT VENDOR OPS', width / 2, stampY + 6.5, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setTextColor(180, 83, 9);
  doc.text('AUDIT VERIFIED & APPROVED', width / 2, stampY + 12, { align: 'center' });

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`ID: ${cleaning.storeCode || 'BLK'}-${cleanDate.replace(/-/g, '')}`, width / 2, stampY + 17.5, { align: 'center' });

  // Right: Operations Head
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.line(width - 96, sigY, width - 36, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('Operations Head', width - 66, sigY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Facility Management Division', width - 66, sigY + 9, { align: 'center' });

  // Save PDF
  doc.save(`Blinkit_${cleaning.storeCode || 'Store'}_Hygiene_Certificate.pdf`);
}
