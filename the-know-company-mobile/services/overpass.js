// Overpass API service (OpenStreetMap) — React Native compatible (uses global fetch, no DOM)

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// ---------------------------------------------------------------------------
// Haversine distance in metres between two lat/lon pairs
// ---------------------------------------------------------------------------
export function distanceM(lat1, lon1, lat2, lon2) {
  const R = 6_371_000; // Earth radius in metres
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ---------------------------------------------------------------------------
// Helper: derive a human-readable name for a parking element
// ---------------------------------------------------------------------------
function inferParkingName(el) {
  const t = el.tags || {};
  if (t.name) return t.name;
  if (t.operator) return `${t.operator} Parking`;
  const parkingType = t.parking || t.amenity || 'parking';
  const typeLabel =
    parkingType === 'multi-storey'
      ? 'Parking Garage'
      : parkingType === 'underground'
      ? 'Underground Parking'
      : parkingType === 'surface'
      ? 'Surface Lot'
      : parkingType === 'street_side'
      ? 'Street Parking'
      : 'Parking';
  return typeLabel;
}

// ---------------------------------------------------------------------------
// Helper: get lat/lon from an OSM element (node has direct coords; way/relation use centre)
// ---------------------------------------------------------------------------
function getLatLon(el) {
  if (el.type === 'node') {
    return { lat: el.lat, lon: el.lon };
  }
  if (el.center) {
    return { lat: el.center.lat, lon: el.center.lon };
  }
  return { lat: null, lon: null };
}

// ---------------------------------------------------------------------------
// Helper: map an OSM element to a normalised parking object
// ---------------------------------------------------------------------------
function normaliseParking(el) {
  const t = el.tags || {};
  const { lat, lon } = getLatLon(el);
  return {
    id: `osm_${el.type}_${el.id}`,
    name: inferParkingName(el),
    type:
      t.parking ||
      (t.amenity === 'parking_space' ? 'space' : t.amenity) ||
      'parking',
    lat,
    lon,
    fee: t.fee || null,
    capacity: t.capacity ? parseInt(t.capacity, 10) : null,
    opening_hours: t.opening_hours || null,
    operator: t.operator || null,
    maxstay: t.maxstay || null,
    access: t.access || null,
    source: 'overpass',
    tags: t,
  };
}

// ---------------------------------------------------------------------------
// Helper: map an OSM element to a normalised tow company object
// ---------------------------------------------------------------------------
function normaliseTow(el) {
  const t = el.tags || {};
  const { lat, lon } = getLatLon(el);
  return {
    id: `osm_${el.type}_${el.id}`,
    name: t.name || t.operator || 'Tow Company',
    type: t.amenity || t.shop || 'towing',
    lat,
    lon,
    phone: t['contact:phone'] || t.phone || null,
    website: t['contact:website'] || t.website || null,
    opening_hours: t.opening_hours || null,
    operator: t.operator || null,
    source: 'overpass',
    tags: t,
  };
}

// ---------------------------------------------------------------------------
// Helper: run an Overpass QL query and return the elements array
// ---------------------------------------------------------------------------
async function runOverpassQuery(query) {
  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  return json.elements || [];
}

// ---------------------------------------------------------------------------
// Fetch nearby parking facilities within radiusM metres of lat/lon
// Returns array of normalised parking objects sorted by distance
// ---------------------------------------------------------------------------
export async function fetchNearbyParking(lat, lon, radiusM = 800) {
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="parking"](around:${radiusM},${lat},${lon});
      way["amenity"="parking"](around:${radiusM},${lat},${lon});
      relation["amenity"="parking"](around:${radiusM},${lat},${lon});
      node["parking"](around:${radiusM},${lat},${lon});
      way["parking"](around:${radiusM},${lat},${lon});
      node["amenity"="parking_entrance"](around:${radiusM},${lat},${lon});
      node["amenity"="parking_space"](around:${radiusM},${lat},${lon});
    );
    out center tags;
  `;

  try {
    const elements = await runOverpassQuery(query);
    return elements
      .map(normaliseParking)
      .filter((p) => p.lat !== null && p.lon !== null)
      .sort((a, b) => distanceM(lat, lon, a.lat, a.lon) - distanceM(lat, lon, b.lat, b.lon));
  } catch (err) {
    console.warn('[overpass] fetchNearbyParking error:', err.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Fetch nearby tow companies within radiusM metres of lat/lon
// ---------------------------------------------------------------------------
export async function fetchNearbyTowCompanies(lat, lon, radiusM = 5000) {
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="vehicle_inspection"](around:${radiusM},${lat},${lon});
      node["shop"="car_repair"]["towing"="yes"](around:${radiusM},${lat},${lon});
      node["amenity"="car_repair"]["towing"="yes"](around:${radiusM},${lat},${lon});
      node["name"~"tow|towing|impound|recovery",i](around:${radiusM},${lat},${lon});
      way["name"~"tow|towing|impound|recovery",i](around:${radiusM},${lat},${lon});
      node["shop"="towing"](around:${radiusM},${lat},${lon});
      node["amenity"="towing"](around:${radiusM},${lat},${lon});
      node["service"="towing"](around:${radiusM},${lat},${lon});
    );
    out center tags;
  `;

  try {
    const elements = await runOverpassQuery(query);
    return elements
      .map(normaliseTow)
      .filter((t) => t.lat !== null && t.lon !== null)
      .sort((a, b) => distanceM(lat, lon, a.lat, a.lon) - distanceM(lat, lon, b.lat, b.lon));
  } catch (err) {
    console.warn('[overpass] fetchNearbyTowCompanies error:', err.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Fetch parking restriction signs/nodes very close to lat/lon (for rules engine)
// Returns raw elements with tags for use by parkingRules.js
// ---------------------------------------------------------------------------
export async function fetchParkingRestrictions(lat, lon, radiusM = 150) {
  const query = `
    [out:json][timeout:20];
    (
      node["amenity"="parking"](around:${radiusM},${lat},${lon});
      way["amenity"="parking"](around:${radiusM},${lat},${lon});
      node["highway"="street_lamp"](around:${radiusM},${lat},${lon});
      node["parking:condition"](around:${radiusM},${lat},${lon});
      node["parking:lane"](around:${radiusM},${lat},${lon});
      way["parking:lane:left"](around:${radiusM},${lat},${lon});
      way["parking:lane:right"](around:${radiusM},${lat},${lon});
      way["parking:lane:both"](around:${radiusM},${lat},${lon});
      node["restriction"](around:${radiusM},${lat},${lon});
      node["no_parking"](around:${radiusM},${lat},${lon});
      node["amenity"="parking_meter"](around:${radiusM},${lat},${lon});
      way["highway"](around:${radiusM},${lat},${lon});
    );
    out center tags;
  `;

  try {
    const elements = await runOverpassQuery(query);
    return elements.map((el) => ({
      ...el,
      ...(el.center ? { lat: el.center.lat, lon: el.center.lon } : {}),
    }));
  } catch (err) {
    console.warn('[overpass] fetchParkingRestrictions error:', err.message);
    return [];
  }
}
