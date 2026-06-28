export type SplitType = 'equal' | 'custom' | 'percentage'

export interface Participant {
  id: string
  name: string
  createdAt: string
  addedByDevice?: string
}

export interface SplitDetail {
  participantId: string
  value: number
}

export interface Expense {
  id: string
  tripId: string
  description: string
  amount: number
  paidBy: string
  splitType: SplitType
  splitAmong: string[]
  splitDetails: SplitDetail[]
  category: string
  date: string
  createdAt: string
  updatedAt: string
  addedByDevice: string
}

export interface Settlement {
  id: string
  tripId: string
  fromParticipantId: string
  toParticipantId: string
  amount: number
  settled: boolean
  date: string
}

export interface Trip {
  id: string
  name: string
  currency: string
  createdAt: string
  updatedAt: string
}

export interface Balance {
  participantId: string
  name: string
  paid: number
  owed: number
  net: number
}

export interface SettlementSuggestion {
  from: string
  fromName: string
  to: string
  toName: string
  amount: number
}

export interface ExportData {
  formatVersion: number
  deviceId: string
  exportedAt: string
  trips: Trip[]
  participants: Record<string, Participant[]>
  expenses: Record<string, Expense[]>
  settlements: Record<string, Settlement[]>
}
