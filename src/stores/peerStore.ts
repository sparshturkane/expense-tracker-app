import { create } from 'zustand'

interface PeerStore {
  deviceId: string
  setDeviceId: (id: string) => void
  connectedPeers: string[]
  addPeer: (peerId: string) => void
  removePeer: (peerId: string) => void
  relayUrl: string
  setRelayUrl: (url: string) => void
}

export const usePeerStore = create<PeerStore>(set => ({
  deviceId: '',
  setDeviceId: (id: string) => set({ deviceId: id }),
  connectedPeers: [],
  addPeer: (peerId: string) =>
    set(state => ({
      connectedPeers: state.connectedPeers.includes(peerId)
        ? state.connectedPeers
        : [...state.connectedPeers, peerId],
    })),
  removePeer: (peerId: string) =>
    set(state => ({
      connectedPeers: state.connectedPeers.filter(p => p !== peerId),
    })),
  relayUrl: '',
  setRelayUrl: (url: string) => set({ relayUrl: url }),
}))
