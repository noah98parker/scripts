/**
 * City Open Data service — Socrata SODA APIs for NYC, LA, and Chicago.
 * All three cities publish free, public parking meter / sign data.
 * No API key required (low-volume).
 */

// ── City bounding boxes ──────────────────────────────────────────────────────
const CITY_BOUNDS = {
  nyc:     { latMin: 40.477, latMax: 40.917, lonMin: -74.259, lonMax: -73.700 },
  la:      { latMin: 33.703, latMax: 34.337, lonMin: -118.668, lonMax: -118.155 },
  chicago: { latMin: 41.644, latMax: 42.023, lonMin: -87.940,  lonMax: -87.524 },
};

const CITY_NAMES = { nyc: 'New York City', la: 'Los Angeles', chicago: 'Chicago' };

export function detectCity(lat, lon) {
  for (const [city, b] of Object.entries(CITY_BOUNDS)) {
    if (lat >= b.latMin && lat <= b.latMax && lon >= b.lonMin && lon <= b.lonMax) {
      return city;
    }
  }
  return null;
}

export function getCityName(lat, lon) {
  const city = detectCity(lat, lon);
  return city ? CITY_NAMES[city] : null;
}

const HEADERS = {
  'X-App-Token': 'theknowcompany',
  'Accept': 'application/json',
};

// ── NYC — Parking Meters (Muni Meter locations + active times) ───────────────
async function fetchNYC(lat, lon, radiusM) {
  const url = `https://data.cityofnewyork.us/resource/s5n9-7fhf.json?$where=within_circle(location,${lat},${lon},${radiusM})&$limit=30`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) return [];
  const data = await res.json();
  return data.map((m, i) => ({
    id: `nyc_${m.meter_number || i}`,
    name: `NYC Meter — ${m.street || 'Unknown St'}`,
    lat: parseFloat(m.location?.latitude || m.latitude || 0),
    lon: parseFloat(m.location?.longitude || m.longitude || 0),
    meterType: m.meter_type || 'Muni-Meter',
    timeLimit: m.active_time_start && m.active_time_end
      ? `${m.active_time_start}–${m.active_time_end}`
      : 'See meter',
    rate: m.rate || null,
    activeHours: m.active_days || 'Mon–Sat',
    city: 'nyc',
    source: 'city_data',
    tags: m,
  })).filter(m => m.lat && m.lon);
}

// ── LA — Parking Meters ──────────────────────────────────────────────────────
async function fetchLA(lat, lon, radiusM) {
  const url = `https://data.lacity.org/resource/e7h6-4a3e.json?$where=within_circle(location_1,${lat},${lon},${radiusM})&$limit=30`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) return [];
  const data = await res.json();
  return data.map((m, i) => ({
    id: `la_${m.spaceid || i}`,
    name: `LA Meter — ${m.blockface || m.streetblock || 'Unknown St'}`,
    lat: parseFloat(m.location_1?.latitude || m.lat || 0),
    lon: parseFloat(m.location_1?.longitude || m.lon || 0),
    meterType: m.metertype || 'Single',
    timeLimit: m.metered_time_limit_parking_range_effective || m.timelimit || 'See meter',
    rate: m.rate_range || m.currentrate || null,
    activeHours: m.active_days || 'Mon–Sat 8am–6pm',
    city: 'la',
    source: 'city_data',
    tags: m,
  })).filter(m => m.lat && m.lon);
}

// ── Chicago — Parking Meters ─────────────────────────────────────────────────
async function fetchChicago(lat, lon, radiusM) {
  const url = `https://data.cityofchicago.org/resource/wrvz-psew.json?$where=within_circle(location,${lat},${lon},${radiusM})&$limit=30`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) return [];
  const data = await res.json();
  return data.map((m, i) => ({
    id: `chi_${m.meter_id || i}`,
    name: `Chicago Meter — ${m.street_address || 'Unknown St'}`,
    lat: parseFloat(m.location?.latitude || m.latitude || 0),
    lon: parseFloat(m.location?.longitude || m.longitude || 0),
    meterType: m.meter_type || 'Single-space',
    timeLimit: m.active_hours_and_restrictions || 'See meter',
    rate: m.rate_for_first_hour ? `$${m.rate_for_first_hour}/hr` : null,
    activeHours: m.active_days || 'Mon–Sat',
    city: 'chicago',
    source: 'city_data',
    tags: m,
  })).filter(m => m.lat && m.lon);
}

/**
 * Main entry point: auto-detects city and queries the right SODA API.
 * Returns [] if not in a supported city or on any error.
 */
export async function fetchCityParkingData(lat, lon, radiusM = 200) {
  const city = detectCity(lat, lon);
  if (!city) return [];

  try {
    switch (city) {
      case 'nyc':     return await fetchNYC(lat, lon, radiusM);
      case 'la':      return await fetchLA(lat, lon, radiusM);
      case 'chicago': return await fetchChicago(lat, lon, radiusM);
      default:        return [];
    }
  } catch (err) {
    console.warn('City open data fetch error:', err.message);
    return [];
  }
}
