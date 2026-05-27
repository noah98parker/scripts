import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useParkingStore } from '../../stores/parkingStore';
import { useAuthStore } from '../../stores/authStore';
import { fetchParkingRestrictions, fetchNearbyParking, fetchNearbyTowCompanies } from '../../services/overpass';
import { reverseGeocode, computeVerdict } from '../../services/parkingRules';
import { fetchGooglePlacesParking } from '../../services/googlePlaces';
import { fetchCityParkingData } from '../../services/cityOpenData';
import TimerModal from '../../components/TimerModal';
import { colors, spacing, radius, font, shadow } from '../../constants/theme';

const DEFAULT_REGION = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

const VERDICT_STYLES = {
  allowed: { bg: colors.greenLight, text: colors.green, emoji: '✅', label: 'Parking Allowed' },
  restricted: { bg: colors.yellowLight, text: colors.yellow, emoji: '⚠️', label: 'Restrictions Apply' },
  prohibited: { bg: colors.redLight, text: colors.red, emoji: '🚫', label: 'No Parking' },
  unknown: { bg: colors.blueLight, text: colors.blue, emoji: '❓', label: 'Unknown' },
};

export default function MapScreen() {
  const mapRef = useRef(null);
  const locationWatcher = useRef(null);

  const {
    userLocation, setUserLocation,
    activePin, setActivePin,
    verdict, setVerdict,
    nearbyParking, setNearbyParking,
    towCompanies, setTowCompanies,
    favorites, addFavorite, removeFavorite,
    activeTimers, startTimer,
    dataLoading, setDataLoading,
    geocodeInfo, setGeocodeInfo,
    setCityMeters,
  } = useParkingStore();

  const { isAuthenticated, supabase } = useAuthStore();

  const [timerVisible, setTimerVisible] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Start location tracking
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      locationWatcher.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000,
          distanceInterval: 20,
        },
        (loc) => {
          setUserLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        }
      );
    })();

    return () => {
      locationWatcher.current?.remove();
    };
  }, []);

  // Check favorite status when activePin changes
  useEffect(() => {
    if (!activePin || !favorites) return;
    const key = `${activePin.latitude.toFixed(5)},${activePin.longitude.toFixed(5)}`;
    setIsFavorite(favorites.some(f => f.key === key));
  }, [activePin, favorites]);

  // Fetch data when pin changes
  useEffect(() => {
    if (!activePin) return;
    fetchDataForPin(activePin);
  }, [activePin]);

  const fetchDataForPin = useCallback(async (pin) => {
    setDataLoading(true);
    try {
      const results = await Promise.allSettled([
        fetchParkingRestrictions(pin.latitude, pin.longitude),
        reverseGeocode(pin.latitude, pin.longitude),
        fetchNearbyParking(pin.latitude, pin.longitude),
        fetchGooglePlacesParking(pin.latitude, pin.longitude),
        fetchCityParkingData(pin.latitude, pin.longitude),
        fetchNearbyTowCompanies(pin.latitude, pin.longitude),
      ]);

      const restrictions = results[0].status === 'fulfilled' ? results[0].value : null;
      const geoInfo = results[1].status === 'fulfilled' ? results[1].value : null;
      const osmParking = results[2].status === 'fulfilled' ? results[2].value : [];
      const googleParking = results[3].status === 'fulfilled' ? results[3].value : [];
      const cityData = results[4].status === 'fulfilled' ? results[4].value : null;
      const tows = results[5].status === 'fulfilled' ? results[5].value : [];

      if (geoInfo) setGeocodeInfo(geoInfo);
      if (tows) setTowCompanies(tows);

      const allParking = [
        ...osmParking,
        ...googleParking,
        ...(cityData?.garages || []),
      ];
      setNearbyParking(allParking);
      if (cityData?.meters) setCityMeters(cityData.meters);

      const computedVerdict = computeVerdict(restrictions, geoInfo, cityData);
      setVerdict(computedVerdict);
    } catch (err) {
      console.warn('fetchDataForPin error:', err);
    } finally {
      setDataLoading(false);
    }
  }, []);

  const handleMapPress = (e) => {
    const { coordinate } = e.nativeEvent;
    setActivePin(coordinate);
  };

  const handleMyLocation = () => {
    setActivePin(null);
    setVerdict(null);
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  };

  const handleToggleFavorite = async () => {
    if (!activePin) return;
    const key = `${activePin.latitude.toFixed(5)},${activePin.longitude.toFixed(5)}`;
    const spotName = geocodeInfo?.address || `${activePin.latitude.toFixed(4)}, ${activePin.longitude.toFixed(4)}`;

    if (isFavorite) {
      await removeFavorite(key);
      setIsFavorite(false);
    } else {
      await addFavorite({
        key,
        name: spotName,
        address: geocodeInfo?.address || '',
        latitude: activePin.latitude,
        longitude: activePin.longitude,
      });
      setIsFavorite(true);
    }
  };

  const handleStartTimer = (durationMinutes) => {
    if (!activePin) return;
    const spotName = geocodeInfo?.address || 'Parking Spot';
    startTimer({
      spotName,
      latitude: activePin.latitude,
      longitude: activePin.longitude,
      durationMinutes,
      startedAt: Date.now(),
    });
    setTimerVisible(false);
  };

  const verdictStyle = VERDICT_STYLES[verdict?.status] || VERDICT_STYLES.unknown;
  const spotName = geocodeInfo?.address || (activePin
    ? `${activePin.latitude.toFixed(4)}, ${activePin.longitude.toFixed(4)}`
    : 'Tap the map to check parking');

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={userLocation ? { ...userLocation, latitudeDelta: 0.01, longitudeDelta: 0.01 } : DEFAULT_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={handleMapPress}
      >
        {/* Active pin marker */}
        {activePin && (
          <Marker
            coordinate={activePin}
            pinColor={colors.primary}
            title="Selected Location"
          />
        )}

        {/* Nearby parking markers */}
        {nearbyParking.map((p, i) => (
          <Marker
            key={`parking-${i}`}
            coordinate={{ latitude: p.latitude, longitude: p.longitude }}
            title={p.name || 'Parking'}
            description={p.type}
          >
            <View style={styles.parkingMarker}>
              <Text style={styles.markerEmoji}>🏢</Text>
            </View>
          </Marker>
        ))}

        {/* Tow company markers */}
        {towCompanies.map((t, i) => (
          <Marker
            key={`tow-${i}`}
            coordinate={{ latitude: t.latitude, longitude: t.longitude }}
            title={t.name || 'Tow Company'}
          >
            <View style={styles.towMarker}>
              <Text style={styles.markerEmoji}>🚛</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Loading overlay */}
      {dataLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.loadingText}>Checking parking…</Text>
          </View>
        </View>
      )}

      {/* FAB — My Location */}
      <TouchableOpacity style={styles.myLocationFab} onPress={handleMyLocation} activeOpacity={0.8}>
        <Ionicons name="locate" size={20} color={colors.primary} />
        <Text style={styles.myLocationText}>My Location</Text>
      </TouchableOpacity>

      {/* Bottom status card */}
      <View style={[styles.statusCard, activePin && { backgroundColor: verdictStyle.bg }]}>
        {activePin && verdict ? (
          <>
            <View style={styles.verdictRow}>
              <Text style={styles.verdictEmoji}>{verdictStyle.emoji}</Text>
              <View style={styles.verdictInfo}>
                <Text style={[styles.verdictLabel, { color: verdictStyle.text }]}>{verdictStyle.label}</Text>
                <Text style={styles.spotName} numberOfLines={1}>{spotName}</Text>
                {verdict?.stateLaw?.towWarning && verdict.status === 'prohibited' && (
                  <Text style={styles.towWarning} numberOfLines={1}>
                    ⚠️ {verdict.stateLaw.towWarning}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setTimerVisible(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="timer-outline" size={16} color={colors.white} />
                <Text style={styles.actionButtonText}>Set Timer</Text>
              </TouchableOpacity>

              {isAuthenticated || supabase ? (
                <TouchableOpacity
                  style={[styles.actionButton, styles.saveButton]}
                  onPress={handleToggleFavorite}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isFavorite ? 'heart' : 'heart-outline'}
                    size={16}
                    color={isFavorite ? colors.red : colors.primary}
                  />
                  <Text style={[styles.actionButtonText, { color: isFavorite ? colors.red : colors.primary }]}>
                    {isFavorite ? 'Saved' : 'Save'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, styles.saveButton, styles.saveGuestButton]}
                  activeOpacity={0.6}
                  disabled
                >
                  <Ionicons name="heart-outline" size={16} color={colors.gray400} />
                  <Text style={[styles.actionButtonText, { color: colors.gray400 }]}>Sign in to save</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="map-outline" size={28} color={colors.gray400} />
            <Text style={styles.emptyCardText}>Tap anywhere on the map to check parking rules</Text>
          </View>
        )}
      </View>

      <TimerModal
        visible={timerVisible}
        onClose={() => setTimerVisible(false)}
        spotName={geocodeInfo?.address || 'Parking Spot'}
        onStart={handleStartTimer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  parkingMarker: {
    backgroundColor: colors.blueLight,
    borderRadius: 20,
    padding: 4,
    borderWidth: 1.5,
    borderColor: colors.blue,
  },
  towMarker: {
    backgroundColor: colors.redLight,
    borderRadius: 20,
    padding: 4,
    borderWidth: 1.5,
    borderColor: colors.red,
  },
  markerEmoji: {
    fontSize: 18,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    ...shadow.md,
  },
  loadingText: {
    fontSize: font.md,
    color: colors.gray700,
    fontWeight: '500',
  },
  myLocationFab: {
    position: 'absolute',
    top: 60,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    ...shadow.md,
    zIndex: 5,
  },
  myLocationText: {
    fontSize: font.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  statusCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    justifyContent: 'center',
    ...shadow.lg,
  },
  verdictRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  verdictEmoji: {
    fontSize: 40,
    lineHeight: 48,
  },
  verdictInfo: {
    flex: 1,
  },
  verdictLabel: {
    fontSize: font.xl,
    fontWeight: '800',
    marginBottom: 2,
  },
  spotName: {
    fontSize: font.md,
    color: colors.gray600,
    marginBottom: 2,
  },
  towWarning: {
    fontSize: font.sm,
    color: colors.red,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: font.md,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  saveGuestButton: {
    opacity: 0.7,
  },
  emptyCard: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyCardText: {
    fontSize: font.md,
    color: colors.gray500,
    textAlign: 'center',
  },
});
