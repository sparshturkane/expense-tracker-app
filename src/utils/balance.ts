import { Participant, Expense, Settlement, Balance, SettlementSuggestion } from '../types'

export function calculateBalances(
  participants: Participant[],
  expenses: Expense[],
  settlements: Settlement[]
): Balance[] {
  if (participants.length === 0) return []

  const balanceMap = new Map<string, { paid: number; owed: number }>()

  participants.forEach(p => balanceMap.set(p.id, { paid: 0, owed: 0 }))

  expenses.forEach(expense => {
    const payer = balanceMap.get(expense.paidBy)
    if (payer) {
      payer.paid += expense.amount
    }

    expense.splitDetails.forEach(sd => {
      const participant = balanceMap.get(sd.participantId)
      if (participant) {
        participant.owed += sd.value
      }
    })
  })

  settlements.forEach(s => {
    if (s.settled) {
      const from = balanceMap.get(s.fromParticipantId)
      const to = balanceMap.get(s.toParticipantId)
      if (from && to) {
        from.paid += s.amount
        to.owed += s.amount
      }
    }
  })

  return participants.map(p => {
    const b = balanceMap.get(p.id)!
    return {
      participantId: p.id,
      name: p.name,
      paid: Math.round(b.paid * 100) / 100,
      owed: Math.round(b.owed * 100) / 100,
      net: Math.round((b.paid - b.owed) * 100) / 100,
    }
  })
}

export function calculateSettlements(
  balances: Balance[],
  participants: Participant[]
): SettlementSuggestion[] {
  const creditors = balances
    .filter(b => b.net > 0.01)
    .sort((a, b) => b.net - a.net)
    .map(b => ({ ...b }))

  const debtors = balances
    .filter(b => b.net < -0.01)
    .sort((a, b) => a.net - b.net)
    .map(b => ({ ...b, net: Math.abs(b.net) }))

  const suggestions: SettlementSuggestion[] = []
  let ci = 0
  let di = 0

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci]
    const debtor = debtors[di]
    const amount = Math.round(Math.min(creditor.net, debtor.net) * 100) / 100

    if (amount > 0.01) {
      suggestions.push({
        from: debtor.participantId,
        fromName: debtor.name,
        to: creditor.participantId,
        toName: creditor.name,
        amount,
      })
    }

    creditor.net = Math.round((creditor.net - amount) * 100) / 100
    debtor.net = Math.round((debtor.net - amount) * 100) / 100

    if (creditor.net < 0.01) ci++
    if (debtor.net < 0.01) di++
  }

  return suggestions
}
