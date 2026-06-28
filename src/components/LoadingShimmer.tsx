import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'

interface LoadingSpinnerProps {
  size?: number
  color?: string
  label?: string
}

export default function LoadingSpinner({
  size = 32,
  color = '#808080',
  label,
}: LoadingSpinnerProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size >= 36 ? 'large' : 'small'} color={color} />
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  label: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
})
