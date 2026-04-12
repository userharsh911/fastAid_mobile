import { View, Text, TextInput, TouchableOpacity, StatusBar, ScrollView, Image, Alert } from 'react-native'
import React, { useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
import * as Location from 'expo-location'
import { useRouter } from 'expo-router'
import useUserBear from '../../store/user.store'

export default function UserHome({user}) {
  const [image, setImage] = useState(null)
  const [description, setDescription] = useState('')
  const [sendingAlert, setSendingAlert] = useState(false)
  const { createAlert } = useUserBear(state=>state)
  const routes = useRouter()

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) return
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })
    if (!result.canceled) setImage(result.assets[0].uri)
  }

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) return
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })
    if (!result.canceled) setImage(result.assets[0].uri)
  }

  const sendAlertHandler = async () => {
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
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Top accent bar */}
      <View className="absolute top-0 left-0 right-0 h-1 bg-red-600 z-10" />

      {/* Top Nav */}
      <View className="flex-row items-center justify-between px-6 pt-12 pb-4 border-b border-gray-100">
        <View className="flex-row items-center gap-3">
          <View className="w-7 h-7 bg-red-600 rounded-sm" />
          <Text className="text-lg font-black text-black tracking-tight">Dashboard</Text>
        </View>
        <View className="w-9 h-9 rounded-full bg-red-50 border-2 border-red-600 items-center justify-center">
          <Text className="text-red-600 font-black text-xs">{user?.fullname?.[0] || "U"}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 52 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Greeting */}
        <View className="mb-8">
          <Text className="text-3xl font-black text-black tracking-tight leading-tight">
            Report an{'\n'}Incident.
          </Text>
          <Text className="text-xs text-gray-400 mt-2 font-medium tracking-widest uppercase">
            Send alert to nearby volunteers
          </Text>
        </View>

        {/* Alert Form Card */}
        <View className="border-2 border-gray-100 p-5 mb-6">

          {/* Image Upload */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xs font-bold text-gray-400 tracking-widest uppercase">
                Attach Image
              </Text>
              <View className="bg-gray-100 px-2 py-1">
                <Text className="text-xs font-bold text-gray-400 tracking-wider">OPTIONAL</Text>
              </View>
            </View>

            {image ? (
              <View className="relative">
                <Image
                  source={{ uri: image }}
                  className="w-full h-44 rounded-sm"
                  style={{ borderWidth: 2, borderColor: '#dc2626' }}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => setImage(null)}
                  className="absolute top-2 right-2 bg-red-600 px-2 py-1"
                >
                  <Text className="text-white text-xs font-black tracking-wider">REMOVE</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="border-2 border-dashed border-gray-200 h-36 items-center justify-center rounded-sm mb-3">
                <Text className="text-3xl text-gray-300 mb-1">📷</Text>
                <Text className="text-xs text-gray-300 font-bold tracking-widest uppercase">
                  No image selected
                </Text>
              </View>
            )}

            {/* Gallery / Camera buttons */}
            <View className="flex-row gap-3 mt-3">
              <TouchableOpacity
                onPress={pickImage}
                className="flex-1 border-2 border-gray-200 py-3 items-center"
                activeOpacity={0.8}
              >
                <Text className="text-xs font-black text-gray-500 tracking-widest uppercase">
                  Gallery
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={takePhoto}
                className="flex-1 border-2 border-red-600 py-3 items-center"
                activeOpacity={0.8}
              >
                <Text className="text-xs font-black text-red-600 tracking-widest uppercase">
                  Camera
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Divider */}
          <View className="h-px bg-gray-100 mb-6" />

          {/* Description */}
          <View className="mb-2">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xs font-bold text-gray-400 tracking-widest uppercase">
                Description
              </Text>
              <View className="bg-gray-100 px-2 py-1">
                <Text className="text-xs font-bold text-gray-400 tracking-wider">OPTIONAL</Text>
              </View>
            </View>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Describe what's happening..."
              placeholderTextColor="#d1d5db"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="border-2 border-gray-200 p-4 text-sm text-black font-medium min-h-28"
              style={{ minHeight: 112 }}
            />
            <Text className="text-xs text-gray-300 mt-2 font-medium text-right">
              {description.length} / 300
            </Text>
          </View>
        </View>

        {/* Send Alert Button */}
        <TouchableOpacity
          className="bg-red-600 py-5 items-center"
          activeOpacity={0.85}
          disabled={sendingAlert}
          onPress={sendAlertHandler}
        >
          <View className="flex-row items-center gap-2">
            <Text className="text-white font-black text-sm tracking-widest uppercase">
              {sendingAlert ? 'Sending...' : '🚨  Send Alert'}
            </Text>
          </View>
        </TouchableOpacity>

        <Text className="text-center text-xs text-gray-300 mt-4 font-medium tracking-wide">
          Alert will be sent to all nearby volunteers
        </Text>
      </ScrollView>

      {/* Bottom accent */}
      <View className="absolute bottom-0 left-0 right-0 h-1 bg-red-600" />
    </View>
  )
}