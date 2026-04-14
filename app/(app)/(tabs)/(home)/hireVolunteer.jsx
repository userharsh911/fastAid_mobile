import { View, Text, TouchableOpacity, Linking, Alert, ScrollView, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import { useRouter } from 'expo-router'
import MapView, { Marker } from 'react-native-maps'
import useUserBear from '../../../../store/user.store'

export default function HireVolunteer() {
  const routes = useRouter()
  const [completingWork, setCompletingWork] = useState(false)
  const { selectedVolunteer, latestAlert, endAlert, clearAlertState } = useUserBear(state=>state)

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
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    const canOpen = await Linking.canOpenURL(mapUrl)
    if (canOpen) {
      Linking.openURL(mapUrl)
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
      <View className='flex-1 bg-white px-6 justify-center'>
        <Text className='text-2xl font-black text-black'>No Volunteer Selected</Text>
        <Text className='text-sm text-gray-500 mt-2'>Please go back and select a volunteer first.</Text>
        <TouchableOpacity
          className='mt-6 bg-red-600 py-4 items-center'
          activeOpacity={0.85}
          onPress={() => routes.replace('/(app)/(tabs)/(home)/sendedAlert')}
        >
          <Text className='text-white font-black text-sm tracking-widest uppercase'>Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View className='flex-1 bg-white'>
      <View className='absolute top-0 left-0 right-0 h-1 bg-red-600 z-10' />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 56 }}
        showsVerticalScrollIndicator={false}
      >

      <View className='px-6 pt-14 pb-4'>
        <Text className='text-3xl font-black text-black'>Hire Volunteer</Text>
        <Text className='text-xs text-gray-400 mt-2 font-medium tracking-widest uppercase'>
          Volunteer details and live location
        </Text>
      </View>

      <View className='px-6'>
        <View className='border-2 border-gray-100 p-4'>
          <Text className='text-sm text-gray-600'>Email: {selectedVolunteer?.email || 'N/A'}</Text>
          <Text className='text-sm text-gray-600 mt-1'>Phone: {selectedVolunteer?.phone || 'N/A'}</Text>
          <Text className='text-sm text-gray-600 mt-1'>Mode: {selectedVolunteer?.mode || 'N/A'}</Text>
          <Text className='text-xs text-gray-400 mt-2'>
            Lat: {hasCoordinates ? latitude.toFixed(6) : 'N/A'} | Lng: {hasCoordinates ? longitude.toFixed(6) : 'N/A'}
          </Text>
        </View>
      </View>

      <View className='px-6 mt-4'>
        {
          hasCoordinates ? (
            <MapView
              style={{ width: '100%', height: 280 }}
              initialRegion={{
                latitude,
                longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={{ latitude, longitude }}
                title='Volunteer Location'
                description={selectedVolunteer?.email || 'Nearby Volunteer'}
              />
            </MapView>
          ) : (
            <View className='border-2 border-gray-100 py-10 px-4 items-center'>
              <Text className='text-sm text-gray-500'>Location is not available for this volunteer.</Text>
            </View>
          )
        }
      </View>

      <View className='px-6 mt-4 flex-row gap-3'>
        <TouchableOpacity
          className='flex-1 border-2 border-black py-4 items-center'
          activeOpacity={0.8}
          onPress={callVolunteerHandler}
        >
          <Text className='text-black font-black text-xs tracking-widest uppercase'>Call Volunteer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className='flex-1 bg-red-600 py-4 items-center'
          activeOpacity={0.85}
          onPress={openInMapsHandler}
        >
          <Text className='text-white font-black text-xs tracking-widest uppercase'>Open in Maps</Text>
        </TouchableOpacity>
      </View>

      <View className='px-6 mt-3'>
        <TouchableOpacity
          className={`py-4 items-center ${completingWork ? 'bg-green-400' : 'bg-green-600'}`}
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

      <View className='absolute bottom-0 left-0 right-0 h-1 bg-red-600' />
    </View>
  )
}