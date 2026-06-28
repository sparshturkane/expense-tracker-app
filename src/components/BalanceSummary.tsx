import { View, Text, StyleSheet } from 'react-native'
import { Balance, SettlementSuggestion } from '../types'

interface Props {
  balances: Balance[]
  settlementSuggestions: SettlementSuggestion[]
}

export default function BalanceSummary({ balances, settlementSuggestions }: Props) {
  const maxNet = Math.max(...balances.map(b => Math.abs(b.net)), 0.01)

  if (balances.length === 0) {
    return null
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Balances</Text>

      {balances.map(b => {
        const isPositive = b.net > 0
        const isZero = Math.abs(b.net) < 0.01
        const barWidth = (Math.abs(b.net) / maxNet) * 100

        return (
          <View key={b.participantId} style={styles.row}>
            <Text style={styles.name}>{b.name}</Text>
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.bar,
                  {
                    width: `${Math.min(barWidth, 100)}%`,
                    backgroundColor: isZero
                      ? '#ccc'
                      : isPositive
                      ? '#34C759'
                      : '#FF3B30',
                  },
                ]}
              />
            </View>
            <Text
              style={[
                styles.net,
                isZero && styles.zero,
                isPositive && styles.positive,
                !isZero && !isPositive && styles.negative,
              ]}
            >
              {isZero ? '$0' : `${isPositive ? '+' : '-'}$${Math.abs(b.net).toFixed(2)}`}
            </Text>
          </View>
        )
      })}

      {settlementSuggestions.length > 0 && (
        <>
          <View style={styles.divider} />
          <Text style={styles.title}>Settlements</Text>
          {settlementSuggestions.map((s, i) => (
            <View key={i} style={styles.settlementRow}>
              <Text style={styles.settlementText}>
                <Text style={styles.settlementName}>{s.fromName}</Text>
                {' pays '}
                <Text style={styles.settlementName}>{s.toName}</Text>
              </Text>
              <Text style={styles.settlementAmount}>${s.amount.toFixed(2)}</Text>
            </View>
          ))}
          <Text style={styles.note}>
            {settlementSuggestions.length === 1
              ? '1 transaction needed'
              : `${settlementSuggestions.length} transactions needed`}
          </Text>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  title: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  name: { width: 80, fontSize: 14, color: '#333' },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  bar: { height: '100%', borderRadius: 4 },
  net: { width: 80, textAlign: 'right', fontSize: 14, fontWeight: '600' },
  positive: { color: '#34C759' },
  negative: { color: '#FF3B30' },
  zero: { color: '#999' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
  settlementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  settlementText: { fontSize: 14, color: '#333' },
  settlementName: { fontWeight: '600', color: '#111' },
  settlementAmount: { fontSize: 14, fontWeight: '700', color: '#007AFF' },
  note: { fontSize: 12, color: '#999', marginTop: 8, textAlign: 'center' },
})
