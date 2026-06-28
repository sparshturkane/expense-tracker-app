# Group Expense Tracker

A serverless, decentralized mobile app for tracking shared expenses among friends during group trips. Built with **React Native (Expo SDK 56)** and **Gun.js** (P2P graph database) — no backend, no server costs, no accounts required. Data syncs directly between devices over the internet.

Targets: **iOS** + **Android** + **Web** (via react-native-web).

---

## Features

- **Create trips** — Set up group trips with custom currency and participants
- **Add expenses** — Log who paid, how much, for what, and split it
- **Three split modes** — Equal, custom amounts, or percentage-based splits with live preview
- **Auto-calculated balances** — See exactly who owes whom at a glance
- **Minimum-payout settlements** — Greedy algorithm reduces the number of transactions needed to settle up
- **Mark settlements as paid** — Record when someone pays their share
- **Decentralized P2P sync** — Data syncs directly between devices via Gun.js relay server
- **QR code sharing** — Generate QR codes with `gun://` URLs for instant trip joining
- **QR scanning** — Scan QR codes with the camera to join trips
- **File export/import** — Export as JSON and share via any messaging app; import on another device
- **In-app notifications** — Real-time toasts when other peers add expenses
- **Search & filter** — Search trips on the home screen
- **Category colors** — Color-coded expense categories
- **Dark mode** — Auto-detects system appearance (dark/light)
- **Offline-first** — All data stored locally, syncs when peers are connected
- **Web support** — Works in the browser via react-native-web

## Screens

| Screen | Description |
|--------|-------------|
| Home | Trip list with search bar, long-press to delete |
| New Trip | Name, currency selection, participant entry |
| Trip Detail | Expense feed, balance bars, settlement suggestions |
| Add Expense | Description, amount, payer, 3-mode split selector with live preview, category |
| People | Add/remove participants with alphabetical sections |
| Settle Up | Minimum-transaction payout suggestions with visual payer/payee flow and "Mark Paid" |
| Sync | Segmented control: Share (QR with `gun://` format), Join (camera scanner + manual entry), File (JSON export/import) |

## Architecture

```
                    ┌──────────────────┐
                    │   Expo Router    │
                    │  (file-based)    │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │    Zustand       │
                    │  (UI state)      │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │     Gun.js       │
                    │  (P2P graph DB)  │
                    └────────┬─────────┘
                             │
               ┌─────────────┴─────────────┐
               │                           │
      ┌────────▼────────┐       ┌─────────▼────────┐
      │  AsyncStorage   │       │  Gun Relay        │
      │  (local cache)  │       │  (internet sync)  │
      └─────────────────┘       └──────────────────┘
```

### Data Flow

1. **App boots** — Gun.js singleton initialized with AsyncStorage persistence; device UUID generated; relay connection established; reactive subscription to trip data
2. **User creates data** — Zustand store action writes to Gun graph → persisted locally + broadcast to peers
3. **Sync between devices** — Both devices connect to the same Gun relay → data syncs via WebSocket with CRDT conflict resolution (last-write-wins per field)
4. **In-app notifications** — New expenses from other devices trigger animated toast banners (auto-dismiss after 4s)

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | React Native (Expo SDK 56) | Cross-platform mobile (iOS + Android + Web) |
| Language | TypeScript | Type safety |
| Navigation | Expo Router (SDK 56) | File-based routing |
| P2P Data Layer | Gun.js | Decentralized graph DB with auto-sync |
| State Management | Zustand | Lightweight reactive state |
| Local Storage | AsyncStorage | Persistent local cache |
| UI | react-native-reanimated + react-native-worklets | Animations |
| Design System | Custom theme provider | Dark/light mode with auto-detection |
| QR Generation | react-native-qrcode-svg | QR generation for sharing |
| QR Scanning | expo-camera | Camera barcode scanning |
| File I/O | expo-file-system/legacy + expo-sharing | JSON export/import |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npx expo`)
- Expo Go app on your phone (iOS or Android)
- iOS Simulator (Mac) or Android Emulator (optional)

### Installation

```bash
git clone <repo-url>
cd expense-tracker-app
npm install
```

### Running

```bash
# Start the dev server
npx expo start

# Scan the QR code with Expo Go on your phone

# Or run on a simulator:
npx expo start --ios
npx expo start --android

# Or run on web:
npx expo start --web
```

### Build Verification

```bash
npx tsc --noEmit                    # TypeScript check
npx expo export --platform ios      # iOS bundle
npx expo export --platform android  # Android bundle
npx expo export --platform web      # Web bundle
```

## How It Works

### Serverless P2P Sync

Each device runs a Gun.js node that stores all trip data locally in AsyncStorage. Devices connect to a shared Gun relay server over WebSocket for internet-based sync. Gun.js automatically syncs data between them using a CRDT-based conflict resolution algorithm (Merkle tree). A relay server is optional but recommended for reliable internet sync.

### Data Model

```
trip
  ├── id, name, currency, createdAt, updatedAt
  ├── participants/{id} — { id, name, createdAt }
  ├── expenses/{id}     — { id, description, amount, paidBy, splitType, splitAmong[], ... }
  └── settlements/{id}  — { id, fromParticipantId, toParticipantId, amount, settled }
```

### Sync Methods

1. **Automatic P2P sync** — When devices are connected to the same Gun relay, data syncs in real-time
2. **QR code** — Generate a QR code with `gun://relay-host/trips/{tripId}` URL; others scan to join
3. **File export/import** — Export as JSON, share via any messaging platform, import on another device (UUID-based merge with newer `updatedAt` winning)

### Balance Calculation

For each expense:
- The payer gets credited the full amount
- Each participant gets debited their share (based on split mode)
- Net balance = total paid − total owed

### Minimum-Payout Settlement

The settlement engine uses a greedy algorithm:
1. Sort creditors (positive balance) descending
2. Sort debtors (negative balance) ascending (most negative first)
3. Match the largest debtor with the largest creditor
4. Repeat until all balances are zero
5. Result: the minimum number of transactions to settle everyone

### Split Modes

| Mode | Input | Calculation |
|------|-------|------------|
| **Equal** | None | `amount ÷ N` per person (first person gets rounding remainder) |
| **Custom** | Amount per person | Exact values (must sum to total) |
| **Percentage** | % per person | `amount × % ÷ 100` (must sum to 100%) |

## Project Structure

```
expense-tracker-app/
├── shim.js                          # Global polyfills (Buffer, TextEncoder, TextDecoder)
├── app/                             # Expo Router (file-based routing)
│   ├── _layout.tsx                  # Root layout: Gun.js init, trip loading, splash screen
│   ├── index.tsx                    # Home: trip list with search, long-press to delete
│   └── trip/
│       ├── new.tsx                  # Create trip: name, currency, participants
│       └── [id]/
│           ├── index.tsx            # Trip detail: expense feed + balance + FAB
│           ├── expense/add.tsx      # Add expense: form + SplitSelector (3 modes)
│           ├── people.tsx           # People: add/remove participants (SectionList)
│           ├── settle.tsx           # Settle: minimum-payout + Mark Paid
│           └── sync.tsx             # Sync: QR share, QR scan, file export/import
├── src/
│   ├── server/
│   │   └── relay.js                 # Gun relay server (Node.js)
│   ├── gun/
│   │   ├── setup.ts                 # Gun() singleton, device ID, relay, peer tracking
│   │   └── adapter.ts               # AsyncStorage read/write adapters
│   ├── stores/
│   │   ├── tripStore.ts             # Zustand: trips list, CRUD, Gun subscription
│   │   ├── expenseStore.ts          # Zustand: expenses/participants/settlements
│   │   ├── peerStore.ts             # Zustand: device ID + connected peers
│   │   └── notificationStore.ts     # Zustand: in-app notification queue
│   ├── components/
│   │   ├── BalanceSummary.tsx        # Balance bars + minimum-payout list
│   │   ├── ExpenseCard.tsx           # Expense display: payer, split, category, delete
│   │   ├── SplitSelector.tsx         # Split mode UI: equal / custom / percentage
│   │   ├── SyncStatusBar.tsx         # "Offline" / "N peers connected" indicator
│   │   └── InAppNotification.tsx     # Animated toast banner for real-time alerts
│   ├── theme/
│   │   ├── constants.ts             # Color palettes + design tokens (dark/light)
│   │   ├── provider.tsx             # ThemeProvider + useTheme() hooks
│   │   └── index.ts                 # Re-exports
│   ├── types/
│   │   ├── index.ts                 # TypeScript interfaces
│   │   └── gun.d.ts                 # Gun.js type declarations
│   └── utils/
│       ├── balance.ts               # Balance calc + greedy settlement algorithm
│       ├── merge.ts                 # UUID-based merge for JSON import
│       └── split.ts                 # Split calculation & validation
├── app.json                         # Expo config (plugins, permissions, schema)
├── tsconfig.json
└── package.json
```

## License

MIT
