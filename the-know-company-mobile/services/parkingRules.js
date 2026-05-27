// Parking rules engine — all 50 US states + DC
// Pure JS, no DOM, React Native compatible

// ---------------------------------------------------------------------------
// STATE_LAWS: complete definitions for all 51 jurisdictions
// ---------------------------------------------------------------------------
export const STATE_LAWS = {
  AL: {
    name: 'Alabama',
    streetCleaning: false,
    permitZones: false,
    overnight: 'allowed',
    towWarning: 'Vehicle may be towed at owner expense after 24h on public street without movement.',
    notes: 'No statewide street cleaning schedule. Local ordinances vary by municipality.',
  },
  AK: {
    name: 'Alaska',
    streetCleaning: false,
    permitZones: false,
    overnight: 'allowed',
    towWarning: 'Vehicles abandoned for 24+ hours on public roads may be impounded.',
    notes: 'Winter parking restrictions common in Anchorage and Fairbanks during snow events.',
  },
  AZ: {
    name: 'Arizona',
    streetCleaning: false,
    permitZones: true,
    overnight: 'allowed',
    towWarning: 'Towing authorized after 24h in no-parking zones or as posted.',
    notes: 'Phoenix and Scottsdale have permit zones in select neighborhoods. Residential overnight parking generally permitted.',
  },
  AR: {
    name: 'Arkansas',
    streetCleaning: false,
    permitZones: false,
    overnight: 'allowed',
    towWarning: 'Abandoned vehicles may be towed after 48 hours on public streets.',
    notes: 'No statewide street cleaning program. Local codes vary.',
  },
  CA: {
    name: 'California',
    streetCleaning: true,
    permitZones: true,
    overnight: 'restricted',
    towWarning: 'Vehicles may be cited and towed immediately during posted street sweeping hours. No overnight parking without permit in many cities.',
    notes: 'Street sweeping is aggressively enforced in LA, SF, San Diego, and most major cities. Permit Parking Districts (RPP) are widespread. 72-hour rule: vehicles cannot remain parked on public streets for more than 72 consecutive hours.',
  },
  CO: {
    name: 'Colorado',
    streetCleaning: true,
    permitZones: true,
    overnight: 'allowed',
    towWarning: 'Towing authorized during posted street cleaning windows and snow emergencies.',
    notes: 'Denver has an extensive street sweeping program April–November. Snow emergency routes require immediate vehicle removal. Many downtown neighborhoods have RPP zones.',
  },
  CT: {
    name: 'Connecticut',
    streetCleaning: true,
    permitZones: true,
    overnight: 'restricted',
    towWarning: 'Street sweeping violations result in fines; repeat offenders may be towed.',
    notes: 'Hartford, New Haven, and Bridgeport have overnight parking bans in winter. Many cities require overnight parking permits.',
  },
  DE: {
    name: 'Delaware',
    streetCleaning: false,
    permitZones: true,
    overnight: 'allowed',
    towWarning: 'Vehicles in no-parking zones may be towed without notice.',
    notes: 'Wilmington has residential permit zones. Rehoboth Beach enforces strict seasonal parking rules.',
  },
  DC: {
    name: 'District of Columbia',
    streetCleaning: true,
    permitZones: true,
    overnight: 'restricted',
    towWarning: 'DC aggressively tows vehicles during street sweeping. Zone permit required for overnight parking in residential areas.',
    notes: 'Street sweeping is enforced year-round. Residential Permit Parking (RPP) covers most neighborhoods. Vehicles without DC plates or permits may not park 7am–8:30pm in many zones. Visitor permits available.',
  },
  FL: {
    name: 'Florida',
    streetCleaning: false,
    permitZones: true,
    overnight: 'allowed',
    towWarning: 'Private property towing is prevalent. Public street towing after 48–72h depending on municipality.',
    notes: 'Miami Beach has strict overnight and event parking restrictions. Orlando and Tampa have metered zones downtown. Seasonal rules in beach communities.',
  },
  GA: {
    name: 'Georgia',
    streetCleaning: false,
    permitZones: true,
    overnight: 'allowed',
    towWarning: 'Towing from private lots is common and immediate. Street towing after 24h abandonment.',
    notes: 'Atlanta has residential permit zones in Midtown and Virginia-Highland. Downtown Atlanta has metered parking until 10pm most days.',
  },
  HI: {
    name: 'Hawaii',
    streetCleaning: true,
    permitZones: true,
    overnight: 'restricted',
    towWarning: 'Honolulu tows immediately during street cleaning hours. Overnight parking on many streets prohibited.',
    notes: 'Honolulu enforces strict street sweeping and residential parking permits. Many Oahu neighborhoods prohibit overnight parking between 2am–5am.',
  },
  ID: {
    name: 'Idaho',
    streetCleaning: false,
    permitZones: false,
    overnight: 'allowed',
    towWarning: 'Abandoned vehicles may be towed after 48 hours.',
    notes: 'Boise has some downtown meter zones. Winter parking rules may apply on designated snow routes.',
  },
  IL: {
    name: 'Illinois',
    streetCleaning: true,
    permitZones: true,
    overnight: 'restricted',
    towWarning: 'Chicago tows immediately during street sweeping and overnight winter restrictions. Wheel-booting common downtown.',
    notes: 'Chicago has one of the most complex parking systems in the US. Street sweeping enforced April–November. Zone parking permits required throughout the city. Snow routes require vehicles to move within 3 hours of declared snow emergency.',
  },
  IN: {
    name: 'Indiana',
    streetCleaning: false,
    permitZones: true,
    overnight: 'allowed',
    towWarning: 'Towing after 24–48h depending on city ordinance.',
    notes: 'Indianapolis has limited permit zones. No statewide street cleaning mandate.',
  },
  IA: {
    name: 'Iowa',
    streetCleaning: false,
    permitZones: false,
    overnight: 'allowed',
    towWarning: 'Vehicles may be towed after 24h if obstructing traffic or in violation of posted signs.',
    notes: 'Des Moines has alternate-side parking during snow events. Generally permissive for overnight street parking.',
  },
  KS: {
    name: 'Kansas',
    streetCleaning: false,
    permitZones: false,
    overnight: 'allowed',
    towWarning: 'Towing after 48–72h abandonment on public streets.',
    notes: 'Wichita and Kansas City (KS) have limited parking restrictions. Generally permissive statewide.',
  },
  KY: {
    name: 'Kentucky',
    streetCleaning: false,
    permitZones: false,
    overnight: 'allowed',
    towWarning: 'Towing authorized after 24h on public streets where prohibited.',
    notes: 'Louisville and Lexington have metered downtown zones. No statewide street cleaning program.',
  },
  LA: {
    name: 'Louisiana',
    streetCleaning: true,
    permitZones: true,
    overnight: 'allowed',
    towWarning: 'New Orleans tows aggressively during posted events and street cleaning. Game-day towing is common.',
    notes: 'New Orleans has a complex permit parking system in historic neighborhoods. French Quarter and Garden District have strict enforcement. Event parking restrictions around Superdome area frequently in effect.',
  },
  ME: {
    name: 'Maine',
    streetCleaning: false,
    permitZones: true,
    overnight: 'restricted',
    towWarning: 'Winter overnight parking bans strictly enforced. Vehicles towed immediately during snow events.',
    notes: 'Portland prohibits overnight parking November–April without a resident permit. Most cities enforce winter parking bans to allow plowing.',
  },
  MD: {
    name: 'Maryland',
    streetCleaning: true,
    permitZones: true,
    overnight: 'restricted',
    towWarning: 'Baltimore and DC suburbs tow during street sweeping. Overnight restrictions vary by jurisdiction.',
    notes: 'Baltimore City has residential permit zones and street sweeping enforcement. Montgomery and Prince Georges counties have varied rules. Annapolis has strict historic district parking.',
  },
  MA: {
    name: 'Massachusetts',
    streetCleaning: true,
    permitZones: true,
    overnight: 'restricted',
    towWarning: 'Boston tows immediately during street sweeping and snow emergencies. Cambridge and Somerville also strictly enforce.',
    notes: 'Boston has neighborhood permit zones covering most residential areas. Street sweeping April–November strictly enforced. Snow emergency routes require immediate removal. Resident sticker required for many areas.',
  },
  MI: {
    name: 'Michigan',
    streetCleaning: true,
    permitZones: true,
    overnight: 'restricted',
    towWarning: 'Detroit and other cities tow during street cleaning windows and winter bans.',
    notes: 'Detroit has overnight parking bans in effect. Ann Arbor and Lansing have permit zones. Snow emergency routes trigger immediate tow-away.',
  },
  MN: {
    name: 'Minnesota',
    streetCleaning: true,
    permitZones: true,
    overnight: 'restricted',
    towWarning: 'Minneapolis and St. Paul strictly enforce overnight winter parking bans. Towing immediate during snow emergencies.',
    notes: 'Minneapolis has alternate side parking rules October–April. St. Paul bans overnight street parking November–March. Both cities have permit zones. Street sweeping enforced April–October.',
  },
  MS: {
    name: 'Mississippi',
    streetCleaning: false,
    permitZones: false,
    overnight: 'allowed',
    towWarning: 'Towing after 48h on public streets or immediately in clearly marked no-parking zones.',
    notes: 'Jackson has some downtown metered parking. Generally permissive statewide for street parking.',
  },
  MO: {
    name: 'Missouri',
    streetCleaning: true,
    permitZones: true,
    overnight: 'allowed',
    towWarning: 'St. Louis and Kansas City tow during street cleaning windows. Snow route towing immediate.',
    notes: 'Kansas City and St. Louis have permit zones in select neighborhoods. Street sweeping enforced in major cities.',
  },
  MT: {
    name: 'Montana',
    streetCleaning: false,
    permitZones: false,
    overnight: 'allowed',
    towWarning: 'Towing after 48–72h on public streets if deemed abandoned.',
    notes: 'Billings and Missoula have metered downtown areas. Snow removal rules may apply seasonally.',
  },
  NE: {
    name: 'Nebraska',
    streetCleaning: false,
    permitZones: false,
    overnight: 'allowed',
    towWarning: 'Vehicles may be towed after 24h in no-parking zones or 72h if deemed abandoned.',
    notes: 'Omaha and Lincoln have downtown metered parking. No statewide street cleaning program.',
  },
  NV: {
    name: 'Nevada',
    streetCleaning: false,
    permitZones: true,
    overnight: 'allowed',
    towWarning: 'Las Vegas Strip private lots tow immediately. Public street towing per posted signs.',
    notes: 'Las Vegas has extensive metered parking downtown and on the Strip. Henderson and North Las Vegas have some permit zones. Desert communities generally permissive.',
  },
  NH: {
    name: 'New Hampshire',
    streetCleaning: false,
    permitZones: true,
    overnight: 'restricted',
    towWarning: 'Winter overnight parking bans common. Violations result in fines and potential towing.',
    notes: 'Manchester and Nashua prohibit overnight parking during winter months. Permit zones in some downtown areas.',
  },
  NJ: {
    name: 'New Jersey',
    streetCleaning: true,
    permitZones: true,
    overnight: 'restricted',
    towWarning: 'Street sweeping strictly enforced throughout the state. Many municipalities tow during sweeping hours.',
    notes: 'Newark, Jersey City, Hoboken, and Camden have extensive permit zones. Hoboken restricts non-resident parking. Many NJ towns have alternate-side parking rules. Some towns ban overnight parking entirely.',
  },
  NM: {
    name: 'New Mexico',
    streetCleaning: false,
    permitZones: false,
    overnight: 'allowed',
    towWarning: 'Towing after 24h in posted no-parking areas or 72h if abandoned.',
    notes: 'Albuquerque and Santa Fe have metered downtown zones. Generally permissive for street parking.',
  },
  NY: {
    name: 'New York',
    streetCleaning: true,
    permitZones: true,
    overnight: 'allowed',
    towWarning: 'NYC tows immediately during street sweeping. In NYC, vehicles are towed to impound lots requiring significant fees to retrieve.',
    notes: 'New York City has the most complex alternate-side parking rules in the country. Suspended on religious and legal holidays. Always check posted signs — rules can change block by block. Outside NYC, rules vary widely by city.',
  },
  NC: {
    name: 'North Carolina',
    streetCleaning: false,
    permitZones: true,
    overnight: 'allowed',
    towWarning: 'Towing from private lots is common and immediate. Public street towing per posted signs.',
    notes: 'Charlotte and Raleigh have permit zones in select neighborhoods. UNC and Duke campuses have strict enforcement. Generally permissive for residential street parking.',
  },
  ND: {
    name: 'North Dakota',
    streetCleaning: false,
    permitZones: false,
    overnight: 'allowed',
    towWarning: 'Towing after 48h if vehicle is deemed abandoned on public street.',
    notes: 'Fargo and Bismarck have snow emergency routes. Generally permissive statewide.',
  },
  OH: {
    name: 'Ohio',
    streetCleaning: true,
    permitZones: true,
    overnight: 'restricted',
    towWarning: 'Cleveland and Columbus tow during street cleaning. Winter parking bans enforced across northern Ohio.',
    notes: 'Cleveland, Columbus, Cincinnati, and Toledo all have distinct parking rules. Cleveland has alternate-side parking. Columbus has permit zones near Ohio State University. Snow emergency levels trigger parking bans.',
  },
  OK: {
    name: 'Oklahoma',
    streetCleaning: false,
    permitZones: false,
    overnight: 'allowed',
    towWarning: 'Towing after 24–48h in posted zones or for abandoned vehicles.',
    notes: 'Oklahoma City and Tulsa have downtown metered parking. Generally permissive statewide for residential parking.',
  },
  OR: {
    name: 'Oregon',
    streetCleaning: true,
    permitZones: true,
    overnight: 'allowed',
    towWarning: 'Portland tows during street sweeping. 24-hour parking time limits in many neighborhoods.',
    notes: 'Portland has a 24-hour limit in many areas and permit zones in inner neighborhoods. Eugene has permit zones near UO campus. Street sweeping enforced April–October in Portland.',
  },
  PA: {
    name: 'Pennsylvania',
    streetCleaning: true,
    permitZones: true,
    overnight: 'restricted',
    towWarning: 'Philadelphia tows aggressively during sweeping and in permit zones. Pittsburgh has winter parking bans.',
    notes: 'Philadelphia has extensive permit zones and street sweeping. Pittsburgh prohibits overnight parking on some streets and has snow emergency routes. Both cities have active towing programs.',
  },
  RI: {
    name: 'Rhode Island',
    streetCleaning: true,
    permitZones: true,
    overnight: 'restricted',
    towWarning: 'Providence tows during street sweeping and winter overnight bans.',
    notes: 'Providence has residential permit zones and street sweeping. Winter overnight parking bans common. Newport has strict seasonal parking in tourist areas.',
  },
  SC: {
    name: 'South Carolina',
    streetCleaning: false,
    permitZones: true,
    overnight: 'allowed',
    towWarning: 'Private lot towing common and immediate. Public street towing per posted signs.',
    notes: 'Charleston has metered parking in historic district. Myrtle Beach has seasonal restrictions. Columbia and Greenville have permit zones in some areas.',
  },
  SD: {
    name: 'South Dakota',
    streetCleaning: false,
    permitZones: false,
    overnight: 'allowed',
    towWarning: 'Towing after 48h if vehicle considered abandoned on public street.',
    notes: 'Sioux Falls and Rapid City have downtown metered parking. Generally permissive statewide.',
  },
  TN: {
    name: 'Tennessee',
    streetCleaning: false,
    permitZones: true,
    overnight: 'allowed',
    towWarning: 'Private lot towing frequent and immediate in Nashville and Memphis. Street towing per posted signs.',
    notes: 'Nashville has metered parking downtown and permit zones in some neighborhoods. Memphis has limited permit zones. Chattanooga has strict enforcement in tourist areas.',
  },
  TX: {
    name: 'Texas',
    streetCleaning: false,
    permitZones: true,
    overnight: 'allowed',
    towWarning: 'Private towing in Texas is aggressive and largely unregulated. Towing from private lots may occur within minutes. Public street towing per posted signs.',
    notes: 'Houston, Dallas, Austin, and San Antonio have distinct parking rules. Austin has permit zones and meter enforcement until midnight in some areas. Dallas has strict no-parking zones near highways. Texas law requires tow companies to notify police within 30 minutes of a tow.',
  },
  UT: {
    name: 'Utah',
    streetCleaning: false,
    permitZones: true,
    overnight: 'allowed',
    towWarning: 'Towing after posted time limits or 24–48h for abandoned vehicles.',
    notes: 'Salt Lake City has permit zones near downtown and University of Utah. Park City has strict seasonal parking. Winter snow removal rules apply on some routes.',
  },
  VT: {
    name: 'Vermont',
    streetCleaning: false,
    permitZones: true,
    overnight: 'restricted',
    towWarning: 'Winter overnight bans strictly enforced. Towing authorized during snow emergencies.',
    notes: 'Burlington prohibits overnight parking during winter. Many Vermont towns ban overnight street parking November–April. Stowe and ski resort communities have strict seasonal rules.',
  },
  VA: {
    name: 'Virginia',
    streetCleaning: true,
    permitZones: true,
    overnight: 'restricted',
    towWarning: 'Alexandria and Arlington tow during street sweeping. NOVA jurisdictions have strict overnight rules.',
    notes: 'Northern Virginia (Arlington, Alexandria, Fairfax) has extensive permit zones due to proximity to DC. Richmond has residential permit zones. Street sweeping enforced in urban areas. Virginia Beach has seasonal beach parking rules.',
  },
  WA: {
    name: 'Washington',
    streetCleaning: true,
    permitZones: true,
    overnight: 'allowed',
    towWarning: 'Seattle tows during street sweeping. 72-hour rule applies citywide in Seattle.',
    notes: 'Seattle has a 72-hour parking limit throughout the city and enforces it actively. Street sweeping enforced April–October. Permit zones in Capitol Hill, Queen Anne, Fremont, and other neighborhoods. Tacoma and Spokane have more permissive rules.',
  },
  WV: {
    name: 'West Virginia',
    streetCleaning: false,
    permitZones: false,
    overnight: 'allowed',
    towWarning: 'Towing after 48h on public streets or immediately in clearly posted zones.',
    notes: 'Charleston and Huntington have downtown metered parking. Generally permissive statewide.',
  },
  WI: {
    name: 'Wisconsin',
    streetCleaning: true,
    permitZones: true,
    overnight: 'restricted',
    towWarning: 'Milwaukee tows immediately during street sweeping. Madison has strict overnight winter bans.',
    notes: 'Milwaukee has a comprehensive street sweeping program May–October with towing. Madison prohibits overnight parking on most streets from November–March. Both cities have permit zones. Snow emergency declarations trigger immediate tow-away on posted routes.',
  },
  WY: {
    name: 'Wyoming',
    streetCleaning: false,
    permitZones: false,
    overnight: 'allowed',
    towWarning: 'Towing after 48–72h if vehicle deemed abandoned on public street.',
    notes: 'Cheyenne and Casper have downtown metered parking. Jackson Hole has strict seasonal tourist parking. Generally permissive statewide.',
  },
};

// ---------------------------------------------------------------------------
// reverseGeocode: fetch state/city info from Nominatim
// ---------------------------------------------------------------------------
export async function reverseGeocode(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TheKnowCompany/1.0',
        'Accept-Language': 'en',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim HTTP error: ${response.status}`);
    }

    const data = await response.json();
    const addr = data.address || {};

    // Derive state code from state name or abbreviation
    const stateName = addr.state || '';
    const stateCode = deriveStateCode(stateName, addr.country_code);

    return {
      stateCode,
      city: addr.city || addr.town || addr.village || addr.county || null,
      display: data.display_name || null,
      country: addr.country || addr.country_code || null,
      raw: addr,
    };
  } catch (err) {
    console.warn('[parkingRules] reverseGeocode error:', err.message);
    return { stateCode: null, city: null, display: null, country: null };
  }
}

// ---------------------------------------------------------------------------
// Helper: derive two-letter state code from a state name string
// ---------------------------------------------------------------------------
const STATE_NAME_TO_CODE = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', 'district of columbia': 'DC',
  florida: 'FL', georgia: 'GA', hawaii: 'HI', idaho: 'ID', illinois: 'IL',
  indiana: 'IN', iowa: 'IA', kansas: 'KS', kentucky: 'KY', louisiana: 'LA',
  maine: 'ME', maryland: 'MD', massachusetts: 'MA', michigan: 'MI', minnesota: 'MN',
  mississippi: 'MS', missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH', oklahoma: 'OK',
  oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT',
  virginia: 'VA', washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI',
  wyoming: 'WY',
};

function deriveStateCode(stateName, countryCode) {
  if (!stateName) return null;
  if (countryCode && countryCode.toLowerCase() !== 'us') return null;

  // Already a 2-letter code?
  if (stateName.length === 2) return stateName.toUpperCase();

  const key = stateName.toLowerCase().trim();
  return STATE_NAME_TO_CODE[key] || null;
}

// ---------------------------------------------------------------------------
// Helper: extract parking-relevant tags from OSM elements
// ---------------------------------------------------------------------------
function collectTags(osmElements) {
  const tags = {};
  for (const el of osmElements) {
    if (el.tags) {
      Object.assign(tags, el.tags);
    }
  }
  return tags;
}

// ---------------------------------------------------------------------------
// computeVerdict: determine parking status from OSM data + state law
// ---------------------------------------------------------------------------
export function computeVerdict(osmElements, stateCode, cityName) {
  const tags = collectTags(osmElements);
  const stateLaw = stateCode ? STATE_LAWS[stateCode] || null : null;

  // --- Explicit prohibitions ---
  if (tags['no_parking'] === 'yes' || tags.amenity === 'no_parking') {
    return {
      status: 'no_parking',
      label: 'No Parking',
      color: '#E53E3E',
      icon: 'ban',
      source: 'osm',
      stateLaw,
      cityName,
      note: 'This area is marked as no parking.',
    };
  }

  // Check highway tag for no stopping / no standing lanes
  const highwayTag = tags.highway;
  const accessTag = tags.access;

  if (
    tags['parking:lane:both'] === 'no_stopping' ||
    tags['parking:lane:left'] === 'no_stopping' ||
    tags['parking:lane:right'] === 'no_stopping'
  ) {
    return {
      status: 'no_stopping',
      label: 'No Stopping',
      color: '#C53030',
      icon: 'minus-circle',
      source: 'osm',
      stateLaw,
      cityName,
      note: 'No stopping allowed in this lane.',
    };
  }

  if (
    tags['parking:lane:both'] === 'no_standing' ||
    tags['parking:lane:left'] === 'no_standing' ||
    tags['parking:lane:right'] === 'no_standing'
  ) {
    return {
      status: 'no_standing',
      label: 'No Standing',
      color: '#DD6B20',
      icon: 'alert-triangle',
      source: 'osm',
      stateLaw,
      cityName,
      note: 'No standing allowed — passengers may be dropped off only.',
    };
  }

  if (accessTag === 'no' || accessTag === 'private') {
    return {
      status: 'no_parking',
      label: 'No Public Access',
      color: '#E53E3E',
      icon: 'lock',
      source: 'osm',
      stateLaw,
      cityName,
      note: 'This area is private or restricted access.',
    };
  }

  // --- Permit zones ---
  const parkingCondition =
    tags['parking:condition'] ||
    tags['parking:condition:left'] ||
    tags['parking:condition:right'] ||
    tags['parking:condition:both'];

  if (parkingCondition === 'permit') {
    return {
      status: 'permit',
      label: 'Permit Required',
      color: '#805AD5',
      icon: 'key',
      source: 'osm',
      stateLaw,
      cityName,
      note: 'A residential or special permit is required to park here.',
    };
  }

  // --- Metered parking ---
  const hasMeter =
    tags.amenity === 'parking_meter' ||
    tags['parking:fee'] === 'yes' ||
    tags.fee === 'yes' ||
    parkingCondition === 'ticket' ||
    parkingCondition === 'fee';

  if (hasMeter) {
    return {
      status: 'metered',
      label: 'Metered Parking',
      color: '#D69E2E',
      icon: 'clock',
      source: 'osm',
      stateLaw,
      cityName,
      note: 'Pay-to-park meter zone.',
    };
  }

  // --- Time-limited parking ---
  const maxstay =
    tags.maxstay ||
    tags['parking:maxstay'] ||
    tags['parking:condition:maxstay'];

  if (maxstay || parkingCondition === 'limited') {
    return {
      status: 'time_limited',
      label: `Time Limited${maxstay ? ': ' + maxstay : ''}`,
      color: '#ECC94B',
      icon: 'clock',
      source: 'osm',
      stateLaw,
      cityName,
      maxstay: maxstay || null,
      note: maxstay
        ? `Parking limited to ${maxstay}. Check posted signs for exact hours.`
        : 'Parking is time-limited. Check posted signs.',
    };
  }

  // --- Free parking explicitly tagged ---
  const parkingLane =
    tags['parking:lane:both'] ||
    tags['parking:lane:left'] ||
    tags['parking:lane:right'];

  if (
    parkingLane === 'parallel' ||
    parkingLane === 'diagonal' ||
    parkingLane === 'perpendicular' ||
    tags.amenity === 'parking' ||
    tags.parking
  ) {
    const openingHours = tags.opening_hours || null;
    return {
      status: 'allowed',
      label: 'Parking Allowed',
      color: '#38A169',
      icon: 'check-circle',
      source: 'osm',
      stateLaw,
      cityName,
      note: openingHours
        ? `Parking appears allowed. Hours: ${openingHours}. Verify posted signs.`
        : 'Parking appears allowed. Always verify posted signs.',
    };
  }

  // --- State-law advisory when no OSM data ---
  if (stateLaw) {
    const hasRestrictions = stateLaw.streetCleaning || stateLaw.permitZones;
    return {
      status: 'advisory',
      label: hasRestrictions ? 'Check Posted Signs' : 'Likely Allowed',
      color: hasRestrictions ? '#ECC94B' : '#68D391',
      icon: hasRestrictions ? 'alert-circle' : 'info',
      source: 'state_law',
      stateLaw,
      cityName,
      note: hasRestrictions
        ? `${stateLaw.name} has street cleaning or permit zones. Verify posted signs carefully. ${stateLaw.towWarning}`
        : `No specific restrictions found via map data. ${stateLaw.notes}`,
    };
  }

  // --- Truly unknown ---
  return {
    status: 'unknown',
    label: 'Unknown',
    color: '#718096',
    icon: 'help-circle',
    source: 'none',
    stateLaw: null,
    cityName,
    note: 'No parking data found for this location. Always check posted signs.',
  };
}

// ---------------------------------------------------------------------------
// estimateRate: heuristic parking rate estimate based on city tier
// ---------------------------------------------------------------------------
const HIGH_COST_CITIES = [
  'new york', 'new york city', 'nyc', 'san francisco', 'sf', 'boston',
  'chicago', 'washington', 'dc', 'seattle', 'los angeles', 'la',
  'miami', 'honolulu', 'manhattan', 'brooklyn',
];

const MED_COST_CITIES = [
  'denver', 'portland', 'austin', 'philadelphia', 'atlanta',
  'nashville', 'dallas', 'houston', 'phoenix', 'san diego',
  'minneapolis', 'detroit', 'pittsburgh', 'baltimore', 'new orleans',
];

export function estimateRate(parkingFeature, city) {
  const cityLower = (city || '').toLowerCase().trim();
  const tags = parkingFeature?.tags || {};

  // If fee data already exists in the feature tags, parse it
  if (tags.fee === 'no' || tags.charge === 'free') {
    return { hourly: 0, daily: 0, tier: 'free' };
  }

  // Determine city tier
  let tier = 'low';
  if (HIGH_COST_CITIES.some((c) => cityLower.includes(c))) {
    tier = 'high';
  } else if (MED_COST_CITIES.some((c) => cityLower.includes(c))) {
    tier = 'medium';
  }

  const rates = {
    high: { hourly: 5.0, daily: 40.0 },
    medium: { hourly: 2.5, daily: 20.0 },
    low: { hourly: 1.0, daily: 10.0 },
    free: { hourly: 0, daily: 0 },
  };

  const { hourly, daily } = rates[tier];
  return { hourly, daily, tier };
}
