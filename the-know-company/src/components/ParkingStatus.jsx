import styles from './ParkingStatus.module.css';

const STATUS_CONFIG = {
  allowed: {
    bg: 'var(--green-light)',
    border: 'var(--green)',
    textColor: 'var(--green)',
    badgeBg: 'var(--green)',
    answer: 'YES — Park Here',
    emoji: '✅',
  },
  time_limited: {
    bg: 'var(--yellow-light)',
    border: 'var(--yellow)',
    textColor: 'var(--yellow)',
    badgeBg: 'var(--yellow)',
    answer: 'LIMITED — Time Restriction',
    emoji: '⏱️',
  },
  metered: {
    bg: 'var(--blue-light)',
    border: 'var(--blue)',
    textColor: 'var(--blue)',
    badgeBg: 'var(--blue)',
    answer: 'METERED — Pay to Park',
    emoji: '🅿️',
  },
  permit: {
    bg: '#f3e8ff',
    border: '#7c3aed',
    textColor: '#7c3aed',
    badgeBg: '#7c3aed',
    answer: 'PERMIT REQUIRED',
    emoji: '🪧',
  },
  no_parking: {
    bg: 'var(--red-light)',
    border: 'var(--red)',
    textColor: 'var(--red)',
    badgeBg: 'var(--red)',
    answer: 'NO — Do Not Park',
    emoji: '🚫',
  },
  no_stopping: {
    bg: 'var(--red-light)',
    border: 'var(--red)',
    textColor: 'var(--red)',
    badgeBg: 'var(--red)',
    answer: 'NO STOPPING',
    emoji: '🚫',
  },
  no_standing: {
    bg: 'var(--red-light)',
    border: 'var(--red)',
    textColor: 'var(--red)',
    badgeBg: 'var(--red)',
    answer: 'NO STANDING',
    emoji: '🚫',
  },
  advisory: {
    bg: 'var(--blue-light)',
    border: 'var(--blue)',
    textColor: 'var(--blue)',
    badgeBg: 'var(--blue)',
    answer: 'CHECK LOCAL SIGNS',
    emoji: 'ℹ️',
  },
  unknown: {
    bg: 'var(--gray-100)',
    border: 'var(--gray-400)',
    textColor: 'var(--gray-600)',
    badgeBg: 'var(--gray-400)',
    answer: 'UNKNOWN',
    emoji: '❓',
  },
};

export default function ParkingStatus({ verdict, geocodeInfo, queryLocation, isPin }) {
  if (!verdict) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>🗺️</div>
        <p>Move the map or tap a location to check parking rules.</p>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[verdict.status] || STATUS_CONFIG.unknown;

  return (
    <div className={styles.panel}>
      {/* Big verdict card */}
      <div
        className={styles.verdictCard}
        style={{
          background: cfg.bg,
          borderColor: cfg.border,
        }}
      >
        <div className={styles.verdictEmoji}>{cfg.emoji}</div>
        <div className={styles.verdictAnswer} style={{ color: cfg.textColor }}>{cfg.answer}</div>
        {verdict.maxstay && (
          <div className={styles.maxstay} style={{ background: cfg.badgeBg }}>
            {verdict.maxstay} maximum stay
          </div>
        )}
        {isPin && <div className={styles.pinNote}>📍 Checking clicked location</div>}
      </div>

      {/* Location info */}
      {geocodeInfo?.city && (
        <div className={styles.locationInfo}>
          <span className={styles.locationIcon}>📍</span>
          <div>
            <div className={styles.locationMain}>
              {geocodeInfo.city}{geocodeInfo.stateCode ? `, ${geocodeInfo.stateCode}` : ''}
            </div>
            {queryLocation && (
              <div className={styles.coords}>{queryLocation.lat.toFixed(5)}, {queryLocation.lon.toFixed(5)}</div>
            )}
          </div>
        </div>
      )}

      {/* Data source */}
      <div className={styles.sourceRow}>
        <span className={styles.sourceLabel}>Data Source</span>
        <span className={styles.sourceValue}>{verdict.source}</span>
      </div>

      {/* Note / advisory */}
      {verdict.note && (
        <div className={styles.noteCard}>
          <div className={styles.noteTitle}>📋 Local Advisory</div>
          <div className={styles.noteText}>{verdict.note}</div>
        </div>
      )}

      {/* Tow risk */}
      {verdict.stateLaw?.towWarning && (
        <div className={styles.towCard}>
          <div className={styles.towTitle}>🚛 Tow Risk</div>
          <div className={styles.towText}>{verdict.stateLaw.towWarning}</div>
        </div>
      )}

      {/* Overnight info */}
      {verdict.stateLaw?.overnight && (
        <div className={styles.infoRow}>
          <span className={styles.infoIcon}>🌙</span>
          <div>
            <div className={styles.infoLabel}>Overnight Parking</div>
            <div className={styles.infoValue}>{verdict.stateLaw.overnight}</div>
          </div>
        </div>
      )}

      {/* Street cleaning */}
      {verdict.stateLaw?.streetCleaning && (
        <div className={styles.infoRow}>
          <span className={styles.infoIcon}>🧹</span>
          <div>
            <div className={styles.infoLabel}>Street Cleaning</div>
            <div className={styles.infoValue}>Active in this state — check posted signs for schedule</div>
          </div>
        </div>
      )}

      {/* Permit zones */}
      {verdict.stateLaw?.permitZones && (
        <div className={styles.infoRow}>
          <span className={styles.infoIcon}>🪧</span>
          <div>
            <div className={styles.infoLabel}>Permit Zones</div>
            <div className={styles.infoValue}>Residential permit zones exist — look for RPP signs</div>
          </div>
        </div>
      )}
    </div>
  );
}
