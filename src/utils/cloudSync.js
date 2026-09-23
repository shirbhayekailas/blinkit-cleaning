import { db } from '../db/db';

const STORAGE_KEY = 'blinkit_cloud_sync_config';

export function getCloudConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading cloud config:', e);
  }
  return {
    supabaseUrl: '',
    supabaseKey: '',
    autoSync: true,
    lastSyncTime: null,
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

// 2-Way Sync between Local Dexie and Supabase Cloud
export async function performCloudSync() {
  const config = getCloudConfig();

  if (config.supabaseUrl && config.supabaseKey) {
    try {
      const headers = {
        'apikey': config.supabaseKey,
        'Authorization': `Bearer ${config.supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      };

      // 1. PUSH LOCAL TABLES TO SUPABASE
      const tablesToPush = [
        { name: 'cleanings', data: await db.cleanings.toArray() },
        { name: 'stores', data: await db.stores.toArray() },
        { name: 'supervisors', data: await db.supervisors.toArray() },
        { name: 'cleaners', data: await db.cleaners.toArray() },
        { name: 'cleaning_schedules', data: await db.cleaningSchedules.toArray() },
        { name: 'chemical_stock', data: await db.chemicalStock.toArray() }
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

      // 2. PULL REMOTE UPDATES FROM SUPABASE INTO LOCAL DEXIE
      try {
        const pullRes = await fetch(`${config.supabaseUrl}/rest/v1/cleanings?select=*`, {
          method: 'GET',
          headers: {
            'apikey': config.supabaseKey,
            'Authorization': `Bearer ${config.supabaseKey}`
          }
        });

        if (pullRes.ok) {
          const remoteCleanings = await pullRes.json();
          if (Array.isArray(remoteCleanings) && remoteCleanings.length > 0) {
            const camelData = remoteCleanings.map(toCamelCase);
            await db.cleanings.bulkPut(camelData);
          }
        }
      } catch (pullErr) {
        console.warn('Pulling remote updates note:', pullErr);
      }

      saveCloudConfig({
        lastSyncTime: new Date().toISOString(),
        status: 'success'
      });

      return { success: true, message: 'Cloud database synchronized with all connected phones & laptops!' };
    } catch (err) {
      console.error('Supabase sync error:', err);
      saveCloudConfig({ status: 'error' });
      return { success: false, message: err.message };
    }
  }

  // Standalone offline-first mode
  try {
    saveCloudConfig({
      lastSyncTime: new Date().toISOString(),
      status: 'success'
    });

    return { 
      success: true, 
      message: 'Local offline database ready. Add your free Supabase URL in settings to sync live across devices.'
    };
  } catch (err) {
    saveCloudConfig({ status: 'error' });
    return { success: false, message: err.message };
  }
}

// Auto sync when device connects to internet
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    const config = getCloudConfig();
    if (config.autoSync) {
      performCloudSync().catch(console.warn);
    }
  });
}
