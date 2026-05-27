/**
 * Overpass API service — queries OpenStreetMap for real-world parking & towing data.
 * Free, no API key required.
 */

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

async function runQuery(query) {
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) throw new Error(`Overpass error ${res.status}`);
  return res.json();
}

/**
 * Find parking garages / lots within radius (meters) of coords.
 */
export async function fetchNearbyParking(lat, lon, radiusM = 800) {
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"="parking"]["parking"~"multi-storey|surface|underground|rooftop"](around:${radiusM},${lat},${lon});
      way["amenity"="parking"]["parking"~"multi-storey|surface|underground|rooftop"](around:${radiusM},${lat},${lon});
    );
    out center tags;
  `;
  const data = await runQuery(query);
  return (data.elements || []).map(el => ({
    id: el.id,
    name: el.tags?.name || inferParkingName(el),
    type: el.tags?.parking || 'surface',
    lat: el.lat ?? el.center?.lat,
    lon: el.lon ?? el.center?.lon,
    fee: el.tags?.fee || 'unknown',
    capacity: el.tags?.capacity || null,
    opening_hours: el.tags?.opening_hours || '24/7',
    operator: el.tags?.operator || null,
    maxstay: el.tags?.maxstay || null,
    access: el.tags?.access || 'yes',
    tags: el.tags || {},
  })).filter(p => p.lat && p.lon);
}

function inferParkingName(el) {
  if (el.tags?.operator) return `${el.tags.operator} Parking`;
  const t = el.tags?.parking;
  if (t === 'multi-storey') return 'Parking Garage';
  if (t === 'underground') return 'Underground Parking';
  if (t === 'rooftop') return 'Rooftop Parking';
  return 'Parking Lot';
}

/**
 * Find towing / vehicle_inspection companies near coords.
 */
export async function fetchNearbyTowCompanies(lat, lon, radiusM = 5000) {
  const query = `
    [out:json][timeout:20];
    (
      node["amenity"~"vehicle_inspection|car_repair"]["service:vehicle:towing"="yes"](around:${radiusM},${lat},${lon});
      node["shop"="car_repair"]["service:vehicle:towing"="yes"](around:${radiusM},${lat},${lon});
      node["name"~"[Tt]ow|[Tt]owing|[Rr]ecovery|[Rr]epossess"](around:${radiusM},${lat},${lon});
      way["name"~"[Tt]ow|[Tt]owing|[Rr]ecovery"](around:${radiusM},${lat},${lon});
    );
    out center tags;
  `;
  const data = await runQuery(query);
  return (data.elements || []).map(el => ({
    id: el.id,
    name: el.tags?.name || 'Towing Company',
    lat: el.lat ?? el.center?.lat,
    lon: el.lon ?? el.center?.lon,
    phone: el.tags?.phone || el.tags?.['contact:phone'] || null,
    website: el.tags?.website || el.tags?.['contact:website'] || null,
    opening_hours: el.tags?.opening_hours || '24/7',
    tags: el.tags || {},
  })).filter(p => p.lat && p.lon);
}

/**
 * Query parking restriction nodes/ways near a point.
 * Also fetches amenity=parking areas so tapping on a lot shows lot-specific info.
 */
export async function fetchParkingRestrictions(lat, lon, radiusM = 150) {
  const query = `
    [out:json][timeout:10];
    (
      node["parking:condition"](around:${radiusM},${lat},${lon});
      node["parking"](around:${radiusM},${lat},${lon});
      way["parking:lane:right"](around:${radiusM},${lat},${lon});
      way["parking:lane:left"](around:${radiusM},${lat},${lon});
      way["parking:lane:both"](around:${radiusM},${lat},${lon});
      node["amenity"="parking"](around:100,${lat},${lon});
      way["amenity"="parking"](around:100,${lat},${lon});
    );
    out center tags;
  `;
  const data = await runQuery(query);
  return (data.elements || []).map(el => ({
    id: el.id,
    type: el.type,
    lat: el.lat ?? el.center?.lat,
    lon: el.lon ?? el.center?.lon,
    tags: el.tags || {},
  }));
}

/**
 * Haversine distance in meters.
 */
export function distanceM(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const dphi = (lat2 - lat1) * Math.PI / 180;
  const dlam = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dphi/2)**2 + Math.cos(phi1)*Math.cos(phi2)*Math.sin(dlam/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
