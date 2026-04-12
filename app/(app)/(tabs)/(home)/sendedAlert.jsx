import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'
import useUserBear from '../../../../store/user.store'

export default function SendedAlert() {
  const routes = useRouter()
  const { nearbyVolunteers, latestAlert, setSelectedVolunteer, clearAlertState } = useUserBear(state=>state)

  const hireVolunteerHandler = (volunteer) => {
    setSelectedVolunteer(volunteer)
    routes.push('/(app)/(tabs)/(home)/hireVolunteer')
  }

  const callVolunteerHandler = async (phone) => {
    if (!phone) return
    const phoneUrl = `tel:${phone}`
    const canOpen = await Linking.canOpenURL(phoneUrl)
    if (canOpen) {
      Linking.openURL(phoneUrl)
    }
  }

  const sendAnotherAlertHandler = () => {
    clearAlertState()
    routes.replace('/(app)/(tabs)/(home)')
  }

  return (
    <View className='flex-1 bg-white'>
      <View className='absolute top-0 left-0 right-0 h-1 bg-red-600 z-10' />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 52 }}
        showsVerticalScrollIndicator={false}
      >
        <View className='mb-8'>
          <Text className='text-3xl font-black text-black tracking-tight'>Alert Sent</Text>
          <Text className='text-xs text-gray-400 mt-2 font-medium tracking-widest uppercase'>
            Nearby volunteers who can help
          </Text>
          <Text className='text-sm text-gray-500 mt-4'>
            Total nearby volunteers: {nearbyVolunteers?.length || 0}
          </Text>
          {
            latestAlert?._id ? (
              <Text className='text-xs text-gray-400 mt-1'>Alert ID: {latestAlert._id}</Text>
            ) : null
          }
        </View>

        {
          (nearbyVolunteers?.length || 0) === 0 ? (
            <View className='border-2 border-gray-100 p-5'>
              <Text className='text-sm text-gray-500'>No nearby volunteers found right now.</Text>
              <Text className='text-xs text-gray-400 mt-2'>Try sending alert again after a while.</Text>
            </View>
          ) : (
            nearbyVolunteers.map((volunteer, index) => {
              const longitude = volunteer?.location?.coordinates?.[0]
              const latitude = volunteer?.location?.coordinates?.[1]

              return (
                <View key={volunteer?._id || String(index)} className='border-2 border-gray-100 p-4 mb-4'>
                  <Text className='text-lg font-black text-black'>Volunteer {index + 1}</Text>
                  <Text className='text-sm text-gray-600 mt-2'>Email: {volunteer?.email || 'N/A'}</Text>
                  <Text className='text-sm text-gray-600 mt-1'>Phone: {volunteer?.phone || 'N/A'}</Text>
                  <Text className='text-sm text-gray-600 mt-1'>Mode: {volunteer?.mode || 'N/A'}</Text>
                  <Text className='text-xs text-gray-400 mt-2'>
                    Lat: {typeof latitude === 'number' ? latitude.toFixed(6) : 'N/A'} | Lng: {typeof longitude === 'number' ? longitude.toFixed(6) : 'N/A'}
                  </Text>

                  <View className='flex-row gap-3 mt-4'>
                    <TouchableOpacity
                      className='flex-1 border-2 border-black py-3 items-center'
                      activeOpacity={0.8}
                      onPress={() => callVolunteerHandler(volunteer?.phone)}
                    >
                      <Text className='text-black font-black text-xs tracking-widest uppercase'>Call</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className='flex-1 bg-red-600 py-3 items-center'
                      activeOpacity={0.85}
                      onPress={() => hireVolunteerHandler(volunteer)}
                    >
                      <Text className='text-white font-black text-xs tracking-widest uppercase'>Hire</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )
            })
          )
        }

        <TouchableOpacity
          className='border-2 border-red-600 py-4 items-center mt-2'
          activeOpacity={0.85}
          onPress={sendAnotherAlertHandler}
        >
          <Text className='text-red-600 font-black text-sm tracking-widest uppercase'>Send Another Alert</Text>
        </TouchableOpacity>
      </ScrollView>

      <View className='absolute bottom-0 left-0 right-0 h-1 bg-red-600' />
    </View>
  )
}