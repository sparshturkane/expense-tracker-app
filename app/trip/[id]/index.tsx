import { useEffect, useMemo, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTripStore } from '../../../src/stores/tripStore'
import { useExpenseStore } from '../../../src/stores/expenseStore'
import { calculateBalances, calculateSettlements } from '../../../src/utils/balance'
import ExpenseCard from '../../../src/components/ExpenseCard'
import BalanceSummary from '../../../src/components/BalanceSummary'
import { useThemeColors, spacing, borderRadius, typography, shadows } from '../../../src/theme'

export default function TripDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const colors = useThemeColors()

  const trip = useTripStore(s => s.trips.find(t => t.id === id))
  const {
    participantsByTrip,
    expensesByTrip,
    settlementsByTrip,
    loadTripData,
    deleteExpense,
  } = useExpenseStore()

  useEffect(() => {
    if (id) loadTripData(id)
  }, [id])

  const participants = participantsByTrip[id!] || []
  const expenses = expensesByTrip[id!] || []
  const settlements = settlementsByTrip[id!] || []

  const sortedExpenses = useMemo(
    () => [...expenses].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [expenses]
  )

  const balances = useMemo(
    () => calculateBalances(participants, expenses, settlements),
    [participants, expenses, settlements]
  )

  const suggestions = useMemo(
    () => calculateSettlements(balances, participants),
    [balances, participants]
  )

  const pendingBalances = useMemo(
    () => balances.filter(b => Math.abs(b.net) > 0.01),
    [balances]
  )

  if (!trip) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.textMuted }]}>Trip not found</Text>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.accent }]} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: colors.navBar, borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={[styles.headerBtnText, { color: colors.accent }]}>{'\u2039'} Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{trip.name}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {participants.length} people {'\u00B7'} {trip.currency}
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push(`/trip/${id}/sync`)} style={styles.headerBtn}>
          <Text style={[styles.headerBtnText, { color: colors.accent }]}>Sync</Text>
        </TouchableOpacity>
      </View>

      <BalanceSummary balances={balances} settlementSuggestions={suggestions} currency={trip?.currency} />

      <FlatList
        data={sortedExpenses}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          sortedExpenses.length > 0 ? (
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Expenses</Text>
              {pendingBalances.length > 0 && (
                <Text style={[styles.balanceHint, { color: pendingBalances.length > 1 ? colors.warning : colors.success }]}>
                  {pendingBalances.length} unsettled
                </Text>
              )}
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={{ fontSize: 48, marginBottom: spacing.lg }}>{'\uD83D\uDCB0'}</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No expenses yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Tap the + button to add your first expense
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ExpenseCard
            expense={item}
            participants={participants}
            currency={trip?.currency}
            onDelete={() => deleteExpense(id!, item.id)}
          />
        )}
        contentContainerStyle={styles.list}
      />

      <View style={[styles.footer, { backgroundColor: colors.navBar, borderTopColor: colors.divider }]}>
        <TouchableOpacity
          style={[styles.footerBtn, { backgroundColor: colors.bgTertiary }]}
          onPress={() => router.push(`/trip/${id}/people`)}
        >
          <Text style={[styles.footerBtnText, { color: colors.accent }]}>People</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.accent }]}
          onPress={() => router.push(`/trip/${id}/expense/add`)}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerBtn, { backgroundColor: colors.bgTertiary }]}
          onPress={() => router.push(`/trip/${id}/settle`)}
        >
          <Text style={[styles.footerBtnText, { color: colors.accent }]}>Settle</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  headerBtnText: {
    ...typography.body,
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    ...typography.headline,
  },
  subtitle: {
    ...typography.caption,
    marginTop: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.footnoteBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceHint: {
    ...typography.captionBold,
  },
  list: {
    paddingBottom: 120,
  },
  center: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: spacing.xxxxl,
  },
  emptyTitle: {
    ...typography.title2,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.callout,
    textAlign: 'center',
  },
  errorText: {
    ...typography.body,
    marginBottom: spacing.lg,
  },
  backBtn: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  backBtnText: {
    color: '#fff',
    ...typography.calloutBold,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xxxl,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  footerBtnText: {
    ...typography.subheadBold,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    fontSize: 28,
    color: '#fff',
    lineHeight: 30,
    fontWeight: '300',
  },
})
