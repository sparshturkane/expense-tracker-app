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

interface Props {
  amount: number
  splitType: SplitType
  splitAmong: string[]
  participants: { id: string; name: string }[]
  onSplitTypeChange: (type: SplitType) => void
  onSplitAmongChange: (ids: string[]) => void
  onSplitDetailsChange: (details: SplitDetail[]) => void
  error?: string | null
}

export default function SplitSelector({
  amount,
  splitType,
  splitAmong,
  participants,
  onSplitTypeChange,
  onSplitAmongChange,
  onSplitDetailsChange,
  error,
}: Props) {
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

  const types: { key: SplitType; label: string }[] = [
    { key: 'equal', label: 'Equal' },
    { key: 'custom', label: 'Custom' },
    { key: 'percentage', label: '%' },
  ]

  if (participants.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>No participants added yet</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.typeRow}>
        {types.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.typeBtn, splitType === t.key && styles.typeBtnActive]}
            onPress={() => {
              onSplitTypeChange(t.key)
              if (t.key === 'equal') onSplitDetailsChange([])
            }}
          >
            <Text
              style={[
                styles.typeBtnText,
                splitType === t.key && styles.typeBtnTextActive,
              ]}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Split among</Text>
      <ScrollView style={styles.participantList}>
        {participants.map(p => {
          const selected = splitAmong.includes(p.id)
          return (
            <TouchableOpacity
              key={p.id}
              style={[styles.participantRow, selected && styles.participantSelected]}
              onPress={() => toggleParticipant(p.id)}
            >
              <View style={styles.checkbox}>
                {selected && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.participantName}>{p.name}</Text>
              {selected && splitType === 'custom' && (
                <TextInput
                  style={styles.valueInput}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={customValues[p.id] || ''}
                  onChangeText={v => handleCustomValue(p.id, v)}
                />
              )}
              {selected && splitType === 'percentage' && (
                <TextInput
                  style={styles.valueInput}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  value={pctValues[p.id] || ''}
                  onChangeText={v => handlePctValue(p.id, v)}
                />
              )}
              {selected && splitType === 'equal' && (
                <Text style={styles.equalShare}>
                  ${(amount / Math.max(splitAmong.length, 1)).toFixed(2)}
                </Text>
              )}
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  typeRow: { flexDirection: 'row', marginBottom: 12, gap: 8 },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  typeBtnActive: { backgroundColor: '#007AFF' },
  typeBtnText: { fontSize: 15, fontWeight: '600', color: '#666' },
  typeBtnTextActive: { color: '#fff' },
  label: { fontSize: 15, fontWeight: '600', marginBottom: 8, color: '#333' },
  participantList: { maxHeight: 200 },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: '#f8f8f8',
  },
  participantSelected: { backgroundColor: '#E8F0FE' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkmark: { color: '#007AFF', fontWeight: '700' },
  participantName: { flex: 1, fontSize: 15, color: '#333' },
  valueInput: {
    width: 80,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
    textAlign: 'right',
  },
  equalShare: { fontSize: 14, color: '#007AFF', fontWeight: '500' },
  error: { color: '#dc3545', fontSize: 13, marginTop: 6 },
})
