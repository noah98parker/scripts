/**
 * Parking Rules Engine
 *
 * Combines OSM restriction data with a curated database of US state/city laws
 * to produce a human-readable parking verdict for the user's current position.
 */

// ─── US State parking law summaries ─────────────────────────────────────────
export const STATE_LAWS = {
  AL: { name: 'Alabama', streetCleaning: false, permitZones: true, overnight: 'Varies by city', towWarning: '24h notice required in most municipalities', notes: 'No statewide street-sweeping law. Cities may post their own rules.' },
  AK: { name: 'Alaska', streetCleaning: false, permitZones: false, overnight: 'Generally allowed unless posted', towWarning: 'Immediate tow allowed in no-parking zones', notes: 'Cold-weather parking restrictions active Oct–Apr in Anchorage.' },
  AZ: { name: 'Arizona', streetCleaning: false, permitZones: true, overnight: 'Allowed unless posted', towWarning: 'Immediate tow in fire lanes; 1h notice elsewhere', notes: 'Phoenix enforces 72h limit on street parking.' },
  AR: { name: 'Arkansas', streetCleaning: false, permitZones: false, overnight: 'Generally allowed', towWarning: '24h notice required', notes: 'Little Rock enforces 72h continuous parking limit.' },
  CA: { name: 'California', streetCleaning: true, permitZones: true, overnight: 'Restricted in many cities', towWarning: 'Immediate tow in street-cleaning windows; 72h rule statewide', notes: 'CVC 22651(k): vehicles may be towed after 72h on public street. Street cleaning strictly enforced Mon–Sat in LA & SF.' },
  CO: { name: 'Colorado', streetCleaning: false, permitZones: true, overnight: 'Generally allowed unless posted', towWarning: '1h grace in time-limit zones; immediate in fire lanes', notes: 'Denver snow-emergency routes activate when 2"+ snow falls.' },
  CT: { name: 'Connecticut', streetCleaning: true, permitZones: true, overnight: 'Restricted in Hartford, New Haven', towWarning: '24h notice required outside of fire/emergency zones', notes: 'Winter parking bans Nov 15–Mar 15 in many towns.' },
  DE: { name: 'Delaware', streetCleaning: false, permitZones: true, overnight: 'Generally allowed', towWarning: 'Immediate tow in fire lanes', notes: 'Wilmington enforces residential permit zones.' },
  FL: { name: 'Florida', streetCleaning: false, permitZones: true, overnight: 'Beach parking often restricted sunset–sunrise', towWarning: 'Immediate tow in private lots; 24h notice on public streets', notes: 'Miami Beach: no overnight beach parking. Orlando: 2h limit in downtown.' },
  GA: { name: 'Georgia', streetCleaning: false, permitZones: true, overnight: 'Generally allowed unless posted', towWarning: '24h notice on public streets; immediate on private', notes: 'Atlanta enforces 2h parking in business districts 8am–6pm.' },
  HI: { name: 'Hawaii', streetCleaning: true, permitZones: true, overnight: 'Restricted near beaches', towWarning: 'Immediate tow in no-parking/cleaning zones', notes: 'Honolulu: alternate-side parking for street cleaning Mon–Fri.' },
  ID: { name: 'Idaho', streetCleaning: false, permitZones: false, overnight: 'Generally allowed', towWarning: '24h notice required', notes: 'Boise: 72h limit on residential streets.' },
  IL: { name: 'Illinois', streetCleaning: true, permitZones: true, overnight: 'Restricted Dec–Mar in Chicago (snow routes)', towWarning: 'Immediate tow during snow/cleaning events; $150–$500 fee', notes: 'Chicago: alternate-side parking strictly enforced. City sticker required.' },
  IN: { name: 'Indiana', streetCleaning: false, permitZones: true, overnight: 'Generally allowed', towWarning: '24h notice on public streets', notes: 'Indianapolis: 72h continuous parking limit.' },
  IA: { name: 'Iowa', streetCleaning: false, permitZones: false, overnight: 'Generally allowed', towWarning: '24h notice required', notes: 'Des Moines: 48h limit on residential streets.' },
  KS: { name: 'Kansas', streetCleaning: false, permitZones: false, overnight: 'Generally allowed', towWarning: '24h notice required', notes: 'Wichita enforces 72h continuous limit.' },
  KY: { name: 'Kentucky', streetCleaning: false, permitZones: true, overnight: 'Generally allowed', towWarning: '24h notice on public streets', notes: 'Louisville: downtown 2h limits 8am–6pm Mon–Sat.' },
  LA: { name: 'Louisiana', streetCleaning: true, permitZones: true, overnight: 'Allowed unless posted', towWarning: 'Immediate tow during Mardi Gras events and street cleaning', notes: 'New Orleans: frequent special event parking bans. Parade routes cleared 2h before.' },
  ME: { name: 'Maine', streetCleaning: false, permitZones: true, overnight: 'Restricted Nov–Apr in Portland (snow emergency)', towWarning: 'Immediate tow during snow emergencies', notes: 'Portland: winter parking ban 1am–7am Nov 1–Apr 15.' },
  MD: { name: 'Maryland', streetCleaning: true, permitZones: true, overnight: 'Restricted in Baltimore (snow/cleaning)', towWarning: 'Immediate tow in cleaning/emergency zones', notes: 'Baltimore: alternate-side parking; permit zones citywide.' },
  MA: { name: 'Massachusetts', streetCleaning: true, permitZones: true, overnight: 'Restricted 1am–6am in Boston without permit', towWarning: 'Immediate tow in cleaning windows; $100+ ticket + tow fee', notes: 'Boston: overnight ban without resident sticker. Aggressive enforcement.' },
  MI: { name: 'Michigan', streetCleaning: false, permitZones: true, overnight: 'Restricted Nov–Apr in Detroit (snow routes)', towWarning: 'Immediate tow on snow routes during events', notes: 'Detroit: 36h parking limit on streets.' },
  MN: { name: 'Minnesota', streetCleaning: true, permitZones: true, overnight: 'Restricted Nov–Apr in Minneapolis', towWarning: 'Immediate tow during snow emergencies', notes: 'Minneapolis: snow emergency declared after 3"+ snowfall; vehicles towed within 1h of declaration.' },
  MS: { name: 'Mississippi', streetCleaning: false, permitZones: false, overnight: 'Generally allowed', towWarning: '24h notice required', notes: 'Jackson: 72h street parking limit.' },
  MO: { name: 'Missouri', streetCleaning: false, permitZones: true, overnight: 'Generally allowed', towWarning: '24h notice on public streets', notes: 'St. Louis: downtown 2h limit. Kansas City: permit zones expanding.' },
  MT: { name: 'Montana', streetCleaning: false, permitZones: false, overnight: 'Generally allowed', towWarning: '24h notice required', notes: 'Billings/Missoula: 72h continuous limit.' },
  NE: { name: 'Nebraska', streetCleaning: false, permitZones: false, overnight: 'Generally allowed', towWarning: '24h notice required', notes: 'Omaha: 72h street parking limit.' },
  NV: { name: 'Nevada', streetCleaning: false, permitZones: true, overnight: 'Allowed unless posted', towWarning: 'Immediate tow in fire lanes; 24h elsewhere', notes: 'Las Vegas Strip: no street parking. Reno: 72h limit.' },
  NH: { name: 'New Hampshire', streetCleaning: false, permitZones: true, overnight: 'Restricted Nov–Apr in Manchester', towWarning: 'Immediate tow during snow emergencies', notes: 'Manchester: no overnight parking Nov–Mar without permit.' },
  NJ: { name: 'New Jersey', streetCleaning: true, permitZones: true, overnight: 'Allowed unless posted', towWarning: 'Immediate tow in cleaning zones; $100–$300 fine', notes: 'Newark/Jersey City: strict alternate-side parking. NJ Turnpike lots: 24h max.' },
  NM: { name: 'New Mexico', streetCleaning: false, permitZones: false, overnight: 'Generally allowed', towWarning: '24h notice required', notes: 'Albuquerque: 72h limit on public streets.' },
  NY: { name: 'New York', streetCleaning: true, permitZones: true, overnight: 'Allowed but alternate-side rules apply', towWarning: 'Immediate tow in cleaning windows; $65+ fine + $185 tow fee', notes: 'NYC: alternate-side parking 1–3x/week per block. Suspended holidays only. Hydrant: 15ft rule.' },
  NC: { name: 'North Carolina', streetCleaning: false, permitZones: true, overnight: 'Generally allowed', towWarning: '24h notice on public streets', notes: 'Charlotte: downtown 2h limit. Raleigh: 72h continuous limit.' },
  ND: { name: 'North Dakota', streetCleaning: false, permitZones: false, overnight: 'Generally allowed', towWarning: '24h notice required', notes: 'Fargo: snow routes enforced Oct–Mar.' },
  OH: { name: 'Ohio', streetCleaning: false, permitZones: true, overnight: 'Allowed unless posted', towWarning: '24h notice on public streets', notes: 'Columbus: 2h limit in metered zones. Cleveland: snow emergency routes.' },
  OK: { name: 'Oklahoma', streetCleaning: false, permitZones: false, overnight: 'Generally allowed', towWarning: '24h notice required', notes: 'Oklahoma City: 72h street parking limit.' },
  OR: { name: 'Oregon', streetCleaning: false, permitZones: true, overnight: 'Allowed unless posted', towWarning: '24h notice on public streets', notes: 'Portland: 72h limit on residential streets. High parking enforcement downtown.' },
  PA: { name: 'Pennsylvania', streetCleaning: true, permitZones: true, overnight: 'Allowed unless posted', towWarning: 'Immediate tow during snow emergencies; 24h elsewhere', notes: 'Philadelphia: alternate-side parking Tue/Fri 8am–11am. Pittsburgh: steep-hill rules in winter.' },
  RI: { name: 'Rhode Island', streetCleaning: false, permitZones: true, overnight: 'Restricted in Providence Nov–Mar', towWarning: 'Immediate tow during snow events', notes: 'Providence: no overnight parking without permit in designated zones.' },
  SC: { name: 'South Carolina', streetCleaning: false, permitZones: true, overnight: 'Generally allowed', towWarning: '24h notice on public streets', notes: 'Charleston: downtown 2h limit. Beach parking restricted at night.' },
  SD: { name: 'South Dakota', streetCleaning: false, permitZones: false, overnight: 'Generally allowed', towWarning: '24h notice required', notes: 'Sioux Falls: 72h continuous limit.' },
  TN: { name: 'Tennessee', streetCleaning: false, permitZones: true, overnight: 'Generally allowed', towWarning: '24h notice on public streets', notes: 'Nashville: downtown 2h limit. Memphis: 72h street limit.' },
  TX: { name: 'Texas', streetCleaning: false, permitZones: true, overnight: 'Generally allowed unless posted', towWarning: 'Immediate tow from private property; 24h on public streets', notes: 'Houston/Dallas: no statewide street cleaning. Private lots may tow immediately.' },
  UT: { name: 'Utah', streetCleaning: false, permitZones: true, overnight: 'Generally allowed', towWarning: '24h notice on public streets', notes: 'Salt Lake City: snow emergency routes Oct–Apr. 72h limit on streets.' },
  VT: { name: 'Vermont', streetCleaning: false, permitZones: true, overnight: 'Restricted Nov–Apr in Burlington', towWarning: 'Immediate tow on snow routes', notes: 'Burlington: no overnight parking Oct 15–Apr 15 on many streets.' },
  VA: { name: 'Virginia', streetCleaning: false, permitZones: true, overnight: 'Generally allowed', towWarning: '24h notice on public streets', notes: 'Arlington/Alexandria: residential permit zones. Richmond: 72h limit.' },
  WA: { name: 'Washington', streetCleaning: true, permitZones: true, overnight: 'Generally allowed unless posted', towWarning: 'Immediate tow in cleaning zones; 72h limit citywide in Seattle', notes: 'Seattle: 72h continuous limit enforced. Street cleaning Mon–Sat varies by block.' },
  WV: { name: 'West Virginia', streetCleaning: false, permitZones: false, overnight: 'Generally allowed', towWarning: '24h notice required', notes: 'Charleston: 48h continuous limit.' },
  WI: { name: 'Wisconsin', streetCleaning: true, permitZones: true, overnight: 'Restricted Nov–Mar in Milwaukee/Madison', towWarning: 'Immediate tow on snow routes during events', notes: 'Milwaukee: no overnight parking Dec 1–Mar 15 without permit. Madison: alternate-side in winter.' },
  WY: { name: 'Wyoming', streetCleaning: false, permitZones: false, overnight: 'Generally allowed', towWarning: '24h notice required', notes: 'Cheyenne: 72h limit on residential streets.' },
  DC: { name: 'District of Columbia', streetCleaning: true, permitZones: true, overnight: 'Allowed with DC resident permit', towWarning: 'Immediate tow in cleaning/emergency zones; $100–$300 fine + tow', notes: 'DC: strict alternate-side 2x/week most blocks. Visitor permits available. Hydrant: 10ft rule.' },
};

// ─── OSM tag → human verdict ─────────────────────────────────────────────────
function parseOSMRestrictions(elements) {
  if (!elements || !Array.isArray(elements) || elements.length === 0) return null;
  for (const el of elements) {
    if (!el?.tags) continue;
    const t = el.tags;
    // Check lane-level tags
    const laneValues = [
      t['parking:lane:right'],
      t['parking:lane:left'],
      t['parking:lane:both'],
    ].filter(Boolean);

    for (const v of laneValues) {
      if (v === 'no_stopping') return { status: 'no_stopping', label: 'No Stopping', color: 'red', icon: '🚫' };
      if (v === 'no_parking') return { status: 'no_parking', label: 'No Parking', color: 'red', icon: '🚫' };
      if (v === 'no_standing') return { status: 'no_standing', label: 'No Standing', color: 'red', icon: '🚫' };
      if (v === 'parallel' || v === 'diagonal' || v === 'perpendicular') {
        return { status: 'allowed', label: 'Parking Allowed', color: 'green', icon: '✅' };
      }
    }

    // Condition tags
    const cond = t['parking:condition'] || t['parking:condition:right'] || t['parking:condition:left'];
    if (cond === 'no_parking') return { status: 'no_parking', label: 'No Parking', color: 'red', icon: '🚫' };
    if (cond === 'time_limited') {
      const maxstay = t['parking:condition:maxstay'] || t.maxstay;
      return {
        status: 'time_limited',
        label: maxstay ? `${maxstay} Limit` : 'Time Limited',
        color: 'yellow',
        icon: '⏱️',
        maxstay,
      };
    }
    if (cond === 'free') return { status: 'allowed', label: 'Free Parking', color: 'green', icon: '✅' };
    if (cond === 'ticket') return { status: 'metered', label: 'Metered Parking', color: 'blue', icon: '🅿️' };
    if (cond === 'residents') return { status: 'permit', label: 'Permit Required', color: 'yellow', icon: '🪧' };
  }
  return null;
}

/**
 * Produce a parking verdict from OSM elements + state code.
 */
export function computeVerdict(osmElements, stateCode, cityName) {
  const osmResult = parseOSMRestrictions(osmElements);
  const stateLaw = STATE_LAWS[stateCode] || null;

  if (osmResult) {
    return {
      ...osmResult,
      source: 'OpenStreetMap',
      stateLaw,
      cityName,
    };
  }

  // No OSM-specific data — return a state-based advisory
  if (stateLaw) {
    return {
      status: 'advisory',
      label: 'Check Local Signs',
      color: 'blue',
      icon: 'ℹ️',
      source: 'State Law Database',
      stateLaw,
      cityName,
      note: stateLaw.notes,
    };
  }

  return {
    status: 'unknown',
    label: 'Unknown — Check Signs',
    color: 'gray',
    icon: '❓',
    source: 'No data',
    stateLaw: null,
    cityName,
  };
}

/**
 * Compute a tow risk score for the current location.
 *
 * @param {object|null} verdict       — from computeVerdict()
 * @param {Array}       towCompanies  — from fetchNearbyTowCompanies()
 * @param {object|null} queryLocation — { lat, lon } of the checked spot
 * @returns {{ level: string, score: number, color: string, emoji: string, factors: string[] }}
 */
export function computeTowRisk(verdict, towCompanies = [], queryLocation = null) {
  const factors = [];
  let score = 0;

  // ── Base score from OSM/state verdict ───────────────────────────────────────
  const status = verdict?.status;
  if (status === 'no_parking' || status === 'no_stopping' || status === 'no_standing') {
    score += 8;
    factors.push('Posted no-parking zone');
  } else if (status === 'permit') {
    score += 6;
    factors.push('Permit-only zone');
  } else if (status === 'time_limited') {
    score += 4;
    factors.push('Time-restricted street');
  } else if (status === 'metered') {
    score += 3;
    factors.push('Metered zone — overstay risk');
  } else if (status === 'allowed') {
    score += 1;
  } else {
    // unknown/advisory — assume moderate risk
    score += 5;
    factors.push('Parking rules unclear — check signs');
  }

  // ── Tow company density modifier ────────────────────────────────────────────
  const nearbyCount = (queryLocation && towCompanies.length > 0)
    ? towCompanies.filter(c => {
        const dLat = (c.lat - queryLocation.lat) * 111320;
        const dLon = (c.lon - queryLocation.lon) * 111320 * Math.cos(queryLocation.lat * Math.PI / 180);
        return Math.sqrt(dLat * dLat + dLon * dLon) < 2000; // within 2 km
      }).length
    : Math.min(towCompanies.length, 10);

  if (nearbyCount >= 5) {
    score += 2;
    factors.push(`${nearbyCount} tow companies within 2 km — high-patrol area`);
  } else if (nearbyCount >= 2) {
    score += 1;
    factors.push(`${nearbyCount} tow companies nearby`);
  }

  // ── State law modifiers ──────────────────────────────────────────────────────
  const law = verdict?.stateLaw;
  if (law?.streetCleaning) {
    score += 1;
    factors.push('Street cleaning enforced in this state');
  }

  const clamped = Math.min(10, Math.max(1, score));

  if (clamped >= 7) {
    return { level: 'High', score: clamped, color: '#dc2626', bg: '#fef2f2', emoji: '🔴', factors };
  }
  if (clamped >= 4) {
    return { level: 'Medium', score: clamped, color: '#d97706', bg: '#fffbeb', emoji: '🟡', factors };
  }
  return { level: 'Low', score: clamped, color: '#059669', bg: '#f0fdf4', emoji: '🟢', factors };
}

// Full-name → 2-letter code lookup (fallback when ISO field is missing)
const STATE_NAME_TO_CODE = Object.fromEntries(
  Object.entries(STATE_LAWS).map(([code, law]) => [law.name.toLowerCase(), code])
);

/**
 * Reverse geocode via Nominatim (free OSM geocoder) to get state code + city.
 */
export async function reverseGeocode(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  if (!res.ok) return { stateCode: null, city: null, display: null };
  const data = await res.json();
  const addr = data.address || {};

  // Nominatim uses hyphens in field name: "ISO3166-2-lvl4" (e.g. "US-NY")
  // Bracket notation required — dot notation with underscores won't find it.
  const isoField = addr['ISO3166-2-lvl4'] || addr['ISO3166_2_lvl4'] || null;
  let stateCode = isoField?.replace('US-', '') || null;

  // Fallback 1: 2-letter state abbreviation in addr.state
  if (!stateCode && addr.state?.length === 2) {
    stateCode = addr.state.toUpperCase();
  }

  // Fallback 2: match full state name against our law DB (e.g. "New York" → "NY")
  if (!stateCode && addr.state) {
    stateCode = STATE_NAME_TO_CODE[addr.state.toLowerCase()] || null;
  }

  const city = addr.city || addr.town || addr.village || addr.suburb || null;
  return { stateCode, city, display: data.display_name, country: addr.country_code?.toUpperCase() };
}

/**
 * Estimate parking garage rate based on city tier (rough heuristic).
 */
export function estimateRate(parkingFeature, city) {
  const majorCities = ['New York', 'San Francisco', 'Boston', 'Chicago', 'Los Angeles', 'Seattle', 'Washington'];
  const midCities = ['Denver', 'Philadelphia', 'Miami', 'Portland', 'Austin', 'Nashville', 'Atlanta'];

  if (parkingFeature.fee === 'no' || parkingFeature.access === 'private') {
    return { hourly: 'Free', daily: 'Free', tier: 'free' };
  }

  const cityStr = city || '';
  if (majorCities.some(c => cityStr.includes(c))) {
    return { hourly: '$5–15/hr', daily: '$30–60/day', tier: 'major' };
  }
  if (midCities.some(c => cityStr.includes(c))) {
    return { hourly: '$2–8/hr', daily: '$15–30/day', tier: 'mid' };
  }
  return { hourly: '$1–5/hr', daily: '$8–20/day', tier: 'small' };
}
