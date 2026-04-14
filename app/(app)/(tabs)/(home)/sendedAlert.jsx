import { View, Text, ScrollView, TouchableOpacity, Linking, Alert, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import * as Location from 'expo-location'
import { useRouter } from 'expo-router'
import useUserBear from '../../../../store/user.store'
import VolunteerRadarSearch from '../../../../components/common/VolunteerRadarSearch'

export default function SendedAlert() {
  const routes = useRouter()
  const [sendingAnotherAlert, setSendingAnotherAlert] = useState(false)
  const [alertActionLoading, setAlertActionLoading] = useState(null)
  const [hiringVolunteerId, setHiringVolunteerId] = useState(null)
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
    if (!phone) return
    const phoneUrl = `tel:${phone}`
    const canOpen = await Linking.canOpenURL(phoneUrl)
    if (canOpen) {
      Linking.openURL(phoneUrl)
    }
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

          {
            latestAlert?.mode === 'Alloted' ? (
              <Text className='text-sm text-green-700 mt-3 font-semibold'>Volunteer assigned. You can now open hired volunteer details.</Text>
            ) : latestAlert?.mode === 'Cancelled' ? (
              <Text className='text-sm text-red-700 mt-3 font-semibold'>This alert is cancelled.</Text>
            ) : latestAlert?.mode === 'End' ? (
              <Text className='text-sm text-green-700 mt-3 font-semibold'>This alert is completed successfully.</Text>
            ) : (
              <Text className='text-sm text-amber-700 mt-3 font-semibold'>Waiting for any volunteer to click I'm In.</Text>
            )
          }

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
          isSearchingVolunteer ? (
            <View className='border-2 border-red-100 bg-red-50 p-5 mb-6'>
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
            <View className='border-2 border-gray-100 p-5'>
              <Text className='text-sm text-gray-500'>No nearby volunteers found right now.</Text>
              <Text className='text-xs text-gray-400 mt-2'>Try sending alert again after a while.</Text>
            </View>
          ) : (
            nearbyVolunteers.map((volunteer, index) => {
              const longitude = volunteer?.location?.coordinates?.[0]
              const latitude = volunteer?.location?.coordinates?.[1]
              const volunteerAction = getVolunteerAction(volunteer?._id)
              const isHiringThisVolunteer = String(hiringVolunteerId) === String(volunteer?._id)

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
                      className={`flex-1 py-3 items-center ${volunteerAction.className}`}
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
              className={`border-2 py-4 items-center mt-2 ${alertActionLoading === 'cancel' ? 'border-red-300 bg-red-50' : 'border-red-600'}`}
              activeOpacity={0.85}
              disabled={Boolean(alertActionLoading) || sendingAnotherAlert}
              onPress={cancelAlertHandler}
            >
              <View className='flex-row items-center gap-2'>
                {alertActionLoading === 'cancel' ? <ActivityIndicator color='#dc2626' size='small' /> : null}
                <Text className='text-red-600 font-black text-sm tracking-widest uppercase'>
                  {alertActionLoading === 'cancel' ? 'Cancelling...' : 'Cancel Alert'}
                </Text>
              </View>
            </TouchableOpacity>
          ) : null
        }

        {
          latestAlert?.mode === 'Alloted' ? (
            <TouchableOpacity
              className={`py-4 items-center mt-3 ${alertActionLoading === 'end' ? 'bg-green-400' : 'bg-green-600'}`}
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
              className='border-2 border-red-600 py-4 items-center mt-2'
              activeOpacity={0.85}
              disabled={alertStatusLoader || sendingAnotherAlert || Boolean(alertActionLoading)}
              onPress={sendAnotherAlertHandler}
            >
              <Text className='text-red-600 font-black text-sm tracking-widest uppercase'>
                {sendingAnotherAlert
                  ? 'Sending New Alert...'
                  : (latestAlert?.mode === 'Active' ? 'Cancel & Send Another Alert' : 'Send Another Alert')}
              </Text>
            </TouchableOpacity>
          ) : null
        }
      </ScrollView>

      <View className='absolute bottom-0 left-0 right-0 h-1 bg-red-600' />
    </View>
  )
}