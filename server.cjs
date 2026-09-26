const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database directory & file
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DEFAULT_DB = {
  cleanings: [],
  stores: [],
  supervisors: [],
  cleaners: [],
  cleaningSchedules: [],
  chemicalStock: [],
  chemicalLogs: [],
  cleanerAdvances: [],
  storeIssues: [],
  loginLogs: [],
  deletedStores: [],
  deletedCleanings: [],
  deletedSupervisors: [],
  deletedCleaners: [],
  deletedSchedules: [],
  deletedAdvances: [],
  logsClearedAt: null,
  appSettings: {
    vendor_admin_id: 'admin',
    vendor_admin_pin: '1234',
    vendor_manager_id: 'manager',
    vendor_manager_pin: '1234',
    vendor_manager_name: 'Operations Manager',
    blinkit_client_id: 'client',
    blinkit_client_pin: '5678',
    blinkit_client_name: 'Blinkit City Operations Head'
  },
  lastUpdated: new Date().toISOString()
};

function readDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(content);
      return { ...DEFAULT_DB, ...parsed };
    }
  } catch (err) {
    console.error('Error reading database file:', err);
  }
  return { ...DEFAULT_DB };
}

function writeDB(data) {
  try {
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing database file:', err);
    return false;
  }
}

if (!fs.existsSync(DB_FILE)) {
  writeDB(DEFAULT_DB);
}

// -------------------------------------------------------------
// INTELLIGENT RECORD MERGE HELPERS (Prevents ID collisions)
// -------------------------------------------------------------

function isCleaningDeleted(c, deletedCleanings = []) {
  if (!c || !deletedCleanings || deletedCleanings.length === 0) return false;
  const cSyncId = c.syncId ? String(c.syncId) : null;
  const cStoreCode = c.storeCode ? String(c.storeCode).trim().toUpperCase() : null;
  const cDate = c.cleaningDate ? String(c.cleaningDate).trim() : null;
  const cId = c.id ? String(c.id) : null;

  return deletedCleanings.some(d => {
    if (!d) return false;
    if (typeof d === 'string') {
      if (cSyncId && d === cSyncId) return true;
      if (cStoreCode && cDate && d === `${cStoreCode}_${cDate}`) return true;
      if (cId && d === `id_${cId}`) return true;
      return false;
    }
    if (d.syncId && cSyncId && String(d.syncId) === cSyncId) return true;
    if (d.key) {
      if (cSyncId && d.key === cSyncId) return true;
      if (cStoreCode && cDate && d.key === `${cStoreCode}_${cDate}`) return true;
      if (cId && d.key === `id_${cId}`) return true;
    }
    if (d.storeCode && d.cleaningDate && cStoreCode && cDate) {
      if (String(d.storeCode).trim().toUpperCase() === cStoreCode && String(d.cleaningDate).trim() === cDate) {
        return true;
      }
    }
    return false;
  });
}

function isStoreDeleted(s, deletedStores = []) {
  if (!s || !deletedStores || deletedStores.length === 0) return false;
  const code = (s.storeCode || '').trim().toUpperCase();
  if (!code) return false;
  return deletedStores.some(d => {
    if (!d) return false;
    const delCode = typeof d === 'string' ? d.trim().toUpperCase() : (d.storeCode || '').trim().toUpperCase();
    return delCode === code;
  });
}

function mergeCleanings(existing = [], incoming = [], deletedCleanings = []) {
  const map = new Map();
  const getKey = (c) => {
    if (!c) return null;
    if (c.syncId) return String(c.syncId);
    if (c.storeCode && c.cleaningDate) return `${String(c.storeCode).trim().toUpperCase()}_${String(c.cleaningDate).trim()}`;
    return c.id ? `id_${c.id}` : null;
  };

  for (const c of existing) {
    if (isCleaningDeleted(c, deletedCleanings)) continue;
    const key = getKey(c);
    if (key) map.set(key, c);
  }
  for (const c of incoming) {
    if (isCleaningDeleted(c, deletedCleanings)) continue;
    const key = getKey(c);
    if (!key) continue;
    const old = map.get(key);
    if (!old) {
      map.set(key, c);
    } else {
      const oldTime = new Date(old.updatedAt || old.createdAt || 0).getTime();
      const newTime = new Date(c.updatedAt || c.createdAt || Date.now()).getTime();
      if (newTime >= oldTime) {
        map.set(key, { ...old, ...c });
      }
    }
  }
  return Array.from(map.values());
}

function mergeStores(existing = [], incoming = [], deletedStores = []) {
  const map = new Map();
  for (const s of existing) {
    if (isStoreDeleted(s, deletedStores)) continue;
    if (s && s.storeCode) map.set(s.storeCode.trim().toUpperCase(), s);
  }
  for (const s of incoming) {
    if (isStoreDeleted(s, deletedStores)) continue;
    if (!s || !s.storeCode) continue;
    const code = s.storeCode.trim().toUpperCase();
    const old = map.get(code);
    if (!old) {
      map.set(code, s);
    } else {
      map.set(code, { ...old, ...s });
    }
  }
  return Array.from(map.values());
}

function isSupervisorDeleted(s, deletedSupervisors = []) {
  if (!s || !deletedSupervisors || deletedSupervisors.length === 0) return false;
  const phone = s.phone ? String(s.phone).trim() : null;
  const id = s.id ? String(s.id) : null;
  return deletedSupervisors.some(d => {
    if (!d) return false;
    if (typeof d === 'string') return d === phone || d === id;
    if (phone && d.phone && String(d.phone).trim() === phone) return true;
    if (id && d.id && String(d.id) === id) return true;
    return false;
  });
}

function isCleanerDeleted(c, deletedCleaners = []) {
  if (!c || !deletedCleaners || deletedCleaners.length === 0) return false;
  const phone = c.phone ? String(c.phone).trim() : null;
  const name = c.name ? String(c.name).trim().toLowerCase() : null;
  const id = c.id ? String(c.id) : null;
  return deletedCleaners.some(d => {
    if (!d) return false;
    if (typeof d === 'string') return d === phone || d === name || d === id;
    if (phone && d.phone && String(d.phone).trim() === phone) return true;
    if (name && d.name && String(d.name).trim().toLowerCase() === name) return true;
    if (id && d.id && String(d.id) === id) return true;
    return false;
  });
}

function isScheduleDeleted(s, deletedSchedules = []) {
  if (!s || !deletedSchedules || deletedSchedules.length === 0) return false;
  const sc = s.storeCode ? String(s.storeCode).trim().toUpperCase() : null;
  const sd = s.scheduledDate ? String(s.scheduledDate).trim() : null;
  const id = s.id ? String(s.id) : null;
  return deletedSchedules.some(d => {
    if (!d) return false;
    if (typeof d === 'string') return d === id;
    if (sc && sd && d.storeCode && d.scheduledDate && String(d.storeCode).trim().toUpperCase() === sc && String(d.scheduledDate).trim() === sd) return true;
    if (id && d.id && String(d.id) === id) return true;
    return false;
  });
}

function isAdvanceDeleted(a, deletedAdvances = []) {
  if (!a || !deletedAdvances || deletedAdvances.length === 0) return false;
  const id = a.id ? String(a.id) : null;
  return deletedAdvances.some(d => {
    if (!d) return false;
    if (typeof d === 'string') return d === id;
    if (id && d.id && String(d.id) === id) return true;
    return false;
  });
}

function mergeSupervisors(existing = [], incoming = [], deletedSupervisors = []) {
  const map = new Map();
  for (const s of existing) {
    if (isSupervisorDeleted(s, deletedSupervisors)) continue;
    if (s && s.phone) map.set(String(s.phone).trim(), s);
  }
  for (const s of incoming) {
    if (isSupervisorDeleted(s, deletedSupervisors)) continue;
    if (!s || !s.phone) continue;
    const phone = String(s.phone).trim();
    const old = map.get(phone);
    if (!old) {
      map.set(phone, s);
    } else {
      map.set(phone, { ...old, ...s });
    }
  }
  return Array.from(map.values());
}

function mergeGeneric(existing = [], incoming = [], keyFn, isDeletedFn = null) {
  const map = new Map();
  for (const item of existing) {
    if (!item) continue;
    if (isDeletedFn && isDeletedFn(item)) continue;
    const key = keyFn(item);
    if (key) map.set(key, item);
  }
  for (const item of incoming) {
    if (!item) continue;
    if (isDeletedFn && isDeletedFn(item)) continue;
    const key = keyFn(item);
    if (!key) continue;
    const old = map.get(key);
    if (!old) {
      map.set(key, item);
    } else {
      const oldTime = new Date(old.updatedAt || old.createdAt || 0).getTime();
      const newTime = new Date(item.updatedAt || item.createdAt || Date.now()).getTime();
      if (newTime >= oldTime) {
        map.set(key, { ...old, ...item });
      }
    }
  }
  return Array.from(map.values());
}

// -------------------------------------------------------------
// AUTHENTICATION & LOGIN API
// -------------------------------------------------------------

app.post('/api/auth/login', (req, res) => {
  try {
    const { loginId, password, deviceInfo } = req.body || {};
    const inputId = (loginId || '').trim();
    const inputPass = (password || '').trim();

    if (!inputId || !inputPass) {
      return res.status(400).json({ success: false, message: 'Login ID aur Password dono darj karein.' });
    }

    const currentDB = readDB();
    const settings = currentDB.appSettings || DEFAULT_DB.appSettings;

    // Helper to log audit trail
    const logAttempt = (role, userName, status, notes = '') => {
      const logEntry = {
        role,
        userName,
        loginId: inputId,
        status,
        notes,
        device: deviceInfo || 'Web Browser',
        timestamp: new Date().toISOString(),
        id: Date.now() + Math.floor(Math.random() * 1000)
      };
      currentDB.loginLogs = [logEntry, ...(currentDB.loginLogs || [])].slice(0, 500);
      writeDB(currentDB);
    };

    // 1. Vendor Admin / Owner
    const adminId = (settings.vendor_admin_id || 'admin').toLowerCase();
    const adminPin = String(settings.vendor_admin_pin || '1234');
    if (inputId.toLowerCase() === adminId && inputPass === adminPin) {
      logAttempt('admin', 'Vendor Admin / Owner', 'Success');
      return res.json({
        success: true,
        role: 'admin',
        user: { name: 'Vendor Admin / Owner', loginId: adminId },
        appSettings: settings,
        data: currentDB
      });
    }

    // 2. Operations Manager
    const managerId = (settings.vendor_manager_id || 'manager').toLowerCase();
    const managerPin = String(settings.vendor_manager_pin || '1234');
    const managerName = settings.vendor_manager_name || 'Operations Manager';
    if (inputId.toLowerCase() === managerId && inputPass === managerPin) {
      logAttempt('manager', managerName, 'Success');
      return res.json({
        success: true,
        role: 'manager',
        user: { name: managerName, loginId: managerId },
        appSettings: settings,
        data: currentDB
      });
    }

    // 3. Blinkit Client Ops Head
    const clientId = (settings.blinkit_client_id || 'client').toLowerCase();
    const clientPin = String(settings.blinkit_client_pin || '5678');
    const clientName = settings.blinkit_client_name || 'Blinkit City Operations Head';
    if (inputId.toLowerCase() === clientId && inputPass === clientPin) {
      logAttempt('client', clientName, 'Success');
      return res.json({
        success: true,
        role: 'client',
        user: { name: clientName, loginId: clientId },
        appSettings: settings,
        data: currentDB
      });
    }

    // 4. Site Supervisors (Match by clean phone or ID)
    const cleanPhone = inputId.replace(/[^0-9]/g, '');
    const supervisor = (currentDB.supervisors || []).find(s => 
      s && (
        (cleanPhone && String(s.phone).replace(/[^0-9]/g, '') === cleanPhone) ||
        String(s.phone) === inputId
      )
    );

    if (supervisor && String(supervisor.pin) === inputPass) {
      if (supervisor.active === false) {
        logAttempt('supervisor', supervisor.name, 'Failed', 'Deactivated account attempt');
        return res.status(403).json({
          success: false,
          message: 'Ye supervisor account deactivate kiya gaya hai. Admin se sampark karein.'
        });
      }
      logAttempt('supervisor', supervisor.name, 'Success');
      return res.json({
        success: true,
        role: 'supervisor',
        user: supervisor,
        appSettings: settings,
        data: currentDB
      });
    }

    // 5. Invalid credentials
    logAttempt('unknown', 'Unrecognized User', 'Failed', 'Invalid credentials entered');
    return res.status(401).json({
      success: false,
      message: 'Galat Login ID ya Password darj kiya gaya hai. Kripya check karke dobara dalein.'
    });

  } catch (err) {
    console.error('Server auth login error:', err);
    res.status(500).json({ success: false, message: 'Server auth error: ' + err.message });
  }
});

app.post('/api/auth/change-pin', (req, res) => {
  try {
    const { role, newPin, userId } = req.body || {};
    if (!newPin || String(newPin).trim().length < 4) {
      return res.status(400).json({ success: false, message: 'PIN kam se kam 4 digits ka hona chahiye.' });
    }

    const currentDB = readDB();
    if (!currentDB.appSettings) currentDB.appSettings = { ...DEFAULT_DB.appSettings };

    const cleanPin = String(newPin).trim();

    if (role === 'admin') {
      currentDB.appSettings.vendor_admin_pin = cleanPin;
    } else if (role === 'manager') {
      currentDB.appSettings.vendor_manager_pin = cleanPin;
    } else if (role === 'client') {
      currentDB.appSettings.blinkit_client_pin = cleanPin;
    } else if (role === 'supervisor' && userId) {
      currentDB.supervisors = (currentDB.supervisors || []).map(s => {
        if (s.id === userId || String(s.phone) === String(userId)) {
          return { ...s, pin: cleanPin, hasChangedPin: true, updatedAt: new Date().toISOString() };
        }
        return s;
      });
    }

    writeDB(currentDB);
    res.json({
      success: true,
      message: 'PIN server par successfully update ho gaya!',
      appSettings: currentDB.appSettings
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server change PIN error: ' + err.message });
  }
});

// -------------------------------------------------------------
// PURE SERVER-SIDE DATABASE CRUD ENDPOINTS (No local storage ghosting)
// -------------------------------------------------------------

// 1. Get complete server database state
app.get('/api/state', (req, res) => {
  const currentDB = readDB();
  res.json({
    success: true,
    serverTime: new Date().toISOString(),
    data: currentDB
  });
});

app.get('/api/sync', (req, res) => {
  const currentDB = readDB();
  res.json({
    success: true,
    serverTime: new Date().toISOString(),
    data: currentDB
  });
});

app.post('/api/sync', (req, res) => {
  const currentDB = readDB();
  res.json({
    success: true,
    message: 'Server Database: 100% Server-First Source of Truth',
    serverTime: new Date().toISOString(),
    data: currentDB
  });
});

// 2. Cleanings CRUD
app.post('/api/cleanings', (req, res) => {
  try {
    const cleaningData = req.body || {};
    if (!cleaningData.storeCode && !cleaningData.storeName) {
      return res.status(400).json({ success: false, message: 'Store code ya store name zaroori hai.' });
    }

    const currentDB = readDB();
    if (!currentDB.cleanings) currentDB.cleanings = [];
    if (!currentDB.stores) currentDB.stores = [];

    const nowIso = new Date().toISOString();
    let updatedRecord = null;

    const targetId = cleaningData.id ? String(cleaningData.id) : null;
    const targetSyncId = cleaningData.syncId ? String(cleaningData.syncId) : null;
    const targetCode = cleaningData.storeCode ? String(cleaningData.storeCode).trim().toUpperCase() : null;
    const targetDate = cleaningData.cleaningDate ? String(cleaningData.cleaningDate).trim() : null;

    let index = -1;
    if (targetId) {
      index = currentDB.cleanings.findIndex(c => c && String(c.id) === targetId);
    }
    if (index === -1 && targetSyncId) {
      index = currentDB.cleanings.findIndex(c => c && c.syncId && String(c.syncId) === targetSyncId);
    }
    if (index === -1 && targetCode && targetDate) {
      index = currentDB.cleanings.findIndex(c => 
        c && c.storeCode && c.cleaningDate &&
        String(c.storeCode).trim().toUpperCase() === targetCode &&
        String(c.cleaningDate).trim() === targetDate
      );
    }

    if (index !== -1) {
      updatedRecord = {
        ...currentDB.cleanings[index],
        ...cleaningData,
        id: currentDB.cleanings[index].id,
        updatedAt: nowIso
      };
      currentDB.cleanings[index] = updatedRecord;
    } else {
      const newId = cleaningData.id || Date.now();
      updatedRecord = {
        ...cleaningData,
        id: newId,
        createdAt: cleaningData.createdAt || nowIso,
        updatedAt: nowIso
      };
      currentDB.cleanings.unshift(updatedRecord);
    }

    // Auto-register store in stores ledger if not exists
    if (targetCode && cleaningData.storeName) {
      const storeExists = currentDB.stores.some(s => s && String(s.storeCode).trim().toUpperCase() === targetCode);
      if (!storeExists) {
        currentDB.stores.push({
          id: Date.now() + 1,
          storeCode: cleaningData.storeCode,
          storeName: cleaningData.storeName,
          address: cleaningData.address || '',
          city: cleaningData.city || '',
          googleMapsUrl: cleaningData.googleMapsUrl || '',
          managerName: cleaningData.managerName || '',
          managerPhone: cleaningData.managerPhone || '',
          createdAt: nowIso
        });
      }
    }

    writeDB(currentDB);
    res.json({
      success: true,
      message: 'Cleaning record successfully saved to server database.',
      cleaning: updatedRecord,
      cleanings: currentDB.cleanings,
      stores: currentDB.stores,
      data: currentDB
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server save cleaning error: ' + err.message });
  }
});

app.post('/api/cleanings/delete', (req, res) => {
  try {
    const { id, syncId, storeCode, cleaningDate } = req.body || {};
    const currentDB = readDB();
    if (!currentDB.cleanings) currentDB.cleanings = [];

    const cleanCode = storeCode ? String(storeCode).trim().toUpperCase() : null;
    const cleanDate = cleaningDate ? String(cleaningDate).trim() : null;

    currentDB.cleanings = currentDB.cleanings.filter(c => {
      if (!c) return false;
      if (id && String(c.id) === String(id)) return false;
      if (syncId && c.syncId && String(c.syncId) === String(syncId)) return false;
      if (cleanCode && cleanDate && String(c.storeCode).trim().toUpperCase() === cleanCode && String(c.cleaningDate).trim() === cleanDate) return false;
      return true;
    });

    writeDB(currentDB);
    res.json({
      success: true,
      message: 'Cleaning record permanently deleted from server database.',
      cleanings: currentDB.cleanings,
      data: currentDB
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server delete cleaning error: ' + err.message });
  }
});

// 3. Stores CRUD
app.post('/api/stores', (req, res) => {
  try {
    const storeData = req.body || {};
    if (!storeData.storeCode || !storeData.storeName) {
      return res.status(400).json({ success: false, message: 'Store code aur Store name zaroori hai.' });
    }

    const currentDB = readDB();
    if (!currentDB.stores) currentDB.stores = [];

    const nowIso = new Date().toISOString();
    const cleanCode = String(storeData.storeCode).trim().toUpperCase();
    const targetId = storeData.id ? String(storeData.id) : null;

    let index = currentDB.stores.findIndex(s => s && String(s.storeCode).trim().toUpperCase() === cleanCode);
    if (index === -1 && targetId) {
      index = currentDB.stores.findIndex(s => s && String(s.id) === targetId);
    }

    let savedStore = null;
    if (index !== -1) {
      savedStore = {
        ...currentDB.stores[index],
        ...storeData,
        storeCode: storeData.storeCode.trim(),
        id: currentDB.stores[index].id,
        updatedAt: nowIso
      };
      currentDB.stores[index] = savedStore;
    } else {
      savedStore = {
        ...storeData,
        storeCode: storeData.storeCode.trim(),
        id: storeData.id || Date.now(),
        createdAt: storeData.createdAt || nowIso,
        updatedAt: nowIso
      };
      currentDB.stores.push(savedStore);
    }

    writeDB(currentDB);
    res.json({
      success: true,
      message: 'Store master ledger me update ho gaya.',
      store: savedStore,
      stores: currentDB.stores,
      data: currentDB
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server save store error: ' + err.message });
  }
});

app.post('/api/stores/delete', (req, res) => {
  try {
    const { storeCode, deleteCleanings, force } = req.body || {};
    if (!storeCode) {
      return res.status(400).json({ success: false, message: 'Store code zaroori hai.' });
    }

    const currentDB = readDB();
    if (!currentDB.stores) currentDB.stores = [];
    if (!currentDB.cleanings) currentDB.cleanings = [];

    const cleanCode = String(storeCode).trim().toUpperCase();

    // Check if store has any cleaning records
    const relatedCleanings = currentDB.cleanings.filter(
      c => c && String(c.storeCode).trim().toUpperCase() === cleanCode
    );

    if (relatedCleanings.length > 0 && !deleteCleanings && !force) {
      return res.status(400).json({
        success: false,
        hasCleanings: true,
        count: relatedCleanings.length,
        message: `Is store ke ${relatedCleanings.length} cleaning record(s) database me maujood hain. Cleaning entries hone par store delete nahi kiya ja sakta.`
      });
    }

    // Delete cleanings if requested or forced
    if (deleteCleanings || force) {
      currentDB.cleanings = currentDB.cleanings.filter(
        c => !c || String(c.storeCode).trim().toUpperCase() !== cleanCode
      );
    }

    // Delete store
    currentDB.stores = currentDB.stores.filter(
      s => !s || String(s.storeCode).trim().toUpperCase() !== cleanCode
    );

    // Delete related schedules
    if (currentDB.cleaningSchedules) {
      currentDB.cleaningSchedules = currentDB.cleaningSchedules.filter(
        sch => !sch || String(sch.storeCode).trim().toUpperCase() !== cleanCode
      );
    }

    writeDB(currentDB);
    res.json({
      success: true,
      message: `Store ${cleanCode} permanently deleted from server database.`,
      stores: currentDB.stores,
      cleanings: currentDB.cleanings,
      data: currentDB
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server delete store error: ' + err.message });
  }
});

// 4. Supervisors CRUD
app.post('/api/supervisors', (req, res) => {
  try {
    const supData = req.body || {};
    if (!supData.name || !supData.phone) {
      return res.status(400).json({ success: false, message: 'Supervisor name aur phone zaroori hai.' });
    }
    const currentDB = readDB();
    if (!currentDB.supervisors) currentDB.supervisors = [];

    const nowIso = new Date().toISOString();
    const cleanPhone = String(supData.phone).trim().replace(/[^0-9]/g, '');
    const targetId = supData.id ? String(supData.id) : null;

    let index = currentDB.supervisors.findIndex(s => s && String(s.phone).trim().replace(/[^0-9]/g, '') === cleanPhone);
    if (index === -1 && targetId) {
      index = currentDB.supervisors.findIndex(s => s && String(s.id) === targetId);
    }

    let savedSup = null;
    if (index !== -1) {
      savedSup = {
        ...currentDB.supervisors[index],
        ...supData,
        phone: cleanPhone,
        id: currentDB.supervisors[index].id,
        updatedAt: nowIso
      };
      currentDB.supervisors[index] = savedSup;
    } else {
      savedSup = {
        ...supData,
        phone: cleanPhone,
        id: supData.id || Date.now(),
        pin: supData.pin || '1234',
        active: supData.active !== false,
        createdAt: supData.createdAt || nowIso,
        updatedAt: nowIso
      };
      currentDB.supervisors.push(savedSup);
    }

    writeDB(currentDB);
    res.json({ success: true, supervisor: savedSup, supervisors: currentDB.supervisors, data: currentDB });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server save supervisor error: ' + err.message });
  }
});

app.post('/api/supervisors/delete', (req, res) => {
  try {
    const { id, phone } = req.body || {};
    const currentDB = readDB();
    if (!currentDB.supervisors) currentDB.supervisors = [];

    const cleanPhone = phone ? String(phone).trim().replace(/[^0-9]/g, '') : null;

    currentDB.supervisors = currentDB.supervisors.filter(s => {
      if (!s) return false;
      if (id && String(s.id) === String(id)) return false;
      if (cleanPhone && String(s.phone).trim().replace(/[^0-9]/g, '') === cleanPhone) return false;
      return true;
    });

    writeDB(currentDB);
    res.json({ success: true, supervisors: currentDB.supervisors, data: currentDB });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server delete supervisor error: ' + err.message });
  }
});

// 5. Cleaners CRUD
app.post('/api/cleaners', (req, res) => {
  try {
    const clnData = req.body || {};
    if (!clnData.name) {
      return res.status(400).json({ success: false, message: 'Cleaner name zaroori hai.' });
    }
    const currentDB = readDB();
    if (!currentDB.cleaners) currentDB.cleaners = [];

    const nowIso = new Date().toISOString();
    const cleanName = String(clnData.name).trim().toLowerCase();
    const cleanPhone = clnData.phone ? String(clnData.phone).trim() : '';
    const targetId = clnData.id ? String(clnData.id) : null;

    let index = -1;
    if (targetId) {
      index = currentDB.cleaners.findIndex(c => c && String(c.id) === targetId);
    }
    if (index === -1 && cleanPhone) {
      index = currentDB.cleaners.findIndex(c => c && c.phone && String(c.phone).trim() === cleanPhone);
    }
    if (index === -1) {
      index = currentDB.cleaners.findIndex(c => c && c.name && String(c.name).trim().toLowerCase() === cleanName);
    }

    let savedCln = null;
    if (index !== -1) {
      savedCln = {
        ...currentDB.cleaners[index],
        ...clnData,
        id: currentDB.cleaners[index].id,
        updatedAt: nowIso
      };
      currentDB.cleaners[index] = savedCln;
    } else {
      savedCln = {
        ...clnData,
        id: clnData.id || Date.now(),
        active: clnData.active !== false,
        createdAt: clnData.createdAt || nowIso,
        updatedAt: nowIso
      };
      currentDB.cleaners.push(savedCln);
    }

    writeDB(currentDB);
    res.json({ success: true, cleaner: savedCln, cleaners: currentDB.cleaners, data: currentDB });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server save cleaner error: ' + err.message });
  }
});

app.post('/api/cleaners/delete', (req, res) => {
  try {
    const { id, name, phone } = req.body || {};
    const currentDB = readDB();
    if (!currentDB.cleaners) currentDB.cleaners = [];

    const cleanPhone = phone ? String(phone).trim() : null;
    const cleanName = name ? String(name).trim().toLowerCase() : null;

    currentDB.cleaners = currentDB.cleaners.filter(c => {
      if (!c) return false;
      if (id && String(c.id) === String(id)) return false;
      if (cleanPhone && c.phone && String(c.phone).trim() === cleanPhone) return false;
      if (cleanName && c.name && String(c.name).trim().toLowerCase() === cleanName) return false;
      return true;
    });

    writeDB(currentDB);
    res.json({ success: true, cleaners: currentDB.cleaners, data: currentDB });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server delete cleaner error: ' + err.message });
  }
});

// 6. Cleaning Schedules CRUD
app.post('/api/schedules', (req, res) => {
  try {
    const schData = req.body || {};
    const currentDB = readDB();
    if (!currentDB.cleaningSchedules) currentDB.cleaningSchedules = [];

    const nowIso = new Date().toISOString();
    const targetId = schData.id ? String(schData.id) : null;

    let index = -1;
    if (targetId) {
      index = currentDB.cleaningSchedules.findIndex(s => s && String(s.id) === targetId);
    }

    let savedSch = null;
    if (index !== -1) {
      savedSch = {
        ...currentDB.cleaningSchedules[index],
        ...schData,
        id: currentDB.cleaningSchedules[index].id,
        updatedAt: nowIso
      };
      currentDB.cleaningSchedules[index] = savedSch;
    } else {
      savedSch = {
        ...schData,
        id: schData.id || Date.now(),
        createdAt: schData.createdAt || nowIso,
        updatedAt: nowIso
      };
      currentDB.cleaningSchedules.push(savedSch);
    }

    writeDB(currentDB);
    res.json({ success: true, schedule: savedSch, cleaningSchedules: currentDB.cleaningSchedules, data: currentDB });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server save schedule error: ' + err.message });
  }
});

app.post('/api/schedules/delete', (req, res) => {
  try {
    const { id, storeCode, scheduledDate } = req.body || {};
    const currentDB = readDB();
    if (!currentDB.cleaningSchedules) currentDB.cleaningSchedules = [];

    const sc = storeCode ? String(storeCode).trim().toUpperCase() : null;
    const sd = scheduledDate ? String(scheduledDate).trim() : null;

    currentDB.cleaningSchedules = currentDB.cleaningSchedules.filter(s => {
      if (!s) return false;
      if (id && String(s.id) === String(id)) return false;
      if (sc && sd && String(s.storeCode).trim().toUpperCase() === sc && String(s.scheduledDate).trim() === sd) return false;
      return true;
    });

    writeDB(currentDB);
    res.json({ success: true, cleaningSchedules: currentDB.cleaningSchedules, data: currentDB });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server delete schedule error: ' + err.message });
  }
});

// 7. Chemical Stock & Logs
app.post('/api/chemicals/stock', (req, res) => {
  try {
    const itemData = req.body || {};
    const currentDB = readDB();
    if (!currentDB.chemicalStock) currentDB.chemicalStock = [];

    const nowIso = new Date().toISOString();
    const targetName = (itemData.itemName || '').trim().toLowerCase();
    const targetId = itemData.id ? String(itemData.id) : null;

    let index = -1;
    if (targetId) {
      index = currentDB.chemicalStock.findIndex(c => c && String(c.id) === targetId);
    }
    if (index === -1 && targetName) {
      index = currentDB.chemicalStock.findIndex(c => c && (c.itemName || '').trim().toLowerCase() === targetName);
    }

    let saved = null;
    if (index !== -1) {
      saved = {
        ...currentDB.chemicalStock[index],
        ...itemData,
        id: currentDB.chemicalStock[index].id,
        updatedAt: nowIso
      };
      currentDB.chemicalStock[index] = saved;
    } else {
      saved = {
        ...itemData,
        id: itemData.id || Date.now(),
        updatedAt: nowIso
      };
      currentDB.chemicalStock.push(saved);
    }

    writeDB(currentDB);
    res.json({ success: true, chemicalStock: currentDB.chemicalStock, data: currentDB });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/chemicals/log', (req, res) => {
  try {
    const logData = req.body || {};
    const currentDB = readDB();
    if (!currentDB.chemicalLogs) currentDB.chemicalLogs = [];

    const newLog = {
      ...logData,
      id: logData.id || Date.now(),
      createdAt: new Date().toISOString()
    };
    currentDB.chemicalLogs.unshift(newLog);

    writeDB(currentDB);
    res.json({ success: true, chemicalLogs: currentDB.chemicalLogs, data: currentDB });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 8. Cleaner Advances
app.post('/api/advances', (req, res) => {
  try {
    const advData = req.body || {};
    const currentDB = readDB();
    if (!currentDB.cleanerAdvances) currentDB.cleanerAdvances = [];

    const newAdv = {
      ...advData,
      id: advData.id || Date.now(),
      createdAt: new Date().toISOString()
    };
    currentDB.cleanerAdvances.unshift(newAdv);

    writeDB(currentDB);
    res.json({ success: true, cleanerAdvances: currentDB.cleanerAdvances, data: currentDB });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/advances/delete', (req, res) => {
  try {
    const { id } = req.body || {};
    const currentDB = readDB();
    if (!currentDB.cleanerAdvances) currentDB.cleanerAdvances = [];

    currentDB.cleanerAdvances = currentDB.cleanerAdvances.filter(a => a && String(a.id) !== String(id));
    writeDB(currentDB);
    res.json({ success: true, cleanerAdvances: currentDB.cleanerAdvances, data: currentDB });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server delete advance error: ' + err.message });
  }
});

// 9. Store Issues / Defects
app.post('/api/issues', (req, res) => {
  try {
    const issueData = req.body || {};
    const currentDB = readDB();
    if (!currentDB.storeIssues) currentDB.storeIssues = [];

    const targetId = issueData.id ? String(issueData.id) : null;
    let index = -1;
    if (targetId) {
      index = currentDB.storeIssues.findIndex(i => i && String(i.id) === targetId);
    }

    let saved = null;
    if (index !== -1) {
      saved = {
        ...currentDB.storeIssues[index],
        ...issueData,
        id: currentDB.storeIssues[index].id,
        updatedAt: new Date().toISOString()
      };
      currentDB.storeIssues[index] = saved;
    } else {
      saved = {
        ...issueData,
        id: issueData.id || Date.now(),
        reportedAt: issueData.reportedAt || new Date().toISOString()
      };
      currentDB.storeIssues.unshift(saved);
    }

    writeDB(currentDB);
    res.json({ success: true, storeIssues: currentDB.storeIssues, data: currentDB });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/issues/delete', (req, res) => {
  try {
    const { id } = req.body || {};
    const currentDB = readDB();
    if (!currentDB.storeIssues) currentDB.storeIssues = [];
    currentDB.storeIssues = currentDB.storeIssues.filter(i => i && String(i.id) !== String(id));
    writeDB(currentDB);
    res.json({ success: true, storeIssues: currentDB.storeIssues, data: currentDB });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 10. Login Logs & Audit Trail
app.post('/api/logs/add', (req, res) => {
  try {
    const logEntry = req.body || {};
    const currentDB = readDB();
    if (!currentDB.loginLogs) currentDB.loginLogs = [];
    currentDB.loginLogs.unshift({
      ...logEntry,
      id: logEntry.id || Date.now(),
      timestamp: logEntry.timestamp || new Date().toISOString()
    });
    if (currentDB.loginLogs.length > 500) {
      currentDB.loginLogs = currentDB.loginLogs.slice(0, 500);
    }
    writeDB(currentDB);
    res.json({ success: true, loginLogs: currentDB.loginLogs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/logs/clear', (req, res) => {
  try {
    const currentDB = readDB();
    currentDB.loginLogs = [];
    currentDB.logsClearedAt = new Date().toISOString();
    writeDB(currentDB);
    res.json({
      success: true,
      message: 'Login audit logs successfully cleared from server.',
      loginLogs: [],
      data: currentDB
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server clear logs error: ' + err.message });
  }
});

// 11. Complete Clean / Reset Data
app.post('/api/demo/clear', (req, res) => {
  try {
    const currentDB = readDB();
    currentDB.cleanings = [];
    currentDB.stores = [];
    currentDB.cleaningSchedules = [];
    currentDB.storeIssues = [];
    currentDB.chemicalLogs = [];
    currentDB.cleanerAdvances = [];
    writeDB(currentDB);
    res.json({
      success: true,
      message: 'Server database 100% clean ho gaya hai. Ab aap apni real store entries kar sakte hain.',
      data: currentDB
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server clear demo error: ' + err.message });
  }
});

// 12. Server Health Check
app.get('/api/health', (req, res) => {
  const db = readDB();
  res.json({
    status: 'ok',
    mode: 'server_database',
    serverTime: new Date().toISOString(),
    lastUpdated: db.lastUpdated,
    records: {
      cleanings: db.cleanings?.length || 0,
      stores: db.stores?.length || 0,
      supervisors: db.supervisors?.length || 0,
      cleaners: db.cleaners?.length || 0,
      schedules: db.cleaningSchedules?.length || 0,
      chemicalStock: db.chemicalStock?.length || 0,
      loginLogs: db.loginLogs?.length || 0
    }
  });
});

// SPA static serving
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.use((req, res) => {
    res.send('Blinkit Cleaning Tracker Server is running! Run "npm run build" to build the client app.');
  });
}

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Blinkit Cleaning Server & Global Database running on http://0.0.0.0:${PORT}`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

module.exports = server;
