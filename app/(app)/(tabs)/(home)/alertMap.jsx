import React, { useMemo } from 'react'
import { View, Text, TouchableOpacity, Linking, ScrollView } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import MapView, { Marker } from 'react-native-maps'
import useVolunteerBear from '../../../../store/volunteer.store'

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
  const { lat, lng, name, phone, description, alertId } = useLocalSearchParams()

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
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude)

  const volunteerLatitude = volunteer?.location?.coordinates?.[1]
  const volunteerLongitude = volunteer?.location?.coordinates?.[0]
  const hasVolunteerCoordinates = Number.isFinite(volunteerLatitude) && Number.isFinite(volunteerLongitude)

  const mapRegion = useMemo(() => {
    if (!hasCoordinates) return null

    return {
      latitude,
      longitude,
      latitudeDelta: 0.008,
      longitudeDelta: 0.008,
    }
  }, [hasCoordinates, latitude, longitude])

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

    const destination = `${latitude},${longitude}`
    const origin = hasVolunteerCoordinates
      ? `&origin=${volunteerLatitude},${volunteerLongitude}`
      : ''

    const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}${origin}&travelmode=driving`
    const canOpen = await Linking.canOpenURL(mapUrl)
    if (canOpen) {
      Linking.openURL(mapUrl)
    }
  }

  return (
    <View className='flex-1 bg-white'>
      <View className='absolute top-0 left-0 right-0 h-1 bg-red-600 z-10' />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 56 }}
        showsVerticalScrollIndicator={false}
      >

      <View className='px-6 pt-14 pb-4'>
        <Text className='text-3xl font-black text-black'>User Location</Text>
        <Text className='text-xs text-gray-400 mt-2 font-medium tracking-widest uppercase'>
          Navigate to emergency location
        </Text>
      </View>

      <View className='px-6'>
        <View className='border-2 border-gray-100 p-4'>
          <Text className='text-sm text-gray-600'>User: {resolvedName}</Text>
          <Text className='text-sm text-gray-600 mt-1'>Phone: {resolvedPhone || 'N/A'}</Text>
          <Text className='text-sm text-gray-600 mt-1'>Alert: {resolvedDescription || 'N/A'}</Text>
          <Text className='text-xs text-gray-500 mt-2'>
            {liveAlert ? 'Showing latest saved location' : 'Showing last known location'}
          </Text>
          {
            locationUpdatedAt ? (
              <Text className='text-xs text-gray-400 mt-1'>Last update: {locationUpdatedAt}</Text>
            ) : null
          }
          <Text className='text-xs text-gray-400 mt-2'>
            Lat: {hasCoordinates ? latitude.toFixed(6) : 'N/A'} | Lng: {hasCoordinates ? longitude.toFixed(6) : 'N/A'}
          </Text>
          {
            alertId ? (
              <Text className='text-xs text-gray-400 mt-1'>Alert ID: {alertId}</Text>
            ) : null
          }
        </View>
      </View>

      <View className='px-6 mt-4'>
        {
          hasCoordinates ? (
            <MapView
              style={{ width: '100%', height: 300 }}
              region={mapRegion}
            >
              <Marker
                coordinate={{ latitude, longitude }}
                title={resolvedName}
                description='Emergency location'
              />
            </MapView>
          ) : (
            <View className='border-2 border-gray-100 py-10 px-4 items-center'>
              <Text className='text-sm text-gray-500'>Location is not available for this alert.</Text>
            </View>
          )
        }
      </View>

      <View className='px-6 mt-4 flex-row gap-3'>
        <TouchableOpacity
          className='flex-1 border-2 border-black py-4 items-center'
          activeOpacity={0.8}
          onPress={callUser}
        >
          <Text className='text-black font-black text-xs tracking-widest uppercase'>Call User</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className='flex-1 bg-red-600 py-4 items-center'
          activeOpacity={0.85}
          onPress={openDirectionsInMaps}
        >
          <Text className='text-white font-black text-xs tracking-widest uppercase'>Open Directions</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        className='mx-6 mt-3 border-2 border-red-600 py-3 items-center'
        activeOpacity={0.85}
        onPress={() => routes.back()}
      >
        <Text className='text-red-600 font-black text-xs tracking-widest uppercase'>Back</Text>
      </TouchableOpacity>

      </ScrollView>

      <View className='absolute bottom-0 left-0 right-0 h-1 bg-red-600' />
    </View>
  )
}
