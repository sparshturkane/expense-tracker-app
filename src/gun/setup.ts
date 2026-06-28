import '../../shim'
import Gun from 'gun'
import 'gun/lib/mobile'
import 'gun/lib/radix'
import 'gun/lib/radisk'
import 'gun/lib/store'
import AsyncStorage from '@react-native-async-storage/async-storage'
import asyncStore from 'gun/lib/ras'
import { readAdapter, writeAdapter } from './adapter'
import { v4 as uuid } from 'uuid'
import { usePeerStore } from '../stores/peerStore'

const RELAY_STORAGE_KEY = '@relay_url'
const DEFAULT_RELAY_URL = 'http://localhost:8765/gun'

let gunInstance: any = null
let peerTrackingInitialized = false

Gun.on('create', function (this: any, db: any) {
  this.to.next(db)
  const pluginInterop = function (middleware: any) {
    return function (this: any, request: any) {
      this.to.next(request)
      return middleware(request, db)
    }
  }
  db.on('get', pluginInterop(readAdapter))
  db.on('put', pluginInterop(writeAdapter))
})

export function getGun() {
  if (!gunInstance) {
    gunInstance = Gun({
      store: asyncStore({ AsyncStorage }),
    })
  }
  return gunInstance
}

export async function initRelay(): Promise<void> {
  const gun = getGun()
  try {
    const stored = await AsyncStorage.getItem(RELAY_STORAGE_KEY)
    const url = stored || DEFAULT_RELAY_URL
    usePeerStore.getState().setRelayUrl(url)
    gun.opt({ peers: [url] })
  } catch {
    gun.opt({ peers: [DEFAULT_RELAY_URL] })
    usePeerStore.getState().setRelayUrl(DEFAULT_RELAY_URL)
  }
}

export async function setRelayUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(RELAY_STORAGE_KEY, url)
  usePeerStore.getState().setRelayUrl(url)
  const gun = getGun()
  gun.opt({ peers: [url] })
}

export function initPeerTracking(): void {
  if (peerTrackingInitialized || !gunInstance) return
  peerTrackingInitialized = true

  gunInstance.on('hi', (peer: any) => {
    const peerId = peer.id || peer.url || String(peer)
    usePeerStore.getState().addPeer(peerId)
  })

  gunInstance.on('bye', (peer: any) => {
    const peerId = peer.id || peer.url || String(peer)
    usePeerStore.getState().removePeer(peerId)
  })
}

export async function initDeviceId(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem('deviceId')
    if (stored) return stored
    const id = uuid()
    await AsyncStorage.setItem('deviceId', id)
    return id
  } catch {
    return uuid()
  }
}
