import { create } from 'zustand'
import { Trip } from '../types'
import { getGun } from '../gun/setup'
import { v4 as uuid } from 'uuid'

interface TripStore {
  trips: Trip[]
  loading: boolean
  loadTrips: () => void
  createTrip: (name: string, currency: string) => Trip
  updateTrip: (id: string, updates: Partial<Trip>) => void
  deleteTrip: (id: string) => void
  touchTrip: (id: string) => void
}

export const useTripStore = create<TripStore>((set, get) => ({
  trips: [],
  loading: true,

  loadTrips: () => {
    const gun = getGun()
    let hasFired = false
    gun.get('trips').map().on((data: any, key: string) => {
      if (data && data.name) {
        set(state => {
          const existing = state.trips.find(t => t.id === key)
          if (existing) {
            return {
              trips: state.trips.map(t =>
                t.id === key ? { ...t, ...data, id: key } : t
              ),
              loading: false,
            }
          }
          return {
            trips: [...state.trips, { ...data, id: key }],
            loading: false,
          }
        })
      }
      if (!hasFired) {
        hasFired = true
        set({ loading: false })
      }
    })
    setTimeout(() => set({ loading: false }), 3000)
  },

  createTrip: (name: string, currency: string) => {
    const id = uuid()
    const now = new Date().toISOString()
    const trip: Trip = { id, name, currency, createdAt: now, updatedAt: now }
    getGun().get('trips').get(id).put(trip)
    return trip
  },

  updateTrip: (id: string, updates: Partial<Trip>) => {
    const trip = get().trips.find(t => t.id === id)
    if (trip) {
      const updated = { ...trip, ...updates, updatedAt: new Date().toISOString() }
      getGun().get('trips').get(id).put(updated)
    }
  },

  touchTrip: (id: string) => {
    getGun().get('trips').get(id).get('updatedAt').put(new Date().toISOString())
  },

  deleteTrip: (id: string) => {
    getGun().get('trips').get(id).put(null)
    set(state => ({ trips: state.trips.filter(t => t.id !== id) }))
  },
}))
