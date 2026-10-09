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

  // Exact city disambiguation: if both specify a city and they differ, they DO NOT match
  const cCity = (cleaning.city || '').trim().toLowerCase();
  const sCity = (store.city || '').trim().toLowerCase();
  if (cCity && sCity && cCity !== sCity) {
    return false;
  }

  // Cross-field text disambiguation (checks city, store name, and address)
  const cText = `${cCity} ${(cleaning.storeName || '')} ${(cleaning.address || '')}`.toLowerCase();
  const sText = `${sCity} ${(store.storeName || store.name || '')} ${(store.address || '')}`.toLowerCase();

  const puneKeywords = ['pune', 'bavdhan', 'kothrud', 'wakad', 'baner', 'hinjewadi', 'vimannagar', 'viman nagar', 'kharadi', 'hadapsar', 'pcmc'];
  const mumbaiKeywords = ['mumbai', 'kurla', 'thane', 'navi mumbai', 'andheri', 'bandra', 'dadar', 'vashi', 'ghatkopar', 'chembur', 'borivali', 'kandivali', 'malad', 'mira road', 'bhayandar', 'panvel', 'kalyan', 'dombivli'];

  const isCPune = puneKeywords.some(kw => cText.includes(kw));
  const isSPune = puneKeywords.some(kw => sText.includes(kw));
  const isCMumbai = mumbaiKeywords.some(kw => cText.includes(kw));
  const isSMumbai = mumbaiKeywords.some(kw => sText.includes(kw));

  if (isCPune && isSMumbai) return false;
  if (isCMumbai && isSPune) return false;

  // Specific locality mismatch (e.g. Bavdhan vs Kurla)
  if (cText.includes('bavdhan') && sText.includes('kurla')) return false;
  if (cText.includes('kurla') && sText.includes('bavdhan')) return false;

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
