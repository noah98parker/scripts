import { useState, useEffect, useRef } from 'react';
import styles from './NearbyParking.module.css';
import { estimateRate } from '../services/parkingRules';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDist(m) {
  if (m == null) return null;
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m / 1609.34).toFixed(1)} mi`;
}

// ── CityMeterCard (unchanged) ─────────────────────────────────────────────────

const SOURCE_BADGES = {
  google:    { label: 'Google',    color: '#4285f4', bg: '#e8f0fe' },
  city_data: { label: 'City Data', color: '#059669', bg: '#d1fae5' },
  default:   { label: 'OSM',       color: '#6b7280', bg: '#f3f4f6' },
};

function SourceBadge({ source }) {
  const cfg = SOURCE_BADGES[source] || SOURCE_BADGES.default;
  return (
    <span
      className={styles.sourceBadge}
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {cfg.label}
    </span>
  );
}

function CityMeterCard({ meter }) {
  return (
    <div className={styles.meterCard}>
      <div className={styles.meterTop}>
        <span className={styles.meterIcon}>🅿️</span>
        <div className={styles.meterInfo}>
          <div className={styles.meterName}>{meter.name}</div>
          <SourceBadge source="city_data" />
        </div>
      </div>
      <div className={styles.meterDetails}>
        {meter.timeLimit && (
          <div className={styles.detail}><span>⏱️</span> <span>Limit: {meter.timeLimit}</span></div>
        )}
        {meter.rate && (
          <div className={styles.detail}><span>💵</span> <span>Rate: {meter.rate}</span></div>
        )}
        {meter.activeHours && (
          <div className={styles.detail}><span>⏰</span> <span>{meter.activeHours}</span></div>
        )}
        {meter.meterType && (
          <div className={styles.detail}><span>🔧</span> <span>{meter.meterType}</span></div>
        )}
      </div>
    </div>
  );
}

// ── Enriched GarageCard (Google Places) ──────────────────────────────────────

function RatesDisplay({ garageId, website, name, garage, geocodeInfo }) {
  const [rateState, setRateState] = useState(
    website ? { loading: true, data: null } : { loading: false, data: null }
  );

  useEffect(() => {
    if (!website) return;
    let cancelled = false;
    const controller = new AbortController();
    const timerId = setTimeout(() => controller.abort(), 5000);

    fetch(
      `/api/parking-rates?website=${encodeURIComponent(website)}&name=${encodeURIComponent(name)}`,
      { signal: controller.signal }
    )
      .then((r) => r.json())
      .then((data) => {
        clearTimeout(timerId);
        if (!cancelled) setRateState({ loading: false, data });
      })
      .catch(() => {
        clearTimeout(timerId);
        if (!cancelled) setRateState({ loading: false, data: null });
      });

    return () => {
      cancelled = true;
      clearTimeout(timerId);
      controller.abort();
    };
  }, [website, name]);

  if (rateState.loading) {
    return <div className={styles.ratesLoading}>⏳ Loading rates...</div>;
  }

  const d = rateState.data;

  // Real scraped rates available
  if (d && d.found_rates) {
    return (
      <div className={styles.ratesRow}>
        {d.hourly     && <span className={styles.rateChip}>💵 {d.hourly}</span>}
        {d.daily_max  && <span className={styles.rateChip}>📅 {d.daily_max}</span>}
        {d.early_bird && <span className={styles.rateChip}>🌅 {d.early_bird}</span>}
        {d.evening    && <span className={styles.rateEveningChip}>🌙 {d.evening}</span>}
        {d.weekend    && <span className={styles.rateEveningChip}>📆 {d.weekend}</span>}
        {d.monthly    && <span className={styles.rateChip}>🗓️ {d.monthly}</span>}
        {d.validation && <span className={styles.rateChip}>✅ {d.validation}</span>}
        {d.notes      && <span className={styles.rateFallback}>{d.notes}</span>}
      </div>
    );
  }

  // Has website but no rates found — show link
  if (website) {
    return (
      <div className={styles.ratesRow}>
        <span className={styles.rateFallback}>
          💵 Check website for current rates
        </span>
      </div>
    );
  }

  // No website — fall back to heuristic estimate
  const rate = estimateRate(garage, geocodeInfo?.city);
  return (
    <div className={styles.ratesRow}>
      {rate.tier === 'free' ? (
        <span className={styles.rateChip}>💵 FREE</span>
      ) : (
        <span className={styles.rateFallback}>
          💵 Estimated: {rate.hourly}
        </span>
      )}
    </div>
  );
}

function GarageCard({ garage, geocodeInfo }) {
  const dist = formatDist(garage.distance_m);
  const hasWebsite = !!garage.website;

  return (
    <div className={styles.garageCard}>
      <div className={styles.garageTop}>
        <div className={styles.garageIcon}>🏢</div>
        <div className={styles.garageInfo}>
          <div className={styles.garageNameRow}>
            <div className={styles.garageName}>{garage.name}</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
              {dist && (
                <span className={styles.garageDistBadge}>{dist} away</span>
              )}
              {garage.open_now != null && (
                <span
                  className={`${styles.garageStatusBadge} ${
                    garage.open_now ? styles.garageStatusOpen : styles.garageStatusClosed
                  }`}
                >
                  {garage.open_now ? 'Open' : 'Closed'}
                </span>
              )}
            </div>
          </div>

          {garage.address && (
            <div className={styles.garageAddress}>{garage.address}</div>
          )}

          {(garage.rating != null) && (
            <div className={styles.garageRatingRow}>
              ★ {garage.rating.toFixed(1)}
              {garage.user_ratings_total != null && (
                <span className={styles.garageRatingCount}>
                  ({garage.user_ratings_total})
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Rates section */}
      <RatesDisplay
        garageId={garage.id}
        website={garage.website}
        name={garage.name}
        garage={garage}
        geocodeInfo={geocodeInfo}
      />

      {/* Action buttons */}
      <div className={styles.garageActions}>
        {hasWebsite && (
          <a
            className={styles.garageActionBtn}
            href={garage.website}
            target="_blank"
            rel="noopener noreferrer"
          >
            🌐 View Rates Website ↗
          </a>
        )}
        <a
          className={styles.garageActionBtn}
          href={garage.maps_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          🗺️ Directions ↗
        </a>
        {garage.phone && (
          <a
            className={`${styles.garageActionBtn} ${styles.garageActionBtnPhone}`}
            href={`tel:${garage.phone}`}
          >
            📞 Call
          </a>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function NearbyParking({ garages, cityMeters = [], userLocation, geocodeInfo, selectedGarageId, onGarageDeselect }) {
  const hasGarages = garages && garages.length > 0;
  const hasMeters  = cityMeters && cityMeters.length > 0;
  const garageRefs = useRef({});

  // Scroll to and highlight the selected garage whenever selectedGarageId changes
  useEffect(() => {
    if (!selectedGarageId) return;
    const el = garageRefs.current[selectedGarageId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedGarageId]);

  if (!hasGarages && !hasMeters) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>🏢</div>
        <p>No nearby parking found within 1.5km.</p>
        <p className={styles.tip}>
          Try clicking a different area on the map.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.panel}>

      {/* City meter section */}
      {hasMeters && (
        <>
          <div className={styles.sectionHeader}>
            <h2 className={styles.heading}>🏙️ City Parking Meters</h2>
            <span className={styles.count}>{cityMeters.length} nearby</span>
          </div>
          <div className={styles.list}>
            {cityMeters.map(m => <CityMeterCard key={m.id} meter={m} />)}
          </div>
        </>
      )}

      {/* Enriched garages section */}
      {hasGarages && (
        <>
          <div className={styles.sectionHeader}>
            <h2 className={styles.heading}>🏢 Nearby Garages</h2>
            <span className={styles.count}>{garages.length} found</span>
          </div>
          <div className={styles.list}>
            {garages.map(garage => {
              const isSelected = garage.id === selectedGarageId;
              return (
                <div
                  key={garage.id}
                  ref={el => { if (el) garageRefs.current[garage.id] = el; }}
                  className={isSelected ? styles.garageHighlight : undefined}
                  onClick={isSelected && onGarageDeselect ? onGarageDeselect : undefined}
                >
                  <GarageCard
                    garage={garage}
                    geocodeInfo={geocodeInfo}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
