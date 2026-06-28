import { useMemo } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useExpenseStore } from '../../../src/stores/expenseStore'
import { useTripStore } from '../../../src/stores/tripStore'
import { calculateBalances, calculateSettlements } from '../../../src/utils/balance'
import BalanceSummary from '../../../src/components/BalanceSummary'
import { useThemeColors, spacing, borderRadius, typography, shadows, formatCurrency, getCurrencySymbol } from '../../../src/theme'

export default function SettleScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const colors = useThemeColors()

  const trip = useTripStore(s => s.trips.find(t => t.id === id))
  const { participantsByTrip, expensesByTrip, settlementsByTrip, addSettlement } = useExpenseStore()

  const participants = participantsByTrip[id!] || []
  const expenses = expensesByTrip[id!] || []
  const settlements = settlementsByTrip[id!] || []

  const balances = useMemo(
    () => calculateBalances(participants, expenses, settlements),
    [participants, expenses, settlements]
  )

  const suggestions = useMemo(
    () => calculateSettlements(balances, participants),
    [balances, participants]
  )

  const handleSettle = (from: string, to: string, amount: number) => {
    const fromName = participants.find(p => p.id === from)?.name || 'Unknown'
    const toName = participants.find(p => p.id === to)?.name || 'Unknown'

    Alert.alert(
      'Confirm Settlement',
      `${fromName} will pay ${toName} ${formatCurrency(amount, trip?.currency)}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            addSettlement(id!, from, to, amount)
            Alert.alert('Done', 'Settlement recorded')
          },
        },
      ]
    )
  }

  const allSettled = balances.every(b => Math.abs(b.net) < 0.01)

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.divider, backgroundColor: colors.navBar }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.back, { color: colors.accent }]}>{'\u2039'} Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Settle Up</Text>
        <View style={{ width: 50 }} />
      </View>

      {allSettled ? (
        <View style={styles.center}>
          <View style={[styles.settledIcon, { backgroundColor: colors.successLight }]}>
            <Text style={{ fontSize: 36 }}>{'\u2714\uFE0F'}</Text>
          </View>
          <Text style={[styles.settledTitle, { color: colors.text }]}>All settled up!</Text>
          <Text style={[styles.settledText, { color: colors.textSecondary }]}>
            No outstanding balances
          </Text>
        </View>
      ) : (
        <FlatList
          data={suggestions}
          keyExtractor={(_, i) => String(i)}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              <BalanceSummary balances={balances} settlementSuggestions={suggestions} currency={trip?.currency} />
              {suggestions.length > 0 && (
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  Mark as Paid
                </Text>
              )}
            </>
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <BalanceSummary balances={balances} settlementSuggestions={suggestions} currency={trip?.currency} />
          }
          renderItem={({ item }) => (
            <View style={[styles.suggestionCard, { backgroundColor: colors.bgSurface }, shadows.sm]}>
              <View style={styles.suggestionTop}>
                <View style={styles.suggestionPeople}>
                  <View style={[styles.personIcon, { backgroundColor: colors.errorLight }]}>
                    <Text style={[styles.personInitial, { color: colors.error }]}>
                      {item.fromName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.arrowContainer}>
                    <Text style={[styles.arrow, { color: colors.textMuted }]}>{'\u2192'}</Text>
                  </View>
                  <View style={[styles.personIcon, { backgroundColor: colors.successLight }]}>
                    <Text style={[styles.personInitial, { color: colors.success }]}>
                      {item.toName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.amount, { color: colors.accent }]}>
                  $                {formatCurrency(item.amount, trip?.currency)}
                </Text>
              </View>

              <View style={styles.suggestionNames}>
                <Text style={[styles.nameLabel, { color: colors.error }]}>{item.fromName}</Text>
                <Text style={[styles.paysLabel, { color: colors.textMuted }]}> pays </Text>
                <Text style={[styles.nameLabel, { color: colors.success }]}>{item.toName}</Text>
              </View>

              <TouchableOpacity
                style={[styles.settleBtn, { backgroundColor: colors.success }]}
                onPress={() => handleSettle(item.from, item.to, item.amount)}
              >
                <Text style={styles.settleBtnText}>Mark as Paid</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
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
  back: {
    ...typography.body,
    fontWeight: '600',
  },
  title: {
    ...typography.headline,
    flex: 1,
    textAlign: 'center',
  },
  list: {
    paddingBottom: spacing.xxxxl,
  },
  sectionLabel: {
    ...typography.footnoteBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  suggestionCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  suggestionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  suggestionPeople: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  personInitial: {
    ...typography.title3,
    fontWeight: '700',
  },
  arrowContainer: {
    paddingHorizontal: spacing.sm,
  },
  arrow: {
    fontSize: 20,
    fontWeight: '300',
  },
  amount: {
    ...typography.title3,
    fontWeight: '800',
  },
  suggestionNames: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  nameLabel: {
    ...typography.subheadBold,
  },
  paysLabel: {
    ...typography.subhead,
  },
  settleBtn: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  settleBtnText: {
    color: '#fff',
    ...typography.headline,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxxxl,
  },
  settledIcon: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  settledTitle: {
    ...typography.title1,
    marginBottom: spacing.sm,
  },
  settledText: {
    ...typography.callout,
    textAlign: 'center',
  },
})
