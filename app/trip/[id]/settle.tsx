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

export default function SettleScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()

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
      `${fromName} will pay ${toName} $${amount.toFixed(2)}.`,
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settle Up</Text>
        <View style={{ width: 50 }} />
      </View>

      {allSettled ? (
        <View style={styles.allSettled}>
          <Text style={styles.allSettledIcon}>✅</Text>
          <Text style={styles.allSettledTitle}>All settled up!</Text>
          <Text style={styles.allSettledText}>No outstanding balances</Text>
        </View>
      ) : (
        <FlatList
          data={suggestions}
          keyExtractor={(_, i) => String(i)}
          ListHeaderComponent={
            <BalanceSummary balances={balances} settlementSuggestions={suggestions} />
          }
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.suggestionCard}>
              <View style={styles.suggestionInfo}>
                <Text style={styles.suggestionText}>
                  <Text style={styles.bold}>{item.fromName}</Text>
                  {' → '}
                  <Text style={styles.bold}>{item.toName}</Text>
                </Text>
                <Text style={styles.suggestionAmount}>
                  ${item.amount.toFixed(2)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.settleBtn}
                onPress={() => handleSettle(item.from, item.to, item.amount)}
              >
                <Text style={styles.settleBtnText}>Mark Paid</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  back: { fontSize: 16, color: '#007AFF', marginRight: 12 },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: '#111', textAlign: 'center' },
  list: { paddingBottom: 40 },
  suggestionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 10,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  suggestionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionText: { fontSize: 16, color: '#333' },
  bold: { fontWeight: '700', color: '#111' },
  suggestionAmount: { fontSize: 18, fontWeight: '700', color: '#007AFF' },
  settleBtn: {
    backgroundColor: '#34C759',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  settleBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  allSettled: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  allSettledIcon: { fontSize: 48, marginBottom: 16 },
  allSettledTitle: { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 8 },
  allSettledText: { fontSize: 15, color: '#666', textAlign: 'center' },
})
