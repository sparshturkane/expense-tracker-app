import { create } from 'zustand'
import { Expense, Participant, Settlement, SplitDetail, SplitType } from '../types'
import { getGun } from '../gun/setup'
import { v4 as uuid } from 'uuid'
import { calculateSplit } from '../utils/split'

interface ExpenseStore {
  expensesByTrip: Record<string, Expense[]>
  participantsByTrip: Record<string, Participant[]>
  settlementsByTrip: Record<string, Settlement[]>
  loadTripData: (tripId: string) => void
  addParticipant: (tripId: string, name: string) => Participant
  removeParticipant: (tripId: string, participantId: string) => void
  addExpense: (
    tripId: string,
    description: string,
    amount: number,
    paidBy: string,
    splitType: SplitType,
    splitAmong: string[],
    splitDetails: SplitDetail[],
    category: string,
    deviceId: string
  ) => Expense
  updateExpense: (tripId: string, expenseId: string, updates: Partial<Expense>) => void
  deleteExpense: (tripId: string, expenseId: string) => void
  addSettlement: (tripId: string, from: string, to: string, amount: number) => Settlement
  markSettled: (tripId: string, settlementId: string) => void
}

export const useExpenseStore = create<ExpenseStore>((set, get) => ({
  expensesByTrip: {},
  participantsByTrip: {},
  settlementsByTrip: {},

  loadTripData: (tripId: string) => {
    const gun = getGun()
    const tripNode = gun.get('trips').get(tripId)

    tripNode.get('participants').map().on((data: any, key: string) => {
      if (data && data.name) {
        set(state => ({
          participantsByTrip: {
            ...state.participantsByTrip,
            [tripId]: [
              ...(state.participantsByTrip[tripId] || []).filter(p => p.id !== key),
              { ...data, id: key },
            ],
          },
        }))
      }
    })

    tripNode.get('expenses').map().on((data: any, key: string) => {
      if (data && data.description) {
        set(state => ({
          expensesByTrip: {
            ...state.expensesByTrip,
            [tripId]: [
              ...(state.expensesByTrip[tripId] || []).filter(e => e.id !== key),
              { ...data, id: key },
            ],
          },
        }))
      }
    })

    tripNode.get('settlements').map().on((data: any, key: string) => {
      if (data && data.fromParticipantId) {
        set(state => ({
          settlementsByTrip: {
            ...state.settlementsByTrip,
            [tripId]: [
              ...(state.settlementsByTrip[tripId] || []).filter(s => s.id !== key),
              { ...data, id: key },
            ],
          },
        }))
      }
    })
  },

  addParticipant: (tripId: string, name: string) => {
    const id = uuid()
    const participant: Participant = { id, name, createdAt: new Date().toISOString() }
    getGun().get('trips').get(tripId).get('participants').get(id).put(participant)
    return participant
  },

  removeParticipant: (tripId: string, participantId: string) => {
    getGun().get('trips').get(tripId).get('participants').get(participantId).put(null)
    set(state => ({
      participantsByTrip: {
        ...state.participantsByTrip,
        [tripId]: (state.participantsByTrip[tripId] || []).filter(
          p => p.id !== participantId
        ),
      },
    }))
  },

  addExpense: (
    tripId: string,
    description: string,
    amount: number,
    paidBy: string,
    splitType: SplitType,
    splitAmong: string[],
    splitDetails: SplitDetail[],
    category: string,
    deviceId: string
  ) => {
    const id = uuid()
    const now = new Date().toISOString()
    const computedDetails = calculateSplit(amount, splitType, splitAmong, splitDetails)

    const expense: Expense = {
      id,
      tripId,
      description,
      amount,
      paidBy,
      splitType,
      splitAmong,
      splitDetails: computedDetails,
      category,
      date: now.split('T')[0],
      createdAt: now,
      updatedAt: now,
      addedByDevice: deviceId,
    }

    getGun().get('trips').get(tripId).get('expenses').get(id).put(expense)
    return expense
  },

  updateExpense: (tripId: string, expenseId: string, updates: Partial<Expense>) => {
    const expenses = get().expensesByTrip[tripId] || []
    const expense = expenses.find(e => e.id === expenseId)
    if (expense) {
      const updated = {
        ...expense,
        ...updates,
        updatedAt: new Date().toISOString(),
      }
      getGun().get('trips').get(tripId).get('expenses').get(expenseId).put(updated)
    }
  },

  deleteExpense: (tripId: string, expenseId: string) => {
    getGun().get('trips').get(tripId).get('expenses').get(expenseId).put(null)
    set(state => ({
      expensesByTrip: {
        ...state.expensesByTrip,
        [tripId]: (state.expensesByTrip[tripId] || []).filter(
          e => e.id !== expenseId
        ),
      },
    }))
  },

  addSettlement: (tripId: string, from: string, to: string, amount: number) => {
    const id = uuid()
    const settlement: Settlement = {
      id,
      tripId,
      fromParticipantId: from,
      toParticipantId: to,
      amount,
      settled: true,
      date: new Date().toISOString(),
    }
    getGun().get('trips').get(tripId).get('settlements').get(id).put(settlement)
    return settlement
  },

  markSettled: (tripId: string, settlementId: string) => {
    const settlements = get().settlementsByTrip[tripId] || []
    const settlement = settlements.find(s => s.id === settlementId)
    if (settlement) {
      getGun()
        .get('trips')
        .get(tripId)
        .get('settlements')
        .get(settlementId)
        .put({ ...settlement, settled: true })
    }
  },
}))
