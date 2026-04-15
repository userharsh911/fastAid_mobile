import { View, Text, TextInput, TouchableOpacity, StatusBar, ScrollView, Image, Alert, useColorScheme } from 'react-native'
import React, { useEffect, useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
import * as Location from 'expo-location'
import { useRouter } from 'expo-router'
import useUserBear from '../../store/user.store'
import useThemeBear from '../../store/theme.store'

export default function UserHome({ user }) {
  const [image, setImage] = useState(null)
  const [description, setDescription] = useState('')
  const [sendingAlert, setSendingAlert] = useState(false)

  const { createAlert, loadLatestAlertStatus, latestAlert } = useUserBear((state) => state)
  const { themePreference } = useThemeBear((state) => state)
  const systemColorScheme = useColorScheme()
  const routes = useRouter()

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
    divider: isDarkMode ? '#1f2937' : '#f3f4f6',
    placeholder: isDarkMode ? '#64748b' : '#d1d5db',
    subtleSurface: isDarkMode ? '#0f172a' : '#f8fafc',
    disabledBg: isDarkMode ? '#334155' : '#d1d5db',
    disabledText: isDarkMode ? '#94a3b8' : '#6b7280',
  }

  useEffect(() => {
    loadLatestAlertStatus().catch(() => {})
  }, [loadLatestAlertStatus])

  const hasTrackedAlert = Boolean(
    latestAlert?._id && latestAlert?.mode !== 'Cancelled' && latestAlert?.mode !== 'End'
  )

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) return

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    if (!result.canceled) {
      const selectedAsset = result.assets?.[0]
      if (selectedAsset?.uri) {
        setImage({
          uri: selectedAsset.uri,
          fileName: selectedAsset.fileName,
          mimeType: selectedAsset.mimeType,
        })
      }
    }
  }

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) return

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    if (!result.canceled) {
      const selectedAsset = result.assets?.[0]
      if (selectedAsset?.uri) {
        setImage({
          uri: selectedAsset.uri,
          fileName: selectedAsset.fileName,
          mimeType: selectedAsset.mimeType,
        })
      }
    }
  }

  const sendAlertHandler = async () => {
    if (hasTrackedAlert) {
      if (latestAlert?.mode === 'Alloted') {
        Alert.alert('Alert Already Assigned', 'A volunteer has been assigned to your current alert. Please cancel the active alert before sending a new one.')
      } else {
        Alert.alert('Alert Already Active', 'Please track your current alert first. You must cancel the active alert before sending a new one.')
      }
      routes.push('/(app)/(tabs)/(home)/sendedAlert')
      return
    }

    try {
      setSendingAlert(true)

      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Location permission is required to send an alert.')
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
        description: description.trim() || undefined,
        coordinates: { latitude, longitude },
        image: image || undefined,
      })

      if (response?.success) {
        setDescription('')
        setImage(null)
        routes.push('/(app)/(tabs)/(home)/sendedAlert')
      }
    } catch (error) {
      Alert.alert('Error', error?.message || 'Error while sending alert')
    } finally {
      setSendingAlert(false)
    }
  }

  return (
    <View className='flex-1' style={{ backgroundColor: colors.page }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.page} />

      <View className='absolute top-0 left-0 right-0 h-1 z-10' style={{ backgroundColor: colors.accent }} />
      <View style={{ position: 'absolute', top: -30, right: -24, width: 150, height: 150, borderRadius: 999, backgroundColor: isDarkMode ? '#1e293b' : '#fee2e2' }} />

      <View className='px-6 pt-12 pb-2'>
        <View className='flex-row items-center justify-between border rounded-2xl px-4 py-3' style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <View className='flex-row items-center gap-3'>
            <View className='w-8 h-8 rounded-xl items-center justify-center' style={{ backgroundColor: colors.accent }}>
              <Text className='text-white text-xs font-black'>EG</Text>
            </View>
            <View>
              <Text className='text-base font-black tracking-tight' style={{ color: colors.text }}>Emergency Dashboard</Text>
              <Text className='text-[10px] font-bold tracking-widest uppercase' style={{ color: colors.textSoft }}>User Mode</Text>
            </View>
          </View>
          <View className='w-10 h-10 rounded-full border items-center justify-center' style={{ backgroundColor: colors.accentSoftBg, borderColor: colors.accentSoftBorder }}>
            <Text className='font-black text-xs' style={{ color: colors.accent }}>{user?.fullname?.[0] || 'U'}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 56 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
      >
        <View className='mb-6 border rounded-2xl p-5' style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <Text className='text-3xl font-black tracking-tight leading-tight' style={{ color: colors.text }}>
            Report an{"\n"}Incident.
          </Text>
          <Text className='text-xs mt-2 font-medium tracking-widest uppercase' style={{ color: colors.textSoft }}>
            Send alert to nearby volunteers
          </Text>

          <View className='self-start mt-4 border px-3 py-2 rounded-full' style={{ backgroundColor: colors.accentSoftBg, borderColor: colors.accentSoftBorder }}>
            <Text className='text-[11px] font-black tracking-widest uppercase' style={{ color: colors.accent }}>Live Assistance Enabled</Text>
          </View>

          {hasTrackedAlert ? (
            <View className='mt-4 border rounded-2xl p-4' style={{ borderColor: colors.accentSoftBorder, backgroundColor: colors.accentSoftBg }}>
              <Text className='text-xs font-black tracking-widest uppercase' style={{ color: colors.accent }}>Current Alert</Text>
              <Text className='text-sm mt-2' style={{ color: colors.textMuted }}>
                Status: {latestAlert?.mode === 'Alloted' ? 'Hired' : 'Waiting for volunteer'}
              </Text>
              <TouchableOpacity
                className='mt-3 rounded-xl py-3 items-center'
                style={{ backgroundColor: colors.accent }}
                activeOpacity={0.85}
                onPress={() => routes.push('/(app)/(tabs)/(home)/sendedAlert')}
              >
                <Text className='text-white font-black text-xs tracking-widest uppercase'>
                  {latestAlert?.mode === 'Alloted' ? 'View Hired Volunteer' : 'Track Alert'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <View className='border rounded-2xl p-5 mb-6' style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <View className='mb-6'>
            <View className='flex-row items-center justify-between mb-3'>
              <Text className='text-xs font-bold tracking-widest uppercase' style={{ color: colors.textSoft }}>
                Attach Image
              </Text>
              <View className='px-3 py-1.5 rounded-full' style={{ backgroundColor: isDarkMode ? '#0f172a' : '#f3f4f6' }}>
                <Text className='text-xs font-bold tracking-wider' style={{ color: colors.textSoft }}>OPTIONAL</Text>
              </View>
            </View>

            {image ? (
              <View className='relative'>
                <Image
                  source={{ uri: image?.uri }}
                  className='w-full h-44 rounded-sm'
                  style={{ borderWidth: 2, borderColor: colors.accent, borderRadius: 16 }}
                  resizeMode='cover'
                />
                <TouchableOpacity
                  onPress={() => setImage(null)}
                  className='absolute top-2 right-2 rounded-lg px-2 py-1'
                  style={{ backgroundColor: colors.accent }}
                >
                  <Text className='text-white text-xs font-black tracking-wider'>REMOVE</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className='border-2 border-dashed h-36 items-center justify-center rounded-2xl mb-3' style={{ borderColor: isDarkMode ? '#334155' : '#d1d5db', backgroundColor: colors.subtleSurface }}>
                <Text className='text-3xl mb-1' style={{ color: colors.textSoft }}>CAM</Text>
                <Text className='text-xs font-bold tracking-widest uppercase' style={{ color: colors.textSoft }}>
                  No image selected
                </Text>
              </View>
            )}

            <View className='flex-row gap-3 mt-3'>
              <TouchableOpacity
                onPress={pickImage}
                className='flex-1 border rounded-xl py-3 items-center'
                style={{ borderColor: isDarkMode ? '#334155' : '#d1d5db', backgroundColor: colors.subtleSurface }}
                activeOpacity={0.8}
              >
                <Text className='text-xs font-black tracking-widest uppercase' style={{ color: colors.textMuted }}>
                  Gallery
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={takePhoto}
                className='flex-1 border rounded-xl py-3 items-center'
                style={{ borderColor: colors.accent, backgroundColor: colors.accentSoftBg }}
                activeOpacity={0.8}
              >
                <Text className='text-xs font-black tracking-widest uppercase' style={{ color: colors.accent }}>
                  Camera
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className='h-px mb-6' style={{ backgroundColor: colors.divider }} />

          <View className='mb-2'>
            <View className='flex-row items-center justify-between mb-3'>
              <Text className='text-xs font-bold tracking-widest uppercase' style={{ color: colors.textSoft }}>
                Description
              </Text>
              <View className='px-3 py-1.5 rounded-full' style={{ backgroundColor: isDarkMode ? '#0f172a' : '#f3f4f6' }}>
                <Text className='text-xs font-bold tracking-wider' style={{ color: colors.textSoft }}>OPTIONAL</Text>
              </View>
            </View>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Describe what's happening..."
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={4}
              textAlignVertical='top'
              className='border rounded-2xl p-4 text-sm font-medium min-h-28'
              style={{ minHeight: 112, color: colors.text, borderColor: isDarkMode ? '#334155' : '#d1d5db', backgroundColor: colors.subtleSurface }}
            />
            <Text className='text-xs mt-2 font-medium text-right' style={{ color: colors.textSoft }}>
              {description.length} / 300
            </Text>
          </View>
        </View>

        <TouchableOpacity
          className='py-5 items-center rounded-2xl'
          style={{ backgroundColor: hasTrackedAlert ? colors.disabledBg : colors.accent }}
          activeOpacity={0.85}
          disabled={sendingAlert || hasTrackedAlert}
          onPress={sendAlertHandler}
        >
          <View className='flex-row items-center gap-2'>
            <Text className='font-black text-sm tracking-widest uppercase' style={{ color: hasTrackedAlert ? colors.disabledText : '#ffffff' }}>
              {sendingAlert ? 'Sending...' : (hasTrackedAlert ? 'Track Current Alert First' : 'Send Alert')}
            </Text>
          </View>
          <Text className='text-[11px] mt-1 font-semibold' style={{ color: hasTrackedAlert ? colors.disabledText : (isDarkMode ? '#fecaca' : '#fee2e2') }}>
            Your location is shared only for active emergency support
          </Text>
        </TouchableOpacity>

        <Text className='text-center text-xs mt-4 font-medium tracking-wide' style={{ color: colors.textSoft }}>
          Alert will be sent to all nearby volunteers
        </Text>
      </ScrollView>

      <View className='absolute bottom-0 left-0 right-0 h-1' style={{ backgroundColor: colors.accent }} />
    </View>
  )
}
