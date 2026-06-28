import { create } from 'zustand'
import { Expense, Participant, Settlement, SplitDetail, SplitType } from '../types'
import { getGun } from '../gun/setup'
import { v4 as uuid } from 'uuid'
import { calculateSplit } from '../utils/split'
import { useNotificationStore } from './notificationStore'
import { usePeerStore } from './peerStore'

// Module-level tracking for remote change detection
const knownExpenseIds = new Map<string, Set<string>>()
const knownParticipantIds = new Map<string, Set<string>>()
const initialLoadComplete = new Map<string, boolean>()

interface ExpenseStore {
  expensesByTrip: Record<string, Expense[]>
  participantsByTrip: Record<string, Participant[]>
  settlementsByTrip: Record<string, Settlement[]>
  loadTripData: (tripId: string) => void
  addParticipant: (tripId: string, name: string, deviceId?: string) => Participant
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
    const deviceId = usePeerStore.getState().deviceId

    if (!knownExpenseIds.has(tripId)) knownExpenseIds.set(tripId, new Set())
    if (!knownParticipantIds.has(tripId)) knownParticipantIds.set(tripId, new Set())
    if (!initialLoadComplete.has(tripId)) initialLoadComplete.set(tripId, false)

    tripNode.get('participants').map().on((data: any, key: string) => {
      if (data && data.name) {
        const isNew = !knownParticipantIds.get(tripId)!.has(key)
        knownParticipantIds.get(tripId)!.add(key)

        set(state => ({
          participantsByTrip: {
            ...state.participantsByTrip,
            [tripId]: [
              ...(state.participantsByTrip[tripId] || []).filter(p => p.id !== key),
              { ...data, id: key },
            ],
          },
        }))

        if (initialLoadComplete.get(tripId) && isNew && data.addedByDevice && data.addedByDevice !== deviceId) {
          useNotificationStore.getState().show({
            id: `participant-${key}`,
            message: `${data.name} joined the trip`,
            type: 'participant_joined',
          })
        }
      }
    })

    tripNode.get('expenses').map().on((data: any, key: string) => {
      if (data && data.description) {
        const isNew = !knownExpenseIds.get(tripId)!.has(key)
        knownExpenseIds.get(tripId)!.add(key)

        set(state => ({
          expensesByTrip: {
            ...state.expensesByTrip,
            [tripId]: [
              ...(state.expensesByTrip[tripId] || []).filter(e => e.id !== key),
              { ...data, id: key },
            ],
          },
        }))

        if (initialLoadComplete.get(tripId) && isNew && data.addedByDevice && data.addedByDevice !== deviceId) {
          const participants = get().participantsByTrip[tripId] || []
          const payerName = participants.find(p => p.id === data.paidBy)?.name || 'Someone'
          useNotificationStore.getState().show({
            id: `expense-${key}`,
            message: `${payerName} added ${data.description} (${data.amount})`,
            type: 'expense_added',
          })
        }
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

    setTimeout(() => {
      initialLoadComplete.set(tripId, true)
    }, 2000)
  },

  addParticipant: (tripId: string, name: string, deviceId?: string) => {
    const id = uuid()
    const participant: Participant = { id, name, createdAt: new Date().toISOString(), addedByDevice: deviceId || '' }
    getGun().get('trips').get(tripId).get('participants').get(id).put(participant)
    getGun().get('trips').get(tripId).get('updatedAt').put(new Date().toISOString())

    set(state => ({
      participantsByTrip: {
        ...state.participantsByTrip,
        [tripId]: [
          ...(state.participantsByTrip[tripId] || []).filter(p => p.id !== id),
          participant,
        ],
      },
    }))

    return participant
  },

  removeParticipant: (tripId: string, participantId: string) => {
    getGun().get('trips').get(tripId).get('participants').get(participantId).put(null)
    getGun().get('trips').get(tripId).get('updatedAt').put(new Date().toISOString())
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
    getGun().get('trips').get(tripId).get('updatedAt').put(new Date().toISOString())

    set(state => ({
      expensesByTrip: {
        ...state.expensesByTrip,
        [tripId]: [
          ...(state.expensesByTrip[tripId] || []).filter(e => e.id !== id),
          expense,
        ],
      },
    }))

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
    getGun().get('trips').get(tripId).get('updatedAt').put(new Date().toISOString())
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
    getGun().get('trips').get(tripId).get('updatedAt').put(new Date().toISOString())
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
