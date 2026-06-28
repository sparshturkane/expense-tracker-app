import { ExportData, Trip, Participant, Expense, Settlement } from '../types'

export function mergeExportData(
  localTrips: Trip[],
  localParticipants: Record<string, Participant[]>,
  localExpenses: Record<string, Expense[]>,
  localSettlements: Record<string, Settlement[]>,
  importData: ExportData
): {
  trips: Trip[]
  participants: Record<string, Participant[]>
  expenses: Record<string, Expense[]>
  settlements: Record<string, Settlement[]>
} {
  const trips = mergeById(localTrips, importData.trips, 'updatedAt') as Trip[]

  const participants = { ...localParticipants }
  const expenses = { ...localExpenses }
  const settlements = { ...localSettlements }

  importData.trips.forEach(importTrip => {
    const tripId = importTrip.id

    const importParticipants = importData.participants[tripId] || []
    participants[tripId] = mergeById(
      participants[tripId] || [],
      importParticipants,
      'createdAt'
    ) as Participant[]

    const importExpenses = importData.expenses[tripId] || []
    expenses[tripId] = mergeById(
      expenses[tripId] || [],
      importExpenses,
      'updatedAt'
    ) as Expense[]

    const importSettlements = importData.settlements[tripId] || []
    settlements[tripId] = mergeById(
      settlements[tripId] || [],
      importSettlements,
      'date'
    ) as Settlement[]
  })

  return { trips, participants, expenses, settlements }
}

function mergeById(
  local: any[],
  incoming: any[],
  timestampField: string
): any[] {
  const map = new Map<string, any>()

  local.forEach(item => map.set(item.id, item))
  incoming.forEach(item => {
    const existing = map.get(item.id)
    if (!existing) {
      map.set(item.id, item)
    } else if (
      item[timestampField] &&
      existing[timestampField] &&
      item[timestampField] > existing[timestampField]
    ) {
      map.set(item.id, item)
    }
  })

  return Array.from(map.values())
}
