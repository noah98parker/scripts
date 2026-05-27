import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  Switch,
  ScrollView,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useParkingStore } from '../../stores/parkingStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { colors, spacing, radius, font, shadow } from '../../constants/theme';

const TIMER_WARNINGS = [10, 15, 20];
const TIMER_DURATIONS = [
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '3 hours', value: 180 },
];

function TimerProgress({ startedAt, durationMinutes }) {
  const elapsed = (Date.now() - startedAt) / 1000 / 60;
  const progress = Math.min(elapsed / durationMinutes, 1);
  const remaining = Math.max(durationMinutes - elapsed, 0);
  const mins = Math.floor(remaining);
  const secs = Math.floor((remaining - mins) * 60);

  return (
    <View style={styles.timerProgress}>
      <View style={styles.timerProgressBar}>
        <View style={[styles.timerProgressFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.timerRemaining}>
        {mins}m {secs}s remaining
      </Text>
    </View>
  );
}

function FavoriteItem({ item, onNavigate, onDelete }) {
  const handleNavigate = () => {
    const url = `https://maps.google.com/maps?daddr=${item.latitude},${item.longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open Google Maps.');
    });
  };

  return (
    <View style={styles.favoriteCard}>
      <View style={styles.favoriteInfo}>
        <Ionicons name="location" size={18} color={colors.primary} style={{ marginRight: spacing.sm }} />
        <View style={styles.favoriteText}>
          <Text style={styles.favoriteName} numberOfLines={1}>{item.name || 'Saved Spot'}</Text>
          {item.address ? (
            <Text style={styles.favoriteAddress} numberOfLines={1}>{item.address}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.favoriteActions}>
        <TouchableOpacity style={styles.navigateButton} onPress={handleNavigate} activeOpacity={0.8}>
          <Ionicons name="navigate" size={14} color={colors.white} />
          <Text style={styles.navigateButtonText}>Navigate</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(item.key)}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={18} color={colors.red} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SettingsSection({ useCityData, setUseCityData, timerWarning, setTimerWarning, defaultDuration, setDefaultDuration, googleKey, setGoogleKey, onSaveKey }) {
  return (
    <View style={styles.settingsSection}>
      <Text style={styles.sectionTitle}>⚙️ Settings</Text>

      {/* City Open Data toggle */}
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Use City Open Data</Text>
          <Text style={styles.settingDescription}>Fetch parking data from city APIs when available</Text>
        </View>
        <Switch
          value={useCityData}
          onValueChange={setUseCityData}
          trackColor={{ false: colors.gray300, true: colors.primary }}
          thumbColor={colors.white}
        />
      </View>

      {/* Timer warning */}
      <View style={styles.settingBlock}>
        <Text style={styles.settingLabel}>Alert before expiry</Text>
        <Text style={styles.settingDescription}>Notify me X minutes before time is up</Text>
        <View style={styles.chipRow}>
          {TIMER_WARNINGS.map(mins => (
            <TouchableOpacity
              key={mins}
              style={[styles.chip, timerWarning === mins && styles.chipActive]}
              onPress={() => setTimerWarning(mins)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, timerWarning === mins && styles.chipTextActive]}>
                {mins} min
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Default timer duration */}
      <View style={styles.settingBlock}>
        <Text style={styles.settingLabel}>Default timer duration</Text>
        <View style={styles.chipRow}>
          {TIMER_DURATIONS.map(({ label, value }) => (
            <TouchableOpacity
              key={value}
              style={[styles.chip, defaultDuration === value && styles.chipActive]}
              onPress={() => setDefaultDuration(value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, defaultDuration === value && styles.chipTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Google Places API Key */}
      <View style={styles.settingBlock}>
        <Text style={styles.settingLabel}>Google Places API Key</Text>
        <Text style={styles.settingDescription}>Optional — enables richer garage data</Text>
        <View style={styles.keyInputRow}>
          <TextInput
            style={styles.keyInput}
            placeholder="AIza..."
            placeholderTextColor={colors.gray400}
            value={googleKey}
            onChangeText={setGoogleKey}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />
          <TouchableOpacity style={styles.saveKeyButton} onPress={onSaveKey} activeOpacity={0.8}>
            <Text style={styles.saveKeyButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.versionRow}>
        <Ionicons name="car" size={14} color={colors.gray400} />
        <Text style={styles.versionText}>The Know Company v1.0.0</Text>
      </View>
    </View>
  );
}

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { favorites, removeFavorite, activeTimers, cancelTimer } = useParkingStore();
  const {
    useCityData, setUseCityData,
    timerWarningMinutes, setTimerWarningMinutes,
    defaultDurationMinutes, setDefaultDurationMinutes,
  } = useSettingsStore();

  const [googleKey, setGoogleKey] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const key = await SecureStore.getItemAsync('google_places_key');
        if (key) setGoogleKey(key);
      } catch {}
    })();
  }, []);

  const handleSaveKey = async () => {
    try {
      await SecureStore.setItemAsync('google_places_key', googleKey.trim());
      Alert.alert('Saved', 'Google Places API key saved securely.');
    } catch {
      Alert.alert('Error', 'Could not save the API key.');
    }
  };

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const handleDeleteFavorite = (key) => {
    Alert.alert('Remove Favorite', 'Remove this saved spot?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeFavorite(key) },
    ]);
  };

  const handleCancelTimer = (timerId) => {
    Alert.alert('Cancel Timer', 'Cancel this parking timer?', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Cancel Timer', style: 'destructive', onPress: () => cancelTimer(timerId) },
    ]);
  };

  const settingsProps = {
    useCityData,
    setUseCityData,
    timerWarning: timerWarningMinutes,
    setTimerWarning: setTimerWarningMinutes,
    defaultDuration: defaultDurationMinutes,
    setDefaultDuration: setDefaultDurationMinutes,
    googleKey,
    setGoogleKey,
    onSaveKey: handleSaveKey,
  };

  if (!isAuthenticated) {
    return (
      <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.scrollContent}>
        {/* Guest state */}
        <View style={styles.guestBanner}>
          <Ionicons name="person-circle-outline" size={60} color={colors.gray300} />
          <Text style={styles.guestTitle}>You're browsing as a guest</Text>
          <Text style={styles.guestSubtitle}>
            Sign in to save favorite spots and get parking timer alerts.
          </Text>
          <View style={styles.guestButtons}>
            <TouchableOpacity
              style={styles.signInButton}
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.85}
            >
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.createAccountButton}
              onPress={() => router.push('/(auth)/signup')}
              activeOpacity={0.85}
            >
              <Text style={styles.createAccountButtonText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        <SettingsSection {...settingsProps} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.scrollContent}>
      {/* User header */}
      <View style={styles.userHeader}>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={28} color={colors.white} />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userEmail}>{user?.email || 'Signed in'}</Text>
          <Text style={styles.userLabel}>Know Company Member</Text>
        </View>
        <TouchableOpacity style={styles.signOutButton} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={18} color={colors.red} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Favorites */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>❤️ Saved Spots</Text>
        {(!favorites || favorites.length === 0) ? (
          <View style={styles.emptySection}>
            <Ionicons name="heart-outline" size={32} color={colors.gray300} />
            <Text style={styles.emptyText}>No saved spots yet.</Text>
            <Text style={styles.emptySubtext}>Tap ❤️ on the map to save a location.</Text>
          </View>
        ) : (
          favorites.map(item => (
            <FavoriteItem
              key={item.key}
              item={item}
              onDelete={handleDeleteFavorite}
            />
          ))
        )}
      </View>

      {/* Active Timers */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⏱️ Active Timers</Text>
        {(!activeTimers || activeTimers.length === 0) ? (
          <View style={styles.emptySection}>
            <Ionicons name="timer-outline" size={32} color={colors.gray300} />
            <Text style={styles.emptyText}>No active timers.</Text>
            <Text style={styles.emptySubtext}>Set a timer from the map screen.</Text>
          </View>
        ) : (
          activeTimers.map(timer => (
            <View key={timer.id} style={styles.timerCard}>
              <View style={styles.timerHeader}>
                <Text style={styles.timerName} numberOfLines={1}>{timer.spotName}</Text>
                <TouchableOpacity
                  style={styles.cancelTimerButton}
                  onPress={() => handleCancelTimer(timer.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelTimerText}>Cancel</Text>
                </TouchableOpacity>
              </View>
              <TimerProgress startedAt={timer.startedAt} durationMinutes={timer.durationMinutes} />
            </View>
          ))
        )}
      </View>

      <SettingsSection {...settingsProps} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  scrollContent: {
    paddingBottom: spacing.xl * 2,
  },
  // Guest styles
  guestBanner: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    marginBottom: spacing.md,
  },
  guestTitle: {
    fontSize: font.xl,
    fontWeight: '700',
    color: colors.gray800,
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: font.md,
    color: colors.gray500,
    textAlign: 'center',
    lineHeight: 22,
  },
  guestButtons: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  signInButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: 14,
    alignItems: 'center',
    ...shadow.sm,
  },
  signInButtonText: {
    color: colors.white,
    fontSize: font.lg,
    fontWeight: '700',
  },
  createAccountButton: {
    backgroundColor: colors.gray100,
    borderRadius: radius.full,
    paddingVertical: 14,
    alignItems: 'center',
  },
  createAccountButtonText: {
    color: colors.gray700,
    fontSize: font.lg,
    fontWeight: '600',
  },
  // User header
  userHeader: {
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    marginBottom: spacing.md,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userEmail: {
    fontSize: font.md,
    fontWeight: '700',
    color: colors.gray900,
  },
  userLabel: {
    fontSize: font.sm,
    color: colors.gray500,
    marginTop: 2,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.redLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  signOutText: {
    color: colors.red,
    fontSize: font.md,
    fontWeight: '600',
  },
  // Sections
  section: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadow.sm,
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: font.xl,
    fontWeight: '700',
    color: colors.gray900,
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: font.lg,
    fontWeight: '600',
    color: colors.gray500,
  },
  emptySubtext: {
    fontSize: font.md,
    color: colors.gray400,
    textAlign: 'center',
  },
  // Favorites
  favoriteCard: {
    gap: spacing.sm,
  },
  favoriteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteText: {
    flex: 1,
  },
  favoriteName: {
    fontSize: font.md,
    fontWeight: '600',
    color: colors.gray900,
  },
  favoriteAddress: {
    fontSize: font.sm,
    color: colors.gray500,
    marginTop: 1,
  },
  favoriteActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: 30,
  },
  navigateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  navigateButtonText: {
    color: colors.white,
    fontSize: font.sm,
    fontWeight: '600',
  },
  deleteButton: {
    padding: spacing.sm,
    backgroundColor: colors.redLight,
    borderRadius: radius.md,
  },
  // Timers
  timerCard: {
    backgroundColor: colors.gray50,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timerName: {
    flex: 1,
    fontSize: font.md,
    fontWeight: '700',
    color: colors.gray900,
  },
  cancelTimerButton: {
    backgroundColor: colors.redLight,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  cancelTimerText: {
    color: colors.red,
    fontSize: font.sm,
    fontWeight: '600',
  },
  timerProgress: {
    gap: spacing.xs,
  },
  timerProgressBar: {
    height: 6,
    backgroundColor: colors.gray200,
    borderRadius: 3,
    overflow: 'hidden',
  },
  timerProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  timerRemaining: {
    fontSize: font.sm,
    color: colors.gray600,
    fontWeight: '500',
  },
  // Settings
  settingsSection: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
    gap: spacing.lg,
    ...shadow.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  settingBlock: {
    gap: spacing.sm,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: font.md,
    fontWeight: '600',
    color: colors.gray900,
  },
  settingDescription: {
    fontSize: font.sm,
    color: colors.gray500,
    marginTop: 2,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.gray100,
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: font.sm,
    fontWeight: '600',
    color: colors.gray700,
  },
  chipTextActive: {
    color: colors.white,
  },
  keyInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  keyInput: {
    flex: 1,
    backgroundColor: colors.gray50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    paddingHorizontal: spacing.md,
    fontSize: font.md,
    color: colors.gray900,
    height: 44,
  },
  saveKeyButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveKeyButtonText: {
    color: colors.white,
    fontSize: font.md,
    fontWeight: '600',
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    justifyContent: 'center',
    paddingTop: spacing.sm,
  },
  versionText: {
    fontSize: font.sm,
    color: colors.gray400,
  },
});
