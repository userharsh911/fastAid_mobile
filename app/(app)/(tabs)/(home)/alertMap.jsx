import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Linking, ScrollView, useColorScheme, Image } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import ImageView from 'react-native-image-viewing'
import OpenStreetMapView from '../../../../components/common/OpenStreetMapView'
import useVolunteerBear from '../../../../store/volunteer.store'
import useThemeBear from '../../../../store/theme.store'

const getFirstParamValue = (value) => {
  if (Array.isArray(value)) return value[0]
  return value
}

const parseCoordinate = (value) => {
  const numericValue = Number(getFirstParamValue(value))
  return Number.isFinite(numericValue) ? numericValue : null
}

const formatTimestamp = (value) => {
  if (!value) return null
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return null

  return date.toLocaleString()
}

export default function AlertMap() {
  const routes = useRouter()
  const { lat, lng, name, phone, description, alertId, imageUrl } = useLocalSearchParams()
  const { themePreference } = useThemeBear((state) => state)
  const systemColorScheme = useColorScheme()
  const [viewerVisible, setViewerVisible] = useState(false)

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

  const { volunteer, volunteerAlerts } = useVolunteerBear((state) => state)

  const normalizedAlertId = getFirstParamValue(alertId)
  const liveAlert = volunteerAlerts.find(
    (item) => String(item?._id) === String(normalizedAlertId)
  )

  const liveLatitude = liveAlert?.location?.coordinates?.[1]
  const liveLongitude = liveAlert?.location?.coordinates?.[0]

  const latitude = Number.isFinite(liveLatitude) ? liveLatitude : parseCoordinate(lat)
  const longitude = Number.isFinite(liveLongitude) ? liveLongitude : parseCoordinate(lng)

  const resolvedName = liveAlert?.user_id?.fullname || liveAlert?.user_id?.email || getFirstParamValue(name) || 'User'
  const resolvedPhone = liveAlert?.user_id?.phone || getFirstParamValue(phone) || ''
  const resolvedDescription = liveAlert?.description || getFirstParamValue(description) || ''
  const resolvedImageUrl = liveAlert?.image?.url || getFirstParamValue(imageUrl) || ''
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude)

  const volunteerLatitude = volunteer?.location?.coordinates?.[1]
  const volunteerLongitude = volunteer?.location?.coordinates?.[0]
  const hasVolunteerCoordinates = Number.isFinite(volunteerLatitude) && Number.isFinite(volunteerLongitude)

  const locationUpdatedAt = formatTimestamp(liveAlert?.updatedAt || liveAlert?.createdAt)

  const callUser = async () => {
    if (!resolvedPhone) return

    const phoneUrl = `tel:${resolvedPhone}`
    const canOpen = await Linking.canOpenURL(phoneUrl)
    if (canOpen) {
      Linking.openURL(phoneUrl)
    }
  }

  const openDirectionsInMaps = async () => {
    if (!hasCoordinates) return

    const googleAppUrl = hasVolunteerCoordinates
      ? `comgooglemaps://?saddr=${volunteerLatitude},${volunteerLongitude}&daddr=${latitude},${longitude}&directionsmode=driving`
      : `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`
    const googleWebUrl = hasVolunteerCoordinates
      ? `https://www.google.com/maps/dir/?api=1&origin=${volunteerLatitude},${volunteerLongitude}&destination=${latitude},${longitude}&travelmode=driving`
      : `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`

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

    const mapLabel = encodeURIComponent('Emergency Location')
    const nativeMapUrl = `geo:${latitude},${longitude}?q=${latitude},${longitude}(${mapLabel})`
    const fallbackDirectionUrl = hasVolunteerCoordinates
      ? `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${volunteerLatitude}%2C${volunteerLongitude}%3B${latitude}%2C${longitude}`
      : `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`

    const canOpenNativeMap = await Linking.canOpenURL(nativeMapUrl)
    if (canOpenNativeMap) {
      Linking.openURL(nativeMapUrl)
      return
    }

    const canOpenFallback = await Linking.canOpenURL(fallbackDirectionUrl)
    if (canOpenFallback) {
      Linking.openURL(fallbackDirectionUrl)
    }
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
        <Text className='text-3xl font-black' style={{ color: colors.text }}>User Location</Text>
        <Text className='text-xs mt-2 font-medium tracking-widest uppercase' style={{ color: colors.textSoft }}>
          Navigate to emergency location
        </Text>
      </View>

      <View className='px-6'>
        <View className='border rounded-2xl p-4' style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <Text className='text-sm' style={{ color: colors.textMuted }}>User: {resolvedName}</Text>
          <Text className='text-sm mt-1' style={{ color: colors.textMuted }}>Phone: {resolvedPhone || 'N/A'}</Text>
          <Text className='text-sm mt-1' style={{ color: colors.textMuted }}>Alert: {resolvedDescription || 'N/A'}</Text>
          <Text className='text-xs mt-2' style={{ color: colors.textSoft }}>
            {liveAlert ? 'Showing latest saved location' : 'Showing last known location'}
          </Text>
          {
            locationUpdatedAt ? (
              <Text className='text-xs mt-1' style={{ color: colors.textSoft }}>Last update: {locationUpdatedAt}</Text>
            ) : null
          }
          <Text className='text-xs mt-2' style={{ color: colors.textSoft }}>
            Lat: {hasCoordinates ? latitude.toFixed(6) : 'N/A'} | Lng: {hasCoordinates ? longitude.toFixed(6) : 'N/A'}
          </Text>
          {
            alertId ? (
              <Text className='text-xs mt-1' style={{ color: colors.textSoft }}>Alert ID: {alertId}</Text>
            ) : null
          }
        </View>
      </View>

      <View className='px-6 mt-4'>
        {
          hasCoordinates ? (
            <View className='overflow-hidden rounded-2xl'>
              <OpenStreetMapView
                height={300}
                center={{ latitude, longitude }}
                coordinate={{ latitude, longitude }}
                interactive={false}
              />
            </View>
          ) : (
            <View className='border rounded-2xl py-10 px-4 items-center' style={{ borderColor: colors.border, backgroundColor: colors.surface }}>
              <Text className='text-sm' style={{ color: colors.textSoft }}>Location is not available for this alert.</Text>
            </View>
          )
        }
      </View>

      {
        resolvedImageUrl ? (
          <View className='px-6 mt-4'>
            <TouchableOpacity
              className='overflow-hidden rounded-2xl border'
              style={{ borderColor: colors.border, backgroundColor: colors.surface }}
              activeOpacity={0.85}
              onPress={() => setViewerVisible(true)}
            >
              <Image
                source={{ uri: resolvedImageUrl }}
                style={{ width: '100%', height: 210 }}
                resizeMode='cover'
              />
              <View className='px-4 py-3'>
                <Text className='text-xs font-black tracking-widest uppercase' style={{ color: colors.accent }}>
                  View Full Image (Zoom)
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : null
      }

      <View className='px-6 mt-4 flex-row gap-3'>
        <TouchableOpacity
          className='flex-1 border rounded-xl py-4 items-center'
          style={{ borderColor: colors.neutralBorder, backgroundColor: colors.neutralSurface }}
          activeOpacity={0.8}
          onPress={callUser}
        >
          <Text className='font-black text-xs tracking-widest uppercase' style={{ color: colors.text }}>Call User</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className='flex-1 bg-red-600 rounded-xl py-4 items-center'
          activeOpacity={0.85}
          onPress={openDirectionsInMaps}
        >
          <Text className='text-white font-black text-xs tracking-widest uppercase'>Open Google Maps</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        className='mx-6 mt-3 border rounded-xl py-3 items-center'
        style={{ borderColor: colors.accent, backgroundColor: colors.neutralSurface }}
        activeOpacity={0.85}
        onPress={() => routes.back()}
      >
        <Text className='font-black text-xs tracking-widest uppercase' style={{ color: colors.accent }}>Back</Text>
      </TouchableOpacity>

      </ScrollView>

      <ImageView
        images={resolvedImageUrl ? [{ uri: resolvedImageUrl }] : []}
        imageIndex={0}
        visible={viewerVisible}
        onRequestClose={() => setViewerVisible(false)}
      />

      <View className='absolute bottom-0 left-0 right-0 h-1' style={{ backgroundColor: colors.accent }} />
    </View>
  )
}
