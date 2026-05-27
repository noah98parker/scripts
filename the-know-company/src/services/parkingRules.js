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

// ─── City-level parking notes ─────────────────────────────────────────────────
// Keyed by state code → lowercase city name. Used to override the generic state
// `notes` blurb with a city-specific advisory in computeVerdict().
//
// Fields mirror STATE_LAWS but are all optional — missing fields fall back to
// the parent state entry.
export const CITY_LAWS = {
  FL: {
    'st. petersburg': {
      notes: 'Downtown meters operate 8am–8pm Mon–Sat (free evenings & Sundays). 2h limit on residential streets near downtown. Event parking bans near Tropicana Field & the Mahaffey Theater on game/show nights. Private lots along Central Ave are aggressively enforced — watch for signs.',
      overnight: 'Generally allowed on public streets unless posted',
      towWarning: 'Private lots near event venues tow immediately; public streets require 24h notice',
    },
    'st pete beach': {
      notes: 'Beach-access parking restricted. Many lots require payment or a city sticker. On-street parking near the beach is limited and time-restricted (typically 2h).',
      overnight: 'Beach-side overnight parking prohibited in most zones',
      towWarning: 'Immediate tow in beach no-parking zones',
    },
    'clearwater': {
      notes: 'Clearwater Beach lots fill quickly on weekends. Downtown meters 9am–9pm. Residential streets near the beach have 2h limits. Beachfront strip has no free parking.',
      overnight: 'No overnight parking at the beach or in many downtown lots',
      towWarning: 'Clearwater Beach lots tow without notice after hours',
    },
    'tampa': {
      notes: 'Downtown has meters and pay lots. Ybor City: aggressive private lot enforcement Fri–Sun nights. Water Street/Channelside: paid garages only. Busch Gardens area lots are private — check signs.',
      overnight: 'Generally allowed on public streets',
      towWarning: 'Private lots in Ybor City and Water Street tow immediately',
    },
    'miami': {
      notes: 'Brickell and downtown have meters (7am–10pm). Wynwood: lots are private and tow-happy. Little Havana: mostly free street parking. Coral Gables enforces permit zones strictly.',
      overnight: 'Generally allowed on public streets unless posted',
      towWarning: 'Private lots in Wynwood tow immediately; 24h notice on public streets',
    },
    'miami beach': {
      notes: 'South Beach: meters operate until 3am. No overnight beach parking. Ocean Drive and Collins Ave enforce 1h limits in peak hours. City parking garages available on 7th/12th/17th St.',
      overnight: 'No overnight parking on beach or beachfront lots',
      towWarning: 'Immediate tow in cleaning zones and beach lots after hours',
    },
    'orlando': {
      notes: 'Downtown: 2h limit on most meters 8am–5pm Mon–Fri. Mills 50 and Thornton Park have popular free streets but fill up. Theme park areas (I-Drive, US 192) are private lots only — no free street parking.',
      overnight: 'Generally allowed on public streets',
      towWarning: 'Private lots near I-Drive and convention center tow immediately',
    },
    'fort lauderdale': {
      notes: 'Las Olas Blvd: 2h meters 8am–8pm. Beach parking meters run 7am–9pm. Flagler Village and Riverwalk have paid lots. Street parking in downtown fills by 7pm on weekends.',
      overnight: 'No overnight beach parking (posted zones)',
      towWarning: 'Beach lot enforcement immediate; downtown private lots tow after posted hours',
    },
    'jacksonville': {
      notes: 'Downtown has paid meters and garages. San Marco and Riverside have free street parking with 2h limits near businesses. Sports/event areas (TIAA Bank Field) restrict public parking on event days.',
      overnight: 'Generally allowed on public streets',
      towWarning: '24h notice required on public streets; private lots vary',
    },
    'sarasota': {
      notes: 'Downtown/Main Street: paid meters 8am–10pm. St. Armands Circle: 2h limit strictly enforced. Siesta Key beach lots fill early — arrive before 10am on summer weekends.',
      overnight: 'Generally allowed unless posted near beach areas',
      towWarning: 'Private Siesta Key lots tow immediately; public streets require 24h notice',
    },
  },

  CA: {
    'los angeles': {
      notes: 'Alternate-side street cleaning enforced with tickets and towing. Most residential streets: 2h 8am–6pm unless permit. Downtown has meters until 8pm. 72h max on any public street (CVC 22651k).',
      overnight: 'Allowed unless street-cleaning hours posted; check signs every block',
      towWarning: 'Immediate tow during cleaning window; 72h law strictly enforced citywide',
    },
    'san francisco': {
      notes: 'Street cleaning 1–3x/week, hours vary by block — check posted signs. 2h limit in most commercial areas. Meters run 9am–6pm (some until 8pm on commercial corridors). Residential permit zones (RPP) are citywide.',
      overnight: 'Allowed on most streets; check for 72h rule and cleaning schedules',
      towWarning: 'Immediate tow during cleaning window; SFMTA enforces aggressively',
    },
    'san diego': {
      notes: 'Downtown: meters 8am–8pm. Mission Beach and Pacific Beach: 2h limits near boardwalk. La Jolla: paid meters enforced strictly. 72h statewide rule applies.',
      overnight: 'Generally allowed unless posted; beach zones often restricted',
      towWarning: 'Immediate tow during cleaning; beach zone enforcement immediate',
    },
    'santa monica': {
      notes: 'Downtown meters run until midnight. Main Street and Third Street Promenade: 2h limits. Beach lots charge daily rates. 2h residential limits strictly enforced near the promenade.',
      overnight: 'No overnight beach parking; residential streets have RPP zones',
      towWarning: 'Immediate tow in beach lots after hours and during cleaning',
    },
  },

  NY: {
    'new york city': {
      notes: 'Alternate-side parking 1–5x/week depending on block — check posted signs. Meters run 7am–7pm (some blocks until 10pm). Suspended on major holidays only. Hydrants: 15ft rule enforced. Garages fill quickly during events.',
      overnight: 'Allowed but alternate-side rules apply — check next-morning sign',
      towWarning: 'Immediate tow during cleaning window; $65–$115 ticket + $185+ tow fee',
    },
    'brooklyn': {
      notes: 'Alternate-side varies by neighborhood — check individual block signs. Park Slope, Williamsburg, DUMBO have 2h metered zones. Many residential blocks have alternate-side Mon or Thu mornings.',
      overnight: 'Allowed; check morning alternate-side schedule before sleeping',
      towWarning: 'Towed vehicles go to Brooklyn Navy Yard pound — $185+ fee',
    },
    'queens': {
      notes: 'Alternate-side cleaning 1–2x/week. Flushing and Jamaica have busy metered areas. Airport vicinity (JFK/LGA): no street parking; use economy lots. Many residential blocks free overnight.',
      overnight: 'Generally allowed on residential streets',
      towWarning: 'Tows go to Queens pound at College Point — $185+ fee',
    },
  },

  IL: {
    'chicago': {
      notes: 'Alternate-side street cleaning strictly enforced Apr–Nov. City sticker required or $200 fine. Meters run by Ald-negotiated contract — rates vary $2–$7/hr. Snow routes: immediate tow when declared.',
      overnight: 'Allowed; check for snow emergency and cleaning signs',
      towWarning: 'Immediate tow during cleaning events and snow emergencies; $150–$500 fee',
    },
  },

  TX: {
    'austin': {
      notes: '6th Street entertainment district: reserved parking lots, very few free spots. Downtown meters until 10pm. South Congress and East Austin: 2h limits on busy corridors. Private lot towing is common near UT campus.',
      overnight: 'Generally allowed on public streets',
      towWarning: 'Private lots near UT and 6th Street tow immediately',
    },
    'houston': {
      notes: 'Montrose, Midtown, Downtown: paid meters or garages. Galleria area: mostly private lots. Medical Center: dedicated garages only, no free street parking nearby.',
      overnight: 'Generally allowed on public streets',
      towWarning: 'Private lots throughout city tow immediately; 24h notice on public',
    },
    'dallas': {
      notes: 'Deep Ellum: private lots are common and tow-happy on event nights. Uptown: meters until 10pm. Greenville Ave: 2h street parking near restaurants. Downtown has paid garages.',
      overnight: 'Generally allowed on public streets',
      towWarning: 'Deep Ellum private lots tow immediately on event nights',
    },
  },

  WA: {
    'seattle': {
      notes: '72h continuous parking limit enforced citywide. Street cleaning varies by block. Capitol Hill, Belltown, South Lake Union: pay stations 8am–10pm. Residential permit zones (RPZ) most neighborhoods.',
      overnight: 'Allowed but 72h limit applies everywhere; RPZ permit needed in some areas',
      towWarning: 'Immediate tow after 72h; cleaning zones tow same day',
    },
  },

  MA: {
    'boston': {
      notes: 'Resident sticker required overnight (7pm–8am most areas). Street cleaning enforced strictly with immediate tow. Back Bay and South End: meters until 8pm. Fenway area: event parking restrictions on game days.',
      overnight: 'Requires resident permit in most neighborhoods — visitors risk ticket/tow',
      towWarning: 'Immediate tow during cleaning; non-resident overnight tow risk is high',
    },
  },

  GA: {
    'atlanta': {
      notes: 'Midtown and Buckhead: meters and private lots. Beltline neighborhoods (Old Fourth Ward, Reynoldstown): 2h limits near restaurants. Downtown: mostly paid garages. Street parking sparse near Mercedes-Benz Stadium on event days.',
      overnight: 'Generally allowed on public streets',
      towWarning: 'Private lots near stadiums and Buckhead bars tow immediately',
    },
  },

  CO: {
    'denver': {
      notes: 'Downtown meters 7am–10pm. LoHi, RiNo, Colfax: paid stations with 2h limits. Snow emergency routes: move your car within 24h of declaration. Residential permit zones (RPP) near downtown.',
      overnight: 'Generally allowed; watch for snow emergency routes in winter',
      towWarning: 'Tow during snow emergencies; 1h grace in time-limit zones',
    },
  },
};

// ─── OSM tag → human verdict ─────────────────────────────────────────────────

/**
 * Parse a parking lot's amenity=parking tags into a structured verdict.
 * Called only when no explicit street-level restriction was found.
 */
function parseParkingLotTags(tags) {
  const t = tags;
  const access = t.access || 'yes';
  const fee = t.fee;
  const maxstay = t.maxstay;
  const opening_hours = t.opening_hours || null;
  const operator = t.operator || t.name || null;
  const capacity = t.capacity ? `${t.capacity} spaces` : null;
  const lotType = t.parking || 'surface';
  const charge = t.charge || null;

  // Determine lot type label
  const typeLabel = {
    'multi-storey': 'Parking Garage',
    'underground': 'Underground Garage',
    'rooftop': 'Rooftop Lot',
    'surface': 'Parking Lot',
  }[lotType] || 'Parking Lot';

  // Private / restricted access
  if (access === 'private' || access === 'no') {
    return {
      status: 'no_parking',
      label: `Private ${typeLabel}`,
      color: 'red',
      icon: '🚫',
      note: `This is a private ${typeLabel.toLowerCase()}. Unauthorized vehicles are subject to immediate tow at owner's expense.`,
      lotType,
      operator,
      opening_hours,
      capacity,
      isLot: true,
      towImmediate: true,
    };
  }

  // Customers only
  if (access === 'customers' || access === 'destination') {
    return {
      status: 'permit',
      label: `Customers Only — ${typeLabel}`,
      color: 'purple',
      icon: '🪧',
      note: `${typeLabel} reserved for customers. Non-customer vehicles may be towed without notice.`,
      lotType,
      operator,
      opening_hours,
      capacity,
      isLot: true,
    };
  }

  // Paid parking
  if (fee === 'yes') {
    return {
      status: 'metered',
      label: `Paid ${typeLabel}`,
      color: 'blue',
      icon: '🅿️',
      note: charge ? `Rate: ${charge}` : `This is a paid ${typeLabel.toLowerCase()}. Pay at machine or attendant before leaving.`,
      lotType,
      operator,
      opening_hours,
      capacity,
      charge,
      isLot: true,
    };
  }

  // Free with time limit
  if (fee === 'no' && maxstay) {
    return {
      status: 'time_limited',
      label: `Free ${typeLabel} — ${maxstay} Limit`,
      color: 'yellow',
      icon: '⏱️',
      maxstay,
      note: `Free parking with a ${maxstay} time limit. Overstay may result in a ticket or tow.`,
      lotType,
      operator,
      opening_hours,
      capacity,
      isLot: true,
    };
  }

  // Free parking lot (no fee tag or fee=no)
  if (fee === 'no' || fee === 'free') {
    return {
      status: 'allowed',
      label: `Free ${typeLabel}`,
      color: 'green',
      icon: '✅',
      note: `Free public ${typeLabel.toLowerCase()}. No fee required.`,
      lotType,
      operator,
      opening_hours,
      capacity,
      isLot: true,
    };
  }

  // Has time limit but no explicit fee tag
  if (maxstay) {
    return {
      status: 'time_limited',
      label: `${typeLabel} — ${maxstay} Limit`,
      color: 'yellow',
      icon: '⏱️',
      maxstay,
      note: `Time limit: ${maxstay}. Check signs for fee information.`,
      lotType,
      operator,
      opening_hours,
      capacity,
      isLot: true,
    };
  }

  // Unknown fee / general lot
  return {
    status: 'advisory',
    label: typeLabel,
    color: 'blue',
    icon: 'ℹ️',
    note: `${typeLabel}${opening_hours ? ` · Hours: ${opening_hours}` : ''}${capacity ? ` · ${capacity}` : ''}. Check signs for fee and time limits.`,
    lotType,
    operator,
    opening_hours,
    capacity,
    isLot: true,
  };
}

function parseOSMRestrictions(elements) {
  if (!elements || !Array.isArray(elements) || elements.length === 0) return null;

  // ── Pass 1: explicit street-level restrictions (highest priority) ───────────
  for (const el of elements) {
    if (!el?.tags) continue;
    const t = el.tags;
    if (t.amenity === 'parking') continue; // handled in pass 2

    // Lane-level tags
    const laneValues = [
      t['parking:lane:right'],
      t['parking:lane:left'],
      t['parking:lane:both'],
    ].filter(Boolean);

    for (const v of laneValues) {
      if (v === 'no_stopping') return { status: 'no_stopping', label: 'No Stopping', color: 'red', icon: '🚫' };
      if (v === 'no_parking')  return { status: 'no_parking',  label: 'No Parking',  color: 'red', icon: '🚫' };
      if (v === 'no_standing') return { status: 'no_standing', label: 'No Standing', color: 'red', icon: '🚫' };
      if (v === 'parallel' || v === 'diagonal' || v === 'perpendicular') {
        return { status: 'allowed', label: 'Street Parking Allowed', color: 'green', icon: '✅' };
      }
    }

    // Condition tags
    const cond = t['parking:condition'] || t['parking:condition:right'] || t['parking:condition:left'];
    if (cond === 'no_parking') return { status: 'no_parking', label: 'No Parking', color: 'red', icon: '🚫' };
    if (cond === 'time_limited') {
      const maxstay = t['parking:condition:maxstay'] || t.maxstay;
      return { status: 'time_limited', label: maxstay ? `${maxstay} Limit` : 'Time Limited', color: 'yellow', icon: '⏱️', maxstay };
    }
    if (cond === 'free')      return { status: 'allowed',  label: 'Free Street Parking', color: 'green',  icon: '✅' };
    if (cond === 'ticket')    return { status: 'metered',  label: 'Metered Parking',      color: 'blue',   icon: '🅿️' };
    if (cond === 'residents') return { status: 'permit',   label: 'Permit Required',       color: 'yellow', icon: '🪧' };
  }

  // ── Pass 2: parking lot / area tags (fallback when no street rules found) ──
  for (const el of elements) {
    if (!el?.tags) continue;
    if (el.tags.amenity === 'parking') {
      return parseParkingLotTags(el.tags);
    }
  }

  return null;
}

/**
 * Produce a parking verdict from OSM elements + state code.
 */
export function computeVerdict(osmElements, stateCode, cityName) {
  const osmResult = parseOSMRestrictions(osmElements);
  const stateLaw = STATE_LAWS[stateCode] || null;

  // City-specific override: look up lowercase city name in CITY_LAWS
  const cityKey = cityName?.toLowerCase().trim() || '';
  const cityLaw = stateCode ? (CITY_LAWS[stateCode] || {})[cityKey] || null : null;
  // Merge city overrides on top of state law so tow/overnight/notes can differ
  const effectiveLaw = (stateLaw && cityLaw)
    ? { ...stateLaw, ...cityLaw }
    : stateLaw;

  if (osmResult) {
    return {
      ...osmResult,
      source: 'OpenStreetMap',
      stateLaw: effectiveLaw,
      cityName,
    };
  }

  // No OSM-specific data — return a city/state-based advisory
  if (effectiveLaw) {
    return {
      status: 'advisory',
      label: 'Check Local Signs',
      color: 'blue',
      icon: 'ℹ️',
      source: cityLaw ? 'City Parking Database' : 'State Law Database',
      stateLaw: effectiveLaw,
      cityName,
      note: effectiveLaw.notes,
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

  // Private lot: highest possible risk — tow is immediate with no notice
  if (verdict?.towImmediate || (verdict?.isLot && status === 'no_parking')) {
    score += 10;
    factors.push('Private lot — unauthorized vehicles towed immediately');
  } else if (status === 'no_parking' || status === 'no_stopping' || status === 'no_standing') {
    score += 8;
    factors.push('Posted no-parking zone');
  } else if (status === 'permit') {
    if (verdict?.isLot) {
      score += 7;
      factors.push('Customers-only lot — non-customer vehicles towed');
    } else {
      score += 6;
      factors.push('Permit-only zone');
    }
  } else if (status === 'time_limited') {
    score += 4;
    factors.push(verdict?.isLot
      ? `Parking lot time limit: ${verdict.maxstay || 'check signs'}`
      : 'Time-restricted street');
  } else if (status === 'metered') {
    score += verdict?.isLot ? 5 : 3;
    factors.push(verdict?.isLot ? 'Paid lot — unpaid/overstayed vehicles towed' : 'Metered zone — overstay risk');
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
