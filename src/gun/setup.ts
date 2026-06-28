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

let gunInstance: any = null

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
