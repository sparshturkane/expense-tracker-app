import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Expense, Participant } from '../types'

interface Props {
  expense: Expense
  participants: Participant[]
  onDelete?: () => void
}

export default function ExpenseCard({ expense, participants, onDelete }: Props) {
  const payer = participants.find(p => p.id === expense.paidBy)
  const getShareText = () => {
    if (expense.splitType === 'equal')
      return `Split equally ${expense.splitAmong.length} ways`
    if (expense.splitType === 'custom') return 'Custom split'
    return 'Percentage split'
  }

  const getParticipantName = (id: string) =>
    participants.find(p => p.id === id)?.name || 'Unknown'

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.categoryDot} />
        <Text style={styles.description}>{expense.description}</Text>
        <Text style={styles.amount}>${expense.amount.toFixed(2)}</Text>
      </View>

      <Text style={styles.paidBy}>
        Paid by <Text style={styles.bold}>{payer?.name || 'Unknown'}</Text>
      </Text>

      <Text style={styles.splitInfo}>{getShareText()}</Text>

      <View style={styles.details}>
        {expense.splitDetails.map(sd => (
          <Text key={sd.participantId} style={styles.detailRow}>
            {getParticipantName(sd.participantId)} owes $
            {sd.value.toFixed(2)}
          </Text>
        ))}
      </View>

      {expense.category ? (
        <Text style={styles.category}>{expense.category}</Text>
      ) : null}

      {onDelete && (
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
    marginRight: 8,
  },
  description: { flex: 1, fontSize: 16, fontWeight: '600', color: '#111' },
  amount: { fontSize: 17, fontWeight: '700', color: '#007AFF' },
  paidBy: { fontSize: 13, color: '#666', marginBottom: 2 },
  bold: { fontWeight: '600', color: '#333' },
  splitInfo: { fontSize: 12, color: '#999', marginBottom: 8 },
  details: { marginBottom: 4 },
  detailRow: { fontSize: 12, color: '#666', paddingVertical: 1 },
  category: {
    fontSize: 11,
    color: '#007AFF',
    backgroundColor: '#E8F0FE',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4,
  },
  deleteBtn: { marginTop: 8, alignSelf: 'flex-end' },
  deleteText: { color: '#dc3545', fontSize: 13, fontWeight: '500' },
})
