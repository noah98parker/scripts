import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useParkingStore } from '../../stores/parkingStore';
import { STATE_LAWS } from '../../services/parkingRules';
import { colors, spacing, radius, font, shadow } from '../../constants/theme';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function StateItem({ item, isExpanded, onPress, isHighlighted }) {
  const animValue = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  const handlePress = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Animated.timing(animValue, {
      toValue: isExpanded ? 0 : 1,
      duration: 250,
      useNativeDriver: false,
    }).start();
    onPress(item.code);
  };

  const law = item;

  return (
    <View style={[styles.stateItem, isHighlighted && styles.stateItemHighlighted]}>
      <TouchableOpacity style={styles.stateHeader} onPress={handlePress} activeOpacity={0.7}>
        <View style={styles.stateLeft}>
          {isHighlighted && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>YOUR STATE</Text>
            </View>
          )}
          <Text style={styles.stateName}>{law.name}</Text>
        </View>
        <View style={styles.stateRight}>
          <View style={[styles.codeBadge, isHighlighted && styles.codeBadgeHighlighted]}>
            <Text style={[styles.codeText, isHighlighted && styles.codeTextHighlighted]}>
              {law.code}
            </Text>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.gray400}
          />
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.stateDetail}>
          {law.towWarning ? (
            <View style={styles.detailRow}>
              <View style={[styles.detailBadge, { backgroundColor: colors.redLight }]}>
                <Ionicons name="warning" size={14} color={colors.red} />
                <Text style={[styles.detailBadgeText, { color: colors.red }]}>Tow Warning</Text>
              </View>
              <Text style={styles.detailText}>{law.towWarning}</Text>
            </View>
          ) : null}

          {law.overnight ? (
            <View style={styles.detailRow}>
              <View style={[styles.detailBadge, { backgroundColor: colors.blueLight }]}>
                <Ionicons name="moon-outline" size={14} color={colors.blue} />
                <Text style={[styles.detailBadgeText, { color: colors.blue }]}>Overnight</Text>
              </View>
              <Text style={styles.detailText}>{law.overnight}</Text>
            </View>
          ) : null}

          {law.streetCleaning ? (
            <View style={styles.detailRow}>
              <View style={[styles.detailBadge, { backgroundColor: colors.yellowLight }]}>
                <Ionicons name="brush-outline" size={14} color={colors.yellow} />
                <Text style={[styles.detailBadgeText, { color: colors.yellow }]}>Street Cleaning</Text>
              </View>
              <Text style={styles.detailText}>
                {typeof law.streetCleaning === 'string' ? law.streetCleaning : 'Strictly enforced'}
              </Text>
            </View>
          ) : null}

          {law.permitZones ? (
            <View style={styles.detailRow}>
              <View style={[styles.detailBadge, { backgroundColor: colors.yellowLight }]}>
                <Ionicons name="key-outline" size={14} color={colors.yellow} />
                <Text style={[styles.detailBadgeText, { color: colors.yellow }]}>Permit Zones</Text>
              </View>
              <Text style={styles.detailText}>
                {typeof law.permitZones === 'string' ? law.permitZones : 'Permit zones exist in this state'}
              </Text>
            </View>
          ) : null}

          {law.notes ? (
            <View style={styles.detailRow}>
              <View style={[styles.detailBadge, { backgroundColor: colors.blueLight }]}>
                <Ionicons name="information-circle-outline" size={14} color={colors.blue} />
                <Text style={[styles.detailBadgeText, { color: colors.blue }]}>Notes</Text>
              </View>
              <Text style={styles.detailText}>{law.notes}</Text>
            </View>
          ) : null}

          {!law.towWarning && !law.overnight && !law.streetCleaning && !law.permitZones && !law.notes && (
            <Text style={styles.noDetailsText}>No specific laws recorded for this state.</Text>
          )}
        </View>
      )}
    </View>
  );
}

export default function LawsScreen() {
  const insets = useSafeAreaInsets();
  const { geocodeInfo } = useParkingStore();
  const userStateCode = geocodeInfo?.stateCode || null;

  const [search, setSearch] = useState('');
  const [expandedCode, setExpandedCode] = useState(null);

  const allStates = Object.entries(STATE_LAWS || {}).map(([code, law]) => ({
    code,
    name: law.name || code,
    ...law,
  }));

  const filtered = allStates.filter(s => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q)
    );
  });

  // Sort: user's state first, then alphabetical
  const sorted = [...filtered].sort((a, b) => {
    if (a.code === userStateCode) return -1;
    if (b.code === userStateCode) return 1;
    return a.name.localeCompare(b.name);
  });

  const handleToggle = useCallback((code) => {
    setExpandedCode(prev => prev === code ? null : code);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Page header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>State Parking Laws</Text>
        <Text style={styles.pageSubtitle}>50 states + DC</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.gray400} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search state name or code…"
            placeholderTextColor={colors.gray400}
            value={search}
            onChangeText={setSearch}
            clearButtonMode="while-editing"
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={18} color={colors.gray400} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={item => item.code}
        renderItem={({ item }) => (
          <StateItem
            item={item}
            isExpanded={expandedCode === item.code}
            onPress={handleToggle}
            isHighlighted={item.code === userStateCode}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={40} color={colors.gray300} />
            <Text style={styles.emptyText}>No states match "{search}"</Text>
          </View>
        }
        keyboardShouldPersistTaps="handled"
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
  searchContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: font.md,
    color: colors.gray900,
    height: '100%',
  },
  clearButton: {
    padding: spacing.xs,
  },
  listContent: {
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray100,
    marginHorizontal: spacing.lg,
  },
  stateItem: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginVertical: 2,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadow.sm,
  },
  stateItemHighlighted: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  stateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  stateLeft: {
    flex: 1,
    gap: spacing.xs,
  },
  currentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginBottom: 2,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
  },
  stateName: {
    fontSize: font.lg,
    fontWeight: '600',
    color: colors.gray900,
  },
  stateRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  codeBadge: {
    backgroundColor: colors.gray100,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  codeBadgeHighlighted: {
    backgroundColor: colors.blueLight,
  },
  codeText: {
    fontSize: font.sm,
    fontWeight: '700',
    color: colors.gray600,
    letterSpacing: 1,
  },
  codeTextHighlighted: {
    color: colors.primary,
  },
  stateDetail: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    paddingTop: spacing.md,
  },
  detailRow: {
    gap: spacing.xs,
  },
  detailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    gap: spacing.xs,
    marginBottom: 2,
  },
  detailBadgeText: {
    fontSize: font.sm,
    fontWeight: '700',
  },
  detailText: {
    fontSize: font.md,
    color: colors.gray700,
    lineHeight: 22,
  },
  noDetailsText: {
    fontSize: font.md,
    color: colors.gray500,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: font.lg,
    color: colors.gray500,
  },
});
