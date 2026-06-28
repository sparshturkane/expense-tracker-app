import { useMemo, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTripStore } from '../src/stores/tripStore'
import { useExpenseStore } from '../src/stores/expenseStore'
import SyncStatusBar from '../src/components/SyncStatusBar'
import { useThemeColors, spacing, borderRadius, typography, shadows, formatCurrency } from '../src/theme'

export default function HomeScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const colors = useThemeColors()
  const { trips, loading, deleteTrip } = useTripStore()
  const { expensesByTrip } = useExpenseStore()
  const [search, setSearch] = useState('')

  const filteredTrips = useMemo(
    () =>
      search.trim()
        ? trips.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
        : trips,
    [trips, search]
  )

  const tripTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const trip of trips) {
      const expenses = expensesByTrip[trip.id] || []
      totals[trip.id] = expenses.reduce((sum, e) => sum + e.amount, 0)
    }
    return totals
  }, [trips, expensesByTrip])

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <SyncStatusBar />

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Trips</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.accent }]}
          onPress={() => router.push('/trip/new')}
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.bgSecondary }]}>
        <Text style={[styles.searchIcon, { color: colors.textMuted }]}>{'\uD83D\uDD0D'}</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search trips..."
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading && trips.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading...</Text>
        </View>
      ) : filteredTrips.length === 0 && trips.length > 0 ? (
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No trips match "{search}"</Text>
        </View>
      ) : trips.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 48, marginBottom: spacing.lg }}>{'\uD83D\uDEEB\uFE0F'}</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No trips yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Create your first trip to start{'\n'}tracking shared expenses
          </Text>
          <TouchableOpacity
            style={[styles.emptyBtn, { backgroundColor: colors.accent }]}
            onPress={() => router.push('/trip/new')}
          >
            <Text style={styles.emptyBtnText}>Create a Trip</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredTrips}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tripCard, { backgroundColor: colors.bgSurface }, shadows.sm]}
              onPress={() => router.push(`/trip/${item.id}`)}
              onLongPress={() => {
                Alert.alert('Delete Trip', `Delete "${item.name}"?`, [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteTrip(item.id),
                  },
                ])
              }}
            >
              <View style={[styles.tripIcon, { backgroundColor: colors.accentLight }]}>
                <Text style={[styles.tripIconText, { color: colors.accent }]}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.tripInfo}>
                <Text style={[styles.tripName, { color: colors.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.tripMeta}>
                  <Text style={[styles.tripCurrency, { color: colors.textSecondary }]}>
                    {item.currency}
                  </Text>
                  {tripTotals[item.id] > 0 && (
                    <Text style={[styles.tripTotal, { color: colors.accent }]}>
                      {formatCurrency(tripTotals[item.id], item.currency)}
                    </Text>
                  )}
                </View>
              </View>
              <Text style={[styles.chevron, { color: colors.textTertiary }]}>{'\u203A'}</Text>
            </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  title: {
    ...typography.largeTitle,
    fontWeight: '800',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '600',
    lineHeight: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    height: 40,
    borderRadius: borderRadius.md,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.subhead,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxxl,
  },
  tripCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  tripIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  tripIconText: {
    fontSize: 20,
    fontWeight: '700',
  },
  tripInfo: {
    flex: 1,
  },
  tripName: {
    ...typography.bodyBold,
  },
  tripMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: spacing.sm,
  },
  tripCurrency: {
    ...typography.footnote,
  },
  tripTotal: {
    ...typography.footnoteBold,
  },
  chevron: {
    fontSize: 24,
    fontWeight: '300',
    marginLeft: spacing.sm,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxxxl,
  },
  loadingText: {
    ...typography.body,
  },
  emptyTitle: {
    ...typography.title2,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.callout,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xxl,
  },
  emptyBtn: {
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  emptyBtnText: {
    color: '#fff',
    ...typography.calloutBold,
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
  },
})
