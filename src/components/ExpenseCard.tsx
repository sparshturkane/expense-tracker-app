import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Expense, Participant } from '../types'
import { useThemeColors, spacing, borderRadius, typography, shadows, formatCurrency } from '../theme'

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#FF9500',
  Transport: '#007AFF',
  Accommodation: '#34C759',
  Activities: '#AF52DE',
  Shopping: '#FF2D55',
  Drinks: '#FF6482',
  Other: '#8E8E93',
}

interface Props {
  expense: Expense
  participants: Participant[]
  currency?: string
  onDelete?: () => void
}

export default function ExpenseCard({ expense, participants, currency = 'USD', onDelete }: Props) {
  const colors = useThemeColors()
  const payer = participants.find(p => p.id === expense.paidBy)

  const categoryColor = expense.category
    ? CATEGORY_COLORS[expense.category] || colors.accent
    : colors.border

  const getShareText = () => {
    if (expense.splitType === 'equal')
      return `Split equally \u00b7 ${expense.splitAmong.length} ways`
    if (expense.splitType === 'custom') return `Custom split \u00b7 ${expense.splitAmong.length} ways`
    return `Percentage split \u00b7 ${expense.splitAmong.length} ways`
  }

  const getParticipantName = (id: string) =>
    participants.find(p => p.id === id)?.name || 'Unknown'

  return (
    <View style={[styles.card, { backgroundColor: colors.card }, shadows.sm]}>
      <View style={styles.topRow}>
        <View style={[styles.categoryIndicator, { backgroundColor: categoryColor }]} />
        <View style={styles.contentBlock}>
          <View style={styles.headerRow}>
            <Text style={[styles.description, { color: colors.text }]} numberOfLines={1}>
              {expense.description}
            </Text>
            <Text style={[styles.amount, { color: colors.accent }]}>
              {formatCurrency(expense.amount, currency)}
            </Text>
          </View>

          <Text style={[styles.paidBy, { color: colors.textSecondary }]}>
            Paid by{' '}
            <Text style={[styles.paidByName, { color: colors.text }]}>
              {payer?.name || 'Unknown'}
            </Text>
          </Text>

          <Text style={[styles.splitInfo, { color: colors.textMuted }]}>
            {getShareText()}
          </Text>

          {expense.category ? (
            <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '18' }]}>
              <Text style={[styles.categoryText, { color: categoryColor }]}>
                {expense.category}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={[styles.detailsContainer, { borderTopColor: colors.divider }]}>
        {expense.splitDetails.slice(0, 4).map(sd => (
          <View key={sd.participantId} style={styles.detailRow}>
            <Text style={[styles.detailName, { color: colors.textSecondary }]}>
              {getParticipantName(sd.participantId)}
            </Text>
            <Text style={[styles.detailAmount, { color: colors.text }]}>
              {formatCurrency(sd.value, currency)}
            </Text>
          </View>
        ))}
        {expense.splitDetails.length > 4 && (
          <Text style={[styles.moreText, { color: colors.textMuted }]}>
            +{expense.splitDetails.length - 4} more
          </Text>
        )}
      </View>

      {onDelete && (
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
          <Text style={[styles.deleteText, { color: colors.error }]}>Delete</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
  },
  categoryIndicator: {
    width: 4,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
    alignSelf: 'stretch',
  },
  contentBlock: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.bodyBold,
    flex: 1,
    marginRight: spacing.sm,
  },
  amount: {
    ...typography.title3,
    fontWeight: '700',
  },
  paidBy: {
    ...typography.footnote,
    marginBottom: 2,
  },
  paidByName: {
    fontWeight: '600',
  },
  splitInfo: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  categoryText: {
    ...typography.captionBold,
  },
  detailsContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  detailName: {
    ...typography.footnote,
  },
  detailAmount: {
    ...typography.footnoteBold,
  },
  moreText: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  deleteBtn: {
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
    padding: spacing.xs,
  },
  deleteText: {
    ...typography.footnoteBold,
  },
})
