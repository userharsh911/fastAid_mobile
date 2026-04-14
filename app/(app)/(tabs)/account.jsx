import { View, Text, TouchableOpacity, Alert, ScrollView, TextInput, StatusBar, Modal, useColorScheme, useWindowDimensions } from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import * as Location from 'expo-location'
import useUserBear from "../../../store/user.store"
import useVolunteerBear from '../../../store/volunteer.store';
import useThemeBear from '../../../store/theme.store';
import EmergencyLoader from '../../../components/common/EmergencyLoader'
import OpenStreetMapView from '../../../components/common/OpenStreetMapView'

const DEFAULT_REGION = {
  latitude: 28.6139,
  longitude: 77.2090,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
}

const getVolunteerLatLng = (volunteer) => {
  const longitude = volunteer?.location?.coordinates?.[0]
  const latitude = volunteer?.location?.coordinates?.[1]

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return null
  }

  return { latitude, longitude }
}

const COORDINATE_EPSILON = 0.00005
const THEME_OPTIONS = ['light', 'dark', 'system']

const areCoordinatesClose = (a, b) => {
  if (!a || !b) return false

  return (
    Math.abs(a.latitude - b.latitude) <= COORDINATE_EPSILON &&
    Math.abs(a.longitude - b.longitude) <= COORDINATE_EPSILON
  )
}

export default function Account() {
  const { user, logoutUser, convertGuestToUser, updateUserProfile } = useUserBear(state=>state);
  const { volunteer, logoutVolunteer, updateVolunteerLocation, updateVolunteerProfile } = useVolunteerBear(state=>state);
  const { themePreference, setThemePreference } = useThemeBear(state=>state);
  const { height: windowHeight } = useWindowDimensions()
  const systemColorScheme = useColorScheme()

  const resolvedTheme = themePreference === 'system'
    ? (systemColorScheme === 'dark' ? 'dark' : 'light')
    : themePreference
  const isDarkMode = resolvedTheme === 'dark'

  const pageBackgroundColor = isDarkMode ? '#0b1220' : '#f8fafc'
  const topAccentColor = isDarkMode ? '#f87171' : '#dc2626'
  const accentBubbleColor = isDarkMode ? '#1f2937' : '#fee2e2'
  const headerCardStyle = {
    backgroundColor: isDarkMode ? '#111827' : '#ffffff',
    borderColor: isDarkMode ? '#1f2937' : '#e5e7eb',
  }
  const headerTitleColor = isDarkMode ? '#f9fafb' : '#111827'
  const headerSubtitleColor = isDarkMode ? '#9ca3af' : '#6b7280'
  const sectionCardStyle = {
    backgroundColor: isDarkMode ? '#111827' : '#ffffff',
    borderColor: isDarkMode ? '#263244' : '#e5e7eb',
  }
  const surfaceTextColor = isDarkMode ? '#d1d5db' : '#374151'
  const softTextColor = isDarkMode ? '#94a3b8' : '#6b7280'
  const labelTextColor = isDarkMode ? '#94a3b8' : '#9ca3af'
  const inputBorderColor = isDarkMode ? '#334155' : '#e5e7eb'
  const inputBackgroundColor = isDarkMode ? '#0f172a' : '#ffffff'
  const inputTextColor = isDarkMode ? '#f8fafc' : '#111827'
  const inputPlaceholderColor = isDarkMode ? '#64748b' : '#d1d5db'
  const fullscreenMapHeight = Math.max(360, windowHeight - 220)
  const secondaryButtonStyle = {
    borderColor: isDarkMode ? '#334155' : '#d1d5db',
    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
  }

  const [editingLocation, setEditingLocation] = useState(false)
  const [selectedCoordinates, setSelectedCoordinates] = useState(null)
  const [mapRegion, setMapRegion] = useState(DEFAULT_REGION)
  const selectedCoordinatesRef = useRef(null)
  const [mapLoader, setMapLoader] = useState(false)
  const [savingLocation, setSavingLocation] = useState(false)
  const [refreshingCurrentLocation, setRefreshingCurrentLocation] = useState(false)
  const [isMapInteracting, setIsMapInteracting] = useState(false)
  const [isFullscreenMapVisible, setIsFullscreenMapVisible] = useState(false)
  const [volunteerFullnameInput, setVolunteerFullnameInput] = useState('')
  const [volunteerPhoneInput, setVolunteerPhoneInput] = useState('')
  const [savingVolunteerProfile, setSavingVolunteerProfile] = useState(false)
  const [fullnameInput, setFullnameInput] = useState('')
  const [phoneInput, setPhoneInput] = useState('')
  const [guestEmailInput, setGuestEmailInput] = useState('')
  const [guestPasswordInput, setGuestPasswordInput] = useState('')
  const [guestConfirmPasswordInput, setGuestConfirmPasswordInput] = useState('')
  const [savingUserProfile, setSavingUserProfile] = useState(false)
  const [convertingGuestAccount, setConvertingGuestAccount] = useState(false)

  const volunteerLongitude = volunteer?.location?.coordinates?.[0]
  const volunteerLatitude = volunteer?.location?.coordinates?.[1]

  const savedVolunteerCoordinates = getVolunteerLatLng(volunteer)
  const previewCoordinates = editingLocation
    ? (selectedCoordinates || savedVolunteerCoordinates)
    : savedVolunteerCoordinates

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

    const nextCoordinates = { latitude, longitude }
    selectedCoordinatesRef.current = nextCoordinates
    setSelectedCoordinates(nextCoordinates)
  }, [])

  const initializeFromVolunteerLocation = useCallback(() => {
    if (!Number.isFinite(volunteerLatitude) || !Number.isFinite(volunteerLongitude)) return false

    setMapPin(volunteerLatitude, volunteerLongitude, false)
    return true
  }, [setMapPin, volunteerLatitude, volunteerLongitude])

  const fetchCurrentLocationPin = useCallback(async () => {
    try {
      setRefreshingCurrentLocation(true)
      const { status } = await Location.requestForegroundPermissionsAsync()

      if (status !== 'granted') {
        Alert.alert('Permission required', 'Location permission is required to update your location.')
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
    if (!volunteer?._id) {
      setEditingLocation(false)
      setIsMapInteracting(false)
      setIsFullscreenMapVisible(false)
      return
    }

    setVolunteerFullnameInput(volunteer?.fullname || '')
    setVolunteerPhoneInput(volunteer?.phone ? String(volunteer.phone) : '')

    const hasVolunteerCoordinates = initializeFromVolunteerLocation()
    if (!hasVolunteerCoordinates) {
      fetchCurrentLocationPin().catch(() => {
        setMapLoader(false)
      })
    }
  }, [volunteer?._id, volunteer?.fullname, volunteer?.phone, volunteerLatitude, volunteerLongitude, initializeFromVolunteerLocation, fetchCurrentLocationPin])

  const openLocationEditor = async () => {
    setIsMapInteracting(false)
    setIsFullscreenMapVisible(false)
    setEditingLocation(true)

    const hasVolunteerCoordinates = Number.isFinite(volunteerLatitude) && Number.isFinite(volunteerLongitude)

    if (!hasVolunteerCoordinates) {
      setMapLoader(true)
      await fetchCurrentLocationPin()
      return
    }

    setMapPin(volunteerLatitude, volunteerLongitude, false)
  }

  const saveVolunteerLocation = async () => {
    const latestSelectedCoordinates = selectedCoordinatesRef.current || selectedCoordinates

    if (!Number.isFinite(latestSelectedCoordinates?.latitude) || !Number.isFinite(latestSelectedCoordinates?.longitude)) {
      Alert.alert('Location required', 'Please pin your location on map first.')
      return
    }

    const targetCoordinates = {
      latitude: latestSelectedCoordinates.latitude,
      longitude: latestSelectedCoordinates.longitude,
    }

    try {
      setSavingLocation(true); 
      const response = await updateVolunteerLocation({
        latitude: targetCoordinates.latitude,
        longitude: targetCoordinates.longitude,
      })

      const persistedCoordinates = getVolunteerLatLng(response?.volunteer)

      if (!response?.success || !persistedCoordinates) {
        throw new Error(response?.message || 'Unable to update location')
      }

      if (!areCoordinatesClose(targetCoordinates, persistedCoordinates)) {
        setMapPin(persistedCoordinates.latitude, persistedCoordinates.longitude, false)
        Alert.alert('Location not saved', 'Selected pin could not be saved. Please try again.')
        return
      }

      setMapPin(persistedCoordinates.latitude, persistedCoordinates.longitude, false)
      Alert.alert('Success', 'Your volunteer location has been updated.')
      setIsMapInteracting(false)
      setIsFullscreenMapVisible(false)
      setEditingLocation(false)
    } catch (error) {
      Alert.alert('Error', error?.message || 'Unable to update location')
    } finally {
      setSavingLocation(false)
    }
  }

  const saveVolunteerProfileHandler = async () => {
    if (!volunteerFullnameInput.trim() || !volunteerPhoneInput.trim()) {
      Alert.alert('Missing fields', 'Full name and phone are required.')
      return
    }

    try {
      setSavingVolunteerProfile(true)
      const response = await updateVolunteerProfile({
        fullname: volunteerFullnameInput.trim(),
        phone: volunteerPhoneInput.trim(),
      })

      if (response?.success) {
        Alert.alert('Success', 'Volunteer profile updated successfully.')
      }
    } catch (error) {
      Alert.alert('Error', error?.message || 'Unable to update volunteer profile')
    } finally {
      setSavingVolunteerProfile(false)
    }
  }

  useEffect(() => {
    if (!user?._id) return

    setFullnameInput(user?.fullname || '')
    setPhoneInput(user?.phone ? String(user.phone) : '')
    setGuestEmailInput(user?.email || '')
  }, [user?._id, user?.fullname, user?.phone, user?.email])

  const saveUserProfileHandler = async () => {
    if (user?.as_guest) {
      Alert.alert('Complete Login First', 'Guest account ko pehle fully complete karo.')
      return
    }

    if (!fullnameInput.trim() || !phoneInput.trim()) {
      Alert.alert('Missing fields', 'Full name and phone are required.')
      return
    }

    try {
      setSavingUserProfile(true)
      const response = await updateUserProfile({
        fullname: fullnameInput.trim(),
        phone: phoneInput.trim(),
      })

      if (response?.success) {
        Alert.alert('Success', 'Profile updated successfully.')
      }
    } catch (error) {
      Alert.alert('Error', error?.message || 'Unable to update profile')
    } finally {
      setSavingUserProfile(false)
    }
  }

  const convertGuestAccountHandler = async () => {
    if (!fullnameInput.trim() || !phoneInput.trim() || !guestEmailInput.trim() || !guestPasswordInput.trim()) {
      Alert.alert('Missing fields', 'Please fill all fields to complete your account.')
      return
    }

    if (guestPasswordInput !== guestConfirmPasswordInput) {
      Alert.alert('Error', 'Passwords do not match')
      return
    }

    try {
      setConvertingGuestAccount(true)
      const response = await convertGuestToUser({
        fullname: fullnameInput.trim(),
        phone: phoneInput.trim(),
        email: guestEmailInput.trim(),
        password: guestPasswordInput,
      })

      if (response?.success) {
        setGuestPasswordInput('')
        setGuestConfirmPasswordInput('')
        Alert.alert('Success', 'Guest account converted to normal account successfully.')
      }
    } catch (error) {
      Alert.alert('Error', error?.message || 'Unable to complete account')
    } finally {
      setConvertingGuestAccount(false)
    }
  }

  const resolvedThemeLabel = resolvedTheme === 'dark' ? 'Dark' : 'Light'

  const themeSelectorCard = (
    <View
      className='mb-4 border rounded-2xl p-4'
      style={sectionCardStyle}
    >
      <Text style={{ color: headerTitleColor, fontSize: 15, fontWeight: '900', letterSpacing: 0.2 }}>
        Appearance
      </Text>
      <Text style={{ color: headerSubtitleColor, fontSize: 12, marginTop: 4 }}>
        Current theme: {resolvedThemeLabel}
      </Text>

      <View className='flex-row gap-2 mt-3'>
        {THEME_OPTIONS.map((mode) => {
          const isSelected = themePreference === mode
          const label = mode.charAt(0).toUpperCase() + mode.slice(1)

          return (
            <TouchableOpacity
              key={`theme-option-${mode}`}
              className='flex-1 rounded-xl py-2.5 items-center border'
              activeOpacity={0.85}
              style={{
                borderColor: isSelected
                  ? (isDarkMode ? '#f87171' : '#dc2626')
                  : (isDarkMode ? '#374151' : '#d1d5db'),
                backgroundColor: isSelected
                  ? (isDarkMode ? 'rgba(248, 113, 113, 0.2)' : '#fee2e2')
                  : (isDarkMode ? '#0f172a' : '#ffffff'),
              }}
              onPress={() => setThemePreference(mode)}
            >
              <Text
                style={{
                  color: isSelected
                    ? (isDarkMode ? '#fecaca' : '#b91c1c')
                    : (isDarkMode ? '#d1d5db' : '#4b5563'),
                  fontSize: 12,
                  fontWeight: '800',
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )

  if (volunteer?._id) {
    return (
      <View className='flex-1' style={{ backgroundColor: pageBackgroundColor }}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={pageBackgroundColor} />
        <View className='absolute top-0 left-0 right-0 h-1 z-10' style={{ backgroundColor: topAccentColor }} />
        <View style={{ position: 'absolute', top: -36, right: -20, width: 160, height: 160, borderRadius: 999, backgroundColor: accentBubbleColor }} />

        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 52 }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isMapInteracting}
        >
          <View className='mb-6 border rounded-2xl p-5' style={headerCardStyle}>
            <Text className='text-3xl font-black tracking-tight' style={{ color: headerTitleColor }}>Volunteer Account</Text>
            <Text className='text-xs mt-2 font-medium tracking-widest uppercase' style={{ color: headerSubtitleColor }}>Manage your profile and location</Text>
          </View>

          {themeSelectorCard}

          <View className='border rounded-2xl p-4 mb-4' style={sectionCardStyle}>
            <Text className='text-sm' style={{ color: surfaceTextColor }}>Full Name: {volunteer?.fullname || 'N/A'}</Text>
            <Text className='text-sm' style={{ color: surfaceTextColor }}>Email: {volunteer?.email || 'N/A'}</Text>
            <Text className='text-sm mt-1' style={{ color: surfaceTextColor }}>Phone: {volunteer?.phone || 'N/A'}</Text>
            <Text className='text-sm mt-1' style={{ color: surfaceTextColor }}>Mode: {volunteer?.mode || 'N/A'}</Text>
            <View
              className='self-start mt-3 border rounded-full px-3 py-1.5'
              style={{
                borderColor: volunteer?.isverified
                  ? (isDarkMode ? 'rgba(34, 197, 94, 0.45)' : '#86efac')
                  : (isDarkMode ? 'rgba(251, 191, 36, 0.45)' : '#fcd34d'),
                backgroundColor: volunteer?.isverified
                  ? (isDarkMode ? 'rgba(34, 197, 94, 0.18)' : '#dcfce7')
                  : (isDarkMode ? 'rgba(251, 191, 36, 0.18)' : '#fef3c7'),
              }}
            >
              <Text
                className='text-[11px] font-black tracking-widest uppercase'
                style={{ color: volunteer?.isverified ? (isDarkMode ? '#86efac' : '#15803d') : (isDarkMode ? '#fcd34d' : '#a16207') }}
              >
                {volunteer?.isverified ? 'Verified' : 'Pending Verification'}
              </Text>
            </View>
            {
              savedVolunteerCoordinates ? (
                <Text className='text-xs mt-2' style={{ color: softTextColor }}>
                  Saved Pin: {savedVolunteerCoordinates.latitude.toFixed(6)}, {savedVolunteerCoordinates.longitude.toFixed(6)}
                </Text>
              ) : null
            }
          </View>

          <View className='border rounded-2xl p-4 mb-4' style={sectionCardStyle}>
            <Text className='text-xs font-bold tracking-widest uppercase mb-2' style={{ color: labelTextColor }}>Full Name</Text>
            <TextInput
              value={volunteerFullnameInput}
              onChangeText={setVolunteerFullnameInput}
              placeholder='Enter your full name'
              placeholderTextColor={inputPlaceholderColor}
              className='border-b-2 py-3 text-base font-medium'
              style={{ borderColor: inputBorderColor, color: inputTextColor, backgroundColor: inputBackgroundColor }}
            />

            <Text className='text-xs font-bold tracking-widest uppercase mt-5 mb-2' style={{ color: labelTextColor }}>Phone Number</Text>
            <TextInput
              value={volunteerPhoneInput}
              onChangeText={setVolunteerPhoneInput}
              placeholder='+91 00000 00000'
              placeholderTextColor={inputPlaceholderColor}
              keyboardType='phone-pad'
              className='border-b-2 py-3 text-base font-medium'
              style={{ borderColor: inputBorderColor, color: inputTextColor, backgroundColor: inputBackgroundColor }}
            />

            <TouchableOpacity
              className='bg-red-600 rounded-xl py-3 items-center mt-4'
              activeOpacity={0.85}
              disabled={savingVolunteerProfile}
              onPress={saveVolunteerProfileHandler}
            >
              <Text className='text-white font-black text-xs tracking-widest uppercase'>
                {savingVolunteerProfile ? 'Saving...' : 'Save Profile'}
              </Text>
            </TouchableOpacity>
          </View>

          {
            !editingLocation ? (
              <>
                <View className='border rounded-2xl p-3 mb-4' style={sectionCardStyle}>
                  <Text className='text-xs mb-2' style={{ color: softTextColor }}>Current availability location preview (500m area)</Text>

                  {
                    savedVolunteerCoordinates ? (
                      <View className='overflow-hidden rounded-xl'>
                        <OpenStreetMapView
                          height={200}
                          center={previewCoordinates || mapRegion}
                          coordinate={savedVolunteerCoordinates}
                          radiusMeters={500}
                          interactive={false}
                        />
                      </View>
                    ) : (
                      <View className='border rounded-xl py-8 items-center' style={{ borderColor: inputBorderColor, backgroundColor: inputBackgroundColor }}>
                        <Text className='text-xs' style={{ color: softTextColor }}>Location pin not available yet.</Text>
                      </View>
                    )
                  }
                </View>

                <TouchableOpacity
                  className='border rounded-xl py-4 items-center mb-4'
                  style={{ borderColor: topAccentColor, backgroundColor: isDarkMode ? '#0f172a' : '#ffffff' }}
                  activeOpacity={0.85}
                  onPress={openLocationEditor}
                >
                  <Text className='font-black text-xs tracking-widest uppercase' style={{ color: topAccentColor }}>Edit Availability Location</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View className='border rounded-2xl p-3 mb-4' style={sectionCardStyle}>
                <Text className='text-xs mb-2' style={{ color: softTextColor }}>Drag pin or tap map to set your location. Blue circle is your 500m service area.</Text>

                {
                  mapLoader ? (
                    <View className='py-8 items-center'>
                      <EmergencyLoader size='small' label='Loading location editor' />
                    </View>
                  ) : (
                    <View className='overflow-hidden rounded-xl'>
                      <OpenStreetMapView
                        height={260}
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
                  style={secondaryButtonStyle}
                  activeOpacity={0.85}
                  disabled={refreshingCurrentLocation}
                  onPress={fetchCurrentLocationPin}
                >
                  <Text className='font-black text-xs tracking-widest uppercase' style={{ color: inputTextColor }}>
                    {refreshingCurrentLocation ? 'Fetching Location...' : 'Use Current Location'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className='mt-3 border rounded-xl py-3 items-center'
                  style={secondaryButtonStyle}
                  activeOpacity={0.85}
                  onPress={() => {
                    setIsMapInteracting(false)
                    setIsFullscreenMapVisible(true)
                  }}
                >
                  <Text className='font-black text-xs tracking-widest uppercase' style={{ color: inputTextColor }}>
                    Open Fullscreen Map
                  </Text>
                </TouchableOpacity>

                {
                  selectedCoordinates ? (
                    <Text className='text-xs mt-2' style={{ color: softTextColor }}>
                      Selected Pin: {selectedCoordinates.latitude.toFixed(6)}, {selectedCoordinates.longitude.toFixed(6)}
                    </Text>
                  ) : null
                }

                <View className='flex-row gap-3 mt-3'>
                  <TouchableOpacity
                    className='flex-1 border rounded-xl py-3 items-center'
                    style={secondaryButtonStyle}
                    activeOpacity={0.85}
                    onPress={() => {
                      if (savedVolunteerCoordinates) {
                        setMapPin(savedVolunteerCoordinates.latitude, savedVolunteerCoordinates.longitude, false)
                      }
                      setIsMapInteracting(false)
                      setIsFullscreenMapVisible(false)
                      setEditingLocation(false)
                    }}
                  >
                    <Text className='font-black text-xs tracking-widest uppercase' style={{ color: surfaceTextColor }}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className='flex-1 bg-red-600 rounded-xl py-3 items-center'
                    activeOpacity={0.85}
                    disabled={savingLocation}
                    onPress={saveVolunteerLocation}
                  >
                    <Text className='text-white font-black text-xs tracking-widest uppercase'>
                      {savingLocation ? 'Saving...' : 'Save Location'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          }

          <TouchableOpacity
            className='border rounded-xl py-4 items-center mt-2'
            style={{ borderColor: topAccentColor, backgroundColor: isDarkMode ? '#0f172a' : '#ffffff' }}
            activeOpacity={0.85}
            onPress={logoutVolunteer}
          >
            <Text className='font-black text-xs tracking-widest uppercase' style={{ color: topAccentColor }}>Volunteer Logout</Text>
          </TouchableOpacity>
        </ScrollView>

        <Modal
          visible={isFullscreenMapVisible}
          animationType='slide'
          transparent={false}
          onRequestClose={() => {
            setIsMapInteracting(false)
            setIsFullscreenMapVisible(false)
          }}
        >
          <View className='flex-1' style={{ backgroundColor: pageBackgroundColor }}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={pageBackgroundColor} />

            <View className='flex-row items-center justify-between px-4 pt-12 pb-4'>
              <Text className='text-sm font-black tracking-widest uppercase' style={{ color: headerTitleColor }}>
                Fullscreen Map Editor
              </Text>

              <TouchableOpacity
                className='border rounded-lg px-3 py-2'
                style={secondaryButtonStyle}
                activeOpacity={0.85}
                onPress={() => {
                  setIsMapInteracting(false)
                  setIsFullscreenMapVisible(false)
                }}
              >
                <Text className='text-xs font-black tracking-widest uppercase' style={{ color: inputTextColor }}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>

            <View className='px-4'>
              <View className='border rounded-2xl overflow-hidden' style={{ borderColor: inputBorderColor }}>
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
                style={secondaryButtonStyle}
                activeOpacity={0.85}
                disabled={refreshingCurrentLocation}
                onPress={fetchCurrentLocationPin}
              >
                <Text className='font-black text-xs tracking-widest uppercase' style={{ color: inputTextColor }}>
                  {refreshingCurrentLocation ? 'Fetching Location...' : 'Use Current Location'}
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

        <View className='absolute bottom-0 left-0 right-0 h-1' style={{ backgroundColor: topAccentColor }} />
      </View>
    )
  }

  return (
    <View className='flex-1' style={{ backgroundColor: pageBackgroundColor }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={pageBackgroundColor} />
      <View className='absolute top-0 left-0 right-0 h-1 z-10' style={{ backgroundColor: topAccentColor }} />
      <View style={{ position: 'absolute', top: -36, right: -20, width: 160, height: 160, borderRadius: 999, backgroundColor: accentBubbleColor }} />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 52 }}
        showsVerticalScrollIndicator={false}
      >
        <View className='mb-6 border rounded-2xl p-5' style={headerCardStyle}>
          <Text className='text-3xl font-black tracking-tight' style={{ color: headerTitleColor }}>Account</Text>
          <Text className='text-xs mt-2 font-medium tracking-widest uppercase' style={{ color: headerSubtitleColor }}>Manage your profile</Text>
        </View>

        {themeSelectorCard}

        {
          user?.as_guest ? (
            <View
              className='border rounded-2xl p-4 mb-4'
              style={{
                borderColor: isDarkMode ? 'rgba(248, 113, 113, 0.35)' : '#fecaca',
                backgroundColor: isDarkMode ? 'rgba(248, 113, 113, 0.12)' : '#fef2f2',
              }}
            >
              <Text className='text-sm font-semibold' style={{ color: isDarkMode ? '#fca5a5' : '#b91c1c' }}>You are logged in as guest.</Text>
              <Text className='text-xs mt-1' style={{ color: softTextColor }}>Please complete account details for full login.</Text>
            </View>
          ) : null
        }

        <View className='border rounded-2xl p-4 mb-4' style={sectionCardStyle}>
          <Text className='text-xs font-bold tracking-widest uppercase mb-2' style={{ color: labelTextColor }}>Full Name</Text>
          <TextInput
            value={fullnameInput}
            onChangeText={setFullnameInput}
            placeholder='Enter your full name'
            placeholderTextColor={inputPlaceholderColor}
            className='border-b-2 py-3 text-base font-medium'
            style={{ borderColor: inputBorderColor, color: inputTextColor, backgroundColor: inputBackgroundColor }}
          />

          <Text className='text-xs font-bold tracking-widest uppercase mt-5 mb-2' style={{ color: labelTextColor }}>Phone Number</Text>
          <TextInput
            value={phoneInput}
            onChangeText={setPhoneInput}
            placeholder='+91 00000 00000'
            placeholderTextColor={inputPlaceholderColor}
            keyboardType='phone-pad'
            className='border-b-2 py-3 text-base font-medium'
            style={{ borderColor: inputBorderColor, color: inputTextColor, backgroundColor: inputBackgroundColor }}
          />

          {
            user?.as_guest ? (
              <>
                <Text className='text-xs font-bold tracking-widest uppercase mt-5 mb-2' style={{ color: labelTextColor }}>Email</Text>
                <TextInput
                  value={guestEmailInput}
                  onChangeText={setGuestEmailInput}
                  placeholder='you@example.com'
                  placeholderTextColor={inputPlaceholderColor}
                  keyboardType='email-address'
                  autoCapitalize='none'
                  className='border-b-2 py-3 text-base font-medium'
                  style={{ borderColor: inputBorderColor, color: inputTextColor, backgroundColor: inputBackgroundColor }}
                />

                <Text className='text-xs font-bold tracking-widest uppercase mt-5 mb-2' style={{ color: labelTextColor }}>Password</Text>
                <TextInput
                  value={guestPasswordInput}
                  onChangeText={setGuestPasswordInput}
                  placeholder='••••••••'
                  placeholderTextColor={inputPlaceholderColor}
                  secureTextEntry
                  className='border-b-2 py-3 text-base font-medium'
                  style={{ borderColor: inputBorderColor, color: inputTextColor, backgroundColor: inputBackgroundColor }}
                />

                <Text className='text-xs font-bold tracking-widest uppercase mt-5 mb-2' style={{ color: labelTextColor }}>Confirm Password</Text>
                <TextInput
                  value={guestConfirmPasswordInput}
                  onChangeText={setGuestConfirmPasswordInput}
                  placeholder='••••••••'
                  placeholderTextColor={inputPlaceholderColor}
                  secureTextEntry
                  className='border-b-2 py-3 text-base font-medium'
                  style={{ borderColor: inputBorderColor, color: inputTextColor, backgroundColor: inputBackgroundColor }}
                />
              </>
            ) : (
              <Text className='text-xs mt-5' style={{ color: softTextColor }}>Email: {user?.email || 'N/A'}</Text>
            )
          }
        </View>

        {
          user?.as_guest ? (
            <TouchableOpacity
              className='bg-red-600 rounded-xl py-4 items-center mb-4'
              activeOpacity={0.85}
              disabled={convertingGuestAccount}
              onPress={convertGuestAccountHandler}
            >
              <Text className='text-white font-black text-xs tracking-widest uppercase'>
                {convertingGuestAccount ? 'Completing...' : 'Complete Full Login'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className='bg-red-600 rounded-xl py-4 items-center mb-4'
              activeOpacity={0.85}
              disabled={savingUserProfile}
              onPress={saveUserProfileHandler}
            >
              <Text className='text-white font-black text-xs tracking-widest uppercase'>
                {savingUserProfile ? 'Saving...' : 'Save Profile'}
              </Text>
            </TouchableOpacity>
          )
        }

        {
          !user?.as_guest ? (
            <TouchableOpacity
              className='border rounded-xl py-4 items-center'
              style={{ borderColor: topAccentColor, backgroundColor: isDarkMode ? '#0f172a' : '#ffffff' }}
              activeOpacity={0.85}
              onPress={logoutUser}
            >
              <Text className='font-black text-xs tracking-widest uppercase' style={{ color: topAccentColor }}>Logout</Text>
            </TouchableOpacity>
          ) : null
        }
      </ScrollView>

      <View className='absolute bottom-0 left-0 right-0 h-1' style={{ backgroundColor: topAccentColor }} />
    </View>
  )
}