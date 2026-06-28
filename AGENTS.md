# Group Expense Tracker — Project Context

## Overview

A serverless, decentralized mobile app for tracking shared expenses among friends during group trips. Built with **React Native (Expo SDK 56)** and **Gun.js** (P2P graph database). No backend, no server costs, no accounts — data syncs directly between devices over the internet.

Targets: **iOS** + **Android** + **Web** (via react-native-web).

---

## Tech Stack

| Layer | Package | Version |
|-------|---------|---------|
| Framework | expo | ~56.0.12 |
| Navigation | expo-router | ~56.2.11 |
| Language | typescript | ~6.0.3 |
| P2P Database | gun | 0.2020.1239 |
| State | zustand | ^5.0.0 |
| Local Storage | @react-native-async-storage/async-storage | 2.1.2 |
| QR Gen | react-native-qrcode-svg | ^6.3.0 |
| QR Scan | expo-camera | ~56.0.8 |
| File I/O | expo-file-system | ~56.0.8 |
| Share Sheet | expo-sharing | ~56.0.18 |
| React | react | 19.2.3 |
| RN | react-native | 0.85.3 |
| Web polyfill | react-native-web | ^0.21.2 |
| Crypto shim | react-native-get-random-values + buffer + text-encoding | — |

### Key architectural decisions

- **Gun.js without SEA** — The SEA (Security/Encryption/Auth) module requires WebCrypto, which isn't natively available in React Native. Instead, the app uses simple UUID-based device identity. Gun.js core sync works without SEA.
- **expo-file-system/legacy** — SDK 56 moved the old file API to `expo-file-system/legacy`. All imports use the legacy path.
- **react-native-reanimated 4.3.1** — This version split worklets into `react-native-worklets` (separate package). Both must be installed.

---

## Project Structure

```
expense-tracker-app/
├── shim.js                              # Global polyfills (loaded first)
│                                        # Sets up Buffer, TextEncoder, TextDecoder
│
├── app/                                 # Expo Router (file-based routing)
│   ├── _layout.tsx                      # Root layout: inits Gun.js, loads trips, splash screen
│   ├── index.tsx                        # HOME: trip list, create button, long-press to delete
│   └── trip/
│       ├── new.tsx                      # CREATE TRIP: name, currency picker, participant entry
│       └── [id]/
│           ├── index.tsx                # TRIP DETAIL: expense feed + BalanceSummary + FAB
│           ├── expense/add.tsx          # ADD EXPENSE: form + SplitSelector (3 modes)
│           ├── people.tsx               # PEOPLE: add/remove participants
│           ├── settle.tsx               # SETTLE: minimum-payout suggestions + Mark Paid
│           └── sync.tsx                 # SYNC: QR code gen, JSON file export/import
│
├── src/
│   ├── server/
│   │   └── relay.js                     # Gun relay server (Node.js, for internet-based sync)
│   │
│   ├── src/
│   │   ├── gun/
│   │   │   ├── setup.ts                 # Gun() singleton init, device ID, relay config, peer events
│   │   │   └── adapter.ts               # AsyncStorage read/write adapters for Gun persistence
│   │   │
│   │   ├── stores/
│   │   │   ├── tripStore.ts             # Zustand: trips list, CRUD, subscribed to Gun graph
│   │   │   ├── expenseStore.ts          # Zustand: expenses/participants/settlements + remote change detection
│   │   │   ├── peerStore.ts             # Zustand: device ID + connected peers + relay URL
│   │   │   └── notificationStore.ts     # Zustand: in-app notification queue
│   │   │
│   │   ├── components/
│   │   │   ├── SplitSelector.tsx            # Split mode UI: equal / custom / percentage toggles
│   │   │   ├── ExpenseCard.tsx              # Single expense display: payer, split details, delete
│   │   │   ├── BalanceSummary.tsx           # Balance bars + minimum-payout settlement list
│   │   │   ├── SyncStatusBar.tsx            # "Offline" / "N peers connected" indicator
│   │   │   └── InAppNotification.tsx        # Animated toast banner for real-time change alerts
│   │
│   ├── utils/
│   │   ├── split.ts                     # Split calculation & validation (equal/custom/%)
│   │   ├── balance.ts                   # Net balance calc + greedy minimum-payout algorithm
│   │   └── merge.ts                     # UUID-based merge for JSON import conflict resolution
│   │
│   └── types/
│       ├── index.ts                     # Trip, Participant, Expense, Settlement, Balance, etc.
│       └── gun.d.ts                     # Ambient declarations for Gun.js modules
│
├── app.json                             # Expo config (plugins, permissions, schema)
├── package.json
├── tsconfig.json
└── README.md
```

---

## Data Model

All stored in Gun.js graph under `trips/{id}/...`:

```
Trip
  ├── id: string (UUID)
  ├── name: string
  ├── currency: string
  ├── createdAt: string (ISO)
  └── updatedAt: string (ISO)
  │
  ├── participants/{id}
  │   └── { id, name, createdAt, addedByDevice? }
  │
  ├── expenses/{id}
  │   └── { id, tripId, description, amount, paidBy,
  │          splitType, splitAmong[], splitDetails[],
  │          category, date, createdAt, updatedAt, addedByDevice }
  │
  └── settlements/{id}
      └── { id, tripId, fromParticipantId, toParticipantId,
             amount, settled, date }
```

Gun.js graph keys: `trips` → `{tripId}` → `participants|expenses|settlements` → `{entityId}`

---

## Data Flow

1. **App boots** (`app/_layout.tsx`):
   - `shim.js` polyfills Buffer/TextEncoder/TextDecoder
   - `getGun()` creates singleton Gun instance with AsyncStorage store
   - `initDeviceId()` gets/persists a UUID for this device
   - `initRelay()` reads stored relay URL from AsyncStorage → passes to `gun.opt({ peers: [url] })`
   - `initPeerTracking()` listens for `gun.on('hi'/'bye')` events → updates peerStore
   - `loadTrips()` subscribes to Gun `trips` node — reactive, updates on any peer change

2. **User creates data**:
   - UI calls Zustand store action (e.g. `addExpense()`)
   - Store action calls `getGun().get('trips').get(id).get('expenses').get(uuid).put(data)`
   - Gun.js persists to AsyncStorage + broadcasts to connected peers
   - Gun reactive `on()` callback fires → Zustand state updates → UI re-renders

3. **Sync between devices** (via Gun relay):
   - Both devices connect to the same Gun relay server → data syncs via WebSocket
   - Gun.js syncs automatically with CRDT conflict resolution (last-write-wins per field)
   - Real-time: changes from one peer appear on the other within seconds
   - `peerStore.connectedPeers` shows live count of connected peers
   - `SyncStatusBar` displays "N peers connected" or "Offline"

4. **In-app notifications** (when app is open):
   - `expenseStore.loadTripData()` tracks known entity IDs per trip
   - After 2s initial load, new items syncing in from other devices trigger `notificationStore.show()`
   - `InAppNotification` component renders an animated toast banner (4s auto-dismiss)
   - Currently fires for: new expenses from other devices (`addedByDevice !== deviceId`)
   - Future: participants joining, settlements marked paid

5. **QR-based peer sharing** (`sync.tsx` "Share" tab):
   - QR encodes `gun://{relay-host}/trips/{tripId}` — compact enough for QR limits
   - Other user scans QR (or enters trip ID manually) in "Join" tab
   - Their app connects to the same relay → trip data syncs automatically
   - No manual import needed — real-time sync handles it

6. **File fallback sync** (`sync.tsx` "File" tab):
   - Export: serializes entire Gun graph state as JSON → writes to cache → shares via OS share sheet
   - Import: reads JSON file → reconciles with existing data by UUID (newer `updatedAt` wins) → writes merged data back to Gun

---

## Key Business Logic

### Balance Engine (`src/utils/balance.ts`)

```
calculateBalances(participants, expenses, settlements) → Balance[]
  For each expense:
    payer.paid += amount
    each participant.owed += their split share
  For each settlement:
    fromPerson.paid += amount
    toPerson.owed += amount
  net = paid - owed
```

### Minimum-Payout Settlement (`calculateSettlements`)

Greedy algorithm:
1. Sort creditors (net > 0) descending
2. Sort debtors (net < 0) ascending (most negative first)
3. Match largest debtor → largest creditor, transfer min(|debtor|, creditor)
4. Repeat until all balances ~0

### Split Engine (`src/utils/split.ts`)

| Mode | Math | Validation |
|------|------|-----------|
| Equal | `amount / N`, first person gets rounding remainder | None needed |
| Custom | Exact per-person values | Sum must equal total amount |
| Percentage | `amount * pct / 100` | Percentages must sum to 100% |

---

## Design System

All UI code uses a centralized design system in `src/theme/`:

| File | Purpose |
|------|---------|
| `constants.ts` | `ThemeColors` interface + `DARK_THEME` / `LIGHT_THEME` color palettes + `spacing`, `borderRadius`, `typography`, `shadows` design tokens |
| `provider.tsx` | `ThemeProvider` (wraps app root) + `useTheme()` / `useThemeColors()` hooks. Uses `useColorScheme()` from RN to auto-detect system dark/light mode. |
| `index.ts` | Re-exports all theme utilities |

### Usage pattern:
```tsx
import { useThemeColors, spacing, borderRadius, typography, shadows } from '../theme'

function Component() {
  const colors = useThemeColors()
  return (
    <View style={[styles.card, { backgroundColor: colors.bgSurface }, shadows.md]}>
      <Text style={[styles.title, { color: colors.text }]}>Hello</Text>
    </View>
  )
}
```

### Color tokens:
- `bg` — root background
- `bgSurface` — card/surface background  
- `bgSecondary` / `bgTertiary` — lower-level surfaces
- `text` / `textSecondary` / `textMuted` / `textTertiary` — text hierarchy
- `accent` / `accentLight` / `accentDark` — primary action color
- `success` / `error` / `warning` — semantic colors (each has a `*Light` variant for backgrounds)
- `border` / `borderLight` / `divider` — border hierarchy
- `card` / `navBar` / `tabBar` — contextual surfaces
- `skeleton` / `skeletonHighlight` — loading state colors

### Key UX/UI decisions:
- iOS-inspired design language (SF-style typography, generous spacing, frosted nav bars)
- Cards use `borderRadius.lg` (14px) with `shadows.md` for depth
- All interactive elements have minimum 44pt touch targets
- Semantic colors for balance (green = positive, red = negative)
- Category colors mapped per expense type
- Alphabetical sections in People screen
- Search bar on Home screen
- Split preview on Add Expense screen
- Pull-to-refresh ready (RefreshControl import available)

---

## Current Implementation Status

| Feature | Status | File |
|---------|--------|------|
| Trip CRUD | ✅ Done | `tripStore.ts`, `app/index.tsx`, `app/trip/new.tsx` |
| Participants | ✅ Done | `expenseStore.ts`, `app/trip/[id]/people.tsx` |
| Add Expense (3 split modes) | ✅ Done | `expenseStore.ts`, `add.tsx`, `SplitSelector.tsx` |
| Balance Calculation | ✅ Done | `balance.ts` |
| Minimum-Payout Settlement | ✅ Done | `balance.ts`, `settle.tsx` |
| Mark Settlements Paid | ✅ Done | `settle.tsx`, `expenseStore.ts` |
| QR Code Export | ✅ Done | `sync.tsx` |
| JSON File Export/Import | ✅ Done | `sync.tsx`, `merge.ts` |
| QR Scanning (camera import) | ✅ Done | `sync.tsx` (CameraView + onBarcodeScanned) |
| Gun.js P2P Auto-Sync | ✅ Done | `gun/setup.ts`, stores subscribe via `on()` |
| Gun Relay Server | ✅ Done | `server/relay.js` |
| Gun Peer Tracking | ✅ Done | `gun/setup.ts` — `initPeerTracking()` via `gun.on('hi'/'bye')` |
| Relay URL Config | ✅ Done | `src/gun/setup.ts` — `initRelay()` + `setRelayUrl()`, stored in AsyncStorage |
| In-App Notifications | ✅ Done | `InAppNotification.tsx`, `notificationStore.ts` |
| Share/Join Trip (QR) | ✅ Done | `sync.tsx` — Share tab (QR with `gun://` format) |
| Join Trip (Scan QR) | ✅ Done | `sync.tsx` — Join tab (CameraView scanner + manual entry) |
| Web Support | ✅ Done | `react-native-web` installed |
| Design System (Theme) | ✅ Done | `src/theme/` — dark/light auto-detection |
| Search & Filter | ✅ Done | `app/index.tsx` — search bar on Home |
| Category Colors | ✅ Done | `ExpenseCard.tsx` — per-category color indicators |
| Alphabetical Sections | ✅ Done | `app/trip/[id]/people.tsx` — SectionList |
| Split Preview | ✅ Done | `add.tsx` — live split calculation preview |
| Enhanced Settlement UI | ✅ Done | `settle.tsx` — visual payer/payee flow |
| Segment Control Nav | ✅ Done | `sync.tsx` — iOS-style segmented control |

---

## Known Issues & Gotchas

1. **Gun.js does not use SEA** — WebCrypto unavailable in React Native. Device identity uses UUID. This means no built-in encryption. If encryption is needed later, peer auth must be added.
2. **expo-file-system uses legacy API** — SDK 56 moved the old file API to `expo-file-system/legacy`. Always import from there.
3. **react-native-reanimated 4.x** — Requires `react-native-worklets` as a separate npm package. If reanimated-related errors appear, check that `react-native-worklets` is installed.
4. **QR scanning** — The `CameraView` from `expo-camera` is used in `sync.tsx` Join tab. On first use, the app requests camera permission. Scanner decodes `gun://<relay>/trips/<tripId>` format and auto-connects to the relay.
5. **Gun.js peer discovery** — Connected peers are tracked via `gun.on('hi'/'bye')` events. The `connectedPeers` array in peerStore is updated in real-time. For internet-based sync, both devices must connect to the same Gun relay.
6. **No input validation on amounts** — The app trusts user input for amounts. Consider adding max-value guards.
7. **Dark mode** — System dark/light mode is fully supported via the theme provider. The app auto-detects the system appearance.

---

## How to Run

```bash
cd expense-tracker-app
npm install
npx expo start
# Then: press 'i' for iOS simulator, 'a' for Android, 'w' for web
```

### Build Verification

```bash
npx tsc --noEmit                    # TypeScript check
npx expo export --platform ios      # iOS bundle
npx expo export --platform android  # Android bundle
npx expo export --platform web      # Web bundle
```

---

## Future Roadmap

1. **QR scanning** — Complete the camera import flow in `sync.tsx`
2. **Edit/delete expenses** — Edit endpoint exists in `expenseStore.ts`, needs UI in `ExpenseCard.tsx`
3. **Receipt image attachment** — Use `expo-image-picker` to attach receipt photos
4. **Multi-currency conversion** — Exchange rates API for trips with mixed currencies
5. **Push notifications** — When a peer adds an expense, notify others
6. **Gun.js relay peer** — Option to connect to a public Gun relay for internet-based sync without QR
7. **Testing** — Add Jest/React Native Testing Library tests for balance/split logic
8. **EAS Build** — Configure eas.json for production builds to App Store / Play Store

---

*This file was generated by the LLM that built the initial version of this app. It is meant to be read by any LLM (or human) to quickly understand the full project context.*
