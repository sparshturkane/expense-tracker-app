import { useEffect, useMemo } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTripStore } from '../../../src/stores/tripStore'
import { useExpenseStore } from '../../../src/stores/expenseStore'
import { calculateBalances, calculateSettlements } from '../../../src/utils/balance'
import ExpenseCard from '../../../src/components/ExpenseCard'
import BalanceSummary from '../../../src/components/BalanceSummary'

export default function TripDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()

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

  if (!trip) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Trip not found</Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title} numberOfLines={1}>{trip.name}</Text>
          <Text style={styles.subtitle}>{participants.length} people · {trip.currency}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push(`/trip/${id}/sync`)}>
          <Text style={styles.syncBtn}>Sync</Text>
        </TouchableOpacity>
      </View>

      <BalanceSummary balances={balances} settlementSuggestions={suggestions} />

      <FlatList
        data={sortedExpenses}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💰</Text>
            <Text style={styles.emptyTitle}>No expenses yet</Text>
            <Text style={styles.emptyText}>
              Tap the + button to add your first expense
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ExpenseCard
            expense={item}
            participants={participants}
            onDelete={() => deleteExpense(id!, item.id)}
          />
        )}
        contentContainerStyle={styles.list}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerBtn}
          onPress={() => router.push(`/trip/${id}/people`)}
        >
          <Text style={styles.footerBtnText}>People</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push(`/trip/${id}/expense/add`)}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerBtn}
          onPress={() => router.push(`/trip/${id}/settle`)}
        >
          <Text style={styles.footerBtnText}>Settle</Text>
        </TouchableOpacity>
      </View>
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
  back: { fontSize: 16, color: '#007AFF', marginRight: 8 },
  headerCenter: { flex: 1 },
  title: { fontSize: 18, fontWeight: '700', color: '#111' },
  subtitle: { fontSize: 12, color: '#666', marginTop: 1 },
  syncBtn: { fontSize: 15, color: '#007AFF', fontWeight: '500' },
  list: { paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#666', textAlign: 'center' },
  errorText: { textAlign: 'center', marginTop: 100, fontSize: 16, color: '#999' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e8e8e8',
  },
  footerBtn: { paddingVertical: 8, paddingHorizontal: 12 },
  footerBtnText: { fontSize: 15, color: '#007AFF', fontWeight: '600' },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { fontSize: 28, color: '#fff', lineHeight: 30 },
})
