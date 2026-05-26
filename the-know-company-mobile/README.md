# The Know Company — Mobile App

> **Know before you park.** Real-time parking rules, tow alerts, nearby garages, and parking timers — for iOS and Android.

---

## Features

| Feature | Source | Notes |
|---|---|---|
| 🅿️ Parking status (can I park here?) | OpenStreetMap Overpass API | Free, worldwide |
| ⚖️ State/city law database | Built-in (all 50 states + DC) | Updated manually |
| 🏢 Nearby parking garages | OSM + Google Places (optional) | Google key in settings |
| 🏙️ City parking meters | NYC / LA / Chicago Open Data | Auto-detected by location |
| 🚛 Local tow companies | OSM + national hotline fallback | Free |
| ❤️ Save favorite spots | Supabase (requires account) | Free tier |
| ⏱️ Parking timers + alerts | Expo local notifications | No account needed |
| 👤 User accounts | Supabase Auth (email/password) | Free tier |

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/noah98parker/scripts.git
cd scripts
git checkout claude/know-company-parking-app-NH23b
cd the-know-company-mobile
npm install
```

### 2. Set up Supabase (free — 5 min)

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Copy your **Project URL** and **anon/public key** from Project Settings → API
3. In **SQL Editor**, paste and run the contents of [`supabase/schema.sql`](./supabase/schema.sql)
4. Create a `.env` file:

```bash
cp .env.example .env
# Fill in SUPABASE_URL and SUPABASE_ANON_KEY
```

### 3. Add placeholder assets

```bash
# The app needs these images (any 1024x1024 PNG works to start):
# assets/icon.png
# assets/splash.png
# assets/adaptive-icon.png
# assets/notification-icon.png
```

### 4. Run

```bash
# Install Expo CLI if you haven't
npm install -g expo-cli

# Start dev server
npx expo start

# Run on your phone — install "Expo Go" from App Store / Play Store
# Scan the QR code
```

### 5. Google Maps (Android only)

In `app.config.js` → `android`, add:
```js
config: {
  googleMaps: { apiKey: 'YOUR_ANDROID_MAPS_KEY' }
}
```
Get a key at [Google Cloud Console](https://console.cloud.google.com) → Enable **Maps SDK for Android**.

---

## Optional: Google Places API (richer garage data)

1. In the app, go to **Account** tab → **Settings**
2. Paste your Google Places API key
3. It's stored securely with `expo-secure-store`
4. Garage results will now include real names, ratings, and hours from Google Maps

---

## Build for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in
eas login

# Initialize (creates your EAS project)
eas init

# Build iOS TestFlight / Android APK
eas build --platform all
```

---

## Architecture

```
the-know-company-mobile/
├── app/
│   ├── _layout.jsx              # Root: auth, notifications, location setup
│   ├── (auth)/                  # Welcome, Login, Sign Up
│   └── (tabs)/                  # Map, Garages, Tow, Laws, Account
├── components/                  # Shared UI components
│   ├── ParkingStatusCard.jsx
│   ├── GarageCard.jsx
│   ├── TimerModal.jsx
│   └── FavoriteButton.jsx
├── services/
│   ├── overpass.js              # OpenStreetMap (free, worldwide)
│   ├── googlePlaces.js          # Google Places (optional key)
│   ├── cityOpenData.js          # NYC / LA / Chicago SODA APIs
│   ├── parkingRules.js          # State law DB + verdict engine
│   ├── supabase.js              # Auth + favorites + timers
│   └── notifications.js         # Expo local push notifications
├── store/
│   ├── useAuthStore.js          # Zustand: auth state
│   ├── useParkingStore.js       # Zustand: location + parking data
│   └── useSettingsStore.js      # Zustand: persisted preferences
├── constants/
│   └── theme.js                 # Colors, spacing, typography
└── supabase/
    └── schema.sql               # DB migration (run once)
```

---

## City Open Data Coverage

| City | Dataset | Update Freq |
|---|---|---|
| New York City | [NYC Open Data — Parking Meters](https://data.cityofnewyork.us/resource/s5n9-7fhf.json) | Near real-time |
| Los Angeles | [LA City Open Data — Parking Meters](https://data.lacity.org/resource/e7h6-4a3e.json) | Near real-time |
| Chicago | [Chicago Data Portal — Parking Meters](https://data.cityofchicago.org/resource/wrvz-psew.json) | Near real-time |

More cities coming: San Francisco, Seattle, Boston, Washington DC, Philadelphia.

---

## License

MIT © The Know Company
