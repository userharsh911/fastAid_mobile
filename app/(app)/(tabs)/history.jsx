import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Animated, useColorScheme } from 'react-native'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'expo-router'
import useUserBear from '../../../store/user.store'
import useVolunteerBear from '../../../store/volunteer.store'
import useThemeBear from '../../../store/theme.store'

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000
const HISTORY_SKELETON_ROWS = [1, 2, 3]

function HistorySkeleton({ colors, isDarkMode }) {
  const pulse = useRef(new Animated.Value(0.55)).current

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 550,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.55,
          duration: 550,
          useNativeDriver: true,
        }),
      ])
    )

    pulseLoop.start()

    return () => {
      pulseLoop.stop()
    }
  }, [pulse])

  return (
    <View className='mb-2'>
      {HISTORY_SKELETON_ROWS.map((item) => (
        <Animated.View
          key={`history-skeleton-${item}`}
          style={{ opacity: pulse, backgroundColor: colors.surface, borderColor: colors.border }}
          className='border rounded-2xl p-4 mb-4'
        >
          <View className='h-5 w-32 mb-3' style={{ backgroundColor: isDarkMode ? '#243246' : '#e5e7eb' }} />
          <View className='h-3 w-40 mb-2' style={{ backgroundColor: isDarkMode ? '#243246' : '#e5e7eb' }} />
          <View className='h-3 w-full mb-2' style={{ backgroundColor: isDarkMode ? '#243246' : '#e5e7eb' }} />
          <View className='h-3 w-4/5 mb-2' style={{ backgroundColor: isDarkMode ? '#243246' : '#e5e7eb' }} />
          <View className='h-10 w-full mt-3' style={{ backgroundColor: isDarkMode ? '#243246' : '#e5e7eb' }} />
        </Animated.View>
      ))}
    </View>
  )
}

const getStatusStyle = (mode, isDarkMode) => {
  if (mode === 'Active') {
    return {
      label: 'Active',
      textColor: isDarkMode ? '#fcd34d' : '#b45309',
      backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7',
    }
  }

  if (mode === 'Alloted') {
    return {
      label: 'Alloted',
      textColor: isDarkMode ? '#93c5fd' : '#1d4ed8',
      backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe',
    }
  }

  if (mode === 'End') {
    return {
      label: 'Completed',
      textColor: isDarkMode ? '#86efac' : '#15803d',
      backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.2)' : '#dcfce7',
    }
  }

  if (mode === 'Cancelled') {
    return {
      label: 'Cancelled',
      textColor: isDarkMode ? '#fca5a5' : '#b91c1c',
      backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
    }
  }

  return {
    label: mode || 'Unknown',
    textColor: isDarkMode ? '#cbd5e1' : '#374151',
    backgroundColor: isDarkMode ? 'rgba(148, 163, 184, 0.2)' : '#f3f4f6',
  }
}

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A'

  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'N/A'

  return date.toLocaleString()
}

const getAgeMeta = (alertItem) => {
  const createdAtMs = new Date(alertItem?.createdAt).getTime()
  if (!Number.isFinite(createdAtMs)) return { ageHours: 0, needsReminder: false, willExpireSoon: false }

  const ageMs = Math.max(0, Date.now() - createdAtMs)
  const ageHours = (ageMs / (60 * 60 * 1000)).toFixed(1)

  return {
    ageHours,
    needsReminder: alertItem?.mode === 'Active' && ageMs >= TWELVE_HOURS_MS && ageMs < TWENTY_FOUR_HOURS_MS,
    willExpireSoon: alertItem?.mode === 'Active' && ageMs >= TWENTY_FOUR_HOURS_MS,
  }
}

const hasVolunteerResponded = (alertItem, volunteerId) => {
  if (!volunteerId || !Array.isArray(alertItem?.volunteers)) return false

  return alertItem.volunteers.some((id) => String(id) === String(volunteerId))
}

const getVolunteerInvolvementMeta = (alertItem, volunteerId, isDarkMode) => {
  const assignedToMeFromServer = Boolean(alertItem?.involvement?.assignedToMe)
  const respondedByMeFromServer = Boolean(alertItem?.involvement?.respondedByMe)
  const assignedVolunteerId = alertItem?.volunteer_id?._id || alertItem?.volunteer_id

  const assignedToMe = assignedToMeFromServer || String(assignedVolunteerId) === String(volunteerId)
  const respondedByMe = respondedByMeFromServer || hasVolunteerResponded(alertItem, volunteerId)

  if (assignedToMe && alertItem?.mode === 'Alloted') {
    return {
      label: 'Assigned To You',
      textColor: isDarkMode ? '#93c5fd' : '#1d4ed8',
      backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe',
      assignedToMe,
      respondedByMe,
    }
  }

  if (assignedToMe && alertItem?.mode === 'End') {
    return {
      label: 'Completed By You',
      textColor: isDarkMode ? '#86efac' : '#15803d',
      backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.2)' : '#dcfce7',
      assignedToMe,
      respondedByMe,
    }
  }

  if (assignedToMe && alertItem?.mode === 'Cancelled') {
    return {
      label: 'Cancelled Assignment',
      textColor: isDarkMode ? '#fca5a5' : '#b91c1c',
      backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
      assignedToMe,
      respondedByMe,
    }
  }

  if (assignedToMe) {
    return {
      label: 'Assigned',
      textColor: isDarkMode ? '#93c5fd' : '#1d4ed8',
      backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe',
      assignedToMe,
      respondedByMe,
    }
  }

  if (respondedByMe) {
    return {
      label: 'Responded',
      textColor: isDarkMode ? '#fcd34d' : '#b45309',
      backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7',
      assignedToMe,
      respondedByMe,
    }
  }

  return {
    label: 'Nearby',
    textColor: isDarkMode ? '#cbd5e1' : '#374151',
    backgroundColor: isDarkMode ? 'rgba(148, 163, 184, 0.2)' : '#f3f4f6',
    assignedToMe,
    respondedByMe,
  }
}

export default function History() {
  const routes = useRouter()
  const [trackingAlertId, setTrackingAlertId] = useState(null)
  const historyInitKeyRef = useRef('')

  const {
    user,
    alertHistory,
    alertHistoryLoader,
    getAlertHistory,
    fetchAlertStatus,
  } = useUserBear((state) => state)

  const {
    volunteer,
    volunteerHistory,
    volunteerHistoryLoader,
    getVolunteerAlertHistory,
  } = useVolunteerBear((state) => state)

  const { themePreference } = useThemeBear((state) => state)
  const systemColorScheme = useColorScheme()

  const resolvedTheme = themePreference === 'system'
    ? (systemColorScheme === 'dark' ? 'dark' : 'light')
    : themePreference
  const isDarkMode = resolvedTheme === 'dark'

  const colors = {
    page: isDarkMode ? '#0b1220' : '#f8fafc',
    surface: isDarkMode ? '#111827' : '#ffffff',
    border: isDarkMode ? '#263244' : '#e5e7eb',
    text: isDarkMode ? '#f8fafc' : '#111827',
    textMuted: isDarkMode ? '#cbd5e1' : '#4b5563',
    textSoft: isDarkMode ? '#94a3b8' : '#6b7280',
    accent: isDarkMode ? '#f87171' : '#dc2626',
    accentSoftBg: isDarkMode ? 'rgba(248, 113, 113, 0.18)' : '#fee2e2',
    accentSoftBorder: isDarkMode ? 'rgba(248, 113, 113, 0.35)' : '#fecaca',
    neutralSurface: isDarkMode ? '#0f172a' : '#ffffff',
  }

  const isInitialHistoryLoading = alertHistoryLoader && (alertHistory?.length || 0) === 0
  const isInitialVolunteerHistoryLoading = volunteerHistoryLoader && (volunteerHistory?.length || 0) === 0

  const volunteerSummary = useMemo(() => {
    const summary = {
      total: 0,
      assigned: 0,
      responded: 0,
      completed: 0,
      active: 0,
    }

    if (!volunteer?._id) return summary

    summary.total = volunteerHistory?.length || 0

    ;(volunteerHistory || []).forEach((alertItem) => {
      const involvementMeta = getVolunteerInvolvementMeta(alertItem, volunteer?._id, isDarkMode)

      if (involvementMeta.assignedToMe) summary.assigned += 1
      if (involvementMeta.respondedByMe) summary.responded += 1
      if (alertItem?.mode === 'End' && (involvementMeta.assignedToMe || involvementMeta.respondedByMe)) summary.completed += 1
      if (alertItem?.mode === 'Active' || alertItem?.mode === 'Alloted') summary.active += 1
    })

    return summary
  }, [volunteer?._id, volunteerHistory, isDarkMode])

  useEffect(() => {
    if (!user?._id || volunteer?._id) return

    const historyInitKey = `${user?._id}:user-history`
    if (historyInitKeyRef.current === historyInitKey) return
    historyInitKeyRef.current = historyInitKey

    const shouldShowSkeleton = (alertHistory?.length || 0) === 0
    getAlertHistory(shouldShowSkeleton).catch(() => {})
  }, [user?._id, volunteer?._id, getAlertHistory, alertHistory?.length])

  useEffect(() => {
    if (!volunteer?._id) return

    const historyInitKey = `${volunteer?._id}:volunteer-history`
    if (historyInitKeyRef.current === historyInitKey) return
    historyInitKeyRef.current = historyInitKey

    const shouldShowSkeleton = (volunteerHistory?.length || 0) === 0
    getVolunteerAlertHistory(shouldShowSkeleton).catch(() => {})
  }, [volunteer?._id, getVolunteerAlertHistory, volunteerHistory?.length])

  const refreshHistory = async () => {
    try {
      if (volunteer?._id) {
        await getVolunteerAlertHistory(true)
        return
      }

      await getAlertHistory(true)
    } catch (error) {
      console.log('error while refreshing history ', error)
    }
  }

  const openAlertTracker = async (alertId) => {
    if (!alertId || trackingAlertId) return

    try {
      setTrackingAlertId(alertId)
      const response = await fetchAlertStatus(alertId, true)
      if (response?.success) {
        routes.push('/(app)/(tabs)/(home)/sendedAlert')
      }
    } catch (error) {
      console.log('error while opening alert tracker ', error)
    } finally {
      setTrackingAlertId(null)
    }
  }

  if (volunteer?._id) {
    return (
      <View className='flex-1' style={{ backgroundColor: colors.page }}>
        <View className='absolute top-0 left-0 right-0 h-1 z-10' style={{ backgroundColor: colors.accent }} />
        <View style={{ position: 'absolute', top: -30, right: -24, width: 150, height: 150, borderRadius: 999, backgroundColor: isDarkMode ? '#1e293b' : '#fee2e2' }} />

        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 52 }}
          showsVerticalScrollIndicator={false}
        >
          <View className='mb-6 border rounded-2xl p-5' style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <Text className='text-3xl font-black tracking-tight' style={{ color: colors.text }}>Volunteer Activity</Text>
            <Text className='text-xs mt-2 font-medium tracking-widest uppercase' style={{ color: colors.textSoft }}>All alerts where you responded or got assigned</Text>
            <View className='self-start mt-3 border px-3 py-2 rounded-full' style={{ backgroundColor: colors.accentSoftBg, borderColor: colors.accentSoftBorder }}>
              <Text className='text-[11px] font-black tracking-widest uppercase' style={{ color: colors.accent }}>Response Timeline</Text>
            </View>
          </View>

          <View className='flex-row gap-3 mb-5'>
            <View className='flex-1 border rounded-2xl p-3' style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <Text className='text-[11px] font-bold tracking-widest uppercase' style={{ color: colors.textSoft }}>Total Alerts</Text>
              <Text className='text-2xl font-black mt-1' style={{ color: colors.text }}>{volunteerSummary.total}</Text>
            </View>
            <View className='flex-1 border rounded-2xl p-3' style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <Text className='text-[11px] font-bold tracking-widest uppercase' style={{ color: colors.textSoft }}>Assigned</Text>
              <Text className='text-2xl font-black mt-1' style={{ color: colors.text }}>{volunteerSummary.assigned}</Text>
            </View>
          </View>

          <View className='flex-row gap-3 mb-5'>
            <View className='flex-1 border rounded-2xl p-3' style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <Text className='text-[11px] font-bold tracking-widest uppercase' style={{ color: colors.textSoft }}>Responded</Text>
              <Text className='text-2xl font-black mt-1' style={{ color: colors.text }}>{volunteerSummary.responded}</Text>
            </View>
            <View className='flex-1 border rounded-2xl p-3' style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <Text className='text-[11px] font-bold tracking-widest uppercase' style={{ color: colors.textSoft }}>Completed</Text>
              <Text className='text-2xl font-black mt-1' style={{ color: colors.text }}>{volunteerSummary.completed}</Text>
            </View>
          </View>

          <TouchableOpacity
            className='border rounded-xl py-3 items-center mb-5'
            style={{ borderColor: colors.accent, backgroundColor: colors.neutralSurface }}
            activeOpacity={0.85}
            disabled={volunteerHistoryLoader}
            onPress={refreshHistory}
          >
            <Text className='font-black text-xs tracking-widest uppercase' style={{ color: colors.accent }}>
              {volunteerHistoryLoader ? 'Refreshing...' : 'Refresh Activity'}
            </Text>
          </TouchableOpacity>

          {isInitialVolunteerHistoryLoading ? <HistorySkeleton colors={colors} isDarkMode={isDarkMode} /> : null}

          {!isInitialVolunteerHistoryLoading && (volunteerHistory?.length || 0) === 0 ? (
            <View className='border rounded-2xl p-5' style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <Text className='text-sm' style={{ color: colors.textMuted }}>You have not responded to any alerts yet.</Text>
            </View>
          ) : (
            volunteerHistory.map((alertItem, index) => {
              const status = getStatusStyle(alertItem?.mode, isDarkMode)
              const involvementMeta = getVolunteerInvolvementMeta(alertItem, volunteer?._id, isDarkMode)
              const userInfo = alertItem?.user_id

              return (
                <View key={alertItem?._id || String(index)} className='border rounded-2xl p-4 mb-4' style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                  <View className='flex-row items-center justify-between'>
                    <Text className='text-lg font-black' style={{ color: colors.text }}>Alert #{index + 1}</Text>
                    <View className='px-3 py-1 rounded-full' style={{ backgroundColor: status.backgroundColor }}>
                      <Text className='text-xs font-black uppercase' style={{ color: status.textColor }}>{status.label}</Text>
                    </View>
                  </View>

                  <Text className='text-xs mt-1' style={{ color: colors.textSoft }}>ID: {alertItem?._id}</Text>
                  <Text className='text-sm mt-2' style={{ color: colors.textMuted }}>User: {userInfo?.fullname || userInfo?.email || 'Unknown'}</Text>
                  <Text className='text-sm mt-1' style={{ color: colors.textMuted }}>Phone: {userInfo?.phone || 'N/A'}</Text>
                  <Text className='text-sm mt-1' style={{ color: colors.textMuted }}>Description: {alertItem?.description || 'N/A'}</Text>
                  <Text className='text-sm mt-1' style={{ color: colors.textMuted }}>Created At: {formatDateTime(alertItem?.createdAt)}</Text>

                  <View className='self-start mt-3 px-3 py-1 rounded-full' style={{ backgroundColor: involvementMeta.backgroundColor }}>
                    <Text className='text-[11px] font-black uppercase' style={{ color: involvementMeta.textColor }}>{involvementMeta.label}</Text>
                  </View>
                </View>
              )
            })
          )}
        </ScrollView>

        <View className='absolute bottom-0 left-0 right-0 h-1' style={{ backgroundColor: colors.accent }} />
      </View>
    )
  }

  return (
    <View className='flex-1' style={{ backgroundColor: colors.page }}>
      <View className='absolute top-0 left-0 right-0 h-1 z-10' style={{ backgroundColor: colors.accent }} />
      <View style={{ position: 'absolute', top: -30, right: -24, width: 150, height: 150, borderRadius: 999, backgroundColor: isDarkMode ? '#1e293b' : '#fee2e2' }} />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 52 }}
        showsVerticalScrollIndicator={false}
      >
        <View className='mb-6 border rounded-2xl p-5' style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <Text className='text-3xl font-black tracking-tight' style={{ color: colors.text }}>Alert History</Text>
          <Text className='text-xs mt-2 font-medium tracking-widest uppercase' style={{ color: colors.textSoft }}>All alerts sent by you</Text>
          <View className='self-start mt-3 border px-3 py-2 rounded-full' style={{ backgroundColor: colors.accentSoftBg, borderColor: colors.accentSoftBorder }}>
            <Text className='text-[11px] font-black tracking-widest uppercase' style={{ color: colors.accent }}>Timeline Overview</Text>
          </View>
        </View>

        <TouchableOpacity
          className='border rounded-xl py-3 items-center mb-5'
          style={{ borderColor: colors.accent, backgroundColor: colors.neutralSurface }}
          activeOpacity={0.85}
          disabled={alertHistoryLoader}
          onPress={refreshHistory}
        >
          <Text className='font-black text-xs tracking-widest uppercase' style={{ color: colors.accent }}>
            {alertHistoryLoader ? 'Refreshing...' : 'Refresh History'}
          </Text>
        </TouchableOpacity>

        {isInitialHistoryLoading ? <HistorySkeleton colors={colors} isDarkMode={isDarkMode} /> : null}

        {!isInitialHistoryLoading && (alertHistory?.length || 0) === 0 ? (
          <View className='border rounded-2xl p-5' style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <Text className='text-sm' style={{ color: colors.textMuted }}>You have not sent any alerts yet.</Text>
          </View>
        ) : (
          alertHistory.map((alertItem, index) => {
            const status = getStatusStyle(alertItem?.mode, isDarkMode)
            const assignedVolunteer = alertItem?.volunteer_id
            const ageMeta = getAgeMeta(alertItem)
            const isTrackingThisAlert = String(trackingAlertId) === String(alertItem?._id)

            return (
              <View key={alertItem?._id || String(index)} className='border rounded-2xl p-4 mb-4' style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                <View className='flex-row items-center justify-between'>
                  <Text className='text-lg font-black' style={{ color: colors.text }}>Alert #{index + 1}</Text>
                  <View className='px-3 py-1 rounded-full' style={{ backgroundColor: status.backgroundColor }}>
                    <Text className='text-xs font-black uppercase' style={{ color: status.textColor }}>{status.label}</Text>
                  </View>
                </View>

                <Text className='text-xs mt-1' style={{ color: colors.textSoft }}>ID: {alertItem?._id}</Text>
                <Text className='text-sm mt-2' style={{ color: colors.textMuted }}>Description: {alertItem?.description || 'N/A'}</Text>
                <Text className='text-sm mt-1' style={{ color: colors.textMuted }}>Created At: {formatDateTime(alertItem?.createdAt)}</Text>
                <Text className='text-sm mt-1' style={{ color: colors.textMuted }}>Age: {ageMeta.ageHours} hours</Text>

                {assignedVolunteer ? (
                  <Text className='text-sm mt-1' style={{ color: colors.textMuted }}>Volunteer: {assignedVolunteer?.email || 'Assigned'}</Text>
                ) : null}

                {ageMeta.needsReminder ? (
                  <Text className='text-xs mt-2 font-semibold' style={{ color: isDarkMode ? '#fcd34d' : '#b45309' }}>
                    Active more than 12h. Please cancel if help is no longer needed.
                  </Text>
                ) : null}

                {ageMeta.willExpireSoon ? (
                  <Text className='text-xs mt-2 font-semibold' style={{ color: isDarkMode ? '#fca5a5' : '#b91c1c' }}>
                    This alert will be auto-cancelled at 24h.
                  </Text>
                ) : null}

                {alertItem?.mode === 'Active' || alertItem?.mode === 'Alloted' ? (
                  <TouchableOpacity
                    className='border rounded-xl py-3 items-center mt-3'
                    style={{ borderColor: colors.accent, backgroundColor: colors.accentSoftBg }}
                    activeOpacity={0.85}
                    disabled={Boolean(trackingAlertId)}
                    onPress={() => openAlertTracker(alertItem?._id)}
                  >
                    <View className='flex-row items-center gap-2'>
                      {isTrackingThisAlert ? <ActivityIndicator color={colors.accent} size='small' /> : null}
                      <Text className='font-black text-xs tracking-widest uppercase' style={{ color: colors.accent }}>
                        {isTrackingThisAlert ? 'Opening...' : 'Track Alert'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ) : null}
              </View>
            )
          })
        )}
      </ScrollView>

      <View className='absolute bottom-0 left-0 right-0 h-1' style={{ backgroundColor: colors.accent }} />
    </View>
  )
}
