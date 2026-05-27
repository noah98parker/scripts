import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useParkingStore } from '../../stores/parkingStore';
import { colors, spacing, radius, font, shadow } from '../../constants/theme';

const NATIONAL_HOTLINES = [
  { name: 'AAA', phone: '1-800-222-4357', icon: 'car-outline' },
  { name: 'GEICO Emergency', phone: '1-800-424-3426', icon: 'shield-outline' },
  { name: 'Allstate Motor Club', phone: '1-800-255-7828', icon: 'star-outline' },
  { name: 'Agero / Ford Roadside', phone: '1-800-367-3962', icon: 'construct-outline' },
  { name: 'CoachNet', phone: '1-800-863-2620', icon: 'bus-outline' },
];

function formatDistance(meters) {
  if (!meters && meters !== 0) return null;
  if (meters < 1000) return `${Math.round(meters)}m away`;
  return `${(meters / 1000).toFixed(1)}km away`;
}

function callPhone(phone) {
  const cleaned = phone.replace(/[^0-9+]/g, '');
  Linking.openURL(`tel:${cleaned}`).catch(() => {
    Alert.alert('Cannot call', `Please dial ${phone} manually.`);
  });
}

function openInMaps(lat, lon, name) {
  const label = encodeURIComponent(name || 'Tow Company');
  const url = Platform.OS === 'ios'
    ? `maps://?q=${label}&ll=${lat},${lon}`
    : `geo:${lat},${lon}?q=${label}`;
  Linking.openURL(url).catch(() => {
    Linking.openURL(`https://maps.google.com/maps?q=${lat},${lon}(${label})`);
  });
}

function TowCompanyCard({ company }) {
  const distance = formatDistance(company.distance);
  return (
    <View style={styles.companyCard}>
      <View style={styles.companyCardHeader}>
        <View style={styles.companyIcon}>
          <Ionicons name="car-sport" size={20} color={colors.primary} />
        </View>
        <View style={styles.companyInfo}>
          <Text style={styles.companyName}>{company.name || 'Tow Company'}</Text>
          {distance && <Text style={styles.companyDistance}>{distance}</Text>}
          {company.address && (
            <Text style={styles.companyAddress} numberOfLines={1}>{company.address}</Text>
          )}
        </View>
      </View>
      <View style={styles.companyActions}>
        {company.phone ? (
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => callPhone(company.phone)}
            activeOpacity={0.8}
          >
            <Ionicons name="call" size={15} color={colors.white} />
            <Text style={styles.callButtonText}>{company.phone}</Text>
          </TouchableOpacity>
        ) : null}
        {company.latitude && company.longitude ? (
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => openInMaps(company.latitude, company.longitude, company.name)}
            activeOpacity={0.8}
          >
            <Ionicons name="map-outline" size={15} color={colors.primary} />
            <Text style={styles.mapButtonText}>Map</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

function HotlineCard({ hotline }) {
  return (
    <TouchableOpacity
      style={styles.hotlineCard}
      onPress={() => callPhone(hotline.phone)}
      activeOpacity={0.7}
    >
      <View style={styles.hotlineIcon}>
        <Ionicons name={hotline.icon} size={20} color={colors.gray600} />
      </View>
      <View style={styles.hotlineInfo}>
        <Text style={styles.hotlineName}>{hotline.name}</Text>
        <Text style={styles.hotlinePhone}>{hotline.phone}</Text>
      </View>
      <Ionicons name="call-outline" size={20} color={colors.primary} />
    </TouchableOpacity>
  );
}

export default function TowScreen() {
  const insets = useSafeAreaInsets();
  const { towCompanies, verdict } = useParkingStore();

  const towWarning = verdict?.stateLaw?.towWarning;

  const towLawData = towWarning ? [{ id: 'tow-law', warning: towWarning }] : [];
  const localTowData = towCompanies?.length > 0 ? towCompanies : [];
  const nationalData = NATIONAL_HOTLINES;

  const sections = [
    {
      key: 'towlaw',
      title: '⚖️ Tow Law',
      data: towLawData.length > 0 ? towLawData : [{ id: 'no-law', empty: true }],
    },
    {
      key: 'local',
      title: '🚛 Local Tow Companies',
      data: localTowData.length > 0 ? localTowData : [{ id: 'no-local', empty: true }],
    },
    {
      key: 'national',
      title: '📞 National Hotlines',
      data: nationalData,
    },
  ];

  const renderItem = ({ item, section }) => {
    if (item.empty) {
      if (section.key === 'towlaw') {
        return (
          <View style={styles.emptySection}>
            <Ionicons name="checkmark-circle-outline" size={24} color={colors.green} />
            <Text style={styles.emptySectionText}>No special tow warnings for this state.</Text>
          </View>
        );
      }
      if (section.key === 'local') {
        return (
          <View style={styles.emptySection}>
            <Ionicons name="search-outline" size={24} color={colors.gray400} />
            <Text style={styles.emptySectionText}>
              No tow companies found in OpenStreetMap nearby.
            </Text>
          </View>
        );
      }
    }

    if (section.key === 'towlaw' && item.warning) {
      return (
        <View style={styles.towLawCard}>
          <Ionicons name="warning" size={22} color={colors.red} style={{ marginRight: spacing.sm }} />
          <Text style={styles.towLawText}>{item.warning}</Text>
        </View>
      );
    }

    if (section.key === 'local') {
      return <TowCompanyCard company={item} />;
    }

    if (section.key === 'national') {
      return <HotlineCard hotline={item} />;
    }

    return null;
  };

  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Tow Info</Text>
        <Text style={styles.pageSubtitle}>Know before you get towed.</Text>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item, i) => item.id || item.name || String(i)}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  pageHeader: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  pageTitle: {
    fontSize: font.xxl,
    fontWeight: '800',
    color: colors.gray900,
  },
  pageSubtitle: {
    fontSize: font.md,
    color: colors.gray500,
    marginTop: spacing.xs,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionHeaderText: {
    fontSize: font.md,
    fontWeight: '700',
    color: colors.gray700,
  },
  towLawCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.redLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.red,
  },
  towLawText: {
    flex: 1,
    fontSize: font.md,
    color: colors.red,
    lineHeight: 22,
    fontWeight: '500',
  },
  companyCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    ...shadow.sm,
  },
  companyCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  companyIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: font.lg,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: 2,
  },
  companyDistance: {
    fontSize: font.sm,
    color: colors.gray500,
    marginBottom: 2,
  },
  companyAddress: {
    fontSize: font.sm,
    color: colors.gray500,
  },
  companyActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  callButtonText: {
    color: colors.white,
    fontSize: font.sm,
    fontWeight: '600',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blueLight,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  mapButtonText: {
    color: colors.primary,
    fontSize: font.sm,
    fontWeight: '600',
  },
  hotlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    ...shadow.sm,
    gap: spacing.md,
  },
  hotlineIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotlineInfo: {
    flex: 1,
  },
  hotlineName: {
    fontSize: font.md,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: 2,
  },
  hotlinePhone: {
    fontSize: font.md,
    color: colors.primary,
    fontWeight: '500',
  },
  emptySection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  emptySectionText: {
    flex: 1,
    fontSize: font.md,
    color: colors.gray600,
  },
});
