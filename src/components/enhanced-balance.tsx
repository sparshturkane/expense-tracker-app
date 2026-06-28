import { View, Text, StyleSheet } from 'react-native'
import { Balance, SettlementSuggestion } from '../types'
import { DARK_THEME } from '../theme/constants'

interface Props {
  balances: Balance[]
  settlementSuggestions: SettlementSuggestion[]
}

export function EnhancedBalanceSummary({
  balances,
  settlementSuggestions,
}: Props) {
  const maxNet =
    Math.max(...balances.map((b) => Math.abs(b.net)), 0.01) || 0
  const theme = DARK_THEME

  if (balances.length === 0) return null

  const balancesMap = balances.reduce((acc, b) => {
    acc[b.participantId] = Math.abs(b.net) / maxNet
    return acc
  }, {} as Record<string, number>)

  return (
    <View style={styles.container}>
      {balances.map((b) => {
        const isPositive = b.net > 0
        const isZero = Math.abs(b.net) < 0.01
        const barWidth = Math.min((Math.abs(b.net) / maxNet) * 100, 100)

        return (
          <View
            key={b.participantId}
            style={[
              styles.row,
              getRowStyle(isPositive, isZero),
            ]}
          >
            <Text style={styles.name}>{b.name}</Text>
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.bar,
                  {
                    width: `${Math.min(barWidth * 1.5, 100)}%`,
                    backgroundColor: isZero
                      ? '#9CA3AF'
                      : isPositive
                        ? theme.success
                        : '#EF4444',
                  },
                ]}
              />
            </View>
            <Text
              style={[
                styles.net,
                {
                  color: isZero
                    ? '#9CA3AF'
                    : isPositive
                      ? theme.success
                      : '#EF4444',
                  fontWeight: '600',
                },
              ]}
            >
              {isZero
                ? '$0'
                : `${isPositive ? '+' : '-'}$${Math.abs(b.net).toFixed(2)}`}
            </Text>
          </View>
        )
      })}

      {settlementSuggestions.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Settlements Recommended</Text>

          {settlementSuggestions.map((s, i) => (
            <View key={i} style={styles.settlementRow}>
              <Text style={styles.settlementName}>
                {s.fromName} → {s.toName}
              </Text>
              <Text style={[styles.settlementAmount, { color: theme.success }]}>
                ${s.amount.toFixed(2)}
              </Text>
            </View>
          ))}

          <Text style={styles.settlementHint}>
            {settlementSuggestions.length === 1
              ? '1 transaction needed'
              : `${settlementSuggestions.length} transactions needed`}
          </Text>
        </>
      )}
    </View>
  )
}

function getRowStyle(isPositive: boolean, isZero: boolean) {
  if (isPositive) return styles.positive
  if (!isZero && !isPositive) return styles.negative
  return styles.neutral
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  positive: {
    backgroundColor: '#F0FDF4',
  },
  negative: {
    backgroundColor: '#FEF2F2',
  },
  neutral: {},
  name: {
    width: 100,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
  net: {
    width: 80,
    textAlign: 'right',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  settlementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  settlementName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  settlementAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  settlementHint: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
})
