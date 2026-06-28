import { useEffect, useRef } from 'react'
import { Animated, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNotificationStore, NotificationType } from '../stores/notificationStore'
import { useThemeColors, spacing, borderRadius, typography, shadows } from '../theme'

const AUTO_DISMISS_MS = 4000

const ICONS: Record<NotificationType, string> = {
  expense_added: '\uD83D\uDCB0',
  participant_joined: '\uD83D\uDC4B',
  settlement_made: '\u2705',
}

export default function InAppNotification() {
  const current = useNotificationStore(s => s.current)
  const dismiss = useNotificationStore(s => s.dismiss)
  const colors = useThemeColors()
  const insets = useSafeAreaInsets()
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(-80)).current
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (current) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()

      timerRef.current = setTimeout(() => {
        handleDismiss()
      }, AUTO_DISMISS_MS)
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [current?.id])

  function handleDismiss() {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -80,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      dismiss()
    })
  }

  if (!current) return null

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.bgSurface,
          opacity,
          transform: [{ translateY }],
          top: insets.top + spacing.md,
        },
        shadows.lg,
      ]}
    >
      <TouchableOpacity
        style={styles.inner}
        onPress={handleDismiss}
        activeOpacity={0.8}
      >
        <Text style={styles.icon}>{ICONS[current.type] || '\uD83D\uDD14'}</Text>
        <Text style={[styles.message, { color: colors.text }]} numberOfLines={2}>
          {current.message}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    borderRadius: borderRadius.lg,
    zIndex: 9999,
    elevation: 10,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  icon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  message: {
    ...typography.callout,
    flex: 1,
  },
})
