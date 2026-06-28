import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useExpenseStore } from '../../../src/stores/expenseStore'
import { useTripStore } from '../../../src/stores/tripStore'

export default function PeopleScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()

  const trip = useTripStore(s => s.trips.find(t => t.id === id))
  const { participantsByTrip, addParticipant, removeParticipant } = useExpenseStore()
  const participants = participantsByTrip[id!] || []

  const [newName, setNewName] = useState('')

  const handleAdd = () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    if (participants.some(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert('Duplicate', 'A participant with that name already exists')
      return
    }
    addParticipant(id!, trimmed)
    setNewName('')
  }

  const handleRemove = (participantId: string, name: string) => {
    Alert.alert('Remove', `Remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeParticipant(id!, participantId),
      },
    ])
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          People {participants.length > 0 ? `(${participants.length})` : ''}
        </Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="Add participant name"
          value={newName}
          onChangeText={setNewName}
          onSubmitEditing={handleAdd}
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={participants}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.personRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.personName}>{item.name}</Text>
            <TouchableOpacity onPress={() => handleRemove(item.id, item.name)}>
              <Text style={styles.removeBtn}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No participants yet</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  back: { fontSize: 16, color: '#007AFF', marginRight: 12 },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: '#111', textAlign: 'center' },
  addRow: { flexDirection: 'row', padding: 16, gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  addBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 10,
  },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  list: { paddingHorizontal: 16 },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  personName: { flex: 1, fontSize: 16, color: '#333' },
  removeBtn: { color: '#dc3545', fontSize: 14, fontWeight: '500' },
  empty: { paddingTop: 60, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#999' },
})
