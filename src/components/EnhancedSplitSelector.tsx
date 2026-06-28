import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native'

import { SplitType, SplitDetail } from '../types'
import { DARK_THEME, formatCurrency } from '../theme/constants'

interface Props {
  amount: number
  splitType: SplitType
  splitAmong: string[]
  participants: { id: string; name: string }[]
  onSplitTypeChange: (type: SplitType) => void
  onSplitAmongChange: (ids: string[]) => void
  onSplitDetailsChange: (details: SplitDetail[]) => void
}

export default function EnhancedSplitSelector({
  amount,
  splitType,
  splitAmong,
  participants,
  onSplitTypeChange,
  onSplitAmongChange,
  onSplitDetailsChange,
}: Props) {
  const [customValues, setCustomValues] = useState<Record<string, string>>({})
  const [pctValues, setPctValues] = useState<Record<string, string>>({})
  const theme = DARK_THEME

  const toggleParticipant = (id: string) => {
    const isSelected = splitAmong.includes(id)
    const newSelected = isSelected
      ? splitAmong.filter((pid) => pid !== id)
      : [...splitAmong, id]
    onSplitAmongChange(newSelected)
  }

  const handleCustomValue = (id: string, value: string) => {
    setCustomValues((prev) => ({ ...prev, [id]: value }))
    const num = parseFloat(value) || 0
    const allDetails = splitAmong.map((pid) => ({
      participantId: pid,
      value: pid === id ? num : parseFloat(customValues[pid] || '0') || 0,
    }))
    onSplitDetailsChange(allDetails)
  }

  const handlePctValue = (id: string, value: string) => {
    setPctValues((prev) => ({ ...prev, [id]: value }))
    const num = parseFloat(value) || 0
    const allDetails = splitAmong.map((pid) => ({
      participantId: pid,
      value: pid === id ? num : parseFloat(pctValues[pid] || '0') || 0,
    }))
    onSplitDetailsChange(allDetails)
  }

  const types = [
    { key: 'equal' as SplitType, label: 'Equal' },
    { key: 'custom' as SplitType, label: 'Custom' },
    { key: 'percentage' as SplitType, label: '%' },
  ]

  if (participants.length === 0) {
    return (
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderText}>
          Add participants to split expenses
        </Text>
      </View>
    )
  }

  const filledCount = Object.keys(customValues).length
  const totalParticipants = splitAmong.length
  const autoFillProgress =
    totalParticipants > 0
      ? Math.min((filledCount / totalParticipants) * 100, 100)
      : 0

  return (
    <View style={styles.container}>
      <View style={styles.typeRow}>
        {types.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[
              styles.typeBtn,
              splitType === t.key && { backgroundColor: theme.accent },
            ]}
            onPress={() => {
              onSplitTypeChange(t.key)
              setCustomValues({})
              setPctValues({})
            }}
          >
            <Text
              style={[
                styles.typeBtnText,
                splitType === t.key && { color: '#fff' },
              ]}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.splitAmongLabel}>Split among</Text>

      <ScrollView contentContainerStyle={styles.participantList}>
        {participants.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[
              styles.participantRow,
              splitAmong.includes(p.id) && styles.participantSelected,
            ]}
            onPress={() => toggleParticipant(p.id)}
          >
            <View style={styles.checkbox}>
              <Text style={styles.checkboxIcon}>
                {splitAmong.includes(p.id) ? '✓' : ''}
              </Text>
            </View>
            <Text style={styles.participantName}>{p.name}</Text>
            {splitType === 'custom' && (
              <TextInput
                style={styles.valueInput}
                value={customValues[p.id] || ''}
                onChangeText={(v) => handleCustomValue(p.id, v)}
                keyboardType="decimal-pad"
                placeholder="0.00"
              />
            )}
            {splitType === 'percentage' && (
              <TextInput
                style={styles.valueInput}
                value={pctValues[p.id] || ''}
                onChangeText={(v) => handlePctValue(p.id, v)}
                keyboardType="decimal-pad"
                placeholder="0"
              />
            )}
            {splitType === 'equal' && (
              <Text style={styles.equalShare}>
                {formatCurrency(
                  amount / Math.max(splitAmong.length, 1),
                )}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  placeholderContainer: {
    padding: 24,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  typeRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  typeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  splitAmongLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  participantList: {
    paddingBottom: 16,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: '#F9FAFB',
  },
  participantSelected: {
    backgroundColor: '#EFF6FF',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxIcon: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A84FF',
  },
  participantName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  valueInput: {
    width: 80,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
    textAlign: 'right',
  },
  equalShare: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0A84FF',
  },
})
