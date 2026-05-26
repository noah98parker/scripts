export default ({ config }) => ({
  ...config,
  name: 'The Know Company',
  slug: 'the-know-company',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#1a56db',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.theknowcompany.parking',
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'The Know Company needs your location to check nearby parking rules and find garages.',
      NSLocationAlwaysAndWhenInUseUsageDescription:
        'The Know Company uses background location to send parking timer alerts before your meter expires.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#1a56db',
    },
    package: 'com.theknowcompany.parking',
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'RECEIVE_BOOT_COMPLETED',
      'SCHEDULE_EXACT_ALARM',
    ],
  },
  plugins: [
    'expo-router',
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'Allow The Know Company to use your location for parking checks and timer alerts.',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#1a56db',
        sounds: [],
      },
    ],
  ],
  scheme: 'theknowcompany',
  extra: {
    // Set these in a .env file at project root, or via EAS Secrets for production.
    // Create a FREE Supabase project at https://supabase.com and paste your keys below.
    supabaseUrl: process.env.SUPABASE_URL ?? '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? '',
    eas: {
      projectId: 'your-eas-project-id', // replace after running: eas init
    },
  },
  experiments: {
    typedRoutes: false,
  },
});
