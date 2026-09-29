/**
 * Bill Settings Helper
 * Manages configuration for:
 * 1. Billed By (Vendor Company issuing the bill)
 * 2. Billed To (Client Company being invoiced)
 */

export const DEFAULT_BILL_SETTINGS = {
  // 1. Company issuing the bill (Vendor / Facility Agency)
  billedBy: {
    companyName: 'SK ENTERPRISES',
    tagline: 'FACILITY MANAGEMENT & INDUSTRIAL DEEP CLEANING SOLUTIONS',
    address: '303, Panchsheel Chs Ltd., Plot No. 07, Sector -2, Taloja Phase -01, Navi Mumbai - 410208',
    gstin: '27OQCPS0083R1ZU',
    pan: 'OQCPS0083R',
    state: 'Maharashtra',
    stateCode: '27',
    phone: '09594023629',
    email: 'skenterprises.clean@gmail.com',
    bankName: 'HDFC Bank',
    accountNumber: '50200012345678',
    ifsc: 'HDFC0001234',
    accountHolder: 'SK ENTERPRISES',
    upiId: 'cleanpro@hdfcbank',
    signatory: 'Authorized Signatory'
  },
  // 2. Client Company being invoiced (Dark Store / Retail Operations)
  billedTo: {
    companyName: 'Blinkit Commerce Private Limited',
    division: 'Corporate Office & Dark Store Operations Division',
    address: 'Ground Floor, Pioneer Square, Sector 62, Golf Course Extension Road, Gurugram, Haryana - 122098',
    gstin: '07AAGCB2224A1ZL',
    pan: 'AAGCB2224A',
    state: 'Haryana',
    stateCode: '06',
    contactPerson: 'City Operations & Quality Assurance Lead',
    email: 'billing.darkstore@blinkit.com',
    phone: '1800-208-8888',
    includeStoreDetails: true
  }
};

const STORAGE_KEY = 'blinkit_bill_settings_v1';

export function getBillSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        billedBy: { ...DEFAULT_BILL_SETTINGS.billedBy, ...(parsed.billedBy || {}) },
        billedTo: { ...DEFAULT_BILL_SETTINGS.billedTo, ...(parsed.billedTo || {}) }
      };
    }
  } catch (err) {
    console.warn('Error reading bill settings from localStorage:', err);
  }
  return JSON.parse(JSON.stringify(DEFAULT_BILL_SETTINGS));
}

export function saveBillSettings(settings) {
  try {
    const current = getBillSettings();
    const merged = {
      billedBy: { ...current.billedBy, ...(settings.billedBy || {}) },
      billedTo: { ...current.billedTo, ...(settings.billedTo || {}) }
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    
    // Also sync to legacy vendor_invoice_profile key so legacy readers cannot overwrite updated bank details
    try {
      localStorage.setItem('vendor_invoice_profile', JSON.stringify({
        ...merged.billedBy
      }));
    } catch (e) {}

    window.dispatchEvent(new CustomEvent('bill-settings-updated', { detail: merged }));

    // Asynchronously save to cloud database
    try {
      import('../services/api').then(({ saveCloudBillSettings }) => {
        saveCloudBillSettings(merged);
      }).catch(() => {});
    } catch (e) {}

    return true;
  } catch (err) {
    console.error('Error saving bill settings:', err);
    return false;
  }
}
