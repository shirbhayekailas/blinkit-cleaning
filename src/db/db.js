import Dexie from 'dexie';

// Purge legacy IndexedDB on startup so local browser storage never retains old ghost records
if (typeof window !== 'undefined' && window.indexedDB) {
  try {
    window.indexedDB.deleteDatabase('BlinkitDeepCleaningDB');
  } catch (e) {
    console.warn('Notice clearing legacy IndexedDB:', e);
  }
}

export const db = new Dexie('BlinkitDeepCleaningDB');

db.version(1).stores({
  stores: '++id, storeCode, storeName, city, managerName, managerPhone, createdAt',
  cleanings: '++id, storeId, storeCode, storeName, cleaningDate, paymentStatus, status, teamVendor, createdAt'
});

db.version(2).stores({
  stores: '++id, storeCode, storeName, city, managerName, managerPhone, createdAt',
  cleanings: '++id, storeId, storeCode, storeName, cleaningDate, paymentStatus, status, teamVendor, supervisorId, createdAt',
  supervisors: '++id, name, phone, pin, active, createdAt',
  cleaners: '++id, name, phone, dailyWage, active, createdAt',
  storeIssues: '++id, storeCode, cleaningId, issueType, status, reportedAt'
});

db.version(3).stores({
  stores: '++id, storeCode, storeName, city, managerName, managerPhone, createdAt',
  cleanings: '++id, storeId, storeCode, storeName, cleaningDate, paymentStatus, status, teamVendor, supervisorId, createdAt',
  supervisors: '++id, name, phone, pin, active, createdAt',
  cleaners: '++id, name, phone, dailyWage, active, createdAt',
  storeIssues: '++id, storeCode, cleaningId, issueType, status, reportedAt',
  chemicalStock: '++id, itemName, unit, totalStock, alertThreshold, updatedAt',
  chemicalLogs: '++id, chemicalId, itemName, type, quantity, storeCode, supervisorId, date, notes',
  cleanerAdvances: '++id, cleanerId, cleanerName, amount, date, paymentMode, remarks, createdAt',
  cleaningSchedules: '++id, storeCode, storeName, scheduledDate, shift, supervisorId, status, createdAt'
});

db.version(4).stores({
  stores: '++id, storeCode, storeName, city, managerName, managerPhone, createdAt',
  cleanings: '++id, storeId, storeCode, storeName, cleaningDate, paymentStatus, status, teamVendor, supervisorId, createdAt',
  supervisors: '++id, name, phone, pin, active, createdAt',
  cleaners: '++id, name, phone, dailyWage, active, createdAt',
  storeIssues: '++id, storeCode, cleaningId, issueType, status, reportedAt',
  chemicalStock: '++id, itemName, unit, totalStock, alertThreshold, updatedAt',
  chemicalLogs: '++id, chemicalId, itemName, type, quantity, storeCode, supervisorId, date, notes',
  cleanerAdvances: '++id, cleanerId, cleanerName, amount, date, paymentMode, remarks, createdAt',
  cleaningSchedules: '++id, storeCode, storeName, scheduledDate, shift, supervisorId, status, createdAt',
  loginLogs: '++id, role, userName, loginId, timestamp, status, device'
});

// No automatic demo seeding - database remains 100% clean for real vendor entries
export async function seedInitialData() {
  // Kept empty so real vendor operations start with a clean slate
  return;
}

// Helper to wipe all data
export async function clearAllData() {
  await db.cleanings.clear();
  await db.stores.clear();
  await db.supervisors.clear();
  await db.cleaners.clear();
  await db.storeIssues.clear();
  await db.chemicalStock.clear();
  await db.chemicalLogs.clear();
  await db.cleanerAdvances.clear();
  await db.cleaningSchedules.clear();
  try {
    if (db.loginLogs) await db.loginLogs.clear();
  } catch (e) {
    console.warn('Could not clear login logs:', e);
  }
}

