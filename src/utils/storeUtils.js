/**
 * Utility functions for Store and Cleaning matching & disambiguation.
 * Supports multiple stores sharing the same storeCode across different cities (e.g. ES24 in Mumbai vs ES24 in Pune).
 */

export function getStoreKey(store) {
  if (!store) return '';
  const code = (store.storeCode || store.code || '').trim().toUpperCase();
  const city = (store.city || '').trim().toUpperCase();
  return city ? `${code}__${city}` : code;
}

export function getCleaningStoreKey(cleaning) {
  if (!cleaning) return '';
  const code = (cleaning.storeCode || '').trim().toUpperCase();
  const city = (cleaning.city || '').trim().toUpperCase();
  return city ? `${code}__${city}` : code;
}

export function doesCleaningMatchStore(cleaning, store) {
  if (!cleaning || !store) return false;
  if (cleaning.storeId && store.id && String(cleaning.storeId) === String(store.id)) return true;

  const cCode = (cleaning.storeCode || '').trim().toUpperCase();
  const sCode = (store.storeCode || store.code || '').trim().toUpperCase();
  if (!cCode || !sCode || cCode !== sCode) return false;

  // City disambiguation: if both specify a city and they differ, they DO NOT match
  const cCity = (cleaning.city || '').trim().toLowerCase();
  const sCity = (store.city || '').trim().toLowerCase();
  if (cCity && sCity && cCity !== sCity) {
    return false;
  }

  // Name disambiguation if one is Pune and the other is Mumbai/Kurla
  const cName = (cleaning.storeName || '').trim().toLowerCase();
  const sName = (store.storeName || store.name || '').trim().toLowerCase();
  if (cName && sName) {
    if ((cName.includes('pune') && sName.includes('mumbai')) || (cName.includes('mumbai') && sName.includes('pune'))) {
      return false;
    }
    if ((cName.includes('pune') && sName.includes('kurla')) || (cName.includes('kurla') && sName.includes('pune'))) {
      return false;
    }
  }

  return true;
}

export function getDisambiguatedStoreName(store, allStores = []) {
  if (!store) return '';
  const code = (store.storeCode || store.code || '').trim().toUpperCase();
  const city = (store.city || '').trim();
  const name = store.storeName || store.name || code;
  const hasMultipleWithCode = allStores.filter(s => (s.storeCode || s.code || '').trim().toUpperCase() === code).length > 1;

  if (hasMultipleWithCode && city) {
    return `${name} (${city})`;
  }
  return name;
}
