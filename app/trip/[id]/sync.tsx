import { useState, useMemo } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
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
import { useThemeColors, spacing, borderRadius, typography, shadows } from '../../../src/theme'

type SyncMode = 'export' | 'import_file'

export default function SyncScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const colors = useThemeColors()
  const [mode, setMode] = useState<SyncMode>('export')
  const [importing, setImporting] = useState(false)

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

      Alert.alert(
        'Import Complete',
        `Merged ${importData.trips.length} trip(s) and ${Object.values(importData.expenses).flat().length} expense(s)`
      )
      router.back()
    } catch (e) {
      Alert.alert('Import Failed', String(e))
    } finally {
      setImporting(false)
    }
  }

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
        <TouchableOpacity
          style={[styles.segmentBtn, mode === 'export' && { backgroundColor: colors.bgSurface }, mode === 'export' && shadows.sm]}
          onPress={() => setMode('export')}
        >
          <Text style={[styles.segmentText, { color: colors.textMuted }, mode === 'export' && { color: colors.accent }]}>
            Export
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, mode === 'import_file' && { backgroundColor: colors.bgSurface }, mode === 'import_file' && shadows.sm]}
          onPress={() => setMode('import_file')}
        >
          <Text style={[styles.segmentText, { color: colors.textMuted }, mode === 'import_file' && { color: colors.accent }]}>
            Import
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'export' && (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.qrSection}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              QR Code
            </Text>
            <Text style={[styles.sectionHint, { color: colors.textMuted }]}>
              Others can scan this QR to import trip data
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
              Share or save a JSON file with all trip data
            </Text>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.accent }]}
              onPress={handleExportFile}
            >
              <Text style={styles.actionBtnText}>Export as File</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {mode === 'import_file' && (
        <View style={styles.center}>
          <View style={[styles.importIcon, { backgroundColor: colors.accentLight }]}>
            <Text style={{ fontSize: 36 }}>{'\uD83D\uDCC2'}</Text>
          </View>
          <Text style={[styles.importTitle, { color: colors.text }]}>Import from File</Text>
          <Text style={[styles.importText, { color: colors.textSecondary }]}>
            Select a JSON file exported from another device to merge trip data
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
  exportSection: {
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxxxl,
  },
  importIcon: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  importTitle: {
    ...typography.title2,
    marginBottom: spacing.sm,
  },
  importText: {
    ...typography.callout,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    lineHeight: 22,
  },
})
