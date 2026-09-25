import { db } from '../db/db';

const STORAGE_KEY = 'blinkit_cloud_sync_config';

export function getCloudConfig() {
  const envUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
  const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        supabaseUrl: parsed.supabaseUrl || envUrl,
        supabaseKey: parsed.supabaseKey || envKey,
        autoSync: parsed.autoSync !== false,
        lastSyncTime: parsed.lastSyncTime || null,
        mode: parsed.mode || 'server',
        status: parsed.status || 'idle'
      };
    }
  } catch (e) {
    console.warn('Error reading cloud config:', e);
  }

  return {
    supabaseUrl: envUrl,
    supabaseKey: envKey,
    autoSync: true,
    lastSyncTime: null,
    mode: 'server',
    status: 'idle'
  };
}

export function saveCloudConfig(config) {
  try {
    const current = getCloudConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error saving cloud config:', e);
    return null;
  }
}

// Convert camelCase object to snake_case for PostgreSQL
function toSnakeCase(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const res = {};
  for (const key of Object.keys(obj)) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    res[snakeKey] = obj[key];
  }
  return res;
}

// Convert snake_case object to camelCase for IndexedDB / React
function toCamelCase(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const res = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    res[camelKey] = obj[key];
  }
  return res;
}

/**
 * Intelligent local DB re-hydration from remote/server data.
 * Merges records cleanly by business keys to prevent ID collision.
 */
export async function applyRemoteDataToLocalDB(data) {
  if (!data || typeof data !== 'object') return;

  // 1. Stores (Key: storeCode)
  if (Array.isArray(data.stores) && data.stores.length > 0) {
    for (const s of data.stores) {
      if (!s || !s.storeCode) continue;
      const existing = await db.stores.where('storeCode').equals(s.storeCode).first();
      if (existing) {
        await db.stores.put({ ...existing, ...s, id: existing.id });
      } else {
        const { id, ...rest } = s;
        await db.stores.add(rest);
      }
    }
  }

  // 2. Cleanings (Key: storeCode + cleaningDate)
  if (Array.isArray(data.cleanings) && data.cleanings.length > 0) {
    for (const c of data.cleanings) {
      if (!c) continue;
      let existing = null;
      if (c.storeCode && c.cleaningDate) {
        existing = await db.cleanings
          .where('storeCode')
          .equals(c.storeCode)
          .and(item => item.cleaningDate === c.cleaningDate)
          .first();
      }
      if (existing) {
        // Only update if remote is newer or has equal timestamp
        const oldTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
        const newTime = new Date(c.updatedAt || c.createdAt || Date.now()).getTime();
        if (newTime >= oldTime) {
          await db.cleanings.put({ ...existing, ...c, id: existing.id });
        }
      } else {
        const { id, ...rest } = c;
        await db.cleanings.add(rest);
      }
    }
  }

  // 3. Supervisors (Key: phone)
  if (Array.isArray(data.supervisors) && data.supervisors.length > 0) {
    for (const sup of data.supervisors) {
      if (!sup || !sup.phone) continue;
      const existing = await db.supervisors.where('phone').equals(sup.phone).first();
      if (existing) {
        await db.supervisors.put({ ...existing, ...sup, id: existing.id });
      } else {
        const { id, ...rest } = sup;
        await db.supervisors.add(rest);
      }
    }
  }

  // 4. Cleaners (Key: phone or name)
  if (Array.isArray(data.cleaners) && data.cleaners.length > 0) {
    for (const cln of data.cleaners) {
      if (!cln) continue;
      let existing = null;
      if (cln.phone) {
        existing = await db.cleaners.where('phone').equals(cln.phone).first();
      } else if (cln.name) {
        existing = await db.cleaners.where('name').equals(cln.name).first();
      }
      if (existing) {
        await db.cleaners.put({ ...existing, ...cln, id: existing.id });
      } else {
        const { id, ...rest } = cln;
        await db.cleaners.add(rest);
      }
    }
  }

  // 5. Schedules (Key: storeCode + scheduledDate)
  if (Array.isArray(data.cleaningSchedules) && data.cleaningSchedules.length > 0) {
    for (const sch of data.cleaningSchedules) {
      if (!sch || !sch.storeCode || !sch.scheduledDate) continue;
      const existing = await db.cleaningSchedules
        .where('storeCode')
        .equals(sch.storeCode)
        .and(item => item.scheduledDate === sch.scheduledDate)
        .first();
      if (existing) {
        await db.cleaningSchedules.put({ ...existing, ...sch, id: existing.id });
      } else {
        const { id, ...rest } = sch;
        await db.cleaningSchedules.add(rest);
      }
    }
  }

  // 6. Chemical Stock (Key: itemName)
  if (Array.isArray(data.chemicalStock) && data.chemicalStock.length > 0) {
    for (const chem of data.chemicalStock) {
      if (!chem || !chem.itemName) continue;
      const existing = await db.chemicalStock.where('itemName').equals(chem.itemName).first();
      if (existing) {
        await db.chemicalStock.put({ ...existing, ...chem, id: existing.id });
      } else {
        const { id, ...rest } = chem;
        await db.chemicalStock.add(rest);
      }
    }
  }

  // 7. Store Issues
  if (Array.isArray(data.storeIssues) && data.storeIssues.length > 0) {
    for (const iss of data.storeIssues) {
      if (!iss) continue;
      const existing = await db.storeIssues
        .where('storeCode')
        .equals(iss.storeCode || '')
        .and(item => item.reportedAt === iss.reportedAt)
        .first();
      if (existing) {
        await db.storeIssues.put({ ...existing, ...iss, id: existing.id });
      } else {
        const { id, ...rest } = iss;
        await db.storeIssues.add(rest);
      }
    }
  }

    // 8. Login Logs
  if (db.loginLogs && Array.isArray(data.loginLogs) && data.loginLogs.length > 0) {
    for (const log of data.loginLogs) {
      if (!log || !log.timestamp) continue;
      const existing = await db.loginLogs
        .where('timestamp')
        .equals(log.timestamp)
        .and(item => item.loginId === log.loginId)
        .first();
      if (!existing) {
        const { id, ...rest } = log;
        await db.loginLogs.add(rest);
      }
    }
  }

  // 9. App Settings / Login Credentials Sync
  if (data.appSettings && typeof data.appSettings === 'object') {
    const s = data.appSettings;
    if (s.vendor_admin_id) localStorage.setItem('vendor_admin_id', s.vendor_admin_id);
    if (s.vendor_admin_pin) {
      localStorage.setItem('vendor_admin_pin', s.vendor_admin_pin);
      if (s.vendor_admin_pin !== '1234') {
        localStorage.setItem('admin_pin_changed', 'true');
      }
    }
    if (s.vendor_manager_id) localStorage.setItem('vendor_manager_id', s.vendor_manager_id);
    if (s.vendor_manager_pin) localStorage.setItem('vendor_manager_pin', s.vendor_manager_pin);
    if (s.vendor_manager_name) localStorage.setItem('vendor_manager_name', s.vendor_manager_name);
    if (s.blinkit_client_id) localStorage.setItem('blinkit_client_id', s.blinkit_client_id);
    if (s.blinkit_client_pin) {
      localStorage.setItem('blinkit_client_pin', s.blinkit_client_pin);
      if (s.blinkit_client_pin !== '5678') {
        localStorage.setItem('client_pin_changed', 'true');
      }
    }
    if (s.blinkit_client_name) localStorage.setItem('blinkit_client_name', s.blinkit_client_name);
  }
}

/**
 * Perform 2-Way Global Synchronization:
 * 1. Tries Server API (/api/sync) - Instant, automatic, zero-setup across desktop & mobile
 * 2. Tries Supabase PostgreSQL (if configured)
 * 3. Keeps local Dexie as high-speed cache & offline backup
 */
export async function performCloudSync() {
  const config = getCloudConfig();

  // Gather current local database state
  const localData = {
    cleanings: await db.cleanings.toArray(),
    stores: await db.stores.toArray(),
    supervisors: await db.supervisors.toArray(),
    cleaners: await db.cleaners.toArray(),
    cleaningSchedules: await db.cleaningSchedules.toArray(),
    chemicalStock: await db.chemicalStock.toArray(),
    chemicalLogs: await db.chemicalLogs.toArray(),
    cleanerAdvances: await db.cleanerAdvances.toArray(),
    storeIssues: await db.storeIssues.toArray(),
    loginLogs: db.loginLogs ? await db.loginLogs.toArray() : [],
    appSettings: {
      vendor_admin_id: localStorage.getItem('vendor_admin_id') || 'admin',
      vendor_admin_pin: localStorage.getItem('vendor_admin_pin') || '1234',
      vendor_manager_id: localStorage.getItem('vendor_manager_id') || 'manager',
      vendor_manager_pin: localStorage.getItem('vendor_manager_pin') || '1234',
      vendor_manager_name: localStorage.getItem('vendor_manager_name') || 'Operations Manager',
      blinkit_client_id: localStorage.getItem('blinkit_client_id') || 'client',
      blinkit_client_pin: localStorage.getItem('blinkit_client_pin') || '5678',
      blinkit_client_name: localStorage.getItem('blinkit_client_name') || 'Blinkit City Operations Head'
    }
  };

  // -----------------------------------------------------------------
  // STRATEGY 1: Built-in Server Database (/api/sync)
  // -----------------------------------------------------------------
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates: localData })
    });

    if (res.ok) {
      const result = await res.json();
      if (result.success && result.data) {
        await applyRemoteDataToLocalDB(result.data);

        // Sync login credentials from server to this browser's localStorage
        if (result.data.appSettings) {
          const s = result.data.appSettings;
          if (s.vendor_admin_id) localStorage.setItem('vendor_admin_id', s.vendor_admin_id);
          if (s.vendor_admin_pin) localStorage.setItem('vendor_admin_pin', s.vendor_admin_pin);
          if (s.vendor_manager_id) localStorage.setItem('vendor_manager_id', s.vendor_manager_id);
          if (s.vendor_manager_pin) localStorage.setItem('vendor_manager_pin', s.vendor_manager_pin);
          if (s.vendor_manager_name) localStorage.setItem('vendor_manager_name', s.vendor_manager_name);
          if (s.blinkit_client_id) localStorage.setItem('blinkit_client_id', s.blinkit_client_id);
          if (s.blinkit_client_pin) localStorage.setItem('blinkit_client_pin', s.blinkit_client_pin);
          if (s.blinkit_client_name) localStorage.setItem('blinkit_client_name', s.blinkit_client_name);
        }

        saveCloudConfig({
          lastSyncTime: new Date().toISOString(),
          status: 'success',
          mode: 'server'
        });

        return {
          success: true,
          mode: 'server',
          message: 'Server Database: Live Synced! Desktop and Mobile are in sync.'
        };
      }
    }
  } catch (serverErr) {
    console.warn('Server API not reachable directly (may be static deploy or offline):', serverErr.message);
  }

  // -----------------------------------------------------------------
  // STRATEGY 2: Supabase Cloud Database (if credentials configured)
  // -----------------------------------------------------------------
  if (config.supabaseUrl && config.supabaseKey) {
    try {
      const headers = {
        'apikey': config.supabaseKey,
        'Authorization': `Bearer ${config.supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      };

      // 1. Push local tables
      const tablesToPush = [
        { name: 'cleanings', data: localData.cleanings },
        { name: 'stores', data: localData.stores },
        { name: 'supervisors', data: localData.supervisors },
        { name: 'cleaners', data: localData.cleaners },
        { name: 'cleaning_schedules', data: localData.cleaningSchedules },
        { name: 'chemical_stock', data: localData.chemicalStock }
      ];

      for (const t of tablesToPush) {
        if (t.data.length > 0) {
          const snakeData = t.data.map(toSnakeCase);
          await fetch(`${config.supabaseUrl}/rest/v1/${t.name}?on_conflict=id`, {
            method: 'POST',
            headers,
            body: JSON.stringify(snakeData)
          });
        }
      }

      // 2. Pull remote updates
      const pullRes = await fetch(`${config.supabaseUrl}/rest/v1/cleanings?select=*`, {
        method: 'GET',
        headers
      });

      if (pullRes.ok) {
        const remoteCleanings = await pullRes.json();
        if (Array.isArray(remoteCleanings) && remoteCleanings.length > 0) {
          const camelCleanings = remoteCleanings.map(toCamelCase);
          await applyRemoteDataToLocalDB({ cleanings: camelCleanings });
        }
      }

      saveCloudConfig({
        lastSyncTime: new Date().toISOString(),
        status: 'success',
        mode: 'supabase'
      });

      return { 
        success: true, 
        mode: 'supabase',
        message: 'Supabase Cloud: Synchronized with all connected phones & laptops!' 
      };
    } catch (err) {
      console.error('Supabase sync error:', err);
      saveCloudConfig({ status: 'error' });
      return { success: false, message: 'Supabase sync failed: ' + err.message };
    }
  }

  // -----------------------------------------------------------------
  // STRATEGY 3: Offline local mode
  // -----------------------------------------------------------------
  saveCloudConfig({
    lastSyncTime: new Date().toISOString(),
    status: 'offline_ready',
    mode: 'offline'
  });

  return { 
    success: true, 
    mode: 'offline',
    message: 'Local offline mode active. Connect Server Web Service or Supabase to sync live.'
  };
}

// Auto-sync when reconnecting to network
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    const config = getCloudConfig();
    if (config.autoSync) {
      performCloudSync().catch(console.warn);
    }
  });

  // Also sync when browser tab gains focus
  window.addEventListener('focus', () => {
    const config = getCloudConfig();
    if (config.autoSync) {
      performCloudSync().catch(console.warn);
    }
  });
}
