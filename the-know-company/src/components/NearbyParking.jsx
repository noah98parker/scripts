import styles from './NearbyParking.module.css';
import { distanceM, } from '../services/overpass';
import { estimateRate } from '../services/parkingRules';

const TYPE_ICONS = {
  'multi-storey': '🏢',
  'underground': '🌑',
  'rooftop': '🏠',
  'surface': '🅿️',
};

function formatDist(m) {
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m / 1609.34).toFixed(1)}mi`;
}

export default function NearbyParking({ garages, userLocation, geocodeInfo }) {
  if (!garages || garages.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>🏢</div>
        <p>No nearby parking garages found in OpenStreetMap within 1km.</p>
        <p className={styles.tip}>Try clicking on a different area or zoom into a city center.</p>
      </div>
    );
  }

  const sorted = [...garages].sort((a, b) => {
    if (!userLocation) return 0;
    return distanceM(userLocation.lat, userLocation.lon, a.lat, a.lon)
      - distanceM(userLocation.lat, userLocation.lon, b.lat, b.lon);
  });

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Nearby Parking</h2>
        <span className={styles.count}>{garages.length} found</span>
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
                  <div className={styles.cardName}>{garage.name}</div>
                  <div className={styles.cardMeta}>
                    {dist !== null && <span className={styles.dist}>📍 {formatDist(dist)}</span>}
                    <span className={styles.type}>{garage.type === 'multi-storey' ? 'Garage' : garage.type === 'underground' ? 'Underground' : 'Lot'}</span>
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
                href={`https://www.google.com/maps/dir/?api=1&destination=${garage.lat},${garage.lon}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                🗺️ Get Directions
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
