import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { estimateRate } from '../services/parkingRules';
import { colors, spacing, radius, font, shadow } from '../constants/theme';

const SOURCE_CONFIG = {
  osm: { label: 'OpenStreetMap', color: colors.green, icon: 'globe-outline' },
  overpass: { label: 'OpenStreetMap', color: colors.green, icon: 'globe-outline' },
  google: { label: 'Google', color: colors.blue, icon: 'logo-google' },
  city: { label: 'City Data', color: colors.yellow, icon: 'business-outline' },
};

const TYPE_ICONS = {
  'multi-storey': 'business-outline',
  underground: 'arrow-down-circle-outline',
  surface: 'car-outline',
  street_side: 'map-outline',
  meter: 'time-outline',
  default: 'car-outline',
};

function haversineDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371000;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dphi = ((lat2 - lat1) * Math.PI) / 180;
  const dlambda = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dphi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlambda / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters) {
  if (meters === null || meters === undefined) return null;
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function StarRating({ rating }) {
  if (!rating) return null;
  const stars = Math.round(rating);
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons
          key={i}
          name={i <= stars ? 'star' : 'star-outline'}
          size={12}
          color={i <= stars ? colors.yellow : colors.gray300}
        />
      ))}
      <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
    </View>
  );
}

function openDirections(lat, lon, name) {
  const label = encodeURIComponent(name || 'Parking');
  const googleUrl = `https://maps.google.com/maps?daddr=${lat},${lon}(${label})`;
  const nativeUrl = Platform.OS === 'ios'
    ? `comgooglemaps://?daddr=${lat},${lon}&directionsmode=driving`
    : `geo:${lat},${lon}?q=${label}`;

  Linking.canOpenURL(nativeUrl)
    .then(supported => {
      if (supported) return Linking.openURL(nativeUrl);
      return Linking.openURL(googleUrl);
    })
    .catch(() => {
      Linking.openURL(googleUrl).catch(() => {
        Alert.alert('Error', 'Could not open maps.');
      });
    });
}

export default function GarageCard({ garage, userLocation, city }) {
  if (!garage) return null;

  const {
    name,
    latitude,
    longitude,
    type,
    source,
    capacity,
    openingHours,
    rating,
    ratingCount,
    rate,
  } = garage;

  const distanceMeters = userLocation
    ? haversineDistance(userLocation.latitude, userLocation.longitude, latitude, longitude)
    : null;
  const distanceStr = formatDistance(distanceMeters);

  const estimatedRate = rate || (estimateRate ? estimateRate(garage, city) : null);

  const sourceConfig = SOURCE_CONFIG[source] || SOURCE_CONFIG.osm;
  const typeIcon = TYPE_ICONS[type] || TYPE_ICONS.default;
  const typeLabel = type
    ? type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'Parking';

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.typeIconBox}>
            <Ionicons name={typeIcon} size={20} color={colors.primary} />
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.name} numberOfLines={2}>
              {name || typeLabel}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.typeLabel}>{typeLabel}</Text>
              {distanceStr && (
                <>
                  <Text style={styles.dot}>·</Text>
                  <Ionicons name="navigate-outline" size={12} color={colors.gray400} />
                  <Text style={styles.distanceText}>{distanceStr}</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Source badge */}
        <View style={[styles.sourceBadge, { backgroundColor: `${sourceConfig.color}20` }]}>
          <Ionicons name={sourceConfig.icon} size={11} color={sourceConfig.color} />
          <Text style={[styles.sourceBadgeText, { color: sourceConfig.color }]}>
            {sourceConfig.label}
          </Text>
        </View>
      </View>

      {/* Details row */}
      <View style={styles.detailsRow}>
        {estimatedRate && (
          <View style={styles.detailChip}>
            <Ionicons name="cash-outline" size={14} color={colors.green} />
            <Text style={styles.detailChipText}>{estimatedRate}</Text>
          </View>
        )}

        {capacity && (
          <View style={styles.detailChip}>
            <Ionicons name="layers-outline" size={14} color={colors.gray500} />
            <Text style={styles.detailChipText}>{capacity} spaces</Text>
          </View>
        )}

        {openingHours && (
          <View style={styles.detailChip}>
            <Ionicons name="time-outline" size={14} color={colors.gray500} />
            <Text style={styles.detailChipText} numberOfLines={1}>{openingHours}</Text>
          </View>
        )}
      </View>

      {/* Rating */}
      {rating && (
        <View style={styles.ratingRow}>
          <StarRating rating={rating} />
          {ratingCount && (
            <Text style={styles.ratingCount}>({ratingCount} reviews)</Text>
          )}
        </View>
      )}

      {/* Directions button */}
      {latitude && longitude && (
        <TouchableOpacity
          style={styles.directionsButton}
          onPress={() => openDirections(latitude, longitude, name)}
          activeOpacity={0.8}
        >
          <Ionicons name="navigate" size={16} color={colors.white} />
          <Text style={styles.directionsButtonText}>Get Directions</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    gap: spacing.sm,
    ...shadow.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  typeIconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleBlock: {
    flex: 1,
  },
  name: {
    fontSize: font.lg,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  typeLabel: {
    fontSize: font.sm,
    color: colors.gray500,
  },
  dot: {
    fontSize: font.sm,
    color: colors.gray400,
  },
  distanceText: {
    fontSize: font.sm,
    color: colors.primary,
    fontWeight: '500',
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    flexShrink: 0,
  },
  sourceBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.gray100,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  detailChipText: {
    fontSize: font.sm,
    color: colors.gray700,
    fontWeight: '500',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: font.sm,
    fontWeight: '600',
    color: colors.gray700,
    marginLeft: 4,
  },
  ratingCount: {
    fontSize: font.sm,
    color: colors.gray500,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  directionsButtonText: {
    color: colors.white,
    fontSize: font.md,
    fontWeight: '600',
  },
});
