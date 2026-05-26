import { useState, useEffect, useCallback, useRef } from 'react';
import MapView from './components/MapView';
import ParkingStatus from './components/ParkingStatus';
import NearbyParking from './components/NearbyParking';
import TowCompanies from './components/TowCompanies';
import StateLawPanel from './components/StateLawPanel';
import Header from './components/Header';
import LoadingOverlay from './components/LoadingOverlay';
import NotificationBanner from './components/NotificationBanner';
import styles from './styles/App.module.css';
import { fetchNearbyParking, fetchNearbyTowCompanies, fetchParkingRestrictions, distanceM } from './services/overpass';
import { computeVerdict, reverseGeocode } from './services/parkingRules';
import { requestPermission, notifyParkingStatus } from './services/notifications';

const DEFAULT_LOCATION = { lat: 40.7580, lon: -73.9855 }; // Times Square, NYC

export default function App() {
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_LOCATION);
  const [activePin, setActivePin] = useState(null); // user-clicked map location

  const [locationLoading, setLocationLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  const [verdict, setVerdict] = useState(null);
  const [geocodeInfo, setGeocodeInfo] = useState(null);
  const [restrictions, setRestrictions] = useState([]);
  const [nearbyParking, setNearbyParking] = useState([]);
  const [towCompanies, setTowCompanies] = useState([]);

  const [activeTab, setActiveTab] = useState('status'); // status | parking | tow | law
  const [notification, setNotification] = useState(null);
  const [notifPermission, setNotifPermission] = useState('default');

  const lastFetchRef = useRef(null);

  // ── Request notification permission on mount ──
  useEffect(() => {
    requestPermission().then(setNotifPermission);
  }, []);

  // ── Geolocation ──
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationLoading(false);
      setUserLocation(DEFAULT_LOCATION);
      setMapCenter(DEFAULT_LOCATION);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setUserLocation(loc);
        setMapCenter(loc);
        setLocationLoading(false);
      },
      () => {
        setUserLocation(DEFAULT_LOCATION);
        setMapCenter(DEFAULT_LOCATION);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );

    // Watch position
    const watchId = navigator.geolocation.watchPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setUserLocation(prev => {
          if (!prev || distanceM(prev.lat, prev.lon, loc.lat, loc.lon) > 20) {
            return loc;
          }
          return prev;
        });
      },
      () => {},
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // ── Fetch data when the query location changes ──
  const queryLocation = activePin || userLocation;

  const fetchAllData = useCallback(async (loc) => {
    if (!loc) return;
    const key = `${loc.lat.toFixed(4)},${loc.lon.toFixed(4)}`;
    if (lastFetchRef.current === key) return;
    lastFetchRef.current = key;

    setDataLoading(true);
    try {
      const [geoInfo, restrictionData, parkingData, towData] = await Promise.allSettled([
        reverseGeocode(loc.lat, loc.lon),
        fetchParkingRestrictions(loc.lat, loc.lon),
        fetchNearbyParking(loc.lat, loc.lon, 1000),
        fetchNearbyTowCompanies(loc.lat, loc.lon, 5000),
      ]);

      const geo = geoInfo.status === 'fulfilled' ? geoInfo.value : {};
      const restr = restrictionData.status === 'fulfilled' ? restrictionData.value : [];
      const parking = parkingData.status === 'fulfilled' ? parkingData.value : [];
      const tow = towData.status === 'fulfilled' ? towData.value : [];

      setGeocodeInfo(geo);
      setRestrictions(restr);
      setNearbyParking(parking);
      setTowCompanies(tow);

      const v = computeVerdict(restr, geo.stateCode, geo.city);
      setVerdict(v);

      // Push notification
      notifyParkingStatus(v);

      // In-app notification
      if (v.status === 'no_parking' || v.status === 'no_stopping') {
        setNotification({ type: 'error', message: `🚫 No parking here! ${v.stateLaw?.towWarning || ''}` });
      } else if (v.status === 'time_limited') {
        setNotification({ type: 'warning', message: `⏱️ Time-limited parking: ${v.maxstay || 'see signs'}` });
      } else if (v.status === 'permit') {
        setNotification({ type: 'warning', message: '🪧 Permit required. Check for resident-only signs.' });
      } else if (v.status === 'allowed') {
        setNotification({ type: 'success', message: '✅ Parking appears to be allowed here.' });
      }
    } catch (err) {
      console.error('Data fetch error:', err);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (queryLocation) fetchAllData(queryLocation);
  }, [queryLocation, fetchAllData]);

  const handleMapClick = useCallback((latlng) => {
    setActivePin({ lat: latlng.lat, lon: latlng.lng });
    lastFetchRef.current = null; // force refresh
  }, []);

  const handleUseMyLocation = useCallback(() => {
    setActivePin(null);
    lastFetchRef.current = null;
  }, []);

  return (
    <div className={styles.app}>
      <Header
        notifPermission={notifPermission}
        onRequestNotif={() => requestPermission().then(setNotifPermission)}
        geocodeInfo={geocodeInfo}
      />

      {notification && (
        <NotificationBanner
          notification={notification}
          onClose={() => setNotification(null)}
        />
      )}

      <div className={styles.layout}>
        {/* ── Map ── */}
        <div className={styles.mapSection}>
          <MapView
            userLocation={userLocation}
            mapCenter={mapCenter}
            activePin={activePin}
            nearbyParking={nearbyParking}
            towCompanies={towCompanies}
            verdict={verdict}
            onMapClick={handleMapClick}
          />
          {activePin && (
            <button className={styles.myLocationBtn} onClick={handleUseMyLocation}>
              📍 Use My Location
            </button>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className={styles.sidebar}>
          <div className={styles.tabs}>
            {[
              { key: 'status', label: '🅿️ Status' },
              { key: 'parking', label: '🏢 Garages' },
              { key: 'tow', label: '🚛 Tow Info' },
              { key: 'law', label: '⚖️ Laws' },
            ].map(tab => (
              <button
                key={tab.key}
                className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className={styles.tabContent}>
            {locationLoading ? (
              <LoadingOverlay message="Locating you…" />
            ) : dataLoading ? (
              <LoadingOverlay message="Fetching parking data…" />
            ) : (
              <>
                {activeTab === 'status' && (
                  <ParkingStatus
                    verdict={verdict}
                    geocodeInfo={geocodeInfo}
                    queryLocation={queryLocation}
                    isPin={!!activePin}
                  />
                )}
                {activeTab === 'parking' && (
                  <NearbyParking
                    garages={nearbyParking}
                    userLocation={queryLocation}
                    geocodeInfo={geocodeInfo}
                  />
                )}
                {activeTab === 'tow' && (
                  <TowCompanies
                    companies={towCompanies}
                    stateLaw={verdict?.stateLaw}
                    userLocation={queryLocation}
                  />
                )}
                {activeTab === 'law' && (
                  <StateLawPanel
                    stateLaw={verdict?.stateLaw}
                    geocodeInfo={geocodeInfo}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
