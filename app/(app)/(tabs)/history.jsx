import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Animated } from 'react-native'
import React, { useEffect, useRef } from 'react'
import { useRouter } from 'expo-router'
import useUserBear from '../../../store/user.store'
import useVolunteerBear from '../../../store/volunteer.store'

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000
const HISTORY_SKELETON_ROWS = [1, 2, 3]

function HistorySkeleton() {
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
          style={{ opacity: pulse }}
          className='border-2 border-gray-100 p-4 mb-4'
        >
          <View className='h-5 w-32 bg-gray-200 mb-3' />
          <View className='h-3 w-40 bg-gray-200 mb-2' />
          <View className='h-3 w-full bg-gray-200 mb-2' />
          <View className='h-3 w-4/5 bg-gray-200 mb-2' />
          <View className='h-10 w-full bg-gray-200 mt-3' />
        </Animated.View>
      ))}
    </View>
  )
}

const getStatusStyle = (mode) => {
  if (mode === 'Active') return { text: 'text-amber-700', bg: 'bg-amber-100', label: 'Active' }
  if (mode === 'Alloted') return { text: 'text-blue-700', bg: 'bg-blue-100', label: 'Alloted' }
  if (mode === 'End') return { text: 'text-green-700', bg: 'bg-green-100', label: 'Completed' }
  if (mode === 'Cancelled') return { text: 'text-red-700', bg: 'bg-red-100', label: 'Cancelled' }
  return { text: 'text-gray-700', bg: 'bg-gray-100', label: mode || 'Unknown' }
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

export default function History() {
  const routes = useRouter()
  const [trackingAlertId, setTrackingAlertId] = React.useState(null)
  const historyInitKeyRef = useRef('')
  const {
    user,
    alertHistory,
    alertHistoryLoader,
    getAlertHistory,
    fetchAlertStatus,
  } = useUserBear(state=>state)
  const { volunteer } = useVolunteerBear(state=>state)
  const isInitialHistoryLoading = alertHistoryLoader && (alertHistory?.length || 0) === 0

  useEffect(() => {
    if (!user?._id || volunteer?._id) return

    const historyInitKey = `${user?._id}:user-history`
    if (historyInitKeyRef.current === historyInitKey) return
    historyInitKeyRef.current = historyInitKey

    const shouldShowSkeleton = (alertHistory?.length || 0) === 0
    getAlertHistory(shouldShowSkeleton).catch(() => {})
  }, [user?._id, volunteer?._id, getAlertHistory, alertHistory?.length])

  const refreshHistory = async () => {
    try {
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
      <View className='flex-1 bg-white px-6 justify-center'>
        <Text className='text-3xl font-black text-black'>History</Text>
        <Text className='text-sm text-gray-500 mt-3'>Alert history tab is available for users only.</Text>
      </View>
    )
  }

  return (
    <View className='flex-1 bg-white'>
      <View className='absolute top-0 left-0 right-0 h-1 bg-red-600 z-10' />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 52 }}
        showsVerticalScrollIndicator={false}
      >
        <View className='mb-8'>
          <Text className='text-3xl font-black text-black tracking-tight'>Alert History</Text>
          <Text className='text-xs text-gray-400 mt-2 font-medium tracking-widest uppercase'>All alerts sent by you</Text>
        </View>

        <TouchableOpacity
          className='border-2 border-red-600 py-3 items-center mb-5'
          activeOpacity={0.85}
          disabled={alertHistoryLoader}
          onPress={refreshHistory}
        >
          <Text className='text-red-600 font-black text-xs tracking-widest uppercase'>
            {alertHistoryLoader ? 'Refreshing...' : 'Refresh History'}
          </Text>
        </TouchableOpacity>

        {isInitialHistoryLoading ? <HistorySkeleton /> : null}

        {
          !isInitialHistoryLoading && (alertHistory?.length || 0) === 0 ? (
            <View className='border-2 border-gray-100 p-5'>
              <Text className='text-sm text-gray-500'>You have not sent any alerts yet.</Text>
            </View>
          ) : (
            alertHistory.map((alertItem, index) => {
              const status = getStatusStyle(alertItem?.mode)
              const assignedVolunteer = alertItem?.volunteer_id
              const ageMeta = getAgeMeta(alertItem)
              const isTrackingThisAlert = String(trackingAlertId) === String(alertItem?._id)

              return (
                <View key={alertItem?._id || String(index)} className='border-2 border-gray-100 p-4 mb-4'>
                  <View className='flex-row items-center justify-between'>
                    <Text className='text-lg font-black text-black'>Alert #{index + 1}</Text>
                    <View className={`px-3 py-1 ${status.bg}`}>
                      <Text className={`text-xs font-black uppercase ${status.text}`}>{status.label}</Text>
                    </View>
                  </View>

                  <Text className='text-xs text-gray-500 mt-1'>ID: {alertItem?._id}</Text>
                  <Text className='text-sm text-gray-600 mt-2'>Description: {alertItem?.description || 'N/A'}</Text>
                  <Text className='text-sm text-gray-600 mt-1'>Created At: {formatDateTime(alertItem?.createdAt)}</Text>
                  <Text className='text-sm text-gray-600 mt-1'>Age: {ageMeta.ageHours} hours</Text>

                  {
                    assignedVolunteer ? (
                      <Text className='text-sm text-gray-600 mt-1'>Volunteer: {assignedVolunteer?.email || 'Assigned'}</Text>
                    ) : null
                  }

                  {
                    ageMeta.needsReminder ? (
                      <Text className='text-xs text-amber-700 mt-2 font-semibold'>Active more than 12h. Please cancel if help is no longer needed.</Text>
                    ) : null
                  }

                  {
                    ageMeta.willExpireSoon ? (
                      <Text className='text-xs text-red-700 mt-2 font-semibold'>This alert will be auto-cancelled at 24h.</Text>
                    ) : null
                  }

                  {
                    alertItem?.mode === 'Active' || alertItem?.mode === 'Alloted' ? (
                      <TouchableOpacity
                        className='border-2 border-red-600 py-3 items-center mt-3'
                        activeOpacity={0.85}
                        disabled={Boolean(trackingAlertId)}
                        onPress={() => openAlertTracker(alertItem?._id)}
                      >
                        <View className='flex-row items-center gap-2'>
                          {isTrackingThisAlert ? <ActivityIndicator color='#dc2626' size='small' /> : null}
                          <Text className='text-red-600 font-black text-xs tracking-widest uppercase'>
                            {isTrackingThisAlert ? 'Opening...' : 'Track Alert'}
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
