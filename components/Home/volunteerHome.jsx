import { View, Text, ScrollView, TouchableOpacity, Linking, Alert, ActivityIndicator, useColorScheme } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import useVolunteerBear from '../../store/volunteer.store'
import useThemeBear from '../../store/theme.store'
import EmergencyLoader from '../common/EmergencyLoader'

const getModeBadgeStyle = (mode, isDarkMode) => {
  if (mode === 'Alloted') {
    return {
      label: 'Assigned',
      textColor: isDarkMode ? '#6ee7b7' : '#15803d',
      backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.18)' : '#dcfce7',
    }
  }

  if (mode === 'Active') {
    return {
      label: 'Open',
      textColor: isDarkMode ? '#fcd34d' : '#b45309',
      backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7',
    }
  }

  if (mode === 'End') {
    return {
      label: 'Completed',
      textColor: isDarkMode ? '#93c5fd' : '#1d4ed8',
      backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe',
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

export default function VolunteerHome() {
  const routes = useRouter()
  const [refreshingAlerts, setRefreshingAlerts] = useState(false)
  const [processingAlertId, setProcessingAlertId] = useState(null)
  const [processingActionType, setProcessingActionType] = useState(null)

  const {
    volunteer,
    volunteerAlerts,
    volunteerAlertsLoader,
    getVolunteerNearbyAlerts,
    respondToAlert,
    cancelVolunteerAlert,
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
    neutralBorder: isDarkMode ? '#334155' : '#d1d5db',
  }

  const myAllotedAlert = volunteerAlerts.find(
    (alert) => String(alert?.volunteer_id?._id || alert?.volunteer_id) === String(volunteer?._id) && alert?.mode === 'Alloted'
  )

  const isAnyAlertActionInProgress = Boolean(processingActionType)

  const refreshNearbyAlerts = useCallback(async () => {
    try {
      setRefreshingAlerts(true)
      await getVolunteerNearbyAlerts()
    } catch (error) {
      console.log('error while refreshing volunteer alerts ', error)
    } finally {
      setRefreshingAlerts(false)
    }
  }, [getVolunteerNearbyAlerts])

  useEffect(() => {
    refreshNearbyAlerts()
  }, [refreshNearbyAlerts])

  const handleImIn = async (alertId) => {
    if (!alertId || isAnyAlertActionInProgress) return

    try {
      setProcessingAlertId(alertId)
      setProcessingActionType('select')

      const response = await respondToAlert(alertId)
      if (response?.success) {
        Alert.alert('Success', response?.message || 'Response sent. Waiting for user to hire.')
        await getVolunteerNearbyAlerts()
      }
    } catch (error) {
      Alert.alert('Error', error?.message || 'Alert is not available anymore')
      await getVolunteerNearbyAlerts()
    } finally {
      setProcessingAlertId(null)
      setProcessingActionType(null)
    }
  }

  const handleCancelAlert = (alertId) => {
    if (!alertId || isAnyAlertActionInProgress) return

    Alert.alert('Cancel Alert', 'Are you sure you want to cancel this alert?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            setProcessingAlertId(alertId)
            setProcessingActionType('cancel')

            const response = await cancelVolunteerAlert(alertId)
            if (response?.success) {
              Alert.alert('Cancelled', 'Alert has been cancelled.')
              await getVolunteerNearbyAlerts()
            }
          } catch (error) {
            Alert.alert('Error', error?.message || 'Unable to cancel this alert')
            await getVolunteerNearbyAlerts()
          } finally {
            setProcessingAlertId(null)
            setProcessingActionType(null)
          }
        },
      },
    ])
  }

  const callUser = async (phone) => {
    if (!phone) return
    const url = `tel:${phone}`
    const canOpen = await Linking.canOpenURL(url)
    if (canOpen) {
      Linking.openURL(url)
    }
  }

  const openUserLocationMap = (alertItem) => {
    const longitude = alertItem?.location?.coordinates?.[0]
    const latitude = alertItem?.location?.coordinates?.[1]

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      Alert.alert('Location error', 'User location is not available for this alert.')
      return
    }

    const userName = alertItem?.user_id?.fullname || alertItem?.user_id?.email || 'User'
    const phone = alertItem?.user_id?.phone || ''
    const description = alertItem?.description || ''

    routes.push(`/(app)/(tabs)/(home)/alertMap?lat=${latitude}&lng=${longitude}&name=${encodeURIComponent(userName)}&phone=${encodeURIComponent(String(phone))}&description=${encodeURIComponent(description)}&alertId=${alertItem?._id}`)
  }

  return (
    <View className='flex-1' style={{ backgroundColor: colors.page }}>
      <View className='absolute top-0 left-0 right-0 h-1 z-10' style={{ backgroundColor: colors.accent }} />
      <View style={{ position: 'absolute', top: -38, right: -20, width: 160, height: 160, borderRadius: 999, backgroundColor: isDarkMode ? '#1e293b' : '#fee2e2' }} />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 52 }}
        showsVerticalScrollIndicator={false}
      >
        <View className='mb-6 border rounded-2xl p-5' style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <Text className='text-3xl font-black tracking-tight' style={{ color: colors.text }}>Volunteer Alerts</Text>
          <Text className='text-xs mt-2 font-medium tracking-widest uppercase' style={{ color: colors.textSoft }}>
            Active alerts within 500 meters
          </Text>
          <Text className='text-sm mt-4' style={{ color: colors.textMuted }}>
            Logged in as: {volunteer?.email || 'Volunteer'}
          </Text>
          <View className='self-start mt-3 border px-3 py-2 rounded-full' style={{ backgroundColor: colors.accentSoftBg, borderColor: colors.accentSoftBorder }}>
            <Text className='text-[11px] font-black tracking-widest uppercase' style={{ color: colors.accent }}>Live Response Feed</Text>
          </View>
        </View>

        <TouchableOpacity
          className='border rounded-xl py-3 items-center mb-5'
          style={{ borderColor: colors.accent, backgroundColor: colors.neutralSurface }}
          activeOpacity={0.85}
          disabled={refreshingAlerts || isAnyAlertActionInProgress}
          onPress={refreshNearbyAlerts}
        >
          <Text className='font-black text-xs tracking-widest uppercase' style={{ color: colors.accent }}>
            {refreshingAlerts ? 'Refreshing...' : 'Refresh Nearby Alerts'}
          </Text>
        </TouchableOpacity>

        {volunteerAlertsLoader && (volunteerAlerts?.length || 0) === 0 ? (
          <View className='mb-4'>
            <EmergencyLoader size='default' label='Fetching nearby alerts' />
          </View>
        ) : null}

        {(volunteerAlerts?.length || 0) === 0 ? (
          <View className='border rounded-2xl p-5' style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <Text className='text-sm' style={{ color: colors.textMuted }}>No active alerts around your current location.</Text>
            <Text className='text-xs mt-2' style={{ color: colors.textSoft }}>Keep this app open to receive new alerts instantly.</Text>
          </View>
        ) : (
          volunteerAlerts.map((alertItem, index) => {
            const userInfo = alertItem?.user_id
            const isAllotedForMe = String(alertItem?.volunteer_id?._id || alertItem?.volunteer_id) === String(volunteer?._id)
            const hasRespondedByMe = Array.isArray(alertItem?.volunteers)
              ? alertItem.volunteers.some((id) => String(id) === String(volunteer?._id))
              : false
            const canSelect = alertItem?.mode === 'Active' && !myAllotedAlert && !hasRespondedByMe
            const isSelectingThisAlert = processingActionType === 'select' && String(processingAlertId) === String(alertItem?._id)
            const isCancellingThisAlert = processingActionType === 'cancel' && String(processingAlertId) === String(alertItem?._id)
            const longitude = alertItem?.location?.coordinates?.[0]
            const latitude = alertItem?.location?.coordinates?.[1]
            const modeBadge = getModeBadgeStyle(alertItem?.mode, isDarkMode)

            return (
              <View key={alertItem?._id || String(index)} className='border rounded-2xl p-4 mb-4' style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                <View className='flex-row items-center justify-between'>
                  <Text className='text-lg font-black' style={{ color: colors.text }}>Alert #{index + 1}</Text>
                  <View className='px-3 py-1 rounded-full' style={{ backgroundColor: modeBadge.backgroundColor }}>
                    <Text className='text-[11px] font-black uppercase' style={{ color: modeBadge.textColor }}>{modeBadge.label}</Text>
                  </View>
                </View>
                <Text className='text-xs mt-1' style={{ color: colors.textSoft }}>ID: {alertItem?._id}</Text>
                <Text className='text-sm mt-2' style={{ color: colors.textMuted }}>User: {userInfo?.fullname || userInfo?.email || 'Unknown'}</Text>
                <Text className='text-sm mt-1' style={{ color: colors.textMuted }}>User Phone: {userInfo?.phone || 'N/A'}</Text>
                <Text className='text-sm mt-1' style={{ color: colors.textMuted }}>Description: {alertItem?.description || 'N/A'}</Text>
                <Text className='text-xs mt-2' style={{ color: colors.textSoft }}>
                  Lat: {typeof latitude === 'number' ? latitude.toFixed(6) : 'N/A'} | Lng: {typeof longitude === 'number' ? longitude.toFixed(6) : 'N/A'}
                </Text>

                <View className='flex-row gap-3 mt-4'>
                  <TouchableOpacity
                    className='flex-1 border rounded-xl py-3 items-center'
                    style={{ borderColor: colors.neutralBorder, backgroundColor: colors.neutralSurface }}
                    activeOpacity={0.8}
                    onPress={() => callUser(userInfo?.phone)}
                  >
                    <Text className='font-black text-xs tracking-widest uppercase' style={{ color: colors.text }}>Call User</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className={`flex-1 py-3 items-center rounded-xl ${canSelect ? 'bg-red-600' : (isAllotedForMe ? 'bg-green-600' : (hasRespondedByMe ? 'bg-amber-500' : 'bg-gray-300'))}`}
                    activeOpacity={0.85}
                    disabled={!canSelect || isAnyAlertActionInProgress}
                    onPress={() => handleImIn(alertItem?._id)}
                  >
                    <View className='flex-row items-center gap-2'>
                      {isSelectingThisAlert ? <ActivityIndicator color='#fff' size='small' /> : null}
                      <Text className='text-white font-black text-xs tracking-widest uppercase'>
                        {isSelectingThisAlert
                          ? 'Processing...'
                          : (canSelect ? "I'm In" : (isAllotedForMe ? 'Assigned To You' : (hasRespondedByMe ? 'Waiting User' : (myAllotedAlert ? 'Already Assigned' : 'Assigned'))))}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  className='border rounded-xl py-3 items-center mt-3'
                  style={{ borderColor: colors.accent, backgroundColor: colors.accentSoftBg }}
                  activeOpacity={0.85}
                  onPress={() => openUserLocationMap(alertItem)}
                >
                  <Text className='font-black text-xs tracking-widest uppercase' style={{ color: colors.accent }}>View User Map</Text>
                </TouchableOpacity>

                {isAllotedForMe && alertItem?.mode === 'Alloted' ? (
                  <TouchableOpacity
                    className='border rounded-xl py-3 items-center mt-3'
                    style={{ borderColor: colors.accent, backgroundColor: colors.accentSoftBg }}
                    activeOpacity={0.85}
                    disabled={isAnyAlertActionInProgress}
                    onPress={() => handleCancelAlert(alertItem?._id)}
                  >
                    <View className='flex-row items-center gap-2'>
                      {isCancellingThisAlert ? <ActivityIndicator color={colors.accent} size='small' /> : null}
                      <Text className='font-black text-xs tracking-widest uppercase' style={{ color: colors.accent }}>
                        {isCancellingThisAlert ? 'Cancelling...' : 'Cancel Alert'}
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
