import { useState, useEffect } from 'react';
import { getGoogleApiKey, setGoogleApiKey } from '../services/googlePlaces';
import styles from './SettingsModal.module.css';

export default function SettingsModal({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getGoogleApiKey());
      setSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function handleSave() {
    setGoogleApiKey(apiKey.trim());
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 800);
  }

  function handleClear() {
    setGoogleApiKey('');
    setApiKey('');
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>⚙️ Settings</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Google Places API Key */}
        <section className={styles.section}>
          <div className={styles.sectionTitle}>
            <span>🗺️ Google Places API</span>
            <span className={`${styles.badge} ${getGoogleApiKey() ? styles.badgeActive : styles.badgeOff}`}>
              {getGoogleApiKey() ? 'Active' : 'Not set'}
            </span>
          </div>
          <p className={styles.sectionDesc}>
            Adds real garage names, ratings, and hours from Google Maps on top of free OpenStreetMap data.
          </p>
          <div className={styles.inputRow}>
            <input
              className={styles.input}
              type="password"
              placeholder="AIza…"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            {apiKey && (
              <button className={styles.clearBtn} onClick={handleClear} title="Clear key">
                ✕
              </button>
            )}
          </div>
          <a
            className={styles.link}
            href="https://developers.google.com/maps/documentation/places/web-service/get-api-key"
            target="_blank"
            rel="noopener noreferrer"
          >
            How to get a free API key ↗
          </a>
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
            No key required.
          </p>
          <div className={styles.cityList}>
            {[
              { city: 'New York City', icon: '🗽', api: 'NYC Open Data (Socrata)' },
              { city: 'Los Angeles',   icon: '🌴', api: 'LA City Open Data (Socrata)' },
              { city: 'Chicago',       icon: '🌬️', api: 'Chicago Data Portal (Socrata)' },
            ].map(c => (
              <div key={c.city} className={styles.cityRow}>
                <span>{c.icon} <strong>{c.city}</strong></span>
                <span className={styles.apiLabel}>{c.api}</span>
              </div>
            ))}
          </div>
        </section>

        {/* OpenStreetMap note */}
        <section className={styles.section}>
          <div className={styles.sectionTitle}>
            <span>🌐 OpenStreetMap</span>
            <span className={`${styles.badge} ${styles.badgeActive}`}>Always On</span>
          </div>
          <p className={styles.sectionDesc}>
            Worldwide coverage via Overpass API — tow companies, parking garages, restriction nodes. Free, no key needed.
          </p>
        </section>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button
            className={`${styles.saveBtn} ${saved ? styles.saveBtnSuccess : ''}`}
            onClick={handleSave}
          >
            {saved ? '✓ Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
