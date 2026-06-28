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
import { useThemeColors, spacing, borderRadius, typography } from '../../src/theme'

const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '\u20AC' },
  { code: 'GBP', symbol: '\u00A3' },
  { code: 'INR', symbol: '\u20B9' },
  { code: 'JPY', symbol: '\u00A5' },
  { code: 'AUD', symbol: 'A$' },
  { code: 'CAD', symbol: 'C$' },
  { code: 'MXN', symbol: 'MX$' },
  { code: 'BRL', symbol: 'R$' },
  { code: 'PHP', symbol: '\u20B1' },
]

export default function NewTripScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const colors = useThemeColors()
  const createTrip = useTripStore(s => s.createTrip)
  const addParticipant = useExpenseStore(s => s.addParticipant)

  const [name, setName] = useState('')
  const [currency, setCurrency] = useState(CURRENCIES[0].code)
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
      style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.cancel, { color: colors.accent }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>New Trip</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Trip Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.bgSurface, borderColor: colors.border, color: colors.text }]}
          placeholder='e.g. "Bali Trip 2026"'
          placeholderTextColor={colors.textTertiary}
          value={name}
          onChangeText={setName}
          autoFocus
        />

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Currency</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.currencyRow}>
          {CURRENCIES.map(c => (
            <TouchableOpacity
              key={c.code}
              style={[
                styles.currencyBtn,
                { backgroundColor: colors.bgTertiary },
                currency === c.code && { backgroundColor: colors.accent },
              ]}
              onPress={() => setCurrency(c.code)}
            >
              <Text
                style={[
                  styles.currencyText,
                  { color: colors.textMuted },
                  currency === c.code && { color: '#fff' },
                ]}
              >
                {c.symbol} {c.code}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Participants</Text>
        <View style={styles.addRow}>
          <TextInput
            style={[styles.input, { flex: 1, backgroundColor: colors.bgSurface, borderColor: colors.border, color: colors.text }]}
            placeholder="Enter name"
            placeholderTextColor={colors.textTertiary}
            value={participantName}
            onChangeText={setParticipantName}
            onSubmitEditing={addPerson}
          />
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.accent }]}
            onPress={addPerson}
          >
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {participants.map((name, idx) => (
          <View key={name + idx} style={[styles.personTag, { backgroundColor: colors.accentLight }]}>
            <View style={[styles.personAvatar, { backgroundColor: colors.accent }]}>
              <Text style={styles.personAvatarText}>{name.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={[styles.personName, { color: colors.text }]}>{name}</Text>
            <TouchableOpacity onPress={() => removePerson(name)} style={styles.removeBtn}>
              <Text style={[styles.removeText, { color: colors.textMuted }]}>{'\u2715'}</Text>
            </TouchableOpacity>
          </View>
        ))}

        {participants.length === 0 && (
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            Add at least 2 people to split expenses
          </Text>
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.divider, backgroundColor: colors.bg }]}>
        <TouchableOpacity
          style={[
            styles.createBtn,
            { backgroundColor: colors.accent },
            !canCreate && { opacity: 0.4 },
          ]}
          disabled={!canCreate}
          onPress={handleCreate}
        >
          <Text style={styles.createBtnText}>
            Create Trip
          </Text>
        </TouchableOpacity>
      </View>
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
  content: { padding: spacing.xl, paddingBottom: 100 },
  sectionLabel: {
    ...typography.footnoteBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.xxl,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    marginBottom: spacing.sm,
  },
  currencyRow: { marginBottom: spacing.sm },
  currencyBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
  },
  currencyText: {
    ...typography.subheadBold,
  },
  addRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  addBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  addBtnText: { color: '#fff', ...typography.subheadBold },
  personTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  personAvatar: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  personAvatarText: {
    color: '#fff',
    ...typography.subheadBold,
  },
  personName: {
    ...typography.body,
    flex: 1,
  },
  removeBtn: {
    padding: spacing.xs,
  },
  removeText: {
    fontSize: 16,
  },
  hint: {
    ...typography.footnote,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  footer: {
    padding: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: spacing.xxxxl,
  },
  createBtn: {
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  createBtnText: {
    color: '#fff',
    ...typography.headline,
  },
})
