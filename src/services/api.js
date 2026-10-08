/**
 * Blinkit Deep Cleaning Tracker - Server Database Client API
 * 100% Server-First Architecture. No local storage ghosting or conflict.
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

// -------------------------------------------------------------
// CORE FETCH & STATE
// -------------------------------------------------------------

export async function fetchServerState(lastKnownUpdated = null) {
  const controller = new AbortController();
  // 35s timeout ensures Render free-tier cold boot has time to wake up smoothly
  const timeoutId = setTimeout(() => controller.abort(), 35000);
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
      const data = await res.json();
      if (data.unchanged) {
        return { unchanged: true, lastUpdated: data.lastUpdated };
      }
      return data.data || null;
    }
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name !== 'AbortError') {
      console.warn('fetchServerState notice:', err.message);
    }
  }
  return null;
}

// -------------------------------------------------------------
// CLEANINGS
// -------------------------------------------------------------

export async function saveCleaning(cleaningData) {
  try {
    const res = await fetch(getApiUrl('/api/cleanings'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleaningData)
    });
    const result = await res.json();
    return result;
  } catch (err) {
    console.error('saveCleaning error:', err);
    throw err;
  }
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(getApiUrl('/api/cleanings/payment'), {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
      body: JSON.stringify(cleanPayload)
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      let errMsg = `Server returned HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson && errJson.message) errMsg = errJson.message;
      } catch (e) {}
      throw new Error(errMsg);
    }

    const result = await res.json();
    if (!result.success) {
      throw new Error(result.message || 'Server rejected payment update');
    }
    return result;
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('updateCleaningPayment error:', err);
    throw err;
  }
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
  try {
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

    const res = await fetch(getApiUrl('/api/cleanings/delete'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    console.error('deleteCleaning error:', err);
    throw err;
  }
}

// -------------------------------------------------------------
// STORES MASTER LEDGER
// -------------------------------------------------------------

export async function saveStore(storeData) {
  try {
    const res = await fetch(getApiUrl('/api/stores'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(storeData)
    });
    return await res.json();
  } catch (err) {
    console.error('saveStore error:', err);
    throw err;
  }
}

export async function deleteStore(storeCode, deleteCleanings = false, force = true, id = null, city = null) {
  try {
    const payload = typeof storeCode === 'object' && storeCode !== null
      ? storeCode
      : { storeCode, deleteCleanings, force, id, city };
    const res = await fetch(getApiUrl('/api/stores/delete'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    console.error('deleteStore error:', err);
    throw err;
  }
}

// -------------------------------------------------------------
// SUPERVISORS
// -------------------------------------------------------------

export async function saveSupervisor(supData) {
  try {
    const res = await fetch(getApiUrl('/api/supervisors'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(supData)
    });
    return await res.json();
  } catch (err) {
    console.error('saveSupervisor error:', err);
    throw err;
  }
}

export async function deleteSupervisor(supOrId) {
  try {
    const payload = typeof supOrId === 'object' && supOrId !== null
      ? { id: supOrId.id, phone: supOrId.phone }
      : { id: supOrId };

    const res = await fetch(getApiUrl('/api/supervisors/delete'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    console.error('deleteSupervisor error:', err);
    throw err;
  }
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

export async function login(loginId, password, deviceInfo) {
  try {
    const res = await fetch(getApiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId, password, deviceInfo })
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: { message: 'Network error connecting to server: ' + err.message } };
  }
}

export async function changePin(role, newPin, userId = null, updatedAt = null) {
  try {
    const res = await fetch(getApiUrl('/api/auth/change-pin'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, newPin, userId, updatedAt: updatedAt || new Date().toISOString() })
    });
    return await res.json();
  } catch (err) {
    console.error('changePin error:', err);
    throw err;
  }
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



