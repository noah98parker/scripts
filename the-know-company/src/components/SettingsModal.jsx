import styles from './SettingsModal.module.css';

export default function SettingsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>⚙️ Data Sources</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Sign Decoder */}
        <section className={styles.section}>
          <div className={styles.sectionTitle}>
            <span>📸 AI Sign Decoder</span>
            <span className={`${styles.badge} ${styles.badgeActive}`}>Always On</span>
          </div>
          <p className={styles.sectionDesc}>
            Point your camera at any confusing parking sign — AI reads it in plain English and tells you tow risk, time limits, and exactly when you can park.
          </p>
        </section>

        {/* Google Places */}
        <section className={styles.section}>
          <div className={styles.sectionTitle}>
            <span>🗺️ Google Places</span>
            <span className={`${styles.badge} ${styles.badgeActive}`}>Always On</span>
          </div>
          <p className={styles.sectionDesc}>
            Real garage names, ratings, and hours from Google Maps layered on top of OpenStreetMap data.
          </p>
        </section>

        {/* City Open Data */}
        <section className={styles.section}>
          <div className={styles.sectionTitle}>
            <span>🏙️ City Open Data</span>
            <span className={`${styles.badge} ${styles.badgeActive}`}>Always On</span>
          </div>
          <p className={styles.sectionDesc}>
            Real parking meter locations from city databases — automatically enabled in{' '}
            <strong>New York City</strong>, <strong>Los Angeles</strong>, and <strong>Chicago</strong>.
          </p>
          <div className={styles.cityList}>
            {[
              { city: 'New York City', icon: '🗽', api: 'NYC Open Data' },
              { city: 'Los Angeles',   icon: '🌴', api: 'LA City Open Data' },
              { city: 'Chicago',       icon: '🌬️', api: 'Chicago Data Portal' },
            ].map(c => (
              <div key={c.city} className={styles.cityRow}>
                <span>{c.icon} <strong>{c.city}</strong></span>
                <span className={styles.apiLabel}>{c.api}</span>
              </div>
            ))}
          </div>
        </section>

        {/* OpenStreetMap */}
        <section className={styles.section}>
          <div className={styles.sectionTitle}>
            <span>🌐 OpenStreetMap</span>
            <span className={`${styles.badge} ${styles.badgeActive}`}>Always On</span>
          </div>
          <p className={styles.sectionDesc}>
            Worldwide parking restrictions, tow companies, and garages via the Overpass API. No account required.
          </p>
        </section>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
