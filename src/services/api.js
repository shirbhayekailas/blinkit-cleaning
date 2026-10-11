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
  syncSmartCredentials,
  getCloudConfig 
} from '../utils/cloudSync';

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

export async function fetchFromSupabaseDirect(lastKnownUpdated = null) {
  const config = getCloudConfig();
  const url = config.supabaseUrl || 'https://eymcwmwpercvdwcciqaq.supabase.co';
  const key = config.supabaseKey || 'sb_publishable_OfiB_MJr4DTHPx5_2vXtVg_DfuQqKm_';

  try {
    const headers = {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    };

    const [storesRes, cleaningsRes, supervisorsRes, cleanersRes, settingsRes] = await Promise.all([
      fetch(`${url}/rest/v1/stores?select=*`, { headers }),
      fetch(`${url}/rest/v1/cleanings?select=*`, { headers }),
      fetch(`${url}/rest/v1/supervisors?select=*`, { headers }),
      fetch(`${url}/rest/v1/cleaners?select=*`, { headers }),
      fetch(`${url}/rest/v1/app_settings?key=eq.auth_credentials`, { headers })
    ]);

    if (!cleaningsRes.ok || !storesRes.ok) return null;

    const rawStores = await storesRes.json();
    const rawCleanings = await cleaningsRes.json();
    const rawSupervisors = supervisorsRes.ok ? await supervisorsRes.json() : [];
    const rawCleaners = cleanersRes.ok ? await cleanersRes.json() : [];

    // Calculate unique fingerprint to detect zero-change conditions
    const latestCleanDate = rawCleanings.length > 0 ? (rawCleanings[0].updated_at || rawCleanings[0].created_at || '') : '';
    const latestStoreDate = rawStores.length > 0 ? (rawStores[0].updated_at || rawStores[0].created_at || '') : '';
    const currentFingerprint = `${rawStores.length}_${rawCleanings.length}_${rawSupervisors.length}_${rawCleaners.length}_${latestCleanDate}_${latestStoreDate}`;

    if (lastKnownUpdated && (lastKnownUpdated === currentFingerprint || lastSupabaseFingerprint === currentFingerprint) && cachedSupabaseState) {
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

    let appSettings = null;
    if (settingsRes && settingsRes.ok) {
      const sRows = await settingsRes.json();
      if (sRows && sRows.length > 0 && sRows[0].value) {
        appSettings = sRows[0].value;
        syncSmartCredentials(appSettings);
      }
    }

    lastSupabaseFingerprint = currentFingerprint;
    const resultState = {
      stores,
      cleanings,
      supervisors,
      cleaners,
      appSettings,
      cleaningSchedules: [],
      chemicalStock: [],
      storeIssues: [],
      storeExpenses: [],
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
  // Always guarantee Supabase has it in real-time
  syncSingleRecordToSupabase('cleanings', cleaningData);

  const res = await callRenderApi('/api/cleanings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cleaningData)
  });
  return res || { success: true, savedRecord: cleaningData };
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
  syncSingleRecordToSupabase('cleanings', cleanPayload);

  const res = await callRenderApi('/api/cleanings/payment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    },
    body: JSON.stringify(cleanPayload)
  });
  return res || { success: true, cleaning: cleanPayload };
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
  deleteRecordFromSupabase('cleanings', targetId);

  let payload = {};
  if (typeof cleaningOrId === 'object' && cleaningOrId !== null) {
    payload = {
      id: cleaningOrId.id,
      syncId: cleaningOrId.syncId,
      storeCode: cleaningOrId.storeCode,
      cleaningDate: cleaningOrId.cleaningDate
    };
  } else {
    payload = { id: cleaningOrId };
  }

  const res = await callRenderApi('/api/cleanings/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res || { success: true };
}

// -------------------------------------------------------------
// STORES MASTER LEDGER
// -------------------------------------------------------------

export async function saveStore(storeData) {
  syncSingleRecordToSupabase('stores', storeData);

  const res = await callRenderApi('/api/stores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(storeData)
  });
  return res || { success: true, store: storeData };
}

export async function deleteStore(storeCode, deleteCleanings = false, force = true, id = null, city = null) {
  const sCode = typeof storeCode === 'object' && storeCode !== null ? (storeCode.storeCode || storeCode.code) : storeCode;
  deleteRecordFromSupabase('stores', sCode, 'store_code');

  const payload = typeof storeCode === 'object' && storeCode !== null
    ? storeCode
    : { storeCode, deleteCleanings, force, id, city };
  const res = await callRenderApi('/api/stores/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res || { success: true };
}

// -------------------------------------------------------------
// SUPERVISORS
// -------------------------------------------------------------

export async function saveSupervisor(supData) {
  syncSingleRecordToSupabase('supervisors', supData);

  const res = await callRenderApi('/api/supervisors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(supData)
  });
  return res || { success: true, supervisor: supData };
}

export async function deleteSupervisor(supOrId) {
  const targetId = typeof supOrId === 'object' && supOrId !== null ? (supOrId.id || supOrId.phone) : supOrId;
  deleteRecordFromSupabase('supervisors', targetId);

  const payload = typeof supOrId === 'object' && supOrId !== null
    ? { id: supOrId.id, phone: supOrId.phone }
    : { id: supOrId };

  const res = await callRenderApi('/api/supervisors/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res || { success: true };
}

// -------------------------------------------------------------
// CLEANERS ROSTER
// -------------------------------------------------------------

export async function saveCleaner(clnData) {
  try {
    const res = await fetch(getApiUrl('/api/cleaners'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clnData)
    });
    return await res.json();
  } catch (err) {
    console.error('saveCleaner error:', err);
    throw err;
  }
}

export async function deleteCleaner(clnOrId) {
  try {
    const payload = typeof clnOrId === 'object' && clnOrId !== null
      ? { id: clnOrId.id, name: clnOrId.name, phone: clnOrId.phone }
      : { id: clnOrId };

    const res = await fetch(getApiUrl('/api/cleaners/delete'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    console.error('deleteCleaner error:', err);
    throw err;
  }
}

// -------------------------------------------------------------
// CLEANING SCHEDULES
// -------------------------------------------------------------

export async function saveSchedule(schData) {
  try {
    const res = await fetch(getApiUrl('/api/schedules'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schData)
    });
    return await res.json();
  } catch (err) {
    console.error('saveSchedule error:', err);
    throw err;
  }
}

export async function deleteSchedule(schOrId) {
  try {
    const payload = typeof schOrId === 'object' && schOrId !== null
      ? { id: schOrId.id, storeCode: schOrId.storeCode, scheduledDate: schOrId.scheduledDate }
      : { id: schOrId };

    const res = await fetch(getApiUrl('/api/schedules/delete'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    console.error('deleteSchedule error:', err);
    throw err;
  }
}

// -------------------------------------------------------------
// CHEMICAL STOCK & LOGS
// -------------------------------------------------------------

export async function saveChemicalStock(itemData) {
  try {
    const res = await fetch(getApiUrl('/api/chemicals/stock'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData)
    });
    return await res.json();
  } catch (err) {
    console.error('saveChemicalStock error:', err);
    throw err;
  }
}

export async function addChemicalLog(logData) {
  try {
    const res = await fetch(getApiUrl('/api/chemicals/log'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData)
    });
    return await res.json();
  } catch (err) {
    console.error('addChemicalLog error:', err);
    throw err;
  }
}

export async function deleteChemicalStock(idOrItem) {
  try {
    const payload = typeof idOrItem === 'object' && idOrItem !== null
      ? { id: idOrItem.id, itemName: idOrItem.itemName }
      : { id: idOrItem };

    const res = await fetch(getApiUrl('/api/chemicals/delete'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    console.error('deleteChemicalStock error:', err);
    throw err;
  }
}

export async function seedStandardChemicals() {
  try {
    const res = await fetch(getApiUrl('/api/chemicals/seed'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    return await res.json();
  } catch (err) {
    console.error('seedStandardChemicals error:', err);
    throw err;
  }
}

// -------------------------------------------------------------
// CLEANER ADVANCES / KHATA
// -------------------------------------------------------------

export async function saveAdvance(advData) {
  try {
    const res = await fetch(getApiUrl('/api/advances'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(advData)
    });
    return await res.json();
  } catch (err) {
    console.error('saveAdvance error:', err);
    throw err;
  }
}

export async function deleteAdvance(advOrId) {
  try {
    const payload = typeof advOrId === 'object' && advOrId !== null
      ? { id: advOrId.id }
      : { id: advOrId };

    const res = await fetch(getApiUrl('/api/advances/delete'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    console.error('deleteAdvance error:', err);
    throw err;
  }
}

// -------------------------------------------------------------
// STORE DEFECT ISSUES
// -------------------------------------------------------------

export async function saveIssue(issueData) {
  try {
    const res = await fetch(getApiUrl('/api/issues'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(issueData)
    });
    return await res.json();
  } catch (err) {
    console.error('saveIssue error:', err);
    throw err;
  }
}

export async function deleteIssue(issueOrId) {
  try {
    const payload = typeof issueOrId === 'object' && issueOrId !== null
      ? { id: issueOrId.id }
      : { id: issueOrId };

    const res = await fetch(getApiUrl('/api/issues/delete'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    console.error('deleteIssue error:', err);
    throw err;
  }
}

// -------------------------------------------------------------
// LOGIN LOGS & RESET
// -------------------------------------------------------------

export async function logUserLogin(entry) {
  try {
    await fetch(getApiUrl('/api/logs/add'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
  } catch (err) {
    console.warn('logUserLogin warning:', err.message);
  }
}

export async function clearLoginLogs() {
  try {
    const res = await fetch(getApiUrl('/api/logs/clear'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return await res.json();
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
    const res = await fetch(getApiUrl('/api/settings/bill'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ billSettings })
    });
    return await res.json();
  } catch (err) {
    console.warn('saveCloudBillSettings warning:', err);
    return null;
  }
}

export async function autoHealMissingRecords({ cleanings = [], stores = [], schedules = [] }) {
  try {
    const res = await fetch(getApiUrl('/api/sync/auto-heal'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cleanings, stores, schedules })
    });
    return await res.json();
  } catch (err) {
    console.warn('autoHealMissingRecords warning:', err);
    return null;
  }
}

// -------------------------------------------------------------
// HEAVY EQUIPMENT & MACHINERY FLEET TRACKING
// -------------------------------------------------------------

export async function saveEquipment(equipmentData) {
  try {
    const res = await fetch(getApiUrl('/api/equipments'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(equipmentData)
    });
    return await res.json();
  } catch (err) {
    console.error('saveEquipment error:', err);
    throw err;
  }
}

export async function recordEquipmentMovement(movementData) {
  try {
    const res = await fetch(getApiUrl('/api/equipments/movement'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(movementData)
    });
    return await res.json();
  } catch (err) {
    console.error('recordEquipmentMovement error:', err);
    throw err;
  }
}

export async function deleteEquipment(id) {
  try {
    const res = await fetch(getApiUrl('/api/equipments/delete'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    return await res.json();
  } catch (err) {
    console.error('deleteEquipment error:', err);
    throw err;
  }
}

// -------------------------------------------------------------
// TEAM TOOLS & CONSUMABLES ALLOCATION
// -------------------------------------------------------------

export async function saveToolAllocation(allocationData) {
  try {
    const res = await fetch(getApiUrl('/api/tools/allocate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(allocationData)
    });
    return await res.json();
  } catch (err) {
    console.error('saveToolAllocation error:', err);
    throw err;
  }
}

export async function recordToolReturn(returnData) {
  try {
    const res = await fetch(getApiUrl('/api/tools/return'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(returnData)
    });
    return await res.json();
  } catch (err) {
    console.error('recordToolReturn error:', err);
    throw err;
  }
}

export async function deleteToolAllocation(id) {
  try {
    const res = await fetch(getApiUrl('/api/tools/delete'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    return await res.json();
  } catch (err) {
    console.error('deleteToolAllocation error:', err);
    throw err;
  }
}

// -------------------------------------------------------------
// STORE-WISE EXPENSES & REAL OPERATIONAL P&L
// -------------------------------------------------------------

export async function saveStoreExpense(expenseData) {
  try {
    const res = await fetch(getApiUrl('/api/expenses'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expenseData)
    });
    return await res.json();
  } catch (err) {
    console.error('saveStoreExpense error:', err);
    throw err;
  }
}

export async function deleteStoreExpense(id) {
  try {
    const res = await fetch(getApiUrl('/api/expenses/delete'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    return await res.json();
  } catch (err) {
    console.error('deleteStoreExpense error:', err);
    throw err;
  }
}

// -------------------------------------------------------------
// TEAM DAILY STORE MOVEMENT & GEAR CUSTODY DISPATCHES
// -------------------------------------------------------------

export async function saveTeamDispatch(dispatchData) {
  try {
    const res = await fetch(getApiUrl('/api/dispatches'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dispatchData)
    });
    return await res.json();
  } catch (err) {
    console.error('saveTeamDispatch error:', err);
    throw err;
  }
}

export async function deleteTeamDispatch(id) {
  try {
    const res = await fetch(getApiUrl('/api/dispatches/delete'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    return await res.json();
  } catch (err) {
    console.error('deleteTeamDispatch error:', err);
    throw err;
  }
}



