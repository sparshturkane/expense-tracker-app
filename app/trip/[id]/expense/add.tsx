import { useState, useMemo, useEffect } from 'react'
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
import { validateSplit, calculateSplit } from '../../../../src/utils/split'
import { useThemeColors, spacing, borderRadius, typography, getCurrencySymbol, formatCurrency } from '../../../../src/theme'

const CATEGORIES = ['Food', 'Transport', 'Accommodation', 'Activities', 'Shopping', 'Drinks', 'Other']

const CATEGORY_ICONS: Record<string, string> = {
  Food: '\uD83C\uDF54',
  Transport: '\uD83D\uDE8E',
  Accommodation: '\uD83C\uDFE8',
  Activities: '\u26BD',
  Shopping: '\uD83D\uDED2',
  Drinks: '\uD83C\uDF7A',
  Other: '\uD83D\uDCCB',
}

export default function AddExpenseScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const colors = useThemeColors()

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

  useEffect(() => {
    if (participants.length > 0) {
      setSplitAmong(participants.map(p => p.id))
      if (!paidBy) setPaidBy(participants[0].id)
    }
  }, [participants.length])

  const numAmount = parseFloat(amount) || 0

  const computedSplit = useMemo(() => {
    if (numAmount <= 0 || splitAmong.length === 0) return []
    return calculateSplit(numAmount, splitType, splitAmong, splitDetails)
  }, [numAmount, splitType, splitAmong, splitDetails])

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

  const canSave = description.trim().length > 0 && paidBy.length > 0 && numAmount > 0

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { borderBottomColor: colors.divider, backgroundColor: colors.navBar }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.cancel, { color: colors.accent }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Add Expense</Text>
        <TouchableOpacity onPress={handleSubmit}>
          <Text style={[styles.save, { color: canSave ? colors.accent : colors.textTertiary }]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.amountSection}>
          <Text style={[styles.currencySign, { color: colors.textSecondary }]}>
            {getCurrencySymbol(trip?.currency || 'USD')}
          </Text>
          <TextInput
            style={[styles.amountInput, { color: colors.text }]}
            placeholder="0.00"
            placeholderTextColor={colors.textTertiary}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        <TextInput
          style={[styles.descriptionInput, { color: colors.text, borderBottomColor: colors.divider }]}
          placeholder="What was the expense for?"
          placeholderTextColor={colors.textTertiary}
          value={description}
          onChangeText={setDescription}
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Paid by</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {participants.map(p => (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.chip,
                { backgroundColor: colors.bgTertiary },
                paidBy === p.id && { backgroundColor: colors.accent },
              ]}
              onPress={() => setPaidBy(p.id)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: colors.textMuted },
                  paidBy === p.id && { color: '#fff' },
                ]}
              >
                {p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c}
              style={[
                styles.chip,
                { backgroundColor: colors.bgTertiary },
                category === c && { backgroundColor: colors.accentLight },
              ]}
              onPress={() => setCategory(c === category ? '' : c)}
            >
              <Text style={styles.chipIcon}>{CATEGORY_ICONS[c]}</Text>
              <Text
                style={[
                  styles.chipText,
                  { color: colors.textMuted },
                  category === c && { color: colors.accent, fontWeight: '600' },
                ]}
              >
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
          currency={trip?.currency}
        />

        {error && !splitAmong.length && (
          <View style={[styles.errorBox, { backgroundColor: colors.errorLight }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        {computedSplit.length > 0 && splitType === 'equal' && (
          <View style={[styles.previewBox, { backgroundColor: colors.bgSecondary }]}>
            <Text style={[styles.previewTitle, { color: colors.textSecondary }]}>Split Preview</Text>
            {computedSplit.map(sd => {
              const p = participants.find(p => p.id === sd.participantId)
              return (
                <View key={sd.participantId} style={styles.previewRow}>
                  <Text style={[styles.previewName, { color: colors.text }]}>
                    {p?.name || 'Unknown'}
                  </Text>
                  <Text style={[styles.previewAmount, { color: colors.accent }]}>
                    {formatCurrency(sd.value, trip?.currency)}
                  </Text>
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cancel: { ...typography.body },
  title: { ...typography.headline },
  save: { ...typography.bodyBold },
  content: { padding: spacing.xl, paddingBottom: 100 },
  amountSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  currencySign: {
    fontSize: 32,
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: '700',
    textAlign: 'center',
    minWidth: 200,
  },
  descriptionInput: {
    ...typography.body,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    marginBottom: spacing.xxl,
  },
  label: {
    ...typography.footnoteBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  chipRow: {
    marginBottom: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
  },
  chipIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  chipText: {
    ...typography.subheadBold,
  },
  errorBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  errorText: {
    ...typography.footnoteBold,
    textAlign: 'center',
  },
  previewBox: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
  },
  previewTitle: {
    ...typography.captionBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  previewName: {
    ...typography.subhead,
  },
  previewAmount: {
    ...typography.subheadBold,
  },
})
