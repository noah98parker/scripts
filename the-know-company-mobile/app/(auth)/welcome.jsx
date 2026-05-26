import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, font, shadow } from '../../constants/theme';

const FEATURES = [
  { emoji: '🚦', text: 'Know if you can park here' },
  { emoji: '⏱️', text: 'Get timed alerts before tickets' },
  { emoji: '💰', text: 'Find cheaper garages nearby' },
];

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryDark, '#0f2d6b']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.3, y: 1 }}
    >
      <View style={styles.inner}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🅿️</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>The Know Company</Text>
        <Text style={styles.tagline}>Know before you park.</Text>

        {/* Feature list */}
        <View style={styles.featureList}>
          {FEATURES.map(({ emoji, text }) => (
            <View key={text} style={styles.featureRow}>
              <Text style={styles.featureEmoji}>{emoji}</Text>
              <Text style={styles.featureText}>{text}</Text>
            </View>
          ))}
        </View>

        {/* CTA Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={() => router.push('/(auth)/signup')}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.7}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.secondaryButtonText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => router.replace('/(tabs)/')}
          >
            <Text style={styles.guestLink}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  logoContainer: {
    marginBottom: spacing.lg,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    ...shadow.lg,
  },
  logoEmoji: {
    fontSize: 52,
  },
  title: {
    fontSize: font.xxxl,
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  tagline: {
    fontSize: font.xl,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: spacing.xl,
  },
  featureList: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  featureEmoji: {
    fontSize: 22,
    marginRight: spacing.md,
  },
  featureText: {
    fontSize: font.lg,
    color: colors.white,
    fontWeight: '500',
    flex: 1,
  },
  actions: {
    width: '100%',
    gap: spacing.md,
    alignItems: 'center',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: radius.full,
    paddingVertical: 16,
    alignItems: 'center',
    ...shadow.md,
  },
  primaryButtonText: {
    color: colors.primary,
    fontSize: font.lg,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: 'transparent',
    borderRadius: radius.full,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  secondaryButtonText: {
    color: colors.white,
    fontSize: font.lg,
    fontWeight: '600',
  },
  guestLink: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: font.md,
    marginTop: spacing.xs,
    textDecorationLine: 'underline',
  },
});
