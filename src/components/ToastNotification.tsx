import { View, Text, StyleSheet } from 'react-native'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
}

export function SuccessToast({ message }: ToastProps) {
  return (
    <View style={[styles.toastContainer, { backgroundColor: '#10B981' }]}>
      <Text style={styles.icon}>✓</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  )
}

export function ErrorToast({ message }: ToastProps) {
  return (
    <View style={[styles.toastContainer, { backgroundColor: '#EF4444' }]}>
      <Text style={styles.icon}>!</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  )
}

export function InfoToast({ message }: ToastProps) {
  return (
    <View style={[styles.toastContainer, { backgroundColor: '#0A84FF' }]}>
      <Text style={styles.message}>{message}</Text>
    </View>
  )
}

export function WarningToast({ message }: ToastProps) {
  return (
    <View style={[styles.toastContainer, { backgroundColor: '#F59E0B' }]}>
      <Text style={styles.icon}>⚠</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  icon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginRight: 8,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
})
