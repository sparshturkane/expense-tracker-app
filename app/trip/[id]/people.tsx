import { useState, useMemo } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SectionList,
  Alert,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useExpenseStore } from '../../../src/stores/expenseStore'
import { useTripStore } from '../../../src/stores/tripStore'
import { useThemeColors, spacing, borderRadius, typography } from '../../../src/theme'

export default function PeopleScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const colors = useThemeColors()

  const trip = useTripStore(s => s.trips.find(t => t.id === id))
  const { participantsByTrip, addParticipant, removeParticipant } = useExpenseStore()
  const participants = participantsByTrip[id!] || []

  const [newName, setNewName] = useState('')

  const handleAdd = () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    if (participants.some(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert('Duplicate', 'A participant with that name already exists')
      return
    }
    addParticipant(id!, trimmed)
    setNewName('')
  }

  const handleRemove = (participantId: string, name: string) => {
    Alert.alert('Remove Participant', `Remove ${name}? They may be part of existing expenses.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeParticipant(id!, participantId),
      },
    ])
  }

  const sections = useMemo(() => {
    const sorted = [...participants].sort((a, b) => a.name.localeCompare(b.name))
    const map: Record<string, typeof sorted> = {}
    sorted.forEach(p => {
      const initial = p.name.charAt(0).toUpperCase()
      if (!map[initial]) map[initial] = []
      map[initial].push(p)
    })
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([letter, data]) => ({ title: letter, data }))
  }, [participants])

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.divider, backgroundColor: colors.navBar }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={[styles.headerBack, { color: colors.accent }]}>{'\u2039'} Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          People
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={[styles.addRow, { backgroundColor: colors.bg }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.bgSurface, borderColor: colors.border, color: colors.text }]}
          placeholder="Add participant name"
          placeholderTextColor={colors.textTertiary}
          value={newName}
          onChangeText={setNewName}
          onSubmitEditing={handleAdd}
        />
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.accent }]}
          onPress={handleAdd}
        >
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLetter, { color: colors.textSecondary }]}>{title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={[styles.personRow, { borderBottomColor: colors.divider }]}>
            <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
              <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={[styles.personName, { color: colors.text }]}>{item.name}</Text>
            <TouchableOpacity
              style={[styles.removeBtn, { backgroundColor: colors.errorLight }]}
              onPress={() => handleRemove(item.id, item.name)}
            >
              <Text style={[styles.removeText, { color: colors.error }]}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 48, marginBottom: spacing.lg }}>{'\uD83D\uDC65'}</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No participants yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Add people to split expenses with
            </Text>
          </View>
        }
      />
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
  headerBtn: {
    paddingVertical: spacing.xs,
  },
  headerBack: {
    ...typography.body,
    fontWeight: '600',
  },
  title: {
    ...typography.headline,
    flex: 1,
    textAlign: 'center',
  },
  addRow: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
  },
  addBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#fff',
    ...typography.subheadBold,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxxl,
  },
  sectionHeader: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  sectionLetter: {
    ...typography.title3,
    fontWeight: '800',
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    color: '#fff',
    ...typography.title3,
    fontWeight: '700',
  },
  personName: {
    ...typography.body,
    flex: 1,
  },
  removeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  removeText: {
    ...typography.footnoteBold,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: spacing.xxxxl,
  },
  emptyTitle: {
    ...typography.title2,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.callout,
    textAlign: 'center',
  },
})
