import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import styles from './MapView.module.css';

// Fix default leaflet icon paths (Vite build issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom icon factory
function makeIcon(emoji, color = '#1a56db') {
  return L.divIcon({
    html: `<div style="
      background:${color};
      border:2px solid white;
      border-radius:50%;
      width:32px;height:32px;
      display:flex;align-items:center;justify-content:center;
      font-size:15px;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
    ">${emoji}</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

const verdictColors = {
  allowed: '#059669',
  time_limited: '#d97706',
  metered: '#2563eb',
  permit: '#7c3aed',
  no_parking: '#dc2626',
  no_stopping: '#dc2626',
  no_standing: '#dc2626',
  advisory: '#2563eb',
  unknown: '#6b7280',
};

// Sub-component that handles map clicks
function ClickHandler({ onMapClick }) {
  const map = useMap();
  useEffect(() => {
    map.on('click', onMapClick);
    return () => map.off('click', onMapClick);
  }, [map, onMapClick]);
  return null;
}

// Sub-component that flies to a new center
function FlyTo({ center }) {
  const map = useMap();
  const prevRef = useRef(null);
  useEffect(() => {
    if (!center) return;
    const key = `${center.lat},${center.lon}`;
    if (prevRef.current === key) return;
    prevRef.current = key;
    map.flyTo([center.lat, center.lon], map.getZoom() < 14 ? 16 : map.getZoom(), { duration: 1.2 });
  }, [center, map]);
  return null;
}

export default function MapView({ userLocation, mapCenter, activePin, nearbyParking, towCompanies, verdict, onMapClick }) {
  const circleColor = verdict ? verdictColors[verdict.status] || '#6b7280' : '#1a56db';

  return (
    <div className={styles.mapWrapper}>
      <MapContainer
        center={[mapCenter.lat, mapCenter.lon]}
        zoom={16}
        className={styles.map}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomright" />
        <ClickHandler onMapClick={onMapClick} />
        <FlyTo center={activePin || userLocation} />

        {/* User location */}
        {userLocation && (
          <>
            <Circle
              center={[userLocation.lat, userLocation.lon]}
              radius={60}
              pathOptions={{ color: circleColor, fillColor: circleColor, fillOpacity: 0.15, weight: 2 }}
            />
            <Marker
              position={[userLocation.lat, userLocation.lon]}
              icon={makeIcon('🙋', circleColor)}
            >
              <Popup>
                <strong>You are here</strong>
                <br />
                <small style={{ color: '#6b7280' }}>{userLocation.lat.toFixed(5)}, {userLocation.lon.toFixed(5)}</small>
              </Popup>
            </Marker>
          </>
        )}

        {/* Active pin (clicked location) */}
        {activePin && (
          <>
            <Circle
              center={[activePin.lat, activePin.lon]}
              radius={60}
              pathOptions={{ color: circleColor, fillColor: circleColor, fillOpacity: 0.15, weight: 2, dashArray: '6 4' }}
            />
            <Marker
              position={[activePin.lat, activePin.lon]}
              icon={makeIcon('📍', circleColor)}
            >
              <Popup>
                <strong>Checking this spot</strong>
                <br />
                <small style={{ color: '#6b7280' }}>{activePin.lat.toFixed(5)}, {activePin.lon.toFixed(5)}</small>
              </Popup>
            </Marker>
          </>
        )}

        {/* Nearby parking garages */}
        {nearbyParking.map(p => (
          <Marker
            key={p.id}
            position={[p.lat, p.lon]}
            icon={makeIcon('🏢', '#2563eb')}
          >
            <Popup>
              <div style={{ minWidth: 160 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.6 }}>
                  <div>Type: {p.type === 'multi-storey' ? '🏢 Garage' : p.type === 'underground' ? '🌑 Underground' : '🅿️ Lot'}</div>
                  {p.fee !== 'unknown' && <div>Fee: {p.fee === 'yes' ? 'Paid' : p.fee === 'no' ? 'Free' : p.fee}</div>}
                  {p.capacity && <div>Capacity: {p.capacity} spots</div>}
                  {p.opening_hours && <div>Hours: {p.opening_hours}</div>}
                  {p.operator && <div>Operator: {p.operator}</div>}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Tow companies */}
        {towCompanies.slice(0, 15).map(c => (
          <Marker
            key={c.id}
            position={[c.lat, c.lon]}
            icon={makeIcon('🚛', '#dc2626')}
          >
            <Popup>
              <div style={{ minWidth: 160 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.6 }}>
                  {c.phone && <div>📞 <a href={`tel:${c.phone}`}>{c.phone}</a></div>}
                  {c.opening_hours && <div>⏰ {c.opening_hours}</div>}
                  {c.website && <div>🌐 <a href={c.website} target="_blank" rel="noopener noreferrer">Website</a></div>}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map legend */}
      <div className={styles.legend}>
        <div className={styles.legendItem}><span className={styles.dot} style={{ background: '#059669' }}></span>You</div>
        <div className={styles.legendItem}><span className={styles.dot} style={{ background: '#2563eb' }}></span>Garage</div>
        <div className={styles.legendItem}><span className={styles.dot} style={{ background: '#dc2626' }}></span>Tow Co.</div>
      </div>

      <div className={styles.clickHint}>Click anywhere on the map to check parking</div>
    </div>
  );
}
