import { View, Text, TouchableOpacity, Linking, Alert, ScrollView, ActivityIndicator, useColorScheme } from 'react-native'
import React, { useState } from 'react'
import { useRouter } from 'expo-router'
import OpenStreetMapView from '../../../../components/common/OpenStreetMapView'
import useUserBear from '../../../../store/user.store'
import useThemeBear from '../../../../store/theme.store'

export default function HireVolunteer() {
  const routes = useRouter()
  const [completingWork, setCompletingWork] = useState(false)
  const { selectedVolunteer, latestAlert, endAlert, clearAlertState } = useUserBear(state=>state)
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

  const longitude = selectedVolunteer?.location?.coordinates?.[0]
  const latitude = selectedVolunteer?.location?.coordinates?.[1]
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude)

  const callVolunteerHandler = async () => {
    if (!selectedVolunteer?.phone) return
    const phoneUrl = `tel:${selectedVolunteer.phone}`
    const canOpen = await Linking.canOpenURL(phoneUrl)
    if (canOpen) {
      Linking.openURL(phoneUrl)
    }
  }

  const openInMapsHandler = async () => {
    if (!hasCoordinates) return

    const googleAppUrl = `comgooglemaps://?q=${latitude},${longitude}`
    const googleWebUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`

    const canOpenGoogleApp = await Linking.canOpenURL(googleAppUrl)
    if (canOpenGoogleApp) {
      Linking.openURL(googleAppUrl)
      return
    }

    const canOpenGoogleWeb = await Linking.canOpenURL(googleWebUrl)
    if (canOpenGoogleWeb) {
      Linking.openURL(googleWebUrl)
      return
    }

    const mapLabel = encodeURIComponent('Volunteer Location')
    const nativeMapUrl = `geo:${latitude},${longitude}?q=${latitude},${longitude}(${mapLabel})`
    const fallbackMapUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`

    const canOpenNativeMap = await Linking.canOpenURL(nativeMapUrl)
    if (canOpenNativeMap) {
      Linking.openURL(nativeMapUrl)
      return
    }

    const canOpenFallback = await Linking.canOpenURL(fallbackMapUrl)
    if (canOpenFallback) {
      Linking.openURL(fallbackMapUrl)
    }
  }

  const markWorkCompletedHandler = () => {
    if (!latestAlert?._id || completingWork) return

    Alert.alert('Work Completed', 'Confirm volunteer reached and your work is done?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Completed',
        onPress: async () => {
          try {
            setCompletingWork(true)
            const response = await endAlert(latestAlert._id)
            if (response?.success) {
              Alert.alert('Completed', 'Alert marked as completed successfully.')
              clearAlertState()
              routes.replace('/(app)/(tabs)/(home)')
            }
          } catch (error) {
            Alert.alert('Error', error?.message || 'Unable to complete alert')
          } finally {
            setCompletingWork(false)
          }
        },
      },
    ])
  }

  if (!selectedVolunteer) {
    return (
      <View className='flex-1 px-6 justify-center' style={{ backgroundColor: colors.page }}>
        <Text className='text-2xl font-black' style={{ color: colors.text }}>No Volunteer Selected</Text>
        <Text className='text-sm mt-2' style={{ color: colors.textSoft }}>Please go back and select a volunteer first.</Text>
        <TouchableOpacity
          className='mt-6 bg-red-600 rounded-xl py-4 items-center'
          activeOpacity={0.85}
          onPress={() => routes.replace('/(app)/(tabs)/(home)/sendedAlert')}
        >
          <Text className='text-white font-black text-sm tracking-widest uppercase'>Back</Text>
        </TouchableOpacity>
      </View>
    )
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
        contentContainerStyle={{ paddingBottom: 56 }}
        showsVerticalScrollIndicator={false}
      >

      <View className='px-6 pt-14 pb-4'>
        <Text className='text-3xl font-black' style={{ color: colors.text }}>Hire Volunteer</Text>
        <Text className='text-xs mt-2 font-medium tracking-widest uppercase' style={{ color: colors.textSoft }}>
          Volunteer details and live location
        </Text>
      </View>

      <View className='px-6'>
        <View className='border rounded-2xl p-4' style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <Text className='text-sm' style={{ color: colors.textMuted }}>Email: {selectedVolunteer?.email || 'N/A'}</Text>
          <Text className='text-sm mt-1' style={{ color: colors.textMuted }}>Phone: {selectedVolunteer?.phone || 'N/A'}</Text>
          <Text className='text-sm mt-1' style={{ color: colors.textMuted }}>Mode: {selectedVolunteer?.mode || 'N/A'}</Text>
          <Text className='text-xs mt-2' style={{ color: colors.textSoft }}>
            Lat: {hasCoordinates ? latitude.toFixed(6) : 'N/A'} | Lng: {hasCoordinates ? longitude.toFixed(6) : 'N/A'}
          </Text>
        </View>
      </View>

      <View className='px-6 mt-4'>
        {
          hasCoordinates ? (
            <View className='overflow-hidden rounded-2xl'>
              <OpenStreetMapView
                height={280}
                center={{ latitude, longitude }}
                coordinate={{ latitude, longitude }}
                interactive={false}
              />
            </View>
          ) : (
            <View className='border rounded-2xl py-10 px-4 items-center' style={{ borderColor: colors.border, backgroundColor: colors.surface }}>
              <Text className='text-sm' style={{ color: colors.textSoft }}>Location is not available for this volunteer.</Text>
            </View>
          )
        }
      </View>

      <View className='px-6 mt-4 flex-row gap-3'>
        <TouchableOpacity
          className='flex-1 border rounded-xl py-4 items-center'
          style={{ borderColor: colors.neutralBorder, backgroundColor: colors.neutralSurface }}
          activeOpacity={0.8}
          onPress={callVolunteerHandler}
        >
          <Text className='font-black text-xs tracking-widest uppercase' style={{ color: colors.text }}>Call Volunteer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className='flex-1 bg-red-600 rounded-xl py-4 items-center'
          activeOpacity={0.85}
          onPress={openInMapsHandler}
        >
          <Text className='text-white font-black text-xs tracking-widest uppercase'>Open Google Maps</Text>
        </TouchableOpacity>
      </View>

      <View className='px-6 mt-3'>
        <TouchableOpacity
          className={`py-4 items-center rounded-xl ${completingWork ? 'bg-green-400' : 'bg-green-600'}`}
          activeOpacity={0.85}
          disabled={completingWork}
          onPress={markWorkCompletedHandler}
        >
          <View className='flex-row items-center gap-2'>
            {completingWork ? <ActivityIndicator color='#fff' size='small' /> : null}
            <Text className='text-white font-black text-xs tracking-widest uppercase'>
              {completingWork ? 'Completing...' : 'Work Completed'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      </ScrollView>

      <View className='absolute bottom-0 left-0 right-0 h-1' style={{ backgroundColor: colors.accent }} />
    </View>
  )
}