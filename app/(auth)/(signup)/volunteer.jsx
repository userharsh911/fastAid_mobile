import { View, Text, TextInput, TouchableOpacity, StatusBar, ScrollView, Image, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ActivityIndicator, Modal, useColorScheme, useWindowDimensions } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
import * as Location from 'expo-location'
import IonIcons from "@expo/vector-icons/Ionicons"
import { Link } from 'expo-router'
import useVolunteerBear from '../../../store/volunteer.store'
import EmergencyLoader from '../../../components/common/EmergencyLoader'
import OpenStreetMapView from '../../../components/common/OpenStreetMapView'
import useThemeBear from '../../../store/theme.store'

export default function Volunteer() {
  const [image, setImage] = useState(null)
  const [fullname, setFullname] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false);
  const [applying, setApplying] = useState(false)
  const [selectedCoordinates, setSelectedCoordinates] = useState(null)
  const [mapRegion, setMapRegion] = useState(null)
  const [mapLoader, setMapLoader] = useState(true)
  const [refreshingCurrentLocation, setRefreshingCurrentLocation] = useState(false)
  const [isMapInteracting, setIsMapInteracting] = useState(false)
  const [isFullscreenMapVisible, setIsFullscreenMapVisible] = useState(false)
  const { themePreference } = useThemeBear((state) => state)
  const { height: windowHeight } = useWindowDimensions()
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
    inputBg: isDarkMode ? '#0f172a' : '#ffffff',
    inputBorder: isDarkMode ? '#334155' : '#d1d5db',
    placeholder: isDarkMode ? '#64748b' : '#9ca3af',
    disabledPrimary: isDarkMode ? '#475569' : '#fca5a5',
  }
  const fullscreenMapHeight = Math.max(360, windowHeight - 220)
  const {applyVolunteer} = useVolunteerBear(state=>state);

  const setMapPin = useCallback((latitude, longitude, keepZoom = true) => {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') return

    setMapRegion((prev) => {
      return {
        latitude,
        longitude,
        latitudeDelta: keepZoom ? (prev?.latitudeDelta || 0.02) : 0.02,
        longitudeDelta: keepZoom ? (prev?.longitudeDelta || 0.02) : 0.02,
      }
    })

    setSelectedCoordinates({ latitude, longitude })
  }, [])

  const pickCurrentLocationForMap = useCallback(async () => {
    try {
      setRefreshingCurrentLocation(true)

      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Location permission is required to set volunteer location.')
        return
      }

      const currentLocation = await Location.getCurrentPositionAsync({})
      const latitude = currentLocation?.coords?.latitude
      const longitude = currentLocation?.coords?.longitude

      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        Alert.alert('Location error', 'Unable to fetch current location right now.')
        return
      }

      setMapPin(latitude, longitude, false)
    } catch (_error) {
      Alert.alert('Location error', 'Unable to fetch current location right now.')
    } finally {
      setRefreshingCurrentLocation(false)
      setMapLoader(false)
    }
  }, [setMapPin])

  useEffect(() => {
    pickCurrentLocationForMap().catch(() => {
      setMapLoader(false)
    })
  }, [pickCurrentLocationForMap])

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Permission to access the media library is required.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images',],
      // allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log(result);

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const applyHandler = async()=>{
    if (applying) return

    try {
      if (!fullname.trim() || !email.trim() || !phone.trim() || !password) {
        Alert.alert('Missing fields', 'Please fill all required fields')
        return
      }

      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match')
        return
      }

      if (!Number.isFinite(selectedCoordinates?.latitude) || !Number.isFinite(selectedCoordinates?.longitude)) {
        Alert.alert('Location required', 'Please pin your location on map before submitting.')
        return
      }

      setApplying(true)

      const res = await applyVolunteer({
        fullname,
        email,
        password,
        phone,
        coordinates: [selectedCoordinates.longitude, selectedCoordinates.latitude],
      })

      if(res.success){
        console.log('volunteer apply success')
      }
    } catch (error) {
      Alert.alert("Error ",error?.message || "Error while applying");
    } finally {
      setApplying(false)
    }
  }

  return (
    <View className='flex-1' style={{ backgroundColor: colors.page }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.page} />
      <View className='absolute top-0 left-0 right-0 h-1 z-10' style={{ backgroundColor: colors.accent }} />
      <View style={{ position: 'absolute', top: -40, right: -24, width: 170, height: 170, borderRadius: 999, backgroundColor: isDarkMode ? '#1e293b' : '#fee2e2' }} />

      <KeyboardAvoidingView
        className='flex-1'
        behavior={Platform.OS==='ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback
          onPress={Keyboard.dismiss}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 52 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps='handled'
            scrollEnabled={!isMapInteracting}
          >
            <View className='mb-6 border rounded-2xl p-5' style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <Text className='text-4xl font-black tracking-tight leading-none' style={{ color: colors.text }}>
                Become a{'\n'}Volunteer.
              </Text>
              <Text className='text-xs mt-3 font-medium tracking-widest uppercase' style={{ color: colors.textSoft }}>
                Fill in your details to apply
              </Text>
              <View className='self-start mt-4 border px-3 py-2 rounded-full' style={{ backgroundColor: colors.accentSoftBg, borderColor: colors.accentSoftBorder }}>
                <Text className='text-[11px] font-black tracking-widest uppercase' style={{ color: colors.accent }}>Volunteer Onboarding</Text>
              </View>
            </View>

            <View className='border rounded-2xl p-5 mb-5 items-center' style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <TouchableOpacity onPress={pickImage} activeOpacity={0.85}>
                {
                  image ? (
                    <View>
                    <Image
                      source={{ uri: image }}
                      className='w-24 h-24 rounded-2xl'
                      style={{ borderWidth: 2, borderColor: colors.accent }}
                    />
                    <View className='absolute -bottom-2 -right-2 rounded-lg px-2 py-1' style={{ backgroundColor: colors.accent }}>
                      <Text className='text-white text-xs font-black tracking-wider'>EDIT</Text>
                    </View>
                  </View>
                  ) : (
                    <View
                      className='px-6 h-24 border-2 border-dashed items-center justify-center rounded-2xl'
                      style={{ borderColor: colors.accentSoftBorder, backgroundColor: colors.accentSoftBg }}
                    >
                      <Text className='text-3xl' style={{ color: colors.accent }}>+</Text>
                      <Text className='text-xs font-bold tracking-widest uppercase mt-1' style={{ color: colors.accent }}>
                        Add Document
                      </Text>
                    </View>
                  )
                }
              </TouchableOpacity>
            </View>

            <View className='border rounded-2xl p-5 mb-5' style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <View className='mb-4'>
                <Text className='text-xs font-bold tracking-widest uppercase mb-2' style={{ color: colors.textSoft }}>
                  Full Name
                </Text>
                <View className='border rounded-xl px-3' style={{ borderColor: colors.inputBorder, backgroundColor: colors.inputBg }}>
                  <TextInput
                    value={fullname}
                    onChangeText={setFullname}
                    placeholder='Enter your full name'
                    placeholderTextColor={colors.placeholder}
                    className='py-3 text-base font-medium'
                    style={{ color: colors.text }}
                  />
                </View>
              </View>

              <View className='mb-4'>
                <Text className='text-xs font-bold tracking-widest uppercase mb-2' style={{ color: colors.textSoft }}>
                  Email
                </Text>
                <View className='border rounded-xl px-3' style={{ borderColor: colors.inputBorder, backgroundColor: colors.inputBg }}>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder='you@example.com'
                    placeholderTextColor={colors.placeholder}
                    keyboardType='email-address'
                    autoCapitalize='none'
                    className='py-3 text-base font-medium'
                    style={{ color: colors.text }}
                  />
                </View>
              </View>

              <View className='mb-4'>
                <Text className='text-xs font-bold tracking-widest uppercase mb-2' style={{ color: colors.textSoft }}>
                  Phone Number
                </Text>
                <View className='border rounded-xl px-3' style={{ borderColor: colors.inputBorder, backgroundColor: colors.inputBg }}>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder='+91 00000 00000'
                    placeholderTextColor={colors.placeholder}
                    keyboardType='phone-pad'
                    className='py-3 text-base font-medium'
                    style={{ color: colors.text }}
                  />
                </View>
              </View>

              <View className='mb-4'>
                <Text className='text-xs font-bold tracking-widest uppercase mb-2' style={{ color: colors.textSoft }}>
                  Password
                </Text>
                <View className='flex-row items-center border rounded-xl px-3' style={{ borderColor: colors.inputBorder, backgroundColor: colors.inputBg }}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder='••••••••'
                    placeholderTextColor={colors.placeholder}
                    secureTextEntry={!showPass}
                    className='flex-1 py-3 text-base font-medium'
                    style={{ color: colors.text }}
                  />
                  <TouchableOpacity onPress={() => setShowPass(!showPass)} className='py-3 pl-3'>
                    <Text className='text-xs font-black tracking-wider' style={{ color: colors.accent }}>
                      {showPass ? 'HIDE' : 'SHOW'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View>
                <Text className='text-xs font-bold tracking-widest uppercase mb-2' style={{ color: colors.textSoft }}>
                  Confirm Password
                </Text>
                <View className='flex-row items-center border rounded-xl px-3' style={{ borderColor: colors.inputBorder, backgroundColor: colors.inputBg }}>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder='••••••••'
                    placeholderTextColor={colors.placeholder}
                    secureTextEntry={!showConfirm}
                    className='flex-1 py-3 text-base font-medium'
                    style={{ color: colors.text }}
                  />
                  <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} className='py-3 pl-3'>
                    <Text className='text-xs font-black tracking-wider' style={{ color: colors.accent }}>
                      {showConfirm ? 'HIDE' : 'SHOW'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {confirmPassword.length > 0 && password !== confirmPassword ? (
                  <Text className='text-xs mt-2 font-medium' style={{ color: '#ef4444' }}>
                    Passwords do not match
                  </Text>
                ) : null}
              </View>
            </View>

            <View className='border rounded-2xl p-5 mb-5' style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <Text className='text-xs font-bold tracking-widest uppercase mb-2' style={{ color: colors.textSoft }}>
                Set Availability Location
              </Text>
              <Text className='text-xs mb-3' style={{ color: colors.textMuted }}>
                Pin your map location. Blue circle shows your 500m nearby coverage.
              </Text>

              {
                mapLoader ? (
                  <View className='border rounded-2xl py-8 items-center' style={{ borderColor: colors.inputBorder, backgroundColor: colors.inputBg }}>
                    <EmergencyLoader size='small' label='Loading map location' />
                  </View>
                ) : !mapRegion ? (
                  <View className='border rounded-2xl py-8 px-4 items-center' style={{ borderColor: colors.inputBorder, backgroundColor: colors.inputBg }}>
                    <Text className='text-xs text-center' style={{ color: colors.textMuted }}>
                      Location is not set yet. Tap Use My Current Location and then adjust the pin.
                    </Text>
                  </View>
                ) : (
                  <View className='border rounded-2xl overflow-hidden' style={{ borderColor: colors.inputBorder }}>
                    <OpenStreetMapView
                      height={250}
                      center={mapRegion}
                      coordinate={selectedCoordinates || mapRegion}
                      radiusMeters={500}
                      interactive
                      draggable
                      onMapInteractionChange={setIsMapInteracting}
                      onCoordinateChange={({ latitude, longitude }) => {
                        setMapPin(latitude, longitude)
                      }}
                    />
                  </View>
                )
              }

              <TouchableOpacity
                className='mt-3 border rounded-xl py-3 items-center'
                style={{ borderColor: colors.accent, backgroundColor: colors.accentSoftBg }}
                activeOpacity={0.85}
                disabled={refreshingCurrentLocation}
                onPress={pickCurrentLocationForMap}
              >
                <Text className='font-black text-xs tracking-widest uppercase' style={{ color: colors.accent }}>
                  {refreshingCurrentLocation ? 'Fetching Location...' : 'Use My Current Location'}
                </Text>
              </TouchableOpacity>

              {
                mapRegion ? (
                  <TouchableOpacity
                    className='mt-3 border rounded-xl py-3 items-center'
                    style={{ borderColor: colors.inputBorder, backgroundColor: colors.inputBg }}
                    activeOpacity={0.85}
                    onPress={() => {
                      setIsMapInteracting(false)
                      setIsFullscreenMapVisible(true)
                    }}
                  >
                    <Text className='font-black text-xs tracking-widest uppercase' style={{ color: colors.text }}>
                      Open Fullscreen Map
                    </Text>
                  </TouchableOpacity>
                ) : null
              }

              {
                selectedCoordinates ? (
                  <Text className='text-xs mt-2' style={{ color: colors.textSoft }}>
                    Lat: {selectedCoordinates.latitude.toFixed(6)} | Lng: {selectedCoordinates.longitude.toFixed(6)}
                  </Text>
                ) : null
              }
            </View>

            <TouchableOpacity
              className='py-4 items-center mb-4 rounded-xl'
              style={{ backgroundColor: applying ? colors.disabledPrimary : colors.accent }}
              activeOpacity={0.85}
              disabled={applying}
              onPress={applyHandler}
            >
              <View className='flex-row items-center gap-2'>
                {applying ? <ActivityIndicator color='#fff' size='small' /> : null}
                <Text className='text-white font-black text-sm tracking-widest uppercase'>
                  {applying ? 'Submitting...' : 'Submit Application'}
                </Text>
              </View>
            </TouchableOpacity>

            <Link href='../(login)/volunteer' asChild>
              <TouchableOpacity className='items-center mt-2' activeOpacity={0.8}>
                <Text className='text-sm font-medium tracking-wide' style={{ color: colors.textSoft }}>
                  <IonIcons size={14} name='arrow-back'/> Back to login
                </Text>
              </TouchableOpacity>
            </Link>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <Modal
        visible={isFullscreenMapVisible}
        animationType='slide'
        transparent={false}
        onRequestClose={() => {
          setIsMapInteracting(false)
          setIsFullscreenMapVisible(false)
        }}
      >
        <View className='flex-1' style={{ backgroundColor: colors.page }}>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.page} />

          <View className='flex-row items-center justify-between px-4 pt-12 pb-4'>
            <Text className='text-sm font-black tracking-widest uppercase' style={{ color: colors.text }}>
              Fullscreen Map Editor
            </Text>

            <TouchableOpacity
              className='border rounded-lg px-3 py-2'
              style={{ borderColor: colors.inputBorder, backgroundColor: colors.inputBg }}
              activeOpacity={0.85}
              onPress={() => {
                setIsMapInteracting(false)
                setIsFullscreenMapVisible(false)
              }}
            >
              <Text className='text-xs font-black tracking-widest uppercase' style={{ color: colors.text }}>
                Close
              </Text>
            </TouchableOpacity>
          </View>

          <View className='px-4'>
            <View className='border rounded-2xl overflow-hidden' style={{ borderColor: colors.inputBorder }}>
              <OpenStreetMapView
                height={fullscreenMapHeight}
                center={selectedCoordinates || mapRegion}
                coordinate={selectedCoordinates || mapRegion}
                radiusMeters={500}
                interactive
                draggable
                onMapInteractionChange={setIsMapInteracting}
                onCoordinateChange={({ latitude, longitude }) => {
                  setMapPin(latitude, longitude)
                }}
              />
            </View>

            <TouchableOpacity
              className='mt-4 border rounded-xl py-3 items-center'
              style={{ borderColor: colors.accent, backgroundColor: colors.accentSoftBg }}
              activeOpacity={0.85}
              disabled={refreshingCurrentLocation}
              onPress={pickCurrentLocationForMap}
            >
              <Text className='font-black text-xs tracking-widest uppercase' style={{ color: colors.accent }}>
                {refreshingCurrentLocation ? 'Fetching Location...' : 'Use My Current Location'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className='mt-3 bg-red-600 rounded-xl py-3 items-center'
              activeOpacity={0.85}
              onPress={() => {
                setIsMapInteracting(false)
                setIsFullscreenMapVisible(false)
              }}
            >
              <Text className='text-white font-black text-xs tracking-widest uppercase'>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View className='absolute bottom-0 left-0 right-0 h-1' style={{ backgroundColor: colors.accent }} />
    </View>
  )
}