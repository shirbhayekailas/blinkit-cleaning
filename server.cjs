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
      loginLogs: mergedLoginLogs
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
