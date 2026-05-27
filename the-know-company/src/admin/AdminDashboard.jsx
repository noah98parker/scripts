import { useState, useEffect, useCallback } from 'react';
import styles from './AdminDashboard.module.css';

// ── City coverage data (mirrors CITY_LAWS in parkingRules.js) ────────────────

const CITY_COVERAGE = [
  { state: 'FL', city: 'St. Petersburg',   notes: 'Downtown meters, Tropicana Field bans, overnight permit zones' },
  { state: 'FL', city: 'Tampa',             notes: 'Channelside / Ybor City events, Amalie Arena bans' },
  { state: 'FL', city: 'Miami',             notes: 'South Beach 1h, street cleaning Mon & Thu' },
  { state: 'FL', city: 'Miami Beach',       notes: 'No overnight beach parking, 2h residential limit' },
  { state: 'FL', city: 'Orlando',           notes: '2h downtown limit, theme park ban radius' },
  { state: 'FL', city: 'Fort Lauderdale',   notes: 'Las Olas / beach meter zones' },
  { state: 'FL', city: 'Jacksonville',      notes: 'Downtown metered core, Sports Complex bans' },
  { state: 'FL', city: 'Gainesville',       notes: 'Permit zones near UF campus' },
  { state: 'FL', city: 'Tallahassee',       notes: 'Capitol area restrictions, FSU zone permits' },
  { state: 'FL', city: 'Key West',          notes: 'Old Town paid lots, heavy meter enforcement' },
  { state: 'FL', city: 'Naples',            notes: '3h downtown meter limit' },
  { state: 'FL', city: 'Sarasota',          notes: '2h downtown meters, overnight seasonal bans' },
  { state: 'CA', city: 'Los Angeles',       notes: 'Street cleaning 2x/week, permit zones citywide' },
  { state: 'CA', city: 'San Francisco',     notes: 'Street cleaning strictly enforced, SFpark meters' },
  { state: 'CA', city: 'San Diego',         notes: '2h downtown limit, Gaslamp meter zone' },
  { state: 'CA', city: 'Santa Monica',      notes: 'Permit zones near beach, 1h on commercial streets' },
  { state: 'CA', city: 'San Jose',          notes: 'Downtown meters enforced until 8pm' },
  { state: 'NY', city: 'New York City',     notes: 'Alternate-side parking, heavy meter enforcement' },
  { state: 'IL', city: 'Chicago',           notes: 'Street cleaning Apr–Nov, permit zones by ward' },
  { state: 'TX', city: 'Austin',            notes: '2h 6th St, meter zone downtown core' },
  { state: 'TX', city: 'Houston',           notes: 'Midtown / Montrose meter zones' },
  { state: 'WA', city: 'Seattle',           notes: 'Paid zones until 8pm, RPP neighborhoods' },
  { state: 'MA', city: 'Boston',            notes: 'Resident permit required near Fenway & Downtown' },
  { state: 'GA', city: 'Atlanta',           notes: '2h Buckhead, meter zones Midtown & Downtown' },
  { state: 'CO', city: 'Denver',            notes: 'LoDo meter zone, Colfax permit area' },
];

// ── Key status card ───────────────────────────────────────────────────────────

function ApiKeyRow({ label, keyName, configured, onTest }) {
  const [testState, setTestState] = useState(null); // null | 'loading' | { ok, latency, error }

  async function handleTest() {
    setTestState('loading');
    try {
      const res  = await fetch('/api/admin/test', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          Authorization:   `Bearer ${sessionStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({ api: keyName }),
      });
      const data = await res.json();
      setTestState(data);
    } catch {
      setTestState({ ok: false, error: 'Network error' });
    }
  }

  return (
    <div className={styles.keyRow}>
      <div className={styles.keyLeft}>
        <span className={configured ? styles.dotGreen : styles.dotRed} />
        <div>
          <div className={styles.keyLabel}>{label}</div>
          <div className={styles.keyEnv}>{keyName === 'google' ? 'GOOGLE_PLACES_KEY' : 'ANTHROPIC_API_KEY'}</div>
        </div>
      </div>

      <div className={styles.keyRight}>
        {testState === 'loading' && (
          <span className={styles.testBadge} style={{ background: '#1e293b', color: '#94a3b8' }}>Testing…</span>
        )}
        {testState && testState !== 'loading' && (
          <span
            className={styles.testBadge}
            style={{
              background: testState.ok ? '#052e16' : '#450a0a',
              color:      testState.ok ? '#86efac' : '#fca5a5',
            }}
          >
            {testState.ok ? `✓ ${testState.latency}ms` : `✗ ${testState.error}`}
          </span>
        )}
        {configured && (
          <button className={styles.testBtn} onClick={handleTest} disabled={testState === 'loading'}>
            Test →
          </button>
        )}
        <span className={configured ? styles.statusOn : styles.statusOff}>
          {configured ? 'Configured' : 'Missing'}
        </span>
      </div>
    </div>
  );
}

// ── Feature grid ─────────────────────────────────────────────────────────────

function FeatureCard({ icon, label, enabled }) {
  return (
    <div className={`${styles.featureCard} ${enabled ? styles.featureOn : styles.featureOff}`}>
      <span className={styles.featureIcon}>{icon}</span>
      <span className={styles.featureLabel}>{label}</span>
      <span className={enabled ? styles.featureBadgeOn : styles.featureBadgeOff}>
        {enabled ? 'Active' : 'Inactive'}
      </span>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────

export default function AdminDashboard({ token, onLogout }) {
  const [status, setStatus]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/admin/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { onLogout(); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, onLogout]);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const envLabel = status?.env === 'production' ? 'Production' :
                   status?.env === 'preview'    ? 'Preview'    :
                                                  'Local Dev';
  const envColor = status?.env === 'production' ? '#059669' :
                   status?.env === 'preview'    ? '#d97706' : '#6b7280';

  const activeFeatures = status
    ? Object.values(status.features).filter(f => f.enabled).length
    : 0;

  return (
    <div className={styles.shell}>
      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <span className={styles.sidebarLogoEmoji}>🅿️</span>
          <div>
            <div className={styles.sidebarTitle}>Know Co.</div>
            <div className={styles.sidebarSub}>Admin</div>
          </div>
        </div>

        <nav className={styles.nav}>
          <a href="#overview"   className={`${styles.navLink} ${styles.navActive}`}>📊 Overview</a>
          <a href="#api-keys"   className={styles.navLink}>🔑 API Keys</a>
          <a href="#features"   className={styles.navLink}>⚡ Features</a>
          <a href="#cities"     className={styles.navLink}>🏙️ City Coverage</a>
        </nav>

        <button className={styles.logoutBtn} onClick={onLogout}>
          ← Sign Out
        </button>
      </aside>

      {/* ── Main content ── */}
      <main className={styles.content}>
        {/* Top bar */}
        <div className={styles.topbar}>
          <div>
            <div className={styles.topbarTitle}>Dashboard</div>
            {status?.timestamp && (
              <div className={styles.topbarSub}>
                Last checked {new Date(status.timestamp).toLocaleTimeString()}
              </div>
            )}
          </div>
          <div className={styles.topbarRight}>
            {status && (
              <span className={styles.envBadge} style={{ background: envColor + '22', color: envColor, borderColor: envColor + '44' }}>
                {envLabel}
              </span>
            )}
            <button className={styles.refreshBtn} onClick={loadStatus} disabled={loading}>
              {loading ? '↻' : '↻ Refresh'}
            </button>
          </div>
        </div>

        {error && (
          <div className={styles.errorBanner}>⚠ {error}</div>
        )}

        {loading && !status ? (
          <div className={styles.loadingState}>Loading dashboard…</div>
        ) : status && (
          <>
            {/* ── Overview stat cards ── */}
            <section id="overview" className={styles.statRow}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>🔑</div>
                <div className={styles.statValue}>
                  {[status.keys.google_places, status.keys.anthropic].filter(Boolean).length} / 2
                </div>
                <div className={styles.statLabel}>API Keys Configured</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>⚡</div>
                <div className={styles.statValue}>{activeFeatures} / {Object.keys(status.features).length}</div>
                <div className={styles.statLabel}>Features Active</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>🏙️</div>
                <div className={styles.statValue}>{CITY_COVERAGE.length}</div>
                <div className={styles.statLabel}>Cities with Custom Data</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>🌐</div>
                <div className={styles.statValue}>{status.region !== 'unknown' ? status.region.toUpperCase() : '—'}</div>
                <div className={styles.statLabel}>Vercel Region</div>
              </div>
            </section>

            {/* ── API Keys ── */}
            <section id="api-keys" className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>🔑 API Keys</div>
                <div className={styles.sectionSub}>Keys are read from Vercel Environment Variables — never exposed to users</div>
              </div>
              <div className={styles.card}>
                <ApiKeyRow
                  label="Google Places"
                  keyName="google"
                  configured={status.keys.google_places}
                />
                <div className={styles.keyDivider} />
                <ApiKeyRow
                  label="Anthropic (Claude)"
                  keyName="anthropic"
                  configured={status.keys.anthropic}
                />

                {(!status.keys.google_places || !status.keys.anthropic) && (
                  <div className={styles.setupNote}>
                    <strong>How to add a missing key:</strong> Go to your Vercel project → Settings → Environment Variables → Add New.
                    Keys take effect on the next deployment.
                  </div>
                )}
              </div>
            </section>

            {/* ── Features ── */}
            <section id="features" className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>⚡ Features</div>
                <div className={styles.sectionSub}>Features activate automatically when the required keys are present</div>
              </div>
              <div className={styles.featureGrid}>
                {Object.entries(status.features).map(([key, f]) => (
                  <FeatureCard key={key} icon={f.icon} label={f.label} enabled={f.enabled} />
                ))}
              </div>
            </section>

            {/* ── City Coverage ── */}
            <section id="cities" className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>🏙️ City Coverage</div>
                <div className={styles.sectionSub}>
                  Cities with custom parking rules in the database. Adding cities requires a code deploy.
                </div>
              </div>
              <div className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>State</th>
                      <th>City</th>
                      <th>Coverage Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CITY_COVERAGE.map((c, i) => (
                      <tr key={i}>
                        <td><span className={styles.stateBadge}>{c.state}</span></td>
                        <td className={styles.cityName}>{c.city}</td>
                        <td className={styles.coverageNotes}>{c.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
