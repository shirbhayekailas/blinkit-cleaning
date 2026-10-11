/**
 * Blinkit Deep Cleaning Tracker - Server Database Client API
 * High-Performance Supabase Cloud Architecture with Zero-Latency Response.
 */

export const LIVE_BACKEND_URL = 'https://blinkit-cleaning-tracker-e9iy.onrender.com';

/**
 * Automatically determine the correct endpoint URL:
 * - If running directly inside the Render Web Service SPA: relative URL '/api/...'
 * - If running in mobile PWA, Capacitor, Electron, or localhost: points directly to LIVE_BACKEND_URL
 */
export function getApiUrl(endpoint) {
  const clean = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (typeof window !== 'undefined' && window.location) {
    if (window.location.hostname.includes('blinkit-cleaning-tracker-e9iy.onrender.com')) {
      return clean;
    }
  }
  return `${LIVE_BACKEND_URL}${clean}`;
}

import { 
  syncSingleRecordToSupabase, 
  deleteRecordFromSupabase,
  saveToSupabaseAppSettings,
  deleteFromSupabaseAppSettings,
  syncSmartCredentials,
  getCloudConfig 
} from '../utils/cloudSync';
import { db } from '../db/db';

// Smart Backend Connection Monitor
// Default to false when hosted on Vercel/localhost to eliminate hanging timeouts on suspended Render
let isRenderReachable = (typeof window !== 'undefined' && window.location && window.location.hostname.includes('blinkit-cleaning-tracker-e9iy.onrender.com'));
let lastRenderCheck = 0;
const RENDER_CHECK_COOLDOWN = 15 * 60 * 1000; // 15 minutes cooldown

export function shouldAttemptRender() {
  if (typeof window !== 'undefined' && window.location) {
    if (window.location.hostname.includes('blinkit-cleaning-tracker-e9iy.onrender.com')) {
      return true;
    }
  }
  if (!isRenderReachable && (Date.now() - lastRenderCheck < RENDER_CHECK_COOLDOWN)) {
    return false;
  }
  return true;
}

export function markRenderStatus(reachable) {
  isRenderReachable = reachable;
  lastRenderCheck = Date.now();
}

/**
 * Ultra-fast safe Render API caller with 1.2s timeout.
 * If Render is dormant or suspended, returns null instantly without freezing the UI.
 */
export async function callRenderApi(endpoint, options = {}, timeoutMs = 1200) {
  if (!shouldAttemptRender()) return null;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(getApiUrl(endpoint), {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      markRenderStatus(true);
      return await res.json();
    }
    markRenderStatus(false);
  } catch (err) {
    clearTimeout(timeoutId);
    markRenderStatus(false);
  }
  return null;
}

function toCamelCase(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const res = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    res[camelKey] = obj[key];
  }
  return res;
}

let lastSupabaseFingerprint = null;
let cachedSupabaseState = null;

export function invalidateSupabaseCache() {
  lastSupabaseFingerprint = null;
  cachedSupabaseState = null;
}

function computeStateFingerprint({
  rawStores = [],
  rawCleanings = [],
  rawSupervisors = [],
  rawCleaners = [],
  rawSchedules = [],
  rawChemicals = [],
  rawIssues = [],
  rawExpenses = [],
  rawEquipments = [],
  sRows = []
}) {
  const lengths = `${rawStores.length}.${rawCleanings.length}.${rawSupervisors.length}.${rawCleaners.length}.${rawSchedules.length}.${rawChemicals.length}.${rawIssues.length}.${rawExpenses.length}.${rawEquipments.length}`;

  const findLatestTime = (arr) => {
    if (!arr || arr.length === 0) return '';
    let max = '';
    for (let i = 0; i < arr.length; i++) {
      const t = arr[i].updated_at || arr[i].created_at || '';
      if (t > max) max = t;
    }
    return max;
  };

  const cleanTime = findLatestTime(rawCleanings);
  const storeTime = findLatestTime(rawStores);
  const eqTime = findLatestTime(rawEquipments);
  const expTime = findLatestTime(rawExpenses);
  const issTime = findLatestTime(rawIssues);
  const schTime = findLatestTime(rawSchedules);

  const settingsTime = Array.isArray(sRows)
    ? sRows.map(r => `${r.key}:${r.updated_at || (Array.isArray(r.value) ? r.value.length : '')}`).sort().join('|')
    : '';

  return `${lengths}_${cleanTime}_${storeTime}_${eqTime}_${expTime}_${issTime}_${schTime}_${settingsTime}`;
}

export async function onSupabaseMutationComplete(tableName, record) {
  invalidateSupabaseCache();
  try {
    const fresh = await fetchFromSupabaseDirect(null);
    if (typeof window !== 'undefined' && fresh) {
      window.dispatchEvent(new CustomEvent('supabase-data-mutated', { 
        detail: { tableName, record, fresh } 
      }));
    }
    return fresh;
  } catch (err) {
    console.warn('Post-mutation refresh notice:', err);
    return null;
  }
}

export async function fetchFromSupabaseDirect(lastKnownUpdated = null) {
  const config = getCloudConfig();
  const url = config.supabaseUrl || 'https://eymcwmwpercvdwcciqaq.supabase.co';
  const key = config.supabaseKey || 'sb_publishable_OfiB_MJr4DTHPx5_2vXtVg_DfuQqKm_';

  try {
    const headers = {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    };

    const [
      storesRes,
      cleaningsRes,
      supervisorsRes,
      cleanersRes,
      settingsRes,
      schedulesRes,
      chemicalsRes,
      issuesRes,
      expensesRes,
      equipmentsRes
    ] = await Promise.all([
      fetch(`${url}/rest/v1/stores?select=*`, { headers }),
      fetch(`${url}/rest/v1/cleanings?select=*`, { headers }),
      fetch(`${url}/rest/v1/supervisors?select=*`, { headers }),
      fetch(`${url}/rest/v1/cleaners?select=*`, { headers }),
      fetch(`${url}/rest/v1/app_settings?select=*`, { headers }),
      fetch(`${url}/rest/v1/cleaning_schedules?select=*`, { headers }),
      fetch(`${url}/rest/v1/chemical_stock?select=*`, { headers }),
      fetch(`${url}/rest/v1/store_issues?select=*`, { headers }),
      fetch(`${url}/rest/v1/store_expenses?select=*`, { headers }),
      fetch(`${url}/rest/v1/equipments?select=*`, { headers })
    ]);

    if (!cleaningsRes.ok || !storesRes.ok) return null;

    const rawStores = await storesRes.json();
    const rawCleanings = await cleaningsRes.json();
    const rawSupervisors = supervisorsRes.ok ? await supervisorsRes.json() : [];
    const rawCleaners = cleanersRes.ok ? await cleanersRes.json() : [];
    const rawSchedules = schedulesRes.ok ? await schedulesRes.json() : [];
    const rawChemicals = chemicalsRes.ok ? await chemicalsRes.json() : [];
    const rawIssues = issuesRes.ok ? await issuesRes.json() : [];
    const rawExpenses = expensesRes.ok ? await expensesRes.json() : [];
    const rawEquipments = equipmentsRes.ok ? await equipmentsRes.json() : [];
    const sRows = (settingsRes && settingsRes.ok) ? await settingsRes.json() : [];

    // Calculate unique fingerprint to detect zero-change conditions
    const currentFingerprint = computeStateFingerprint({
      rawStores,
      rawCleanings,
      rawSupervisors,
      rawCleaners,
      rawSchedules,
      rawChemicals,
      rawIssues,
      rawExpenses,
      rawEquipments,
      sRows
    });

    if (lastKnownUpdated && lastKnownUpdated === currentFingerprint && cachedSupabaseState) {
      return { unchanged: true, lastUpdated: currentFingerprint };
    }

    // Deduplicate cleanings by storeCode + cleaningDate + city
    const seenCleanKeys = new Set();
    const cleanings = [];
    for (const raw of rawCleanings) {
      const c = toCamelCase(raw);
      c.startTime = raw.punch_in_time || c.startTime || '';
      c.endTime = raw.punch_out_time || c.endTime || '';
      c.headcount = raw.total_cleaners || c.headcount || 4;

      const key = `${(c.storeCode || '').trim().toUpperCase()}__${(c.cleaningDate || '').trim()}__${(c.city || '').trim().toLowerCase()}`;
      if (!key || seenCleanKeys.has(key)) continue;
      seenCleanKeys.add(key);
      cleanings.push(c);
    }

    // Deduplicate stores by storeCode + city
    const seenStoreKeys = new Set();
    const stores = [];
    for (const raw of rawStores) {
      const s = toCamelCase(raw);
      const key = `${(s.storeCode || s.code || '').trim().toUpperCase()}__${(s.city || '').trim().toLowerCase()}`;
      if (!key || seenStoreKeys.has(key)) continue;
      seenStoreKeys.add(key);
      stores.push(s);
    }

    const supervisors = rawSupervisors.map(toCamelCase);
    const cleaners = rawCleaners.map(toCamelCase);
    const cleaningSchedules = rawSchedules.map(toCamelCase);
    const chemicalStock = rawChemicals.map(toCamelCase);
    const storeIssues = rawIssues.map(toCamelCase);
    const storeExpenses = rawExpenses.map(toCamelCase);
    let appSettings = null;
    let loginLogs = [];
    let equipmentMovements = [];
    let toolAllocations = [];
    let teamDispatches = [];
    let cleanerAdvances = [];
    let chemicalLogs = [];
    let equipmentsMetaMap = {};

    if (Array.isArray(sRows)) {
      for (const row of sRows) {
        if (row.key === 'auth_credentials' && row.value) {
          if (!appSettings) appSettings = {};
          Object.assign(appSettings, row.value);
          syncSmartCredentials(row.value);
        } else if (row.key === 'bill_settings' && row.value) {
          if (!appSettings) appSettings = {};
          appSettings.billSettings = row.value;
          try {
            localStorage.setItem('blinkit_bill_settings_v1', JSON.stringify(row.value));
          } catch (e) {}
        } else if (row.key === 'login_logs' && Array.isArray(row.value)) {
          loginLogs = row.value;
        } else if (row.key === 'equipment_movements' && Array.isArray(row.value)) {
          equipmentMovements = row.value;
        } else if (row.key === 'tool_allocations' && Array.isArray(row.value)) {
          toolAllocations = row.value;
        } else if (row.key === 'team_dispatches' && Array.isArray(row.value)) {
          teamDispatches = row.value;
        } else if (row.key === 'cleaner_advances' && Array.isArray(row.value)) {
          cleanerAdvances = row.value;
        } else if (row.key === 'chemical_logs' && Array.isArray(row.value)) {
          chemicalLogs = row.value;
        } else if (row.key === 'equipments_meta' && Array.isArray(row.value)) {
          for (const m of row.value) {
            if (m && m.id) equipmentsMetaMap[m.id] = m;
          }
        }
      }
    }

    const equipments = rawEquipments.map(raw => {
      const eq = toCamelCase(raw);
      if (equipmentsMetaMap[eq.id]) {
        return { ...equipmentsMetaMap[eq.id], ...eq };
      }
      return eq;
    });

    lastSupabaseFingerprint = currentFingerprint;
    const resultState = {
      stores,
      cleanings,
      supervisors,
      cleaners,
      appSettings,
      cleaningSchedules,
      chemicalStock,
      storeIssues,
      storeExpenses,
      equipments,
      chemicalLogs,
      cleanerAdvances,
      loginLogs,
      equipmentMovements,
      toolAllocations,
      teamDispatches,
      lastUpdated: currentFingerprint
    };
    cachedSupabaseState = resultState;
    return resultState;
  } catch (err) {
    console.warn('Direct Supabase fetch notice:', err.message);
    return null;
  }
}

// -------------------------------------------------------------
// CORE FETCH & STATE
// -------------------------------------------------------------

export async function fetchServerState(lastKnownUpdated = null) {
  if (!shouldAttemptRender()) {
    // 0ms delay: directly fetch from Supabase Cloud
    return await fetchFromSupabaseDirect(lastKnownUpdated);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1200);
  try {
    const nonce = Date.now();
    let url = `/api/state?_t=${nonce}`;
    if (lastKnownUpdated) {
      url += `&lastUpdated=${encodeURIComponent(lastKnownUpdated)}`;
    }
    const res = await fetch(getApiUrl(url), {
      method: 'GET',
      signal: controller.signal,
      headers: { 
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      markRenderStatus(true);
      const data = await res.json();
      if (data.unchanged) {
        return { unchanged: true, lastUpdated: data.lastUpdated };
      }
      return data.data || null;
    } else {
      markRenderStatus(false);
      return await fetchFromSupabaseDirect(lastKnownUpdated);
    }
  } catch (err) {
    clearTimeout(timeoutId);
    markRenderStatus(false);
    return await fetchFromSupabaseDirect(lastKnownUpdated);
  }
}

// -------------------------------------------------------------
// CLEANINGS
// -------------------------------------------------------------

export async function saveCleaning(cleaningData) {
  await syncSingleRecordToSupabase('cleanings', cleaningData);
  try { if (db && db.cleanings) await db.cleanings.put(cleaningData); } catch (e) {}

  callRenderApi('/api/cleanings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cleaningData)
  }).catch(() => {});

  const fresh = await onSupabaseMutationComplete('cleanings', cleaningData);
  return { success: true, savedRecord: cleaningData, ...(fresh || {}) };
}

export async function updateCleaningPayment(paymentPayload) {
  if (!paymentPayload) throw new Error('No payment payload provided');

  // Lightweight payload with zero photos or heavy blobs
  const cleanPayload = {
    id: paymentPayload.id,
    syncId: paymentPayload.syncId,
    storeCode: paymentPayload.storeCode,
    cleaningDate: paymentPayload.cleaningDate,
    amount: Number(paymentPayload.amount) || 0,
    amountReceived: Number(paymentPayload.amountReceived) || 0,
    amountPending: Number(paymentPayload.amountPending) || 0,
    paymentStatus: paymentPayload.paymentStatus || 'Pending',
    paymentDate: paymentPayload.paymentDate || '',
    paymentMode: paymentPayload.paymentMode || 'UPI',
    utrNumber: paymentPayload.utrNumber || '',
    paymentNotes: paymentPayload.paymentNotes || ''
  };

  // Push directly to Supabase in parallel
  await syncSingleRecordToSupabase('cleanings', cleanPayload);
  try {
    if (db && db.cleanings && cleanPayload.id) {
      await db.cleanings.update(cleanPayload.id, cleanPayload).catch(() => {});
    }
  } catch (e) {}

  callRenderApi('/api/cleanings/payment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    },
    body: JSON.stringify(cleanPayload)
  }).catch(() => {});

  const fresh = await onSupabaseMutationComplete('cleanings', cleanPayload);
  return { success: true, cleaning: cleanPayload, ...(fresh || {}) };
}

// -------------------------------------------------------------
// BACKUP & RESTORE (single request, safe merge on server)
// -------------------------------------------------------------

export async function fetchFullBackup() {
  const res = await fetch(getApiUrl(`/api/sync?_t=${Date.now()}`), {
    method: 'GET',
    headers: { 'Accept': 'application/json', 'Cache-Control': 'no-cache' }
  });
  if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);
  const json = await res.json();
  if (!json || !json.data || !Array.isArray(json.data.cleanings)) {
    throw new Error('Server se data nahi mila. Server jaag raha ho sakta hai, 30 second baad dobara try karein.');
  }
  return json.data;
}

export async function restoreDatabaseBackup(backupJson) {
  const res = await fetch(getApiUrl('/api/database/restore'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(backupJson)
  });
  let result = null;
  try {
    result = await res.json();
  } catch (e) {
    throw new Error(res.status === 413
      ? 'Backup file bahut badi hai (server limit). Photos kam karke try karein.'
      : `Server returned HTTP ${res.status}`);
  }
  if (!res.ok || !result || !result.success) {
    throw new Error((result && result.message) || `Server returned HTTP ${res.status}`);
  }
  return result;
}

export async function deleteCleaning(cleaningOrId) {
  const targetId = typeof cleaningOrId === 'object' && cleaningOrId !== null 
    ? (cleaningOrId.id || cleaningOrId.syncId) 
    : cleaningOrId;
  await deleteRecordFromSupabase('cleanings', targetId);
  try { if (db && db.cleanings) await db.cleanings.delete(targetId); } catch (e) {}

  let payload = typeof cleaningOrId === 'object' && cleaningOrId !== null
    ? { id: cleaningOrId.id, syncId: cleaningOrId.syncId, storeCode: cleaningOrId.storeCode, cleaningDate: cleaningOrId.cleaningDate }
    : { id: cleaningOrId };

  callRenderApi('/api/cleanings/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(() => {});

  const fresh = await onSupabaseMutationComplete('cleanings', { id: targetId });
  return { success: true, ...(fresh || {}) };
}

// -------------------------------------------------------------
// STORES MASTER LEDGER
// -------------------------------------------------------------

export async function saveStore(storeData) {
  await syncSingleRecordToSupabase('stores', storeData);
  try { if (db && db.stores) await db.stores.put(storeData); } catch (e) {}

  callRenderApi('/api/stores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(storeData)
  }).catch(() => {});

  const fresh = await onSupabaseMutationComplete('stores', storeData);
  return { success: true, store: storeData, ...(fresh || {}) };
}

export async function deleteStore(storeCode, deleteCleanings = false, force = true, id = null, city = null) {
  const sCode = typeof storeCode === 'object' && storeCode !== null ? (storeCode.storeCode || storeCode.code) : storeCode;
  await deleteRecordFromSupabase('stores', sCode, 'store_code');
  try {
    if (db && db.stores) {
      if (id) await db.stores.delete(id);
      await db.stores.where('storeCode').equalsIgnoreCase(sCode).delete().catch(() => {});
    }
  } catch (e) {}

  const payload = typeof storeCode === 'object' && storeCode !== null
    ? storeCode
    : { storeCode, deleteCleanings, force, id, city };
  callRenderApi('/api/stores/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(() => {});

  const fresh = await onSupabaseMutationComplete('stores', { storeCode: sCode });
  return { success: true, ...(fresh || {}) };
}

// -------------------------------------------------------------
// SUPERVISORS
// -------------------------------------------------------------

export async function saveSupervisor(supData) {
  await syncSingleRecordToSupabase('supervisors', supData);
  try { if (db && db.supervisors) await db.supervisors.put(supData); } catch (e) {}

  callRenderApi('/api/supervisors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(supData)
  }).catch(() => {});

  const fresh = await onSupabaseMutationComplete('supervisors', supData);
  return { success: true, supervisor: supData, ...(fresh || {}) };
}

export async function deleteSupervisor(supOrId) {
  const targetId = typeof supOrId === 'object' && supOrId !== null ? (supOrId.id || supOrId.phone) : supOrId;
  await deleteRecordFromSupabase('supervisors', targetId);
  try { if (db && db.supervisors) await db.supervisors.delete(targetId); } catch (e) {}

  const payload = typeof supOrId === 'object' && supOrId !== null
    ? { id: supOrId.id, phone: supOrId.phone }
    : { id: supOrId };

  callRenderApi('/api/supervisors/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(() => {});

  const fresh = await onSupabaseMutationComplete('supervisors', { id: targetId });
  return { success: true, ...(fresh || {}) };
}

// -------------------------------------------------------------
// CLEANERS ROSTER
// -------------------------------------------------------------

export async function saveCleaner(clnData) {
  await syncSingleRecordToSupabase('cleaners', clnData);
  try { if (db && db.cleaners) await db.cleaners.put(clnData); } catch (e) {}

  callRenderApi('/api/cleaners', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clnData)
  }).catch(() => {});

  const fresh = await onSupabaseMutationComplete('cleaners', clnData);
  return { success: true, cleaner: clnData, ...(fresh || {}) };
}

export async function deleteCleaner(clnOrId) {
  const targetId = typeof clnOrId === 'object' && clnOrId !== null ? (clnOrId.id || clnOrId.phone) : clnOrId;
  await deleteRecordFromSupabase('cleaners', targetId);
  try { if (db && db.cleaners) await db.cleaners.delete(targetId); } catch (e) {}

  const payload = typeof clnOrId === 'object' && clnOrId !== null
    ? { id: clnOrId.id, name: clnOrId.name, phone: clnOrId.phone }
    : { id: clnOrId };

  callRenderApi('/api/cleaners/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(() => {});

  const fresh = await onSupabaseMutationComplete('cleaners', { id: targetId });
  return { success: true, ...(fresh || {}) };
}

// -------------------------------------------------------------
// CLEANING SCHEDULES
// -------------------------------------------------------------

export async function saveSchedule(schData) {
  await syncSingleRecordToSupabase('cleaning_schedules', schData);
  try { if (db && db.cleaningSchedules) await db.cleaningSchedules.put(schData); } catch (e) {}

  callRenderApi('/api/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(schData)
  }).catch(() => {});

  const fresh = await onSupabaseMutationComplete('cleaning_schedules', schData);
  return { success: true, schedule: schData, ...(fresh || {}) };
}

export async function deleteSchedule(schOrId) {
  const targetId = typeof schOrId === 'object' && schOrId !== null ? schOrId.id : schOrId;
  await deleteRecordFromSupabase('cleaning_schedules', targetId);
  try { if (db && db.cleaningSchedules) await db.cleaningSchedules.delete(targetId); } catch (e) {}

  const payload = typeof schOrId === 'object' && schOrId !== null
    ? { id: schOrId.id, storeCode: schOrId.storeCode, scheduledDate: schOrId.scheduledDate }
    : { id: schOrId };

  callRenderApi('/api/schedules/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(() => {});

  const fresh = await onSupabaseMutationComplete('cleaning_schedules', { id: targetId });
  return { success: true, ...(fresh || {}) };
}

// -------------------------------------------------------------
// CHEMICAL STOCK & LOGS
// -------------------------------------------------------------

export async function saveChemicalStock(itemData) {
  await syncSingleRecordToSupabase('chemical_stock', itemData);
  try { if (db && db.chemicalStock) await db.chemicalStock.put(itemData); } catch (e) {}

  callRenderApi('/api/chemicals/stock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(itemData)
  }).catch(() => {});

  const fresh = await onSupabaseMutationComplete('chemical_stock', itemData);
  return { success: true, item: itemData, ...(fresh || {}) };
}

export async function addChemicalLog(logData) {
  const normalized = { ...logData, id: logData.id || `clog_${Date.now()}` };
  await saveToSupabaseAppSettings('chemical_logs', normalized, 'prepend');
  try { if (db && db.chemicalLogs) await db.chemicalLogs.put(normalized); } catch (e) {}

  callRenderApi('/api/chemicals/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(normalized)
  }).catch(() => {});

  const fresh = await onSupabaseMutationComplete('chemical_logs', normalized);
  return { success: true, log: normalized, ...(fresh || {}) };
}

export async function deleteChemicalStock(idOrItem) {
  const targetId = typeof idOrItem === 'object' && idOrItem !== null ? idOrItem.id : idOrItem;
  await deleteRecordFromSupabase('chemical_stock', targetId);
  try { if (db && db.chemicalStock) await db.chemicalStock.delete(targetId); } catch (e) {}

  const payload = typeof idOrItem === 'object' && idOrItem !== null
    ? { id: idOrItem.id, itemName: idOrItem.itemName }
    : { id: idOrItem };

  callRenderApi('/api/chemicals/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(() => {});

  const fresh = await onSupabaseMutationComplete('chemical_stock', { id: targetId });
  return { success: true, ...(fresh || {}) };
}

export async function seedStandardChemicals() {
  const res = await callRenderApi('/api/chemicals/seed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  return res || { success: true };
}

// -------------------------------------------------------------
// CLEANER ADVANCES / KHATA
// -------------------------------------------------------------

export async function saveAdvance(advData) {
  const normalized = { ...advData, id: advData.id || `adv_${Date.now()}` };
  await saveToSupabaseAppSettings('cleaner_advances', normalized, 'prepend');
  try { if (db && db.cleanerAdvances) await db.cleanerAdvances.put(normalized); } catch (e) {}

  callRenderApi('/api/advances', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(normalized)
  }).catch(() => {});

  const fresh = await onSupabaseMutationComplete('cleaner_advances', normalized);
  return { success: true, advance: normalized, ...(fresh || {}) };
}

export async function deleteAdvance(advOrId) {
  const targetId = typeof advOrId === 'object' && advOrId !== null ? advOrId.id : advOrId;
  await deleteFromSupabaseAppSettings('cleaner_advances', targetId);
  try { if (db && db.cleanerAdvances) await db.cleanerAdvances.delete(targetId); } catch (e) {}

  const payload = typeof advOrId === 'object' && advOrId !== null
    ? { id: advOrId.id }
    : { id: advOrId };

  callRenderApi('/api/advances/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(() => {});

  const fresh = await onSupabaseMutationComplete('cleaner_advances', { id: targetId });
  return { success: true, ...(fresh || {}) };
}

// -------------------------------------------------------------
// STORE DEFECT ISSUES
// -------------------------------------------------------------

export async function saveIssue(issueData) {
  await syncSingleRecordToSupabase('store_issues', issueData);
  try { if (db && db.storeIssues) await db.storeIssues.put(issueData); } catch (e) {}

  callRenderApi('/api/issues', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(issueData)
  }).catch(() => {});

  const fresh = await onSupabaseMutationComplete('store_issues', issueData);
  return { success: true, issue: issueData, ...(fresh || {}) };
}

export async function deleteIssue(issueOrId) {
  const targetId = typeof issueOrId === 'object' && issueOrId !== null ? issueOrId.id : issueOrId;
  await deleteRecordFromSupabase('store_issues', targetId);
  try { if (db && db.storeIssues) await db.storeIssues.delete(targetId); } catch (e) {}

  const payload = typeof issueOrId === 'object' && issueOrId !== null
    ? { id: issueOrId.id }
    : { id: issueOrId };

  callRenderApi('/api/issues/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(() => {});

  const fresh = await onSupabaseMutationComplete('store_issues', { id: targetId });
  return { success: true, ...(fresh || {}) };
}

// -------------------------------------------------------------
// LOGIN LOGS & RESET
// -------------------------------------------------------------

export async function saveLoginLogToCloud(entry) {
  const config = getCloudConfig();
  const url = config.supabaseUrl || 'https://eymcwmwpercvdwcciqaq.supabase.co';
  const key = config.supabaseKey || 'sb_publishable_OfiB_MJr4DTHPx5_2vXtVg_DfuQqKm_';

  try {
    const headers = {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    };

    // 1. Fetch current logs from Supabase
    const res = await fetch(`${url}/rest/v1/app_settings?key=eq.login_logs`, { headers });
    let currentLogs = [];
    if (res.ok) {
      const rows = await res.json();
      if (rows && rows.length > 0 && Array.isArray(rows[0].value)) {
        currentLogs = rows[0].value;
      }
    }

    // 2. Prepend new log (keep max 250 logs)
    const logId = entry.id || ('log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4));
    const normalized = { ...entry, id: logId };
    const updatedLogs = [normalized, ...currentLogs.filter(l => l && l.id !== logId)].slice(0, 250);

    // 3. Upsert back to Supabase
    await fetch(`${url}/rest/v1/app_settings`, {
      method: 'POST',
      headers: {
        ...headers,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        key: 'login_logs',
        value: updatedLogs,
        updated_at: new Date().toISOString()
      })
    });
  } catch (err) {
    console.warn('saveLoginLogToCloud notice:', err);
  }
}

export async function logUserLogin(entry) {
  try {
    // 1. Direct Supabase Cloud Save
    await saveLoginLogToCloud(entry);

    // 2. Also notify backend if reachable
    if (shouldAttemptRender()) {
      fetch(getApiUrl('/api/logs/add'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      }).catch(() => {});
    }
  } catch (err) {
    console.warn('logUserLogin warning:', err.message);
  }
}

export async function clearLoginLogs() {
  const config = getCloudConfig();
  const url = config.supabaseUrl || 'https://eymcwmwpercvdwcciqaq.supabase.co';
  const key = config.supabaseKey || 'sb_publishable_OfiB_MJr4DTHPx5_2vXtVg_DfuQqKm_';

  // 1. Clear local Dexie logs
  try {
    const { db } = await import('../db/db');
    if (db && db.loginLogs) {
      await db.loginLogs.clear();
    }
  } catch (e) {}

  // 2. Clear Supabase Cloud logs
  try {
    await fetch(`${url}/rest/v1/app_settings`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        key: 'login_logs',
        value: [],
        updated_at: new Date().toISOString()
      })
    });

    if (shouldAttemptRender()) {
      fetch(getApiUrl('/api/logs/clear'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).catch(() => {});
    }

    return { ok: true };
  } catch (err) {
    console.error('clearLoginLogs error:', err);
    throw err;
  }
}

export async function clearAllData() {
  try {
    const res = await fetch(getApiUrl('/api/demo/clear'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return await res.json();
  } catch (err) {
    console.error('clearAllData error:', err);
    throw err;
  }
}

// -------------------------------------------------------------
// AUTHENTICATION & PIN MANAGEMENT
// -------------------------------------------------------------

export async function authenticateWithSupabaseDirect(inputId, inputPass) {
  const config = getCloudConfig();
  const url = config.supabaseUrl || 'https://eymcwmwpercvdwcciqaq.supabase.co';
  const key = config.supabaseKey || 'sb_publishable_OfiB_MJr4DTHPx5_2vXtVg_DfuQqKm_';
  const headers = { apikey: key, Authorization: `Bearer ${key}` };

  const cleanId = (inputId || '').trim().toLowerCase();
  const cleanPass = String(inputPass || '').trim();

  // 1. Check Supabase app_settings for Admin, Manager, Client
  try {
    const res = await fetch(`${url}/rest/v1/app_settings?key=eq.auth_credentials`, { headers });
    if (res.ok) {
      const rows = await res.json();
      if (rows && rows.length > 0 && rows[0].value) {
        const s = rows[0].value;
        syncSmartCredentials(s);

        const adminId = (s.vendor_admin_id || 'admin').toLowerCase();
        const adminPin = String(s.vendor_admin_pin || '9895');
        if (cleanId === adminId && cleanPass === adminPin) {
          return { success: true, role: 'admin', user: { name: 'Vendor Admin / Owner', loginId: adminId } };
        }

        const managerId = (s.vendor_manager_id || 'manager').toLowerCase();
        const managerPin = String(s.vendor_manager_pin || '1234');
        if (cleanId === managerId && cleanPass === managerPin) {
          return { success: true, role: 'manager', user: { name: s.vendor_manager_name || 'Operations Manager', loginId: managerId } };
        }

        const clientId = (s.blinkit_client_id || 'client').toLowerCase();
        const clientPin = String(s.blinkit_client_pin || '5678');
        if (cleanId === clientId && cleanPass === clientPin) {
          return { success: true, role: 'client', user: { name: s.blinkit_client_name || 'Blinkit City Operations Head', loginId: clientId } };
        }
      }
    }
  } catch (err) {
    console.warn('Supabase app_settings auth error:', err.message);
  }

  // 2. Check Supabase supervisors table
  try {
    const supRes = await fetch(`${url}/rest/v1/supervisors?select=*`, { headers });
    if (supRes.ok) {
      const sups = await supRes.json();
      const cleanPhone = cleanId.replace(/[^0-9]/g, '');
      const sup = sups.find(s => 
        s && (
          (cleanPhone && String(s.phone).replace(/[^0-9]/g, '') === cleanPhone) ||
          String(s.phone) === inputId
        )
      );
      if (sup && String(sup.pin) === cleanPass) {
        if (sup.active === false || sup.status === 'Inactive') {
          return { success: false, message: 'Ye supervisor account deactivate kiya gaya hai. Admin se sampark karein.' };
        }
        return { success: true, role: 'supervisor', user: toCamelCase(sup) };
      }
    }
  } catch (err) {
    console.warn('Supabase supervisor auth error:', err.message);
  }

  return null;
}

export async function login(loginId, password, deviceInfo) {
  if (shouldAttemptRender()) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const res = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId, password, deviceInfo })
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        markRenderStatus(true);
        const data = await res.json();
        return { ok: true, status: res.status, data };
      } else {
        markRenderStatus(false);
      }
    } catch (err) {
      markRenderStatus(false);
    }
  }

  // Direct Supabase Fast Auth (~100ms)
  const directAuth = await authenticateWithSupabaseDirect(loginId, password);
  if (directAuth) {
    if (directAuth.success) {
      return { ok: true, status: 200, data: directAuth };
    } else {
      return { ok: false, status: 403, data: { message: directAuth.message } };
    }
  }

  return { ok: false, status: 401, data: { message: 'Galat Login ID ya Password darj kiya gaya hai.' } };
}

export async function changePin(role, newPin, userId = null, updatedAt = null) {
  const updatedIso = updatedAt || new Date().toISOString();

  // Always update Supabase Cloud directly
  try {
    const config = getCloudConfig();
    const url = config.supabaseUrl || 'https://eymcwmwpercvdwcciqaq.supabase.co';
    const key = config.supabaseKey || 'sb_publishable_OfiB_MJr4DTHPx5_2vXtVg_DfuQqKm_';
    const headers = { 
      'apikey': key, 
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    };

    if (role === 'admin' || role === 'manager' || role === 'client') {
      const settingsRes = await fetch(`${url}/rest/v1/app_settings?key=eq.auth_credentials`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
      let currentVal = {};
      if (settingsRes.ok) {
        const rows = await settingsRes.json();
        if (rows && rows[0]?.value) currentVal = rows[0].value;
      }
      if (role === 'admin') {
        currentVal.vendor_admin_pin = newPin;
        currentVal.admin_pin_changed = true;
        currentVal.admin_pin_updated_at = updatedIso;
      } else if (role === 'manager') {
        currentVal.vendor_manager_pin = newPin;
        currentVal.manager_pin_changed = true;
        currentVal.manager_pin_updated_at = updatedIso;
      } else if (role === 'client') {
        currentVal.blinkit_client_pin = newPin;
        currentVal.client_pin_changed = true;
        currentVal.client_pin_updated_at = updatedIso;
      }
      await fetch(`${url}/rest/v1/app_settings?on_conflict=key`, {
        method: 'POST',
        headers,
        body: JSON.stringify([{ key: 'auth_credentials', value: currentVal, updated_at: updatedIso }])
      });
    } else if (role === 'supervisor' && userId) {
      const isPhone = /^\d{10}$/.test(String(userId).trim());
      const filter = isPhone 
        ? `phone=eq.${encodeURIComponent(String(userId).trim())}`
        : `id=eq.${encodeURIComponent(String(userId).trim())}`;
      await fetch(`${url}/rest/v1/supervisors?${filter}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ pin: newPin, updated_at: updatedIso })
      });
    }
  } catch (supabaseErr) {
    console.warn('Supabase changePin notice:', supabaseErr.message);
  }

  try {
    const res = await fetch(getApiUrl('/api/auth/change-pin'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, newPin, userId, updatedAt: updatedIso })
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Render changePin offline notice:', err.message);
  }
  return { success: true, message: 'PIN updated successfully.' };
}

export async function syncCredentials(credentials) {
  try {
    const res = await fetch(getApiUrl('/api/auth/sync-credentials'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return await res.json();
  } catch (err) {
    console.warn('syncCredentials warning:', err);
    return null;
  }
}

export async function saveCloudBillSettings(billSettings) {
  try {
    const config = getCloudConfig();
    const url = config.supabaseUrl || 'https://eymcwmwpercvdwcciqaq.supabase.co';
    const key = config.supabaseKey || 'sb_publishable_OfiB_MJr4DTHPx5_2vXtVg_DfuQqKm_';
    const headers = {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    };
    await fetch(`${url}/rest/v1/app_settings?on_conflict=key`, {
      method: 'POST',
      headers,
      body: JSON.stringify([{ key: 'bill_settings', value: billSettings, updated_at: new Date().toISOString() }])
    });
  } catch (err) {
    console.warn('Supabase saveCloudBillSettings notice:', err);
  }

  const res = await callRenderApi('/api/settings/bill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ billSettings })
  });
  return res || { success: true };
}

export async function autoHealMissingRecords({ cleanings = [], stores = [], schedules = [] }) {
  const res = await callRenderApi('/api/sync/auto-heal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cleanings, stores, schedules })
  });
  return res || { success: true };
}

// -------------------------------------------------------------
// HEAVY EQUIPMENT & MACHINERY FLEET TRACKING
// -------------------------------------------------------------

export async function saveEquipment(equipmentData) {
  const normalized = { ...equipmentData, id: String(equipmentData.id || `eq_${Date.now()}`) };
  await syncSingleRecordToSupabase('equipments', normalized);
  await saveToSupabaseAppSettings('equipments_meta', normalized, 'append');
  try { if (db && db.equipments) await db.equipments.put(normalized); } catch (e) {}

  callRenderApi('/api/equipments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(normalized)
  }).catch(() => {});

  const fresh = await onSupabaseMutationComplete('equipments', normalized);
  return { success: true, equipment: normalized, ...(fresh || {}) };
}

export async function recordEquipmentMovement(movementData) {
  const normalized = { ...movementData, id: String(movementData.id || `mov_${Date.now()}`) };
  await saveToSupabaseAppSettings('equipment_movements', normalized, 'prepend');
  try { if (db && db.equipmentMovements) await db.equipmentMovements.put(normalized); } catch (e) {}

  callRenderApi('/api/equipments/movement', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(normalized)
  }).catch(() => {});

  const fresh = await onSupabaseMutationComplete('equipment_movements', normalized);
  return { success: true, movement: normalized, ...(fresh || {}) };
}

export async function deleteEquipment(id) {
  await deleteRecordFromSupabase('equipments', id);
  await deleteFromSupabaseAppSettings('equipments_meta', id);
  try { if (db && db.equipments) await db.equipments.delete(id); } catch (e) {}

  callRenderApi('/api/equipments/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  }).catch(() => {});

  const fresh = await onSupabaseMutationComplete('equipments', { id });
  return { success: true, ...(fresh || {}) };
}

// -------------------------------------------------------------
// TEAM TOOLS & CONSUMABLES ALLOCATION
// -------------------------------------------------------------

export async function saveToolAllocation(allocationData) {
  const normalized = { ...allocationData, id: String(allocationData.id || `alloc_${Date.now()}`) };
  await saveToSupabaseAppSettings('tool_allocations', normalized, 'prepend');
  try { if (db && db.toolAllocations) await db.toolAllocations.put(normalized); } catch (e) {}

  callRenderApi('/api/tools/allocate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(normalized)
  }).catch(() => {});

  const fresh = await onSupabaseMutationComplete('tool_allocations', normalized);
  return { success: true, allocation: normalized, ...(fresh || {}) };
}

export async function recordToolReturn(returnData) {
  const normalized = { ...returnData, id: String(returnData.id || `ret_${Date.now()}`) };
  await saveToSupabaseAppSettings('tool_allocations', normalized, 'append');
  try { if (db && db.toolAllocations) await db.toolAllocations.put(normalized); } catch (e) {}

  callRenderApi('/api/tools/return', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(normalized)
  }).catch(() => {});

  const fresh = await onSupabaseMutationComplete('tool_allocations', normalized);
  return { success: true, return: normalized, ...(fresh || {}) };
}

export async function deleteToolAllocation(id) {
  await deleteFromSupabaseAppSettings('tool_allocations', id);
  try { if (db && db.toolAllocations) await db.toolAllocations.delete(id); } catch (e) {}

  callRenderApi('/api/tools/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  }).catch(() => {});

  const fresh = await onSupabaseMutationComplete('tool_allocations', { id });
  return { success: true, ...(fresh || {}) };
}

// -------------------------------------------------------------
// STORE-WISE EXPENSES & REAL OPERATIONAL P&L
// -------------------------------------------------------------

export async function saveStoreExpense(expenseData) {
  const normalized = { ...expenseData, id: String(expenseData.id || `exp_${Date.now()}`) };
  await syncSingleRecordToSupabase('store_expenses', normalized);
  try { if (db && db.storeExpenses) await db.storeExpenses.put(normalized); } catch (e) {}

  callRenderApi('/api/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(normalized)
  }).catch(() => {});

  const fresh = await onSupabaseMutationComplete('store_expenses', normalized);
  return { success: true, expense: normalized, ...(fresh || {}) };
}

export async function deleteStoreExpense(id) {
  await deleteRecordFromSupabase('store_expenses', id);
  try { if (db && db.storeExpenses) await db.storeExpenses.delete(id); } catch (e) {}

  callRenderApi('/api/expenses/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  }).catch(() => {});

  const fresh = await onSupabaseMutationComplete('store_expenses', { id });
  return { success: true, ...(fresh || {}) };
}

// -------------------------------------------------------------
// TEAM DAILY STORE MOVEMENT & GEAR CUSTODY DISPATCHES
// -------------------------------------------------------------

export async function saveTeamDispatch(dispatchData) {
  const normalized = { ...dispatchData, id: String(dispatchData.id || `disp_${Date.now()}`) };
  await saveToSupabaseAppSettings('team_dispatches', normalized, 'prepend');
  try { if (db && db.teamDispatches) await db.teamDispatches.put(normalized); } catch (e) {}

  callRenderApi('/api/dispatches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(normalized)
  }).catch(() => {});

  const fresh = await onSupabaseMutationComplete('team_dispatches', normalized);
  return { success: true, dispatch: normalized, ...(fresh || {}) };
}

export async function deleteTeamDispatch(id) {
  await deleteFromSupabaseAppSettings('team_dispatches', id);
  try { if (db && db.teamDispatches) await db.teamDispatches.delete(id); } catch (e) {}

  callRenderApi('/api/dispatches/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  }).catch(() => {});

  const fresh = await onSupabaseMutationComplete('team_dispatches', { id });
  return { success: true, ...(fresh || {}) };
}



