import { useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTripStore } from '../src/stores/tripStore'
import SyncStatusBar from '../src/components/SyncStatusBar'

export default function HomeScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { trips, loading, deleteTrip } = useTripStore()

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <SyncStatusBar />

      <View style={styles.header}>
        <Text style={styles.title}>Trips</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/trip/new')}
        >
          <Text style={styles.addBtnText}>+ New Trip</Text>
        </TouchableOpacity>
      </View>

      {loading && trips.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      ) : trips.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>✈️</Text>
          <Text style={styles.emptyTitle}>No trips yet</Text>
          <Text style={styles.emptyText}>
            Create your first trip to start tracking shared expenses
          </Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.tripCard}
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
              <View style={styles.tripInfo}>
                <Text style={styles.tripName}>{item.name}</Text>
                <Text style={styles.tripCurrency}>{item.currency}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#111' },
  addBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  list: { paddingHorizontal: 16 },
  tripCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  tripInfo: { flex: 1 },
  tripName: { fontSize: 17, fontWeight: '600', color: '#111' },
  tripCurrency: { fontSize: 13, color: '#666', marginTop: 2 },
  arrow: { fontSize: 22, color: '#ccc' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 8 },
  emptyText: { fontSize: 15, color: '#666', textAlign: 'center' },
})
