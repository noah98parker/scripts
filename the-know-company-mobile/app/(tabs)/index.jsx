import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  ScrollView,
  Alert,
  Modal,
  Linking,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useParkingStore } from '../../stores/parkingStore';
import { useAuthStore } from '../../stores/authStore';
import {
  fetchParkingRestrictions,
  fetchNearbyParking,
  fetchNearbyTowCompanies,
} from '../../services/overpass';
import { reverseGeocode, computeVerdict, computeTowRisk } from '../../services/parkingRules';
import { fetchGooglePlacesParking } from '../../services/googlePlaces';
import { fetchCityParkingData } from '../../services/cityOpenData';
import { decodeSign } from '../../services/signDecoder';
import ParkingStatusCard from '../../components/ParkingStatusCard';
import TimerModal from '../../components/TimerModal';
import { colors, spacing, radius, font, shadow } from '../../constants/theme';

const DEFAULT_REGION = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
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
    startTimer,
    dataLoading, setDataLoading,
    geocodeInfo, setGeocodeInfo,
    setCityMeters,
  } = useParkingStore();

  const { isAuthenticated, supabase } = useAuthStore();

  const [timerVisible, setTimerVisible]     = useState(false);
  const [isFavorite, setIsFavorite]         = useState(false);
  const [towRisk, setTowRisk]               = useState(null);
  const [decoderVisible, setDecoderVisible] = useState(false);
  const [decoding, setDecoding]             = useState(false);
  const [decoderResult, setDecoderResult]   = useState('');
  const [decoderError, setDecoderError]     = useState('');
  const [enrichedGarages, setEnrichedGarages] = useState([]);
  // garageRates: { [garageId]: { loading: bool, data: object|null } }
  const [garageRates, setGarageRates]       = useState({});

  // ── Location tracking ──────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      locationWatcher.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 20 },
        (loc) => setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude })
      );
    })();
    return () => { locationWatcher.current?.remove(); };
  }, []);

  // ── Favorite status ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activePin || !favorites) return;
    const key = `${activePin.latitude.toFixed(5)},${activePin.longitude.toFixed(5)}`;
    setIsFavorite(favorites.some(f => f.key === key));
  }, [activePin, favorites]);

  // ── Fetch on pin change ────────────────────────────────────────────────────
  useEffect(() => {
    if (!activePin) return;
    fetchDataForPin(activePin);
  }, [activePin]);

  const fetchDataForPin = useCallback(async (pin) => {
    setDataLoading(true);
    setTowRisk(null);
    setEnrichedGarages([]);
    setGarageRates({});
    try {
      const apiBase = process.env.EXPO_PUBLIC_API_URL || '';

      const [
        restrictionRes, geoRes, osmParkingRes,
        googleParkingRes, cityDataRes, towsRes, enrichedRes,
      ] = await Promise.allSettled([
        fetchParkingRestrictions(pin.latitude, pin.longitude),
        reverseGeocode(pin.latitude, pin.longitude),
        fetchNearbyParking(pin.latitude, pin.longitude),
        fetchGooglePlacesParking(pin.latitude, pin.longitude),
        fetchCityParkingData(pin.latitude, pin.longitude),
        fetchNearbyTowCompanies(pin.latitude, pin.longitude),
        fetch(`${apiBase}/api/parking-search?lat=${pin.latitude}&lon=${pin.longitude}&radius=1500`).then(r => r.json()),
      ]);

      const restrictions  = restrictionRes.status  === 'fulfilled' ? restrictionRes.value  : [];
      const geoInfo       = geoRes.status           === 'fulfilled' ? geoRes.value           : null;
      const osmParking    = osmParkingRes.status    === 'fulfilled' ? osmParkingRes.value    : [];
      const googleParking = googleParkingRes.status === 'fulfilled' ? googleParkingRes.value : [];
      const cityData      = cityDataRes.status      === 'fulfilled' ? cityDataRes.value      : null;
      const tows          = towsRes.status          === 'fulfilled' ? towsRes.value          : [];
      const enriched      = enrichedRes.status      === 'fulfilled' ? (enrichedRes.value?.garages || []) : [];

      if (geoInfo) setGeocodeInfo(geoInfo);
      setTowCompanies(tows);

      setNearbyParking([
        ...osmParking,
        ...googleParking,
        ...(Array.isArray(cityData?.garages) ? cityData.garages : []),
      ]);
      if (cityData?.meters) setCityMeters(cityData.meters);

      // Set enriched garages and initialise per-garage rate loading state
      setEnrichedGarages(enriched);
      const initialRates = {};
      for (const g of enriched) {
        initialRates[g.id] = { loading: !!g.website, data: null };
      }
      setGarageRates(initialRates);

      // Kick off per-garage rate fetches
      for (const g of enriched) {
        if (!g.website) continue;
        const controller = new AbortController();
        const timerId = setTimeout(() => controller.abort(), 5000);
        fetch(
          `${apiBase}/api/parking-rates?website=${encodeURIComponent(g.website)}&name=${encodeURIComponent(g.name)}`,
          { signal: controller.signal }
        )
          .then(r => r.json())
          .then(data => {
            clearTimeout(timerId);
            setGarageRates(prev => ({ ...prev, [g.id]: { loading: false, data } }));
          })
          .catch(() => {
            clearTimeout(timerId);
            setGarageRates(prev => ({ ...prev, [g.id]: { loading: false, data: null } }));
          });
      }

      // ✅ Pass stateCode string + city string (not the full geoInfo object)
      const v = computeVerdict(
        restrictions,
        geoInfo?.stateCode ?? null,
        geoInfo?.city ?? null
      );
      setVerdict(v);
      setTowRisk(computeTowRisk(v, tows, pin));

    } catch (err) {
      console.warn('fetchDataForPin error:', err);
    } finally {
      setDataLoading(false);
    }
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleMapPress = (e) => setActivePin(e.nativeEvent.coordinate);

  const handleMyLocation = () => {
    setActivePin(null);
    setVerdict(null);
    setTowRisk(null);
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        { ...userLocation, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 500
      );
    }
  };

  const handleToggleFavorite = async () => {
    if (!activePin) return;
    const key = `${activePin.latitude.toFixed(5)},${activePin.longitude.toFixed(5)}`;
    const spotName = geocodeInfo?.address
      || `${activePin.latitude.toFixed(4)}, ${activePin.longitude.toFixed(4)}`;
    if (isFavorite) {
      await removeFavorite(key);
      setIsFavorite(false);
    } else {
      await addFavorite({ key, name: spotName, address: geocodeInfo?.address || '',
        latitude: activePin.latitude, longitude: activePin.longitude });
      setIsFavorite(true);
    }
  };

  const handleStartTimer = (durationMinutes) => {
    if (!activePin) return;
    startTimer({
      spotName: geocodeInfo?.address || 'Parking Spot',
      latitude: activePin.latitude,
      longitude: activePin.longitude,
      durationMinutes,
      startedAt: Date.now(),
    });
    setTimerVisible(false);
  };

  // ── Sign Decoder ──────────────────────────────────────────────────────────
  const openDecoder = async () => {
    setDecoderResult('');
    setDecoderError('');
    setDecoderVisible(true);
  };

  const runDecode = async (launchFn) => {
    const result = await launchFn();
    if (result.canceled) return;
    const uri = result.assets?.[0]?.uri;
    if (!uri) return;
    setDecoding(true);
    setDecoderError('');
    try {
      setDecoderResult(await decodeSign(uri));
    } catch (err) {
      setDecoderError(err.message || 'Could not decode the sign.');
    } finally {
      setDecoding(false);
    }
  };

  const handleCaptureSign = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera needed', 'Allow camera access to photograph parking signs.');
      return;
    }
    runDecode(() => ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 }));
  };

  const handlePickFromLibrary = () =>
    runDecode(() => ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 }));

  const spotName = geocodeInfo?.address
    || (activePin
      ? `${activePin.latitude.toFixed(4)}, ${activePin.longitude.toFixed(4)}`
      : 'Tap the map to check parking');

  return (
    <View style={styles.container}>

      {/* ── Map ── */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={userLocation
          ? { ...userLocation, latitudeDelta: 0.01, longitudeDelta: 0.01 }
          : DEFAULT_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={handleMapPress}
      >
        {activePin && <Marker coordinate={activePin} pinColor={colors.primary} title="Selected" />}

        {nearbyParking.map((p, i) => (
          <Marker key={`p-${i}`}
            coordinate={{ latitude: p.latitude ?? p.lat, longitude: p.longitude ?? p.lon }}
            title={p.name || 'Parking'}>
            <View style={styles.parkingMarker}><Text style={styles.markerEmoji}>🏢</Text></View>
          </Marker>
        ))}

        {towCompanies.map((t, i) => (
          <Marker key={`t-${i}`}
            coordinate={{ latitude: t.latitude ?? t.lat, longitude: t.longitude ?? t.lon }}
            title={t.name || 'Tow Company'}>
            <View style={styles.towMarker}><Text style={styles.markerEmoji}>🚛</Text></View>
          </Marker>
        ))}
      </MapView>

      {/* ── Loading pill ── */}
      {dataLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.loadingText}>Checking parking…</Text>
          </View>
        </View>
      )}

      {/* ── FABs ── */}
      <TouchableOpacity style={styles.myLocationFab} onPress={handleMyLocation} activeOpacity={0.8}>
        <Ionicons name="locate" size={18} color={colors.primary} />
        <Text style={styles.fabText}>My Location</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.decoderFab} onPress={openDecoder} activeOpacity={0.8}>
        <Text style={{ fontSize: 15 }}>📸</Text>
        <Text style={styles.fabText}>Decode Sign</Text>
      </TouchableOpacity>

      {/* ── Bottom status panel ── */}
      <View style={styles.statusPanel}>
        {activePin && verdict ? (
          <ScrollView
            style={styles.statusScroll}
            contentContainerStyle={styles.statusContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.spotName} numberOfLines={1}>{spotName}</Text>
            <ParkingStatusCard verdict={verdict} towRisk={towRisk} />
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => setTimerVisible(true)} activeOpacity={0.8}>
                <Ionicons name="timer-outline" size={16} color="#fff" />
                <Text style={styles.primaryBtnText}>Set Timer</Text>
              </TouchableOpacity>
              {isAuthenticated || supabase ? (
                <TouchableOpacity style={styles.secondaryBtn} onPress={handleToggleFavorite} activeOpacity={0.8}>
                  <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={16}
                    color={isFavorite ? colors.red : colors.primary} />
                  <Text style={[styles.secondaryBtnText, { color: isFavorite ? colors.red : colors.primary }]}>
                    {isFavorite ? 'Saved' : 'Save Spot'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={[styles.secondaryBtn, { opacity: 0.5 }]}>
                  <Ionicons name="heart-outline" size={16} color={colors.gray400} />
                  <Text style={[styles.secondaryBtnText, { color: colors.gray400 }]}>Sign in to save</Text>
                </View>
              )}
            </View>
          </ScrollView>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="map-outline" size={28} color={colors.gray400} />
            <Text style={styles.emptyText}>Tap anywhere on the map to check parking rules</Text>
            <TouchableOpacity style={styles.decoderPromptBtn} onPress={openDecoder}>
              <Text style={styles.decoderPromptText}>📸 Or decode a parking sign</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Timer Modal ── */}
      <TimerModal
        visible={timerVisible}
        onClose={() => setTimerVisible(false)}
        spotName={geocodeInfo?.address || 'Parking Spot'}
        onStart={handleStartTimer}
      />

      {/* ── Sign Decoder Modal ── */}
      <Modal visible={decoderVisible} animationType="slide"
        presentationStyle="pageSheet" onRequestClose={() => setDecoderVisible(false)}>
        <View style={styles.decoderModal}>
          <View style={styles.decoderHeader}>
            <Text style={styles.decoderTitle}>📸 Sign Decoder</Text>
            <TouchableOpacity onPress={() => setDecoderVisible(false)}>
              <Ionicons name="close" size={24} color={colors.gray700} />
            </TouchableOpacity>
          </View>
          <Text style={styles.decoderSub}>
            Point your camera at a confusing parking sign — AI reads it in plain English
          </Text>

          {!decoding && !decoderResult && !decoderError && (
            <View style={styles.decoderBtns}>
              <TouchableOpacity style={styles.decoderCameraBtn} onPress={handleCaptureSign} activeOpacity={0.8}>
                <Ionicons name="camera" size={28} color="#fff" />
                <Text style={styles.decoderCameraBtnText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.decoderLibraryBtn} onPress={handlePickFromLibrary} activeOpacity={0.8}>
                <Ionicons name="images" size={24} color={colors.primary} />
                <Text style={[styles.decoderCameraBtnText, { color: colors.primary }]}>Choose from Library</Text>
              </TouchableOpacity>
            </View>
          )}

          {decoding && (
            <View style={styles.decoderLoading}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={styles.decoderLoadingText}>Reading the sign…</Text>
            </View>
          )}

          {!!decoderResult && !decoding && (
            <ScrollView style={{ flex: 1 }}>
              <View style={styles.decoderResultCard}>
                <Text style={styles.decoderResultText}>{decoderResult}</Text>
              </View>
              <TouchableOpacity
                style={[styles.decoderCameraBtn, { marginTop: spacing.md }]}
                onPress={() => { setDecoderResult(''); setDecoderError(''); }}>
                <Text style={styles.decoderCameraBtnText}>📸 Decode Another Sign</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {!!decoderError && !decoding && (
            <View style={styles.decoderErrorCard}>
              <Text style={styles.decoderErrorTitle}>⚠️ Could not decode</Text>
              <Text style={styles.decoderErrorText}>{decoderError}</Text>
              {(decoderError.toLowerCase().includes('api') || decoderError.toLowerCase().includes('url')) && (
                <Text style={styles.decoderHelpText}>
                  Add EXPO_PUBLIC_API_URL=https://your-app.vercel.app to your .env file, then rebuild.
                </Text>
              )}
              <TouchableOpacity
                style={[styles.decoderCameraBtn, { marginTop: spacing.md }]}
                onPress={() => { setDecoderResult(''); setDecoderError(''); }}>
                <Text style={styles.decoderCameraBtnText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  parkingMarker: { backgroundColor: '#dbeafe', borderRadius: 20, padding: 4, borderWidth: 1.5, borderColor: '#2563eb' },
  towMarker: { backgroundColor: '#fee2e2', borderRadius: 20, padding: 4, borderWidth: 1.5, borderColor: '#dc2626' },
  markerEmoji: { fontSize: 18 },

  loadingOverlay: { position: 'absolute', top: 60, left: 0, right: 0, alignItems: 'center', zIndex: 10 },
  loadingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: radius.full,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md, gap: spacing.sm, ...shadow.md },
  loadingText: { fontSize: font.md, color: colors.gray700, fontWeight: '500' },

  myLocationFab: { position: 'absolute', top: 60, right: spacing.md, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: radius.full, paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    gap: spacing.xs, ...shadow.md, zIndex: 5 },
  decoderFab: { position: 'absolute', top: 112, right: spacing.md, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: radius.full, paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    gap: spacing.xs, ...shadow.md, zIndex: 5 },
  fabText: { fontSize: font.sm, fontWeight: '600', color: colors.gray700 },

  statusPanel: { position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: 400,
    backgroundColor: '#fff', borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, ...shadow.lg },
  statusScroll: { flex: 1 },
  statusContent: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xl + 16 },
  spotName: { fontSize: font.md, fontWeight: '600', color: colors.gray600 },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  primaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.sm, gap: spacing.xs },
  primaryBtnText: { color: '#fff', fontSize: font.md, fontWeight: '600' },
  secondaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.gray100, borderRadius: radius.md, paddingVertical: spacing.sm, gap: spacing.xs,
    borderWidth: 1, borderColor: colors.gray200 },
  secondaryBtnText: { fontSize: font.md, fontWeight: '600' },
  emptyCard: { alignItems: 'center', gap: spacing.sm, padding: spacing.lg },
  emptyText: { fontSize: font.md, color: colors.gray500, textAlign: 'center' },
  decoderPromptBtn: { marginTop: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.full },
  decoderPromptText: { fontSize: font.sm, color: colors.primary, fontWeight: '600' },

  decoderModal: { flex: 1, backgroundColor: '#fff', padding: spacing.lg },
  decoderHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  decoderTitle: { fontSize: font.xl, fontWeight: '800', color: colors.gray800 },
  decoderSub: { fontSize: font.md, color: colors.gray500, lineHeight: 20, marginBottom: spacing.lg },
  decoderBtns: { gap: spacing.sm },
  decoderCameraBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md, gap: spacing.sm },
  decoderLibraryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.gray100, borderRadius: radius.md, paddingVertical: spacing.md, gap: spacing.sm,
    borderWidth: 1, borderColor: colors.gray200 },
  decoderCameraBtnText: { fontSize: font.lg, fontWeight: '700', color: '#fff' },
  decoderLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  decoderLoadingText: { fontSize: font.lg, color: colors.gray600 },
  decoderResultCard: { backgroundColor: colors.gray50, borderRadius: radius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: colors.gray200 },
  decoderResultText: { fontSize: font.md, color: colors.gray700, lineHeight: 22 },
  decoderErrorCard: { backgroundColor: '#fee2e2', borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  decoderErrorTitle: { fontSize: font.lg, fontWeight: '700', color: colors.red },
  decoderErrorText: { fontSize: font.md, color: colors.red, lineHeight: 20 },
  decoderHelpText: { fontSize: font.sm, color: colors.gray600, lineHeight: 18,
    borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)', paddingTop: spacing.sm },
});
