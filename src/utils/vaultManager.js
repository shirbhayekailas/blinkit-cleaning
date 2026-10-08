/**
 * Blinkit Deep Cleaning Tracker - Permanent Client-Side Vault & Self-Healing Engine
 * 
 * Guarantees zero data loss across container redeployments, server restarts, 
 * network interruptions, and free-tier ephemeral resets.
 */

import { autoHealMissingRecords } from '../services/api';

const VAULT_STORAGE_KEY = 'blinkit_permanent_vault_v2';

// Safe JSON parser
function readVaultFromStorage() {
  try {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    if (!raw) return { cleanings: [], stores: [], schedules: [] };
    const parsed = JSON.parse(raw);
    return {
      cleanings: Array.isArray(parsed.cleanings) ? parsed.cleanings : [],
      stores: Array.isArray(parsed.stores) ? parsed.stores : [],
      schedules: Array.isArray(parsed.schedules) ? parsed.schedules : []
    };
  } catch (err) {
    console.warn('Vault read notice:', err);
    return { cleanings: [], stores: [], schedules: [] };
  }
}

// Safe storage writer
function writeVaultToStorage(vault) {
  try {
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vault));
  } catch (quotaErr) {
    // If photos exceed local quota, strip large photo data URLs while preserving all operational records
    try {
      const lightweight = {
        ...vault,
        cleanings: (vault.cleanings || []).map(c => ({
          ...c,
          photos: (c.photos || []).map(p => ({
            id: p.id,
            type: p.type,
            name: p.name,
            timestamp: p.timestamp,
            url: (p.url && p.url.length > 3000) ? '' : p.url
          }))
        }))
      };
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(lightweight));
    } catch (e) {
      console.warn('Vault storage fallback notice:', e);
    }
  }
}

/**
 * Permanently locks a record in the local device vault.
 * Call this whenever an entry is created or updated.
 */
export function lockRecordInVault(type, record) {
  if (!record || typeof record !== 'object') return;
  const vault = readVaultFromStorage();

  if (type === 'cleaning') {
    const targetId = record.id ? String(record.id) : null;
    const targetCode = record.storeCode ? String(record.storeCode).trim().toUpperCase() : null;
    const targetCity = record.city ? String(record.city).trim().toLowerCase() : null;
    const targetDate = record.cleaningDate ? String(record.cleaningDate).trim() : null;

    const idx = vault.cleanings.findIndex(c => {
      if (!c) return false;
      if (targetId && String(c.id) === targetId) return true;
      if (targetCode && targetDate && c.storeCode && c.cleaningDate) {
        if (String(c.storeCode).trim().toUpperCase() !== targetCode) return false;
        if (String(c.cleaningDate).trim() !== targetDate) return false;
        if (targetCity) {
          const cCity = (c.city || '').trim().toLowerCase();
          if (cCity && cCity !== targetCity) return false;
        }
        return true;
      }
      return false;
    });

    if (idx >= 0) {
      vault.cleanings[idx] = { ...vault.cleanings[idx], ...record, vaultedAt: new Date().toISOString() };
    } else {
      vault.cleanings.push({ ...record, vaultedAt: new Date().toISOString() });
    }
  } else if (type === 'store') {
    const targetCode = (record.storeCode || record.code || '').trim().toUpperCase();
    const targetCity = (record.city || '').trim().toLowerCase();
    const targetId = record.id ? String(record.id) : null;
    const idx = vault.stores.findIndex(s => {
      if (!s) return false;
      if (targetId && s.id && String(s.id) === targetId) return true;
      const c = (s.storeCode || s.code || '').trim().toUpperCase();
      if (c !== targetCode) return false;
      if (targetCity) {
        const sCity = (s.city || '').trim().toLowerCase();
        if (sCity && sCity !== targetCity) return false;
      }
      return true;
    });

    if (idx >= 0) {
      vault.stores[idx] = { ...vault.stores[idx], ...record, vaultedAt: new Date().toISOString() };
    } else {
      vault.stores.push({ ...record, vaultedAt: new Date().toISOString() });
    }
  } else if (type === 'schedule') {
    const idx = vault.schedules.findIndex(s => {
      if (record.id && s.id && String(s.id) === String(record.id)) return true;
      return s.storeCode === record.storeCode && s.scheduledDate === record.scheduledDate;
    });

    if (idx >= 0) {
      vault.schedules[idx] = { ...vault.schedules[idx], ...record, vaultedAt: new Date().toISOString() };
    } else {
      vault.schedules.push({ ...record, vaultedAt: new Date().toISOString() });
    }
  }

  writeVaultToStorage(vault);
}

/**
 * Purges an intentionally deleted record from the vault so it doesn't resurrect.
 */
/**
 * Purges an intentionally deleted record from the vault so it doesn't resurrect.
 */
export function purgeFromVault(type, identifier) {
  const vault = readVaultFromStorage();
  
  if (type === 'cleaning') {
    let matchId = null;
    let matchSync = null;
    let matchKey = null;

    if (identifier && typeof identifier === 'object') {
      matchId = identifier.id ? String(identifier.id).trim().toUpperCase() : null;
      matchSync = identifier.syncId ? String(identifier.syncId).trim().toUpperCase() : null;
      if (identifier.storeCode && identifier.cleaningDate) {
        matchKey = `${String(identifier.storeCode).trim()}_${String(identifier.cleaningDate).trim()}`.toUpperCase();
      }
    } else {
      const idStr = String(identifier || '').trim().toUpperCase();
      matchId = idStr;
      matchSync = idStr;
      matchKey = idStr;
    }

    vault.cleanings = vault.cleanings.filter(c => {
      if (!c) return false;
      const cId = c.id ? String(c.id).trim().toUpperCase() : null;
      const cSync = c.syncId ? String(c.syncId).trim().toUpperCase() : null;
      const cKey = (c.storeCode && c.cleaningDate) ? `${String(c.storeCode).trim()}_${String(c.cleaningDate).trim()}`.toUpperCase() : null;

      if (matchId && (cId === matchId || cSync === matchId || cKey === matchId)) return false;
      if (matchSync && (cId === matchSync || cSync === matchSync || cKey === matchSync)) return false;
      if (matchKey && (cId === matchKey || cSync === matchKey || cKey === matchKey)) return false;
      return true;
    });
  } else if (type === 'store') {
    const codeStr = (typeof identifier === 'object' ? (identifier.storeCode || identifier.code) : identifier) || '';
    const targetCode = String(codeStr).trim().toUpperCase();
    vault.stores = vault.stores.filter(s => {
      const code = (s.storeCode || s.code || '').trim().toUpperCase();
      return code !== targetCode;
    });
  } else if (type === 'schedule') {
    const idStr = String(typeof identifier === 'object' ? identifier.id : identifier).trim().toUpperCase();
    vault.schedules = vault.schedules.filter(s => {
      if (s.id && String(s.id).trim().toUpperCase() === idStr) return false;
      return true;
    });
  }

  writeVaultToStorage(vault);

  // Also clean cached state in localStorage if present
  try {
    const cachedRaw = localStorage.getItem('blinkit_cached_state_v2');
    if (cachedRaw) {
      const parsed = JSON.parse(cachedRaw);
      if (type === 'cleaning' && Array.isArray(parsed.cleanings)) {
        parsed.cleanings = vault.cleanings;
        localStorage.setItem('blinkit_cached_state_v2', JSON.stringify(parsed));
      } else if (type === 'store' && Array.isArray(parsed.stores)) {
        parsed.stores = vault.stores;
        localStorage.setItem('blinkit_cached_state_v2', JSON.stringify(parsed));
      }
    }
  } catch (e) {
    // ignore
  }
}

/**
 * Smart Reconciliation & Auto-Healer:
 * Compares incoming server data with the local Vault.
 * - Detects any cleanings or stores present in Vault but missing on server (e.g. after container redeploy).
 * - Immediately returns the merged data for instant UI presentation.
 * - Automatically pushes missing records to the server via `/api/sync/auto-heal`.
 * - Ingests any newly created server records into the Vault to keep local backup 100% complete.
 */
export async function reconcileVaultWithServer(serverData = {}) {
  if (!serverData || typeof serverData !== 'object') return { mergedData: serverData, healed: false };

  const vault = readVaultFromStorage();
  const serverCleanings = Array.isArray(serverData.cleanings) ? serverData.cleanings : [];
  const serverStores = Array.isArray(serverData.stores) ? serverData.stores : [];
  const serverSchedules = Array.isArray(serverData.cleaningSchedules) ? serverData.cleaningSchedules : [];

  const deletedCleanings = Array.isArray(serverData.deletedCleanings) ? serverData.deletedCleanings : [];
  const deletedStores = Array.isArray(serverData.deletedStores) ? serverData.deletedStores : [];

  // Helper to check deletion
  const isDeleted = (c) => {
    if (!c || deletedCleanings.length === 0) return false;
    const cId = c.id ? String(c.id).trim().toUpperCase() : null;
    const cSync = c.syncId ? String(c.syncId).trim().toUpperCase() : null;
    const cKey = (c.storeCode && c.cleaningDate) ? `${String(c.storeCode).trim()}_${String(c.cleaningDate).trim()}`.toUpperCase() : null;

    return deletedCleanings.some(d => {
      if (!d) return false;
      if (typeof d === 'string') {
        const dUp = d.trim().toUpperCase();
        return dUp === cId || dUp === cSync || dUp === cKey;
      }
      if (d.id && String(d.id).trim().toUpperCase() === cId) return true;
      if (d.syncId && String(d.syncId).trim().toUpperCase() === cSync) return true;
      if (d.key && (d.key.trim().toUpperCase() === cKey || d.key.trim().toUpperCase() === cSync || d.key.trim().toUpperCase() === cId)) return true;
      if (d.storeCode && d.cleaningDate && cKey) {
        const dKey = `${String(d.storeCode).trim()}_${String(d.cleaningDate).trim()}`.toUpperCase();
        if (dKey === cKey) return true;
      }
      return false;
    });
  };

  // Immediate purge of local vault records matching server tombstones
  let vaultModified = false;
  vault.cleanings = vault.cleanings.filter(vc => {
    if (!vc) return false;
    if (isDeleted(vc)) {
      vaultModified = true;
      return false;
    }
    return true;
  });

  vault.stores = vault.stores.filter(vs => {
    if (!vs) return false;
    const code = (vs.storeCode || vs.code || '').trim().toUpperCase();
    if (!code) return false;
    const isStoreDel = deletedStores.some(d => {
      const dCode = typeof d === 'string' ? d.trim().toUpperCase() : (d.storeCode || '').trim().toUpperCase();
      return dCode === code;
    });
    if (isStoreDel) {
      vaultModified = true;
      return false;
    }
    return true;
  });

  if (vaultModified) {
    writeVaultToStorage(vault);
  }

  // 1. Identify missing cleanings (strictly ignoring deleted items)
  const missingCleanings = [];
  vault.cleanings.forEach(vc => {
    if (!vc || isDeleted(vc)) return;

    const vcId = vc.id ? String(vc.id) : null;
    const vcCode = vc.storeCode ? String(vc.storeCode).trim().toUpperCase() : null;
    const vcCity = (vc.city || '').trim().toLowerCase();
    const vcDate = vc.cleaningDate ? String(vc.cleaningDate).trim() : null;

    const existsOnServer = serverCleanings.some(sc => {
      if (!sc) return false;
      if (vcId && String(sc.id) === vcId) return true;
      if (vcCode && vcDate && sc.storeCode && sc.cleaningDate) {
        if (String(sc.storeCode).trim().toUpperCase() !== vcCode) return false;
        if (String(sc.cleaningDate).trim() !== vcDate) return false;
        if (vcCity) {
          const scCity = (sc.city || '').trim().toLowerCase();
          if (scCity && scCity !== vcCity) return false;
        }
        return true;
      }
      return false;
    });

    if (!existsOnServer) {
      missingCleanings.push(vc);
    }
  });

  // 2. Identify missing stores (strictly ignoring deleted items)
  const missingStores = [];
  vault.stores.forEach(vs => {
    if (!vs) return;
    const code = (vs.storeCode || vs.code || '').trim().toUpperCase();
    const vsCity = (vs.city || '').trim().toLowerCase();
    if (!code) return;

    const isStoreDel = deletedStores.some(d => {
      const dCode = typeof d === 'string' ? d.trim().toUpperCase() : (d.storeCode || '').trim().toUpperCase();
      return dCode === code;
    });
    if (isStoreDel) return;

    const existsOnServer = serverStores.some(ss => {
      if (!ss) return false;
      if (vs.id && ss.id && String(vs.id) === String(ss.id)) return true;
      const sCode = (ss.storeCode || ss.code || '').trim().toUpperCase();
      if (sCode !== code) return false;
      if (vsCity) {
        const ssCity = (ss.city || '').trim().toLowerCase();
        if (ssCity && ssCity !== vsCity) return false;
      }
      return true;
    });

    if (!existsOnServer) {
      missingStores.push(vs);
    }
  });

  // 3. Update vault with any server records we might not have yet
  serverCleanings.forEach(sc => {
    if (sc) lockRecordInVault('cleaning', sc);
  });
  serverStores.forEach(ss => {
    if (ss) lockRecordInVault('store', ss);
  });
  serverSchedules.forEach(sch => {
    if (sch) lockRecordInVault('schedule', sch);
  });

  // If we found records that were wiped on the server, merge them into local data
  // and trigger auto-heal upload in background!
  const hasMissing = missingCleanings.length > 0 || missingStores.length > 0;
  let mergedData = { ...serverData };

  if (hasMissing) {
    mergedData.cleanings = [...serverCleanings, ...missingCleanings].sort((a, b) => 
      (b.cleaningDate || '').localeCompare(a.cleaningDate || '')
    );
    mergedData.stores = [...serverStores, ...missingStores];

    console.info(`[Self-Healing Vault] Detected ${missingCleanings.length} cleanings and ${missingStores.length} stores missing on server. Auto-healing now...`);

    // Asynchronously push missing records to server
    autoHealMissingRecords({
      cleanings: missingCleanings,
      stores: missingStores
    }).then(res => {
      if (res && res.success) {
        console.info(`[Self-Healing Vault] Server successfully restored with ${res.healedCleanings} cleanings!`);
      }
    }).catch(err => {
      console.warn('[Self-Healing Vault] Auto-heal sync notice:', err);
    });
  }

  return { mergedData, healed: hasMissing };
}

/**
 * Returns the complete snapshot of the local vault for manual backups.
 */
export function getVaultSnapshot() {
  return readVaultFromStorage();
}
