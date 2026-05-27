import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../stores/settingsStore';
import { colors, spacing, radius, font, shadow } from '../constants/theme';

const DURATION_CHIPS = [
  { label: '30 min', value: 30 },
  { label: '1 hr', value: 60 },
  { label: '1.5 hr', value: 90 },
  { label: '2 hr', value: 120 },
  { label: '3 hr', value: 180 },
  { label: '4 hr', value: 240 },
];

export default function TimerModal({ visible, onClose, spotName, onStart }) {
  const { timerWarningMinutes } = useSettingsStore();

  const [selectedMinutes, setSelectedMinutes] = useState(60);
  const [customInput, setCustomInput] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [started, setStarted] = useState(false);

  const handleChipPress = (value) => {
    setSelectedMinutes(value);
    setUseCustom(false);
    setCustomInput('');
  };

  const handleCustomChange = (text) => {
    setCustomInput(text);
    const parsed = parseInt(text, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setSelectedMinutes(parsed);
      setUseCustom(true);
    }
  };

  const handleStart = () => {
    const mins = useCustom
      ? parseInt(customInput, 10) || selectedMinutes
      : selectedMinutes;

    if (!mins || mins <= 0) return;

    setStarted(true);
    setTimeout(() => {
      onStart(mins);
      setStarted(false);
      setSelectedMinutes(60);
      setCustomInput('');
      setUseCustom(false);
    }, 800);
  };

  const handleClose = () => {
    setStarted(false);
    setCustomInput('');
    setUseCustom(false);
    setSelectedMinutes(60);
    onClose();
  };

  const effectiveMinutes = useCustom
    ? (parseInt(customInput, 10) || selectedMinutes)
    : selectedMinutes;

  const hoursDisplay = effectiveMinutes >= 60
    ? `${Math.floor(effectiveMinutes / 60)}h ${effectiveMinutes % 60 > 0 ? `${effectiveMinutes % 60}m` : ''}`.trim()
    : `${effectiveMinutes}m`;

  const expiryDate = new Date(Date.now() + effectiveMinutes * 60000);
  const expiryStr = expiryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const warnStr = new Date(expiryDate.getTime() - timerWarningMinutes * 60000)
    .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} onPress={handleClose} activeOpacity={1} />

        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handle} />

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>⏱️ Set Parking Timer</Text>
              {spotName ? <Text style={styles.spotName} numberOfLines={2}>{spotName}</Text> : null}
            </View>

            {/* Success state */}
            {started ? (
              <View style={styles.successState}>
                <Text style={styles.successEmoji}>✅</Text>
                <Text style={styles.successText}>Timer started for {hoursDisplay}!</Text>
                <Text style={styles.successSub}>
                  You'll be alerted {timerWarningMinutes} min before time is up.
                </Text>
              </View>
            ) : (
              <>
                {/* Duration label */}
                <View style={styles.durationLabel}>
                  <Ionicons name="time-outline" size={16} color={colors.primary} />
                  <Text style={styles.durationLabelText}>
                    Duration: <Text style={styles.durationValue}>{hoursDisplay}</Text>
                  </Text>
                </View>

                {/* Duration chips */}
                <Text style={styles.label}>Select duration</Text>
                <View style={styles.chipGrid}>
                  {DURATION_CHIPS.map(chip => (
                    <TouchableOpacity
                      key={chip.value}
                      style={[
                        styles.chip,
                        !useCustom && selectedMinutes === chip.value && styles.chipActive,
                      ]}
                      onPress={() => handleChipPress(chip.value)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          !useCustom && selectedMinutes === chip.value && styles.chipTextActive,
                        ]}
                      >
                        {chip.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Custom duration input */}
                <Text style={styles.label}>Or enter custom (minutes)</Text>
                <View style={styles.customRow}>
                  <TextInput
                    style={[styles.customInput, useCustom && styles.customInputActive]}
                    placeholder="e.g. 45"
                    placeholderTextColor={colors.gray400}
                    value={customInput}
                    onChangeText={handleCustomChange}
                    keyboardType="number-pad"
                    maxLength={4}
                    returnKeyType="done"
                  />
                  {customInput.length > 0 && (
                    <TouchableOpacity
                      onPress={() => { setCustomInput(''); setUseCustom(false); }}
                      style={styles.clearCustom}
                    >
                      <Ionicons name="close-circle" size={18} color={colors.gray400} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Summary / warning time */}
                <View style={styles.summaryCard}>
                  <View style={styles.summaryRow}>
                    <Ionicons name="alarm-outline" size={18} color={colors.yellow} />
                    <Text style={styles.summaryText}>
                      Alert at <Text style={styles.summaryBold}>{warnStr}</Text>{' '}
                      ({timerWarningMinutes} min warning)
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
                  style={[styles.startButton, (!effectiveMinutes || effectiveMinutes <= 0) && styles.startButtonDisabled]}
                  onPress={handleStart}
                  activeOpacity={0.85}
                  disabled={!effectiveMinutes || effectiveMinutes <= 0}
                >
                  <Ionicons name="play" size={18} color={colors.white} />
                  <Text style={styles.startButtonText}>Start Timer — {hoursDisplay}</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Cancel button */}
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose} activeOpacity={0.7}>
              <Text style={styles.cancelText}>{started ? 'Close' : 'Cancel'}</Text>
            </TouchableOpacity>

            <View style={{ height: Platform.OS === 'ios' ? 24 : 8 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.md,
    paddingTop: spacing.sm,
    maxHeight: '85%',
    ...shadow.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray300,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: font.xxl,
    fontWeight: '800',
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  spotName: {
    fontSize: font.sm,
    color: colors.gray500,
    lineHeight: 20,
  },
  durationLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  durationLabelText: {
    fontSize: font.md,
    color: colors.gray600,
    fontWeight: '500',
  },
  durationValue: {
    color: colors.primary,
    fontWeight: '700',
  },
  label: {
    fontSize: font.sm,
    fontWeight: '700',
    color: colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.sm,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    borderWidth: 1.5,
    borderColor: colors.gray200,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.gray50,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.blueLight,
  },
  chipText: {
    fontSize: font.md,
    fontWeight: '600',
    color: colors.gray600,
  },
  chipTextActive: {
    color: colors.primary,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.gray200,
    borderRadius: radius.md,
    backgroundColor: colors.gray50,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
  },
  customInput: {
    flex: 1,
    fontSize: font.lg,
    color: colors.gray800,
    paddingVertical: 11,
  },
  customInputActive: {
    color: colors.primary,
  },
  clearCustom: {
    padding: 4,
  },
  summaryCard: {
    backgroundColor: colors.gray50,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryText: {
    fontSize: font.md,
    color: colors.gray600,
    flex: 1,
  },
  summaryBold: {
    fontWeight: '800',
    color: colors.gray800,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: 15,
    gap: spacing.sm,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  startButtonDisabled: {
    opacity: 0.5,
  },
  startButtonText: {
    color: colors.white,
    fontSize: font.lg,
    fontWeight: '800',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  cancelText: {
    fontSize: font.lg,
    color: colors.gray500,
    fontWeight: '500',
  },
  successState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  successEmoji: {
    fontSize: 56,
  },
  successText: {
    fontSize: font.xl,
    fontWeight: '700',
    color: colors.green,
    textAlign: 'center',
  },
  successSub: {
    fontSize: font.md,
    color: colors.gray500,
    textAlign: 'center',
    lineHeight: 22,
  },
});
