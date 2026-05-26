import styles from './StateLawPanel.module.css';
import { STATE_LAWS } from '../services/parkingRules';

export default function StateLawPanel({ stateLaw, geocodeInfo }) {
  const law = stateLaw || (geocodeInfo?.stateCode ? STATE_LAWS[geocodeInfo.stateCode] : null);

  if (!law) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>⚖️</div>
        <p>Move to a location to see state parking laws.</p>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.stateHeader}>
        <div className={styles.stateEmoji}>🏛️</div>
        <div>
          <div className={styles.stateName}>{law.name}</div>
          <div className={styles.stateLabel}>Parking & Tow Regulations</div>
        </div>
      </div>

      <div className={styles.rows}>
        <LawRow icon="🚛" label="Tow Warning" value={law.towWarning} highlight="red" />
        <LawRow icon="🌙" label="Overnight Parking" value={law.overnight} />
        <LawRow icon="🧹" label="Street Cleaning Laws" value={law.streetCleaning ? 'Yes — active in this state' : 'No statewide mandate'} highlight={law.streetCleaning ? 'yellow' : 'green'} />
        <LawRow icon="🪧" label="Residential Permit Zones" value={law.permitZones ? 'Yes — look for RPP/permit signs' : 'No permit zones reported'} highlight={law.permitZones ? 'yellow' : 'green'} />
        <LawRow icon="📋" label="Notes & Special Rules" value={law.notes} highlight="blue" />
      </div>

      <div className={styles.allStates}>
        <div className={styles.allStatesTitle}>All 50 States + DC</div>
        <div className={styles.stateGrid}>
          {Object.entries(STATE_LAWS).map(([code, l]) => (
            <div
              key={code}
              className={`${styles.stateChip} ${code === geocodeInfo?.stateCode ? styles.stateChipActive : ''}`}
              title={l.name}
            >
              {code}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LawRow({ icon, label, value, highlight }) {
  const bgMap = {
    red: { bg: 'var(--red-light)', border: '#fecaca', text: 'var(--red)' },
    yellow: { bg: 'var(--yellow-light)', border: '#fde68a', text: 'var(--yellow)' },
    green: { bg: 'var(--green-light)', border: '#a7f3d0', text: 'var(--green)' },
    blue: { bg: 'var(--blue-light)', border: '#bfdbfe', text: 'var(--blue)' },
  };
  const style = highlight ? bgMap[highlight] : null;

  return (
    <div
      className={styles.row}
      style={style ? { background: style.bg, borderColor: style.border } : {}}
    >
      <div className={styles.rowIcon}>{icon}</div>
      <div className={styles.rowContent}>
        <div className={styles.rowLabel} style={style ? { color: style.text } : {}}>{label}</div>
        <div className={styles.rowValue}>{value}</div>
      </div>
    </div>
  );
}
