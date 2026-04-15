import { View, Text, ScrollView, TouchableOpacity, Linking, Alert, ActivityIndicator, useColorScheme } from 'react-native'
import React, { useEffect, useState } from 'react'
import * as Location from 'expo-location'
import { useRouter } from 'expo-router'
import useUserBear from '../../../../store/user.store'
import VolunteerRadarSearch from '../../../../components/common/VolunteerRadarSearch'
import useThemeBear from '../../../../store/theme.store'

const normalizePhoneForDialer = (phoneValue) => {
  if (phoneValue === null || phoneValue === undefined) return ''

  const rawValue = String(phoneValue).trim()
  if (!rawValue) return ''

  let decodedValue = rawValue
  try {
    decodedValue = decodeURIComponent(rawValue)
  } catch {
  }

  const cleanedValue = decodedValue.replace(/[^\d+]/g, '')
  if (!cleanedValue) return ''

  if (cleanedValue.startsWith('+')) {
    return `+${cleanedValue.slice(1).replace(/\+/g, '')}`
  }

  return cleanedValue.replace(/\+/g, '')
}

export default function SendedAlert() {
  const routes = useRouter()
  const [sendingAnotherAlert, setSendingAnotherAlert] = useState(false)
  const [alertActionLoading, setAlertActionLoading] = useState(null)
  const [hiringVolunteerId, setHiringVolunteerId] = useState(null)
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
  const {
    nearbyVolunteers,
    latestAlert,
    setSelectedVolunteer,
    clearAlertState,
    fetchAlertStatus,
    alertStatusLoader,
    cancelAlert,
    endAlert,
    hireVolunteer,
    createAlert,
  } = useUserBear(state=>state)

  const allottedVolunteerId = latestAlert?.volunteer_id?._id || latestAlert?.volunteer_id

  useEffect(() => {
    if (!latestAlert?._id) return

    fetchAlertStatus(latestAlert._id, true).catch(() => {})
  }, [latestAlert?._id, fetchAlertStatus])

  const hasVolunteerResponded = (volunteerId) => {
    if (!Array.isArray(latestAlert?.volunteers)) return false

    return latestAlert.volunteers.some((id) => String(id) === String(volunteerId))
  }

  const canHireVolunteer = (volunteerId) => {
    if (latestAlert?.mode === 'Alloted') {
      return String(volunteerId) === String(allottedVolunteerId)
    }

    if (latestAlert?.mode === 'Active') {
      return hasVolunteerResponded(volunteerId)
    }

    return false
  }

  const isClosedAlert = latestAlert?.mode === 'Cancelled' || latestAlert?.mode === 'End'
  const isSearchingVolunteer = latestAlert?.mode === 'Active'

  const alertStatusMeta = (() => {
    if (latestAlert?.mode === 'Alloted') {
      return {
        message: 'Volunteer assigned. You can now open hired volunteer details.',
        textColor: isDarkMode ? '#86efac' : '#15803d',
        backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.2)' : '#dcfce7',
        borderColor: isDarkMode ? 'rgba(34, 197, 94, 0.35)' : '#bbf7d0',
      }
    }

    if (latestAlert?.mode === 'Cancelled') {
      return {
        message: 'This alert is cancelled.',
        textColor: isDarkMode ? '#fca5a5' : '#b91c1c',
        backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
        borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.35)' : '#fecaca',
      }
    }

    if (latestAlert?.mode === 'End') {
      return {
        message: 'This alert is completed successfully.',
        textColor: isDarkMode ? '#86efac' : '#15803d',
        backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.2)' : '#dcfce7',
        borderColor: isDarkMode ? 'rgba(34, 197, 94, 0.35)' : '#bbf7d0',
      }
    }

    return {
      message: "Waiting for any volunteer to click I'm In.",
      textColor: isDarkMode ? '#fcd34d' : '#b45309',
      backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7',
      borderColor: isDarkMode ? 'rgba(245, 158, 11, 0.35)' : '#fde68a',
    }
  })()

  const getVolunteerAction = (volunteerId) => {
    if (latestAlert?.mode === 'Cancelled') {
      return { enabled: false, label: 'Cancelled', className: 'bg-gray-300' }
    }

    if (latestAlert?.mode === 'End') {
      return { enabled: false, label: 'Completed', className: 'bg-green-600' }
    }

    if (latestAlert?.mode !== 'Alloted') {
      const isResponded = hasVolunteerResponded(volunteerId)
      if (latestAlert?.mode === 'Active' && isResponded) {
        return { enabled: true, label: 'Hire', className: 'bg-red-600' }
      }

      return { enabled: false, label: 'Waiting', className: 'bg-gray-300' }
    }

    if (String(volunteerId) === String(allottedVolunteerId)) {
      return { enabled: true, label: 'View', className: 'bg-red-600' }
    }

    return { enabled: false, label: 'Hired', className: 'bg-gray-300' }
  }

  const hireVolunteerHandler = (volunteer) => {
    if (!canHireVolunteer(volunteer?._id)) return

    if (latestAlert?.mode === 'Alloted') {
      setSelectedVolunteer(volunteer)
      routes.push('/(app)/(tabs)/(home)/hireVolunteer')
      return
    }

    Alert.alert('Hire Volunteer', 'Are you sure you want to hire this volunteer?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Hire',
        onPress: async () => {
          try {
            setHiringVolunteerId(volunteer?._id)
            const response = await hireVolunteer(latestAlert?._id, volunteer?._id)

            if (response?.success) {
              const hiredVolunteer = response?.alert?.volunteer_id || volunteer
              setSelectedVolunteer(hiredVolunteer)
              Alert.alert('Hired', 'Volunteer hired successfully.')
              routes.push('/(app)/(tabs)/(home)/hireVolunteer')
            }
          } catch (error) {
            Alert.alert('Error', error?.message || 'Unable to hire volunteer')
          } finally {
            setHiringVolunteerId(null)
          }
        },
      },
    ])
  }

  const callVolunteerHandler = async (phone) => {
    const normalizedPhone = normalizePhoneForDialer(phone)
    if (!normalizedPhone) {
      Alert.alert('Phone unavailable', 'Volunteer phone number is not valid.')
      return
    }

    const phoneUrl = `tel:${normalizedPhone}`

    try {
      await Linking.openURL(phoneUrl)
    } catch {
      Alert.alert('Call failed', 'Unable to open phone dialer right now.')
    }
  }

  const getVolunteerDisplayName = (volunteer, index) => {
    const name = volunteer?.fullname?.trim()
    if (name) return name

    const email = volunteer?.email?.trim()
    if (email) {
      const localPart = email.split('@')[0]?.trim()
      if (localPart) return localPart
    }

    return `Volunteer ${index + 1}`
  }

  const sendAnotherAlertHandler = async () => {
    if (sendingAnotherAlert || alertActionLoading) return

    if (!latestAlert?._id) {
      clearAlertState()
      routes.replace('/(app)/(tabs)/(home)')
      return
    }

    const previousDescription = latestAlert?.description?.trim()
    const shouldCancelCurrentAlert = latestAlert?.mode === 'Active'

    try {
      setSendingAnotherAlert(true)

      if (shouldCancelCurrentAlert) {
        const cancelResponse = await cancelAlert(latestAlert._id)
        if (!cancelResponse?.success) {
          Alert.alert('Error', 'Unable to cancel current alert')
          return
        }
      }

      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Location permission is required to send another alert.')
        return
      }

      const currentLocation = await Location.getCurrentPositionAsync({})
      const latitude = currentLocation?.coords?.latitude
      const longitude = currentLocation?.coords?.longitude

      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        Alert.alert('Location error', 'Unable to fetch your location right now.')
        return
      }

      const response = await createAlert({
        description: previousDescription || undefined,
        coordinates: { latitude, longitude },
      })

      if (response?.success) {
        Alert.alert('New Alert Sent', 'Another alert has been sent successfully.')
      }
    } catch (error) {
      Alert.alert('Error', error?.message || 'Unable to send another alert')
    } finally {
      setSendingAnotherAlert(false)
    }
  }

  const cancelAlertHandler = () => {
    if (!latestAlert?._id || isClosedAlert || alertActionLoading || sendingAnotherAlert) return

    Alert.alert('Cancel Alert', 'Are you sure you want to cancel this alert?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            setAlertActionLoading('cancel')
            const response = await cancelAlert(latestAlert._id)
            if (response?.success) {
              Alert.alert('Cancelled', 'Alert has been cancelled successfully.')
              clearAlertState()
              routes.replace('/(app)/(tabs)/(home)')
            }
          } catch (error) {
            Alert.alert('Error', error?.message || 'Unable to cancel alert')
          } finally {
            setAlertActionLoading(null)
          }
        },
      },
    ])
  }

  const endAlertHandler = () => {
    if (!latestAlert?._id || latestAlert?.mode !== 'Alloted' || alertActionLoading || sendingAnotherAlert) return

    Alert.alert('Work Completed', 'Confirm that volunteer reached and your work is done?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Completed',
        onPress: async () => {
          try {
            setAlertActionLoading('end')
            const response = await endAlert(latestAlert._id)
            if (response?.success) {
              Alert.alert('Completed', 'Alert marked as completed successfully.')
              clearAlertState()
              routes.replace('/(app)/(tabs)/(home)')
            }
          } catch (error) {
            Alert.alert('Error', error?.message || 'Unable to complete alert')
          } finally {
            setAlertActionLoading(null)
          }
        },
      },
    ])
  }

  return (
    <View className='flex-1' style={{ backgroundColor: colors.page }}>
      <View className='absolute top-0 left-0 right-0 h-1 z-10' style={{ backgroundColor: colors.accent }} />
      <View
        style={{
          position: 'absolute',
          top: -40,
          right: -20,
          width: 170,
          height: 170,
          borderRadius: 999,
          backgroundColor: isDarkMode ? '#1e293b' : '#fee2e2',
        }}
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 52 }}
        showsVerticalScrollIndicator={false}
      >
        <View className='mb-6 border rounded-2xl p-5' style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <Text className='text-3xl font-black tracking-tight' style={{ color: colors.text }}>Alert Sent</Text>
          <Text className='text-xs mt-2 font-medium tracking-widest uppercase' style={{ color: colors.textSoft }}>
            Nearby volunteers who can help
          </Text>

          <Text
            className='text-sm mt-3 font-semibold rounded-xl px-3 py-2 border'
            style={{
              color: alertStatusMeta.textColor,
              backgroundColor: alertStatusMeta.backgroundColor,
              borderColor: alertStatusMeta.borderColor,
            }}
          >
            {alertStatusMeta.message}
          </Text>

          <Text className='text-sm mt-4' style={{ color: colors.textMuted }}>
            Total nearby volunteers: {nearbyVolunteers?.length || 0}
          </Text>
          {
            latestAlert?._id ? (
              <Text className='text-xs mt-1' style={{ color: colors.textSoft }}>Alert ID: {latestAlert._id}</Text>
            ) : null
          }
        </View>

        {
          isSearchingVolunteer ? (
            <View className='border rounded-2xl p-5 mb-6' style={{ borderColor: colors.accentSoftBorder, backgroundColor: colors.accentSoftBg }}>
              <VolunteerRadarSearch
                size={165}
                title='Finding Nearby Volunteers'
                subtitle={`Live scan in 500m range • Found: ${nearbyVolunteers?.length || 0}`}
              />
            </View>
          ) : null
        }

        {
          (nearbyVolunteers?.length || 0) === 0 ? (
            <View className='border rounded-2xl p-5' style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <Text className='text-sm' style={{ color: colors.textMuted }}>No nearby volunteers found right now.</Text>
              <Text className='text-xs mt-2' style={{ color: colors.textSoft }}>Try sending alert again after a while.</Text>
            </View>
          ) : (
            nearbyVolunteers.map((volunteer, index) => {
              const longitude = volunteer?.location?.coordinates?.[0]
              const latitude = volunteer?.location?.coordinates?.[1]
              const volunteerAction = getVolunteerAction(volunteer?._id)
              const isHiringThisVolunteer = String(hiringVolunteerId) === String(volunteer?._id)

              return (
                <View key={volunteer?._id || String(index)} className='border rounded-2xl p-4 mb-4' style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                  <Text className='text-lg font-black' style={{ color: colors.text }}>{getVolunteerDisplayName(volunteer, index)}</Text>
                  <Text className='text-sm mt-2' style={{ color: colors.textMuted }}>Email: {volunteer?.email || 'N/A'}</Text>
                  <Text className='text-sm mt-1' style={{ color: colors.textMuted }}>Phone: {volunteer?.phone || 'N/A'}</Text>
                  <Text className='text-sm mt-1' style={{ color: colors.textMuted }}>Mode: {volunteer?.mode || 'N/A'}</Text>
                  <Text className='text-xs mt-2' style={{ color: colors.textSoft }}>
                    Lat: {typeof latitude === 'number' ? latitude.toFixed(6) : 'N/A'} | Lng: {typeof longitude === 'number' ? longitude.toFixed(6) : 'N/A'}
                  </Text>

                  <View className='flex-row gap-3 mt-4'>
                    <TouchableOpacity
                      className='flex-1 border rounded-xl py-3 items-center'
                      style={{ borderColor: colors.neutralBorder, backgroundColor: colors.neutralSurface }}
                      activeOpacity={0.8}
                      onPress={() => callVolunteerHandler(volunteer?.phone)}
                    >
                      <Text className='font-black text-xs tracking-widest uppercase' style={{ color: colors.text }}>Call</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className={`flex-1 py-3 items-center rounded-xl ${volunteerAction.className}`}
                      activeOpacity={0.85}
                      disabled={!volunteerAction.enabled || Boolean(hiringVolunteerId) || Boolean(alertActionLoading) || sendingAnotherAlert}
                      onPress={() => hireVolunteerHandler(volunteer)}
                    >
                      <View className='flex-row items-center gap-2'>
                        {isHiringThisVolunteer ? <ActivityIndicator color='#fff' size='small' /> : null}
                        <Text className='text-white font-black text-xs tracking-widest uppercase'>
                          {isHiringThisVolunteer ? 'Hiring...' : volunteerAction.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              )
            })
          )
        }

        {
          !isClosedAlert && latestAlert?._id ? (
            <TouchableOpacity
              className='border py-4 items-center rounded-xl mt-2'
              style={{
                borderColor: colors.accent,
                backgroundColor: alertActionLoading === 'cancel' ? colors.accentSoftBg : colors.neutralSurface,
              }}
              activeOpacity={0.85}
              disabled={Boolean(alertActionLoading) || sendingAnotherAlert}
              onPress={cancelAlertHandler}
            >
              <View className='flex-row items-center gap-2'>
                {alertActionLoading === 'cancel' ? <ActivityIndicator color={colors.accent} size='small' /> : null}
                <Text className='font-black text-sm tracking-widest uppercase' style={{ color: colors.accent }}>
                  {alertActionLoading === 'cancel' ? 'Cancelling...' : 'Cancel Alert'}
                </Text>
              </View>
            </TouchableOpacity>
          ) : null
        }

        {
          latestAlert?.mode === 'Alloted' ? (
            <TouchableOpacity
              className={`py-4 items-center rounded-xl mt-3 ${alertActionLoading === 'end' ? 'bg-green-400' : 'bg-green-600'}`}
              activeOpacity={0.85}
              disabled={Boolean(alertActionLoading) || sendingAnotherAlert}
              onPress={endAlertHandler}
            >
              <View className='flex-row items-center gap-2'>
                {alertActionLoading === 'end' ? <ActivityIndicator color='#fff' size='small' /> : null}
                <Text className='text-white font-black text-sm tracking-widest uppercase'>
                  {alertActionLoading === 'end' ? 'Completing...' : 'Work Completed'}
                </Text>
              </View>
            </TouchableOpacity>
          ) : null
        }

        {
          latestAlert?._id && latestAlert?.mode !== 'Alloted' ? (
            <TouchableOpacity
              className='border rounded-xl py-4 items-center mt-2'
              style={{ borderColor: colors.accent, backgroundColor: colors.neutralSurface }}
              activeOpacity={0.85}
              disabled={alertStatusLoader || sendingAnotherAlert || Boolean(alertActionLoading)}
              onPress={sendAnotherAlertHandler}
            >
              <Text className='font-black text-sm tracking-widest uppercase' style={{ color: colors.accent }}>
                {sendingAnotherAlert
                  ? 'Sending New Alert...'
                  : (latestAlert?.mode === 'Active' ? 'Cancel & Send Another Alert' : 'Send Another Alert')}
              </Text>
            </TouchableOpacity>
          ) : null
        }
      </ScrollView>

      <View className='absolute bottom-0 left-0 right-0 h-1' style={{ backgroundColor: colors.accent }} />
    </View>
  )
}