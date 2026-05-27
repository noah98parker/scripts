// City Open Data service — Socrata SODA APIs for NYC, LA, and Chicago
// Returns real parking meter and sign locations

const APP_TOKEN = 'theknowcompany';

// ---------------------------------------------------------------------------
// City bounding boxes (approximate)
// ---------------------------------------------------------------------------
const CITY_BOUNDS = {
  nyc: {
    latMin: 40.477,
    latMax: 40.917,
    lonMin: -74.259,
    lonMax: -73.700,
  },
  la: {
    latMin: 33.703,
    latMax: 34.337,
    lonMin: -118.668,
    lonMax: -118.155,
  },
  chicago: {
    latMin: 41.644,
    latMax: 42.023,
    lonMin: -87.940,
    lonMax: -87.524,
  },
};

// ---------------------------------------------------------------------------
// detectCity: returns 'nyc' | 'la' | 'chicago' | null
// ---------------------------------------------------------------------------
export function detectCity(lat, lon) {
  for (const [city, b] of Object.entries(CITY_BOUNDS)) {
    if (lat >= b.latMin && lat <= b.latMax && lon >= b.lonMin && lon <= b.lonMax) {
      return city;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// getCityName: returns human-readable city name or null
// ---------------------------------------------------------------------------
export function getCityName(lat, lon) {
  const city = detectCity(lat, lon);
  const names = {
    nyc: 'New York City',
    la: 'Los Angeles',
    chicago: 'Chicago',
  };
  return city ? names[city] : null;
}

// ---------------------------------------------------------------------------
// SODA API endpoints
// ---------------------------------------------------------------------------
const ENDPOINTS = {
  nyc: 'https://data.cityofnewyork.us/resource/s5n9-7fhf.json',
  la: 'https://data.lacity.org/resource/e7h6-4a3e.json',
  chicago: 'https://data.cityofchicago.org/resource/wrvz-psew.json',
};

// ---------------------------------------------------------------------------
// Common SODA fetch helper
// ---------------------------------------------------------------------------
async function fetchSoda(url, whereClause, limit = 30) {
  const params = new URLSearchParams({
    $where: whereClause,
    $limit: String(limit),
  });

  const fullUrl = `${url}?${params.toString()}`;

  const response = await fetch(fullUrl, {
    headers: {
      'X-App-Token': APP_TOKEN,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`SODA API error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Normalise NYC meter record
// NYC dataset: s5n9-7fhf — Parking Meters
// Fields may include: meterid, metertype, timelimit, rate, hoursofoper, location, lat, lon
// ---------------------------------------------------------------------------
function normaliseNyc(record, index) {
  const lat =
    parseFloat(record.latitude) ||
    parseFloat(record.lat) ||
    parseFloat(record.location?.coordinates?.[1]) ||
    null;
  const lon =
    parseFloat(record.longitude) ||
    parseFloat(record.lon) ||
    parseFloat(record.location?.coordinates?.[0]) ||
    null;

  return {
    id: `nyc_${record.meterid || record.objectid || index}`,
    name: record.street_address || record.streetname || 'NYC Parking Meter',
    lat,
    lon,
    meterType: record.metertype || record.meter_type || 'single',
    timeLimit: record.timelimit || record.time_limit || null,
    rate: record.rate || record.hourlyrate || null,
    activeHours: record.hoursofoper || record.hours_of_oper || null,
    city: 'New York City',
    source: 'city_data',
    raw: record,
  };
}

// ---------------------------------------------------------------------------
// Normalise LA meter record
// LA dataset: e7h6-4a3e — Parking Meter Inventory
// Fields may include: spaceid, metertype, raterange, timelimit, activehours, location_1
// ---------------------------------------------------------------------------
function normaliseLa(record, index) {
  const lat =
    parseFloat(record.latitude) ||
    parseFloat(record.lat) ||
    parseFloat(record.location_1?.coordinates?.[1]) ||
    null;
  const lon =
    parseFloat(record.longitude) ||
    parseFloat(record.lon) ||
    parseFloat(record.location_1?.coordinates?.[0]) ||
    null;

  return {
    id: `la_${record.spaceid || record.meter_id || index}`,
    name: record.blockface || record.street_name || 'LA Parking Meter',
    lat,
    lon,
    meterType: record.metertype || record.meter_type || 'single',
    timeLimit: record.timelimit || record.time_limit || null,
    rate: record.raterange || record.rate_range || null,
    activeHours: record.activehours || record.active_hours || null,
    city: 'Los Angeles',
    source: 'city_data',
    raw: record,
  };
}

// ---------------------------------------------------------------------------
// Normalise Chicago meter record
// Chicago dataset: wrvz-psew — Parking Meters
// Fields may include: meter_id, meter_type, pay_by_space, hourly_rate, hours_of_operation, location
// ---------------------------------------------------------------------------
function normaliseChicago(record, index) {
  const lat =
    parseFloat(record.latitude) ||
    parseFloat(record.lat) ||
    parseFloat(record.location?.coordinates?.[1]) ||
    null;
  const lon =
    parseFloat(record.longitude) ||
    parseFloat(record.lon) ||
    parseFloat(record.location?.coordinates?.[0]) ||
    null;

  return {
    id: `chi_${record.meter_id || record.objectid || index}`,
    name: record.street_dir || record.street_name || 'Chicago Parking Meter',
    lat,
    lon,
    meterType: record.meter_type || 'single',
    timeLimit: record.hour_limit || null,
    rate: record.hourly_rate || record.rate || null,
    activeHours: record.hours_of_operation || record.hours || null,
    city: 'Chicago',
    source: 'city_data',
    raw: record,
  };
}

// ---------------------------------------------------------------------------
// fetchCityParkingData: main export
// Detects city, queries correct SODA endpoint, returns normalised array
// Returns [] on any error or if location is not in a supported city
// ---------------------------------------------------------------------------
export async function fetchCityParkingData(lat, lon, radiusM = 200) {
  const city = detectCity(lat, lon);
  if (!city) return [];

  try {
    let records;
    let normalise;

    switch (city) {
      case 'nyc': {
        const where = `within_circle(location,${lat},${lon},${radiusM})`;
        records = await fetchSoda(ENDPOINTS.nyc, where, 30);
        normalise = normaliseNyc;
        break;
      }
      case 'la': {
        const where = `within_circle(location_1,${lat},${lon},${radiusM})`;
        records = await fetchSoda(ENDPOINTS.la, where, 30);
        normalise = normaliseLa;
        break;
      }
      case 'chicago': {
        const where = `within_circle(location,${lat},${lon},${radiusM})`;
        records = await fetchSoda(ENDPOINTS.chicago, where, 30);
        normalise = normaliseChicago;
        break;
      }
      default:
        return [];
    }

    if (!Array.isArray(records)) return [];

    return records
      .map((record, index) => normalise(record, index))
      .filter((r) => r.lat !== null && r.lon !== null);
  } catch (err) {
    console.warn('[cityOpenData] fetchCityParkingData error:', err.message);
    return [];
  }
}
