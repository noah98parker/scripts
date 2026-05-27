import styles from './NearbyParking.module.css';
import { distanceM } from '../services/overpass';
import { estimateRate } from '../services/parkingRules';

const TYPE_ICONS = {
  'multi-storey': '🏢',
  'underground': '🌑',
  'rooftop': '🏠',
  'surface': '🅿️',
};

const SOURCE_BADGES = {
  google:      { label: 'Google', color: '#4285f4', bg: '#e8f0fe' },
  city_data:   { label: 'City Data', color: '#059669', bg: '#d1fae5' },
  default:     { label: 'OSM', color: '#6b7280', bg: '#f3f4f6' },
};

function formatDist(m) {
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m / 1609.34).toFixed(1)}mi`;
}

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

function StarRating({ rating }) {
  if (!rating) return null;
  const stars = Math.round(rating);
  return (
    <span className={styles.stars}>
      {'★'.repeat(stars)}{'☆'.repeat(5 - stars)} {rating.toFixed(1)}
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

export default function NearbyParking({ garages, cityMeters = [], userLocation, geocodeInfo }) {
  const hasGarages = garages && garages.length > 0;
  const hasMeters  = cityMeters && cityMeters.length > 0;

  if (!hasGarages && !hasMeters) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>🏢</div>
        <p>No nearby parking found within 1km.</p>
        <p className={styles.tip}>
          Add a Google Places API key (⚙️) for richer results, or try clicking a different area on the map.
        </p>
      </div>
    );
  }

  const sorted = hasGarages
    ? [...garages].sort((a, b) => {
        if (!userLocation) return 0;
        return distanceM(userLocation.lat, userLocation.lon, a.lat, a.lon)
          - distanceM(userLocation.lat, userLocation.lon, b.lat, b.lon);
      })
    : [];

  const googleCount = sorted.filter(g => g.source === 'google').length;
  const osmCount    = sorted.filter(g => g.source !== 'google').length;

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

      {/* Garages / lots section */}
      {hasGarages && (
        <>
          <div className={styles.sectionHeader}>
            <h2 className={styles.heading}>Nearby Parking</h2>
            <div className={styles.countGroup}>
              {osmCount > 0    && <span className={styles.count}>{osmCount} OSM</span>}
              {googleCount > 0 && <span className={styles.countGoogle}>{googleCount} Google</span>}
            </div>
          </div>

          <div className={styles.list}>
            {sorted.map(garage => {
              const dist = userLocation
                ? distanceM(userLocation.lat, userLocation.lon, garage.lat, garage.lon)
                : null;
              const rate = estimateRate(garage, geocodeInfo?.city);
              const icon = TYPE_ICONS[garage.type] || '🅿️';

              return (
                <div key={garage.id} className={styles.card}>
                  <div className={styles.cardTop}>
                    <div className={styles.cardIcon}>{icon}</div>
                    <div className={styles.cardInfo}>
                      <div className={styles.cardNameRow}>
                        <div className={styles.cardName}>{garage.name}</div>
                        <SourceBadge source={garage.source} />
                      </div>
                      <div className={styles.cardMeta}>
                        {dist !== null && <span className={styles.dist}>📍 {formatDist(dist)}</span>}
                        <span className={styles.type}>
                          {garage.type === 'multi-storey' ? 'Garage'
                            : garage.type === 'underground' ? 'Underground'
                            : 'Lot'}
                        </span>
                        {garage.rating && <StarRating rating={garage.rating} />}
                      </div>
                    </div>
                    <div className={styles.rateBlock}>
                      <div className={styles.rateLabel}>Est. Rate</div>
                      {rate.tier === 'free' ? (
                        <div className={styles.rateFree}>FREE</div>
                      ) : (
                        <div className={styles.rateValue}>{rate.hourly}</div>
                      )}
                    </div>
                  </div>

                  <div className={styles.cardDetails}>
                    {garage.opening_hours && (
                      <div className={styles.detail}>
                        <span className={styles.detailIcon}>⏰</span>
                        <span>{garage.opening_hours}</span>
                      </div>
                    )}
                    {garage.capacity && (
                      <div className={styles.detail}>
                        <span className={styles.detailIcon}>🚗</span>
                        <span>{garage.capacity} spaces</span>
                      </div>
                    )}
                    {garage.vicinity && (
                      <div className={styles.detail}>
                        <span className={styles.detailIcon}>📍</span>
                        <span>{garage.vicinity}</span>
                      </div>
                    )}
                    {garage.operator && (
                      <div className={styles.detail}>
                        <span className={styles.detailIcon}>🏢</span>
                        <span>{garage.operator}</span>
                      </div>
                    )}
                    {garage.maxstay && (
                      <div className={styles.detail}>
                        <span className={styles.detailIcon}>⏱️</span>
                        <span>Max stay: {garage.maxstay}</span>
                      </div>
                    )}
                    {rate.tier !== 'free' && (
                      <div className={styles.rateRow}>
                        <div className={styles.rateItem}>
                          <div className={styles.ratePeriod}>Hourly</div>
                          <div className={styles.rateNum}>{rate.hourly}</div>
                        </div>
                        <div className={styles.rateDivider}></div>
                        <div className={styles.rateItem}>
                          <div className={styles.ratePeriod}>Daily Max</div>
                          <div className={styles.rateNum}>{rate.daily}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <a
                    className={styles.directionsBtn}
                    href={`https://www.google.com/maps/dir/?api=1&destination=${garage.lat},${garage.lon}${garage.place_id ? `&destination_place_id=${garage.place_id}` : ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    🗺️ Get Directions
                  </a>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
