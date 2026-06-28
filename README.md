# Group Expense Tracker

A serverless, decentralized mobile app for tracking shared expenses among friends during group trips. Built with **React Native (Expo SDK 56)** and **Gun.js** for peer-to-peer sync over the internet — no backend, no server costs, no accounts.

---

## Features

- **Create trips** — Set up group trips with custom currency and participants
- **Add expenses** — Log who paid, how much, for what, and split it
- **Three split modes** — Equal, custom amounts, or percentage-based splits
- **Auto-calculated balances** — See exactly who owes whom at a glance
- **Minimum-payout settlements** — Greedy algorithm reduces the number of transactions needed to settle up
- **Mark settlements as paid** — Record when someone pays their share
- **Decentralized P2P sync** — Data syncs directly between devices via Gun.js (no server)
- **QR code export** — Share trip data via QR codes
- **File export/import** — Export as JSON and share via any messaging app (WhatsApp, AirDrop, email, etc.)
- **Offline-first** — All data stored locally, syncs when peers are connected

## Screens

| Screen | Description |
|--------|-------------|
| Home | List of trips, long-press to delete |
| New Trip | Name, currency selection, participant list |
| Trip Detail | Expense feed, balance bars, settlement suggestions |
| Add Expense | Description, amount, payer, split type selector, category |
| People | Add/remove participants |
| Settle Up | Minimum-transaction payout suggestions with "Mark Paid" |
| Sync | QR code export, JSON file export/import |

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
     │  AsyncStorage   │       │  Other peers      │
     │  (local cache)  │       │  (internet sync)  │
     └─────────────────┘       └──────────────────┘
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | React Native (Expo SDK 56) | Cross-platform mobile (iOS + Android) |
| Language | TypeScript | Type safety |
| Navigation | Expo Router | File-based routing |
| P2P Data Layer | Gun.js | Decentralized graph DB with auto-sync |
| Local Storage | AsyncStorage | Persistent local cache |
| State Management | Zustand | Lightweight reactive state |
| QR Codes | react-native-qrcode-svg | QR generation for sharing |
| File I/O | expo-file-system + expo-sharing | JSON export/import |
| Camera | expo-camera | QR scanning |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npx expo`)
- iOS Simulator (Mac) or Android Emulator, or a physical device with Expo Go

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

# Run on specific platform
npx expo start --ios
npx expo start --android

# Scan the QR code with Expo Go on your phone
```

### Building for Production

```bash
# Install EAS CLI if you haven't
npm install -g eas-cli

# Build for iOS
npx eas build --platform ios --profile production

# Build for Android
npx eas build --platform android --profile production
```

## How It Works

### Serverless P2P Sync

Each device runs a Gun.js node that stores all trip data locally in AsyncStorage. When devices are connected to the internet and can discover each other, Gun.js automatically syncs data between them using a CRDT-based conflict resolution algorithm (similar to blockchain Merkle trees). No central server is needed — data flows directly between peers.

### Sync Methods

1. **Automatic P2P sync** — When devices are online and connected to the same Gun.js network, data syncs in real-time
2. **QR code** — Generate a QR code of your trip data; others scan to import
3. **File export/import** — Export as JSON, share via any messaging platform, import on another device

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
| **Equal** | None | `amount ÷ N` per person |
| **Custom** | Amount per person | Exact values (must sum to total) |
| **Percentage** | % per person | `amount × % ÷ 100` (must sum to 100%) |

## Project Structure

```
expense-tracker-app/
├── app/                          # Expo Router pages
│   ├── _layout.tsx               # Root layout with Gun.js init
│   ├── index.tsx                 # Home screen
│   └── trip/
│       ├── new.tsx               # Create trip
│       └── [id]/
│           ├── index.tsx         # Trip detail
│           ├── expense/add.tsx   # Add expense
│           ├── people.tsx        # Manage participants
│           ├── settle.tsx        # Settle up
│           └── sync.tsx          # Export/import sync
├── src/
│   ├── components/
│   │   ├── BalanceSummary.tsx    # Balance visualization
│   │   ├── ExpenseCard.tsx       # Expense display
│   │   ├── SplitSelector.tsx     # Split mode selector
│   │   └── SyncStatusBar.tsx     # Connection status
│   ├── gun/
│   │   ├── setup.ts              # Gun.js initialization
│   │   └── adapter.ts            # AsyncStorage adapter
│   ├── stores/
│   │   ├── tripStore.ts          # Trip state
│   │   ├── expenseStore.ts       # Expense/participant state
│   │   └── peerStore.ts          # Peer connection state
│   ├── types/
│   │   ├── index.ts              # TypeScript interfaces
│   │   └── gun.d.ts              # Gun.js type declarations
│   └── utils/
│       ├── balance.ts            # Balance + settlement engine
│       ├── merge.ts              # Import merge logic
│       └── split.ts              # Split calculation
├── shim.js                       # Global polyfills
├── app.json                      # Expo configuration
└── package.json
```

## License

MIT
