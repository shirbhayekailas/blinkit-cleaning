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

export async function fetchServerState() {
  try {
    const nonce = Date.now();
    const res = await fetch(getApiUrl(`/api/state?_t=${nonce}`), {
      method: 'GET',
      headers: { 
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    if (res.ok) {
      const data = await res.json();
      return data.data || null;
    }
  } catch (err) {
    console.warn('fetchServerState warning:', err.message);
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

export async function deleteStore(storeCode, deleteCleanings = false, force = true) {
  try {
    const res = await fetch(getApiUrl('/api/stores/delete'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeCode, deleteCleanings, force })
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

export async function changePin(role, newPin, userId = null) {
  try {
    const res = await fetch(getApiUrl('/api/auth/change-pin'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, newPin, userId })
    });
    return await res.json();
  } catch (err) {
    console.error('changePin error:', err);
    throw err;
  }
}
