import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  SectionList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useParkingStore } from '../../stores/parkingStore';
import GarageCard from '../../components/GarageCard';
import { colors, spacing, radius, font, shadow } from '../../constants/theme';

export default function GaragesScreen() {
  const insets = useSafeAreaInsets();
  const {
    nearbyParking,
    cityMeters,
    userLocation,
    geocodeInfo,
    activePin,
    setActivePin,
    dataLoading,
  } = useParkingStore();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activePin) {
      // Re-trigger via store/pin change
      setActivePin({ ...activePin });
    }
    setTimeout(() => setRefreshing(false), 1500);
  }, [activePin]);

  const city = geocodeInfo?.city || '';
  const location = userLocation || activePin;

  const sections = [];
  if (nearbyParking.length > 0) {
    sections.push({ title: 'NEARBY GARAGES & LOTS', data: nearbyParking });
  }
  if (cityMeters && cityMeters.length > 0) {
    sections.push({ title: '🏙️ CITY PARKING METERS NEARBY', data: cityMeters });
  }

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="car-outline" size={56} color={colors.gray300} />
      <Text style={styles.emptyTitle}>No garages found nearby</Text>
      <Text style={styles.emptySubtitle}>
        Try tapping a different location on the map.
      </Text>
    </View>
  );

  const ListHeader = () => (
    <View style={styles.listHeader}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Parking Nearby</Text>
        {nearbyParking.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{nearbyParking.length}</Text>
          </View>
        )}
      </View>
      <Text style={styles.headerSubtitle}>Within 1km of selected location</Text>
    </View>
  );

  const SectionHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  if (sections.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ListHeader />
        <FlatList
          data={[]}
          renderItem={null}
          ListEmptyComponent={EmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => `${item.id || item.name || index}`}
        ListHeaderComponent={ListHeader}
        renderSectionHeader={SectionHeader}
        renderItem={({ item }) => (
          <GarageCard garage={item} userLocation={location} city={city} />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  listHeader: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  headerTitle: {
    fontSize: font.xxl,
    fontWeight: '800',
    color: colors.gray900,
  },
  countBadge: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    minWidth: 28,
    alignItems: 'center',
  },
  countBadgeText: {
    color: colors.white,
    fontSize: font.sm,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: font.md,
    color: colors.gray500,
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray50,
  },
  sectionHeaderText: {
    fontSize: font.sm,
    fontWeight: '700',
    color: colors.gray500,
    letterSpacing: 0.8,
  },
  separator: {
    height: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: font.xl,
    fontWeight: '700',
    color: colors.gray700,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: font.md,
    color: colors.gray500,
    textAlign: 'center',
    lineHeight: 22,
  },
});
