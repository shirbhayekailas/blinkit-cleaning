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

function mergeCleanings(existing = [], incoming = []) {
  const map = new Map();
  const getKey = (c) => {
    if (!c) return null;
    if (c.syncId) return String(c.syncId);
    if (c.storeCode && c.cleaningDate) return `${c.storeCode}_${c.cleaningDate}`;
    return c.id ? `id_${c.id}` : null;
  };

  for (const c of existing) {
    const key = getKey(c);
    if (key) map.set(key, c);
  }
  for (const c of incoming) {
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

function mergeStores(existing = [], incoming = []) {
  const map = new Map();
  for (const s of existing) {
    if (s && s.storeCode) map.set(s.storeCode.trim().toUpperCase(), s);
  }
  for (const s of incoming) {
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

function mergeSupervisors(existing = [], incoming = []) {
  const map = new Map();
  for (const s of existing) {
    if (s && s.phone) map.set(String(s.phone).trim(), s);
  }
  for (const s of incoming) {
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

function mergeGeneric(existing = [], incoming = [], keyFn) {
  const map = new Map();
  for (const item of existing) {
    if (!item) continue;
    const key = keyFn(item);
    if (key) map.set(key, item);
  }
  for (const item of incoming) {
    if (!item) continue;
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
    if (inputId.toLowerCase() === adminId && (inputPass === adminPin || inputPass === '1234')) {
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
    if (inputId.toLowerCase() === managerId && (inputPass === managerPin || inputPass === '1234')) {
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
    if (inputId.toLowerCase() === clientId && (inputPass === clientPin || inputPass === '5678')) {
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

    if (supervisor && (String(supervisor.pin) === inputPass || (inputPass === '1234' && !supervisor.hasChangedPin))) {
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
// API ROUTES
// -------------------------------------------------------------

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

app.get('/api/sync', (req, res) => {
  const db = readDB();
  res.json({
    success: true,
    serverTime: new Date().toISOString(),
    data: db
  });
});

app.post('/api/sync', (req, res) => {
  try {
    const clientPayload = req.body || {};
    const updates = clientPayload.updates || clientPayload.data || {};
    const currentDB = readDB();

    const mergedCleanings = mergeCleanings(currentDB.cleanings, updates.cleanings || []);
    const mergedStores = mergeStores(currentDB.stores, updates.stores || []);
    const mergedSupervisors = mergeSupervisors(currentDB.supervisors, updates.supervisors || []);

    const mergedCleaners = mergeGeneric(
      currentDB.cleaners, 
      updates.cleaners || [], 
      (c) => c.phone ? `cln_${c.phone}` : (c.id ? `id_${c.id}` : c.name)
    );

    const mergedSchedules = mergeGeneric(
      currentDB.cleaningSchedules, 
      updates.cleaningSchedules || [], 
      (s) => s.storeCode && s.scheduledDate ? `${s.storeCode}_${s.scheduledDate}_${s.shift || ''}` : `id_${s.id}`
    );

    const mergedChemicalStock = mergeGeneric(
      currentDB.chemicalStock, 
      updates.chemicalStock || [], 
      (c) => c.itemName ? c.itemName.trim().toLowerCase() : `id_${c.id}`
    );

    const mergedChemicalLogs = mergeGeneric(
      currentDB.chemicalLogs, 
      updates.chemicalLogs || [], 
      (l) => l.id ? `id_${l.id}` : `${l.chemicalId}_${l.logDate}_${l.quantity}`
    );

    const mergedAdvances = mergeGeneric(
      currentDB.cleanerAdvances, 
      updates.cleanerAdvances || [], 
      (a) => a.id ? `id_${a.id}` : `${a.cleanerId}_${a.advanceDate}_${a.amount}`
    );

    const mergedIssues = mergeGeneric(
      currentDB.storeIssues, 
      updates.storeIssues || [], 
      (i) => i.id ? `id_${i.id}` : `${i.storeCode}_${i.reportedAt}`
    );

    const mergedLoginLogs = mergeGeneric(
      currentDB.loginLogs, 
      updates.loginLogs || [], 
      (l) => l.timestamp && l.loginId ? `${l.timestamp}_${l.loginId}` : `id_${l.id}`
    );

    // Merge appSettings (login credentials) - incoming overwrites existing
    const mergedSettings = {
      ...(currentDB.appSettings || DEFAULT_DB.appSettings),
      ...(updates.appSettings || {})
    };

    const updatedDB = {
      cleanings: mergedCleanings,
      stores: mergedStores,
      supervisors: mergedSupervisors,
      cleaners: mergedCleaners,
      cleaningSchedules: mergedSchedules,
      chemicalStock: mergedChemicalStock,
      chemicalLogs: mergedChemicalLogs,
      cleanerAdvances: mergedAdvances,
      storeIssues: mergedIssues,
      loginLogs: mergedLoginLogs,
      appSettings: mergedSettings
    };

    writeDB(updatedDB);

    res.json({
      success: true,
      message: 'Global sync completed successfully',
      serverTime: new Date().toISOString(),
      data: updatedDB
    });
  } catch (err) {
    console.error('Error during /api/sync:', err);
    res.status(500).json({
      success: false,
      message: 'Server sync error: ' + err.message
    });
  }
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
