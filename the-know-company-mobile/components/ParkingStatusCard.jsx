import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, font, shadow } from '../constants/theme';

// Maps every status computeVerdict() can return to display config
const STATUS_CONFIG = {
  allowed: {
    bg: '#d1fae5', border: '#059669', text: '#059669',
    emoji: '✅', label: 'Parking Allowed',
  },
  time_limited: {
    bg: '#fef3c7', border: '#d97706', text: '#d97706',
    emoji: '⏱️', label: 'Time-Limited Parking',
  },
  metered: {
    bg: '#dbeafe', border: '#2563eb', text: '#2563eb',
    emoji: '🅿️', label: 'Metered — Pay to Park',
  },
  permit: {
    bg: '#f3e8ff', border: '#7c3aed', text: '#7c3aed',
    emoji: '🪧', label: 'Permit Required',
  },
  no_parking: {
    bg: '#fee2e2', border: '#dc2626', text: '#dc2626',
    emoji: '🚫', label: 'No Parking',
  },
  no_stopping: {
    bg: '#fee2e2', border: '#dc2626', text: '#dc2626',
    emoji: '🚫', label: 'No Stopping',
  },
  no_standing: {
    bg: '#fee2e2', border: '#dc2626', text: '#dc2626',
    emoji: '🚫', label: 'No Standing',
  },
  advisory: {
    bg: '#dbeafe', border: '#2563eb', text: '#2563eb',
    emoji: 'ℹ️', label: 'Check Local Signs',
  },
  unknown: {
    bg: '#f3f4f6', border: '#9ca3af', text: '#6b7280',
    emoji: '❓', label: 'Unknown — Check Signs',
  },
};

const SOURCE_LABELS = {
  osm: 'OpenStreetMap',
  overpass: 'OpenStreetMap',
  state_law: 'State Law DB',
  city: 'City Data',
  google: 'Google Places',
  none: 'No data',
};

export default function ParkingStatusCard({ verdict, towRisk, style }) {
  if (!verdict) return null;

  const cfg = STATUS_CONFIG[verdict.status] || STATUS_CONFIG.unknown;
  const maxStay = verdict.maxStay || verdict.maxstay;
  const source = SOURCE_LABELS[verdict.source] || verdict.source || 'OpenStreetMap';

  return (
    <View style={[styles.card, { backgroundColor: cfg.bg, borderColor: cfg.border }, style]}>

      {/* ── Main verdict row ── */}
      <View style={styles.topRow}>
        <Text style={styles.emoji}>{cfg.emoji}</Text>
        <View style={styles.labelBlock}>
          <Text style={[styles.statusLabel, { color: cfg.text }]}>
            {verdict.label || cfg.label}
          </Text>
          {maxStay && (
            <View style={[styles.badge, { borderColor: cfg.border }]}>
              <Ionicons name="time-outline" size={12} color={cfg.text} />
              <Text style={[styles.badgeText, { color: cfg.text }]}>Max {maxStay}</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Note / advisory text ── */}
      {verdict.note && (
        <Text style={styles.noteText} numberOfLines={3}>{verdict.note}</Text>
      )}

      {/* ── Parking lot details ── */}
      {verdict.isLot && (verdict.operator || verdict.opening_hours || verdict.capacity || verdict.charge) && (
        <View style={styles.lotCard}>
          <Text style={styles.lotTitle}>🏢 Lot Details</Text>
          {verdict.operator    && <Text style={styles.lotDetail}>🏷️  {verdict.operator}</Text>}
          {verdict.opening_hours && <Text style={styles.lotDetail}>🕐  {verdict.opening_hours}</Text>}
          {verdict.capacity    && <Text style={styles.lotDetail}>🚗  {verdict.capacity}</Text>}
          {verdict.charge      && <Text style={styles.lotDetail}>💵  {verdict.charge}</Text>}
        </View>
      )}

      {/* ── Tow Risk Score ── */}
      {towRisk && (
        <View style={[styles.towRiskCard, { backgroundColor: towRisk.bg, borderColor: towRisk.color }]}>
          <View style={styles.towRiskHeader}>
            <Text style={styles.towRiskEmoji}>{towRisk.emoji}</Text>
            <Text style={styles.towRiskTitle}>Tow Risk</Text>
            <View style={[styles.towRiskBadge, { backgroundColor: towRisk.color }]}>
              <Text style={styles.towRiskBadgeText}>{towRisk.level}</Text>
            </View>
          </View>
          {towRisk.factors.length > 0 && (
            <View style={styles.factorList}>
              {towRisk.factors.map((f, i) => (
                <Text key={i} style={styles.factorItem}>• {f}</Text>
              ))}
            </View>
          )}
          {verdict.stateLaw?.towWarning && (
            <Text style={styles.towLaw}>⚖️  {verdict.stateLaw.towWarning}</Text>
          )}
        </View>
      )}

      {/* ── State law extras (street parking only) ── */}
      {!verdict.isLot && verdict.stateLaw && (verdict.stateLaw.overnight || verdict.stateLaw.streetCleaning) && (
        <View style={styles.stateLawRow}>
          {verdict.stateLaw.overnight && (
            <Text style={styles.stateLawItem}>🌙  {verdict.stateLaw.overnight}</Text>
          )}
          {verdict.stateLaw.streetCleaning && (
            <Text style={styles.stateLawItem}>🧹  Street cleaning enforced — check posted signs</Text>
          )}
        </View>
      )}

      {/* ── Source badge ── */}
      <View style={styles.sourceBadge}>
        <Ionicons name="information-circle-outline" size={12} color={colors.gray500} />
        <Text style={styles.sourceText}>{source}</Text>
      </View>
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
    fontSize: 40,
    lineHeight: 48,
  },
  labelBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  statusLabel: {
    fontSize: font.xl,
    fontWeight: '800',
    lineHeight: 26,
  },
  badge: {
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
  badgeText: {
    fontSize: font.sm,
    fontWeight: '600',
  },
  noteText: {
    fontSize: font.sm,
    color: colors.gray700,
    lineHeight: 18,
  },
  lotCard: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: 4,
  },
  lotTitle: {
    fontSize: font.sm,
    fontWeight: '700',
    color: colors.gray700,
    marginBottom: 2,
  },
  lotDetail: {
    fontSize: font.sm,
    color: colors.gray600,
    lineHeight: 18,
  },
  towRiskCard: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  towRiskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  towRiskEmoji: {
    fontSize: 16,
  },
  towRiskTitle: {
    fontSize: font.md,
    fontWeight: '700',
    color: colors.gray700,
    flex: 1,
  },
  towRiskBadge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  towRiskBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  factorList: {
    gap: 2,
  },
  factorItem: {
    fontSize: font.sm,
    color: colors.gray600,
    lineHeight: 18,
  },
  towLaw: {
    fontSize: 11,
    color: colors.gray500,
    lineHeight: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    paddingTop: spacing.xs,
    marginTop: 2,
  },
  stateLawRow: {
    gap: 4,
  },
  stateLawItem: {
    fontSize: font.sm,
    color: colors.gray600,
    lineHeight: 18,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  sourceText: {
    fontSize: font.sm,
    color: colors.gray500,
  },
});
