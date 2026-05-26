import { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, TextInput,
  StyleSheet, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../store/useSettingsStore';
import { colors, spacing, radius, font, shadow } from '../constants/theme';

const DURATION_PRESETS = [
  { label: '30 min', value: 30 },
  { label: '1 hr',   value: 60 },
  { label: '1.5 hr', value: 90 },
  { label: '2 hr',   value: 120 },
  { label: '3 hr',   value: 180 },
  { label: '4 hr',   value: 240 },
];

export default function TimerModal({ visible, onClose, spotName, onStart }) {
  const warningMinutes = useSettingsStore(s => s.timerWarningMinutes);
  const defaultDuration = useSettingsStore(s => s.defaultTimerDuration);

  const [selected, setSelected] = useState(defaultDuration || 120);
  const [customText, setCustomText] = useState('');
  const [started, setStarted] = useState(false);

  const effectiveDuration = customText ? parseInt(customText, 10) || selected : selected;

  function handleStart() {
    if (effectiveDuration <= 0) return;
    setStarted(true);
    onStart(effectiveDuration);
    setTimeout(() => {
      setStarted(false);
      setCustomText('');
      onClose();
    }, 1200);
  }

  const expiryDate = new Date(Date.now() + effectiveDuration * 60000);
  const expiryStr  = expiryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const warnStr    = new Date(expiryDate.getTime() - warningMinutes * 60000)
    .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>⏱️ Set Parking Timer</Text>
              {spotName ? <Text style={styles.spotName}>{spotName}</Text> : null}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.gray500} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Duration presets */}
            <Text style={styles.label}>Select duration</Text>
            <View style={styles.presetGrid}>
              {DURATION_PRESETS.map(p => (
                <TouchableOpacity
                  key={p.value}
                  style={[styles.preset, selected === p.value && !customText && styles.presetActive]}
                  onPress={() => { setSelected(p.value); setCustomText(''); }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.presetText, selected === p.value && !customText && styles.presetTextActive]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom duration */}
            <Text style={styles.label}>Or enter custom (minutes)</Text>
            <View style={styles.customRow}>
              <TextInput
                style={[styles.customInput, customText && styles.customInputActive]}
                keyboardType="number-pad"
                placeholder="e.g. 45"
                placeholderTextColor={colors.gray400}
                value={customText}
                onChangeText={setCustomText}
                maxLength={4}
              />
              {customText ? (
                <TouchableOpacity onPress={() => setCustomText('')} style={styles.clearCustom}>
                  <Ionicons name="close-circle" size={18} color={colors.gray400} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Ionicons name="alarm-outline" size={18} color={colors.yellow} />
                <Text style={styles.summaryText}>
                  Alert at <Text style={styles.summaryBold}>{warnStr}</Text> ({warningMinutes} min warning)
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons name="timer-outline" size={18} color={colors.red} />
                <Text style={styles.summaryText}>
                  Expires at <Text style={styles.summaryBold}>{expiryStr}</Text>
                </Text>
              </View>
            </View>

            {/* Start button */}
            <TouchableOpacity
              style={[styles.startBtn, started && styles.startBtnOk]}
              onPress={handleStart}
              disabled={started}
            >
              {started ? (
                <Text style={styles.startBtnText}>✓ Timer Started!</Text>
              ) : (
                <Text style={styles.startBtnText}>▶ Start Timer — {effectiveDuration} min</Text>
              )}
            </TouchableOpacity>

            <View style={{ height: Platform.OS === 'ios' ? 24 : 8 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:   { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:     { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.md, paddingTop: spacing.sm, maxHeight: '80%', ...shadow.xl },
  handle:    { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.gray300, alignSelf: 'center', marginBottom: spacing.sm },

  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  title:     { fontSize: font.xl, fontWeight: '800', color: colors.gray900 },
  spotName:  { fontSize: font.sm, color: colors.gray500, marginTop: 3 },
  closeBtn:  { padding: 4 },

  label:     { fontSize: font.sm, fontWeight: '700', color: colors.gray500, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: spacing.sm },

  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  preset:     { borderWidth: 1.5, borderColor: colors.gray200, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.gray50 },
  presetActive: { borderColor: colors.primary, backgroundColor: colors.blueLight },
  presetText:   { fontSize: font.md, fontWeight: '600', color: colors.gray600 },
  presetTextActive: { color: colors.primary },

  customRow:   { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.gray200, borderRadius: radius.md, backgroundColor: colors.gray50, paddingHorizontal: spacing.sm, marginBottom: spacing.md },
  customInput: { flex: 1, fontSize: font.lg, color: colors.gray800, paddingVertical: 11 },
  customInputActive: { color: colors.primary },
  clearCustom: { padding: 4 },

  summaryCard: { backgroundColor: colors.gray50, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, gap: 8 },
  summaryRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryText: { fontSize: font.md, color: colors.gray600, flex: 1 },
  summaryBold: { fontWeight: '800', color: colors.gray800 },

  startBtn:    { backgroundColor: colors.primary, borderRadius: radius.full, paddingVertical: 15, alignItems: 'center' },
  startBtnOk:  { backgroundColor: colors.green },
  startBtnText: { color: colors.white, fontSize: font.lg, fontWeight: '800' },
});
