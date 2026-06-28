import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTripStore } from '../../src/stores/tripStore'
import { useExpenseStore } from '../../src/stores/expenseStore'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD', 'MXN', 'BRL', 'PHP']

export default function NewTripScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const createTrip = useTripStore(s => s.createTrip)
  const addParticipant = useExpenseStore(s => s.addParticipant)

  const [name, setName] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [participantName, setParticipantName] = useState('')
  const [participants, setParticipants] = useState<string[]>([])

  const addPerson = () => {
    const trimmed = participantName.trim()
    if (trimmed && !participants.includes(trimmed)) {
      setParticipants([...participants, trimmed])
      setParticipantName('')
    }
  }

  const removePerson = (name: string) => {
    setParticipants(participants.filter(n => n !== name))
  }

  const handleCreate = () => {
    if (!name.trim()) return
    if (participants.length === 0) return

    const trip = createTrip(name.trim(), currency)

    participants.forEach(pName => {
      addParticipant(trip.id, pName.trim())
    })

    router.replace(`/trip/${trip.id}`)
  }

  const canCreate = name.trim().length > 0 && participants.length > 0

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>New Trip</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.label}>Trip Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Bali Trip 2026"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Currency</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.currencyRow}>
          {CURRENCIES.map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.currencyBtn, currency === c && styles.currencyActive]}
              onPress={() => setCurrency(c)}
            >
              <Text style={[styles.currencyText, currency === c && styles.currencyTextActive]}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Participants</Text>
        <View style={styles.addRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Name"
            value={participantName}
            onChangeText={setParticipantName}
            onSubmitEditing={addPerson}
          />
          <TouchableOpacity style={styles.addPersonBtn} onPress={addPerson}>
            <Text style={styles.addPersonBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {participants.map(name => (
          <View key={name} style={styles.personTag}>
            <Text style={styles.personName}>{name}</Text>
            <TouchableOpacity onPress={() => removePerson(name)}>
              <Text style={styles.removePerson}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createBtn, !canCreate && styles.createBtnDisabled]}
          disabled={!canCreate}
          onPress={handleCreate}
        >
          <Text style={styles.createBtnText}>
            Create Trip{participants.length > 0 ? ` (${participants.length} people)` : ''}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  back: { fontSize: 16, color: '#007AFF' },
  title: { fontSize: 17, fontWeight: '700', color: '#111' },
  content: { flex: 1, paddingHorizontal: 20 },
  label: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  currencyRow: { marginBottom: 8 },
  currencyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  currencyActive: { backgroundColor: '#007AFF' },
  currencyText: { fontSize: 14, fontWeight: '600', color: '#666' },
  currencyTextActive: { color: '#fff' },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addPersonBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 10,
  },
  addPersonBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  personTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F0FE',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  personName: { flex: 1, fontSize: 15, color: '#333' },
  removePerson: { fontSize: 16, color: '#999', paddingLeft: 8 },
  footer: { padding: 20 },
  createBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createBtnDisabled: { backgroundColor: '#ccc' },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
