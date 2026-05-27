import styles from './Header.module.css';

export default function Header({ notifPermission, onRequestNotif, geocodeInfo, onOpenSettings }) {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🅿️</span>
        </div>
        <div>
          <h1 className={styles.title}>The Know Company</h1>
          <p className={styles.tagline}>Know before you park.</p>
        </div>
      </div>

      <div className={styles.center}>
        {geocodeInfo?.display && (
          <div className={styles.locationChip}>
            <span>📍</span>
            <span className={styles.locationText}>
              {geocodeInfo.city || 'Location'}{geocodeInfo.stateCode ? `, ${geocodeInfo.stateCode}` : ''}
            </span>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        {notifPermission !== 'granted' && notifPermission !== 'unsupported' && (
          <button className={styles.notifBtn} onClick={onRequestNotif}>
            🔔 Enable Alerts
          </button>
        )}
        {notifPermission === 'granted' && (
          <span className={styles.notifActive}>🔔 Alerts On</span>
        )}
        <button
          className={styles.settingsBtn}
          onClick={onOpenSettings}
          title="Data Sources"
        >
          ⚙️
        </button>
      </div>
    </header>
  );
}
