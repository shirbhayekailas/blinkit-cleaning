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
  doc.text('BLINKIT DARK STORE FACILITY OPERATIONS • FOOD SAFETY AUDIT VERIFICATION', width / 2, 35, { align: 'center' });

  // Main Certificate Body
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('This is to officially certify that the following Blinkit Quick Commerce Dark Store:', width / 2, 54, { align: 'center' });

  // Store Name & Code Callout
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(12, 131, 31);
  doc.text(`${cleaning.storeName || 'Blinkit Dark Store'} (${cleaning.storeCode || 'BLK'})`, width / 2, 66, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`${cleaning.address || 'Standard Dark Store Facility'}, ${cleaning.city || 'Delhi NCR'}`, width / 2, 73, { align: 'center' });

  // Statement
  doc.setFontSize(10.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Has successfully undergone comprehensive mechanical floor scrubbing, chemical degreasing, cold chain sanitization,`,
    width / 2,
    84,
    { align: 'center' }
  );
  doc.text(
    `and comprehensive deep cleaning in accordance with strict Blinkit QA standards and Food Safety guidelines.`,
    width / 2,
    90,
    { align: 'center' }
  );

  // 5 Audit Compliance Checkpoints (2-Column Box)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.roundedRect(30, 98, width - 60, 48, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(12, 131, 31);
  doc.text('AUDIT CHECKLIST & VERIFIED SCOPE OF WORK:', 35, 106);

  const checks = [
    '✓ Chiller & Cold Room: Condenser fins de-dusted & food-grade sanitization applied',
    '✓ Racking & Aisles: 100% floor scrubbed with Single Disc machine & slurry extracted',
    '✓ Drains & Sump: Heavy grease traps cleared, de-sludged, and treated with enzyme cleaner',
    '✓ Washroom & Staff Area: Descaled, acid-treated, and sanitized with bio-cleaner',
    '✓ On-Time Handover: Store delivered clean & dry before 05:00 AM picker shift'
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  checks.forEach((chk, i) => {
    doc.text(chk, 35, 114 + (i * 6.5));
  });

  // Validity Dates Box
  const cleanDate = cleaning.cleaningDate || new Date().toISOString().split('T')[0];
  const validUntilObj = new Date(cleanDate);
  validUntilObj.setDate(validUntilObj.getDate() + 30);
  const validUntil = validUntilObj.toISOString().split('T')[0];

  doc.setFillColor(254, 243, 199); // Amber-100
  doc.roundedRect(30, 152, width - 60, 14, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(146, 64, 14); // Amber-900
  doc.text(
    `CLEANING DATE: ${cleanDate}   •   VALID UNTIL: ${validUntil}   •   HANDOVER: ${cleaning.punchOutTime || '04:45 AM'}   •   RATING: 5.0 / 5.0 ★`,
    width / 2,
    161,
    { align: 'center' }
  );

  // Signatures Row
  const sigY = 182;
  
  // Left: Site Supervisor
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.line(40, sigY, 100, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(cleaning.supervisorName || 'Site Supervisor', 70, sigY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Certified Site Supervisor', 70, sigY + 9, { align: 'center' });

  // Center: Official Stamp Box
  doc.setDrawColor(12, 131, 31);
  doc.setLineWidth(0.8);
  doc.roundedRect(width / 2 - 25, sigY - 10, 50, 22, 2, 2);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(12, 131, 31);
  doc.text('BLINKIT VENDOR OPS', width / 2, sigY - 3, { align: 'center' });
  doc.setFontSize(7.5);
  doc.setTextColor(217, 119, 6);
  doc.text('★ VERIFIED & APPROVED ★', width / 2, sigY + 3, { align: 'center' });
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`ID: ${cleaning.storeCode || 'BLK'}-${cleanDate.replace(/-/g, '')}`, width / 2, sigY + 8, { align: 'center' });

  // Right: Operations Head
  doc.line(width - 100, sigY, width - 40, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('Operations Head', width - 70, sigY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Facility Management Division', width - 70, sigY + 9, { align: 'center' });

  // Save PDF
  doc.save(`Blinkit_${cleaning.storeCode || 'Store'}_Hygiene_Certificate.pdf`);
}
