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
 * Extracts latitude and longitude from Google Maps URL if present
 * Supports:
 * - https://www.google.com/maps?q=19.0760,72.8777
 * - https://www.google.com/maps/@19.0760,72.8777,15z
 * - https://maps.google.com/?ll=19.0760,72.8777
 */
export function extractCoordinatesFromGoogleUrl(url) {
  if (!url || typeof url !== 'string') return null;

  try {
    // 1. Matches @19.0760,72.8777
    const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
      return {
        latitude: parseFloat(atMatch[1]),
        longitude: parseFloat(atMatch[2])
      };
    }

    // 2. Matches q=19.0760,72.8777 or query=19.0760,72.8777
    const qMatch = url.match(/[?&](?:q|query|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (qMatch) {
      return {
        latitude: parseFloat(qMatch[1]),
        longitude: parseFloat(qMatch[2])
      };
    }

    // 3. Matches !3d19.0760!4d72.8777 (Google Maps Place data embed)
    const placeMatch = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (placeMatch) {
      return {
        latitude: parseFloat(placeMatch[1]),
        longitude: parseFloat(placeMatch[2])
      };
    }
  } catch (e) {
    console.warn('Coordinates extraction failed for url:', url, e);
  }

  return null;
}

/**
 * Known default coordinates database for prominent areas & clusters
 * Used when a store's exact GPS isn't manually pinned yet.
 */
export const KNOWN_ZONE_COORDINATES = {
  // Navi Mumbai
  'NAVI MUMBAI - KAMOTHE': { lat: 19.0186, lon: 73.0934, zone: 'Navi Mumbai' },
  'KAMOTHE': { lat: 19.0186, lon: 73.0934, zone: 'Navi Mumbai' },
  'KHARGHAR': { lat: 19.0434, lon: 73.0691, zone: 'Navi Mumbai' },
  'BELAPUR': { lat: 19.0188, lon: 73.0396, zone: 'Navi Mumbai' },
  'PANVEL': { lat: 18.9894, lon: 73.1175, zone: 'Navi Mumbai' },
  'NEW PANVEL': { lat: 18.9950, lon: 73.1250, zone: 'Navi Mumbai' },
  'ULWE': { lat: 18.9740, lon: 73.0230, zone: 'Navi Mumbai' },
  'ULWE WAHAL': { lat: 18.9680, lon: 73.0310, zone: 'Navi Mumbai' },
  'BAMANDONGRI': { lat: 18.9620, lon: 73.0260, zone: 'Navi Mumbai' },
  'SEAWOODS': { lat: 19.0205, lon: 73.0185, zone: 'Navi Mumbai' },
  'NERUL': { lat: 19.0330, lon: 73.0150, zone: 'Navi Mumbai' },
  'VASHI': { lat: 19.0771, lon: 72.9986, zone: 'Navi Mumbai' },
  'KOPAR KHAIRANE': { lat: 19.1026, lon: 73.0031, zone: 'Navi Mumbai' },
  'GHANSOLI': { lat: 19.1245, lon: 73.0012, zone: 'Navi Mumbai' },
  'AIROLI': { lat: 19.1579, lon: 72.9935, zone: 'Navi Mumbai' },
  'TURBHE': { lat: 19.0650, lon: 73.0200, zone: 'Navi Mumbai' },

  // Thane & Suburbs
  'THANE': { lat: 19.2183, lon: 72.9781, zone: 'Thane' },
  'NAUPADA': { lat: 19.1920, lon: 72.9720, zone: 'Thane' },
  'PANCHPAKHADI': { lat: 19.1950, lon: 72.9680, zone: 'Thane' },
  'GHODBUNDER': { lat: 19.2680, lon: 72.9550, zone: 'Thane' },
  'MAJIEWADA': { lat: 19.2120, lon: 72.9860, zone: 'Thane' },
  'KALYAN': { lat: 19.2403, lon: 73.1305, zone: 'Thane' },
  'CHIKANGHAR': { lat: 19.2470, lon: 73.1250, zone: 'Thane' },
  'DOMBIVLI': { lat: 19.2184, lon: 73.0867, zone: 'Thane' },
  'MUMBRA': { lat: 19.1850, lon: 73.0220, zone: 'Thane' },

  // Mumbai
  'MUMBAI': { lat: 19.0760, lon: 72.8777, zone: 'Mumbai' },
  'ANDHERI': { lat: 19.1136, lon: 72.8697, zone: 'Mumbai' },
  'SAKET': { lat: 28.5244, lon: 77.2167, zone: 'Delhi NCR' },
  'BANDRA': { lat: 19.0596, lon: 72.8295, zone: 'Mumbai' },
  'KURLA': { lat: 19.0726, lon: 72.8845, zone: 'Mumbai' },
  'GHATKOPAR': { lat: 19.0860, lon: 72.9090, zone: 'Mumbai' },
  'SUBHASH NAGAR': { lat: 19.0520, lon: 72.8950, zone: 'Mumbai' },
  'CHEMBUR': { lat: 19.0622, lon: 72.9000, zone: 'Mumbai' },
  'POWAI': { lat: 19.1176, lon: 72.9060, zone: 'Mumbai' },
  'MALAD': { lat: 19.1860, lon: 72.8485, zone: 'Mumbai' },
  'BORIVALI': { lat: 19.2307, lon: 72.8567, zone: 'Mumbai' },

  // Pune
  'PUNE': { lat: 18.5204, lon: 73.8567, zone: 'Pune' },
  'WAKAD': { lat: 18.5987, lon: 73.7684, zone: 'Pune' },
  'HINJAWADI': { lat: 18.5913, lon: 73.7389, zone: 'Pune' },
  'BANER': { lat: 18.5590, lon: 73.7868, zone: 'Pune' },
  'KOTHURD': { lat: 18.5074, lon: 73.8077, zone: 'Pune' },
  'HADAPSAR': { lat: 18.5089, lon: 73.9259, zone: 'Pune' },
  'VIMAN NAGAR': { lat: 18.5679, lon: 73.9143, zone: 'Pune' }
};

/**
 * Guesses or resolves latitude and longitude for a store
 * Priority:
 * 1. Explicit store.latitude & store.longitude
 * 2. Extracted from store.googleMapsUrl
 * 3. Matching text keywords against KNOWN_ZONE_COORDINATES
 * 4. Fallback default based on city (Mumbai / Pune / Delhi)
 */
export function resolveStoreCoordinates(store) {
  if (!store) return null;

  // 1. Direct explicit coordinates
  if (
    store.latitude !== undefined && store.latitude !== null && !isNaN(Number(store.latitude)) &&
    store.longitude !== undefined && store.longitude !== null && !isNaN(Number(store.longitude))
  ) {
    return {
      latitude: Number(store.latitude),
      longitude: Number(store.longitude),
      source: 'exact'
    };
  }

  // 2. Extract from Google Maps URL
  if (store.googleMapsUrl) {
    const coords = extractCoordinatesFromGoogleUrl(store.googleMapsUrl);
    if (coords) {
      return {
        ...coords,
        source: 'google_url'
      };
    }
  }

  // 3. Keyword matching against known zones
  const searchStr = `${store.storeName || ''} ${store.address || ''} ${store.city || ''} ${store.zone || ''}`.toUpperCase();
  for (const [key, val] of Object.entries(KNOWN_ZONE_COORDINATES)) {
    if (searchStr.includes(key)) {
      // Deterministic slight offset based on storeCode to avoid perfectly overlapping pins
      const hash = (store.storeCode || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const jitterLat = ((hash % 17) - 8) * 0.0015;
      const jitterLon = (((hash * 3) % 17) - 8) * 0.0015;

      return {
        latitude: Math.round((val.lat + jitterLat) * 10000) / 10000,
        longitude: Math.round((val.lon + jitterLon) * 10000) / 10000,
        source: 'cluster_approx',
        zone: val.zone
      };
    }
  }

  // 4. City-level default with jitter
  const city = (store.city || '').toLowerCase();
  let baseLat = 19.0760;
  let baseLon = 72.8777;

  if (city.includes('pune')) {
    baseLat = 18.5204;
    baseLon = 73.8567;
  } else if (city.includes('delhi') || city.includes('gurgaon') || city.includes('noida')) {
    baseLat = 28.5355;
    baseLon = 77.2000;
  }

  const hash = (store.storeCode || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
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

  return allStores
    .filter(st => {
      const c = (st.storeCode || st.code || '').trim().toUpperCase();
      return c && c !== originCode;
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
    .filter(item => item.distanceKm !== null)
    .sort((a, b) => (a.distanceKm || 9999) - (b.distanceKm || 9999));
}
