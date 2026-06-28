import { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View, Text, ActivityIndicator } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { getGun, initDeviceId, initRelay, initPeerTracking } from '../src/gun/setup'
import { usePeerStore } from '../src/stores/peerStore'
import { useTripStore } from '../src/stores/tripStore'
import InAppNotification from '../src/components/InAppNotification'
import { ThemeProvider, useThemeColors, useTheme } from '../src/theme'

function AppContent({ children }: { children: React.ReactNode }) {
  const colors = useThemeColors()
  const { isDark } = useTheme()

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {children}
    </View>
  )
}

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
        await initRelay()
        initPeerTracking()
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
      <ThemeProvider>
        <SplashScreen />
      </ThemeProvider>
    )
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="trip/new" />
            <Stack.Screen name="trip/[id]/index" />
            <Stack.Screen name="trip/[id]/expense/add" />
            <Stack.Screen name="trip/[id]/people" />
            <Stack.Screen name="trip/[id]/settle" />
            <Stack.Screen name="trip/[id]/sync" />
          </Stack>
          <InAppNotification />
        </AppContent>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}

function SplashScreen() {
  const colors = useThemeColors()
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>{'\uD83D\uDCCB'}</Text>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
          Group Expense Tracker
        </Text>
        <Text style={{ fontSize: 14, color: colors.textMuted, marginBottom: 24 }}>
          Loading your trips...
        </Text>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    </View>
  )
}
