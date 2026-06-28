import { useState, useMemo } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native'
import { SplitType, SplitDetail } from '../types'
import { useThemeColors, spacing, borderRadius, typography, formatCurrency } from '../theme'

interface Props {
  amount: number
  splitType: SplitType
  splitAmong: string[]
  participants: { id: string; name: string }[]
  onSplitTypeChange: (type: SplitType) => void
  onSplitAmongChange: (ids: string[]) => void
  onSplitDetailsChange: (details: SplitDetail[]) => void
  error?: string | null
  currency?: string
}

const TYPES: { key: SplitType; label: string; icon: string }[] = [
  { key: 'equal', label: 'Equal', icon: '\u2261' },
  { key: 'custom', label: 'Custom', icon: '\u270E' },
  { key: 'percentage', label: '%', icon: '%' },
]

export default function SplitSelector({
  amount,
  splitType,
  splitAmong,
  participants,
  onSplitTypeChange,
  onSplitAmongChange,
  onSplitDetailsChange,
  error,
  currency = 'USD',
}: Props) {
  const colors = useThemeColors()
  const [customValues, setCustomValues] = useState<Record<string, string>>({})
  const [pctValues, setPctValues] = useState<Record<string, string>>({})

  const toggleParticipant = (id: string) => {
    const isSelected = splitAmong.includes(id)
    const newSelected = isSelected
      ? splitAmong.filter(pid => pid !== id)
      : [...splitAmong, id]
    onSplitAmongChange(newSelected)
  }

  const handleCustomValue = (id: string, value: string) => {
    setCustomValues(prev => ({ ...prev, [id]: value }))
    const num = parseFloat(value) || 0
    const allDetails = splitAmong.map(pid => ({
      participantId: pid,
      value: pid === id ? num : parseFloat(customValues[pid] || '0') || 0,
    }))
    onSplitDetailsChange(allDetails)
  }

  const handlePctValue = (id: string, value: string) => {
    setPctValues(prev => ({ ...prev, [id]: value }))
    const num = parseFloat(value) || 0
    const allDetails = splitAmong.map(pid => ({
      participantId: pid,
      value: pid === id ? num : parseFloat(pctValues[pid] || '0') || 0,
    }))
    onSplitDetailsChange(allDetails)
  }

  const perPerson = amount / Math.max(splitAmong.length, 1)

  const totalFilled = useMemo(() => {
    if (splitType === 'custom')
      return Object.values(customValues).reduce((s, v) => s + (parseFloat(v) || 0), 0)
    if (splitType === 'percentage')
      return Object.values(pctValues).reduce((s, v) => s + (parseFloat(v) || 0), 0)
    return 0
  }, [splitType, customValues, pctValues])

  const remaining = splitType === 'custom' ? amount - totalFilled : splitType === 'percentage' ? 100 - totalFilled : 0

  if (participants.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.bgSecondary }]}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          Add participants to split expenses
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.typeRow}>
        {TYPES.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[
              styles.typeBtn,
              { backgroundColor: colors.bgTertiary },
              splitType === t.key && { backgroundColor: colors.accent },
            ]}
            onPress={() => {
              onSplitTypeChange(t.key)
              if (t.key === 'equal') onSplitDetailsChange([])
              setCustomValues({})
              setPctValues({})
            }}
          >
            <Text
              style={[
                styles.typeBtnText,
                { color: colors.textMuted },
                splitType === t.key && { color: '#fff' },
              ]}
            >
              {t.icon} {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, { color: colors.textSecondary }]}>Split among</Text>

      <ScrollView style={styles.participantList} showsVerticalScrollIndicator={false}>
        {participants.map(p => {
          const selected = splitAmong.includes(p.id)
          return (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.participantRow,
                { backgroundColor: colors.bgSecondary },
                selected && { backgroundColor: colors.accentLight },
              ]}
              onPress={() => toggleParticipant(p.id)}
            >
              <View
                style={[
                  styles.checkbox,
                  { borderColor: colors.border },
                  selected && { borderColor: colors.accent, backgroundColor: colors.accent },
                ]}
              >
                {selected && (
                  <Text style={styles.checkmark}>{'\u2713'}</Text>
                )}
              </View>
              <Text
                style={[
                  styles.participantName,
                  { color: colors.text },
                  selected && { fontWeight: '600' },
                ]}
              >
                {p.name}
              </Text>

              {selected && splitType === 'custom' && (
                <TextInput
                  style={[
                    styles.valueInput,
                    { backgroundColor: colors.bgSurface, borderColor: colors.border, color: colors.text },
                  ]}
                  placeholder="0.00"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="decimal-pad"
                  value={customValues[p.id] || ''}
                  onChangeText={v => handleCustomValue(p.id, v)}
                />
              )}
              {selected && splitType === 'percentage' && (
                <TextInput
                  style={[
                    styles.valueInput,
                    { backgroundColor: colors.bgSurface, borderColor: colors.border, color: colors.text },
                  ]}
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="decimal-pad"
                  value={pctValues[p.id] || ''}
                  onChangeText={v => handlePctValue(p.id, v)}
                />
              )}
              {selected && splitType === 'equal' && (
                <Text style={[styles.equalShare, { color: colors.accent }]}>
                  {formatCurrency(perPerson, currency)}
                </Text>
              )}
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {(splitType === 'custom' || splitType === 'percentage') && splitAmong.length > 0 && (
        <View style={[styles.summaryBar, { backgroundColor: colors.bgSecondary }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              {splitType === 'custom' ? 'Allocated' : 'Allocated'}
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {splitType === 'custom'
                ? formatCurrency(totalFilled, currency)
                : `${totalFilled.toFixed(1)}%`}
            </Text>
          </View>
          {remaining > 0.01 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.warning }]}>
                Remaining
              </Text>
              <Text style={[styles.summaryValue, { color: colors.warning }]}>
                {splitType === 'custom'
                  ? formatCurrency(remaining, currency)
                  : `${remaining.toFixed(1)}%`}
              </Text>
            </View>
          )}
        </View>
      )}

      {error && (
        <View style={[styles.errorContainer, { backgroundColor: colors.errorLight }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  emptyContainer: {
    padding: spacing.xxl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.subhead,
    textAlign: 'center',
  },
  typeRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  typeBtnText: {
    ...typography.subheadBold,
  },
  label: {
    ...typography.footnoteBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  participantList: {
    maxHeight: 240,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  checkmark: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  participantName: {
    ...typography.body,
    flex: 1,
  },
  valueInput: {
    width: 80,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    ...typography.subheadBold,
    textAlign: 'right',
  },
  equalShare: {
    ...typography.subheadBold,
  },
  summaryBar: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  summaryLabel: {
    ...typography.footnote,
  },
  summaryValue: {
    ...typography.footnoteBold,
  },
  errorContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  errorText: {
    ...typography.footnoteBold,
    textAlign: 'center',
  },
})
