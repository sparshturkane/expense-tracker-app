import { useState, useMemo, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import QRCode from 'react-native-qrcode-svg'
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera'
import { useTripStore } from '../../../src/stores/tripStore'
import { useExpenseStore } from '../../../src/stores/expenseStore'
import { usePeerStore } from '../../../src/stores/peerStore'
import { getGun, setRelayUrl } from '../../../src/gun/setup'
import { ExportData } from '../../../src/types'
import { mergeExportData } from '../../../src/utils/merge'
import { useThemeColors, spacing, borderRadius, typography, shadows } from '../../../src/theme'

type SyncMode = 'share' | 'join' | 'file'

function formatQrData(relayUrl: string, tripId: string): string {
  const host = relayUrl.replace(/^https?:\/\//, '').replace(/\/gun$/, '')
  return `gun://${host}/trips/${tripId}`
}

function parseQrData(data: string): { relayUrl?: string; tripId: string } {
  const match = data.match(/^gun:\/\/([^/]+)\/trips\/(.+)$/)
  if (match) {
    const host = match[1]
    return { relayUrl: `http://${host}/gun`, tripId: match[2] }
  }
  return { tripId: data.trim() }
}

export default function SyncScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const colors = useThemeColors()
  const [mode, setMode] = useState<SyncMode>('share')
  const [importing, setImporting] = useState(false)

  const trip = useTripStore(s => s.trips.find(t => t.id === id))
  const { trips } = useTripStore()
  const {
    participantsByTrip,
    expensesByTrip,
    settlementsByTrip,
  } = useExpenseStore()
  const deviceId = usePeerStore(s => s.deviceId)
  const peerRelayUrl = usePeerStore(s => s.relayUrl)
  const connectedPeers = usePeerStore(s => s.connectedPeers)

  // Share tab
  const qrData = useMemo(
    () => formatQrData(peerRelayUrl, id!),
    [peerRelayUrl, id]
  )

  // Join tab
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)
  const [manualTripId, setManualTripId] = useState('')
  const [joining, setJoining] = useState(false)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [editRelayUrl, setEditRelayUrl] = useState(false)
  const [relayUrlInput, setRelayUrlInput] = useState(peerRelayUrl)

  // File tab
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
  const isTooLargeForQr = exportJson.length > 2000

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
      Alert.alert('Export Failed', String(e))
    }
  }

  const handleImport = async () => {
    try {
      setImporting(true)
      const result = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync()
      if (!result.granted) {
        setImporting(false)
        return
      }

      const files = await FileSystem.StorageAccessFramework.readDirectoryAsync(result.directoryUri)
      const jsonFiles = files.filter(f => f.endsWith('.json'))

      if (jsonFiles.length === 0) {
        Alert.alert('No JSON files found', 'Select a directory containing exported trip data.')
        setImporting(false)
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

      const gun = getGun()

      for (const tripItem of merged.trips) {
        gun.get('trips').get(tripItem.id).put(tripItem)
      }

      let totalItems = 0
      for (const [tripId, items] of Object.entries(merged.participants)) {
        for (const participant of items) {
          gun.get('trips').get(tripId).get('participants').get(participant.id).put({
            ...participant,
            addedByDevice: participant.addedByDevice || importData.deviceId,
          })
          totalItems++
        }
      }
      for (const [tripId, items] of Object.entries(merged.expenses)) {
        for (const expense of items) {
          gun.get('trips').get(tripId).get('expenses').get(expense.id).put(expense)
          totalItems++
        }
      }
      for (const [tripId, items] of Object.entries(merged.settlements)) {
        for (const settlement of items) {
          gun.get('trips').get(tripId).get('settlements').get(settlement.id).put(settlement)
          totalItems++
        }
      }

      Alert.alert(
        'Import Complete',
        `Merged ${importData.trips.length} trip(s) and ${totalItems} item(s)`
      )
      router.back()
    } catch (e) {
      Alert.alert('Import Failed', String(e))
    } finally {
      setImporting(false)
    }
  }

  const handleBarCodeScanned = useCallback(async (result: BarcodeScanningResult) => {
    if (scanned || joining) return
    setScanned(true)
    setJoining(true)

    try {
      const { relayUrl: scanRelayUrl, tripId: scanTripId } = parseQrData(result.data)
      if (!scanTripId) {
        Alert.alert('Invalid QR', 'Could not parse trip ID from QR code.')
        setJoining(false)
        return
      }
      if (scanRelayUrl && scanRelayUrl !== peerRelayUrl) {
        await setRelayUrl(scanRelayUrl)
      }
      Alert.alert('Joined!', 'Trip data will sync automatically via the relay.')
      router.replace('/')
    } catch (e) {
      Alert.alert('Join Failed', String(e))
      setJoining(false)
    }
  }, [scanned, joining, peerRelayUrl, router])

  const handleManualJoin = async () => {
    const trimmed = manualTripId.trim()
    if (!trimmed) {
      Alert.alert('Enter Trip ID', 'Paste the trip ID shared with you.')
      return
    }
    setJoining(true)
    try {
      Alert.alert('Joined!', 'Trip data will sync automatically via the relay.')
      router.replace('/')
    } catch (e) {
      Alert.alert('Join Failed', String(e))
    } finally {
      setJoining(false)
    }
  }

  const handleSaveRelayUrl = async () => {
    const trimmed = relayUrlInput.trim()
    if (!trimmed) {
      Alert.alert('Invalid URL', 'Enter a valid Gun relay URL.')
      return
    }
    await setRelayUrl(trimmed)
    setEditRelayUrl(false)
    Alert.alert('Relay Updated', `Connected to ${trimmed}`)
  }

  const handleCopyTripId = () => {
    Alert.alert('Trip ID', id!)
  }

  const isPeerConnected = connectedPeers.length > 0

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.divider, backgroundColor: colors.navBar }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.back, { color: colors.accent }]}>{'\u2039'} Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Sync</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={[styles.segment, { backgroundColor: colors.bgTertiary }]}>
        {(['share', 'join', 'file'] as SyncMode[]).map(m => (
          <TouchableOpacity
            key={m}
            style={[styles.segmentBtn, mode === m && { backgroundColor: colors.bgSurface }, mode === m && shadows.sm]}
            onPress={() => setMode(m)}
          >
            <Text style={[styles.segmentText, { color: colors.textMuted }, mode === m && { color: colors.accent }]}>
              {m === 'share' ? 'Share' : m === 'join' ? 'Join' : 'File'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {mode === 'share' && (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.relayStatus, { backgroundColor: isPeerConnected ? colors.successLight : colors.warningLight }]}>
            <View style={[styles.relayDot, { backgroundColor: isPeerConnected ? colors.success : colors.warning }]} />
            <Text style={[styles.relayText, { color: isPeerConnected ? colors.success : colors.warning }]}>
              {isPeerConnected
                ? `\u25CF ${connectedPeers.length} peer${connectedPeers.length > 1 ? 's' : ''} connected`
                : '\u25CF Offline'}
            </Text>
          </View>

          <View style={styles.qrSection}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              Share this trip
            </Text>
            <Text style={[styles.sectionHint, { color: colors.textMuted }]}>
              Others can scan this QR or enter the trip ID to join
            </Text>
            <View style={[styles.qrWrapper, { backgroundColor: colors.bgSurface }, shadows.md]}>
              <QRCode value={qrData} size={200} backgroundColor={colors.bgSurface} color={colors.text} />
            </View>
            <TouchableOpacity
              style={[styles.copyBtn, { backgroundColor: colors.bgSecondary }]}
              onPress={handleCopyTripId}
            >
              <Text style={[styles.copyBtnText, { color: colors.accent }]}>Copy Trip ID</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.relaySection}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              Relay Connection
            </Text>
            {editRelayUrl ? (
              <View>
                <TextInput
                  style={[styles.relayInput, { backgroundColor: colors.bgSurface, borderColor: colors.border, color: colors.text }]}
                  value={relayUrlInput}
                  onChangeText={setRelayUrlInput}
                  placeholder="http://your-relay:8765/gun"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <View style={styles.relayActions}>
                  <TouchableOpacity
                    style={[styles.relayBtn, { backgroundColor: colors.accent }]}
                    onPress={handleSaveRelayUrl}
                  >
                    <Text style={styles.relayBtnText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.relayBtn, { backgroundColor: colors.bgTertiary }]}
                    onPress={() => setEditRelayUrl(false)}
                  >
                    <Text style={[styles.relayBtnText, { color: colors.text }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.relayDisplay, { backgroundColor: colors.bgSecondary }]}
                onPress={() => { setRelayUrlInput(peerRelayUrl); setEditRelayUrl(true) }}
              >
                <Text style={[styles.relayUrl, { color: colors.text }]} numberOfLines={1}>{peerRelayUrl}</Text>
                <Text style={[styles.relayEdit, { color: colors.accent }]}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      )}

      {mode === 'join' && (
        <View style={styles.joinContainer}>
          {!showManualEntry ? (
            <View style={styles.cameraWrapper}>
              {!permission ? (
                <View style={styles.cameraPlaceholder}>
                  <ActivityIndicator size="small" color={colors.accent} />
                </View>
              ) : !permission.granted ? (
                <View style={styles.cameraPlaceholder}>
                  <Text style={[styles.cameraHint, { color: colors.textSecondary }]}>
                    Camera access needed to scan QR codes
                  </Text>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.accent }]}
                    onPress={requestPermission}
                  >
                    <Text style={styles.actionBtnText}>Grant Permission</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                />
              )}
              {scanned && (
                <TouchableOpacity
                  style={[styles.rescanBtn, { backgroundColor: colors.accent }]}
                  onPress={() => setScanned(false)}
                >
                  <Text style={styles.actionBtnText}>Scan Again</Text>
                </TouchableOpacity>
              )}
              {joining && (
                <View style={styles.joiningOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.joiningText}>Joining trip...</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.manualEntry}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                Enter Trip ID
              </Text>
              <Text style={[styles.sectionHint, { color: colors.textMuted }]}>
                Paste the trip ID shared with you
              </Text>
              <TextInput
                style={[styles.tripIdInput, { backgroundColor: colors.bgSurface, borderColor: colors.border, color: colors.text }]}
                value={manualTripId}
                onChangeText={setManualTripId}
                placeholder="Paste trip ID here"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.accent, opacity: joining ? 0.5 : 1 }]}
                onPress={handleManualJoin}
                disabled={joining}
              >
                <Text style={styles.actionBtnText}>
                  {joining ? 'Joining...' : 'Join Trip'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.toggleEntry, { borderTopColor: colors.divider }]}
            onPress={() => { setShowManualEntry(!showManualEntry); setScanned(false) }}
          >
            <Text style={[styles.toggleEntryText, { color: colors.accent }]}>
              {showManualEntry ? 'Scan QR Code instead' : 'Enter Trip ID manually'}
            </Text>
          </TouchableOpacity>

          <View style={[styles.relayStatus, { backgroundColor: isPeerConnected ? colors.successLight : colors.warningLight }]}>
            <View style={[styles.relayDot, { backgroundColor: isPeerConnected ? colors.success : colors.warning }]} />
            <Text style={[styles.relayText, { color: isPeerConnected ? colors.success : colors.warning }]}>
              {isPeerConnected
                ? `\u25CF Connected to relay`
                : `\u25CF Relay: ${peerRelayUrl}`}
            </Text>
          </View>
        </View>
      )}

      {mode === 'file' && (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.qrSection}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              Export QR Code
            </Text>
            <Text style={[styles.sectionHint, { color: colors.textMuted }]}>
              Full data export (limited to small trips)
            </Text>
            <View style={[styles.qrWrapper, { backgroundColor: colors.bgSurface }, shadows.md]}>
              {isTooLargeForQr ? (
                <View style={styles.qrFallback}>
                  <Text style={{ fontSize: 36, marginBottom: spacing.sm }}>{'\uD83D\uDCC1'}</Text>
                  <Text style={[styles.qrFallbackText, { color: colors.textMuted }]}>
                    Data too large for QR
                  </Text>
                  <Text style={[styles.qrFallbackHint, { color: colors.textTertiary }]}>
                    Use file export instead
                  </Text>
                </View>
              ) : (
                <QRCode
                  value={exportJson}
                  size={200}
                  backgroundColor={colors.bgSurface}
                  color={colors.text}
                />
              )}
            </View>
          </View>

          <View style={styles.exportSection}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>File Export</Text>
            <Text style={[styles.sectionHint, { color: colors.textMuted }]}>
              Share a JSON file with all trip data
            </Text>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.accent }]}
              onPress={handleExportFile}
            >
              <Text style={styles.actionBtnText}>Export as File</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={styles.importSection}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Import from File</Text>
            <Text style={[styles.sectionHint, { color: colors.textMuted }]}>
              Select a JSON file exported from another device
            </Text>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.accent, opacity: importing ? 0.5 : 1 }]}
              onPress={handleImport}
              disabled={importing}
            >
              <Text style={styles.actionBtnText}>
                {importing ? 'Importing...' : 'Select File'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: {
    ...typography.body,
    fontWeight: '600',
  },
  title: {
    ...typography.headline,
    flex: 1,
    textAlign: 'center',
  },
  segment: {
    flexDirection: 'row',
    margin: spacing.lg,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  segmentText: {
    ...typography.subheadBold,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: 100,
  },
  sectionLabel: {
    ...typography.footnoteBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  sectionHint: {
    ...typography.footnote,
    marginBottom: spacing.lg,
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  qrWrapper: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrFallback: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrFallbackText: {
    ...typography.subheadBold,
    textAlign: 'center',
  },
  qrFallbackHint: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  copyBtn: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.md,
  },
  copyBtnText: {
    ...typography.subheadBold,
  },
  relaySection: {
    marginBottom: spacing.xxl,
  },
  relayStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.lg,
  },
  relayDot: {
    width: 6,
    height: 6,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
  },
  relayText: {
    ...typography.footnote,
    fontWeight: '600',
  },
  relayDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  relayUrl: {
    ...typography.caption,
    flex: 1,
    marginRight: spacing.md,
  },
  relayEdit: {
    ...typography.subheadBold,
  },
  relayInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.caption,
  },
  relayActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  relayBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.sm,
  },
  relayBtnText: {
    ...typography.subheadBold,
    color: '#fff',
  },
  // Join tab
  joinContainer: {
    flex: 1,
  },
  cameraWrapper: {
    flex: 1,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    minHeight: 300,
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxxxl,
    backgroundColor: '#000',
  },
  cameraHint: {
    ...typography.callout,
    textAlign: 'center',
    marginBottom: spacing.lg,
    color: '#fff',
  },
  rescanBtn: {
    position: 'absolute',
    bottom: spacing.lg,
    alignSelf: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.md,
  },
  joiningOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  joiningText: {
    color: '#fff',
    ...typography.callout,
    marginTop: spacing.md,
  },
  manualEntry: {
    padding: spacing.xl,
  },
  tripIdInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    marginBottom: spacing.lg,
  },
  toggleEntry: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  toggleEntryText: {
    ...typography.subheadBold,
  },
  // File tab
  exportSection: {
    marginBottom: spacing.xxl,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.xl,
  },
  importSection: {
    marginBottom: spacing.xxl,
  },
  actionBtn: {
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#fff',
    ...typography.headline,
  },
})
