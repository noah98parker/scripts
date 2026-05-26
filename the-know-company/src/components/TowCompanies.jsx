import styles from './TowCompanies.module.css';
import { distanceM } from '../services/overpass';

// Curated fallback list of major US towing chains / hotlines
const NATIONAL_TOW_INFO = [
  { name: 'AAA Roadside Assistance', phone: '1-800-222-4357', note: 'Members only. Available 24/7 nationwide.', icon: '🔵', type: 'membership' },
  { name: 'Agero (Ford/GM Assist)', phone: '1-800-367-3962', note: 'Through vehicle manufacturer programs.', icon: '🚗', type: 'oem' },
  { name: 'Allstate Roadside', phone: '1-800-255-7828', note: 'Allstate insurance policyholders.', icon: '🏠', type: 'insurance' },
  { name: 'GEICO Emergency Road Svc', phone: '1-800-424-3426', note: 'GEICO policyholders.', icon: '🦎', type: 'insurance' },
  { name: 'CoachNet (RV/Truck)', phone: '1-800-863-2620', note: 'Heavy-duty towing & RV service.', icon: '🚛', type: 'specialty' },
  { name: 'National General Assist', phone: '1-800-462-3343', note: '24/7 emergency tow dispatch.', icon: '🆘', type: 'insurance' },
];

function formatDist(m) {
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m / 1609.34).toFixed(1)}mi`;
}

export default function TowCompanies({ companies, stateLaw, userLocation }) {
  const sorted = [...(companies || [])].sort((a, b) => {
    if (!userLocation) return 0;
    return distanceM(userLocation.lat, userLocation.lon, a.lat, a.lon)
      - distanceM(userLocation.lat, userLocation.lon, b.lat, b.lon);
  });

  return (
    <div className={styles.panel}>
      {/* Tow law summary */}
      {stateLaw && (
        <div className={styles.lawCard}>
          <div className={styles.lawTitle}>⚖️ Local Tow Law — {stateLaw.name}</div>
          <div className={styles.lawDetail}>
            <span className={styles.lawIcon}>🚛</span>
            <span>{stateLaw.towWarning}</span>
          </div>
          {stateLaw.overnight && (
            <div className={styles.lawDetail}>
              <span className={styles.lawIcon}>🌙</span>
              <span>Overnight: {stateLaw.overnight}</span>
            </div>
          )}
        </div>
      )}

      {/* Local OSM tow companies */}
      {sorted.length > 0 && (
        <>
          <div className={styles.sectionHeader}>
            <h2 className={styles.heading}>Local Tow Companies</h2>
            <span className={styles.count}>{sorted.length} nearby</span>
          </div>

          <div className={styles.list}>
            {sorted.map(c => {
              const dist = userLocation
                ? distanceM(userLocation.lat, userLocation.lon, c.lat, c.lon)
                : null;
              return (
                <div key={c.id} className={styles.card}>
                  <div className={styles.cardIcon}>🚛</div>
                  <div className={styles.cardInfo}>
                    <div className={styles.cardName}>{c.name}</div>
                    {dist !== null && <div className={styles.dist}>📍 {formatDist(dist)} away</div>}
                    {c.phone && (
                      <a className={styles.phone} href={`tel:${c.phone}`}>📞 {c.phone}</a>
                    )}
                    {c.opening_hours && (
                      <div className={styles.hours}>⏰ {c.opening_hours}</div>
                    )}
                  </div>
                  <div className={styles.cardActions}>
                    {c.phone && (
                      <a className={styles.callBtn} href={`tel:${c.phone}`}>Call</a>
                    )}
                    <a
                      className={styles.dirBtn}
                      href={`https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >Map</a>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* National/fallback resources */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.heading}>National Tow Resources</h2>
      </div>

      {sorted.length === 0 && (
        <div className={styles.osmEmpty}>
          <p>No tow companies found in OpenStreetMap within 5km.</p>
          <p>Use the national resources below or search Google Maps for &quot;towing near me&quot;.</p>
        </div>
      )}

      <div className={styles.nationalList}>
        {NATIONAL_TOW_INFO.map(n => (
          <div key={n.name} className={styles.nationalCard}>
            <div className={styles.nationalIcon}>{n.icon}</div>
            <div className={styles.nationalInfo}>
              <div className={styles.nationalName}>{n.name}</div>
              <div className={styles.nationalNote}>{n.note}</div>
            </div>
            <a className={styles.callBtn} href={`tel:${n.phone}`}>{n.phone}</a>
          </div>
        ))}
      </div>
    </div>
  );
}
