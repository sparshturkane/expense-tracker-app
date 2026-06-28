import { View, Text, StyleSheet } from 'react-native'
import { usePeerStore } from '../stores/peerStore'

export default function SyncStatusBar() {
  const connectedPeers = usePeerStore(s => s.connectedPeers)

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.dot,
          { backgroundColor: connectedPeers.length > 0 ? '#34C759' : '#FF9500' },
        ]}
      />
      <Text style={styles.text}>
        {connectedPeers.length > 0
          ? `${connectedPeers.length} peer${connectedPeers.length > 1 ? 's' : ''} connected`
          : 'Offline — data saved locally'}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    backgroundColor: '#f8f8f8',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  text: { fontSize: 12, color: '#666' },
})
