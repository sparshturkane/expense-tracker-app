import { View, Text } from 'react-native'

export default function NewTripScreen() {
  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>
        New Trip
      </Text>
      <Text style={{ fontSize: 16, color: '#64748B', marginTop: 8 }}>
        Enter trip details to create a shared expense tracking session.
      </Text>
    </View>
  )
}
