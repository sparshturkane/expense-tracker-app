import { useState, useMemo, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import QRCode from 'react-native-qrcode-svg'
import { useTripStore } from '../../../src/stores/tripStore'
import { useExpenseStore } from '../../../src/stores/expenseStore'
import { usePeerStore } from '../../../src/stores/peerStore'
import { ExportData } from '../../../src/types'
import { mergeExportData } from '../../../src/utils/merge'

type SyncMode = 'export' | 'import_qr' | 'import_file'

export default function SyncScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const [mode, setMode] = useState<SyncMode>('export')

  const trip = useTripStore(s => s.trips.find(t => t.id === id))
  const { trips } = useTripStore()
  const {
    participantsByTrip,
    expensesByTrip,
    settlementsByTrip,
  } = useExpenseStore()
  const deviceId = usePeerStore(s => s.deviceId)

  const exportData = useMemo((): ExportData => ({
    formatVersion: 1,
    deviceId,
    exportedAt: new Date().toISOString(),
    trips,
    participants: participantsByTrip,
    expenses: expensesByTrip,
    settlements: settlementsByTrip,
  }), [trips, participantsByTrip, expensesByTrip, settlementsByTrip, deviceId])

  const exportJson = useMemo(() => JSON.stringify(exportData, null, 2), [exportData])

  const handleExportFile = async () => {
    try {
      const filename = `${trip?.name || 'trip'}-${Date.now()}.json`
      const path = `${FileSystem.cacheDirectory}${filename}`
      await FileSystem.writeAsStringAsync(path, exportJson)
      await Sharing.shareAsync(path, {
        mimeType: 'application/json',
        dialogTitle: 'Share trip data',
      })
    } catch (e) {
      Alert.alert('Export failed', String(e))
    }
  }

  const handleImport = async () => {
    try {
      const result = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync()
      if (!result.granted) return

      const files = await FileSystem.StorageAccessFramework.readDirectoryAsync(result.directoryUri)
      const jsonFiles = files.filter(f => f.endsWith('.json'))

      if (jsonFiles.length === 0) {
        Alert.alert('No JSON files found')
        return
      }

      const fileUri = jsonFiles[0]
      const content = await FileSystem.readAsStringAsync(fileUri)
      const importData: ExportData = JSON.parse(content)

      const merged = mergeExportData(
        trips,
        participantsByTrip,
        expensesByTrip,
        settlementsByTrip,
        importData
      )

      Alert.alert(
        'Import Complete',
        `Merged ${importData.trips.length} trip(s), ${Object.values(importData.expenses).flat().length} expense(s)`
      )
      router.back()
    } catch (e) {
      Alert.alert('Import failed', String(e))
    }
  }

  const handleExportQR = () => {
    setMode('export')
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Sync</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'export' && styles.modeActive]}
          onPress={handleExportQR}
        >
          <Text style={[styles.modeText, mode === 'export' && styles.modeTextActive]}>
            Export QR
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'import_file' && styles.modeActive]}
          onPress={() => setMode('import_file')}
        >
          <Text style={[styles.modeText, mode === 'import_file' && styles.modeTextActive]}>
            Import File
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'export' && (
        <View style={styles.qrContainer}>
          <Text style={styles.qrLabel}>
            Others can scan this QR to import trip data
          </Text>
          <View style={styles.qrWrapper}>
            {exportJson.length < 2000 ? (
              <QRCode
                value={exportJson}
                size={220}
                backgroundColor="#fff"
                color="#111"
              />
            ) : (
              <View style={styles.qrFallback}>
                <Text style={styles.qrFallbackIcon}>📱</Text>
                <Text style={styles.qrFallbackText}>
                  Data too large for QR{'\n'}Use file export instead
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.actionBtn} onPress={handleExportFile}>
            <Text style={styles.actionBtnText}>Export as File</Text>
          </TouchableOpacity>
        </View>
      )}

      {mode === 'import_file' && (
        <View style={styles.importContainer}>
          <Text style={styles.importIcon}>📂</Text>
          <Text style={styles.importTitle}>Import from File</Text>
          <Text style={styles.importText}>
            Select a JSON file exported from another device
          </Text>
          <TouchableOpacity style={styles.actionBtn} onPress={handleImport}>
            <Text style={styles.actionBtnText}>Select File</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  back: { fontSize: 16, color: '#007AFF', marginRight: 12 },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: '#111', textAlign: 'center' },
  modeRow: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 4,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modeActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  modeText: { fontSize: 14, fontWeight: '600', color: '#666' },
  modeTextActive: { color: '#007AFF' },
  qrContainer: { flex: 1, alignItems: 'center', paddingHorizontal: 40, paddingTop: 20 },
  qrLabel: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 },
  qrWrapper: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrFallback: { width: 220, height: 220, justifyContent: 'center', alignItems: 'center' },
  qrFallbackIcon: { fontSize: 40, marginBottom: 8 },
  qrFallbackText: { fontSize: 13, color: '#999', textAlign: 'center' },
  importContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  importIcon: { fontSize: 48, marginBottom: 16 },
  importTitle: { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 8 },
  importText: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 },
  actionBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 24,
  },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
})
