import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, font, shadow } from '../constants/theme';

const STATUS_CONFIG = {
  allowed: {
    bg: colors.greenLight,
    border: colors.green,
    text: colors.green,
    emoji: '✅',
    label: 'Parking Allowed',
  },
  restricted: {
    bg: colors.yellowLight,
    border: colors.yellow,
    text: colors.yellow,
    emoji: '⚠️',
    label: 'Restrictions Apply',
  },
  prohibited: {
    bg: colors.redLight,
    border: colors.red,
    text: colors.red,
    emoji: '🚫',
    label: 'No Parking',
  },
  unknown: {
    bg: colors.blueLight,
    border: colors.blue,
    text: colors.blue,
    emoji: '❓',
    label: 'Unknown',
  },
};

const SOURCE_LABELS = {
  osm: 'OpenStreetMap',
  overpass: 'OpenStreetMap',
  state: 'State Law DB',
  city: 'City Data',
  google: 'Google Places',
};

function SourceBadge({ source }) {
  const label = SOURCE_LABELS[source] || source || 'OpenStreetMap';
  return (
    <View style={styles.sourceBadge}>
      <Ionicons name="information-circle-outline" size={12} color={colors.gray500} />
      <Text style={styles.sourceText}>{label}</Text>
    </View>
  );
}

export default function ParkingStatusCard({ verdict, style }) {
  if (!verdict) return null;

  const status = verdict.status || 'unknown';
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.unknown;

  const maxStay = verdict.maxStay || verdict.maxstay;
  const towWarning = verdict.stateLaw?.towWarning;
  const source = verdict.source;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
        },
        style,
      ]}
    >
      {/* Emoji + label row */}
      <View style={styles.topRow}>
        <Text style={styles.emoji}>{config.emoji}</Text>
        <View style={styles.labelBlock}>
          <Text style={[styles.statusLabel, { color: config.text }]}>
            {config.label}
          </Text>
          {maxStay && (
            <View style={[styles.maxStayBadge, { borderColor: config.border }]}>
              <Ionicons name="time-outline" size={13} color={config.text} />
              <Text style={[styles.maxStayText, { color: config.text }]}>
                Max {maxStay}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Tow warning */}
      {towWarning && (status === 'prohibited' || status === 'restricted') && (
        <View style={styles.towWarningRow}>
          <Ionicons name="warning" size={14} color={colors.red} />
          <Text style={styles.towWarningText} numberOfLines={2}>
            {towWarning}
          </Text>
        </View>
      )}

      {/* Source badge */}
      {source && <SourceBadge source={source} />}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadow.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  emoji: {
    fontSize: 48,
    lineHeight: 58,
  },
  labelBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  statusLabel: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  maxStayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  maxStayText: {
    fontSize: font.sm,
    fontWeight: '600',
  },
  towWarningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: 'rgba(220,38,38,0.08)',
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  towWarningText: {
    flex: 1,
    fontSize: font.sm,
    color: colors.red,
    lineHeight: 18,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
  },
  sourceText: {
    fontSize: font.sm,
    color: colors.gray500,
  },
});
