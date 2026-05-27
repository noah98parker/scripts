import { useState, useEffect } from 'react';
import styles from './StreetViewSigns.module.css';

// ── Module-level cache so tab-switching doesn't re-fetch ──────────────────────
const signCache = new Map();

function cacheKey(loc) {
  return `${loc.lat.toFixed(4)},${loc.lon.toFixed(4)}`;
}

// ── Restriction type display config ──────────────────────────────────────────

const TYPE_CFG = {
  no_parking:      { emoji: '🚫', label: 'No Parking',      color: '#dc2626', bg: '#fee2e2' },
  time_limit:      { emoji: '⏱️', label: 'Time Limit',      color: '#d97706', bg: '#fef3c7' },
  street_cleaning: { emoji: '🧹', label: 'Street Cleaning', color: '#7c3aed', bg: '#ede9fe' },
  permit:          { emoji: '🪧', label: 'Permit Zone',      color: '#2563eb', bg: '#dbeafe' },
  tow_away:        { emoji: '🚛', label: 'Tow Away',         color: '#dc2626', bg: '#fee2e2' },
  meter:           { emoji: '🅿️', label: 'Metered',          color: '#0891b2', bg: '#cffafe' },
  loading:         { emoji: '📦', label: 'Loading Zone',     color: '#059669', bg: '#d1fae5' },
  other:           { emoji: 'ℹ️', label: 'Sign',              color: '#6b7280', bg: '#f3f4f6' },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function StreetViewSigns({ location }) {
  const key = location ? cacheKey(location) : null;

  const [state, setState] = useState(() => {
    if (key && signCache.has(key)) return { loading: false, data: signCache.get(key) };
    return { loading: !!key, data: null };
  });

  useEffect(() => {
    if (!key) return;

    // Serve from cache if we already have it for this location
    if (signCache.has(key)) {
      setState({ loading: false, data: signCache.get(key) });
      return;
    }

    let cancelled = false;
    setState({ loading: true, data: null });

    fetch(`/api/street-view-signs?lat=${location.lat}&lon=${location.lon}`)
      .then(r => r.json())
      .then(data => {
        signCache.set(key, data);
        if (!cancelled) setState({ loading: false, data });
      })
      .catch(() => {
        if (!cancelled) setState({ loading: false, data: null });
      });

    return () => { cancelled = true; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!location) return null;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (state.loading) {
    return (
      <div className={styles.section}>
        <div className={styles.header}>
          <span>📷 Street View Signs</span>
        </div>
        <div className={styles.loading}>
          <span className={styles.loadingSpinner}>🔍</span> Scanning nearby street signs…
        </div>
      </div>
    );
  }

  const d = state.data;

  // No coverage or error — render nothing (don't clutter the UI)
  if (!d || d.no_coverage || (!d.signs_found && !d.restrictions?.length)) return null;

  const imgUrl = `/api/street-view-image?lat=${location.lat}&lon=${location.lon}&heading=0`;

  const confidenceStyle =
    d.confidence === 'high'   ? { bg: '#d1fae5', color: '#065f46' } :
    d.confidence === 'medium' ? { bg: '#fef3c7', color: '#92400e' } :
                                { bg: '#f3f4f6', color: '#374151' };

  return (
    <div className={styles.section}>
      {/* Header */}
      <div className={styles.header}>
        <span>📷 Street View Signs</span>
        {d.confidence && (
          <span
            className={styles.confidenceBadge}
            style={{ background: confidenceStyle.bg, color: confidenceStyle.color }}
          >
            {d.confidence} confidence
          </span>
        )}
      </div>

      {/* Street View thumbnail — loaded via secure proxy */}
      <div className={styles.imageWrap}>
        <img
          className={styles.svImage}
          src={imgUrl}
          alt="Street View"
          loading="lazy"
          onError={e => { e.currentTarget.parentElement.style.display = 'none'; }}
        />
        <span className={styles.imageBadge}>© Google Street View</span>
      </div>

      {/* Plain-English summary */}
      {d.summary && (
        <div className={styles.summary}>{d.summary}</div>
      )}

      {/* Restriction cards */}
      {d.signs_found && d.restrictions?.length > 0 ? (
        <div className={styles.restrictionList}>
          {d.restrictions.map((r, i) => {
            const cfg = TYPE_CFG[r.type] || TYPE_CFG.other;
            return (
              <div
                key={i}
                className={styles.restrictionCard}
                style={{ borderColor: cfg.color, background: cfg.bg }}
              >
                <div className={styles.restrictionHeader}>
                  <span>{cfg.emoji}</span>
                  <span className={styles.restrictionType} style={{ color: cfg.color }}>
                    {cfg.label}
                  </span>
                </div>
                {r.text && (
                  <div className={styles.restrictionText}>"{r.text}"</div>
                )}
                <div className={styles.restrictionMeta}>
                  {r.times && <span>⏰ {r.times}</span>}
                  {r.days  && <span>📅 {r.days}</span>}
                  {r.notes && <span>ℹ️ {r.notes}</span>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.noSigns}>No parking restriction signs clearly visible</div>
      )}
    </div>
  );
}
