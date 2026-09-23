export function formatWhatsAppMessage(cleaning) {
  const statusEmoji = cleaning.status === 'Completed' ? '✅' : '⏳';
  const paymentEmoji = cleaning.paymentStatus === 'Received' ? '🟢' : cleaning.paymentStatus === 'Partial' ? '🟡' : '🔴';

  return `*🟡 BLINKIT DARK STORE DEEP CLEANING REPORT 🟡*
---------------------------------------
🏬 *Store Code:* ${cleaning.storeCode}
🏪 *Store Name:* ${cleaning.storeName}
📍 *Address:* ${cleaning.address || 'N/A'}
🗺️ *Location:* ${cleaning.googleMapsUrl || 'N/A'}
👤 *Store Manager:* ${cleaning.managerName || 'N/A'} (${cleaning.managerPhone || 'N/A'})

📅 *Date:* ${cleaning.cleaningDate}
⏰ *Shift:* ${cleaning.shift || 'Night Shift'}
⏱️ *Timings:* ${cleaning.startTime || '--'} to ${cleaning.endTime || '--'} (${cleaning.durationHours || 0} Hours)
${statusEmoji} *Work Status:* ${cleaning.status.toUpperCase()}

👥 *Service Vendor:* ${cleaning.teamVendor || 'Direct Team'}
👨‍💼 *Supervisor:* ${cleaning.supervisorName || 'N/A'} (${cleaning.supervisorPhone || 'N/A'})
👷 *Team Members Sent:*
${cleaning.teamMembers ? cleaning.teamMembers.split(',').map(m => `  • ${m.trim()}`).join('\n') : '  • N/A'}
📊 *Headcount:* ${cleaning.headcount || 0} People

🧹 *VENDOR SCOPE OF WORK EXECUTED:*
${(cleaning.scopeOfWork || [
  'Floor Deep Cleaning',
  'Toilet / Washroom Cleaning',
  'Cold Storage Area Cleaning',
  'Wall Dry & Rust Removal'
]).map(s => `  ✔ ${s}`).join('\n')}

💰 *BILLING & PAYMENT STATUS:*
💵 *Total Amount:* Rs. ${Number(cleaning.amount || 0).toLocaleString('en-IN')}
${paymentEmoji} *Payment Status:* ${cleaning.paymentStatus.toUpperCase()}
📥 *Amount Received:* Rs. ${Number(cleaning.amountReceived || 0).toLocaleString('en-IN')}
⏳ *Amount Pending:* Rs. ${Number(cleaning.amountPending || 0).toLocaleString('en-IN')}
${cleaning.utrNumber ? `💳 *UTR / Ref:* ${cleaning.utrNumber}\n` : ''}${cleaning.paymentDate ? `🗓️ *Payment Date:* ${cleaning.paymentDate}\n` : ''}
📋 *Checklist & Audit Score:* ${'⭐'.repeat(cleaning.rating || 5)} (${cleaning.rating || 5}/5)
💬 *Remarks:* ${cleaning.remarks || 'None'}
---------------------------------------
_Report generated via Blinkit Deep Cleaning Operations Tracker_`;
}

// 1-Click WhatsApp Payment Follow-up Reminder to Store Manager
export function formatPaymentReminderWhatsApp(cleaning) {
  const pendingAmount = Number(cleaning.amountPending || cleaning.amount || 0).toLocaleString('en-IN');
  const totalAmount = Number(cleaning.amount || 0).toLocaleString('en-IN');
  const vendorName = localStorage.getItem('vendor_company_name') || 'Deep Cleaning Vendor';
  const upiId = localStorage.getItem('vendor_upi_id') || '';

  return `*🔴 PAYMENT REMINDER: BLINKIT STORE DEEP CLEANING 🔴*
---------------------------------------
Dear *${cleaning.managerName || 'Store Manager'}*,

Namaste! This is a gentle reminder regarding the deep cleaning service completed at your dark store:

🏬 *Store:* ${cleaning.storeCode} - ${cleaning.storeName}
📅 *Cleaning Date:* ${cleaning.cleaningDate}
💼 *Vendor:* ${vendorName}

💰 *Total Bill:* Rs. ${totalAmount}
⏳ *Pending Balance:* *Rs. ${pendingAmount}*
${upiId ? `📲 *UPI ID for Payment:* \`${upiId}\`\n` : ''}
Kindly process the pending payment and share the UTR / transaction reference number with us.

Thank you for your cooperation!
---------------------------------------
_${vendorName}_`;
}
// 1-Click WhatsApp Store GMap Location Share
export function formatStoreLocationWhatsApp(storeOrCleaning) {
  const storeCode = storeOrCleaning.storeCode || 'BLINKIT';
  const storeName = storeOrCleaning.storeName || 'Dark Store';
  const address = storeOrCleaning.address || 'Address not listed';
  const city = storeOrCleaning.city || '';
  const managerName = storeOrCleaning.managerName || '';
  const managerPhone = storeOrCleaning.managerPhone || '';

  // Clean or construct Google Maps URL
  let gmapUrl = storeOrCleaning.googleMapsUrl ? storeOrCleaning.googleMapsUrl.trim() : '';
  if (!gmapUrl && (storeName || address)) {
    gmapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `Blinkit Dark Store ${storeCode} ${storeName} ${address}`.trim()
    )}`;
  }

  return `*📍 BLINKIT DARK STORE LOCATION 📍*
---------------------------------------
🏬 *Store Code:* ${storeCode}
🏪 *Store Name:* ${storeName}${city ? ` (${city})` : ''}
📌 *Address:* ${address}
${managerName ? `👤 *Store Manager:* ${managerName}${managerPhone ? ` (📞 ${managerPhone})` : ''}\n` : ''}
🗺️ *Google Maps Navigation Link:*
${gmapUrl}
---------------------------------------
_Shared via Blinkit Deep Cleaning Operations Tracker_`;
}

export function shareStoreLocationWhatsApp(storeOrCleaning, targetPhone = '') {
  const msg = formatStoreLocationWhatsApp(storeOrCleaning);
  const cleanPhone = (targetPhone || '').replace(/[^0-9]/g, '');
  const url = cleanPhone
    ? `https://api.whatsapp.com/send?phone=91${cleanPhone.length === 10 ? cleanPhone : cleanPhone}&text=${encodeURIComponent(msg)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

// 1-Click WhatsApp Store Manager 5-Star Rating & Review Request
export function formatStoreManagerRatingWhatsApp(cleaning) {
  const vendorName = localStorage.getItem('vendor_company_name') || cleaning.teamVendor || 'Deep Cleaning Services';
  const managerName = cleaning.managerName || 'Store Manager';
  const storeName = cleaning.storeName || 'Blinkit Dark Store';
  const storeCode = cleaning.storeCode || '';
  const cleaningDate = cleaning.cleaningDate || new Date().toISOString().split('T')[0];

  return `*⭐ SERVICE FEEDBACK & AUDIT RATING REQUEST ⭐*
---------------------------------------
Dear *${managerName}*,

Namaste! The scheduled deep cleaning shift at your dark store:
🏬 *Store:* ${storeCode ? `${storeCode} - ` : ''}${storeName}
📅 *Date:* ${cleaningDate}
💼 *Vendor:* ${vendorName}

has been completed by our team.

Kindly reply to this message with your service rating and feedback:
⭐⭐⭐⭐⭐ (5/5) - Excellent
⭐⭐⭐⭐ (4/5) - Good
⭐⭐⭐ (3/5) - Average

If you have any feedback or observations, please reply to this message. Your feedback helps us maintain Blinkit's highest hygiene standards!

Thank you!
---------------------------------------
_${vendorName}_`;
}

export function sendStoreManagerRatingWhatsApp(cleaning) {
  const msg = formatStoreManagerRatingWhatsApp(cleaning);
  const cleanPhone = (cleaning.managerPhone || '').replace(/[^0-9]/g, '');
  const url = cleanPhone
    ? `https://api.whatsapp.com/send?phone=91${cleanPhone.length === 10 ? cleanPhone : cleanPhone}&text=${encodeURIComponent(msg)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

