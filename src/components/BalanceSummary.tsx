import { View, Text, StyleSheet } from 'react-native'
import { Balance, SettlementSuggestion } from '../types'
import { useThemeColors, spacing, borderRadius, typography, shadows, formatCurrency } from '../theme'

interface Props {
  balances: Balance[]
  settlementSuggestions: SettlementSuggestion[]
  currency?: string
}

export default function BalanceSummary({ balances, settlementSuggestions, currency = 'USD' }: Props) {
  const colors = useThemeColors()
  const maxNet = Math.max(...balances.map(b => Math.abs(b.net)), 0.01)

  if (balances.length === 0) return null

  return (
    <View style={[styles.card, { backgroundColor: colors.bgSurface }, shadows.md]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Balances</Text>

      {balances.map(b => {
        const isPositive = b.net > 0
        const isZero = Math.abs(b.net) < 0.01
        const barWidth = Math.min((Math.abs(b.net) / maxNet) * 100, 100)
        const barColor = isZero ? colors.textTertiary : isPositive ? colors.success : colors.error

        return (
          <View key={b.participantId} style={styles.row}>
            <View style={styles.nameSection}>
              <View style={[styles.avatar, { backgroundColor: barColor + '20' }]}>
                <Text style={[styles.avatarText, { color: barColor }]}>
                  {b.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                {b.name}
              </Text>
            </View>

            <View style={styles.balanceSection}>
              <View style={[styles.barBg, { backgroundColor: colors.bgTertiary }]}>
                {!isZero && (
                  <View
                    style={[
                      styles.bar,
                      { width: `${barWidth}%`, backgroundColor: barColor },
                    ]}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.net,
                  {
                    color: isZero
                      ? colors.textMuted
                      : isPositive
                        ? colors.success
                        : colors.error,
                  },
                ]}
              >
                {isZero
                  ? `${formatCurrency(0, currency)}`
                  : `${isPositive ? '+' : '-'}${formatCurrency(Math.abs(b.net), currency)}`}
              </Text>
            </View>
          </View>
        )
      })}

      {settlementSuggestions.length > 0 && (
        <>
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Settlements</Text>

          {settlementSuggestions.map((s, i) => (
            <View key={i} style={styles.settlementRow}>
              <View style={styles.settlementPeople}>
                <Text style={[styles.settlementName, { color: colors.text }]}>
                  {s.fromName}
                </Text>
                <Text style={[styles.settlementArrow, { color: colors.textMuted }]}>
                  {' \u2192 '}
                </Text>
                <Text style={[styles.settlementName, { color: colors.text }]}>
                  {s.toName}
                </Text>
              </View>
              <Text style={[styles.settlementAmount, { color: colors.accent }]}>
                {formatCurrency(s.amount, currency)}
              </Text>
            </View>
          ))}

          <Text style={[styles.note, { color: colors.textMuted }]}>
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
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
  },
  sectionTitle: {
    ...typography.headline,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 110,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    ...typography.captionBold,
  },
  name: {
    ...typography.subheadBold,
    flex: 1,
  },
  balanceSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  barBg: {
    flex: 1,
    height: 6,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  net: {
    ...typography.subheadBold,
    width: 72,
    textAlign: 'right',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.md,
  },
  settlementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  settlementPeople: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settlementName: {
    ...typography.subheadBold,
  },
  settlementArrow: {
    ...typography.subhead,
  },
  settlementAmount: {
    ...typography.subheadBold,
  },
  note: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
})
