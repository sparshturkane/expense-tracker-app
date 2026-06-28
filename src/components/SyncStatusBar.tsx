import { View, Text, StyleSheet } from 'react-native'
import { usePeerStore } from '../stores/peerStore'
import { useThemeColors, spacing, borderRadius, typography } from '../theme'

export default function SyncStatusBar() {
  const connectedPeers = usePeerStore(s => s.connectedPeers)
  const colors = useThemeColors()
  const isConnected = connectedPeers.length > 0

  return (
    <View style={[styles.container, { backgroundColor: isConnected ? colors.successLight : colors.warningLight }]}>
      <View style={[styles.dot, { backgroundColor: isConnected ? colors.success : colors.warning }]} />
      <Text style={[styles.text, { color: isConnected ? colors.success : colors.warning }]}>
        {isConnected
          ? `\u25CF ${connectedPeers.length} peer${connectedPeers.length > 1 ? 's' : ''} connected`
          : '\u25CF Offline \u2014 data saved locally'}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
  },
  text: {
    ...typography.footnote,
    fontWeight: '600',
  },
})
