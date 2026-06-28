import { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View, ActivityIndicator, Text } from 'react-native'
import { getGun, initDeviceId } from '../src/gun/setup'
import { usePeerStore } from '../src/stores/peerStore'
import { useTripStore } from '../src/stores/tripStore'

export default function RootLayout() {
  const [ready, setReady] = useState(false)
  const setDeviceId = usePeerStore(s => s.setDeviceId)
  const loadTrips = useTripStore(s => s.loadTrips)

  useEffect(() => {
    async function init() {
      try {
        getGun()
        const id = await initDeviceId()
        setDeviceId(id)
        loadTrips()
      } catch (e) {
        console.warn('Init error:', e)
      }
      setReady(true)
    }
    init()
  }, [])

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 12, color: '#666' }}>Starting up...</Text>
      </View>
    )
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="trip/new" />
        <Stack.Screen name="trip/[id]/index" />
        <Stack.Screen name="trip/[id]/expense/add" />
        <Stack.Screen name="trip/[id]/people" />
        <Stack.Screen name="trip/[id]/settle" />
        <Stack.Screen name="trip/[id]/sync" />
      </Stack>
    </>
  )
}
