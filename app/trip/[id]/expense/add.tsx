import { useState, useMemo } from 'react'
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
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useExpenseStore } from '../../../../src/stores/expenseStore'
import { useTripStore } from '../../../../src/stores/tripStore'
import { usePeerStore } from '../../../../src/stores/peerStore'
import SplitSelector from '../../../../src/components/SplitSelector'
import { SplitType, SplitDetail } from '../../../../src/types'
import { validateSplit } from '../../../../src/utils/split'

const CATEGORIES = ['Food', 'Transport', 'Accommodation', 'Activities', 'Shopping', 'Drinks', 'Other']

export default function AddExpenseScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()

  const trip = useTripStore(s => s.trips.find(t => t.id === id))
  const { participantsByTrip, addExpense } = useExpenseStore()
  const deviceId = usePeerStore(s => s.deviceId)

  const participants = useMemo(() => participantsByTrip[id!] || [], [id, participantsByTrip])

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState('')
  const [splitType, setSplitType] = useState<SplitType>('equal')
  const [splitAmong, setSplitAmong] = useState<string[]>([])
  const [splitDetails, setSplitDetails] = useState<SplitDetail[]>([])
  const [category, setCategory] = useState('')
  const [error, setError] = useState<string | null>(null)

  const numAmount = parseFloat(amount) || 0

  const handleSubmit = () => {
    setError(null)

    if (!description.trim()) { setError('Enter a description'); return }
    if (numAmount <= 0) { setError('Enter a valid amount'); return }
    if (!paidBy) { setError('Select who paid'); return }
    if (splitAmong.length === 0) { setError('Select at least one person to split with'); return }

    if (splitType !== 'equal') {
      const validationError = validateSplit(numAmount, splitType, splitDetails, splitAmong)
      if (validationError) { setError(validationError); return }
    }

    addExpense(
      id!,
      description.trim(),
      numAmount,
      paidBy,
      splitType,
      splitAmong,
      splitDetails,
      category,
      deviceId
    )

    router.back()
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Expense</Text>
        <TouchableOpacity onPress={handleSubmit}>
          <Text style={[styles.save, !description || !paidBy || numAmount <= 0 ? styles.saveDisabled : null]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <TextInput
          style={styles.descriptionInput}
          placeholder="What was it for?"
          value={description}
          onChangeText={setDescription}
        />

        <View style={styles.amountRow}>
          <Text style={styles.currencySign}>{trip?.currency || '$'}</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        <Text style={styles.label}>Paid by</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.payerRow}>
          {participants.map(p => (
            <TouchableOpacity
              key={p.id}
              style={[styles.payerBtn, paidBy === p.id && styles.payerActive]}
              onPress={() => setPaidBy(p.id)}
            >
              <Text style={[styles.payerText, paidBy === p.id && styles.payerTextActive]}>
                {p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.categoryBtn, category === c && styles.categoryActive]}
              onPress={() => setCategory(c === category ? '' : c)}
            >
              <Text style={[styles.categoryText, category === c && styles.categoryTextActive]}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <SplitSelector
          amount={numAmount}
          splitType={splitType}
          splitAmong={splitAmong}
          participants={participants}
          onSplitTypeChange={setSplitType}
          onSplitAmongChange={setSplitAmong}
          onSplitDetailsChange={setSplitDetails}
          error={error}
        />

        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  cancel: { fontSize: 16, color: '#007AFF' },
  title: { fontSize: 17, fontWeight: '700', color: '#111' },
  save: { fontSize: 16, color: '#007AFF', fontWeight: '600' },
  saveDisabled: { color: '#ccc' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  descriptionInput: {
    fontSize: 20,
    fontWeight: '500',
    color: '#111',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
    paddingBottom: 12,
    marginBottom: 20,
  },
  currencySign: { fontSize: 28, fontWeight: '700', color: '#111', marginRight: 8 },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
  },
  label: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 16 },
  payerRow: { marginBottom: 8 },
  payerBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  payerActive: { backgroundColor: '#007AFF' },
  payerText: { fontSize: 14, fontWeight: '600', color: '#666' },
  payerTextActive: { color: '#fff' },
  categoryRow: { marginBottom: 8 },
  categoryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 6,
  },
  categoryActive: { backgroundColor: '#E8F0FE' },
  categoryText: { fontSize: 13, color: '#666' },
  categoryTextActive: { color: '#007AFF', fontWeight: '600' },
  error: { color: '#dc3545', fontSize: 14, marginTop: 8, textAlign: 'center' },
})
