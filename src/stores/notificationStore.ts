import { create } from 'zustand'

export type NotificationType = 'expense_added' | 'participant_joined' | 'settlement_made'

export interface NotificationItem {
  id: string
  message: string
  type: NotificationType
}

interface NotificationStore {
  queue: NotificationItem[]
  current: NotificationItem | null
  show: (item: NotificationItem) => void
  dismiss: () => void
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  queue: [],
  current: null,

  show: (item: NotificationItem) => {
    const { current } = get()
    if (!current) {
      set({ current: item })
    } else {
      set(state => ({ queue: [...state.queue, item] }))
    }
  },

  dismiss: () => {
    const { queue } = get()
    if (queue.length > 0) {
      const [next, ...rest] = queue
      set({ current: next, queue: rest })
    } else {
      set({ current: null })
    }
  },
}))
