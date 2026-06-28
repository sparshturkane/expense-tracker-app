import { SplitType, SplitDetail } from '../types'

export function calculateSplit(
  amount: number,
  splitType: SplitType,
  participantIds: string[],
  splitDetails: SplitDetail[]
): SplitDetail[] {
  switch (splitType) {
    case 'equal':
      return calculateEqualSplit(amount, participantIds)
    case 'custom':
      return calculateCustomSplit(amount, splitDetails)
    case 'percentage':
      return calculatePercentageSplit(amount, splitDetails)
    default:
      return calculateEqualSplit(amount, participantIds)
  }
}

function calculateEqualSplit(amount: number, participantIds: string[]): SplitDetail[] {
  const share = Math.round((amount / participantIds.length) * 100) / 100
  const remainder = Math.round((amount - share * participantIds.length) * 100) / 100

  return participantIds.map((id, index) => ({
    participantId: id,
    value: index === 0 ? Math.round((share + remainder) * 100) / 100 : share,
  }))
}

function calculateCustomSplit(amount: number, splitDetails: SplitDetail[]): SplitDetail[] {
  const totalCustom = splitDetails.reduce((sum, s) => sum + s.value, 0)
  if (Math.abs(totalCustom - amount) > 0.01) {
    return splitDetails
  }
  return splitDetails.map(s => ({
    ...s,
    value: Math.round(s.value * 100) / 100,
  }))
}

function calculatePercentageSplit(amount: number, splitDetails: SplitDetail[]): SplitDetail[] {
  const totalPct = splitDetails.reduce((sum, s) => sum + s.value, 0)
  if (Math.abs(totalPct - 100) > 0.01) {
    return splitDetails.map(s => ({
      ...s,
      value: Math.round((amount * (s.value / totalPct)) * 100) / 100,
    }))
  }
  return splitDetails.map(s => ({
    ...s,
    value: Math.round((amount * (s.value / 100)) * 100) / 100,
  }))
}

export function validateSplit(
  amount: number,
  splitType: SplitType,
  splitDetails: SplitDetail[],
  participantIds: string[]
): string | null {
  if (splitType === 'equal') return null

  if (splitType === 'custom') {
    const total = splitDetails.reduce((sum, s) => sum + s.value, 0)
    if (Math.abs(total - amount) > 0.01) {
      return `Custom amounts must sum to ${amount.toFixed(2)} (currently ${total.toFixed(2)})`
    }
  }

  if (splitType === 'percentage') {
    const total = splitDetails.reduce((sum, s) => sum + s.value, 0)
    if (Math.abs(total - 100) > 0.01) {
      return `Percentages must sum to 100% (currently ${total.toFixed(1)}%)`
    }
  }

  return null
}
