import { View, Text, ScrollView, TouchableOpacity, Linking, Alert, ActivityIndicator } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import useVolunteerBear from '../../store/volunteer.store'
import { useRouter } from 'expo-router'
import EmergencyLoader from '../common/EmergencyLoader'

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
  } = useVolunteerBear(state=>state)

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
    <View className='flex-1 bg-white'>
      <View className='absolute top-0 left-0 right-0 h-1 bg-red-600 z-10' />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 52 }}
        showsVerticalScrollIndicator={false}
      >
        <View className='mb-8'>
          <Text className='text-3xl font-black text-black tracking-tight'>Volunteer Alerts</Text>
          <Text className='text-xs text-gray-400 mt-2 font-medium tracking-widest uppercase'>
            Active alerts within 500 meters
          </Text>
          <Text className='text-sm text-gray-500 mt-4'>
            Logged in as: {volunteer?.email || 'Volunteer'}
          </Text>
        </View>

        <TouchableOpacity
          className='border-2 border-red-600 py-3 items-center mb-5'
          activeOpacity={0.85}
          disabled={refreshingAlerts || isAnyAlertActionInProgress}
          onPress={refreshNearbyAlerts}
        >
          <Text className='text-red-600 font-black text-xs tracking-widest uppercase'>
            {refreshingAlerts ? 'Refreshing...' : 'Refresh Nearby Alerts'}
          </Text>
        </TouchableOpacity>

        {
          volunteerAlertsLoader && (volunteerAlerts?.length || 0) === 0 ? (
            <View className='mb-4'>
              <EmergencyLoader size='default' label='Fetching nearby alerts' />
            </View>
          ) : null
        }

        {
          (volunteerAlerts?.length || 0) === 0 ? (
            <View className='border-2 border-gray-100 p-5'>
              <Text className='text-sm text-gray-500'>No active alerts around your current location.</Text>
              <Text className='text-xs text-gray-400 mt-2'>Keep this app open to receive new alerts instantly.</Text>
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

              return (
                <View key={alertItem?._id || String(index)} className='border-2 border-gray-100 p-4 mb-4'>
                  <Text className='text-lg font-black text-black'>Alert #{index + 1}</Text>
                  <Text className='text-xs text-gray-500 mt-1'>ID: {alertItem?._id}</Text>
                  <Text className='text-sm text-gray-600 mt-2'>User: {userInfo?.fullname || userInfo?.email || 'Unknown'}</Text>
                  <Text className='text-sm text-gray-600 mt-1'>User Phone: {userInfo?.phone || 'N/A'}</Text>
                  <Text className='text-sm text-gray-600 mt-1'>Status: {alertItem?.mode || 'N/A'}</Text>
                  <Text className='text-sm text-gray-600 mt-1'>Description: {alertItem?.description || 'N/A'}</Text>
                  <Text className='text-xs text-gray-400 mt-2'>
                    Lat: {typeof latitude === 'number' ? latitude.toFixed(6) : 'N/A'} | Lng: {typeof longitude === 'number' ? longitude.toFixed(6) : 'N/A'}
                  </Text>

                  <View className='flex-row gap-3 mt-4'>
                    <TouchableOpacity
                      className='flex-1 border-2 border-black py-3 items-center'
                      activeOpacity={0.8}
                      onPress={() => callUser(userInfo?.phone)}
                    >
                      <Text className='text-black font-black text-xs tracking-widest uppercase'>Call User</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className={`flex-1 py-3 items-center ${canSelect ? 'bg-red-600' : (isAllotedForMe ? 'bg-green-600' : (hasRespondedByMe ? 'bg-amber-500' : 'bg-gray-300'))}`}
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
                    className='border-2 border-red-600 py-3 items-center mt-3'
                    activeOpacity={0.85}
                    onPress={() => openUserLocationMap(alertItem)}
                  >
                    <Text className='text-red-600 font-black text-xs tracking-widest uppercase'>View User Map</Text>
                  </TouchableOpacity>

                  {
                    isAllotedForMe && alertItem?.mode === 'Alloted' ? (
                      <TouchableOpacity
                        className='border-2 border-red-600 py-3 items-center mt-3 bg-red-50'
                        activeOpacity={0.85}
                        disabled={isAnyAlertActionInProgress}
                        onPress={() => handleCancelAlert(alertItem?._id)}
                      >
                        <View className='flex-row items-center gap-2'>
                          {isCancellingThisAlert ? <ActivityIndicator color='#dc2626' size='small' /> : null}
                          <Text className='text-red-600 font-black text-xs tracking-widest uppercase'>
                            {isCancellingThisAlert ? 'Cancelling...' : 'Cancel Alert'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ) : null
                  }
                </View>
              )
            })
          )
        }
      </ScrollView>

      <View className='absolute bottom-0 left-0 right-0 h-1 bg-red-600' />
    </View>
  )
}