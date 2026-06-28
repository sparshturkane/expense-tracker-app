# UX/UI Improvements for Expense Tracker App

## Priority Improvements

### 1. Dark Mode Support (Critical)
**Current:** No dark mode implemented; userInterfaceStyle set to 'automatic' but no dark theme styles

**Changes:**
- Add DARK_THEME constant in all CSS
- Create dark variants for all screens
- Toggle mechanism via local store

```typescript
const LIGHT_DARK = 'light',
      DARK = 'dark';

const THEMES = {
  [LIGHT_DARK]: { bg: '#fff', text: '#111' },
  [DARK]: { bg: '#0a0f14', text: '#ffffff', accent: '#06b6d5' }
};
```

### 2. Loading States & Skeleton Screens (Critical)
**Current:** No loading indicators when syncing data

**Changes:** Add shimmer effects during Gun.js sync operations and trip loading states.

```typescript
const LOADING = 'loading',
      IDLE = 'idle';
```

### 3. Enhanced Error Handling & Validation (High Priority)
**Current:** Basic validation; no user feedback for errors

**Changes:**
- Toast notifications for save failures
- Inline error messages below forms
- Summary of all validation errors at bottom

```typescript
const showSuccessToast = (message: string) => { /* ... */ }
const showErrorToast = (error: Error) => { /* ... */ }
```

### 4. Better Split Calculator UX (High Priority)
**Current:** Custom split requires manual entry of all amounts with validation

**Changes:**
- Add auto-fill suggestions based on group size
- Visual progress bar showing how much each person owes/receives
- One-click "split equally" button
- Keyboard-aware input formatting for percentages

### 5. Improved Balance Visualization (Critical)
**Current:** Simple bars; no clear visual indication of who owes whom

**Changes:**
- Color-coded balance indicators
- Clear "who can pay what to whom" visualization
- Graph-like diagram showing debt flow
- Total triangle showing net balance for each person

### 6. Participant Avatar & Photo Upload (Nice-to-Have)
**Current:** Text-based names only

**Changes:**
- Use avatars from initial onboarding (expo-image-picker integration)
- Emoji fallback for photos not uploaded
- Circular crop for avatars
- Group photo capability

### 7. Better Settlement Suggestions (High Priority)
**Current:** Minimum payout algorithm suggested; no clear "next step" indicators

**Changes:**
- Show who to pay and who can receive before settlement (3-way matching)
- Visualize minimum vs maximum payouts
- One-tap Mark as Settled with all suggestions selected
- Export/Import functionality for bulk processing

### 8. Navigation Improvements
**Current:** Basic FAB and action buttons; shallow navigation

**Changes:**
- Add backstack management for undo actions (delete/edit expense flow)
- Bottom sheet for trip settings vs dedicated settings screen
- Slide-back animation on return from nested screens
- Pull-to-refresh on expense list

## Code Structure Improvements

### 1. State Management Refactoring
**Current:** Mixed Zustand with direct Gun.js calls

**Recommended:** Standardize on Zustand state management with server-side updates via async actions

```typescript
interface IExpenseStore {
  expensesByTrip: Record<string, Expense[]>
  addExpense: (payloads: AddExpenseData) => Promise<null>; // Async for UI thread safety
  ...
}
```

### 2. TypeScript Type Safety Enhancements

**Current:** Inconsistent types; sometimes generic "any"

**Recommended:** Full TypeScript support with explicit interface definitions

```typescript
interface Trip {
  id: string;
  name: string;
  currency: string;
}
```

### 3. Component Library System

**Recommended:** Build a reusable component system for consistency:

- `Button` (variant: primary/secondary/danger)
- `Input` (variant: outline/filled/invalid with error state)
- `Card` (with border radius options)
- `Modal` (modal sheet for mobile, modal dialog for desktop)
- `Chip` (multi-select chips)

## File Structure Improvements

```
expense-tracker-app/src
├── components/
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── ExpenseCard.tsx
│   ├── BalanceSummary.tsx
│   ├── SplitSelector.tsx
│   └── SyncStatusBar.tsx
├── stores
│   ├── tripStore.ts
│   ├── expenseStore.ts (updated to use async actions)
│   └── peerStore.ts
└── utils
    ├── balance.ts
    ├── split.ts
    └── merge.ts
```

## Implementation Priority

1. **Fix immediate bug** (expense not storing) - `expenseStore.ts` sync issue
2. Add dark mode theming to all screens
3. Enhance expense storage with async actions pattern in Zustand
4. Add loading states and skeleton screens for data fetching
5. Improve balance visualization with clearer debt indicators
6. Add better error handling with toast notifications

Would you like me to start implementing these improvements? I recommend starting with the dark mode and fixing the expense storage issue first, as those are critical for usability.
