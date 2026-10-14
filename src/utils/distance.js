/**
 * Distance, Geocoding & Proximity Matrix Engine
 * Uses the Haversine formula to calculate accurate great-circle distances
 * between dark stores on Earth.
 */

// Earth radius in kilometers
const EARTH_RADIUS_KM = 6371;

/**
 * Haversine distance between two coordinates in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (
    lat1 === undefined || lat1 === null || isNaN(Number(lat1)) ||
    lon1 === undefined || lon1 === null || isNaN(Number(lon1)) ||
    lat2 === undefined || lat2 === null || isNaN(Number(lat2)) ||
    lon2 === undefined || lon2 === null || isNaN(Number(lon2))
  ) {
    return null;
  }

  const nLat1 = Number(lat1);
  const nLon1 = Number(lon1);
  const nLat2 = Number(lat2);
  const nLon2 = Number(lon2);

  const toRad = (angle) => (angle * Math.PI) / 180;

  const dLat = toRad(nLat2 - nLat1);
  const dLon = toRad(nLon2 - nLon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(nLat1)) *
      Math.cos(toRad(nLat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place (e.g. 3.4 km)
}

/**
 * Estimates city night-driving time based on distance
 * Uses realistic city night traffic speed (~25 km/h + 2 min buffer)
 */
export function estimateDrivingTime(distanceKm) {
  if (!distanceKm || distanceKm <= 0) return { minutes: 0, text: 'At location' };
  
  // ~25 km/h city average -> ~2.4 mins per km
  const minutes = Math.max(3, Math.round(distanceKm * 2.4));
  
  if (minutes < 60) {
    return { minutes, text: `${minutes} min driving` };
  }
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return { minutes, text: `${hrs}h ${mins}m driving` };
}

/**
 * Extracts latitude and longitude from Google Maps URL or raw coordinate strings
 * Supports:
 * - Raw: "19.0760, 72.8777" or "19.0760,72.8777"
 * - https://www.google.com/maps?q=19.0760,72.8777
 * - https://www.google.com/maps/@19.0760,72.8777,15z
 * - https://maps.google.com/?ll=19.0760,72.8777
 * - Embed & Place: !3d19.0760!4d72.8777
 * - Directions: daddr=19.0760,72.8777 or destination=19.0760,72.8777
 */
export function extractCoordinatesFromGoogleUrl(url) {
  if (!url || typeof url !== 'string') return null;

  try {
    const decoded = decodeURIComponent(url).trim();

    // 1. Raw coordinates entered directly: "19.0760, 72.8777" or "19.0760,72.8777"
    const rawMatch = decoded.match(/^(-?\d{1,3}\.\d+)[,\s]+(-?\d{1,3}\.\d+)$/);
    if (rawMatch) {
      const lat = parseFloat(rawMatch[1]);
      const lon = parseFloat(rawMatch[2]);
      if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        return { latitude: lat, longitude: lon };
      }
    }

    // 2. Matches @19.0760,72.8777
    const atMatch = decoded.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
      return {
        latitude: parseFloat(atMatch[1]),
        longitude: parseFloat(atMatch[2])
      };
    }

    // 3. Matches !3d19.0760!4d72.8777 (Google Maps Place data embed or redirect)
    const placeMatch = decoded.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (placeMatch) {
      return {
        latitude: parseFloat(placeMatch[1]),
        longitude: parseFloat(placeMatch[2])
      };
    }

    // 4. Matches q=19.0760,72.8777, query=..., ll=..., daddr=..., saddr=..., destination=...
    const qMatch = decoded.match(/[?&](?:q|query|ll|daddr|saddr|destination)=(-?\d+\.\d+),(-?\d+\.\d+)/i);
    if (qMatch) {
      return {
        latitude: parseFloat(qMatch[1]),
        longitude: parseFloat(qMatch[2])
      };
    }

    // 5. Degree Minute Second format: e.g. 19°01'07.0"N 73°05'36.2"E
    const dmsMatch = decoded.match(/(\d+)°(\d+)'([\d.]+)"([NSEW])[,\s]+(\d+)°(\d+)'([\d.]+)"([NSEW])/i);
    if (dmsMatch) {
      const latDeg = parseFloat(dmsMatch[1]) + parseFloat(dmsMatch[2]) / 60 + parseFloat(dmsMatch[3]) / 3600;
      const lat = dmsMatch[4].toUpperCase() === 'S' ? -latDeg : latDeg;
      const lonDeg = parseFloat(dmsMatch[5]) + parseFloat(dmsMatch[6]) / 60 + parseFloat(dmsMatch[7]) / 3600;
      const lon = dmsMatch[8].toUpperCase() === 'W' ? -lonDeg : lonDeg;
      return { latitude: Math.round(lat * 1000000) / 1000000, longitude: Math.round(lon * 1000000) / 1000000 };
    }
  } catch (e) {
    console.warn('Coordinates extraction failed for url:', url, e);
  }

  return null;
}

/**
 * Asynchronously resolves any Google Maps link (including short links like maps.app.goo.gl)
 * and extracts verified latitude and longitude.
 */
export async function resolveAndExtractGoogleCoordinates(url) {
  if (!url || typeof url !== 'string') return null;

  // 1. Instant client-side check
  const direct = extractCoordinatesFromGoogleUrl(url);
  if (direct) return direct;

  // 2. Short link resolution (maps.app.goo.gl or goo.gl/maps)
  const trimmed = url.trim();
  if (trimmed.includes('maps.app.goo.gl') || trimmed.includes('goo.gl/maps')) {
    try {
      // First try unshorten.me service
      const res = await fetch(`https://unshorten.me/json/${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.resolved_url) {
          const coords = extractCoordinatesFromGoogleUrl(data.resolved_url);
          if (coords) return coords;
        }
      }
    } catch (e) {
      console.warn('Short link unshortener fallback notice:', e);
    }
  }

  return null;
}

/**
 * Known default coordinates database for prominent areas & clusters
 * Used when a store's exact GPS isn't manually pinned yet.
 */
/**
 * Exact verified GPS coordinates for all registered Blinkit Dark Stores
 * Indexed by Store Code and City Disambiguation
 */
export const EXACT_STORE_COORDINATES = {
  // Navi Mumbai Clusters
  'ES76':  { lat: 19.0186, lon: 73.0934, zone: 'Navi Mumbai - Kamothe (Ashish)' },
  'ES272': { lat: 19.0220, lon: 73.0880, zone: 'Navi Mumbai - Kamothe' },
  'ES156': { lat: 19.0270, lon: 73.1060, zone: 'Navi Mumbai - Kalamboli' },
  'ES168': { lat: 19.0560, lon: 73.1090, zone: 'Navi Mumbai - Taloja Phase 2' },
  'ES139': { lat: 19.0340, lon: 73.0690, zone: 'Navi Mumbai - Kharghar Sec 7' },
  'ES154': { lat: 19.0550, lon: 73.0780, zone: 'Navi Mumbai - Kharghar Sec 35' },
  'ES55':  { lat: 18.9890, lon: 73.1180, zone: 'Navi Mumbai - Panvel' },
  'ES300': { lat: 18.9950, lon: 73.1250, zone: 'Navi Mumbai - New Panvel' },
  'ES81':  { lat: 19.0145, lon: 73.0385, zone: 'Navi Mumbai - Belapur CBD' },
  'ES30':  { lat: 19.0175, lon: 73.0185, zone: 'Navi Mumbai - Seawoods' },
  'ES82':  { lat: 19.0330, lon: 73.0150, zone: 'Navi Mumbai - Nerul' },
  'ES174': { lat: 19.0620, lon: 73.0120, zone: 'Navi Mumbai - Sanpada' },
  'ES49':  { lat: 19.1050, lon: 73.0030, zone: 'Navi Mumbai - Koparkhairane Sec 19' },
  'ES238': { lat: 19.0980, lon: 73.0080, zone: 'Navi Mumbai - Koparkhairane Sec 13' },
  'ES150': { lat: 19.1245, lon: 73.0012, zone: 'Navi Mumbai - Ghansoli' },
  'ES80':  { lat: 19.1550, lon: 72.9960, zone: 'Navi Mumbai - Airoli Sec 10' },
  'ES308': { lat: 19.1590, lon: 72.9920, zone: 'Navi Mumbai - Airoli Sec 1' },
  'ES198': { lat: 19.1760, lon: 72.9970, zone: 'Navi Mumbai - Digha / TTC' },
  'ES87':  { lat: 18.9740, lon: 73.0230, zone: 'Navi Mumbai - Ulwe Sec 17' },
  'ES151': { lat: 18.9680, lon: 73.0310, zone: 'Navi Mumbai - Ulwe Wahal' },
  'ES265': { lat: 18.9620, lon: 73.0260, zone: 'Navi Mumbai - Bamandongri' },

  // Thane Clusters
  'ES171': { lat: 19.1925, lon: 72.9722, zone: 'Thane - Naupada / Panchpakhadi' },
  'ES137': { lat: 19.2140, lon: 72.9860, zone: 'Thane - Majiwada' },
  'ES131': { lat: 19.2370, lon: 72.9770, zone: 'Thane - Manpada' },
  'ES149': { lat: 19.2470, lon: 73.1250, zone: 'Thane - Kalyan Chikanghar' },

  // Mumbai Clusters
  'ES108': { lat: 19.1706, lon: 72.9426, zone: 'Mumbai - Mulund West' },
  'ES96':  { lat: 19.0622, lon: 72.8970, zone: 'Mumbai - Chembur West' },
  'ES273': { lat: 19.0520, lon: 72.8950, zone: 'Mumbai - Chembur Subhash Nagar' },
  'ES162': { lat: 19.1170, lon: 72.8620, zone: 'Mumbai - Andheri Chakala' },
  'ES318': { lat: 19.1110, lon: 72.8670, zone: 'Mumbai - Andheri JB Nagar' },
  'ES24_MUMBAI': { lat: 19.0726, lon: 72.8845, zone: 'Mumbai - Kurla West' },
  'ES27':  { lat: 19.0220, lon: 72.8680, zone: 'Mumbai - Wadala' },
  'ES2':   { lat: 18.9560, lon: 72.8440, zone: 'Mumbai - Mazgaon' },

  // Pune Clusters
  'ES24_PUNE': { lat: 18.5140, lon: 73.7740, zone: 'Pune - Bavdhan' }
};

/**
 * Known default coordinates database for prominent areas & clusters
 * Sorted by priority to match most specific area first.
 */
export const KNOWN_ZONE_COORDINATES = {
  // Navi Mumbai Sub-areas
  'KAMOTHE': { lat: 19.0186, lon: 73.0934, zone: 'Navi Mumbai' },
  'KALAMBOLI': { lat: 19.0270, lon: 73.1060, zone: 'Navi Mumbai' },
  'TALOJA': { lat: 19.0560, lon: 73.1090, zone: 'Navi Mumbai' },
  'KHARGHAR': { lat: 19.0434, lon: 73.0691, zone: 'Navi Mumbai' },
  'BELAPUR': { lat: 19.0188, lon: 73.0396, zone: 'Navi Mumbai' },
  'NEW PANVEL': { lat: 18.9950, lon: 73.1250, zone: 'Navi Mumbai' },
  'PANVEL': { lat: 18.9894, lon: 73.1175, zone: 'Navi Mumbai' },
  'ULWE WAHAL': { lat: 18.9680, lon: 73.0310, zone: 'Navi Mumbai' },
  'BAMANDONGRI': { lat: 18.9620, lon: 73.0260, zone: 'Navi Mumbai' },
  'ULWE': { lat: 18.9740, lon: 73.0230, zone: 'Navi Mumbai' },
  'SEAWOODS': { lat: 19.0205, lon: 73.0185, zone: 'Navi Mumbai' },
  'NERUL': { lat: 19.0330, lon: 73.0150, zone: 'Navi Mumbai' },
  'SANPADA': { lat: 19.0620, lon: 73.0120, zone: 'Navi Mumbai' },
  'VASHI': { lat: 19.0771, lon: 72.9986, zone: 'Navi Mumbai' },
  'TURBHE': { lat: 19.0650, lon: 73.0200, zone: 'Navi Mumbai' },
  'KOPAR KHAIRANE': { lat: 19.1026, lon: 73.0031, zone: 'Navi Mumbai' },
  'KOPERKHAIRANE': { lat: 19.1026, lon: 73.0031, zone: 'Navi Mumbai' },
  'GHANSOLI': { lat: 19.1245, lon: 73.0012, zone: 'Navi Mumbai' },
  'AIROLI': { lat: 19.1579, lon: 72.9935, zone: 'Navi Mumbai' },
  'DIGHA': { lat: 19.1760, lon: 72.9970, zone: 'Navi Mumbai' },
  'DIGHE': { lat: 19.1760, lon: 72.9970, zone: 'Navi Mumbai' },

  // Thane & Suburbs
  'PANCHPAKHADI': { lat: 19.1950, lon: 72.9680, zone: 'Thane' },
  'NAUPADA': { lat: 19.1920, lon: 72.9720, zone: 'Thane' },
  'MAJIWADA': { lat: 19.2140, lon: 72.9860, zone: 'Thane' },
  'MANPADA': { lat: 19.2370, lon: 72.9770, zone: 'Thane' },
  'GHODBUNDER': { lat: 19.2680, lon: 72.9550, zone: 'Thane' },
  'CHIKANGHAR': { lat: 19.2470, lon: 73.1250, zone: 'Thane' },
  'KALYAN': { lat: 19.2403, lon: 73.1305, zone: 'Thane' },
  'DOMBIVLI': { lat: 19.2184, lon: 73.0867, zone: 'Thane' },
  'MUMBRA': { lat: 19.1850, lon: 73.0220, zone: 'Thane' },
  'THANE': { lat: 19.2183, lon: 72.9781, zone: 'Thane' },

  // Mumbai & Suburbs
  'MULUND': { lat: 19.1706, lon: 72.9426, zone: 'Mumbai' },
  'CHAKALA': { lat: 19.1170, lon: 72.8620, zone: 'Mumbai' },
  'JB NAGAR': { lat: 19.1110, lon: 72.8670, zone: 'Mumbai' },
  'ANDHERI': { lat: 19.1136, lon: 72.8697, zone: 'Mumbai' },
  'SUBHASH NAGAR': { lat: 19.0520, lon: 72.8950, zone: 'Mumbai' },
  'CHEMBUR': { lat: 19.0622, lon: 72.9000, zone: 'Mumbai' },
  'KURLA': { lat: 19.0726, lon: 72.8845, zone: 'Mumbai' },
  'GHATKOPAR': { lat: 19.0860, lon: 72.9090, zone: 'Mumbai' },
  'POWAI': { lat: 19.1176, lon: 72.9060, zone: 'Mumbai' },
  'WADALA': { lat: 19.0220, lon: 72.8680, zone: 'Mumbai' },
  'MAZGAON': { lat: 18.9560, lon: 72.8440, zone: 'Mumbai' },
  'BANDRA': { lat: 19.0596, lon: 72.8295, zone: 'Mumbai' },
  'MALAD': { lat: 19.1860, lon: 72.8485, zone: 'Mumbai' },
  'BORIVALI': { lat: 19.2307, lon: 72.8567, zone: 'Mumbai' },
  'MUMBAI': { lat: 19.0760, lon: 72.8777, zone: 'Mumbai' },

  // Pune
  'BAVDHAN': { lat: 18.5140, lon: 73.7740, zone: 'Pune' },
  'WAKAD': { lat: 18.5987, lon: 73.7684, zone: 'Pune' },
  'HINJAWADI': { lat: 18.5913, lon: 73.7389, zone: 'Pune' },
  'BANER': { lat: 18.5590, lon: 73.7868, zone: 'Pune' },
  'KOTHURD': { lat: 18.5074, lon: 73.8077, zone: 'Pune' },
  'HADAPSAR': { lat: 18.5089, lon: 73.9259, zone: 'Pune' },
  'VIMAN NAGAR': { lat: 18.5679, lon: 73.9143, zone: 'Pune' },
  'PUNE': { lat: 18.5204, lon: 73.8567, zone: 'Pune' },

  // Delhi NCR
  'SAKET': { lat: 28.5244, lon: 77.2167, zone: 'Delhi NCR' }
};

/**
 * Guesses or resolves latitude and longitude for a store
 * Priority:
 * 1. Verified EXACT_STORE_COORDINATES dictionary by Store Code
 * 2. Explicit store.latitude & store.longitude (numeric & non-zero)
 * 3. Extracted from store.googleMapsUrl
 * 4. Specific zone keyword matching (ordered from longest to shortest)
 * 5. Fallback default based on city (Mumbai / Pune / Delhi)
 */
export function resolveStoreCoordinates(store) {
  if (!store) return null;

  const rawCode = (store.storeCode || store.code || '').trim().toUpperCase();
  const city = (store.city || '').toLowerCase();

  // 1. Direct match in exact coordinates dictionary
  if (rawCode) {
    if (rawCode === 'ES24') {
      const isPune = city.includes('pune') || (store.storeName || '').toLowerCase().includes('pune');
      const exact = isPune ? EXACT_STORE_COORDINATES['ES24_PUNE'] : EXACT_STORE_COORDINATES['ES24_MUMBAI'];
      if (exact) {
        return { latitude: exact.lat, longitude: exact.lon, source: 'exact_code', zone: exact.zone };
      }
    } else if (EXACT_STORE_COORDINATES[rawCode]) {
      const exact = EXACT_STORE_COORDINATES[rawCode];
      return { latitude: exact.lat, longitude: exact.lon, source: 'exact_code', zone: exact.zone };
    }
  }

  // 2. Direct explicit coordinates on object (must be valid non-zero numbers)
  const numLat = store.latitude !== undefined && store.latitude !== null && store.latitude !== '' ? Number(store.latitude) : NaN;
  const numLon = store.longitude !== undefined && store.longitude !== null && store.longitude !== '' ? Number(store.longitude) : NaN;
  if (!isNaN(numLat) && !isNaN(numLon) && numLat !== 0 && numLon !== 0 && numLat > 8 && numLat < 38) {
    return {
      latitude: numLat,
      longitude: numLon,
      source: 'exact'
    };
  }

  // 3. Extract from Google Maps URL
  if (store.googleMapsUrl) {
    const coords = extractCoordinatesFromGoogleUrl(store.googleMapsUrl);
    if (coords && coords.latitude && coords.longitude) {
      return {
        ...coords,
        source: 'google_url'
      };
    }
  }

  // 4. Keyword matching against known zones (longest keys first to avoid generic match shadowing)
  const searchStr = `${store.storeName || ''} ${store.address || ''} ${store.city || ''} ${store.zone || ''}`.toUpperCase();
  const sortedZoneKeys = Object.keys(KNOWN_ZONE_COORDINATES).sort((a, b) => b.length - a.length);

  for (const key of sortedZoneKeys) {
    if (searchStr.includes(key)) {
      const val = KNOWN_ZONE_COORDINATES[key];
      // Deterministic slight offset based on storeCode to avoid perfectly overlapping pins
      const hash = rawCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const jitterLat = ((hash % 17) - 8) * 0.0012;
      const jitterLon = (((hash * 3) % 17) - 8) * 0.0012;

      return {
        latitude: Math.round((val.lat + jitterLat) * 10000) / 10000,
        longitude: Math.round((val.lon + jitterLon) * 10000) / 10000,
        source: 'cluster_approx',
        zone: val.zone
      };
    }
  }

  // 5. City-level default with jitter
  let baseLat = 19.0760;
  let baseLon = 72.8777;

  if (city.includes('pune')) {
    baseLat = 18.5204;
    baseLon = 73.8567;
  } else if (city.includes('delhi') || city.includes('gurgaon') || city.includes('noida')) {
    baseLat = 28.5355;
    baseLon = 77.2000;
  }

  const hash = rawCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const jitterLat = ((hash % 31) - 15) * 0.003;
  const jitterLon = (((hash * 7) % 31) - 15) * 0.003;

  return {
    latitude: Math.round((baseLat + jitterLat) * 10000) / 10000,
    longitude: Math.round((baseLon + jitterLon) * 10000) / 10000,
    source: 'city_fallback'
  };
}

/**
 * Calculates cleaning cycle status for a store
 * Returns 'overdue' (🔴), 'dueSoon' (🟡), or 'cleaned' (🟢)
 */
export function getStoreCleaningStatus(store, cleanings = []) {
  if (!store) return { status: 'overdue', daysDiff: -999, label: 'No Data' };

  const storeCode = (store.storeCode || store.code || '').trim().toUpperCase();
  const relevantCleanings = cleanings
    .filter(c => (c.storeCode || '').trim().toUpperCase() === storeCode)
    .sort((a, b) => (b.cleaningDate || '').localeCompare(a.cleaningDate || ''));

  const lastCleaning = relevantCleanings[0];
  const cycleDays = Number(store.nextCleaningCycleDays) || 30;

  if (!lastCleaning || !lastCleaning.cleaningDate) {
    return {
      status: 'overdue',
      daysDiff: -999,
      overdueDays: 99,
      lastCleaningDate: null,
      label: 'Never Cleaned'
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cleanDate = new Date(lastCleaning.cleaningDate);
  cleanDate.setHours(0, 0, 0, 0);

  const dueDate = new Date(cleanDate);
  dueDate.setDate(dueDate.getDate() + cycleDays);

  const diffMs = dueDate.getTime() - today.getTime();
  const daysUntilDue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysUntilDue < 0) {
    const overdueDays = Math.abs(daysUntilDue);
    return {
      status: 'overdue',
      daysDiff: daysUntilDue,
      overdueDays,
      lastCleaningDate: lastCleaning.cleaningDate,
      dueDate: dueDate.toISOString().split('T')[0],
      label: `Overdue by ${overdueDays} day${overdueDays > 1 ? 's' : ''}`
    };
  } else if (daysUntilDue <= 7) {
    return {
      status: 'dueSoon',
      daysDiff: daysUntilDue,
      dueInDays: daysUntilDue,
      lastCleaningDate: lastCleaning.cleaningDate,
      dueDate: dueDate.toISOString().split('T')[0],
      label: daysUntilDue === 0 ? 'Due Today' : `Due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`
    };
  } else {
    return {
      status: 'cleaned',
      daysDiff: daysUntilDue,
      daysRemaining: daysUntilDue,
      lastCleaningDate: lastCleaning.cleaningDate,
      dueDate: dueDate.toISOString().split('T')[0],
      label: `Cleaned (${daysUntilDue} days left)`
    };
  }
}

/**
 * Builds a multi-stop Google Maps navigation URL
 * Example: https://www.google.com/maps/dir/lat1,lon1/lat2,lon2/lat3,lon3
 */
export function generateMultiStopGoogleMapsUrl(storesList = []) {
  if (!storesList || storesList.length === 0) return 'https://maps.google.com';

  const waypoints = storesList
    .map(st => {
      const coords = resolveStoreCoordinates(st);
      if (coords && coords.latitude && coords.longitude) {
        return `${coords.latitude},${coords.longitude}`;
      }
      return encodeURIComponent(st.address || st.storeName || st.storeCode);
    })
    .filter(Boolean);

  if (waypoints.length === 1) {
    return `https://www.google.com/maps/search/?api=1&query=${waypoints[0]}`;
  }

  return `https://www.google.com/maps/dir/${waypoints.join('/')}`;
}

/**
 * Calculates distance proximity matrix from a selected origin store to all other stores
 */
export function getNearbyStoresMatrix(originStore, allStores = [], cleanings = []) {
  if (!originStore) return [];

  const originCoords = resolveStoreCoordinates(originStore);
  if (!originCoords) return [];

  const originCode = (originStore.storeCode || originStore.code || '').trim().toUpperCase();
  const originId = originStore.id ? String(originStore.id) : null;
  const originCity = (originStore.city || '').trim().toLowerCase();

  return allStores
    .filter(st => {
      // Exclude exact origin store by ID if available, otherwise by code + city
      if (originId && st.id) {
        return String(st.id) !== originId;
      }
      const c = (st.storeCode || st.code || '').trim().toUpperCase();
      const sCity = (st.city || '').trim().toLowerCase();
      if (c === originCode && (!sCity || !originCity || sCity === originCity)) {
        return false;
      }
      return Boolean(c);
    })
    .map(targetStore => {
      const targetCoords = resolveStoreCoordinates(targetStore);
      const distanceKm = targetCoords
        ? calculateDistance(
            originCoords.latitude,
            originCoords.longitude,
            targetCoords.latitude,
            targetCoords.longitude
          )
        : null;

      const drivingTime = estimateDrivingTime(distanceKm);
      const statusInfo = getStoreCleaningStatus(targetStore, cleanings);

      return {
        ...targetStore,
        coordinates: targetCoords,
        distanceKm,
        drivingTime,
        statusInfo
      };
    })
    .filter(item => item.distanceKm !== null && !isNaN(item.distanceKm))
    .sort((a, b) => (Number(a.distanceKm) || 0) - (Number(b.distanceKm) || 0));
}

/**
 * Builds a direct 1-to-1 Google Maps turn-by-turn navigation URL from origin to destination
 */
export function generateGoogleMapsNavUrl(originStore, targetStore) {
  if (!targetStore) return 'https://maps.google.com';

  const originCoords = resolveStoreCoordinates(originStore);
  const targetCoords = resolveStoreCoordinates(targetStore);

  if (originCoords && targetCoords) {
    return `https://www.google.com/maps/dir/?api=1&origin=${originCoords.latitude},${originCoords.longitude}&destination=${targetCoords.latitude},${targetCoords.longitude}&travelmode=driving`;
  }

  const destQuery = encodeURIComponent(targetStore.address || targetStore.storeName || targetStore.storeCode || '');
  if (originCoords) {
    return `https://www.google.com/maps/dir/?api=1&origin=${originCoords.latitude},${originCoords.longitude}&destination=${destQuery}&travelmode=driving`;
  }

  return targetStore.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${destQuery}`;
}

